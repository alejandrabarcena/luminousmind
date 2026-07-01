import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';
import logoImage from '@/assets/logo.png';

type Q = { id: number; category: string; icon: string; text: string };

const QUESTIONS: Q[] = [
  { id: 1, category: 'Atención y Foco', icon: '🧠', text: '¿Pude concentrarme en tareas básicas hoy?' },
  { id: 2, category: 'Atención y Foco', icon: '🧠', text: '¿Me distraje fácilmente incluso en cosas que me interesan?' },
  { id: 3, category: 'Atención y Foco', icon: '🧠', text: "¿Sentí 'niebla mental' o saturación cognitiva?" },
  { id: 4, category: 'Atención y Foco', icon: '🧠', text: '¿Me costó empezar tareas aunque sabía qué hacer?' },
  { id: 5, category: 'Atención y Foco', icon: '🧠', text: '¿Me costó terminar lo que empecé?' },
  { id: 6, category: 'Organización y Tiempo', icon: '⏱️', text: '¿Perdí la noción del tiempo con facilidad?' },
  { id: 7, category: 'Organización y Tiempo', icon: '⏱️', text: '¿Llegué tarde o evité compromisos por desorganización?' },
  { id: 8, category: 'Organización y Tiempo', icon: '⏱️', text: '¿Pude priorizar lo importante vs. lo urgente?' },
  { id: 9, category: 'Organización y Tiempo', icon: '⏱️', text: '¿Me sentí abrumada al ver muchas tareas juntas?' },
  { id: 10, category: 'Energía y Activación', icon: '⚡', text: '¿Cómo estuvo mi nivel de energía hoy?' },
  { id: 11, category: 'Energía y Activación', icon: '⚡', text: '¿Hubo picos de hiperfoco?' },
  { id: 12, category: 'Energía y Activación', icon: '⚡', text: '¿Pasé de hiperactividad mental a agotamiento?' },
  { id: 13, category: 'Energía y Activación', icon: '⚡', text: '¿Sentí inquietud física o mental constante?' },
  { id: 14, category: 'Regulación Emocional', icon: '🌊', text: '¿Mis emociones se sintieron intensas o difíciles de regular?' },
  { id: 15, category: 'Regulación Emocional', icon: '🌊', text: '¿Me frustré fácilmente?' },
  { id: 16, category: 'Regulación Emocional', icon: '🌊', text: '¿Sentí culpa o autocrítica excesiva?' },
  { id: 17, category: 'Regulación Emocional', icon: '🌊', text: '¿Tuve momentos de ansiedad sin causa clara?' },
  { id: 18, category: 'Sueño y Cuerpo', icon: '😴', text: '¿Dormí bien?' },
  { id: 19, category: 'Sueño y Cuerpo', icon: '😴', text: '¿Me costó conciliar el sueño por pensamientos acelerados?' },
  { id: 20, category: 'Sueño y Cuerpo', icon: '😴', text: '¿Me desperté cansada?' },
  { id: 21, category: 'Sueño y Cuerpo', icon: '😴', text: '¿Comí de forma más o menos regular?' },
  { id: 22, category: 'Medicación', icon: '💊', text: '¿Tomé la medicación como estaba indicada?' },
  { id: 23, category: 'Medicación', icon: '💊', text: '¿Noté efectos positivos?' },
  { id: 24, category: 'Medicación', icon: '💊', text: '¿Efectos secundarios? (ansiedad, insomnio, bajón, etc.)' },
  { id: 25, category: 'Medicación', icon: '💊', text: '¿La dosis se sintió adecuada hoy?' },
  { id: 26, category: 'Autopercepción', icon: '🌱', text: '¿Hoy me sentí funcional?' },
  { id: 27, category: 'Autopercepción', icon: '🌱', text: '¿Logré algo importante hoy?' },
  { id: 28, category: 'Autopercepción', icon: '🌱', text: '¿Hubo algo que me costó mucho?' },
  { id: 29, category: 'Autopercepción', icon: '🌱', text: '¿Me traté con amabilidad?' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Atención y Foco': '#00BCD4',
  'Organización y Tiempo': '#8BC34A',
  'Energía y Activación': '#FF5722',
  'Regulación Emocional': '#9C27B0',
  'Sueño y Cuerpo': '#3F51B5',
  'Medicación': '#E91E63',
  'Autopercepción': '#FFEB3B',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const db = supabase as any;

const Assessment = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [medMorning, setMedMorning] = useState('');
  const [medAfternoon, setMedAfternoon] = useState('');
  const [medNight, setMedNight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: today } = await db
      .from('adhd_assessments')
      .select('*')
      .eq('user_id', user.id)
      .eq('assessment_date', todayISO())
      .maybeSingle();
    if (today) {
      setAnswers(today.answers || {});
      setMedMorning(today.medication_morning || '');
      setMedAfternoon(today.medication_afternoon || '');
      setMedNight(today.medication_night || '');
      setNotes(today.notes || '');
    }
    const { data: hist } = await db
      .from('adhd_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('assessment_date', { ascending: false })
      .limit(30);
    setHistory(hist || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAnswer = (id: number, value: number) => {
    setAnswers((p) => ({ ...p, [id]: value }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      assessment_date: todayISO(),
      answers,
      medication_morning: medMorning,
      medication_afternoon: medAfternoon,
      medication_night: medNight,
      notes,
    };
    const { error } = await db
      .from('adhd_assessments')
      .upsert(payload, { onConflict: 'user_id,assessment_date' });
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
      console.error(error);
    } else {
      toast.success('Cuestionario guardado');
      loadData();
    }
  };

  // Chart data — averages per category for TODAY's answers
  const categoryAverages = useMemo(() => {
    const byCat: Record<string, { sum: number; n: number }> = {};
    QUESTIONS.forEach((q) => {
      const v = answers[q.id];
      if (typeof v === 'number') {
        if (!byCat[q.category]) byCat[q.category] = { sum: 0, n: 0 };
        byCat[q.category].sum += v;
        byCat[q.category].n += 1;
      }
    });
    return Object.entries(byCat).map(([category, { sum, n }]) => ({
      category,
      promedio: +(sum / n).toFixed(2),
      color: CATEGORY_COLORS[category],
    }));
  }, [answers]);

  // Historic trend — overall daily average
  const trendData = useMemo(() => {
    return [...history]
      .reverse()
      .map((h) => {
        const vals = Object.values(h.answers || {}) as number[];
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { date: h.assessment_date.slice(5), promedio: +avg.toFixed(2) };
      });
  }, [history]);

  const grouped = useMemo(() => {
    const map: Record<string, Q[]> = {};
    QUESTIONS.forEach((q) => {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push(q);
    });
    return map;
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }
  if (!user) return null;

  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-page">
      <nav className="px-6 py-4 bg-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex items-center space-x-2">
              <img src={logoImage} alt="Luminous Mind" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold font-poppins bg-gradient-primary bg-clip-text text-transparent">
                Luminous Mind
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-poppins">Evaluación TDA/TDAH</h1>
            <p className="text-muted-foreground font-raleway">
              Responde según tu experiencia de HOY o las últimas 24h · Escala 1 a 5
            </p>
          </div>
        </div>

        <Tabs defaultValue="form" className="space-y-6">
          <TabsList className="bg-white shadow-md">
            <TabsTrigger value="form">Cuestionario</TabsTrigger>
            <TabsTrigger value="charts">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6">
            {Object.entries(grouped).map(([cat, qs]) => (
              <Card key={cat} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-poppins flex items-center gap-2">
                    <span>{qs[0].icon}</span> {cat}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {qs.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {q.id}. {q.text}
                      </Label>
                      <RadioGroup
                        value={answers[q.id]?.toString() || ''}
                        onValueChange={(v) => handleAnswer(q.id, parseInt(v))}
                        className="flex gap-3"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div key={n} className="flex items-center gap-1">
                            <RadioGroupItem value={n.toString()} id={`q${q.id}-${n}`} />
                            <Label htmlFor={`q${q.id}-${n}`} className="cursor-pointer">{n}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-poppins">💊 Medicación de hoy</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Mañana</Label>
                  <Input value={medMorning} onChange={(e) => setMedMorning(e.target.value)} placeholder="Ej. Concerta 36mg" />
                </div>
                <div className="space-y-2">
                  <Label>Tarde</Label>
                  <Input value={medAfternoon} onChange={(e) => setMedAfternoon(e.target.value)} placeholder="Ej. Ritalin 10mg" />
                </div>
                <div className="space-y-2">
                  <Label>Noche</Label>
                  <Input value={medNight} onChange={(e) => setMedNight(e.target.value)} placeholder="Ej. Melatonina" />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label>Notas del día (opcional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between sticky bottom-4 bg-white/80 backdrop-blur p-3 rounded-xl shadow-lg">
              <span className="text-sm text-muted-foreground">
                {answered}/{QUESTIONS.length} respondidas
              </span>
              <Button onClick={save} disabled={saving} className="bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar hoy'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Promedio por categoría (hoy)</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                {categoryAverages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Responde el cuestionario para ver el gráfico.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryAverages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="promedio" radius={[8, 8, 0, 0]}>
                        {categoryAverages.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Distribución por categoría</CardTitle>
                </CardHeader>
                <CardContent style={{ height: 320 }}>
                  {categoryAverages.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Sin datos de hoy.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryAverages}
                          dataKey="promedio"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(e) => e.category}
                        >
                          {categoryAverages.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Tendencia últimos 30 días</CardTitle>
                </CardHeader>
                <CardContent style={{ height: 320 }}>
                  {trendData.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aún no hay historial.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="promedio" fill="#00BCD4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Assessment;
