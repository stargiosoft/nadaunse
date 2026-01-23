import svgPaths from "./svg-o6wki50bgf";

function Img() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '-72.02%',
        left: '9px',
        top: '3.13%',
        width: '123.404px'
      }}
      data-name="img"
    >
      <div style={{ position: 'absolute', inset: '-0.71% 0 0 0' }}>
        <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 123.404 163.295">
          <g id="img">
            <path d={svgPaths.p312a8200} fill="#BCD961" id="Vector" stroke="black" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d={svgPaths.p1a854e00} fill="#BCD961" id="Vector_2" stroke="black" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d="M61.4258 31.8692V18.9812" id="Vector_3" stroke="black" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d={svgPaths.p35ec8780} fill="#F4F4F4" id="Vector_4" />
            <g id="Group">
              <path d={svgPaths.p2d26a800} fill="#FDD751" id="Vector_5" stroke="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
              <path d={svgPaths.p14321c70} fill="#EFC748" id="Vector_6" />
              <path d={svgPaths.p9e32b00} fill="#FDD751" id="Vector_7" stroke="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
              <path d={svgPaths.p1d9dd500} fill="#EFC748" id="Vector_8" />
            </g>
            <path d={svgPaths.p2ae61a00} fill="white" id="Vector_9" stroke="black" strokeMiterlimit="10" strokeWidth="2.31383" />
            <g id="Group_2">
              <path d={svgPaths.p10808800} fill="black" id="Vector_10" />
              <path d={svgPaths.p239f3100} fill="black" id="Vector_11" />
            </g>
            <path d={svgPaths.p9606340} fill="#FDD751" id="Vector_12" stroke="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function TickCircle() {
  return (
    <div className="relative" style={{ width: '100%', height: '100%' }} data-name="tick-circle">
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 27.2209 27.2209">
        <g id="tick-circle">
          <path d={svgPaths.pd0e5d00} id="Vector" stroke="#0C0C0C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.40261" />
          <path d={svgPaths.p93f5880} id="Vector_2" opacity="0" stroke="#0C0C0C" strokeWidth="1.1342" />
        </g>
      </svg>
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents" style={{ inset: '10.71% 13.54% 37.87% 21.48%' }} data-name="Box">
      <div
        className="absolute flex items-center justify-center"
        style={{ inset: '10.71% 13.54% 37.87% 21.48%' }}
      >
        <div className="flex-none" style={{ transform: 'rotate(13.017deg)', width: '27.221px', height: '27.221px' }}>
          <TickCircle />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div
      className="absolute contents"
      style={{ left: '3.99px', width: '46.258px', height: '46.258px', top: 0 }}
      data-name="Container"
    >
      <div
        className="absolute flex items-center justify-center"
        style={{ left: '3.99px', width: '46.258px', height: '46.258px', top: 0 }}
      >
        <div className="flex-none" style={{ transform: 'rotate(13.017deg)' }}>
          <div
            style={{
              backgroundColor: '#f6d05d',
              borderColor: '#0c0c0c',
              borderWidth: '3px',
              borderStyle: 'solid',
              borderRadius: '9.074px',
              width: '38.563px',
              height: '38.563px'
            }}
            data-name="Checkbox"
          />
        </div>
      </div>
      <Box />
    </div>
  );
}

function Container1() {
  return (
    <div
      className="absolute"
      style={{ height: '63.509px', left: '98px', top: '40px', width: '50.246px' }}
      data-name="Container"
    >
      <div
        className="absolute flex items-center justify-center"
        style={{ height: '25.924px', left: '14.37px', top: '34.26px', width: '14.361px' }}
      >
        <div className="flex-none" style={{ transform: 'rotate(13.017deg)' }}>
          <div
            style={{
              backgroundColor: '#f6d05d',
              borderColor: '#0c0c0c',
              borderWidth: '3px',
              borderStyle: 'solid',
              height: '24.51px',
              borderRadius: '9.074px',
              width: '9.074px'
            }}
            data-name="Checkbox"
          />
        </div>
      </div>
      <Container />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative" style={{ width: '100%', height: '100%' }} data-name="Container">
      <Img />
      <Container1 />
    </div>
  );
}
