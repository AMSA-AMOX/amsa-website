-- Add editable profile headline/custom header.
alter table public."Users"
add column if not exists headline text;
