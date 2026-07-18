CREATE TYPE public.plan_type AS ENUM ('trial', 'basic', 'pro', 'enterprise');
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'secretary', 'mechanic');
CREATE TYPE public.checklist_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  legal_name VARCHAR,
  document VARCHAR UNIQUE,
  phone VARCHAR,
  email VARCHAR,
  address_street VARCHAR,
  address_number VARCHAR,
  address_complement VARCHAR,
  address_neighborhood VARCHAR,
  address_city VARCHAR,
  address_state CHAR(2),
  address_zip VARCHAR(9),
  plan_type public.plan_type NOT NULL DEFAULT 'trial',
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view operators"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view operator roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name VARCHAR NOT NULL,
  identifier VARCHAR,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;
GRANT ALL ON public.machines TO service_role;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view machines"
  ON public.machines FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  status public.checklist_status NOT NULL DEFAULT 'pending',
  performed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT ALL ON public.checklists TO service_role;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view checklists"
  ON public.checklists FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX companies_created_at_idx ON public.companies (created_at DESC);
CREATE INDEX companies_is_active_idx ON public.companies (is_active);
CREATE INDEX users_company_id_idx ON public.users (company_id);
CREATE INDEX users_is_active_idx ON public.users (is_active);
CREATE INDEX user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX machines_is_active_idx ON public.machines (is_active);
CREATE INDEX checklists_created_at_idx ON public.checklists (created_at DESC);
CREATE INDEX checklists_performed_at_idx ON public.checklists (performed_at DESC);