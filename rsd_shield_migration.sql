-- ============================================================
-- SUPABASE MIGRATION — RSD Shield
-- Run this in your Supabase SQL Editor
-- Integrates with your existing schema from init.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS rsd_shield_comments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_comment_id   BIGINT UNIQUE,
  pr_number           INTEGER,
  pr_title            TEXT,
  repo                TEXT,
  author              TEXT,
  avatar_url          TEXT,
  file_path           TEXT,
  line_number         INTEGER,
  original_text       TEXT NOT NULL,
  sanitized_text      TEXT NOT NULL,
  action_items        TEXT[] DEFAULT '{}',
  sentiment           TEXT CHECK (sentiment IN ('critical', 'neutral', 'positive', 'mixed')),
  safety_score        INTEGER DEFAULT 50,
  is_read             BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast PR lookups
CREATE INDEX IF NOT EXISTS idx_rsd_comments_pr ON rsd_shield_comments (repo, pr_number);
CREATE INDEX IF NOT EXISTS idx_rsd_comments_unread ON rsd_shield_comments (is_read) WHERE is_read = FALSE;

-- Row-Level Security
ALTER TABLE rsd_shield_comments ENABLE ROW LEVEL SECURITY;

-- Users can only see comments for repos they're authenticated for
-- (Adjust policy to match your auth strategy)
CREATE POLICY "Authenticated users can read their PR comments"
  ON rsd_shield_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert/update comments"
  ON rsd_shield_comments FOR ALL
  USING (auth.role() = 'service_role');

-- ── Grant permissions ──
GRANT SELECT ON rsd_shield_comments TO authenticated;
GRANT ALL ON rsd_shield_comments TO service_role;
