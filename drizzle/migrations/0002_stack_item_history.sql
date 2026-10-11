CREATE TABLE public.stack_item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stack_item_id uuid NOT NULL,
  item_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('baseline','created','updated','deleted')),
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stack_item_history_user_created_idx ON public.stack_item_history (user_id, created_at DESC);
CREATE INDEX stack_item_history_item_created_idx ON public.stack_item_history (stack_item_id, created_at);

REVOKE ALL ON public.stack_item_history FROM anon, authenticated, public;
GRANT SELECT ON public.stack_item_history TO authenticated;
GRANT ALL ON public.stack_item_history TO service_role;
ALTER TABLE public.stack_item_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own stack history" ON public.stack_item_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.stack_item_snapshot(r public.stack_items)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'name', r.name, 'category', r.category, 'item_type', r.item_type, 'stage', r.stage,
    'owner', r.owner, 'vendor_contact', r.vendor_contact, 'cost_amount', r.cost_amount,
    'cost_period', r.cost_period, 'currency', r.currency, 'seats', r.seats,
    'renewal_date', r.renewal_date, 'notice_days', r.notice_days,
    'auto_renews', r.auto_renews, 'notes', r.notes))
$$;

CREATE OR REPLACE FUNCTION public.log_stack_item_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o jsonb; n jsonb; ch jsonb := '{}'::jsonb; k text;
  fields text[] := ARRAY['name','category','item_type','stage','owner','vendor_contact','cost_amount','cost_period','currency','seats','renewal_date','notice_days','auto_renews','notes'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    n := public.stack_item_snapshot(NEW);
    FOR k IN SELECT jsonb_object_keys(n) LOOP
      ch := ch || jsonb_build_object(k, jsonb_build_object('from', NULL, 'to', n->k));
    END LOOP;
    INSERT INTO public.stack_item_history (user_id, stack_item_id, item_name, action, changes)
      VALUES (NEW.user_id, NEW.id, NEW.name, 'created', ch);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    o := public.stack_item_snapshot(OLD);
    FOR k IN SELECT jsonb_object_keys(o) LOOP
      ch := ch || jsonb_build_object(k, jsonb_build_object('from', o->k, 'to', NULL));
    END LOOP;
    INSERT INTO public.stack_item_history (user_id, stack_item_id, item_name, action, changes)
      VALUES (OLD.user_id, OLD.id, OLD.name, 'deleted', ch);
    RETURN OLD;
  ELSE
    o := public.stack_item_snapshot(OLD);
    n := public.stack_item_snapshot(NEW);
    FOREACH k IN ARRAY fields LOOP
      IF (o->k) IS DISTINCT FROM (n->k) THEN
        ch := ch || jsonb_build_object(k, jsonb_build_object('from', COALESCE(o->k, 'null'::jsonb), 'to', COALESCE(n->k, 'null'::jsonb)));
      END IF;
    END LOOP;
    IF ch <> '{}'::jsonb THEN
      INSERT INTO public.stack_item_history (user_id, stack_item_id, item_name, action, changes)
        VALUES (NEW.user_id, NEW.id, NEW.name, 'updated', ch);
    END IF;
    RETURN NEW;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.log_stack_item_change() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.stack_item_snapshot(public.stack_items) FROM public, anon, authenticated;

CREATE TRIGGER stack_items_history
  AFTER INSERT OR UPDATE OR DELETE ON public.stack_items
  FOR EACH ROW EXECUTE FUNCTION public.log_stack_item_change();

INSERT INTO public.stack_item_history (user_id, stack_item_id, item_name, action, changes)
SELECT s.user_id, s.id, s.name, 'baseline',
  (SELECT COALESCE(jsonb_object_agg(e.key, jsonb_build_object('from', NULL, 'to', e.value)), '{}'::jsonb)
     FROM jsonb_each(public.stack_item_snapshot(s)) e)
FROM public.stack_items s;