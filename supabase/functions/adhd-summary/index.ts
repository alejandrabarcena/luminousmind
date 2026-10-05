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
Devuelve un objeto JSON con:
- resumen: 3-5 frases sobre lo observado hoy.
- patrones: 3-6 viñetas; si hay historial, menciona tendencias concretas.
- preguntas: 5-7 elementos para conversar con un profesional. Cada uno con:
  - pregunta: pregunta concreta en primera persona.
  - contexto: 1 frase explicando por qué conviene plantearla, basada en las respuestas.
  - respuesta_sugerida: cómo podría la persona describir su situación al profesional (2-3 frases en primera persona, redactadas a partir de SUS respuestas reales, con valores concretos cuando ayuden).
- recordatorio: una frase aclarando que esto no es un diagnóstico y que ante malestar intenso busque ayuda profesional.
Sé específico: nada de frases genéricas; cada pregunta debe referirse a patrones reales de los datos.
Responde SOLO con el objeto JSON válido, sin Markdown, sin bloques de código, sin texto antes ni después.`;

const summarySchema = jsonSchema({
  type: "object",
  additionalProperties: false,
  required: ["resumen", "patrones", "preguntas", "recordatorio"],
  properties: {
    resumen: { type: "string" },
    patrones: { type: "array", items: { type: "string" } },
    preguntas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pregunta", "contexto", "respuesta_sugerida"],
        properties: {
          pregunta: { type: "string" },
          contexto: { type: "string" },
          respuesta_sugerida: { type: "string" },
        },
      },
    },
    recordatorio: { type: "string" },
  },
});

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
      experimental_output: Output.object({ schema: summarySchema }),
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
    const output = await result.experimental_output;
    if (streamError) throw streamError;
    if (!output || !output.resumen) return json({ error: "No se pudo generar el resumen" }, 502);
    const runId = runIdFetch.getRunId();
    return new Response(JSON.stringify({ summary: output }), {
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
