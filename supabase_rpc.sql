-- Function to atomically add a drawing
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

-- Function to safely update phase (only if needed)
create or replace function update_phase(room_id text, new_phase text, new_time_limit int)
returns void as $$
begin
  update game_rooms
  set state = state || jsonb_build_object(
    'phase', new_phase, 
    'startTime', (extract(epoch from now()) * 1000)::bigint,
    'timeLeft', new_time_limit -- Optional tracking
  )
  where id = room_id;
end;
$$ language plpgsql;

-- Function to reset game
create or replace function reset_game(room_id text, new_state jsonb)
returns void as $$
begin
  update game_rooms
  set state = new_state
  where id = room_id;
end;
$$ language plpgsql;
