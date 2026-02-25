/**
 * generate-sitemap Edge Function
 *
 * 동적으로 sitemap.xml을 생성합니다.
 * - master_contents 테이블에서 deployed 상태인 콘텐츠 조회 (유료 + 무료)
 * - blog_posts 테이블에서 published 상태인 블로그 글 조회
 * - XML 형식으로 sitemap 생성
 * - 1시간 캐싱
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SITE_URL = 'https://nadaunse.com';

// Supabase 클라이언트 생성
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ContentItem {
  id: string;
  content_type: 'paid' | 'free';
  updated_at: string;
}

interface BlogPost {
  slug: string;
  published_at: string | null;
}

Deno.serve(async (req: Request) => {
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // deployed 상태인 모든 콘텐츠 조회 (유료 + 무료, 인기순)
    const { data: contents, error } = await supabase
      .from('master_contents')
      .select('id, content_type, updated_at')
      .eq('status', 'deployed')
      .order('weekly_clicks', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ DB 조회 실패:', error);
      throw new Error(`DB 조회 실패: ${error.message}`);
    }

    const paidCount = contents?.filter(c => c.content_type === 'paid').length || 0;
    const freeCount = contents?.filter(c => c.content_type === 'free').length || 0;

    // published 상태인 블로그 글 조회
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (blogError) {
      console.error('⚠️ 블로그 조회 실패 (무시):', blogError);
    }

    const blogCount = blogPosts?.length || 0;
    console.log(`✅ 콘텐츠 조회: 유료 ${paidCount}개, 무료 ${freeCount}개, 블로그 ${blogCount}개`);

    // XML 생성
    const xml = generateSitemapXml(contents || [], blogPosts || []);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1시간 캐싱
        'X-Robots-Tag': 'noarchive', // 캐시 버전 인덱싱 방지
      },
    });
  } catch (error) {
    console.error('❌ Sitemap 생성 실패:', error);
    
    // 에러 시에도 기본 sitemap 반환
    const fallbackXml = generateSitemapXml([], []);
    
    return new Response(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 에러 시 5분만 캐싱
      },
    });
  }
});

/**
 * Sitemap XML 생성
 */
function generateSitemapXml(contents: ContentItem[], blogPosts: BlogPost[]): string {
  const today = new Date().toISOString().split('T')[0];

  // 정적 페이지
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: '/terms-of-service', changefreq: 'monthly', priority: '0.3' },
    { loc: '/privacy-policy', changefreq: 'monthly', priority: '0.3' },
    { loc: '/manse', changefreq: 'monthly', priority: '0.8', lastmod: today },
  ];

  // 동적 콘텐츠 페이지 (유료: /product/:id, 무료: /free/content/:id)
  const contentPages = contents.map((content) => {
    const urlPath = content.content_type === 'paid'
      ? `/product/${content.id}`
      : `/free/content/${content.id}`;

    return {
      loc: urlPath,
      changefreq: 'weekly',
      priority: content.content_type === 'paid' ? '0.9' : '0.8',
      lastmod: content.updated_at ? content.updated_at.split('T')[0] : undefined,
    };
  });

  // 블로그 페이지
  const blogListPage = blogPosts.length > 0
    ? [{ loc: '/blog', changefreq: 'weekly', priority: '0.7', lastmod: today }]
    : [];

  const blogDetailPages = blogPosts.map((post) => ({
    loc: `/blog/${post.slug}`,
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: post.published_at ? post.published_at.split('T')[0] : undefined,
  }));

  const allPages = [...staticPages, ...contentPages, ...blogListPage, ...blogDetailPages];

  const urlEntries = allPages
    .map((page) => {
      let entry = `  <url>\n    <loc>${SITE_URL}${page.loc}</loc>\n`;
      if (page.lastmod) {
        entry += `    <lastmod>${page.lastmod}</lastmod>\n`;
      }
      entry += `    <changefreq>${page.changefreq}</changefreq>\n`;
      entry += `    <priority>${page.priority}</priority>\n`;
      entry += `  </url>`;
      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}
