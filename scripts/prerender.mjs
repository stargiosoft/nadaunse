/**
 * prerender.mjs - 빌드 타임 메타 태그 주입 스크립트
 *
 * 빌드 후 Supabase에서 deployed 콘텐츠 목록을 가져와
 * 각 콘텐츠 페이지에 고유한 meta 태그를 주입한 정적 HTML을 생성합니다.
 *
 * Google/Naver 크롤러가 JS 실행 없이 페이지별 title, description, OG 태그를 인식하도록 합니다.
 *
 * 환경변수:
 * - VITE_SUPABASE_PROJECT_ID: Supabase 프로젝트 ID
 * - VITE_SUPABASE_ANON_KEY: Supabase anon key
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = resolve(__dirname, '..', 'build');
const SITE_URL = 'https://nadaunse.com';

// 환경변수에서 Supabase 정보 읽기 (Vercel 빌드 환경에서 설정됨)
const SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// 기본 OG 이미지 (홈페이지와 동일)
const DEFAULT_OG_IMAGE = 'https://hyltbeewxaqashyivilu.supabase.co/storage/v1/object/public/assets/OG%20image/OG%20KakaoTalk.png';

/**
 * Supabase REST API로 deployed 콘텐츠 조회
 */
async function fetchDeployedContents() {
  if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY) {
    console.warn('[prerender] VITE_SUPABASE_PROJECT_ID 또는 VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다. 콘텐츠 프리렌더를 건너뜁니다.');
    return [];
  }

  const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/master_contents?status=eq.deployed&select=id,title,description,content_type,thumbnail_url`;

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[prerender] 콘텐츠 조회 완료: 유료 ${data.filter(c => c.content_type === 'paid').length}개, 무료 ${data.filter(c => c.content_type === 'free').length}개`);
    return data;
  } catch (error) {
    console.warn(`[prerender] Supabase 조회 실패: ${error.message}`);
    console.warn('[prerender] 콘텐츠 프리렌더를 건너뜁니다. 기존 SPA 동작을 유지합니다.');
    return [];
  }
}

/**
 * HTML 템플릿에서 메타 태그를 교체하여 새 HTML 생성
 */
function injectMetaTags(template, { title, description, keywords, canonicalUrl, ogType, ogTitle, ogDescription, ogUrl, ogImage, twitterTitle, twitterDescription, twitterImage, jsonLd, bodyContent }) {
  let html = template;

  // <title> 교체
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`
  );

  // <meta name="description"> 교체
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeAttr(description)}" />`
  );

  // <meta name="keywords"> 교체
  html = html.replace(
    /<meta name="keywords" content="[^"]*" \/>/,
    `<meta name="keywords" content="${escapeAttr(keywords)}" />`
  );

  // <link rel="canonical"> 교체
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`
  );

  // OG 태그 교체
  html = html.replace(
    /<meta property="og:type" content="[^"]*" \/>/,
    `<meta property="og:type" content="${escapeAttr(ogType || 'website')}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeAttr(ogTitle || title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeAttr(ogDescription || description)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${escapeAttr(ogUrl || canonicalUrl)}" />`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*" \/>/,
    `<meta property="og:image" content="${escapeAttr(ogImage || DEFAULT_OG_IMAGE)}" />`
  );

  // Twitter 태그 교체
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeAttr(twitterTitle || title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeAttr(twitterDescription || description)}" />`
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*" \/>/,
    `<meta name="twitter:image" content="${escapeAttr(twitterImage || ogImage || DEFAULT_OG_IMAGE)}" />`
  );

  // <div id="root"> 안에 SEO용 본문 콘텐츠 주입
  // React의 createRoot().render()가 마운트 시 이 내용을 대체함
  if (bodyContent) {
    html = html.replace(
      /<div id="root"><\/div>/,
      `<div id="root">${bodyContent}</div>`
    );
  }

  // JSON-LD 추가 (기존 JSON-LD 마지막 script 뒤에 삽입)
  if (jsonLd) {
    const jsonLdScript = `\n    <script type="application/ld+json">\n    ${JSON.stringify(jsonLd, null, 2).split('\n').join('\n    ')}\n    </script>`;
    // 마지막 </script> (JSON-LD 영역) 바로 전에 삽입 → </head> 앞에 삽입
    html = html.replace(
      /(\s*)<\/head>/,
      `${jsonLdScript}$1</head>`
    );
  }

  return html;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * HTML 속성값 이스케이프
 */
function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 크롤러용 본문 HTML 생성
 * React 마운트 시 대체되므로 스타일 없이 시맨틱 구조만 제공
 */
function buildBodyContent({ heading, description, breadcrumbs, extraText }) {
  const parts = [];

  // 네비게이션 (breadcrumb)
  if (breadcrumbs && breadcrumbs.length > 0) {
    const items = breadcrumbs
      .map((b) => `<a href="${escapeAttr(b.url)}">${escapeHtml(b.label)}</a>`)
      .join(' &gt; ');
    parts.push(`<nav aria-label="breadcrumb">${items}</nav>`);
  }

  // 제목
  if (heading) {
    parts.push(`<h1>${escapeHtml(heading)}</h1>`);
  }

  // 설명
  if (description) {
    parts.push(`<p>${escapeHtml(description)}</p>`);
  }

  // 추가 텍스트 (키워드 풍부화용)
  if (extraText) {
    parts.push(`<p>${escapeHtml(extraText)}</p>`);
  }

  return parts.join('\n');
}

/**
 * 디렉토리가 없으면 생성
 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 정적 파일 저장
 */
function writeHtmlFile(routePath, html) {
  const filePath = resolve(BUILD_DIR, routePath, 'index.html');
  ensureDir(dirname(filePath));
  writeFileSync(filePath, html, 'utf-8');
}

/**
 * 정적 페이지 생성 (이용약관, 개인정보처리방침)
 */
function generateStaticPages(template) {
  const staticPages = [
    {
      route: 'terms-of-service',
      title: '이용약관 | 나다운세',
      description: '나다운세 서비스 이용약관입니다. 서비스 이용 조건, 개인정보 처리, 결제 및 환불 정책 등을 확인하세요.',
      keywords: '나다운세, 이용약관, 서비스 약관, 운세 서비스 약관',
      heading: '나다운세 이용약관',
      extraText: '나다운세 서비스 이용 조건, 개인정보 처리, 결제 및 환불 정책에 대한 안내입니다.',
    },
    {
      route: 'privacy-policy',
      title: '개인정보처리방침 | 나다운세',
      description: '나다운세 개인정보처리방침입니다. 수집하는 개인정보, 이용 목적, 보관 기간 등을 확인하세요.',
      keywords: '나다운세, 개인정보처리방침, 개인정보 보호, 프라이버시',
      heading: '나다운세 개인정보처리방침',
      extraText: '나다운세에서 수집하는 개인정보 항목, 이용 목적, 보관 기간, 파기 절차에 대한 안내입니다.',
    },
  ];

  for (const page of staticPages) {
    const html = injectMetaTags(template, {
      title: page.title,
      description: page.description,
      keywords: page.keywords,
      canonicalUrl: `${SITE_URL}/${page.route}`,
      ogType: 'website',
      ogTitle: page.title,
      ogDescription: page.description,
      ogUrl: `${SITE_URL}/${page.route}`,
      ogImage: DEFAULT_OG_IMAGE,
      twitterTitle: page.title,
      twitterDescription: page.description,
      twitterImage: DEFAULT_OG_IMAGE,
      jsonLd: null,
      bodyContent: buildBodyContent({
        heading: page.heading,
        description: page.description,
        breadcrumbs: [
          { label: '홈', url: SITE_URL },
          { label: page.heading, url: `${SITE_URL}/${page.route}` },
        ],
        extraText: page.extraText,
      }),
    });

    writeHtmlFile(page.route, html);
    console.log(`[prerender] /${page.route}/index.html 생성 완료`);
  }
}

/**
 * 정적 sitemap.xml 생성
 * Edge Function rewrite 대신 정적 파일로 서빙하여 네이버 봇 접근 보장
 */
function generateSitemap(contents) {
  const today = new Date().toISOString().split('T')[0];

  // 정적 페이지
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: '/terms-of-service', changefreq: 'monthly', priority: '0.3' },
    { loc: '/privacy-policy', changefreq: 'monthly', priority: '0.3' },
  ];

  // 동적 콘텐츠 페이지
  const contentPages = contents.map((content) => {
    const urlPath = content.content_type === 'paid'
      ? `/product/${content.id}`
      : `/free/content/${content.id}`;
    return {
      loc: urlPath,
      changefreq: 'weekly',
      priority: content.content_type === 'paid' ? '0.9' : '0.8',
    };
  });

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

  const sitemapPath = resolve(BUILD_DIR, 'sitemap.xml');
  writeFileSync(sitemapPath, xml, 'utf-8');
  console.log(`[prerender] sitemap.xml 생성 완료 (${allPages.length}개 URL)`);
}

/**
 * 콘텐츠 페이지 생성
 */
function generateContentPages(template, contents) {
  let paidCount = 0;
  let freeCount = 0;

  for (const content of contents) {
    const isPaid = content.content_type === 'paid';
    const isFree = content.content_type === 'free';

    // 경로 결정
    const route = isPaid
      ? `product/${content.id}`
      : `free/content/${content.id}`;

    // 제목 생성
    const titlePrefix = isFree ? '[무료] ' : '';
    const pageTitle = `${titlePrefix}${content.title} | 나다운세`;

    // description (없으면 기본값)
    const pageDescription = content.description
      || `${content.title} - 나다운세에서 AI 운세를 확인하세요.`;

    // keywords
    const baseKeywords = '나다운세, 운세, AI 운세, 사주, 타로';
    const typeKeywords = isPaid
      ? '유료 운세, 프리미엄 운세, 사주풀이, 신년운세'
      : '무료운세, 무료사주, 무료타로, 무료 운세 콘텐츠';
    const keywords = `${content.title}, ${baseKeywords}, ${typeKeywords}`;

    // OG 이미지
    const ogImage = content.thumbnail_url || DEFAULT_OG_IMAGE;

    // Product JSON-LD (유료 콘텐츠만)
    const jsonLd = isPaid ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: content.title,
      description: pageDescription,
      image: ogImage,
      brand: {
        '@type': 'Brand',
        name: '나다운세',
      },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/${route}`,
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
      },
    } : null;

    // SEO 본문 콘텐츠 생성
    const contentTypeLabel = isPaid ? '프리미엄 운세' : '무료 운세';
    const breadcrumbs = isPaid
      ? [
          { label: '홈', url: SITE_URL },
          { label: '운세 콘텐츠', url: `${SITE_URL}/#contents` },
          { label: content.title, url: `${SITE_URL}/${route}` },
        ]
      : [
          { label: '홈', url: SITE_URL },
          { label: '무료 운세', url: `${SITE_URL}/free` },
          { label: content.title, url: `${SITE_URL}/${route}` },
        ];

    const extraText = isPaid
      ? `나다운세 ${contentTypeLabel} - AI가 분석하는 사주풀이, 타로, 신년운세. 정확하고 깊이 있는 운세 결과를 확인하세요.`
      : `나다운세 ${contentTypeLabel} - 무료로 체험하는 AI 운세. 사주, 타로, 오늘의 운세를 지금 바로 확인하세요.`;

    const html = injectMetaTags(template, {
      title: pageTitle,
      description: pageDescription,
      keywords,
      canonicalUrl: `${SITE_URL}/${route}`,
      ogType: isPaid ? 'product' : 'article',
      ogTitle: pageTitle,
      ogDescription: pageDescription,
      ogUrl: `${SITE_URL}/${route}`,
      ogImage,
      twitterTitle: pageTitle,
      twitterDescription: pageDescription,
      twitterImage: ogImage,
      jsonLd,
      bodyContent: buildBodyContent({
        heading: `${titlePrefix}${content.title}`,
        description: pageDescription,
        breadcrumbs,
        extraText,
      }),
    });

    writeHtmlFile(route, html);

    if (isPaid) paidCount++;
    else freeCount++;
  }

  console.log(`[prerender] 유료 콘텐츠 ${paidCount}개, 무료 콘텐츠 ${freeCount}개 HTML 생성 완료`);
}

/**
 * 메인 실행
 */
async function main() {
  console.log('[prerender] 프리렌더 시작...');

  // 1. build/index.html 템플릿 읽기
  const templatePath = resolve(BUILD_DIR, 'index.html');
  if (!existsSync(templatePath)) {
    console.error('[prerender] build/index.html이 없습니다. vite build를 먼저 실행하세요.');
    process.exit(1);
  }
  const template = readFileSync(templatePath, 'utf-8');

  // 2. 정적 페이지 생성
  generateStaticPages(template);

  // 3. Supabase에서 콘텐츠 조회
  const contents = await fetchDeployedContents();

  // 4. 콘텐츠 페이지 생성
  if (contents.length > 0) {
    generateContentPages(template, contents);
  }

  // 5. 정적 sitemap.xml 생성 (Edge Function rewrite 대신 정적 파일로 서빙)
  generateSitemap(contents);

  console.log('[prerender] 프리렌더 완료!');
}

main().catch((error) => {
  console.error('[prerender] 예기치 않은 오류:', error.message);
  // 빌드 실패시키지 않음 - 기존 SPA 동작 유지
  process.exit(0);
});
