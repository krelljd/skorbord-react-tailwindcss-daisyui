-- Migration: Update Golf game_type to have null win_condition, 100 loss_condition, is_win_condition = 0
-- This script is idempotent and safe to run multiple times.

UPDATE game_types
SET 
  win_condition = NULL,
  loss_condition = 100,
  is_win_condition = 0
WHERE LOWER(name) = 'golf';
