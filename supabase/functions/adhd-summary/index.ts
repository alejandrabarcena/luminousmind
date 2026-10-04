import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/run-id.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM = `Eres un asistente de bienestar en español. Recibes respuestas de un autoregistro diario sobre atención, organización, energía, emociones, sueño, medicación y autopercepción (escala 1 a 5, donde 1 = nada/muy poco y 5 = mucho).
NO diagnosticas, NO recomiendas cambiar medicación ni dosis, y NO sustituyes a un profesional. Usa un tono cálido y respetuoso.
Responde en Markdown con exactamente estas secciones:
## Resumen orientativo
(3-5 frases sobre lo observado hoy)
## Patrones que destacan
(3-6 viñetas; si hay historial, menciona tendencias)
## Preguntas para conversar con tu profesional
(5-7 preguntas concretas en primera persona)
## Recordatorio
(una frase: esto no es un diagnóstico; ante malestar intenso busca ayuda profesional)
Máximo 400 palabras.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: "Inicia sesión para continuar" }, 401);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "La IA no está configurada" }, 500);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida" }, 400);
  }
  const { answers, medication, notes, history } = body ?? {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return json({ error: "Responde al menos una pregunta" }, 400);
  }

  const prompt = [
    "Respuestas de hoy:",
    ...answers.slice(0, 60).map((a: any) => `- [${String(a.category)}] ${String(a.question)}: ${Number(a.value)}`),
    medication ? `Medicación registrada: ${JSON.stringify(medication).slice(0, 500)}` : "",
    notes ? `Notas de la persona: ${String(notes).slice(0, 1500)}` : "",
    Array.isArray(history) && history.length
      ? `Historial (promedios diarios por categoría): ${JSON.stringify(history.slice(0, 14)).slice(0, 3000)}`
      : "",
  ].filter(Boolean).join("\n");

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    let streamError: unknown = null;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: SYSTEM,
      prompt,
      abortSignal: req.signal,
      onError: ({ error }) => {
        streamError = error;
      },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = await result.text;
    if (streamError) throw streamError;
    if (!text.trim()) return json({ error: "No se pudo generar el resumen" }, 502);
    const runId = runIdFetch.getRunId();
    return new Response(JSON.stringify({ summary: text }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...(runId ? { "X-Lovable-AIG-Run-ID": runId } : {}),
      },
    });
  } catch (e: any) {
    if (e?.name === "AbortError") return json({ error: "Cancelado" }, 499);
    const status = Number(e?.statusCode ?? e?.status ?? 500);
    console.error("adhd-summary error", status, e?.message);
    if (status === 429) return json({ error: "Demasiadas solicitudes, intenta en un momento." }, 429);
    if (status === 402) return json({ error: "Se agotaron los créditos de IA. Agrega créditos en Settings → Plans & credits." }, 402);
    if (status === 403) return json({ error: "El uso de IA está bloqueado para este espacio de trabajo." }, 403);
    return json({ error: "No se pudo generar el resumen" }, status >= 400 && status < 600 ? status : 500);
  }
});
