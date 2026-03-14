-- LankaPros — Ensure all required PostgreSQL functions exist
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xtkbgwsidpdirlksiebz/sql
-- Safe to run multiple times (CREATE OR REPLACE)

-- ============================================================
-- Feed function — powers /feed page
-- ============================================================
CREATE OR REPLACE FUNCTION get_feed(
  p_user_id UUID,
  p_page_size INT DEFAULT 20,
  p_page_offset INT DEFAULT 0,
  p_filter_industry INT DEFAULT NULL
)
RETURNS TABLE (
  id INT,
  author_id UUID,
  content TEXT,
  image_url TEXT,
  industry_id INT,
  like_count INT,
  comment_count INT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  author_headline TEXT,
  user_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.author_id,
    p.content,
    p.image_url,
    p.industry_id,
    p.like_count,
    p.comment_count,
    p.created_at,
    pr.full_name AS author_name,
    pr.username AS author_username,
    pr.avatar_url AS author_avatar,
    pr.headline AS author_headline,
    EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = p_user_id) AS user_liked
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_id
  WHERE (
    p.author_id = p_user_id
    OR p.author_id IN (
      SELECT CASE WHEN c.requester_id = p_user_id THEN c.addressee_id ELSE c.requester_id END
      FROM connections c
      WHERE c.status = 'accepted'
      AND (c.requester_id = p_user_id OR c.addressee_id = p_user_id)
    )
  )
  AND (p_filter_industry IS NULL OR p.industry_id = p_filter_industry)
  ORDER BY p.created_at DESC
  LIMIT p_page_size
  OFFSET p_page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Search functions
-- ============================================================
CREATE OR REPLACE FUNCTION search_profiles(
  search_query TEXT,
  result_limit INT DEFAULT 20
)
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE p.full_name ILIKE '%' || search_query || '%'
     OR p.username ILIKE '%' || search_query || '%'
     OR p.headline ILIKE '%' || search_query || '%'
  ORDER BY p.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  result_limit INT DEFAULT 20
)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM posts p
  WHERE p.content ILIKE '%' || search_query || '%'
  ORDER BY p.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
