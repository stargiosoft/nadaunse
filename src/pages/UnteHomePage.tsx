/**
 * 운테 홈 페이지 — 바이럴 테스트 리스트
 * ★DESIGN_SYSTEM★ 기반 레이아웃 + 색상 + 타이포
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import UnteTestCard from '../components/UnteTestCard';
import BottomTabBar from '../components/BottomTabBar';
import { Skeleton } from '../components/ui/skeleton';

const font = "'Pretendard Variable', sans-serif";

interface ViralTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  play_count: number;
  template_type: string;
  is_adult: boolean;
  published_at: string;
}

type SortType = 'popular' | 'latest';
type FilterType = 'all' | 'slot_machine' | 'compatibility';

export function UnteHomePage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<ViralTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortType>('popular');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadTests();
  }, [sort, filter]);

  const loadTests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('viral_tests')
        .select('id, slug, title, description, thumbnail_url, play_count, template_type, is_adult, published_at')
        .eq('status', 'live');

      if (filter !== 'all') {
        query = query.eq('template_type', filter);
      }

      if (sort === 'popular') {
        query = query.order('play_count', { ascending: false });
      } else {
        query = query.order('published_at', { ascending: false });
      }

      query = query.limit(50);
      const { data, error } = await query;
      if (error) throw error;
      setTests(data || []);
    } catch (err) {
      console.error('테스트 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'slot_machine', label: '테스트' },
    { key: 'compatibility', label: '궁합' },
  ];

  const sortButtons: { key: SortType; label: string }[] = [
    { key: 'popular', label: '인기순' },
    { key: 'latest', label: '최신순' },
  ];

  return (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="w-full max-w-[440px] relative pb-[80px]">

        {/* 헤더 — 52px 고정 높이 */}
        <div
          className="sticky top-0 z-10"
          style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f3f3f3' }}
        >
          <div
            className="flex items-center justify-between"
            style={{ height: '52px', padding: '0 20px' }}
          >
            <span style={{
              fontFamily: font, fontSize: '18px', fontWeight: 600,
              lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
            }}>
              운테
            </span>
            <button
              onClick={() => navigate('/unte/create')}
              className="flex items-center justify-center cursor-pointer"
              style={{
                height: '32px',
                padding: '0 14px',
                borderRadius: '16px',
                backgroundColor: '#48b2af',
                border: 'none',
                transition: 'transform 0.1s ease',
              }}
              onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onPointerUp={e => { e.currentTarget.style.transform = ''; }}
              onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <span style={{
                fontFamily: font, fontSize: '13px', fontWeight: 500,
                color: '#ffffff', letterSpacing: '-0.26px',
              }}>
                + 만들기
              </span>
            </button>
          </div>

          {/* 필터 + 정렬 */}
          <div
            className="flex items-center justify-between"
            style={{ padding: '0 20px 12px' }}
          >
            <div className="flex" style={{ gap: '6px' }}>
              {filterButtons.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    height: '28px',
                    padding: '0 12px',
                    borderRadius: '9999px',
                    backgroundColor: filter === f.key ? '#48b2af' : '#f9f9f9',
                    border: filter === f.key ? 'none' : '1px solid #e7e7e7',
                    fontFamily: font,
                    fontSize: '12px',
                    fontWeight: filter === f.key ? 600 : 400,
                    color: filter === f.key ? '#ffffff' : '#6d6d6d',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex" style={{ gap: '4px' }}>
              {sortButtons.map((s, i) => (
                <span key={s.key} className="flex items-center" style={{ gap: '4px' }}>
                  {i > 0 && <span style={{ color: '#e7e7e7', fontSize: '10px' }}>|</span>}
                  <button
                    onClick={() => setSort(s.key)}
                    className="cursor-pointer"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: font,
                      fontSize: '12px',
                      fontWeight: sort === s.key ? 600 : 400,
                      color: sort === s.key ? '#48b2af' : '#b7b7b7',
                      padding: '2px 4px',
                    }}
                  >
                    {s.label}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div style={{ padding: '16px 20px 0' }}>
          {loading ? (
            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <Skeleton className="w-full" style={{ aspectRatio: '1/1', borderRadius: 0 }} />
                  <div className="flex flex-col" style={{ padding: '10px 12px 12px', gap: '6px' }}>
                    <Skeleton style={{ height: '16px', width: '80%', borderRadius: '4px' }} />
                    <Skeleton style={{ height: '12px', width: '50%', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : tests.length === 0 ? (
            /* 빈 상태 — 중앙 정렬 */
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: '120px', gap: '20px' }}>
              {/* 아이콘 — ErrorPage 스타일 */}
              <div
                className="flex items-center justify-center"
                style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#E4F7F7' }}
              >
                <span style={{ fontSize: '32px' }}>🎰</span>
              </div>

              <div className="flex flex-col items-center" style={{ gap: '8px' }}>
                <p style={{
                  fontFamily: font, fontSize: '18px', fontWeight: 600,
                  lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
                  textAlign: 'center',
                }}>
                  아직 테스트가 없어요
                </p>
                <p style={{
                  fontFamily: font, fontSize: '15px', fontWeight: 400,
                  lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
                  textAlign: 'center',
                }}>
                  첫 번째 테스트를 만들어보세요!
                </p>
              </div>

              {/* CTA 버튼 */}
              <button
                onClick={() => navigate('/unte/create')}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  height: '48px',
                  padding: '0 32px',
                  borderRadius: '16px',
                  backgroundColor: '#48b2af',
                  border: 'none',
                  transition: 'transform 0.1s ease',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
              >
                <span style={{
                  fontFamily: font, fontSize: '15px', fontWeight: 500,
                  lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff',
                }}>
                  테스트 만들기
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
              {tests.map((test) => (
                <UnteTestCard
                  key={test.id}
                  id={test.id}
                  slug={test.slug}
                  title={test.title}
                  description={test.description}
                  thumbnailUrl={test.thumbnail_url || undefined}
                  playCount={test.play_count}
                  templateType={test.template_type}
                  isAdult={test.is_adult}
                />
              ))}
            </div>
          )}
        </div>

        <BottomTabBar />
      </div>
    </div>
  );
}

export default UnteHomePage;
