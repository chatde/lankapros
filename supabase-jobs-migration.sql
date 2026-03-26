-- LankaPros: Jobs table migration
-- Run this in Supabase SQL Editor after the initial schema

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  poster_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  location TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'onsite' CHECK (location_type IN ('onsite', 'remote', 'hybrid')),
  employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance')),
  industry_id INT REFERENCES industries(id),
  description TEXT NOT NULL,
  requirements TEXT,
  salary_min INT,
  salary_max INT,
  salary_currency TEXT NOT NULL DEFAULT 'LKR',
  apply_url TEXT,
  apply_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  application_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_poster ON jobs(poster_id);
CREATE INDEX idx_jobs_industry ON jobs(industry_id);
CREATE INDEX idx_jobs_active ON jobs(is_active, created_at DESC);
CREATE INDEX idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
CREATE INDEX idx_jobs_company_trgm ON jobs USING gin (company gin_trgm_ops);

-- Job saved/bookmarks
CREATE TABLE IF NOT EXISTS job_saves (
  id SERIAL PRIMARY KEY,
  job_id INT REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Job applications tracking
CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INT REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Jobs: public read active, own write
CREATE POLICY "Active jobs are public" ON jobs FOR SELECT USING (is_active = true OR poster_id = auth.uid());
CREATE POLICY "Auth users can post jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = poster_id);
CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = poster_id);

-- Job saves: own only
CREATE POLICY "Users can see own saves" ON job_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save jobs" ON job_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave jobs" ON job_saves FOR DELETE USING (auth.uid() = user_id);

-- Job applications: applicant sees own, poster sees for their jobs
CREATE POLICY "Users can see own applications" ON job_applications FOR SELECT
  USING (auth.uid() = applicant_id OR EXISTS (
    SELECT 1 FROM jobs j WHERE j.id = job_applications.job_id AND j.poster_id = auth.uid()
  ));
CREATE POLICY "Users can apply to jobs" ON job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Users can update own applications" ON job_applications FOR UPDATE USING (auth.uid() = applicant_id);

-- Updated at trigger for jobs
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Application counter
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs SET application_count = application_count - 1 WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_job_application AFTER INSERT OR DELETE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_job_application_count();
