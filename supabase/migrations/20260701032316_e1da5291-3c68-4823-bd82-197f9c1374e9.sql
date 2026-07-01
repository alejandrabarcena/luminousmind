
CREATE TABLE public.adhd_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  medication_morning TEXT,
  medication_afternoon TEXT,
  medication_night TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, assessment_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.adhd_assessments TO authenticated;
GRANT ALL ON public.adhd_assessments TO service_role;

ALTER TABLE public.adhd_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own assessments" ON public.adhd_assessments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own assessments" ON public.adhd_assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own assessments" ON public.adhd_assessments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own assessments" ON public.adhd_assessments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_adhd_assessments_updated_at
  BEFORE UPDATE ON public.adhd_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_adhd_assessments_user_date ON public.adhd_assessments(user_id, assessment_date DESC);
