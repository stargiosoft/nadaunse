import svgPaths from "./svg-wd5tys2bx7";

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tick-circle">
          <path d={svgPaths.p19b5fe00} fill="var(--fill-0, #46BB6F)" id="Vector" />
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