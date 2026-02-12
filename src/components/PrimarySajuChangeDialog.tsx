/**
 * 대표 사주 변경 확인 다이얼로그
 * Figma import: 대표사주변경컨펌모달.tsx
 */

import React from 'react';

interface PrimarySajuChangeDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrimarySajuChangeDialog({ isOpen, isLoading = false, onConfirm, onCancel }: PrimarySajuChangeDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.8)] z-[9998]"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px] w-[320px] z-[9999] bg-white">
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
          {/* Content */}
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center px-[28px] py-[32px] relative w-full">
                <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                  <p className="font-['Pretendard_Variable:SemiBold',sans-serif] leading-[25.5px] relative shrink-0 text-[18px] text-black tracking-[-0.36px] w-full text-center">
                    대표 사주를 변경하시겠어요?
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="relative shrink-0 w-full">
            <div className="size-full">
              <div className="content-stretch flex flex-col items-start pb-[20px] pt-0 px-[24px] relative w-full">
                <div className="content-stretch flex gap-[16px] items-center justify-center relative shrink-0 w-full">
                  {/* 아니요 버튼 */}
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="bg-[#f3f3f3] basis-0 grow h-[48px] min-h-px min-w-px relative rounded-[12px] shrink-0 hover:bg-[#e8e8e8] transition-colors"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[20px] relative shrink-0 text-[#525252] text-[15px] text-nowrap tracking-[-0.45px]">
                            아니요
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 네 버튼 */}
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="bg-[#48b2af] basis-0 grow h-[48px] min-h-px min-w-px relative rounded-[12px] shrink-0 hover:bg-[#3fa3a0] transition-colors"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[20px] relative shrink-0 text-[15px] text-nowrap text-white tracking-[-0.45px]">
                            네
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
