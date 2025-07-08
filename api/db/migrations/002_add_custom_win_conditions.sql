-- Add custom win condition fields to games table
ALTER TABLE games ADD COLUMN win_condition_type TEXT;
ALTER TABLE games ADD COLUMN win_condition_value INTEGER;

-- Update existing games to have win_condition_type and win_condition_value from their game_types
UPDATE games 
SET win_condition_type = (
    SELECT CASE WHEN gt.is_win_condition = 1 THEN 'win' ELSE 'lose' END
    FROM game_types gt 
    WHERE gt.id = games.game_type_id
),
win_condition_value = (
    SELECT CASE WHEN gt.is_win_condition = 1 THEN gt.win_condition ELSE gt.loss_condition END
    FROM game_types gt 
    WHERE gt.id = games.game_type_id
);
