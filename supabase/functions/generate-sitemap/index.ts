/**
 * generate-sitemap Edge Function
 * 
 * 동적으로 sitemap.xml을 생성합니다.
 * - master_contents 테이블에서 deployed 상태인 유료 콘텐츠 조회
 * - XML 형식으로 sitemap 생성
 * - 1시간 캐싱
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SITE_URL = 'https://nadaunse.com';

// Supabase 클라이언트 생성
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // deployed 상태인 유료 콘텐츠 조회 (인기순)
    const { data: contents, error } = await supabase
      .from('master_contents')
      .select('id, updated_at')
      .eq('status', 'deployed')
      .eq('content_type', 'paid')
      .order('weekly_clicks', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ DB 조회 실패:', error);
      throw new Error(`DB 조회 실패: ${error.message}`);
    }

    console.log(`✅ 유료 콘텐츠 ${contents?.length || 0}개 조회`);

    // XML 생성
    const xml = generateSitemapXml(contents || []);

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
    const fallbackXml = generateSitemapXml([]);
    
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
function generateSitemapXml(contents: Array<{ id: string; updated_at: string }>): string {
  const today = new Date().toISOString().split('T')[0];

  // 정적 페이지
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: '/terms-of-service', changefreq: 'monthly', priority: '0.3' },
    { loc: '/privacy-policy', changefreq: 'monthly', priority: '0.3' },
  ];

  // 동적 콘텐츠 페이지
  const contentPages = contents.map((content) => ({
    loc: `/product/${content.id}`,
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: content.updated_at ? content.updated_at.split('T')[0] : undefined,
  }));

  const allPages = [...staticPages, ...contentPages];

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
