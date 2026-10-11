
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null
    check (char_length(trim(full_name)) between 2 and 120),
  email text not null
    check (char_length(trim(email)) between 3 and 254),
  role text
    check (
      role is null
      or role in ('designer', 'developer', 'researcher', 'student')
    ),
  created_at timestamptz not null default now()
);

create unique index event_registrations_email_unique
  on public.event_registrations (lower(trim(email)));

alter table public.event_registrations enable row level security;

revoke all on table public.event_registrations from anon, authenticated;
grant insert on table public.event_registrations to anon;

create policy "Anyone can submit an event registration"
  on public.event_registrations
  for insert
  to anon
  with check (
    char_length(trim(full_name)) between 2 and 120
    and char_length(trim(email)) between 3 and 254
    and (
      role is null
      or role in ('designer', 'developer', 'researcher', 'student')
    )
  );
