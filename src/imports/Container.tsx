import svgPaths from "./svg-o6wki50bgf";

function Img() {
  return (
    <div className="absolute bottom-[-72.02%] left-[9px] top-[3.13%] w-[123.404px]" data-name="img">
      <div className="absolute inset-[-0.71%_0_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 123.404 163.295">
          <g id="img">
            <path d={svgPaths.p312a8200} fill="var(--fill-0, #BCD961)" id="Vector" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d={svgPaths.p1a854e00} fill="var(--fill-0, #BCD961)" id="Vector_2" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d="M61.4258 31.8692V18.9812" id="Vector_3" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d={svgPaths.p35ec8780} fill="var(--fill-0, #F4F4F4)" id="Vector_4" />
            <g id="Group">
              <path d={svgPaths.p2d26a800} fill="var(--fill-0, #FDD751)" id="Vector_5" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
              <path d={svgPaths.p14321c70} fill="var(--fill-0, #EFC748)" id="Vector_6" />
              <path d={svgPaths.p9e32b00} fill="var(--fill-0, #FDD751)" id="Vector_7" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
              <path d={svgPaths.p1d9dd500} fill="var(--fill-0, #EFC748)" id="Vector_8" />
            </g>
            <path d={svgPaths.p2ae61a00} fill="var(--fill-0, white)" id="Vector_9" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <g id="Group_2">
              <path d={svgPaths.p10808800} fill="var(--fill-0, black)" id="Vector_10" />
              <path d={svgPaths.p239f3100} fill="var(--fill-0, black)" id="Vector_11" />
            </g>
            <path d={svgPaths.p9606340} fill="var(--fill-0, #FDD751)" id="Vector_12" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
          </g>
        </svg>
      </div>
    </div>
  );
}

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
    <div className="absolute contents inset-[55%_5.7%_10.98%_72.53%]" data-name="Box">
      <div className="absolute flex inset-[55%_5.7%_10.98%_72.53%] items-center justify-center">
        <div className="flex-none rotate-[13.017deg] size-[27.221px]">
          <TickCircle />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute contents left-[101.99px] size-[46.258px] top-[46px]" data-name="Container">
      <Box />
      <div className="absolute flex items-center justify-center left-[101.99px] size-[46.258px] top-[46px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[13.017deg]">
          <div className="bg-[#f6d05d] border-[#0c0c0c] border-[2.268px] border-solid rounded-[9.074px] size-[38.563px]" data-name="Checkbox" />
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute contents h-[63.509px] left-[98px] top-[46px] w-[50.246px]" data-name="Container">
      <div className="absolute flex h-[25.924px] items-center justify-center left-[112.37px] top-[80.26px] w-[14.361px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[13.017deg]">
          <div className="bg-[#f6d05d] border-[#0c0c0c] border-[2.268px] border-solid h-[24.51px] rounded-[9.074px] w-[9.074px]" data-name="Checkbox" />
        </div>
      </div>
      <Container />
    </div>
  );
}

export default function Container2() {
  return (
    <div className="relative size-full" data-name="Container">
      <Img />
      <Container1 />
    </div>
  );
}