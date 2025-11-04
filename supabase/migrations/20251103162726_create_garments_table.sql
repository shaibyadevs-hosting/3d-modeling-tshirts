/*
  # Create garments table

  1. New Tables
    - `garments`
      - `id` (uuid, primary key)
      - `garment_type` (text) - Type of garment (shirt, t-shirt, jacket, etc.)
      - `front_view_url` (text) - URL to the uploaded front view image
      - `back_view_url` (text) - URL to the uploaded back view image
      - `generated_front_url` (text, nullable) - URL to generated 3D front view
      - `generated_back_url` (text, nullable) - URL to generated 3D back view
      - `generated_side_url` (text, nullable) - URL to generated 3D side view
      - `status` (text) - Processing status (uploading, processing, completed, failed)
      - `created_at` (timestamptz) - When the garment was created
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `garments` table
    - Add policy for public read access (for demo purposes)
    - Add policy for public insert access (for demo purposes)
*/

CREATE TABLE IF NOT EXISTS garments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_type text NOT NULL,
  front_view_url text NOT NULL,
  back_view_url text NOT NULL,
  generated_front_url text,
  generated_back_url text,
  generated_side_url text,
  status text DEFAULT 'uploading',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE garments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON garments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON garments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON garments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);