import svgPaths from "./svg-m8ae9lym5z";

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-up">
          <path d={svgPaths.peb9d380} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

export default function Icons() {
  return (
    <div className="relative size-full" data-name="Icons">
      <Box />
    </div>
  );
}