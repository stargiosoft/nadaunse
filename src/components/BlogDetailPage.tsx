import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { NavigationHeader } from './NavigationHeader';
import SEO from './SEO';

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  category: string | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  view_count: number;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  published_at: string | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 스켈레톤
function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-[16px] px-[20px]" style={{ paddingTop: '68px' }}>
      {/* 썸네일 스켈레톤 */}
      <div
        className="w-full rounded-[16px] animate-shimmer"
        style={{
          height: '200px',
          backgroundColor: '#f0f0f0',
          backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
        }}
      />
      {/* 제목 스켈레톤 */}
      <div
        className="rounded-[4px] animate-shimmer"
        style={{
          width: '80%',
          height: '24px',
          backgroundColor: '#f0f0f0',
          backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
        }}
      />
      {/* 날짜 스켈레톤 */}
      <div
        className="rounded-[4px] animate-shimmer"
        style={{
          width: '30%',
          height: '14px',
          backgroundColor: '#f0f0f0',
          backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
        }}
      />
      {/* 본문 스켈레톤 */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="rounded-[4px] animate-shimmer"
          style={{
            width: i % 3 === 0 ? '100%' : i % 3 === 1 ? '90%' : '70%',
            height: '14px',
            backgroundColor: '#f0f0f0',
            backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  async function fetchPost(postSlug: string) {
    setLoading(true);
    setNotFound(false);
    setRelatedPosts([]);

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, content, thumbnail_url, category, tags, meta_title, meta_description, published_at, view_count')
        .eq('slug', postSlug)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        setNotFound(true);
        setPost(null);
      } else {
        setPost(data);
        incrementViewCount(data.id);
        fetchRelatedPosts(data.id, data.category);
      }
    } catch (err) {
      console.error('블로그 글 조회 실패:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelatedPosts(currentId: string, category: string | null) {
    try {
      let query = supabase
        .from('blog_posts')
        .select('id, title, slug, thumbnail_url, published_at')
        .eq('status', 'published')
        .neq('id', currentId)
        .limit(3);

      if (category) {
        query = query.eq('category', category);
      }

      // view_count 순으로 정렬
      const { data, error } = await query.order('view_count', { ascending: false });

      if (error || !data || data.length === 0) {
        // fallback: 카테고리 무관 최신순
        const { data: fallbackData } = await supabase
          .from('blog_posts')
          .select('id, title, slug, thumbnail_url, published_at')
          .eq('status', 'published')
          .neq('id', currentId)
          .order('published_at', { ascending: false })
          .limit(3);

        setRelatedPosts(fallbackData || []);
      } else {
        setRelatedPosts(data);
      }
    } catch {
      // 관련 글 조회 실패 무시
    }
  }

  async function incrementViewCount(postId: string) {
    try {
      await supabase.rpc('increment_blog_view_count', { post_id: postId });
    } catch {
      // 조회수 증가 실패 무시
    }
  }

  // cross-links: relatedPosts 로드 후 blog-content 하단에 "함께 읽어보세요" 삽입
  const handleCrossLinkClick = useCallback((e: Event) => {
    const target = e.currentTarget as HTMLAnchorElement;
    const href = target.getAttribute('href');
    if (href && href.startsWith('/blog/')) {
      e.preventDefault();
      navigate(href);
    }
  }, [navigate]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || relatedPosts.length === 0) return;

    // 이미 삽입되어 있으면 제거
    const existing = contentEl.querySelector('.blog-crosslinks');
    if (existing) existing.remove();

    // 크로스링크 블록 생성
    const crosslinksDiv = document.createElement('div');
    crosslinksDiv.className = 'blog-crosslinks';

    const heading = document.createElement('p');
    heading.textContent = '함께 읽어보세요';
    crosslinksDiv.appendChild(heading);

    const ul = document.createElement('ul');
    relatedPosts.forEach((rp) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `/blog/${rp.slug}`;
      a.textContent = rp.title;
      a.addEventListener('click', handleCrossLinkClick);
      li.appendChild(a);
      ul.appendChild(li);
    });
    crosslinksDiv.appendChild(ul);

    contentEl.appendChild(crosslinksDiv);

    // 클린업: 이벤트 리스너 제거
    return () => {
      const links = crosslinksDiv.querySelectorAll('a');
      links.forEach((a) => a.removeEventListener('click', handleCrossLinkClick));
      crosslinksDiv.remove();
    };
  }, [relatedPosts, handleCrossLinkClick]);

  const handleBack = () => {
    navigate('/blog');
  };

  // SEO 메타 정보
  const seoTitle = post?.meta_title || post?.title || '운세 콘텐츠';
  const seoDescription = post?.meta_description || post?.excerpt || '나다운세 운세 콘텐츠';

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={slug ? `/blog/${slug}` : undefined}
        ogType="article"
        ogImage={post?.thumbnail_url || undefined}
        article={post ? {
          headline: post.title,
          description: seoDescription,
          image: post.thumbnail_url || undefined,
          datePublished: post.published_at || undefined,
        } : undefined}
      />

      <div className="w-full max-w-[440px] mx-auto flex flex-col h-full">
        <NavigationHeader title="운세 콘텐츠" onBack={handleBack} />

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto" style={{ paddingTop: '60px' }}>
          {loading ? (
            <DetailSkeleton />
          ) : notFound ? (
            // 404
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 13l6-6M9 7l6 6" stroke="#E7E7E7" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontSize: '15px',
                fontWeight: 400,
                color: '#999999',
                marginTop: '16px',
                lineHeight: '22px',
              }}>
                글을 찾을 수 없어요
              </p>
              <button
                onClick={() => navigate('/blog')}
                className="cursor-pointer"
                style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#48b2af',
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f0f8f8',
                  border: 'none',
                }}
              >
                목록으로 돌아가기
              </button>
            </div>
          ) : post ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* 썸네일 */}
              {post.thumbnail_url && (
                <div className="w-full overflow-hidden transform-gpu">
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="block w-full object-cover"
                    style={{ maxHeight: '240px' }}
                    loading="eager"
                  />
                </div>
              )}

              {/* 헤더 영역 */}
              <div className="px-[20px] py-[20px]">
                {/* 제목 */}
                <h1 style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  lineHeight: '28px',
                  letterSpacing: '-0.4px',
                }}>
                  {post.title}
                </h1>

                {/* 날짜 + 조회수 */}
                <div className="flex items-center gap-[8px]" style={{ marginTop: '8px' }}>
                  <span style={{
                    fontFamily: 'Pretendard Variable',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: '#aaaaaa',
                  }}>
                    {formatDate(post.published_at)}
                  </span>
                </div>
              </div>

              {/* 본문 - HTML 렌더링 (cross-links가 여기에 DOM 삽입됨) */}
              <div
                ref={contentRef}
                className="blog-content px-[20px] pb-[40px]"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* 관련 글 추천 */}
              {relatedPosts.length > 0 && (
                <div className="px-[20px] pb-[24px]">
                  <p style={{
                    fontFamily: 'Pretendard Variable',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '14px',
                  }}>
                    관련 글
                  </p>
                  <div className="flex flex-col gap-[12px]">
                    {relatedPosts.map((rp) => (
                      <a
                        key={rp.id}
                        href={`/blog/${rp.slug}`}
                        onClick={(e) => { e.preventDefault(); navigate(`/blog/${rp.slug}`); }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div
                          className="flex items-center gap-[12px] rounded-[12px] cursor-pointer overflow-hidden transform-gpu"
                          style={{ backgroundColor: '#fafafa', padding: '10px' }}
                        >
                          {rp.thumbnail_url && (
                            <div
                              className="shrink-0 rounded-[8px] overflow-hidden transform-gpu"
                              style={{ width: '60px', height: '60px' }}
                            >
                              <img
                                src={rp.thumbnail_url}
                                alt={rp.title}
                                className="block w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p style={{
                              fontFamily: 'Pretendard Variable',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#2a2a2a',
                              lineHeight: '20px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {rp.title}
                            </p>
                            <p style={{
                              fontFamily: 'Pretendard Variable',
                              fontSize: '12px',
                              fontWeight: 400,
                              color: '#aaaaaa',
                              marginTop: '4px',
                            }}>
                              {formatDate(rp.published_at)}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 하단 구분선 + 목록 링크 */}
              <div className="px-[20px] pb-[40px]">
                <div style={{ height: '1px', backgroundColor: '#f0f0f0' }} />
                <a
                  href="/blog"
                  onClick={(e) => { e.preventDefault(); navigate('/blog'); }}
                  className="block w-full cursor-pointer"
                  style={{
                    fontFamily: 'Pretendard Variable',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#48b2af',
                    marginTop: '20px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#f0f8f8',
                    border: 'none',
                    textAlign: 'center',
                    textDecoration: 'none',
                  }}
                >
                  전체 글 보기
                </a>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
