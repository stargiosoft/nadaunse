import svgPaths from "./svg-4e9e1jzais";

function LinearClose() {
  return (
    <div className="absolute contents inset-0" data-name="linear/close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
        <g id="Box">
          <path d={svgPaths.p50e9c0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d={svgPaths.p14a64400} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[8px]" data-name="Icons">
      <LinearClose />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-[#ff6678] content-stretch flex items-center p-[6px] relative rounded-[999px] size-full">
      <Icons />
    </div>
  );
}