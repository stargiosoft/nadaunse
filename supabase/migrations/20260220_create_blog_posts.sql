-- blog_posts 테이블 생성 (SEO용 블로그 기능)
-- 실제 적용: Supabase Dashboard에서 실행

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,          -- HTML
  thumbnail_url TEXT,
  category TEXT,                  -- 'saju', 'tarot', 'tip' 등
  tags TEXT[],
  meta_title TEXT,                -- SEO title (없으면 title 사용)
  meta_description TEXT,          -- SEO description (없으면 excerpt 사용)
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 누구나 published 글 읽기 가능
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- 인덱스
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
