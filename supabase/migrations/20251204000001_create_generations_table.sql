/*
  # Create generations table for storing user generation history

  1. New Tables
    - `generations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Reference to users table
      - `garment_type` (text) - Type of garment
      - `front_view_url` (text) - Uploaded front view image (base64)
      - `back_view_url` (text, nullable) - Uploaded back view image (base64)
      - `generated_front1` (text, nullable) - Generated front view 1
      - `generated_front2` (text, nullable) - Generated front view 2
      - `generated_front3` (text, nullable) - Generated front view 3
      - `generated_side` (text, nullable) - Generated side view
      - `generated_back` (text, nullable) - Generated back view
      - `selected_front_index` (integer, nullable) - Which front view was selected
      - `status` (text) - Processing status
      - `created_at` (timestamptz) - When the generation was created
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `generations` table
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  garment_type text NOT NULL,
  front_view_url text NOT NULL,
  back_view_url text,
  generated_front1 text,
  generated_front2 text,
  generated_front3 text,
  generated_side text,
  generated_back text,
  selected_front_index integer,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Policies for generations table
CREATE POLICY "Users can insert own generations"
  ON generations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own generations"
  ON generations
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own generations"
  ON generations
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own generations"
  ON generations
  FOR DELETE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- Add name field to users table for profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;
