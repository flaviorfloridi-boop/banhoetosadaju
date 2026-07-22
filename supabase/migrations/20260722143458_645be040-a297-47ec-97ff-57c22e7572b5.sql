
-- Enum para papel do usuário
CREATE TYPE public.user_role AS ENUM ('cliente', 'funcionario', 'admin');

-- Enum para status de agendamento
CREATE TYPE public.agendamento_status AS ENUM ('solicitado','confirmado','em_andamento','concluido','cancelado');

-- Enum para tipo de serviço de banho/tosa
CREATE TYPE public.servico_tipo AS ENUM ('banho','tosa','banho_e_tosa','hidratacao','tosa_higienica');

-- Enum para tipo Taxi Dog
CREATE TYPE public.taxi_dog_tipo AS ENUM ('coleta','entrega','coleta_e_entrega');

-- Enum para status Taxi Dog
CREATE TYPE public.taxi_dog_status AS ENUM ('solicitado','confirmado','a_caminho','concluido','cancelado');

-- =========================================
-- profiles
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT,
  role public.user_role NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- has_role helper (security definer, evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role IN ('funcionario','admin')
  );
$$;

-- Policies profiles
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Staff read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile (no role change)" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'telefone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- pets
-- =========================================
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL DEFAULT 'cachorro',
  raca TEXT,
  porte TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutor manages own pets" ON public.pets
  FOR ALL TO authenticated USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Staff read all pets" ON public.pets
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update all pets" ON public.pets
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- agendamentos
-- =========================================
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  servico public.servico_tipo NOT NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  observacoes TEXT,
  status public.agendamento_status NOT NULL DEFAULT 'solicitado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê próprios agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated USING (auth.uid() = cliente_id);
CREATE POLICY "Cliente cria agendamento" ON public.agendamentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Cliente cancela próprio agendamento" ON public.agendamentos
  FOR UPDATE TO authenticated USING (auth.uid() = cliente_id) WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Staff vê todos agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff atualiza todos agendamentos" ON public.agendamentos
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER agendamentos_updated_at BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- taxi_dog
-- =========================================
CREATE TABLE public.taxi_dog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  endereco_coleta TEXT NOT NULL,
  bairro TEXT NOT NULL,
  ponto_referencia TEXT,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  tipo public.taxi_dog_tipo NOT NULL,
  taxa NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.taxi_dog_status NOT NULL DEFAULT 'solicitado',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.taxi_dog TO authenticated;
GRANT ALL ON public.taxi_dog TO service_role;

ALTER TABLE public.taxi_dog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê próprios taxi dog" ON public.taxi_dog
  FOR SELECT TO authenticated USING (auth.uid() = cliente_id);
CREATE POLICY "Cliente cria taxi dog" ON public.taxi_dog
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Cliente cancela próprio taxi dog" ON public.taxi_dog
  FOR UPDATE TO authenticated USING (auth.uid() = cliente_id) WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Staff vê todos taxi dog" ON public.taxi_dog
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff atualiza todos taxi dog" ON public.taxi_dog
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER taxi_dog_updated_at BEFORE UPDATE ON public.taxi_dog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
