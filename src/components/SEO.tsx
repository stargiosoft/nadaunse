import { Helmet } from 'react-helmet-async';

interface ProductJsonLd {
  name: string;
  description: string;
  image?: string;
  price?: number;
  priceCurrency?: string;
}

interface ArticleJsonLd {
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
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
  article?: ArticleJsonLd;
}

const DEFAULT_TITLE = '나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이';
const DEFAULT_DESCRIPTION = 'AI사주 · 무료타로 · 궁합 · 생년월일운세를 정확하게 풀어드립니다. 무료사주풀이사이트 나다운세에서 타로카드뽑기, 사주연애운, 이직운세까지 무료로 만나보세요.';
const DEFAULT_KEYWORDS = '나다운세, 운세, 무료사주, 무료운세, 신년운세, 사주, 타로, 궁합, 오늘의운세, 띠별오늘의운세, 띠별운세, AI 운세, 별자리운세, 챗지피티사주, 챗gpt사주, 사주GPT, 신점, 사주팔자, 사주풀이, 인터넷사주, 자기이해, AI사주, 무료사주풀이사이트, 온라인사주추천, 생년월일운세, 무료타로사이트, 사주연애운, 사주결혼시기, 이직운세, 타로카드뽑기, 비대면사주, 무료운세사이트, 사주잘보는곳, 타로연애운, AI타로, 무료궁합, 사주재물운, 오늘타로운세';
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
  article,
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

  // Article JSON-LD 스키마 생성
  const articleJsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: article.image || ogImage,
    datePublished: article.datePublished,
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

      {/* Article JSON-LD */}
      {articleJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
