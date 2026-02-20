import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { NavigationHeader } from './NavigationHeader';
import SEO from './SEO';
import { trackPageView } from '../utils/analytics';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  category: string | null;
}

interface BlogListPageProps {
  onBack: () => void;
}

const CACHE_KEY = 'blog_posts_cache_v1';
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 카테고리 라벨 매핑
const CATEGORY_LABELS: Record<string, string> = {
  saju: '사주',
  tarot: '타로',
  tip: '꿀팁',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 스켈레톤 카드
function SkeletonCard() {
  return (
    <div className="flex gap-[12px] px-[16px] py-[12px]">
      <div
        className="shrink-0 rounded-[12px] animate-shimmer"
        style={{
          width: '88px',
          height: '88px',
          backgroundColor: '#f0f0f0',
          backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
        }}
      />
      <div className="flex-1 flex flex-col justify-center gap-[8px]">
        <div
          className="rounded-[4px] animate-shimmer"
          style={{
            width: '70%',
            height: '18px',
            backgroundColor: '#f0f0f0',
            backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
          }}
        />
        <div
          className="rounded-[4px] animate-shimmer"
          style={{
            width: '100%',
            height: '14px',
            backgroundColor: '#f0f0f0',
            backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
          }}
        />
        <div
          className="rounded-[4px] animate-shimmer"
          style={{
            width: '40%',
            height: '12px',
            backgroundColor: '#f0f0f0',
            backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </div>
  );
}

// 빈 상태 아이콘
function EmptyIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7h8M8 11h5" stroke="#E7E7E7" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BlogListPage({ onBack }: BlogListPageProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('/blog', '운세 콘텐츠');
    fetchPosts();
  }, []);

  async function fetchPosts() {
    // localStorage 캐시 체크
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setPosts(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // 캐시 파싱 실패 무시
    }

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, thumbnail_url, published_at, category')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('블로그 글 조회 실패:', error);
        setPosts([]);
      } else {
        setPosts(data || []);
        // 캐시 저장
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: data || [],
            timestamp: Date.now(),
          }));
        } catch {
          // localStorage 용량 초과 무시
        }
      }
    } catch (err) {
      console.error('블로그 글 조회 중 오류:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <SEO
        title="운세 콘텐츠"
        description="사주, 타로, 운세에 대한 유용한 정보를 만나보세요. 나다운세 블로그에서 운세 꿀팁과 사주 이야기를 확인하세요."
        keywords="사주 이야기, 타로 가이드, 운세 꿀팁, 사주풀이 팁, 타로 카드 의미"
        canonical="/blog"
        ogType="website"
      />

      <div className="w-full max-w-[440px] mx-auto flex flex-col h-full">
        <NavigationHeader title="운세 콘텐츠" onBack={onBack} />

        {/* 스크롤 영역 - NavigationHeader 높이(60px) 만큼 패딩 */}
        <div className="flex-1 overflow-y-auto" style={{ paddingTop: '60px' }}>
          {loading ? (
            // 스켈레톤 로딩
            <div className="flex flex-col">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            // 빈 상태
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
              <EmptyIcon />
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontSize: '15px',
                fontWeight: 400,
                color: '#999999',
                marginTop: '16px',
                lineHeight: '22px',
              }}>
                아직 준비된 콘텐츠가 없어요
              </p>
            </div>
          ) : (
            // 글 목록
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {posts.map((post, index) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  onClick={(e) => { e.preventDefault(); navigate(`/blog/${post.slug}`); }}
                  className="no-underline"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                <motion.div
                  className="flex gap-[12px] px-[16px] py-[12px] cursor-pointer active:bg-[#f9f9f9] transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  {/* 썸네일 */}
                  {post.thumbnail_url && (
                    <div
                      className="shrink-0 rounded-[12px] overflow-hidden transform-gpu"
                      style={{ width: '88px', height: '88px' }}
                    >
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="block size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* 텍스트 */}
                  <div className="flex-1 flex flex-col justify-center" style={{ minWidth: 0 }}>
                    {/* 카테고리 */}
                    {post.category && CATEGORY_LABELS[post.category] && (
                      <span style={{
                        fontFamily: 'Pretendard Variable',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#48b2af',
                        marginBottom: '4px',
                      }}>
                        {CATEGORY_LABELS[post.category]}
                      </span>
                    )}

                    {/* 제목 */}
                    <p
                      className="overflow-hidden"
                      style={{
                        fontFamily: 'Pretendard Variable',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        lineHeight: '21px',
                        letterSpacing: '-0.3px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {post.title}
                    </p>

                    {/* 발췌 */}
                    {post.excerpt && (
                      <p
                        className="overflow-hidden"
                        style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '13px',
                          fontWeight: 400,
                          color: '#888888',
                          lineHeight: '18px',
                          marginTop: '4px',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {post.excerpt}
                      </p>
                    )}

                    {/* 날짜 */}
                    <span style={{
                      fontFamily: 'Pretendard Variable',
                      fontSize: '12px',
                      fontWeight: 400,
                      color: '#bbbbbb',
                      marginTop: '4px',
                    }}>
                      {formatDate(post.published_at)}
                    </span>
                  </div>
                </motion.div>
                </a>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
