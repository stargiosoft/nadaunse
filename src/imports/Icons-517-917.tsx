import svgPaths from "./svg-tzh6ldij3f";

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="info-circle">
          <path d={svgPaths.pabc3300} fill="var(--fill-0, #FA5B4A)" id="Vector" />
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