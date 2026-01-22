import { motion } from "motion/react";

interface NavigationTabBarProps {
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

function Tab({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px] cursor-pointer"
      style={{ WebkitTapHighlightColor: "transparent" }}
      data-name="Navigation / Tab Item"
    >
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 bg-[#f8f8f8] rounded-[12px]"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
      )}
      <div className="flex flex-row items-center justify-center size-full relative z-10">
        <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative w-full">
          <p
            className={`css-ew64yg font-sans leading-[20px] relative shrink-0 text-[15px] tracking-[-0.45px] transition-colors duration-250 ${
              isActive ? "text-[#151515] font-semibold" : "text-[#999] font-medium"
            }`}
          >
            {label === "나의 리포트" ? "나의 분석 보고서" : label}
          </p>
        </div>
      </div>
    </div>
  );
}

function TabItem({ activeTab, onTabChange }: { activeTab: number; onTabChange: (index: number) => void }) {
  const tabs = ["프로필", "나의 리포트"];

  return (
    <div className="content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-name="Tab Item">
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
    <div className="bg-white content-stretch flex flex-col items-start px-[16px] py-[8px] relative w-full" data-name="Navigation / Tab Bar">
      <div aria-hidden="true" className="absolute border-[#f8f8f8] border-b border-solid inset-0 pointer-events-none" />
      <TabItem activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
