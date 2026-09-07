delete from public.cbq_cases where source='fets';
with c as (
  insert into public.cbq_cases (part, section, title, narrative, exhibits, difficulty, source, verified)
  values ('Part 1', 'Performance Management', 'Kadalundi Precision Components — variance analysis and a supplier offer', 'PLACEHOLDER_WILL_REPLACE_WITH_FULL');
