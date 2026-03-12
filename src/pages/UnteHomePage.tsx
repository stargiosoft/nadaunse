/**
 * 운테 홈 페이지 — 바이럴 테스트 리스트
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import UnteTestCard from '../components/UnteTestCard';
import BottomTabBar from '../components/BottomTabBar';

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
type FilterType = 'all' | 'slot_machine' | 'compatibility' | 'adult';

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

  const sortButtons: { key: SortType; label: string }[] = [
    { key: 'popular', label: '인기순' },
    { key: 'latest', label: '최신순' },
  ];

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'slot_machine', label: '테스트' },
    { key: 'compatibility', label: '궁합' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div className="max-w-[440px] mx-auto px-4 py-3 flex items-center justify-between">
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a' }}>운테</p>
          <button
            onClick={() => navigate('/unte/create')}
            className="px-4 py-1.5 rounded-full cursor-pointer"
            style={{
              backgroundColor: '#48b2af',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
            }}
          >
            + 만들기
          </button>
        </div>

        {/* 필터 + 정렬 */}
        <div className="max-w-[440px] mx-auto px-4 pb-3 flex items-center justify-between">
          {/* 카테고리 필터 */}
          <div className="flex gap-2">
            {filterButtons.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1 rounded-full cursor-pointer"
                style={{
                  backgroundColor: filter === f.key ? '#48b2af' : '#f5f5f5',
                  color: filter === f.key ? '#fff' : '#888',
                  fontSize: '12px',
                  fontWeight: filter === f.key ? 600 : 400,
                  border: 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 정렬 */}
          <div className="flex gap-1">
            {sortButtons.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className="px-2 py-1 cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  color: sort === s.key ? '#48b2af' : '#bbb',
                  fontSize: '12px',
                  fontWeight: sort === s.key ? 600 : 400,
                  border: 'none',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-[440px] mx-auto px-4 pt-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ backgroundColor: '#e5e5e5', aspectRatio: '1/1.3' }} />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span style={{ fontSize: '48px' }}>🎰</span>
            <p style={{ fontSize: '16px', color: '#888', textAlign: 'center' }}>
              아직 테스트가 없어요<br />
              첫 번째 테스트를 만들어보세요!
            </p>
            <button
              onClick={() => navigate('/unte/create')}
              className="px-6 py-2.5 rounded-full cursor-pointer"
              style={{
                backgroundColor: '#48b2af',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
              }}
            >
              테스트 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
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
  );
}

export default UnteHomePage;
