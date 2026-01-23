import svgPaths from "./svg-bkrorf7agb";

function TickCircle() {
  return (
    <div className="relative size-full" data-name="tick-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.2209 27.2209">
        <g id="tick-circle">
          <path d={svgPaths.pd0e5d00} id="Vector" stroke="var(--stroke-0, #0C0C0C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.40261" />
          <path d={svgPaths.p93f5880} id="Vector_2" opacity="0" stroke="var(--stroke-0, #0C0C0C)" strokeWidth="1.1342" />
        </g>
      </svg>
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-[10.71%_13.54%_37.87%_21.48%]" data-name="Box">
      <div className="absolute flex inset-[10.71%_13.54%_37.87%_21.48%] items-center justify-center">
        <div className="flex-none rotate-[13.017deg] size-[27.221px]">
          <TickCircle />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute contents left-[3.99px] size-[46.258px] top-0" data-name="Container">
      <Box />
      <div className="absolute flex items-center justify-center left-[3.99px] size-[46.258px] top-0" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[13.017deg]">
          <div className="bg-[#f6d05d] border-[#0c0c0c] border-[2.268px] border-solid rounded-[9.074px] size-[38.563px]" data-name="Checkbox" />
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute contents h-[63.509px] left-0 top-0 w-[50.246px]" data-name="Container">
      <div className="absolute flex h-[25.924px] items-center justify-center left-[14.37px] top-[34.26px] w-[14.361px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[13.017deg]">
          <div className="bg-[#f6d05d] border-[#0c0c0c] border-[2.268px] border-solid h-[24.51px] rounded-[9.074px] w-[9.074px]" data-name="Checkbox" />
        </div>
      </div>
      <Container />
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <Container1 />
    </div>
  );
}