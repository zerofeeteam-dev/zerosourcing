alter table public.portfolios
  drop constraint portfolios_type_check;

alter table public.portfolios
  add constraint portfolios_type_check
  check (type in ('application', 'company_homepage', 'mvp', 'web_service'));
