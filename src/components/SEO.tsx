import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = '나다운세 - AI 사주 타로 운세';
const DEFAULT_DESCRIPTION = 'AI가 분석하는 나만의 사주와 타로 운세. 무료 체험부터 심화 해석까지, 나다운 운세를 만나보세요.';
const DEFAULT_OG_IMAGE = 'https://hyltbeewxaqashyivilu.supabase.co/storage/v1/object/public/assets/OG%20image/OG%20KakaoTalk.png';
const SITE_URL = 'https://nadaunse.com';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonical,
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | 나다운세` : DEFAULT_TITLE;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      {/* 기본 메타 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* 검색엔진 제어 */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="나다운세" />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

export default SEO;
