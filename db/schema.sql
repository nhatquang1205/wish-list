create extension if not exists "pgcrypto";

create table if not exists wishes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  url        text,
  image_url  text,
  note       text,
  rating     smallint not null default 5 check (rating between 1 and 5),
  status     text not null default 'wishing'
               check (status in ('wishing','approved','rejected','done')),
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wishes_created_at_idx on wishes (created_at desc);

-- Brings an older database (statuses 'bought'/'gifted') up to the current set.
alter table wishes drop constraint if exists wishes_status_check;
update wishes set status = 'done' where status in ('bought', 'gifted');
alter table wishes add constraint wishes_status_check
  check (status in ('wishing','approved','rejected','done'));
