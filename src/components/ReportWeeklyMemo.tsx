import React, { useState, useEffect } from 'react';
import svgPaths from "@/imports/svg-194c2rv4ka";
import ReportWeeklyMemoEdit from '@/components/ReportWeeklyMemoEdit';
// CompletionCoupon, MypageProfile 컴포넌트 삭제됨 - 플레이스홀더로 대체
import ReportWeeklyDetail from '@/components/ReportWeeklyDetail';
import ReportWeeklyTarot from '@/components/ReportWeeklyTarot';
import ReportWeeklyTarotResult from '@/components/ReportWeeklyTarotResult';
import ReportWeeklyMindCare from '@/components/ReportWeeklyMindCare';
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, X } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { invalidateWeeklyReportCache } from '@/hooks/useWeeklyReport';
import { DotLoading } from './ui/PageLoader';
import WeeklyReportLoading from './WeeklyReportLoading';
import { DEV } from '@/lib/env';
import { useNavigate } from 'react-router-dom';

// --- Icons ---

function ArrowLeftIcon() {
  return (
    <div className="absolute inset-0">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

function PenIcon({ size = 18, color = "#999999" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="path-1-inside-1_6292_38978" fill="white">
        <path fillRule="evenodd" clipRule="evenodd" d="M2.16797 14.666C2.16797 14.5334 2.22065 14.4062 2.31442 14.3125C2.40818 14.2187 2.53536 14.166 2.66797 14.166H13.3346C13.4672 14.166 13.5944 14.2187 13.6882 14.3125C13.782 14.4062 13.8346 14.5334 13.8346 14.666C13.8346 14.7986 13.782 14.9258 13.6882 15.0196C13.5944 15.1133 13.4672 15.166 13.3346 15.166H2.66797C2.53536 15.166 2.40818 15.1133 2.31442 15.0196C2.22065 14.9258 2.16797 14.7986 2.16797 14.666Z"/>
      </mask>
      <path fillRule="evenodd" clipRule="evenodd" d="M2.16797 14.666C2.16797 14.5334 2.22065 14.4062 2.31442 14.3125C2.40818 14.2187 2.53536 14.166 2.66797 14.166H13.3346C13.4672 14.166 13.5944 14.2187 13.6882 14.3125C13.782 14.4062 13.8346 14.5334 13.8346 14.666C13.8346 14.7986 13.782 14.9258 13.6882 15.0196C13.5944 15.1133 13.4672 15.166 13.3346 15.166H2.66797C2.53536 15.166 2.40818 15.1133 2.31442 15.0196C2.22065 14.9258 2.16797 14.7986 2.16797 14.666Z" fill={color}/>
      <path d="M2.16797 14.666H3.16797C3.16797 14.7986 3.11529 14.9258 3.02152 15.0196L2.31442 14.3125L1.60731 13.6054C1.326 13.8867 1.16797 14.2682 1.16797 14.666H2.16797ZM2.31442 14.3125L3.02152 15.0196C2.92775 15.1133 2.80057 15.166 2.66797 15.166V14.166V13.166C2.27015 13.166 1.88861 13.324 1.60731 13.6054L2.31442 14.3125ZM2.66797 14.166V15.166H13.3346V14.166V13.166H2.66797V14.166ZM13.3346 14.166V15.166C13.202 15.166 13.0749 15.1133 12.9811 15.0196L13.6882 14.3125L14.3953 13.6054C14.114 13.324 13.7325 13.166 13.3346 13.166V14.166ZM13.6882 14.3125L12.9811 15.0196C12.8873 14.9258 12.8346 14.7986 12.8346 14.666H13.8346H14.8346C14.8346 14.2682 14.6766 13.8867 14.3953 13.6054L13.6882 14.3125ZM13.8346 14.666H12.8346C12.8346 14.5334 12.8873 14.4062 12.9811 14.3125L13.6882 15.0196L14.3953 15.7267C14.6766 15.4454 14.8346 15.0638 14.8346 14.666H13.8346ZM13.6882 15.0196L12.9811 14.3125C13.0749 14.2187 13.202 14.166 13.3346 14.166V15.166V16.166C13.7325 16.166 14.114 16.008 14.3953 15.7267L13.6882 15.0196ZM13.3346 15.166V14.166H2.66797V15.166V16.166H13.3346V15.166ZM2.66797 15.166V14.166C2.80057 14.166 2.92775 14.2187 3.02152 14.3125L2.31442 15.0196L1.60731 15.7267C1.88861 16.008 2.27015 16.166 2.66797 16.166V15.166ZM2.31442 15.0196L3.02152 14.3125C3.11529 14.4062 3.16797 14.5334 3.16797 14.666H2.16797H1.16797C1.16797 15.0638 1.326 15.4454 1.60731 15.7267L2.31442 15.0196Z" fill={color} mask="url(#path-1-inside-1_6292_38978)"/>
      <mask id="path-3-inside-2_6292_38978" fill="white">
        <path d="M7.68176 9.95188L11.6264 6.00721C10.9625 5.73067 10.3596 5.32582 9.85243 4.81588C9.34217 4.30854 8.9371 3.70545 8.66043 3.04121L4.7151 6.98588C4.4071 7.29388 4.2531 7.44721 4.1211 7.61721C3.96473 7.81727 3.83082 8.0339 3.72176 8.26321C3.6291 8.45721 3.56043 8.66388 3.42243 9.07655L2.6971 11.2545C2.66381 11.3542 2.65895 11.4611 2.68305 11.5634C2.70715 11.6656 2.75927 11.7591 2.83355 11.8334C2.90783 11.9077 3.00135 11.9598 3.1036 11.9839C3.20585 12.008 3.31279 12.0032 3.41243 11.9699L5.58976 11.2445C6.0031 11.1065 6.20976 11.0379 6.40376 10.9445C6.63399 10.8352 6.84932 10.7023 7.04976 10.5459C7.21976 10.4132 7.3731 10.2592 7.6811 9.95188M12.7211 4.91255C12.9158 4.71775 13.0703 4.48651 13.1757 4.23201C13.2811 3.97752 13.3353 3.70476 13.3353 3.42931C13.3352 3.15386 13.281 2.88111 13.1755 2.62664C13.0701 2.37217 12.9156 2.14096 12.7208 1.94621C12.526 1.75146 12.2947 1.59699 12.0402 1.4916C11.7857 1.38622 11.513 1.332 11.2375 1.33203C10.9621 1.33206 10.6893 1.38635 10.4349 1.49179C10.1804 1.59722 9.94918 1.75175 9.75443 1.94655L9.2811 2.41988L9.30176 2.47988C9.4751 2.97921 9.80243 3.63455 10.4178 4.24988C10.931 4.76615 11.558 5.15519 12.2484 5.38588L12.7211 4.91255Z"/>
      </mask>
      <path d="M7.68176 9.95188L11.6264 6.00721C10.9625 5.73067 10.3596 5.32582 9.85243 4.81588C9.34217 4.30854 8.9371 3.70545 8.66043 3.04121L4.7151 6.98588C4.4071 7.29388 4.2531 7.44721 4.1211 7.61721C3.96473 7.81727 3.83082 8.0339 3.72176 8.26321C3.6291 8.45721 3.56043 8.66388 3.42243 9.07655L2.6971 11.2545C2.66381 11.3542 2.65895 11.4611 2.68305 11.5634C2.70715 11.6656 2.75927 11.7591 2.83355 11.8334C2.90783 11.9077 3.00135 11.9598 3.1036 11.9839C3.20585 12.008 3.31279 12.0032 3.41243 11.9699L5.58976 11.2445C6.0031 11.1065 6.20976 11.0379 6.40376 10.9445C6.63399 10.8352 6.84932 10.7023 7.04976 10.5459C7.21976 10.4132 7.3731 10.2592 7.6811 9.95188M12.7211 4.91255C12.9158 4.71775 13.0703 4.48651 13.1757 4.23201C13.2811 3.97752 13.3353 3.70476 13.3353 3.42931C13.3352 3.15386 13.281 2.88111 13.1755 2.62664C13.0701 2.37217 12.9156 2.14096 12.7208 1.94621C12.526 1.75146 12.2947 1.59699 12.0402 1.4916C11.7857 1.38622 11.513 1.332 11.2375 1.33203C10.9621 1.33206 10.6893 1.38635 10.4349 1.49179C10.1804 1.59722 9.94918 1.75175 9.75443 1.94655L9.2811 2.41988L9.30176 2.47988C9.4751 2.97921 9.80243 3.63455 10.4178 4.24988C10.931 4.76615 11.558 5.15519 12.2484 5.38588L12.7211 4.91255Z" fill={color}/>
      <path d="M11.6264 6.00721L12.3335 6.71432L13.3896 5.6583L12.0109 5.08409L11.6264 6.00721ZM9.85243 4.81588L10.5615 4.11067L10.5575 4.10675L9.85243 4.81588ZM8.66043 3.04121L9.58356 2.65672L9.00939 1.27822L7.95338 2.33405L8.66043 3.04121ZM4.7151 6.98588L4.00805 6.27871L4.00799 6.27877L4.7151 6.98588ZM4.1211 7.61721L4.90899 8.23304L4.91095 8.23051L4.1211 7.61721ZM3.72176 8.26321L4.62411 8.69423L4.62484 8.69269L3.72176 8.26321ZM3.42243 9.07655L2.47405 8.7594L2.47366 8.76058L3.42243 9.07655ZM2.6971 11.2545L3.64557 11.5714L3.64587 11.5705L2.6971 11.2545ZM3.41243 11.9699L3.09638 11.0211L3.09557 11.0214L3.41243 11.9699ZM5.58976 11.2445L5.90582 12.1933L5.90645 12.1931L5.58976 11.2445ZM6.40376 10.9445L5.97477 10.0412L5.97023 10.0434L6.40376 10.9445ZM7.04976 10.5459L6.43454 9.75753L6.43449 9.75756L7.04976 10.5459ZM12.7211 4.91255L12.0139 4.20552L12.0135 4.20594L12.7211 4.91255ZM9.75443 1.94655L10.4615 2.65365L10.4616 2.65357L9.75443 1.94655ZM9.2811 2.41988L8.57399 1.71277L8.13209 2.15467L8.33561 2.74555L9.2811 2.41988ZM9.30176 2.47988L8.35628 2.80555L8.35706 2.80781L9.30176 2.47988ZM10.4178 4.24988L11.1269 3.54484L11.1249 3.54277L10.4178 4.24988ZM12.2484 5.38588L11.9315 6.33434L12.5186 6.5305L12.956 6.09249L12.2484 5.38588ZM7.68177 9.95188L8.38887 10.659L12.3335 6.71432L11.6264 6.00721L10.9193 5.30011L6.97466 9.24477L7.68177 9.95188ZM11.6264 6.00721L12.0109 5.08409C11.4684 4.85813 10.9759 4.52734 10.5614 4.11068L9.85243 4.81588L9.14342 5.52108C9.74341 6.12431 10.4565 6.60321 11.2419 6.93034L11.6264 6.00721ZM9.85243 4.81588L10.5575 4.10675C10.1406 3.69221 9.80961 3.19945 9.58356 2.65672L8.66043 3.04121L7.7373 3.42571C8.06458 4.21146 8.54376 4.92486 9.14735 5.52501L9.85243 4.81588ZM8.66043 3.04121L7.95338 2.33405L4.00805 6.27871L4.7151 6.98588L5.42215 7.69305L9.36748 3.74838L8.66043 3.04121ZM4.7151 6.98588L4.00799 6.27877C3.71826 6.5685 3.51074 6.77274 3.33125 7.00392L4.1211 7.61721L4.91095 8.23051C4.99545 8.12168 5.09593 8.01926 5.42221 7.69299L4.7151 6.98588ZM4.1211 7.61721L3.33321 7.00139C3.13174 7.25916 2.95919 7.53828 2.81869 7.83374L3.72176 8.26321L4.62484 8.69269C4.70244 8.52952 4.79772 8.37538 4.90899 8.23303L4.1211 7.61721ZM3.72176 8.26321L2.81942 7.8322C2.69399 8.09479 2.60404 8.3707 2.47406 8.7594L3.42243 9.07655L4.37081 9.39369C4.51682 8.95706 4.56421 8.81964 4.62411 8.69423L3.72176 8.26321ZM3.42243 9.07655L2.47366 8.76058L1.74833 10.9386L2.6971 11.2545L3.64587 11.5705L4.3712 9.39251L3.42243 9.07655ZM2.6971 11.2545L1.74863 10.9377C1.65646 11.2136 1.64299 11.5097 1.70972 11.7928L2.68305 11.5634L3.65637 11.3339C3.67491 11.4126 3.67116 11.4948 3.64557 11.5714L2.6971 11.2545ZM2.68305 11.5634L1.70972 11.7928C1.77646 12.0759 1.92076 12.3348 2.12644 12.5405L2.83355 11.8334L3.54066 11.1263C3.59778 11.1834 3.63784 11.2553 3.65637 11.3339L2.68305 11.5634ZM2.83355 11.8334L2.12644 12.5405C2.33213 12.7462 2.59105 12.8905 2.87417 12.9573L3.1036 11.9839L3.33303 11.0106C3.41164 11.0291 3.48354 11.0692 3.54066 11.1263L2.83355 11.8334ZM3.1036 11.9839L2.87417 12.9573C3.15729 13.024 3.4534 13.0105 3.72929 12.9184L3.41243 11.9699L3.09557 11.0214C3.17218 10.9958 3.25441 10.9921 3.33303 11.0106L3.1036 11.9839ZM3.41243 11.9699L3.72849 12.9186L5.90582 12.1933L5.58976 11.2445L5.27371 10.2958L3.09638 11.0211L3.41243 11.9699ZM5.58976 11.2445L5.90645 12.1931C6.29564 12.0631 6.57307 11.9728 6.8373 11.8457L6.40376 10.9445L5.97023 10.0434C5.84645 10.103 5.71056 10.15 5.27308 10.296L5.58976 11.2445ZM6.40376 10.9445L6.83275 11.8479C7.12893 11.7072 7.40675 11.5358 7.66504 11.3342L7.04976 10.5459L6.43449 9.75756C6.29189 9.86887 6.13904 9.96323 5.97478 10.0412L6.40376 10.9445ZM7.04976 10.5459L7.66499 11.3342C7.89448 11.1551 8.09784 10.9487 8.38744 10.6598L7.6811 9.95188L6.97476 9.24401C6.64836 9.5697 6.54505 9.67129 6.43454 9.75753L7.04976 10.5459ZM12.7211 4.91255L13.4283 5.61957C13.7159 5.33191 13.944 4.99042 14.0996 4.61459L13.1757 4.23201L12.2518 3.84943C12.1966 3.98259 12.1158 4.10359 12.0139 4.20552L12.7211 4.91255ZM13.1757 4.23201L14.0996 4.61459C14.2553 4.23876 14.3353 3.83597 14.3353 3.4292L13.3353 3.42931L12.3353 3.42942C12.3353 3.57355 12.3069 3.71627 12.2518 3.84943L13.1757 4.23201ZM13.3353 3.42931L14.3353 3.4292C14.3352 3.02243 14.2551 2.61965 14.0994 2.24386L13.1755 2.62664L12.2517 3.00943C12.3069 3.14258 12.3353 3.28529 12.3353 3.42942L13.3353 3.42931ZM13.1755 2.62664L14.0994 2.24386C13.9437 1.86807 13.7155 1.52662 13.4278 1.23903L12.7208 1.94621L12.0137 2.6534C12.1157 2.7553 12.1965 2.87628 12.2517 3.00943L13.1755 2.62664ZM12.7208 1.94621L13.4278 1.23903C13.1401 0.951427 12.7986 0.723305 12.4228 0.567682L12.0402 1.4916L11.6577 2.41553C11.7908 2.47067 11.9118 2.5515 12.0137 2.6534L12.7208 1.94621ZM12.0402 1.4916L12.4228 0.567682C12.047 0.41206 11.6442 0.331986 11.2374 0.332031L11.2375 1.33203L11.2376 2.33203C11.3818 2.33202 11.5245 2.36039 11.6577 2.41553L12.0402 1.4916ZM11.2375 1.33203L11.2374 0.332031C10.8306 0.332077 10.4279 0.412242 10.0521 0.567949L10.4349 1.49179L10.8176 2.41562C10.9508 2.36045 11.0935 2.33205 11.2376 2.33203L11.2375 1.33203ZM10.4349 1.49179L10.0521 0.567949C9.67629 0.723655 9.33484 0.951855 9.04724 1.23952L9.75443 1.94655L10.4616 2.65357C10.5635 2.55165 10.6845 2.47079 10.8176 2.41562L10.4349 1.49179ZM9.75443 1.94655L9.04732 1.23944L8.57399 1.71277L9.2811 2.41988L9.9882 3.12699L10.4615 2.65365L9.75443 1.94655ZM9.2811 2.41988L8.33561 2.74555L8.35628 2.80555L9.30176 2.47988L10.2472 2.15421L10.2266 2.09421L9.2811 2.41988ZM9.30176 2.47988L8.35706 2.80781C8.56913 3.41873 8.96742 4.21375 9.71066 4.95699L10.4178 4.24988L11.1249 3.54277C10.6374 3.05534 10.3811 2.53969 10.2465 2.15195L9.30176 2.47988ZM10.4178 4.24988L9.70859 4.95491C10.3318 5.58182 11.0931 6.05422 11.9315 6.33434L12.2484 5.38588L12.5653 4.43742C12.0228 4.25616 11.5302 3.95049 11.1269 3.54484L10.4178 4.24988ZM12.2484 5.38588L12.956 6.09249L13.4287 5.61915L12.7211 4.91255L12.0135 4.20594L11.5408 4.67927L12.2484 5.38588Z" fill={color} mask="url(#path-3-inside-2_6292_38978)"/>
    </svg>
  );
}

// --- Sub Components ---

function Toast({ onComplete, message = "변경사항이 저장되었어요" }: { onComplete: () => void; message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, x: "-50%" }}
      animate={{
        opacity: [0, 1, 1, 1],
        y: [100, 0, 0, 160],
        x: "-50%"
      }}
      transition={{
        delay: 0,
        duration: 2.2,
        times: [0, 0.15, 0.8, 1],
        ease: ["easeOut", "linear", "easeIn"]
      }}
      onAnimationComplete={onComplete}
      className="fixed z-50 flex items-center justify-center left-1/2 whitespace-nowrap shadow-none"
      style={{ backdropFilter: 'blur(15px)', backgroundColor: 'rgba(0,0,0,0.5)', bottom: '30px', padding: '8px 16px 8px 12px', borderRadius: '999px', transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center relative shrink-0" style={{ gap: '8px' }}>
        <div className="relative shrink-0 rounded-full flex items-center justify-center" style={{ width: '24px', height: '24px', backgroundColor: '#46BB6F' }}>
           <Check size={16} color="white" strokeWidth={3} />
        </div>
        <p className="relative shrink-0 text-white" style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, lineHeight: '22px', fontSize: '13px' }}>{message}</p>
      </div>
    </motion.div>
  );
}

// 공통 TopBar - X 버튼 (write/view 모드 공통)
function TopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div className="w-full" style={{ maxWidth: '440px', height: '52px' }}>
      <div className="flex items-center justify-between h-full" style={{ paddingLeft: '24px', paddingRight: '12px' }}>
        <h1
          style={{
            fontFamily: 'Pretendard Variable, sans-serif',
            fontWeight: 600,
            fontSize: '18px',
            lineHeight: '25.5px',
            letterSpacing: '-0.36px',
            color: '#000000'
          }}
        >
          이번 주 보고서
        </h1>
        <button
          onClick={onClose}
          className="group flex items-center justify-center cursor-pointer transition-colors duration-200 active:bg-gray-100"
          style={{ width: '44px', height: '44px', borderRadius: '12px' }}
        >
          <X
            className="transition-transform duration-200 group-active:scale-90"
            style={{ width: '24px', height: '24px', color: '#848484' }}
            strokeWidth={1.8}
          />
        </button>
      </div>
      </div>
    </div>
  );
}

// 다시보기(view) 모드용 TopBar - X 버튼 (TopBar와 동일, 별칭)
function TopBarWithClose({ onClose }: { onClose?: () => void }) {
  return <TopBar onClose={onClose} />;
}

interface TextAreaSectionProps {
  text: string;
  onChange: (val: string) => void;
}

function TextAreaSection({ text, onChange }: TextAreaSectionProps) {
  const maxLength = 120;
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= maxLength) {
      onChange(val);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex flex-col w-full" style={{ gap: '12px' }}>
        {/* Header Text */}
        <div className="flex flex-col w-full" style={{ gap: '2px', padding: '0 4px' }}>
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#000000',
            letterSpacing: '-0.36px'
          }}>나에게 쓰는 한마디</p>
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 400,
            fontSize: '13px',
            lineHeight: '22px',
            color: '#6d6d6d',
            letterSpacing: '-0.42px'
          }}>한 주 동안 애쓴 당신에게 칭찬 한마디 어때요? (선택)</p>
        </div>

        {/* Text Area Box */}
        <div
          className="w-full relative border transition-colors duration-200"
          style={{
            borderRadius: '20px',
            padding: '12px 16px',
            borderColor: isFocused ? '#48b2af' : (text.length > 0 ? '#F3F3F3' : '#f9f9f9'),
            backgroundColor: (text.length > 0 && !isFocused) ? '#ffffff' : '#f9f9f9',
            outline: isFocused ? '0.5px solid #48B2AF' : 'none'
          }}
        >
          <div className="flex flex-col w-full" style={{ gap: '12px' }}>
            <textarea
              value={text}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="마음이 가는대로 적어보세요 :)"
              className="memo-textarea w-full bg-transparent outline-none resize-none placeholder:font-light placeholder:text-[15px]"
              style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '25.5px',
                color: '#151515',
                letterSpacing: '-0.3px',
                minHeight: '150px'
              }}
            />

            {/* Character Count */}
            <div className="flex justify-end w-full">
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontSize: '13px',
                lineHeight: '19px',
                letterSpacing: '-0.26px'
              }}>
                <span style={{
                  fontWeight: text.length > 0 ? 600 : 400,
                  color: text.length > 0 ? '#48b2af' : '#999999',
                  transition: 'color 0.2s'
                }}>
                  {text.length}
                </span>
                <span style={{
                  fontWeight: 400,
                  color: '#999999'
                }}>
                  /{maxLength}자
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BottomButtonsProps {
  onPrev?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

function BottomButtons({ onPrev, onComplete, isLoading }: BottomButtonsProps) {
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isCompletePressed, setIsCompletePressed] = useState(false);

  const handlePrevPress = () => !isLoading && setIsPrevPressed(true);
  const handlePrevRelease = () => setIsPrevPressed(false);
  const handleCompletePress = () => !isLoading && setIsCompletePressed(true);
  const handleCompleteRelease = () => setIsCompletePressed(false);

  const handleCompleteClick = () => {
    console.log('🔘 [버튼] 완료 버튼 클릭됨');
    console.log('🔘 [버튼] onComplete 함수 존재:', !!onComplete);
    console.log('🔘 [버튼] isLoading:', isLoading);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            disabled={isLoading}
            onMouseDown={handlePrevPress}
            onMouseUp={handlePrevRelease}
            onMouseLeave={handlePrevRelease}
            onTouchStart={handlePrevPress}
            onTouchEnd={handlePrevRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer disabled:opacity-50"
            style={{
              borderRadius: '16px',
              backgroundColor: isPrevPressed && !isLoading ? '#E4F7F7' : '#f0f8f8',
              height: '56px',
              transform: isPrevPressed && !isLoading ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#48b2af',
              letterSpacing: '-0.32px'
            }}>이전</p>
          </button>

          {/* 완료 버튼 - 항상 활성화 */}
          <button
            onClick={handleCompleteClick}
            disabled={isLoading}
            onMouseDown={handleCompletePress}
            onMouseUp={handleCompleteRelease}
            onMouseLeave={handleCompleteRelease}
            onTouchStart={handleCompletePress}
            onTouchEnd={handleCompleteRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer disabled:opacity-70"
            style={{
              borderRadius: '16px',
              backgroundColor: isCompletePressed && !isLoading ? '#41A09E' : '#48b2af',
              height: '56px',
              transform: isCompletePressed && !isLoading ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#ffffff',
              letterSpacing: '-0.32px'
            }}>{isLoading ? '저장 중...' : '완료'}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// 다시보기(view) 모드용 BottomButtons - 이전/닫기
interface BottomButtonsViewProps {
  onPrev?: () => void;
  onClose?: () => void;
}

function BottomButtonsView({ onPrev, onClose }: BottomButtonsViewProps) {
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isClosePressed, setIsClosePressed] = useState(false);

  const handlePrevPress = () => setIsPrevPressed(true);
  const handlePrevRelease = () => setIsPrevPressed(false);
  const handleClosePress = () => setIsClosePressed(true);
  const handleCloseRelease = () => setIsClosePressed(false);

  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            onMouseDown={handlePrevPress}
            onMouseUp={handlePrevRelease}
            onMouseLeave={handlePrevRelease}
            onTouchStart={handlePrevPress}
            onTouchEnd={handlePrevRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isPrevPressed ? '#E4F7F7' : '#f0f8f8',
              height: '56px',
              transform: isPrevPressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#48b2af',
              letterSpacing: '-0.32px'
            }}>이전</p>
          </button>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            onMouseDown={handleClosePress}
            onMouseUp={handleCloseRelease}
            onMouseLeave={handleCloseRelease}
            onTouchStart={handleClosePress}
            onTouchEnd={handleCloseRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isClosePressed ? '#41A09E' : '#48b2af',
              height: '56px',
              transform: isClosePressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#ffffff',
              letterSpacing: '-0.32px'
            }}>닫기</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// CompletionCoupon, MypageProfile 삭제 대체 플레이스홀더
function PlaceholderView({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }}>
      <TopBar onClose={onClose} />
      <div className="flex-1 flex items-center justify-center">
        <p style={{ fontFamily: 'Pretendard Variable', fontSize: '16px', color: '#999999' }}>
          {title} (준비 중)
        </p>
      </div>
    </div>
  );
}

// Main Component
interface ReportWeeklyMemoProps {
  reportId?: string;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

// 모드: write(최초작성), view(다시보기), edit(수정하기)
type MemoMode = 'loading' | 'write' | 'view' | 'edit';
type ViewState = 'input' | 'edit' | 'result' | 'mypage' | 'report' | 'tarotPicking' | 'tarotResult' | 'prescription';

export default function ReportWeeklyMemo({ reportId, onClose, onPrev, onNext }: ReportWeeklyMemoProps) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState<string | null>(null);
  const [mode, setMode] = useState<MemoMode>('loading');
  const [view, setView] = useState<ViewState>('input');
  const [mypageTab, setMypageTab] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("변경사항이 저장되었어요");
  const [isSaving, setIsSaving] = useState(false);

  // 기존 응원글 조회
  useEffect(() => {
    async function fetchSelfEncouragement() {
      if (!reportId) {
        setMode('write');
        return;
      }

      try {
        console.log('📖 [응원글] 기존 응원글 조회 중...');
        const { data, error } = await supabase
          .from('weekly_reports')
          .select('self_encouragement')
          .eq('id', reportId)
          .single();

        if (error) {
          console.error('❌ [응원글] 조회 실패:', error);
          setMode('write');
          return;
        }

        if (data?.self_encouragement) {
          console.log('✅ [응원글] 기존 응원글 있음:', data.self_encouragement);
          setSavedText(data.self_encouragement);
          setText(data.self_encouragement);
          setMode('view'); // 다시보기 모드
        } else {
          console.log('📝 [응원글] 기존 응원글 없음 - 작성 모드');
          setMode('write'); // 작성 모드
        }
      } catch (err) {
        console.error('❌ [응원글] 조회 중 예외:', err);
        setMode('write');
      }
    }

    fetchSelfEncouragement();
  }, [reportId]);

  // 응원글 저장 (최초 작성 시)
  const handleComplete = async () => {
    console.log('🎯 [응원글] handleComplete 호출됨');

    if (isSaving) return;

    if (text.trim() && reportId) {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('weekly_reports')
          .update({ self_encouragement: text.trim() })
          .eq('id', reportId);

        if (error) {
          console.error('❌ [응원글] 저장 실패:', error);
        } else {
          console.log('✅ [응원글] 저장 완료');
          // ⭐ 캐시 무효화 (보고서 목록 + 상세 캐시)
          localStorage.removeItem('my_report_cache_v3');
          localStorage.setItem('my_report_needs_refresh', 'true');
          invalidateWeeklyReportCache(reportId);
          console.log('🗑️ [응원글] 보고서 캐시 삭제 + refresh 플래그 설정');
        }
      } catch (err) {
        console.error('❌ [응원글] 저장 중 예외:', err);
      } finally {
        setIsSaving(false);
      }
    }

    onNext?.();
  };

  // 응원글 수정 저장 (수정 모드에서)
  const handleSaveEdit = async (newText: string) => {
    console.log('📝 [응원글] 수정 저장 시작...');

    if (!reportId) return;

    try {
      const { error } = await supabase
        .from('weekly_reports')
        .update({ self_encouragement: newText.trim() })
        .eq('id', reportId);

      if (error) {
        console.error('❌ [응원글] 수정 저장 실패:', error);
      } else {
        console.log('✅ [응원글] 수정 저장 완료');
        setSavedText(newText.trim());
        // ⭐ 캐시 무효화 (보고서 목록 + 상세 캐시)
        localStorage.removeItem('my_report_cache_v3');
        localStorage.setItem('my_report_needs_refresh', 'true');
        invalidateWeeklyReportCache(reportId);
        console.log('🗑️ [응원글] 보고서 캐시 삭제 + refresh 플래그 설정');
        setText(newText.trim());
        setToastMessage("수정이 반영됐어요.");
        setShowToast(true);
      }
    } catch (err) {
      console.error('❌ [응원글] 수정 저장 중 예외:', err);
    }

    setMode('view'); // 다시보기로 복귀
  };

  // 로딩 중 - WeeklyReportLoading 사용 (FreeContentLoading과 동일)
  if (mode === 'loading') {
    return <WeeklyReportLoading />;
  }

  // 수정 모드 - ReportWeeklyMemoEdit 사용
  if (mode === 'edit') {
    return (
      <>
        <ReportWeeklyMemoEdit
          initialText={savedText || ''}
          onCancel={() => setMode('view')}
          onSave={handleSaveEdit}
        />
        <AnimatePresence>
          {showToast && <Toast onComplete={() => setShowToast(false)} message={toastMessage} />}
        </AnimatePresence>
      </>
    );
  }

  // MypageProfile 삭제됨 - 플레이스홀더로 대체
  if (view === 'mypage') {
    return (
      <>
        <PlaceholderView title="마이페이지" onClose={() => setView('result')} />
        <AnimatePresence>
          {showToast && <Toast onComplete={() => setShowToast(false)} />}
        </AnimatePresence>
      </>
    );
  }

  if (view === 'report') {
    return <ReportWeeklyDetail onClose={() => setView('result')} onPrev={() => setView('result')} onNext={() => setView('tarotPicking')} />;
  }

  if (view === 'tarotPicking') {
    return <ReportWeeklyTarot onClose={() => setView('report')} onNext={() => setView('tarotResult')} />;
  }

  if (view === 'tarotResult') {
    return <ReportWeeklyTarotResult onClose={() => setView('tarotPicking')} onNext={() => setView('prescription')} />;
  }

  if (view === 'prescription') {
    return <ReportWeeklyMindCare onClose={() => setView('tarotResult')} onPrev={() => setView('tarotResult')} />;
  }

  // CompletionCoupon 삭제됨 - 플레이스홀더로 대체
  if (view === 'result') {
    return (
      <PlaceholderView title="완료/쿠폰" onClose={() => setView('input')} />
    );
  }

  // 다시보기 모드 (view) - 저장된 응원글 읽기 전용
  if (mode === 'view') {
    return (
      <>
        <TopBarWithClose onClose={onNext} />
        <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-y-auto" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '100px' }}>
          {/* Content */}
          <div className="flex-1 w-full relative">
            <div className="w-full" style={{ padding: '4px 20px 40px' }}>
              {/* Header with Edit Icon */}
              <div className="flex items-start justify-between w-full" style={{ marginBottom: '12px', padding: '0 4px' }}>
                <div className="flex flex-col" style={{ gap: '2px' }}>
                  <p style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                    letterSpacing: '-0.36px'
                  }}>나에게 쓰는 한마디</p>
                  <p style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '22px',
                    color: '#6d6d6d',
                    letterSpacing: '-0.42px'
                  }}>한 주 동안 애쓴 당신에게 칭찬 한마디 어때요? (선택)</p>
                </div>
                {/* 수정 아이콘 */}
                {savedText && (
                  <button
                    onClick={() => setMode('edit')}
                    className="group flex items-center justify-center cursor-pointer transition-colors duration-200 active:bg-gray-100"
                    style={{ width: '44px', height: '44px', borderRadius: '12px', marginRight: '-10px' }}
                  >
                    <div className="transition-transform duration-200 group-active:scale-90">
                      <PenIcon size={20} color="#999999" />
                    </div>
                  </button>
                )}
              </div>

              {/* 읽기 전용 텍스트 박스 */}
              <div
                className="w-full relative"
                style={{
                  borderRadius: '20px',
                  padding: '16px',
                  backgroundColor: savedText ? '#ffffff' : '#f9f9f9',
                  border: savedText ? '1px solid #F3F3F3' : 'none'
                }}
              >
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '25.5px',
                  color: '#151515',
                  letterSpacing: '-0.3px',
                  minHeight: '150px',
                  whiteSpace: 'pre-wrap'
                }}>{savedText}</p>
              </div>

              {/* 개발 환경 전용 테스트 버튼 */}
              <button
                onClick={() => navigate('/test/completion-coupon')}
                className="w-full text-center rounded-lg"
                style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#48b2af',
                  backgroundColor: '#f0f8f8',
                  padding: '12px 16px',
                  border: '1px solid #e0f2f1',
                  marginTop: '20px'
                }}
              >
                🎫 쿠폰 완료 화면 보기 (테스트용)
              </button>
            </div>
          </div>

          <BottomButtonsView onPrev={onPrev} onClose={onNext} />
        </div>
        <AnimatePresence>
          {showToast && <Toast onComplete={() => setShowToast(false)} message={toastMessage} />}
        </AnimatePresence>
      </>
    );
  }

  // 작성 모드 (write) - 최초 작성
  return (
    <>
      <style>{`
        .memo-textarea::placeholder {
          color: #B7B7B7;
        }
      `}</style>
      <TopBar onClose={onClose} />
      <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-y-auto" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '100px' }}>
        {/* Content */}
        <div className="flex-1 w-full relative">
        <div className="w-full" style={{ padding: '4px 20px 40px' }}>
          <TextAreaSection text={text} onChange={setText} />

          {/* 개발 환경 전용 테스트 버튼 */}
          <button
            onClick={() => navigate('/test/completion-coupon')}
            className="w-full text-center rounded-lg"
            style={{
              fontFamily: 'Pretendard Variable',
              fontSize: '14px',
              fontWeight: 500,
              color: '#48b2af',
              backgroundColor: '#f0f8f8',
              padding: '12px 16px',
              border: '1px solid #e0f2f1',
              marginTop: '20px'
            }}
          >
            🎫 쿠폰 완료 화면 보기 (테스트용)
          </button>

        </div>
      </div>

      <BottomButtons onPrev={onPrev} onComplete={handleComplete} isLoading={isSaving} />
      </div>
    </>
  );
}
