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
function injectMetaTags(template, { title, description, keywords, canonicalUrl, ogType, ogTitle, ogDescription, ogUrl, ogImage, twitterTitle, twitterDescription, twitterImage, jsonLd, bodyContent, isHomePage }) {
  let html = template;

  // 홈페이지가 아닌 페이지에서는 템플릿의 기존 JSON-LD(WebSite, FAQPage, Organization) 제거
  // 홈페이지에만 사이트 전체 스키마를 유지하고, 개별 페이지는 페이지별 스키마만 사용
  if (!isHomePage) {
    html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  }

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

  // JSON-LD 추가 (단일 객체 또는 배열 지원)
  if (jsonLd) {
    const jsonLdItems = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    const jsonLdScripts = jsonLdItems
      .filter(Boolean)
      .map(item => `\n    <script type="application/ld+json">\n    ${JSON.stringify(item, null, 2).split('\n').join('\n    ')}\n    </script>`)
      .join('');
    html = html.replace(
      /(\s*)<\/head>/,
      `${jsonLdScripts}$1</head>`
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
 *
 * @param {Object} options
 * @param {string} options.heading - h1 제목
 * @param {string} options.description - 페이지 설명
 * @param {Array} options.breadcrumbs - 브레드크럼 [{label, url}]
 * @param {string} options.extraText - 추가 텍스트
 * @param {boolean} options.isArticle - article 태그로 감쌀지 여부
 * @param {string} options.subHeading - h2 부제목
 * @param {Array} options.contentList - 콘텐츠 목록 [{title, url, description}] (홈페이지용)
 * @param {Array} options.internalLinks - 내부 링크 [{label, url}]
 * @param {string} options.rawHtmlContent - 이미 HTML인 본문 콘텐츠 (블로그 글 등, 이스케이프 없이 삽입)
 */
function buildBodyContent({ heading, description, breadcrumbs, extraText, isArticle, subHeading, contentList, internalLinks, rawHtmlContent }) {
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

  // 부제목
  if (subHeading) {
    parts.push(`<h2>${escapeHtml(subHeading)}</h2>`);
  }

  // 추가 텍스트 (키워드 풍부화용)
  if (extraText) {
    parts.push(`<p>${escapeHtml(extraText)}</p>`);
  }

  // 콘텐츠 목록 (홈페이지용)
  if (contentList && contentList.length > 0) {
    const listItems = contentList
      .map((item) => {
        const desc = item.description ? ` - ${escapeHtml(item.description)}` : '';
        return `<li><a href="${escapeAttr(item.url)}">${escapeHtml(item.title)}</a>${desc}</li>`;
      })
      .join('\n');
    parts.push(`<ul>\n${listItems}\n</ul>`);
  }

  // 블로그 본문 HTML (이미 HTML이므로 이스케이프 없이 삽입)
  if (rawHtmlContent) {
    parts.push(`<div class="blog-content">${rawHtmlContent}</div>`);
  }

  // 내부 링크
  if (internalLinks && internalLinks.length > 0) {
    const links = internalLinks
      .map((link) => `<a href="${escapeAttr(link.url)}">${escapeHtml(link.label)}</a>`)
      .join(' | ');
    parts.push(`<nav aria-label="관련 콘텐츠">${links}</nav>`);
  }

  const content = parts.join('\n');

  // article 태그로 감싸기 (콘텐츠 페이지)
  if (isArticle) {
    return `<article>${content}</article>`;
  }

  return content;
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
    {
      route: 'manse',
      title: '무료 만세력 - 사주팔자 원국 대운 세운 조회 | 나다운세',
      description: '생년월일시로 사주팔자 원국, 오행, 대운, 세운을 무료로 확인하세요. 일주론, 용신, 물상론까지 AI가 분석해드립니다.',
      keywords: '만세력, 무료만세력, 사주만세력, 사주팔자, 원국, 대운, 세운, 오행, 일주론, 용신',
      heading: '무료 만세력 - 사주팔자 원국 대운 세운 조회',
      extraText: '생년월일시를 입력하면 사주팔자 원국, 오행 분포, 대운, 세운을 무료로 조회할 수 있습니다. AI가 일주론, 용신, 물상론까지 분석해드립니다.',
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
function generateSitemap(contents, blogPosts = []) {
  const today = new Date().toISOString().split('T')[0];

  // 정적 페이지
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: '/blog', changefreq: 'weekly', priority: '0.7', lastmod: today },
    { loc: '/manse', changefreq: 'monthly', priority: '0.8', lastmod: today },
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
      lastmod: today,
    };
  });

  // 블로그 글 페이지 (published_at을 lastmod로 활용)
  const blogPages = blogPosts.map((post) => ({
    loc: `/blog/${post.slug}`,
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: post.published_at ? post.published_at.split('T')[0] : today,
  }));

  const allPages = [...staticPages, ...contentPages, ...blogPages];

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
 * RSS 2.0 피드 생성
 * 네이버 서치어드바이저 RSS 제출용 + 검색엔진 콘텐츠 발견 촉진
 */
function generateRssFeed(blogPosts = []) {
  if (blogPosts.length === 0) {
    console.log('[prerender] 블로그 글 없음 - RSS 생성 건너뜀');
    return;
  }

  const buildDate = new Date().toUTCString();

  const items = blogPosts.slice(0, 50).map((post) => {
    const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : buildDate;
    const link = `${SITE_URL}/blog/${post.slug}`;
    const description = post.excerpt || post.meta_description || post.title;

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
  }).join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>나다운세 - 운세 콘텐츠</title>
    <link>${SITE_URL}</link>
    <description>사주, 타로, 운세에 대한 유용한 정보를 만나보세요. AI가 분석하는 사주풀이, 타로, 궁합, 신년운세.</description>
    <language>ko</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  const rssPath = resolve(BUILD_DIR, 'rss.xml');
  writeFileSync(rssPath, rssXml, 'utf-8');
  console.log(`[prerender] rss.xml 생성 완료 (${Math.min(blogPosts.length, 50)}개 글)`);
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

    // description (없으면 제목 + 타입 기반 고유 설명 생성)
    const fallbackDesc = isPaid
      ? `${content.title} - AI가 분석하는 프리미엄 운세. 사주팔자 기반 정확한 풀이를 나다운세에서 확인하세요.`
      : `${content.title} - 무료로 체험하는 AI 운세. 나다운세에서 지금 바로 확인해보세요.`;
    const pageDescription = content.description || fallbackDesc;

    // keywords
    const baseKeywords = '나다운세, 운세, AI 운세, 사주, 타로';
    const typeKeywords = isPaid
      ? '유료 운세, 프리미엄 운세, 사주풀이, 신년운세'
      : '무료운세, 무료사주, 무료타로, 무료 운세 콘텐츠';
    const keywords = `${content.title}, ${baseKeywords}, ${typeKeywords}`;

    // OG 이미지
    const ogImage = content.thumbnail_url || DEFAULT_OG_IMAGE;

    // BreadcrumbList JSON-LD (모든 콘텐츠 페이지)
    const breadcrumbItems = isPaid
      ? [
          { position: 1, name: '홈', item: `${SITE_URL}/` },
          { position: 2, name: '운세 콘텐츠', item: `${SITE_URL}/#contents` },
          { position: 3, name: content.title, item: `${SITE_URL}/${route}` },
        ]
      : [
          { position: 1, name: '홈', item: `${SITE_URL}/` },
          { position: 2, name: '무료 운세', item: `${SITE_URL}/free` },
          { position: 3, name: content.title, item: `${SITE_URL}/${route}` },
        ];

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((b) => ({
        '@type': 'ListItem',
        position: b.position,
        name: b.name,
        item: b.item,
      })),
    };

    // Product JSON-LD (유료 콘텐츠만) + BreadcrumbList (모두)
    const productJsonLd = isPaid ? {
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

    const jsonLd = [breadcrumbJsonLd, productJsonLd].filter(Boolean);

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

    // 내부 링크 (같은 타입의 다른 콘텐츠 최대 5개)
    const relatedContents = contents
      .filter((c) => c.id !== content.id && c.content_type === content.content_type)
      .slice(0, 5)
      .map((c) => {
        const relRoute = c.content_type === 'paid' ? `/product/${c.id}` : `/free/content/${c.id}`;
        return { label: c.title, url: `${SITE_URL}${relRoute}` };
      });

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
        isArticle: true,
        subHeading: `${contentTypeLabel} 상세`,
        internalLinks: relatedContents,
      }),
    });

    writeHtmlFile(route, html);

    if (isPaid) paidCount++;
    else freeCount++;
  }

  console.log(`[prerender] 유료 콘텐츠 ${paidCount}개, 무료 콘텐츠 ${freeCount}개 HTML 생성 완료`);
}

/**
 * Supabase REST API로 published 블로그 글 조회
 */
async function fetchPublishedBlogPosts() {
  if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY) {
    console.warn('[prerender] Supabase 환경변수 미설정 - 블로그 프리렌더 건너뜀');
    return [];
  }

  const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/blog_posts?status=eq.published&select=id,title,slug,excerpt,content,thumbnail_url,category,meta_title,meta_description,published_at&order=published_at.desc`;

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
    console.log(`[prerender] 블로그 글 조회 완료: ${data.length}개`);
    return data;
  } catch (error) {
    console.warn(`[prerender] 블로그 글 조회 실패: ${error.message}`);
    return [];
  }
}

/**
 * 블로그 목록 페이지 프리렌더
 */
function generateBlogListPage(template, blogPosts) {
  const blogTitle = '운세 콘텐츠 | 나다운세';
  const blogDescription = '사주, 타로, 운세에 대한 유용한 정보를 만나보세요. 나다운세 블로그에서 운세 꿀팁과 사주 이야기를 확인하세요.';
  const blogKeywords = '사주 이야기, 타로 가이드, 운세 꿀팁, 사주풀이 팁, 타로 카드 의미, 나다운세 블로그';

  // ItemList JSON-LD
  const itemListJsonLd = blogPosts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '나다운세 운세 콘텐츠',
    description: blogDescription,
    numberOfItems: blogPosts.length,
    itemListElement: blogPosts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
    })),
  } : null;

  // SEO body content
  const contentList = blogPosts.map((post) => ({
    title: post.title,
    url: `${SITE_URL}/blog/${post.slug}`,
    description: post.excerpt || '',
  }));

  const html = injectMetaTags(template, {
    title: blogTitle,
    description: blogDescription,
    keywords: blogKeywords,
    canonicalUrl: `${SITE_URL}/blog`,
    ogType: 'website',
    ogTitle: blogTitle,
    ogDescription: blogDescription,
    ogUrl: `${SITE_URL}/blog`,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: blogTitle,
    twitterDescription: blogDescription,
    twitterImage: DEFAULT_OG_IMAGE,
    jsonLd: itemListJsonLd,
    bodyContent: buildBodyContent({
      heading: '운세 콘텐츠',
      description: blogDescription,
      subHeading: blogPosts.length > 0 ? `${blogPosts.length}개의 글` : null,
      contentList,
    }),
  });

  writeHtmlFile('blog', html);
  console.log(`[prerender] /blog/index.html 생성 완료 (${blogPosts.length}개 글 목록)`);
}

/**
 * 블로그 상세 페이지 프리렌더
 */
function generateBlogDetailPages(template, blogPosts) {
  for (const post of blogPosts) {
    const pageTitle = (post.meta_title || post.title) + ' | 나다운세';
    const pageDescription = post.meta_description || post.excerpt || `${post.title} - 나다운세 운세 콘텐츠`;
    const pageKeywords = `${post.title}, 나다운세, 운세, 사주, 타로, 운세 콘텐츠`;
    const ogImage = post.thumbnail_url || DEFAULT_OG_IMAGE;
    const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

    // BreadcrumbList JSON-LD
    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '운세 콘텐츠', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
      ],
    };

    // Article JSON-LD
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: pageDescription,
      image: ogImage,
      datePublished: post.published_at,
      author: {
        '@type': 'Organization',
        name: '나다운세',
      },
      publisher: {
        '@type': 'Organization',
        name: '나다운세',
        url: SITE_URL,
      },
      mainEntityOfPage: canonicalUrl,
    };

    // 관련 글 링크 (최대 5개)
    const relatedPosts = blogPosts
      .filter((p) => p.id !== post.id)
      .slice(0, 5)
      .map((p) => ({ label: p.title, url: `${SITE_URL}/blog/${p.slug}` }));

    const html = injectMetaTags(template, {
      title: pageTitle,
      description: pageDescription,
      keywords: pageKeywords,
      canonicalUrl,
      ogType: 'article',
      ogTitle: pageTitle,
      ogDescription: pageDescription,
      ogUrl: canonicalUrl,
      ogImage,
      twitterTitle: pageTitle,
      twitterDescription: pageDescription,
      twitterImage: ogImage,
      jsonLd: [breadcrumbJsonLd, articleJsonLd],
      bodyContent: buildBodyContent({
        heading: post.title,
        description: pageDescription,
        breadcrumbs: [
          { label: '홈', url: SITE_URL },
          { label: '운세 콘텐츠', url: `${SITE_URL}/blog` },
          { label: post.title, url: canonicalUrl },
        ],
        isArticle: true,
        rawHtmlContent: post.content,
        internalLinks: relatedPosts,
      }),
    });

    writeHtmlFile(`blog/${post.slug}`, html);
  }

  console.log(`[prerender] 블로그 상세 ${blogPosts.length}개 HTML 생성 완료`);
}

/**
 * 홈페이지 프리렌더 생성
 * ItemList JSON-LD로 콘텐츠 목록을 구조화 데이터로 노출
 * SEO body content로 주요 콘텐츠 목록을 HTML로 삽입
 */
function generateHomePage(template, contents, blogPosts = []) {
  const paidContents = contents.filter((c) => c.content_type === 'paid');
  const freeContents = contents.filter((c) => c.content_type === 'free');

  // ItemList JSON-LD: 모든 콘텐츠를 구조화 데이터로 노출
  const allItems = contents.map((content, index) => {
    const urlPath = content.content_type === 'paid'
      ? `/product/${content.id}`
      : `/free/content/${content.id}`;
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: content.title,
      url: `${SITE_URL}${urlPath}`,
    };
  });

  const itemListJsonLd = contents.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '나다운세 운세 콘텐츠',
    description: 'AI가 분석하는 사주, 타로, 운세 콘텐츠 모음',
    numberOfItems: contents.length,
    itemListElement: allItems,
  } : null;

  // 콘텐츠 목록 (SEO body용)
  const contentList = [];

  // 유료 콘텐츠
  for (const c of paidContents) {
    contentList.push({
      title: c.title,
      url: `${SITE_URL}/product/${c.id}`,
      description: c.description || 'AI 프리미엄 운세',
    });
  }

  // 무료 콘텐츠
  for (const c of freeContents) {
    contentList.push({
      title: `[무료] ${c.title}`,
      url: `${SITE_URL}/free/content/${c.id}`,
      description: c.description || '무료 AI 운세',
    });
  }

  const homeTitle = '나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이 · 신년운세';
  const homeDescription = '무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 오늘의운세, 사주풀이까지 나다운세에서 만나보세요.';
  const homeKeywords = '나다운세, 운세, 무료사주, 무료운세, 신년운세, 사주, 타로, 궁합, 오늘의운세, 띠별오늘의운세, 띠별운세, AI 운세, 별자리운세, 챗지피티사주, 챗gpt사주, 사주GPT, 신점, 사주팔자, 사주풀이, 인터넷사주, 자기이해';

  const html = injectMetaTags(template, {
    title: homeTitle,
    description: homeDescription,
    keywords: homeKeywords,
    canonicalUrl: `${SITE_URL}/`,
    ogType: 'website',
    ogTitle: homeTitle,
    ogDescription: homeDescription,
    ogUrl: `${SITE_URL}/`,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: homeTitle,
    twitterDescription: homeDescription,
    twitterImage: DEFAULT_OG_IMAGE,
    isHomePage: true,
    jsonLd: itemListJsonLd,
    bodyContent: buildBodyContent({
      heading: '나다운세 - AI 운세 서비스',
      description: homeDescription,
      subHeading: paidContents.length > 0 ? `운세 콘텐츠 ${contents.length}개` : null,
      extraText: 'AI가 분석하는 사주풀이, 타로, 궁합, 신년운세. 무료운세부터 프리미엄 운세까지 나다운세에서 만나보세요.',
      contentList,
      internalLinks: blogPosts.slice(0, 5).map((post) => ({
        label: post.title,
        url: `${SITE_URL}/blog/${post.slug}`,
      })),
    }),
  });

  // 홈페이지는 build/index.html을 직접 덮어쓰기
  const homePath = resolve(BUILD_DIR, 'index.html');
  writeFileSync(homePath, html, 'utf-8');
  console.log(`[prerender] 홈페이지 index.html 프리렌더 완료 (콘텐츠 ${contents.length}개 목록 포함)`);
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

  // 5. 블로그 글 조회 + 프리렌더
  const blogPosts = await fetchPublishedBlogPosts();
  if (blogPosts.length > 0) {
    generateBlogListPage(template, blogPosts);
    generateBlogDetailPages(template, blogPosts);
  }

  // 6. 홈페이지 프리렌더 (ItemList JSON-LD + SEO body content + 블로그 링크)
  generateHomePage(template, contents, blogPosts);

  // 7. 정적 sitemap.xml 생성 (Edge Function rewrite 대신 정적 파일로 서빙)
  generateSitemap(contents, blogPosts);

  // 8. RSS 피드 생성 (네이버 서치어드바이저 + 검색엔진 콘텐츠 발견용)
  generateRssFeed(blogPosts);

  console.log('[prerender] 프리렌더 완료!');
}

main().catch((error) => {
  console.error('[prerender] 예기치 않은 오류:', error.message);
  // 빌드 실패시키지 않음 - 기존 SPA 동작 유지
  process.exit(0);
});
