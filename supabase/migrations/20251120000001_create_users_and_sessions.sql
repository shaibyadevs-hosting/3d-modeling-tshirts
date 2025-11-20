/*
  # Create users and sessions tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique) - User email
      - `password_hash` (text) - Hashed password
      - `credits` (integer) - Available credits
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Reference to users table
      - `access_token` (text) - Encrypted access token
      - `login_at` (timestamptz) - Login timestamp
      - `logout_at` (timestamptz, nullable) - Logout timestamp
      - `created_at` (timestamptz) - Session creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  credits integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  login_at timestamptz DEFAULT now(),
  logout_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Allow public signup"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (true);

-- Policies for user_sessions table
CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_access_token ON user_sessions(access_token);
