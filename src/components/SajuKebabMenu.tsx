/**
 * 사주 정보 케밥 메뉴 드롭다운
 * Figma import: ButtonCategoryPopupButtons from 사주정보관리편집시.tsx
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import svgPaths from "../imports/svg-nykl32kbwr";

interface SajuKebabMenuProps {
  /** 드롭다운 표시 여부 */
  isOpen: boolean;
  /** 드롭다운 위치 (케밥 버튼 좌표) */
  position: { top: number; left: number };
  /** 본인 사주 여부 (false면 삭제 버튼 표시) */
  isOwnerSaju: boolean;
  /** 정보 수정 클릭 핸들러 */
  onEdit: () => void;
  /** 정보 삭제 클릭 핸들러 */
  onDelete: () => void;
  /** 드롭다운 닫기 핸들러 */
  onClose: () => void;
}

export function SajuKebabMenu({
  isOpen,
  position,
  isOwnerSaju,
  onEdit,
  onDelete,
  onClose,
}: SajuKebabMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 디버깅 정보 출력
  useEffect(() => {
    if (isOpen) {
      console.log('🍔 [케밥메뉴] 열림:', { position, isOwnerSaju });
    }
  }, [isOpen, position, isOwnerSaju]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ⭐ 바텀 시트 오픈 시 body 스크롤 잠금 및 상태바 색상 변경
  useEffect(() => {
    if (isOpen) {
      // ⚠️ [수정] position: fixed 제거하고 overflow: hidden만 사용
      // 하단 여백 뜨는 현상 방지
      document.body.style.overflow = 'hidden';

      // ⭐ 상태바 색상 변경 (어두운 색)
      // 모바일(iOS)에서 상태바까지 딤 처리된 것처럼 보이게 함
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      const originalThemeColor = metaThemeColor.getAttribute('content');
      metaThemeColor.setAttribute('content', '#000000'); // 상태바 딤 처리를 위해 검정색 사용

      return () => {
        // 복구
        document.body.style.overflow = '';
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', originalThemeColor || '#ffffff');
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Background Overlay (투명) - 터치 차단용 */}
      <div 
        className="fixed inset-0 z-[50]"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Dropdown Menu */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center pointer-events-none">
          {/* Dim Overlay */}
          {/* ⭐ pointer-events-auto로 설정하여 클릭 이벤트 수신 */}
          {/* fixed inset-0로 뷰포트 전체 커버 */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity pointer-events-auto" 
            onClick={onClose}
            style={{ touchAction: 'none' }} // 모바일 스크롤 전파 방지
          />
          
          {/* Bottom Sheet */}
          {/* pointer-events-auto로 컨텐츠 상호작용 가능하게 함 */}
          <div className="relative w-full max-w-[440px] bg-white rounded-t-[16px] overflow-hidden animate-in slide-in-from-bottom duration-300 pointer-events-auto">
            
            {/* Handle - Drag Area */}
            

            {/* Content */}
            <div className="flex flex-col items-start pb-[20px] pt-[28px] px-0 w-full pr-[0px] pl-[0px]">
              <div className="flex flex-col gap-[6px] items-start w-full">
                  
                  {/* Edit Button */}
                  <button 
                    onClick={() => { onEdit(); onClose(); }}
                    className="w-full flex flex-row items-center justify-center px-[20px] py-[16px] gap-[8px] active:bg-gray-100 transition-colors"
                  >
                    <div className="size-[16px] relative shrink-0">
                       <svg className="block size-full" fill="none" viewBox="0 0 16 16">
                         <g>
                           <path clipRule="evenodd" d="M2.16667 14.6667C2.16667 14.5341 2.21935 14.4069 2.31311 14.3131C2.40688 14.2193 2.53406 14.1667 2.66667 14.1667H13.3333C13.4659 14.1667 13.5931 14.2193 13.6869 14.3131C13.7807 14.4069 13.8333 14.5341 13.8333 14.6667C13.8333 14.7993 13.7807 14.9265 13.6869 15.0202C13.5931 15.114 13.4659 15.1667 13.3333 15.1667H2.66667C2.53406 15.1667 2.40688 15.114 2.31311 15.0202C2.21935 14.9265 2.16667 14.7993 2.16667 14.6667Z" fill="#6D6D6D" fillRule="evenodd"/>
                           <path d="M7.68 9.95267L11.6247 6.008C10.9607 5.73146 10.3579 5.32661 9.85067 4.81667C9.34041 4.30932 8.93533 3.70624 8.65867 3.042L4.71333 6.98667C4.40533 7.29467 4.25133 7.448 4.11933 7.618C3.96297 7.81806 3.82905 8.03469 3.72 8.264C3.62733 8.458 3.55867 8.66467 3.42067 9.07733L2.69533 11.2553C2.66205 11.355 2.65718 11.4619 2.68128 11.5642C2.70539 11.6664 2.7575 11.7599 2.83179 11.8342C2.90607 11.9085 2.99958 11.9606 3.10183 11.9847C3.20408 12.0088 3.31103 12.004 3.41067 11.9707L5.588 11.2453C6.00133 11.1073 6.208 11.0387 6.402 10.9453C6.63222 10.836 6.84755 10.7031 7.048 10.5467C7.218 10.414 7.37133 10.26 7.67933 9.95267M12.7193 4.91333C12.9141 4.71854 13.0686 4.48729 13.1739 4.2328C13.2793 3.97831 13.3335 3.70555 13.3335 3.4301C13.3335 3.15465 13.2792 2.8819 13.1738 2.62743C13.0683 2.37296 12.9138 2.14175 12.719 1.947C12.5242 1.75225 12.293 1.59777 12.0385 1.49239C11.784 1.38701 11.5112 1.33279 11.2358 1.33282C10.9603 1.33285 10.6876 1.38713 10.4331 1.49257C10.1786 1.59801 9.94742 1.75254 9.75267 1.94733L9.27933 2.42067L9.3 2.48067C9.47333 2.98 9.80067 3.63533 10.416 4.25067C10.9293 4.76694 11.5562 5.15597 12.2467 5.38667L12.7193 4.91333Z" fill="#6D6D6D"/>
                         </g>
                       </svg>
                    </div>
                    <span className="font-['Pretendard_Variable'] font-normal text-[#6d6d6d] text-[16px] tracking-[-0.32px] pr-[16px]">정보 수정</span>
                  </button>
                  
                  {!isOwnerSaju && (
                   <>
                    {/* Divider */}
                    <div className="h-0 w-full relative">
                       <div className="absolute inset-[-0.5px_0] border-t border-[#f8f8f8]" />
                    </div>
                    
                    {/* Delete Button */}
                    <button 
                      onClick={() => { onDelete(); onClose(); }}
                      className="w-full flex flex-row items-center justify-center px-[20px] py-[16px] gap-[8px] active:bg-gray-100 transition-colors"
                    >
                      <div className="size-[16px] relative shrink-0">
                        <svg className="block size-full" fill="none" viewBox="0 0 16 16">
                          <path d="M13.8167 3.51667H10.69V2.92333C10.6875 2.50321 10.5199 2.10092 10.2233 1.80333C10.0756 1.65508 9.89999 1.53753 9.70662 1.45744C9.51326 1.37734 9.30596 1.3363 9.09667 1.33667H6.92333C6.71404 1.3363 6.50674 1.37734 6.31338 1.45744C6.12001 1.53753 5.9444 1.65508 5.79667 1.80333C5.50254 2.102 5.33737 2.50416 5.33667 2.92333V3.51667H2.21C2.07739 3.51667 1.95021 3.56935 1.85645 3.66311C1.76268 3.75688 1.71 3.88406 1.71 4.01667C1.71 4.14928 1.76268 4.27645 1.85645 4.37022C1.95021 4.46399 2.07739 4.51667 2.21 4.51667H3.15667V12.3567C3.15395 12.6605 3.21146 12.9619 3.32589 13.2434C3.44032 13.5249 3.60939 13.7809 3.82333 13.9967C4.25955 14.4241 4.84596 14.6634 5.45667 14.6633H10.5367C11.1474 14.6634 11.7338 14.4241 12.17 13.9967C12.3839 13.7809 12.553 13.5249 12.6674 13.2434C12.7819 12.9619 12.8394 12.6605 12.8367 12.3567V4.51667H13.79C13.9226 4.51667 14.0498 4.46399 14.1436 4.37022C14.2373 4.27645 14.29 4.14928 14.29 4.01667C14.29 3.88406 14.2373 3.75688 14.1436 3.66311C14.0498 3.56935 13.9226 3.51667 13.79 3.51667H13.8167ZM6.35 2.92333C6.35003 2.84638 6.36537 2.77021 6.39513 2.69925C6.42489 2.62829 6.46847 2.56395 6.52333 2.51C6.63355 2.401 6.78167 2.33888 6.93667 2.33667H9.11C9.18802 2.33618 9.26534 2.35126 9.33746 2.38102C9.40958 2.41079 9.47503 2.45463 9.53 2.51C9.639 2.62021 9.70112 2.76834 9.70333 2.92333V3.51667H6.37L6.35 2.92333ZM7.23667 11.33C7.23667 11.5068 7.16643 11.6764 7.0414 11.8014C6.91638 11.9264 6.74681 11.9967 6.57 11.9967C6.39319 11.9967 6.22362 11.9264 6.0986 11.8014C5.97357 11.6764 5.90333 11.5068 5.90333 11.33V7.71C5.90333 7.53319 5.97357 7.36362 6.0986 7.2386C6.22362 7.11357 6.39319 7.04333 6.57 7.04333C6.74681 7.04333 6.91638 7.11357 7.0414 7.2386C7.16643 7.36362 7.23667 7.53319 7.23667 7.71V11.33ZM10.1433 11.33C10.1433 11.5068 10.0731 11.6764 9.94807 11.8014C9.82305 11.9264 9.65348 11.9967 9.47667 11.9967C9.29985 11.9967 9.13029 11.9264 9.00526 11.8014C8.88024 11.6764 8.81 11.5068 8.81 11.33V7.71C8.81 7.53319 8.88024 7.36362 9.00526 7.2386C9.13029 7.11357 9.29985 7.04333 9.47667 7.04333C9.65348 7.04333 9.82305 7.11357 9.94807 7.2386C10.0731 7.36362 10.1433 7.53319 10.1433 7.71V11.33Z" fill="#FA5B4A"/>
                        </svg>
                      </div>
                      <span className="font-['Pretendard_Variable'] font-normal text-[#fa5b4a] text-[16px] tracking-[-0.32px] pr-[16px]">정보 삭제</span>
                    </button>
                   </>
                  )}
              </div>
            </div>
            
            {/* Footer / Cancel */}
            <div className="w-full flex flex-col items-center px-[20px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-[12px]">
               <button 
                 onClick={onClose}
                 className="w-full h-[56px] bg-[#f0f8f8] rounded-[16px] flex items-center justify-center active:bg-[#E4F7F7] active:scale-[0.96] transition-all"
               >
                 <span className="font-['Pretendard_Variable'] font-medium text-[#48b2af] text-[16px] tracking-[-0.32px]">취소</span>
               </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}