import img13 from "figma:asset/95fde0b1e654087d1ce7a5244b113ab3ee77494c.png";
import imgBackgroundImage from "figma:asset/73269bb5e33c2575ba38c6ad1a68d2a7002b031b.png";

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 text-center w-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[28px] relative shrink-0 text-[20px] text-white tracking-[-0.2px] w-full">다음주, 내 마음 날씨는 어떨까요?</p>
      <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#f3f3f3] text-[14px] tracking-[-0.42px] w-full">복잡한 생각은 잠시 내려두고, 편하게 뽑아보세요.</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start px-[20px] py-[10px] relative w-full">
        <Container />
      </div>
    </div>
  );
}

function CardSlots() {
  return (
    <div className="content-stretch flex gap-[20px] items-center relative shrink-0" data-name="Card Slots">
      <div className="bg-[#41a09e] h-[114px] relative rounded-[12px] shrink-0 w-[68px]" data-name="Card Slot">
        <div aria-hidden="true" className="absolute border border-[#6ac9c6] border-dashed inset-0 pointer-events-none rounded-[12px]" />
      </div>
      <div className="bg-[#41a09e] h-[114px] relative rounded-[12px] shrink-0 w-[68px]" data-name="Card Slot">
        <div aria-hidden="true" className="absolute border border-[#6ac9c6] border-dashed inset-0 pointer-events-none rounded-[12px]" />
      </div>
      <div className="bg-[#41a09e] h-[114px] relative rounded-[12px] shrink-0 w-[68px]" data-name="Card Slot">
        <div aria-hidden="true" className="absolute border border-[#6ac9c6] border-dashed inset-0 pointer-events-none rounded-[12px]" />
      </div>
    </div>
  );
}

function HeaderContainer() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[28px] items-center left-0 top-[36px] w-[390px]" data-name="Header Container">
      <Container1 />
      <CardSlots />
    </div>
  );
}

function CardImages() {
  return (
    <div className="absolute contents left-[30.21px] top-[279.61px]" data-name="Card Images">
      <div className="absolute flex h-[68px] items-center justify-center left-[224.14px] top-[448.99px] w-[114px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 3">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[131.666px] items-center justify-center left-[236.14px] top-[378.99px] w-[123.863px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[321.889deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 4">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[95.26px] items-center justify-center left-[212.4px] top-[355.7px] w-[127.743px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[74.956deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 5">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[132.74px] items-center justify-center left-[158.84px] top-[349.78px] w-[116.718px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[30.742deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 6">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[131.061px] items-center justify-center left-[229.13px] top-[279.61px] w-[125.322px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[320.061deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 7">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[131.565px] items-center justify-center left-[227.14px] top-[313px] w-[107.389px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[23.184deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 8">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[129.993px] items-center justify-center left-[232.14px] top-[376px] w-[101.618px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[19.139deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 9">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[116.376px] items-center justify-center left-[148.14px] top-[281.99px] w-[132.737px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[59.567deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 10">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[124.041px] items-center justify-center left-[155.73px] top-[298.78px] w-[86.689px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[9.958deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 11">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[119.434px] items-center justify-center left-[152.14px] top-[281px] w-[77.567px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[4.942deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 12">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[107.753px] items-center justify-center left-[99.28px] top-[341.32px] w-[131.646px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[66.548deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 13">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[115.231px] items-center justify-center left-[224.14px] top-[370px] w-[70.084px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[358.947deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 26">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[131.445px] items-center justify-center left-[84.61px] top-[394.76px] w-[124.45px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[38.827deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 27">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[123.545px] items-center justify-center left-[137.14px] top-[313px] w-[85.642px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[350.636deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 28">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[126.904px] items-center justify-center left-[91.66px] top-[287.99px] w-[93.167px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[346.238deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 29">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[112.384px] items-center justify-center left-[53.14px] top-[293.99px] w-[132.451px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[297.033deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 30">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[131.045px] items-center justify-center left-[178.14px] top-[350px] w-[105.261px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[338.351deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 31">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[132.424px] items-center justify-center left-[92.14px] top-[329px] w-[112.17px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[333.14deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 32">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[132.054px] items-center justify-center left-[152.14px] top-[412.99px] w-[109.789px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[24.985deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 33">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[96.727px] items-center justify-center left-[146.14px] top-[354.99px] w-[128.304px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[285.961deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 34">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[131.682px] items-center justify-center left-[85.87px] top-[362.51px] w-[123.817px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[321.943deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 35">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[130.414px] items-center justify-center left-[30.21px] top-[347.79px] w-[126.508px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[318.442deg]">
          <div className="h-[114px] pointer-events-none relative rounded-[5px] w-[68px]" data-name="타로 - 1 36">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full" src={img13} />
            <div aria-hidden="true" className="absolute border border-[#008986] border-solid inset-[-1px] rounded-[6px] shadow-[4px_3px_8px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[25px] relative shrink-0 text-[16px] text-white tracking-[-0.32px]">카드 섞기</p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.2)] bottom-[154px] content-stretch flex h-[56px] items-center justify-center left-[16px] px-[12px] py-0 rounded-[16px] w-[358px]" data-name="Button / Square Button">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[16px]" />
      <ButtonContainer />
    </div>
  );
}

export default function BackgroundImage() {
  return (
    <div className="relative size-full" data-name="Background Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBackgroundImage} />
      <HeaderContainer />
      <CardImages />
      <ButtonSquareButton />
    </div>
  );
}