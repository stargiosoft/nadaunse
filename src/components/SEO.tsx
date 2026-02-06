import { Helmet } from 'react-helmet-async';

interface ProductJsonLd {
  name: string;
  description: string;
  image?: string;
  price?: number;
  priceCurrency?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noIndex?: boolean;
  product?: ProductJsonLd;
}

const DEFAULT_TITLE = '나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이';
const DEFAULT_DESCRIPTION = '무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 띠별운세, 오늘의운세, 별자리운세까지 나다운세에서 무료로 만나보세요.';
const DEFAULT_KEYWORDS = '나다운세, 운세, 무료사주, 무료운세, 신년운세, 사주, 타로, 궁합, 오늘의운세, 띠별오늘의운세, 띠별운세, AI 운세, 별자리운세, 챗지피티사주, 챗gpt사주, 사주GPT, 신점, 사주팔자, 사주풀이, 인터넷사주, 자기이해';
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
  product,
}: SEOProps) {
  const fullTitle = title ? `${title} | 나다운세` : DEFAULT_TITLE;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  // Product JSON-LD 스키마 생성
  const productJsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || ogImage,
    brand: {
      '@type': 'Brand',
      name: '나다운세'
    },
    offers: {
      '@type': 'Offer',
      price: product.price || 0,
      priceCurrency: product.priceCurrency || 'KRW',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl
    }
  } : null;

  return (
    <Helmet>
      {/* 기본 메타 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords || DEFAULT_KEYWORDS} />

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

      {/* Product JSON-LD */}
      {productJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
