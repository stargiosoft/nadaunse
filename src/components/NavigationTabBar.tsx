/**
 * 마이페이지 탭바 컴포넌트
 * - 프로필 | 나의 분석 보고서 탭 전환
 * - FigmaMake에서 이식, inline style 적용
 */

import { motion } from "motion/react";

interface NavigationTabBarProps {
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

function Tab({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex-1 min-h-px min-w-px relative cursor-pointer"
      style={{ borderRadius: '12px', WebkitTapHighlightColor: 'transparent' }}
    >
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0"
          style={{ backgroundColor: '#f8f8f8', borderRadius: '12px' }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
      )}
      <div className="flex flex-row items-center justify-center relative z-10" style={{ width: '100%', height: '100%' }}>
        <div className="flex items-center justify-center w-full" style={{ padding: '8px 16px' }}>
          <p
            style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontSize: '15px',
              lineHeight: '20px',
              letterSpacing: '-0.45px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#151515' : '#999',
              transition: 'color 0.25s ease',
            }}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function TabItem({ activeTab, onTabChange }: { activeTab: number; onTabChange: (index: number) => void }) {
  const tabs = ["프로필", "나의 분석 보고서"];

  return (
    <div className="flex items-center overflow-clip relative shrink-0 w-full">
      {tabs.map((tab, index) => (
        <Tab
          key={tab}
          label={tab}
          isActive={activeTab === index}
          onClick={() => onTabChange(index)}
        />
      ))}
    </div>
  );
}

export default function NavigationTabBar({ activeTab = 0, onTabChange = () => {} }: NavigationTabBarProps) {
  return (
    <div className="bg-white relative shrink-0 w-full" style={{ padding: '8px 16px' }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ borderBottom: '1px solid #f8f8f8' }}
      />
      <TabItem activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
