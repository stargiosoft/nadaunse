import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import svgPaths1 from "@/imports/svg-ysqoq72gck";

interface FreeContent {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

function FreeContentCard({ content, onClick }: { content: FreeContent; onClick: () => void }) {
  const thumbnailUrl = content.thumbnail_url || '/placeholder-thumbnail.jpg';

  return (
    <div
      className="flex flex-col items-start shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ width: '160px' }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div
        className="relative rounded-[12px] shrink-0 overflow-hidden transform-gpu"
        style={{ width: '160px', height: '96px' }}
      >
        <img
          alt={content.title}
          className="absolute inset-0 max-w-none object-cover size-full"
          src={thumbnailUrl}
        />
        <div
          aria-hidden="true"
          className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]"
        />
      </div>

      {/* Content Info */}
      <div className="flex flex-col gap-[4px] items-start w-full" style={{ paddingTop: '8px' }}>
        {/* Label */}
        <div
          className="flex items-center justify-center rounded-[4px] shrink-0"
          style={{ backgroundColor: '#f3f3f3', padding: '2px 4px 2.5px 4px' }}
        >
          <p
            style={{
              fontFamily: "'Pretendard Variable', sans-serif",
              fontWeight: 500,
              fontSize: '10px',
              lineHeight: 'normal',
              color: '#999999'
            }}
          >
            무료 체험판
          </p>
        </div>

        {/* Title */}
        <p
          style={{
            fontFamily: "'Pretendard Variable', sans-serif",
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '-0.28px',
            color: '#000',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
          className="w-full"
        >
          {content.title}
        </p>
      </div>
    </div>
  );
}

function MoreButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="flex items-center shrink-0 cursor-pointer"
      style={{ paddingRight: '20px' }}
      onClick={onClick}
    >
      <div
        className="flex items-center justify-center rounded-[12px] border border-[#e7e7e7] border-dashed"
        style={{ width: '160px', height: '96px' }}
      >
        <p
          style={{
            fontFamily: "'Pretendard Variable', sans-serif",
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '-0.28px',
            color: '#999999'
          }}
        >
          더 볼래요!
        </p>
      </div>
      <div className="flex items-center justify-center shrink-0" style={{ marginLeft: '-8px' }}>
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="relative" style={{ width: '44px', height: '44px' }}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
              <rect fill="white" height="44" width="44" />
              <motion.path
                initial={{ x: 0 }}
                animate={{ x: 2 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                d={svgPaths1.p3bb19300}
                fill="#D4D4D4"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col items-start shrink-0 animate-pulse" style={{ width: '160px' }}>
      <div
        className="rounded-[12px] shrink-0"
        style={{ width: '160px', height: '96px', backgroundColor: '#f3f3f3' }}
      />
      <div className="flex flex-col gap-[4px] items-start w-full" style={{ paddingTop: '8px' }}>
        <div
          className="rounded-[4px]"
          style={{ width: '60px', height: '16px', backgroundColor: '#f3f3f3' }}
        />
        <div
          className="rounded-[4px]"
          style={{ width: '140px', height: '20px', backgroundColor: '#f3f3f3' }}
        />
      </div>
    </div>
  );
}

export default function CardContent() {
  const navigate = useNavigate();
  const [contents, setContents] = useState<FreeContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFreeContents = async () => {
      try {
        // 무료 콘텐츠를 인기순(weekly_clicks)으로 4개 가져오기
        const { data, error } = await supabase
          .from('master_contents')
          .select('id, title, thumbnail_url')
          .eq('content_type', 'free')
          .eq('status', 'deployed')
          .order('weekly_clicks', { ascending: false })
          .limit(4);

        if (error) {
          console.error('❌ [CardContent] 무료 콘텐츠 로드 실패:', error);
          return;
        }

        setContents(data || []);
        console.log('✅ [CardContent] 무료 콘텐츠 로드:', data?.length, '개');
      } catch (error) {
        console.error('❌ [CardContent] 로드 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFreeContents();
  }, []);

  const handleContentClick = (contentId: string) => {
    navigate(`/free/content/${contentId}`);
  };

  const handleMoreClick = () => {
    // 홈으로 이동 시 무료 체험판 필터 자동 선택
    localStorage.setItem('homeFilter', JSON.stringify({ category: '전체', contentType: 'free' }));
    navigate('/');
  };

  return (
    <div
      className="flex items-start w-full overflow-x-auto scrollbar-hide"
      style={{ paddingBottom: '16px' }}
    >
      <div className="flex gap-[12px] items-start" style={{ paddingLeft: '20px' }}>
        {isLoading ? (
          // 로딩 스켈레톤
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : contents.length > 0 ? (
          // 실제 콘텐츠
          <>
            {contents.map((content) => (
              <FreeContentCard
                key={content.id}
                content={content}
                onClick={() => handleContentClick(content.id)}
              />
            ))}
            <MoreButton onClick={handleMoreClick} />
          </>
        ) : (
          // 콘텐츠 없음
          <div
            className="flex items-center justify-center"
            style={{
              width: '200px',
              height: '96px',
              fontFamily: "'Pretendard Variable', sans-serif",
              fontSize: '14px',
              color: '#999'
            }}
          >
            콘텐츠가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
