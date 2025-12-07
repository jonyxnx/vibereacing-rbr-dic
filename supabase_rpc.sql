-- Function to atomically add a drawing without overwriting others
create or replace function submit_drawing(room_id text, drawing jsonb)
returns void as $$
begin
  update game_rooms
  set state = jsonb_set(
    state, 
    '{drawings}', 
    coalesce(state->'drawings', '[]'::jsonb) || drawing
  )
  where id = room_id;
end;
$$ language plpgsql;

-- Function to atomically vote
create or replace function submit_vote(room_id text, user_id text, drawing_id text)
returns void as $$
begin
  update game_rooms
  set state = jsonb_set(
    state,
    '{votes}',
    coalesce(state->'votes', '{}'::jsonb) || jsonb_build_object(user_id, drawing_id)
  )
  where id = room_id;
end;
$$ language plpgsql;
