-- Create the table to store game state
create table if not exists game_rooms (
  id text primary key,
  state jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime for this table
alter publication supabase_realtime add table game_rooms;

-- Enable Row Level Security (RLS)
alter table game_rooms enable row level security;

-- Create policies to allow public access (since we don't have auth implemented yet)
create policy "Allow public read access"
  on game_rooms for select
  using (true);

create policy "Allow public insert access"
  on game_rooms for insert
  with check (true);

create policy "Allow public update access"
  on game_rooms for update
  using (true);
