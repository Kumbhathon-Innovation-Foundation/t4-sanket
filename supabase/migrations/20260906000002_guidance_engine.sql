-- ====================================================================
-- PRAVAH (Anubhav) — Guidance Engine Migration
-- File: supabase/migrations/20260906000002_guidance_engine.sql
-- Description:
--   Introduces the Automated Guidance Engine database foundation:
--   - guidance_rules: Configurable threshold rules per module
--   - automated_guidance: Engine-generated recommendations
--   - guidance_overrides: Admin/authority tactical overrides
-- ====================================================================

-- 1. GUIDANCE RULES — Configurable detection thresholds
CREATE TABLE IF NOT EXISTS public.guidance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  module VARCHAR(50) NOT NULL CHECK (module IN ('CROWD', 'PARKING', 'FACILITY', 'ROUTE', 'FOOD')),
  condition_metric VARCHAR(100) NOT NULL,
  operator VARCHAR(10) NOT NULL CHECK (operator IN ('>', '>=', '<', '<=', '=', '!=')),
  threshold_value NUMERIC(10,2) NOT NULL,
  duration_seconds INT DEFAULT 0,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'RECOMMEND_ALTERNATE',
    'GENERATE_WARNING',
    'DEPRIORITIZE',
    'NEVER_RECOMMEND',
    'ESCALATE_ADMIN'
  )),
  severity VARCHAR(20) DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.guidance_rules IS 'Configurable rules that define when the Guidance Engine should trigger automated recommendations.';

-- 2. AUTOMATED GUIDANCE — Engine-generated recommendations
CREATE TABLE IF NOT EXISTS public.automated_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  rule_id UUID REFERENCES public.guidance_rules(id) ON DELETE SET NULL,
  source_module VARCHAR(50) NOT NULL CHECK (source_module IN ('CROWD', 'PARKING', 'FACILITY', 'ROUTE', 'FOOD')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  guidance_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  recommended_action TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'PROMOTED_TO_VERIFIED', 'DISMISSED')),
  confidence VARCHAR(20) DEFAULT 'HIGH' CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  severity VARCHAR(20) DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
  metric_snapshot JSONB DEFAULT '{}',
  zone_id VARCHAR(10),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_by VARCHAR(100),
  promoted_advisory_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.automated_guidance IS 'System-generated guidance items produced by the Guidance Engine when rules are crossed.';

-- 3. GUIDANCE OVERRIDES — Admin/authority tactical directives
CREATE TABLE IF NOT EXISTS public.guidance_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  override_type VARCHAR(50) NOT NULL CHECK (override_type IN (
    'FORCE_CLOSE',
    'FORCE_OPEN',
    'SUPPRESS_AUTO_GUIDANCE',
    'FORCE_RECOMMEND'
  )),
  reason TEXT NOT NULL,
  authorized_by VARCHAR(100) NOT NULL,
  authority_role VARCHAR(100),
  active BOOLEAN DEFAULT true,
  zone_id VARCHAR(10),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.guidance_overrides IS 'Tactical overrides issued by administrators or authorities to force or suppress engine behavior.';

-- 4. INDEXES for query performance
CREATE INDEX IF NOT EXISTS idx_guidance_rules_module ON public.guidance_rules(module);
CREATE INDEX IF NOT EXISTS idx_guidance_rules_enabled ON public.guidance_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_status ON public.automated_guidance(status);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_module ON public.automated_guidance(source_module);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_entity ON public.automated_guidance(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_zone ON public.automated_guidance(zone_id);
CREATE INDEX IF NOT EXISTS idx_guidance_overrides_active ON public.guidance_overrides(active);
CREATE INDEX IF NOT EXISTS idx_guidance_overrides_entity ON public.guidance_overrides(entity_type, entity_id);

-- 5. ROW LEVEL SECURITY
ALTER TABLE public.guidance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidance_overrides ENABLE ROW LEVEL SECURITY;

-- Open read policies (admin/service reads)
CREATE POLICY "Allow public read for guidance_rules" ON public.guidance_rules FOR SELECT USING (true);
CREATE POLICY "Allow public read for automated_guidance" ON public.automated_guidance FOR SELECT USING (true);
CREATE POLICY "Allow public read for guidance_overrides" ON public.guidance_overrides FOR SELECT USING (true);

-- Open write policies (controlled by app-level auth in production)
CREATE POLICY "Allow public write for guidance_rules" ON public.guidance_rules FOR ALL USING (true);
CREATE POLICY "Allow public write for automated_guidance" ON public.automated_guidance FOR ALL USING (true);
CREATE POLICY "Allow public write for guidance_overrides" ON public.guidance_overrides FOR ALL USING (true);

-- 6. REALTIME — Enable Supabase realtime for live dashboards
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_rules;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.automated_guidance;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_overrides;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 7. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_guidance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guidance_rules_updated_at
  BEFORE UPDATE ON public.guidance_rules
  FOR EACH ROW EXECUTE FUNCTION update_guidance_updated_at();

CREATE TRIGGER trg_guidance_overrides_updated_at
  BEFORE UPDATE ON public.guidance_overrides
  FOR EACH ROW EXECUTE FUNCTION update_guidance_updated_at();
