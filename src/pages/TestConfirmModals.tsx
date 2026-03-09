/**
 * DEV ONLY – 컨펌 모달 디자인 비교 페이지
 * 삭제 예정
 */

// 공통 ConfirmDialog 모달 카드만 인라인 미리보기 (overlay 없이)
function ConfirmDialogPreview({ title, message, cancelText = '아니요', confirmText = '네' }: {
  title: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
}) {
  return (
    <div className="bg-white overflow-hidden transform-gpu" style={{ width: 320, borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid #f3f3f3' }}>
      <div className="flex flex-col" style={{ gap: '4px', padding: '40px 32px 36px' }}>
        <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontWeight: 600, fontSize: 17.5, lineHeight: '24px', letterSpacing: '-0.34px', color: '#151515' }}>
          {title}
        </p>
        {message && (
          <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484' }}>
            {message}
          </p>
        )}
      </div>
      <div className="flex gap-[10px] px-[28px] pb-[20px]">
        <button className="flex-1" style={{ height: 48, backgroundColor: '#f3f3f3', borderRadius: 16, border: 'none', fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: 15, color: '#525252', cursor: 'pointer' }}>{cancelText}</button>
        <button className="flex-1" style={{ height: 48, backgroundColor: '#48b2af', borderRadius: 16, border: 'none', fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: 15, color: '#fff', cursor: 'pointer' }}>{confirmText}</button>
      </div>
    </div>
  );
}

export default function TestConfirmModals() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '40px 24px', fontFamily: 'Pretendard Variable, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#151515', marginBottom: 8 }}>컨펌 모달 현황</h1>
      <p style={{ fontSize: 14, color: '#848484', marginBottom: 40 }}>공통 컴포넌트 통합 완료</p>

      {/* SajuSelectPage / FreeSajuSelectPage / SajuManagementPage */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#48b2af', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ✅ 사주 삭제 (SajuSelectPage 등)
        </h2>
        <p style={{ fontSize: 12, color: '#848484', marginBottom: 20 }}>사용처: SajuSelectPage, FreeSajuSelectPage, SajuManagementPage</p>
        <ConfirmDialogPreview title="사주를 삭제할까요?" message="등록된 사주를 삭제하시겠어요?" />
      </section>

      {/* MasterContentDetail */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#48b2af', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ✅ 콘텐츠 삭제 (MasterContentDetail.tsx)
        </h2>
        <p style={{ fontSize: 12, color: '#848484', marginBottom: 20 }}>공통 컴포넌트로 통합 완료</p>
        <ConfirmDialogPreview title="이 콘텐츠를 삭제하시겠습니까?" message="삭제된 콘텐츠는 복구할 수 없습니다." cancelText="취소" confirmText="확인" />
      </section>

      {/* MasterContentList */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#48b2af', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ✅ 배포 확인 (MasterContentList.tsx)
        </h2>
        <p style={{ fontSize: 12, color: '#848484', marginBottom: 20 }}>공통 컴포넌트로 통합 완료</p>
        <ConfirmDialogPreview title="선택한 콘텐츠를 운영 서버에 배포하시겠어요?" cancelText="아니요" confirmText="예" />
      </section>
    </div>
  );
}
