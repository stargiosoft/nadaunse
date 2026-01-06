/**
 * @file PaidContentDetailSkeleton.tsx
 * @description 유료 콘텐츠 상세 페이지 스켈레톤 (Figma 디자인 기반)
 * 
 * @features
 * - 모바일 최적화 (max-w-[440px])
 * - Figma 디자인 시안과 일치하는 스켈레톤 레이아웃
 * - 부드러운 애니메이션
 * - 유료 콘텐츠 특화: 가격 블록, 쿠폰, 탭 메뉴, 질문 리스트 등
 */

import React, { useEffect } from 'react';

export default function PaidContentDetailSkeleton() {
  useEffect(() => {
    console.log('✅ [PaidContentDetailSkeleton] 렌더링됨');
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
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[16px] rounded-[20px] w-[222px] mb-[20px] animate-pulse" />
              
              {/* Description */}
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[13px] rounded-[20px] w-[341px] mb-[22px] animate-pulse" />
              
              {/* Price */}
              <div className="flex gap-[8px] items-center mb-[10px]">
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[20px] rounded-[20px] w-[40px] animate-pulse" />
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[20px] rounded-[20px] w-[73px] animate-pulse" />
              </div>
              
              {/* Discount Price */}
              <div className="flex gap-[8px] items-center">
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[20px] rounded-[20px] w-[40px] animate-pulse" />
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[20px] rounded-[20px] w-[61px] animate-pulse" />
              </div>
            </div>
            
            {/* Coupon Button */}
            <div className="px-[20px] mt-[16px]">
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[46px] rounded-[12px] w-full animate-pulse" />
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-[#f7f8f9] mt-[32px] py-[28px]">
            <div className="px-[20px]">
              {/* Section Title */}
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[220px] mb-[36px] animate-pulse" />
              
              {/* Three Cards */}
              <div className="flex gap-[12px]">
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[87px] rounded-[12px] w-[108.67px] animate-pulse" />
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[87px] rounded-[12px] w-[108.67px] animate-pulse" />
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[87px] rounded-[12px] w-[108.67px] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Worry Card Section */}
          <div className="px-[20px] mt-[28px]">
            {/* Section Title */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[220px] mb-[36px] animate-pulse" />
            
            {/* Worry Card */}
            <div className="bg-[#f9f9f9] rounded-[16px] p-[20px]">
              <div className="flex justify-between">
                <div className="flex-1">
                  {/* Title */}
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[44px] rounded-[12px] w-[244px] mb-[12px] animate-pulse" />
                  {/* Text */}
                  <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[44px] rounded-[12px] w-[232px] animate-pulse" />
                </div>
                {/* Image */}
                <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[65px] rounded-[16px] w-[50px] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white px-[20px] mt-[28px]">
            {/* Section Title */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[220px] mb-[36px] animate-pulse" />
            
            {/* Text Lines */}
            <div className="space-y-[25px]">
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[233px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[340px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[306px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[285px] animate-pulse" />
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-white px-[20px] mt-[40px]">
            {/* Section Title */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[234px] mb-[40px] animate-pulse" />
            
            {/* List Items */}
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <div className="py-[12px] flex items-center gap-[8px]">
                    <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] flex-1 animate-pulse" style={{ width: `${Math.random() * 100 + 150}px`, maxWidth: '100%' }} />
                  </div>
                  {index < 7 && (
                    <div className="h-px bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Accordion Section 1 */}
          <div className="bg-white px-[20px] mt-[40px]">
            {/* Section Title */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[270px] mb-[24px] animate-pulse" />
            
            {/* Accordion Header */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[53px] rounded-[12px] w-full mb-[8px] animate-pulse" />
            
            {/* Accordion Content (Expanded) */}
            <div className="bg-[#f7f8f9] rounded-[12px] p-[20px] space-y-[26px]">
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[279px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[309px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[263px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[293px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[287px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[241px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[193px] animate-pulse" />
            </div>
          </div>

          {/* Accordion Section 2 */}
          <div className="bg-white px-[20px] mt-[32px]">
            {/* Accordion Header */}
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[53px] rounded-[12px] w-full mb-[8px] animate-pulse" />
            
            {/* Accordion Content (Collapsed - smaller) */}
            <div className="bg-[#f7f8f9] rounded-[12px] p-[20px] space-y-[26px]">
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[219px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[173px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[218px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[278px] animate-pulse" />
              <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[14px] rounded-[20px] w-[246px] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bottom Purchase Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)]">
          <div className="px-[20px] py-[12px]">
            <div className="bg-gradient-to-l from-[rgba(239,239,239,0.05)] to-50% to-[#f0f0f0] h-[56px] rounded-[16px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}