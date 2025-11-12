-- Create feriados (holidays) table
CREATE TABLE IF NOT EXISTS public.feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'federal', -- 'federal', 'estadual', 'customizado'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all feriados
CREATE POLICY "Allow public read access to feriados"
  ON public.feriados FOR SELECT
  USING (true);

-- Allow only admins to insert/update/delete feriados
CREATE POLICY "Allow admin to manage feriados"
  ON public.feriados FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert main Brazilian holidays for 2025
INSERT INTO public.feriados (data, nome, tipo) VALUES
  ('2025-01-01', 'Ano Novo', 'federal'),
  ('2025-02-19', 'Sexta-feira de Carnaval', 'federal'),
  ('2025-02-20', 'Sábado de Carnaval', 'federal'),
  ('2025-02-21', 'Domingo de Carnaval', 'federal'),
  ('2025-02-22', 'Segunda de Carnaval', 'federal'),
  ('2025-02-24', 'Segunda de Páscoa', 'federal'),
  ('2025-04-21', 'Tiradentes', 'federal'),
  ('2025-05-01', 'Dia do Trabalho', 'federal'),
  ('2025-05-30', 'Corpus Christi', 'federal'),
  ('2025-09-07', 'Independência do Brasil', 'federal'),
  ('2025-10-12', 'Nossa Senhora Aparecida', 'federal'),
  ('2025-11-02', 'Finados', 'federal'),
  ('2025-11-20', 'Consciência Negra', 'federal'),
  ('2025-12-25', 'Natal', 'federal')
ON CONFLICT (data) DO NOTHING;

-- Create an index on data for faster lookups
CREATE INDEX idx_feriados_data ON public.feriados(data);
