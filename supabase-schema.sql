-- LankaPros Database Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Industries table (reference data)
CREATE TABLE industries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT
);

-- Seed industries
INSERT INTO industries (name, slug, icon) VALUES
  ('Information Technology', 'it', '💻'),
  ('Tourism & Hospitality', 'tourism', '🏨'),
  ('Tea & Agriculture', 'agriculture', '🌿'),
  ('Apparel & Textiles', 'apparel', '👔'),
  ('Banking & Finance', 'finance', '🏦'),
  ('Education & Training', 'education', '📚'),
  ('Healthcare & Pharma', 'healthcare', '🏥'),
  ('Construction & Real Estate', 'construction', '🏗️'),
  ('Manufacturing', 'manufacturing', '🏭'),
  ('Shipping & Logistics', 'logistics', '🚢'),
  ('Gems & Jewellery', 'gems', '💎'),
  ('Media & Entertainment', 'media', '🎬'),
  ('Telecommunications', 'telecom', '📡'),
  ('Government & Public Sector', 'government', '🏛️'),
  ('Legal Services', 'legal', '⚖️'),
  ('NGO & Development', 'ngo', '🤝'),
  ('Startups & Entrepreneurship', 'startups', '🚀'),
  ('Freelance & Consulting', 'freelance', '💼'),
  ('Arts & Design', 'arts', '🎨');

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  industry_id INT REFERENCES industries(id),
  location TEXT,
  website TEXT,
  theme_accent TEXT NOT NULL DEFAULT '#D4A843',
  theme_bg TEXT NOT NULL DEFAULT '#0f0f0f',
  theme_text TEXT NOT NULL DEFAULT '#ededed',
  theme_pattern TEXT NOT NULL DEFAULT 'none',
  connection_count INT NOT NULL DEFAULT 0,
  post_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add trigram indexes for search
CREATE INDEX idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);

-- Experiences
CREATE TABLE experiences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  current BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Education
CREATE TABLE education (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT,
  field TEXT,
  start_year INT NOT NULL,
  end_year INT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Skills
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Connections
CREATE TABLE connections (
  id SERIAL PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_connections_addressee ON connections(addressee_id, status);
CREATE INDEX idx_connections_requester ON connections(requester_id, status);

-- Posts
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  industry_id INT REFERENCES industries(id),
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_content_trgm ON posts USING gin (content gin_trgm_ops);

-- Post likes
CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post ON comments(post_id);

-- Conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- Groups
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  industry_id INT REFERENCES industries(id),
  member_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default groups from industries
INSERT INTO groups (name, slug, description, icon, industry_id)
SELECT
  name || ' Professionals',
  slug,
  'Connect with Sri Lankan ' || name || ' professionals',
  icon,
  id
FROM industries;

-- Group members
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'post_like', 'post_comment', 'message', 'group_invite')),
  actor_id UUID REFERENCES profiles(id),
  entity_type TEXT,
  entity_id INT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- Industries: public read
CREATE POLICY "Industries are public" ON industries FOR SELECT USING (true);

-- Profiles: public read, own write
CREATE POLICY "Profiles are public" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Experiences: public read, own write
CREATE POLICY "Experiences are public" ON experiences FOR SELECT USING (true);
CREATE POLICY "Users can manage own experiences" ON experiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiences" ON experiences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own experiences" ON experiences FOR DELETE USING (auth.uid() = user_id);

-- Education: public read, own write
CREATE POLICY "Education is public" ON education FOR SELECT USING (true);
CREATE POLICY "Users can manage own education" ON education FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own education" ON education FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own education" ON education FOR DELETE USING (auth.uid() = user_id);

-- Skills: public read, own write
CREATE POLICY "Skills are public" ON skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON skills FOR DELETE USING (auth.uid() = user_id);

-- Connections: involved parties can read, requester can insert, addressee can update
CREATE POLICY "Users can see own connections" ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send connection requests" ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can respond to connection requests" ON connections FOR UPDATE
  USING (auth.uid() = addressee_id);
CREATE POLICY "Users can delete own connections" ON connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Posts: public read, own write
CREATE POLICY "Posts are public" ON posts FOR SELECT USING (true);
CREATE POLICY "Auth users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Post likes: public read, own write
CREATE POLICY "Post likes are public" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, own write
CREATE POLICY "Comments are public" ON comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Conversations: participants only
CREATE POLICY "Users can see own conversations" ON conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Auth users can create conversations" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Participants can update conversations" ON conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages: conversation participants only
CREATE POLICY "Users can see messages in own conversations" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));
CREATE POLICY "Users can send messages in own conversations" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

-- Groups: public read, members write
CREATE POLICY "Groups are public" ON groups FOR SELECT USING (true);

-- Group members: public read, own write
CREATE POLICY "Group members are public" ON group_members FOR SELECT USING (true);
CREATE POLICY "Auth users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Notifications: own only
CREATE POLICY "Users can see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Triggers & Functions
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update profile updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER connections_updated_at BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Post like counter
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_like AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Comment counter
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Connection counter
CREATE OR REPLACE FUNCTION update_connection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE profiles SET connection_count = connection_count + 1 WHERE id = NEW.requester_id;
    UPDATE profiles SET connection_count = connection_count + 1 WHERE id = NEW.addressee_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    UPDATE profiles SET connection_count = connection_count - 1 WHERE id = OLD.requester_id;
    UPDATE profiles SET connection_count = connection_count - 1 WHERE id = OLD.addressee_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_connection_change AFTER UPDATE OR DELETE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_connection_count();

-- Post counter on profiles
CREATE OR REPLACE FUNCTION update_profile_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET post_count = post_count - 1 WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_change AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_profile_post_count();

-- Group member counter
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_member_change AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- ============================================================
-- RPC Functions
-- ============================================================

-- Feed: posts from connections + own posts
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

-- Search profiles
CREATE OR REPLACE FUNCTION search_profiles(
  search_query TEXT,
  result_limit INT DEFAULT 20
)
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE p.full_name % search_query
     OR p.username % search_query
     OR p.headline ILIKE '%' || search_query || '%'
  ORDER BY
    GREATEST(
      similarity(COALESCE(p.full_name, ''), search_query),
      similarity(COALESCE(p.username, ''), search_query)
    ) DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search posts
CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  result_limit INT DEFAULT 20
)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM posts p
  WHERE p.content % search_query
     OR p.content ILIKE '%' || search_query || '%'
  ORDER BY p.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Storage buckets
-- ============================================================
-- Run these in Supabase Dashboard > Storage:
-- 1. Create bucket "avatars" (public)
-- 2. Create bucket "covers" (public)
-- 3. Create bucket "posts" (public)
--
-- Storage policies (run in SQL editor):

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar images are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Cover images are public" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload own cover" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own cover" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own cover" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Post images are public" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own post images" ON storage.objects FOR DELETE USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
