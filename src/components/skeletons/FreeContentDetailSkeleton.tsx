/**
 * @file FreeContentDetailSkeleton.tsx
 * @description 무료 콘텐츠 상세 페이지 스켈레톤 (Figma 디자인 기반)
 * 
 * @features
 * - 모바일 최적화 (max-w-[440px])
 * - Figma 디자인 시안과 일치하는 스켈레톤 레이아웃
 * - 부드러운 애니메이션
 */

import React, { useEffect } from 'react';

export default function FreeContentDetailSkeleton() {
  useEffect(() => {
    console.log('✅ [FreeContentDetailSkeleton] 렌더링됨');
  }, []);

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative">
        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 bg-white z-10">
          {/* Status Bar (47px) */}
          <div className="h-[47px] bg-white" />
          
          {/* Top Bar (52px) */}
          <div className="h-[52px] bg-white px-[12px] py-[4px] flex items-center justify-between">
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] rounded-[12px] size-[44px] animate-pulse" />
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[50px] animate-pulse" />
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] rounded-[12px] size-[44px] animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="pt-[99px] pb-[120px]">
          {/* Product Card */}
          <div className="relative">
            {/* Thumbnail (270px) */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[270px] w-full animate-pulse" />
            
            {/* Price Block */}
            <div className="px-[20px] mt-[20px]">
              {/* Category Label */}
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[24px] rounded-[8px] w-[70px] mb-[8px] animate-pulse" />
              
              {/* Title */}
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[237px] animate-pulse" />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full mt-[20px] mb-[28px] bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0]" />

          {/* Description Section */}
          <div className="px-[20px]">
            {/* Section Title */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[190px] mb-[36px] animate-pulse" />
            
            {/* Text Lines */}
            <div className="space-y-[25px]">
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[278px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[187px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[252px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[214px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[221px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-full animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[209px] animate-pulse" />
            </div>
          </div>

          {/* Spacer */}
          <div className="h-[12px] w-full mt-[52px] mb-[52px] bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0]" />

          {/* Fortune Composition List */}
          <div className="px-[20px]">
            {/* Section Title */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[190px] mb-[40px] animate-pulse" />
            
            {/* List Items */}
            <div className="space-y-[24px]">
              {/* Item 1 */}
              <div className="flex gap-[8px]">
                <div className="flex-shrink-0 w-[24px]" />
                <div className="flex-1 space-y-[20px]">
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[293px] animate-pulse" />
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[241px] animate-pulse" />
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0]" />
              
              {/* Item 2 */}
              <div className="flex gap-[8px]">
                <div className="flex-shrink-0 w-[24px]" />
                <div className="flex-1 space-y-[20px]">
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[282px] animate-pulse" />
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[289px] animate-pulse" />
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0]" />
              
              {/* Item 3 */}
              <div className="flex gap-[8px]">
                <div className="flex-shrink-0 w-[24px]" />
                <div className="flex-1 space-y-[20px]">
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[279px] animate-pulse" />
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[171px] animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Advertisement Banner */}
          <div className="bg-[#f8f8f8] mt-[52px] py-[20px] px-[20px]">
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[84px] rounded-[16px] animate-pulse" />
          </div>

          {/* Recommended Products */}
          <div className="px-[20px] mt-[52px]">
            {/* Section Title */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[318px] mb-[36px] animate-pulse" />
            
            {/* Product Cards */}
            <div className="flex gap-[12px] overflow-hidden">
              {/* Card 1 */}
              <div className="flex-shrink-0 w-[200px]">
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[120px] rounded-[12px] mb-[8px] animate-pulse" />
                <div className="space-y-[8px]">
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[20px] rounded-[4px] w-[66px] animate-pulse" />
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[107px] animate-pulse" />
                </div>
              </div>
              
              {/* Card 2 */}
              <div className="flex-shrink-0 w-[200px]">
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[120px] rounded-[12px] mb-[8px] animate-pulse" />
                <div className="space-y-[8px]">
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[20px] rounded-[4px] w-[66px] animate-pulse" />
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[174px] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)]">
          <div className="px-[20px] py-[12px]">
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[56px] rounded-[16px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
