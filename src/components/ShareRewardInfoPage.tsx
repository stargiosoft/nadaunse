/**
 * @file ShareRewardInfoPage.tsx
 * @description 공유 새싹 지급 안내 페이지
 *
 * - ShareRewardModal "자세히 보기" 클릭 시 진입 (/share-reward-info)
 * - 3단계 안내 (링크 공유 → 친구 가입 → 30새싹 적립)
 * - 알아두세요 (주의사항)
 * - 단계별 적립 기준 테이블 (피보나치 수열)
 *
 * @layout fixed inset-0 패턴 (iOS Safari 스크롤 바운스 방지)
 * @see ★PUBLISHING_GUIDE★.md Section 11
 */

import { motion } from 'framer-motion';
import ArrowLeft from './ArrowLeft';

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay },
});

/* ─── 피보나치 적립 기준 테이블 데이터 ─── */
const REWARD_TABLE = [
  { round: 1, required: 1, sprout: 30, totalFriends: 1, totalSprout: 30 },
  { round: 2, required: 1, sprout: 30, totalFriends: 2, totalSprout: 60 },
  { round: 3, required: 2, sprout: 30, totalFriends: 4, totalSprout: 90 },
  { round: 4, required: 3, sprout: 30, totalFriends: 7, totalSprout: 120 },
  { round: 5, required: 5, sprout: 30, totalFriends: 12, totalSprout: 150 },
  { round: 6, required: 8, sprout: 30, totalFriends: 20, totalSprout: 180 },
];

/* ─── 테이블 헤더/셀 공통 색상 ─── */
const TABLE_HEADER_STYLE = { fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: '#848484', fontFamily: 'Pretendard Variable, sans-serif' } as const;
const TABLE_CELL_STYLE = { fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.42px', color: '#848484', fontFamily: 'Pretendard Variable, sans-serif' } as const;

/* ─── 인라인 SVG 아이콘 ─── */

/** 새싹 아이콘 (sprout.svg 원본) */
const SproutIcon = ({ size = 120 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <path d="M60 98.7375C59.0054 98.7375 58.0516 98.3424 57.3484 97.6392C56.6451 96.9359 56.25 95.9821 56.25 94.9875V32.5125C56.25 31.518 56.6451 30.5641 57.3484 29.8609C58.0516 29.1576 59.0054 28.7625 60 28.7625C60.9946 28.7625 61.9484 29.1576 62.6517 29.8609C63.3549 30.5641 63.75 31.518 63.75 32.5125V94.9875C63.75 95.9821 63.3549 96.9359 62.6517 97.6392C61.9484 98.3424 60.9946 98.7375 60 98.7375Z" fill="#D6B5B0"/>
    <path d="M60 28.7625C59.3362 28.7807 58.6892 28.9748 58.125 29.325C58.6863 29.649 59.1541 30.1129 59.4827 30.6716C59.8113 31.2302 59.9896 31.8645 60 32.5125V94.9875C59.9896 95.6356 59.8113 96.2698 59.4827 96.8285C59.1541 97.3871 58.6863 97.851 58.125 98.175C58.6892 98.5252 59.3362 98.7193 60 98.7375C60.9946 98.7375 61.9484 98.3424 62.6517 97.6392C63.3549 96.9359 63.75 95.9821 63.75 94.9875V32.5125C63.75 31.518 63.3549 30.5641 62.6517 29.8609C61.9484 29.1576 60.9946 28.7625 60 28.7625Z" fill="#C4A19D"/>
    <path d="M97.5 3.75H85.0125C77.3873 3.75992 70.0772 6.79343 64.6853 12.1853C59.2934 17.5772 56.2599 24.8873 56.25 32.5125C56.25 33.5071 56.6451 34.4609 57.3484 35.1641C58.0516 35.8674 59.0054 36.2625 60 36.2625H72.4875C80.1127 36.2526 87.4228 33.2191 92.8147 27.8272C98.2066 22.4353 101.24 15.1252 101.25 7.5C101.25 6.50544 100.855 5.55161 100.152 4.84835C99.4484 4.14509 98.4946 3.75 97.5 3.75Z" fill="#91E085"/>
    <path d="M34.9875 3.75H22.5C21.5054 3.75 20.5516 4.14509 19.8484 4.84835C19.1451 5.55161 18.75 6.50544 18.75 7.5C18.7599 15.1252 21.7934 22.4353 27.1853 27.8272C32.5772 33.2191 39.8873 36.2526 47.5125 36.2625H63.75C64.249 32.1895 63.8776 28.057 62.6603 24.1383C61.443 20.2196 59.4076 16.604 56.6887 13.5306C53.9698 10.4572 50.6294 7.9961 46.8883 6.31004C43.1473 4.62398 39.0909 3.7514 34.9875 3.75Z" fill="#6EC45F"/>
    <path d="M81.2628 71.2498C79.7327 66.8288 76.8624 62.9946 73.0516 60.2809C69.2407 57.5672 64.6787 56.1089 60.0003 56.1089C55.3219 56.1089 50.7599 57.5672 46.9491 60.2809C43.1382 62.9946 40.268 66.8288 38.7378 71.2498C32.7704 71.583 27.1798 74.273 23.1959 78.7282C19.2119 83.1834 17.1609 89.0387 17.4941 95.0061C17.8272 100.973 20.5173 106.564 24.9725 110.548C29.4276 114.532 35.2829 116.583 41.2503 116.25H78.7503C84.7177 116.583 90.573 114.532 95.0282 110.548C99.4833 106.564 102.173 100.973 102.507 95.0061C102.84 89.0387 100.789 83.1834 96.8048 78.7282C92.8208 74.273 87.2302 71.583 81.2628 71.2498Z" fill="#FFD599"/>
    <path d="M81.2625 71.25C79.7087 66.8553 76.8284 63.0516 73.0196 60.3646C69.2107 57.6775 64.6613 56.2398 60 56.25C55.0415 56.2737 50.2297 57.9348 46.3125 60.975C51.844 59.3141 57.8023 59.8439 62.9539 62.4546C68.1056 65.0653 72.0561 69.5571 73.9875 75C78.4397 75.4996 82.6414 77.3169 86.0544 80.2192C89.4673 83.1215 91.9362 86.9766 93.1446 91.2907C94.353 95.6048 94.246 100.181 92.8373 104.434C91.4286 108.687 88.7824 112.423 85.2375 115.162C90.2016 113.689 94.5055 110.548 97.4229 106.27C100.34 101.992 101.693 96.838 101.252 91.6785C100.812 86.519 98.605 81.6694 95.0043 77.9479C91.4037 74.2264 86.6296 71.8607 81.4875 71.25H81.2625Z" fill="#EFBF7F"/>
  </svg>
);

/** 새싹 소형 아이콘 (Icons.svg - Step 3 "30새싹" 용) */
const SproutSmallIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <path d="M10.2386 5.46204C11.8134 7.41454 12.17 10.1306 11.1708 12.5506C11.081 12.767 10.8876 12.9228 10.6566 12.965C10.2166 13.0447 9.77472 13.0832 9.33839 13.0832C7.22547 13.0832 5.22989 12.172 3.92456 10.5532C2.35064 8.6007 1.99406 5.88462 2.99231 3.4637C3.08214 3.24737 3.27556 3.09154 3.50656 3.04937C6.07964 2.58095 8.66372 3.50862 10.2386 5.46204ZM19.4208 8.04704C19.331 7.8307 19.1376 7.67487 18.9066 7.6327C16.9431 7.28345 14.9759 7.98379 13.7723 9.4752C12.5706 10.9648 12.2983 13.0365 13.0601 14.8808C13.1499 15.0971 13.3433 15.253 13.5743 15.2951C13.9098 15.3556 14.2453 15.3859 14.579 15.3859C16.1896 15.3859 17.7112 14.6892 18.7076 13.4545C19.9103 11.9649 20.1826 9.89321 19.4208 8.04795V8.04704Z" fill="#97D729"/>
    <path d="M16.0902 11.4505C15.8344 11.1718 15.3999 11.1535 15.1185 11.4101C13.7958 12.6256 12.6692 14.0015 11.736 15.492C11.6205 14.316 11.3244 13.0015 10.7121 11.6347C9.62951 9.22204 8.00426 7.66462 6.83093 6.78279C6.52659 6.5527 6.09576 6.61595 5.86843 6.91937C5.64018 7.22279 5.70159 7.65362 6.00501 7.88187C7.04909 8.66562 8.49468 10.0516 9.45718 12.1966C10.5278 14.5836 10.5178 16.7992 10.3198 18.2393C10.3188 18.2475 10.3271 18.254 10.3271 18.2613C10.2968 18.5519 10.4453 18.8406 10.7277 18.9635C10.8175 19.002 10.9101 19.0203 11.0018 19.0203C11.2667 19.0203 11.5197 18.8654 11.6324 18.6069C11.8946 18.0019 12.1907 17.407 12.5152 16.8405C13.4465 15.2097 14.6345 13.7238 16.0498 12.4221C16.3294 12.1655 16.3468 11.73 16.0902 11.4505Z" fill="#79AD22"/>
  </svg>
);

/** 카카오 아이콘 */
const KakaoIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 0.78)} viewBox="0 0 25 23" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M12.0878 0C5.41326 0 0 4.27889 0 9.55729C0 12.9921 2.29413 16.0034 5.73533 17.6883C5.48148 18.6323 4.8199 21.1073 4.68821 21.6372C4.52321 22.294 4.9262 22.2861 5.19273 22.1084C5.40057 21.9703 8.50542 19.8602 9.84604 18.948C10.5727 19.0559 11.3215 19.113 12.0894 19.113C18.7655 19.113 24.1788 14.8341 24.1788 9.55729C24.1788 4.27889 18.764 0 12.0878 0Z" fill="#191919"/>
  </svg>
);

/** 복사 아이콘 */
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
    <path d="M7 12.833C7 9.534 7 7.883 8.026 6.859C9.05 5.833 10.7 5.833 14 5.833H17.5C20.799 5.833 22.45 5.833 23.475 6.859C24.5 7.883 24.5 9.534 24.5 12.833V18.667C24.5 21.966 24.5 23.617 23.475 24.641C22.45 25.667 20.799 25.667 17.5 25.667H14C10.7 25.667 9.05 25.667 8.026 24.641C7 23.617 7 21.966 7 18.667V12.833Z" stroke="#848484" strokeWidth="1.5"/>
    <path d="M7 22.167A3.5 3.5 0 013.5 18.667V11.667C3.5 7.267 3.5 5.067 4.867 3.7C6.235 2.335 8.434 2.333 12.833 2.333H17.5A3.5 3.5 0 0121 5.833" stroke="#848484" strokeWidth="1.5"/>
  </svg>
);

/** Google 아이콘 */
const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

/* ─── 서브 컴포넌트 ─── */

/** 번호 뱃지 */
const NumberBadge = ({ num }: { num: number }) => (
  <div
    className="flex items-center justify-center shrink-0 rounded-full"
    style={{ width: '23px', height: '23px', backgroundColor: '#525252' }}
  >
    <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', fontWeight: 600, lineHeight: '19px', letterSpacing: '-0.26px', color: '#ffffff' }}>
      {num}
    </span>
  </div>
);

/** 핀 아이콘 (pin.svg) */
const PinIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M12.5001 13.707H7.50013C7.39359 13.7069 7.28881 13.7341 7.19574 13.7859C7.10266 13.8378 7.02439 13.9125 6.96836 14.0032C6.91233 14.0938 6.88041 14.1972 6.87563 14.3036C6.87085 14.41 6.89337 14.5159 6.94104 14.6112L9.44104 19.6112C9.49289 19.7151 9.57266 19.8025 9.67142 19.8636C9.77017 19.9247 9.884 19.9571 10.0001 19.9571C10.1163 19.9571 10.2301 19.9247 10.3288 19.8636C10.4276 19.8025 10.5074 19.7151 10.5592 19.6112L13.0592 14.6112C13.1069 14.5159 13.1294 14.41 13.1246 14.3036C13.1198 14.1972 13.0879 14.0938 13.0319 14.0032C12.9759 13.9125 12.8976 13.8378 12.8045 13.7859C12.7114 13.7341 12.6067 13.7069 12.5001 13.707Z" fill="#CBD7EF"/>
    <path d="M15.1949 11.6813L13.5282 5.01465C13.4945 4.87939 13.4164 4.75931 13.3066 4.67349C13.1967 4.58767 13.0613 4.54104 12.9219 4.54102H7.0886C6.94919 4.54104 6.8138 4.58767 6.70394 4.67349C6.59409 4.75931 6.51608 4.87939 6.48231 5.01465L4.81565 11.6813C4.79253 11.7734 4.79074 11.8696 4.81041 11.9626C4.83008 12.0555 4.87069 12.1427 4.92916 12.2176C4.98762 12.2925 5.0624 12.353 5.14779 12.3946C5.23318 12.4362 5.32694 12.4578 5.42193 12.4577H14.5886C14.6836 12.4578 14.7773 12.4362 14.8627 12.3946C14.9481 12.353 15.0229 12.2925 15.0814 12.2176C15.1398 12.1427 15.1805 12.0555 15.2001 11.9626C15.2198 11.8696 15.218 11.7734 15.1949 11.6813Z" fill="#FF6666"/>
    <path d="M13.3438 2.04102H6.67708C5.87167 2.04102 5.21875 2.69393 5.21875 3.49935V4.33268C5.21875 5.1381 5.87167 5.79102 6.67708 5.79102H13.3438C14.1492 5.79102 14.8021 5.1381 14.8021 4.33268V3.49935C14.8021 2.69393 14.1492 2.04102 13.3438 2.04102Z" fill="#FF6666"/>
    <path d="M15.0052 11.208H5.00521C4.19979 11.208 3.54688 11.8609 3.54688 12.6663V13.4997C3.54688 14.3051 4.19979 14.958 5.00521 14.958H15.0052C15.8106 14.958 16.4635 14.3051 16.4635 13.4997V12.6663C16.4635 11.8609 15.8106 11.208 15.0052 11.208Z" fill="#FF6666"/>
  </svg>
);

/** 섹션 헤더 (핀 아이콘 + 제목) - Figma 디자인 참조 */
const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center" style={{ gap: '6px' }}>
    <PinIcon size={20} />
    <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#151515' }}>
      {title}
    </span>
  </div>
);

/** 4px 구분선 */
const Divider = () => (
  <div className="w-full shrink-0" style={{ height: '4px', backgroundColor: '#f9f9f9' }} />
);

/* ─── 메인 컴포넌트 ─── */

interface ShareRewardInfoPageProps {
  onBack: () => void;
}

export default function ShareRewardInfoPage({ onBack }: ShareRewardInfoPageProps) {
  return (
    /* fixed inset-0 패턴: iOS Safari 스크롤 바운스 방지 */
    <div className="bg-white fixed inset-0 flex justify-center">
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">

        {/* ─── 상단 네비게이션 (shrink-0 고정) ─── */}
        <div className="bg-white h-[52px] shrink-0 z-20 w-full">
          <div className="flex items-center justify-between px-[12px] h-full">
            <ArrowLeft onClick={onBack} />
            {/* 타이틀 없음 (Figma 디자인 참조) */}
            <div className="w-[44px]" />
          </div>
        </div>

        {/* ─── 스크롤 콘텐츠 영역 (flex-1 + min-h-0 = flex 내부 overflow 허용) ─── */}
        <div className="flex-1 min-h-0 overflow-y-auto w-full">

          {/* 히어로 섹션 */}
          <motion.div className="flex flex-col items-center" style={{ padding: '24px 20px 32px', gap: '28px' }} {...slideUp(0)}>
            <div className="flex flex-col items-center w-full" style={{ gap: '2px' }}>
              <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#151515' }}>
                공유하면 친구랑 나랑
              </p>
              <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#48B2AF' }}>
                서로 30새싹 받아요
              </p>
            </div>
            <motion.div
              animate={{ y: [0, -10, 0, -10, 0, -10, 0] }}
              transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.3, times: [0, 0.143, 0.286, 0.429, 0.571, 0.714, 1] }}
            >
              <SproutIcon size={120} />
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── 이렇게 받아요 섹션 ─── */}
          <motion.div className="flex flex-col" style={{ padding: '28px 20px 34px', gap: '12px' }} {...slideUp(0.08)}>
            <SectionHeader title="이렇게 받아요" />

            <div className="flex flex-col" style={{ gap: '7px' }}>

              {/* Step 1: 링크 공유하기 */}
              <div className="rounded-[20px]" style={{ backgroundColor: '#f8f8f8', padding: '17px 20px 24px' }}>
                <div className="flex items-start" style={{ gap: '12px' }}>
                  <div style={{ paddingTop: '3px' }}>
                    <NumberBadge num={1} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0" style={{ gap: '12px' }}>
                    <div className="flex flex-col" style={{ padding: '0 4px', gap: '1px' }}>
                      <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515' }}>
                        링크 공유하기
                      </p>
                      <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: '#848484' }}>
                        친구에게 링크를 보내세요
                      </p>
                    </div>
                    {/* 카카오톡 / 링크 복사 미리보기 */}
                    <div
                      className="flex items-center justify-center w-full rounded-[20px]"
                      style={{ backgroundColor: '#ffffff', border: '1px solid #f3f3f3', padding: '10px 0' }}
                    >
                      <div className="flex items-center" style={{ gap: '14px' }}>
                        <div className="flex items-center" style={{ gap: '10px' }}>
                          <div
                            className="flex items-center justify-center shrink-0 rounded-[8px]"
                            style={{ width: '30px', height: '30px', backgroundColor: '#FEE500' }}
                          >
                            <KakaoIcon size={16} />
                          </div>
                          <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484' }}>
                            카카오톡 공유
                          </span>
                        </div>
                        <div style={{ width: '1px', height: '8px', backgroundColor: '#e7e7e7' }} />
                        <div className="flex items-center" style={{ gap: '10px' }}>
                          <div
                            className="flex items-center justify-center shrink-0 rounded-[8px]"
                            style={{ width: '33px', height: '33px', backgroundColor: '#f9f9f9' }}
                          >
                            <CopyIcon />
                          </div>
                          <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484' }}>
                            링크 복사
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: 친구 가입 완료 */}
              <div className="rounded-[20px]" style={{ backgroundColor: '#f8f8f8', padding: '17px 20px 24px' }}>
                <div className="flex items-start" style={{ gap: '12px' }}>
                  <div style={{ paddingTop: '3px' }}>
                    <NumberBadge num={2} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0" style={{ gap: '12px' }}>
                    <div className="flex flex-col" style={{ padding: '0 4px', gap: '1px' }}>
                      <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515' }}>
                        친구 가입 완료
                      </p>
                      <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.42px', color: '#848484' }}>
                        친구가 링크로 가입하면 인정돼요
                      </p>
                    </div>
                    {/* 가입 UI 미리보기 (정적 일러스트) */}
                    <div
                      className="flex flex-col items-center w-full rounded-[20px]"
                      style={{ backgroundColor: '#ffffff', border: '1px solid #f3f3f3', padding: '20px 20px 16px' }}
                    >
                      <div className="flex flex-col items-center w-full" style={{ gap: '10px' }}>
                        {/* 3초면 가입 끝! 말풍선 */}
                        <div className="relative" style={{ marginBottom: '2px' }}>
                          <div
                            className="rounded-full"
                            style={{ backgroundColor: '#48B2AF', padding: '2px 11px 5px', boxShadow: '0px 1px 4px rgba(0,0,0,0.12)' }}
                          >
                            <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '11px', fontWeight: 500, lineHeight: '16px', letterSpacing: '-0.22px', color: '#ffffff' }}>
                              3초면 가입 끝!
                            </span>
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-5px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 0,
                              height: 0,
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderTop: '6px solid #48B2AF',
                            }}
                          />
                        </div>

                        {/* 카카오 버튼 */}
                        <div
                          className="flex items-center justify-center w-full"
                          style={{ backgroundColor: '#FEE500', border: '1px solid #FEE500', height: '38px', borderRadius: '11px' }}
                        >
                          <div className="flex items-center" style={{ gap: '5px' }}>
                            <KakaoIcon size={14} />
                            <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '-0.22px', color: '#151515' }}>
                              카카오로 무료 체험 시작하기
                            </span>
                          </div>
                        </div>

                        {/* 구글 버튼 */}
                        <div
                          className="flex items-center justify-center w-full"
                          style={{ backgroundColor: '#ffffff', border: '1px solid #e7e7e7', height: '38px', borderRadius: '11px' }}
                        >
                          <div className="flex items-center" style={{ gap: '5px' }}>
                            <GoogleIcon />
                            <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '-0.22px', color: '#151515' }}>
                              Google로 무료 체험 시작하기
                            </span>
                          </div>
                        </div>

                        <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '-0.3px', color: '#999', textAlign: 'center' }}>
                          자동 결제 없어요
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: 서로 30새싹 바로 적립 */}
              <div className="rounded-[20px]" style={{ backgroundColor: '#f8f8f8', padding: '17px 20px 24px' }}>
                <div className="flex items-start" style={{ gap: '12px' }}>
                  <div style={{ paddingTop: '3px' }}>
                    <NumberBadge num={3} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0" style={{ gap: '12px' }}>
                    <div className="flex flex-col" style={{ padding: '0 4px', gap: '1px' }}>
                      <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515' }}>
                        서로 30새싹 바로 적립
                      </p>
                      <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.42px', color: '#848484' }}>
                        나도, 가입한 친구도 30새싹 받아요
                      </p>
                    </div>
                    <div
                      className="flex flex-col items-center w-full rounded-[20px]"
                      style={{ backgroundColor: '#ffffff', border: '1px solid #f3f3f3', padding: '16px 0', gap: '6px' }}
                    >
                      <div className="flex items-center" style={{ gap: '7px' }}>
                        <SproutSmallIcon size={22} />
                        <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 700, lineHeight: '22px', letterSpacing: '-0.42px', color: '#151515' }}>
                          나 → 30새싹
                        </span>
                      </div>
                      <div className="flex items-center" style={{ gap: '7px' }}>
                        <SproutSmallIcon size={22} />
                        <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 700, lineHeight: '22px', letterSpacing: '-0.42px', color: '#151515' }}>
                          친구 → 30새싹
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          <Divider />

          {/* ─── 알아두세요 섹션 ─── */}
          <motion.div className="flex flex-col" style={{ padding: '26px 20px', gap: '11px' }} {...slideUp(0.16)}>
            <SectionHeader title="알아두세요" />
            <ul className="flex flex-col" style={{ gap: '8px', paddingLeft: '6px' }}>
              <BulletItem>링크로 가입하면 나와 친구 모두 30새싹을 받아요</BulletItem>
              <BulletItem>기존 회원은 포함되지 않아요</BulletItem>
              <BulletItem>
                회차가 올라갈수록 더 많이 필요해요
                <br />
                <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '15px', fontWeight: 400, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#848484' }}>
                  1회차 1명 → 2회차 1명 → 3회차 2명 → 4회차 3명 …
                </span>
              </BulletItem>
              <BulletItem>
                카카오톡 공유 또는 '링크 복사' 버튼으로 공유해야 인정돼요{' '}
                <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontWeight: 600 }}>(URL 직접 공유 제외)</span>
              </BulletItem>
              <BulletItem>조건 달성 시 바로 적립돼요</BulletItem>
              <BulletItem>부정한 방법으로 적립된 새싹은 회수될 수 있어요</BulletItem>
              <BulletItem>조건과 보상은 사전 공지 후 변경될 수 있어요</BulletItem>
            </ul>
          </motion.div>

          {/* ─── 단계별 적립 기준 테이블 ─── */}
          <motion.div className="flex flex-col" style={{ padding: '26px 20px 170px', gap: '13px' }} {...slideUp(0.24)}>
            <SectionHeader title="단계별 적립 기준" />

            <div
              className="w-full overflow-hidden rounded-[20px] transform-gpu"
              style={{ border: '1px solid #f3f3f3' }}
            >
              {/* 테이블 헤더 */}
              <div className="flex w-full">
                {['단계', '필요 친구', '받는 새싹', '누적 친구', '누적 새싹'].map((header, i) => (
                  <div
                    key={header}
                    className="flex flex-1 items-center justify-center"
                    style={{
                      padding: '10px 4px',
                      backgroundColor: '#f9f9f9',
                      borderRight: i < 4 ? '1px solid #f3f3f3' : 'none',
                    }}
                  >
                    <span style={TABLE_HEADER_STYLE}>{header}</span>
                  </div>
                ))}
              </div>

              {/* 테이블 바디 */}
              {REWARD_TABLE.map((row, rowIdx) => (
                <div
                  key={row.round}
                  className="flex w-full"
                  style={{ borderBottom: rowIdx < REWARD_TABLE.length - 1 ? '1px solid #f3f3f3' : 'none' }}
                >
                  {[
                    { text: `${row.round}단계`, isLabel: true },
                    { text: String(row.required), isLabel: false },
                    { text: String(row.sprout), isLabel: false },
                    { text: String(row.totalFriends), isLabel: false },
                    { text: String(row.totalSprout), isLabel: false },
                  ].map((cell, cellIdx) => (
                    <div
                      key={cellIdx}
                      className="flex flex-1 items-center justify-center"
                      style={{
                        padding: '10px 4px',
                        backgroundColor: '#ffffff',
                        borderRight: cellIdx < 4 ? '1px solid #f3f3f3' : 'none',
                      }}
                    >
                      <span style={cell.isLabel ? TABLE_HEADER_STYLE : TABLE_CELL_STYLE}>
                        {cell.text}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ─── 하단 고정 닫기 버튼 (shrink-0) ─── */}
        <div
          className="shrink-0 w-full bg-white"
          style={{
            boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
            padding: '12px 20px',
          }}
        >
          <button
            onClick={onBack}
            className="flex items-center justify-center cursor-pointer w-full"
            style={{
              backgroundColor: '#48B2AF',
              height: '56px',
              borderRadius: '16px',
              border: 'none',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.99)';
              e.currentTarget.style.backgroundColor = '#368683';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#48B2AF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#48B2AF';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.99)';
              e.currentTarget.style.backgroundColor = '#368683';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#48B2AF';
            }}
          >
            <span style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '25px',
              letterSpacing: '-0.32px',
              color: '#ffffff',
            }}>
              닫기
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── 불릿 아이템 ─── */

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li
      className="list-disc"
      style={{
        fontFamily: 'Pretendard Variable, sans-serif',
        fontSize: '15px',
        fontWeight: 400,
        lineHeight: '25.5px',
        letterSpacing: '-0.3px',
        color: '#848484',
        marginLeft: '16px',
      }}
    >
      {children}
    </li>
  );
}
