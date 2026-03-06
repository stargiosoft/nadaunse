/**
 * 콘텐츠 태그 컴포넌트 (New, 심화/무료, 읽어봄)
 * 홈 화면, 유료/무료 콘텐츠 상세 페이지에서 공통 사용
 *
 * @module ContentTags
 */

/** 배포 7일 이내 콘텐츠인지 판별 (8일차부터 미노출) */
export function isContentNew(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

/** 콘텐츠 태그 행 (New, 심화/무료, 읽어봄) - Figma 디자인 반영 */
export function ContentTags({ isPaid, isNew, isRead }: { isPaid: boolean; isNew?: boolean; isRead?: boolean }) {
  return (
    <div className="flex gap-[6px] items-center">
      <div className="flex gap-[3px] items-start">
        {isNew && (
          <div className="flex items-center justify-center px-[3px] rounded-[4px]" style={{ backgroundColor: '#fff6f7' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, lineHeight: '15px', color: '#ef6878', fontFamily: 'Pretendard Variable' }}>New</p>
          </div>
        )}
        <div className="flex items-center justify-center rounded-[4px]" style={{ backgroundColor: isPaid ? '#f0f8f8' : '#f0f8ff', padding: '1px 4px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, lineHeight: '15px', color: isPaid ? '#41a09e' : '#4590d6', fontFamily: 'Pretendard Variable' }}>
            {isPaid ? '심화' : '무료'}
          </p>
        </div>
      </div>
      {isRead && (
        <>
          <div style={{ width: 0, height: '6px', borderLeft: '1px solid #e0e0e0' }} />
          <p style={{ fontSize: '11px', fontWeight: 400, lineHeight: '16px', color: '#999', fontFamily: 'Pretendard Variable' }}>읽어봄</p>
        </>
      )}
    </div>
  );
}
