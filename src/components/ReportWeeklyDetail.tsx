import { useState } from 'react';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from "@/imports/svg-g7inqw5l9h";
import svgPathsDove from "@/imports/svg-d6wqnyhzay";
import ArrowLeft from './ArrowLeft';

function Icon() {
  return (
    <div className="absolute" style={{ inset: '10% -0.02% 3.02% 0.65%' }} data-name="Icon">
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 39.7459 34.7902">
        <g id="Icon">
          <path d={svgPathsDove.p130ba700} fill="var(--fill-0, #6ABC13)" id="Vector" />
          <path d={svgPathsDove.p13fdf100} fill="var(--fill-0, #6ABC13)" id="Vector_2" />
          <path d={svgPathsDove.pb501000} fill="var(--fill-0, #6ABC13)" id="Vector_3" />
          <path d={svgPathsDove.p20ac8d40} fill="var(--fill-0, #83C6FF)" id="Vector_4" />
          <path d={svgPathsDove.p29743380} fill="var(--fill-0, #BFE1FF)" id="Vector_5" />
          <path d={svgPathsDove.p1992f660} fill="var(--fill-0, #83C6FF)" id="Vector_6" />
          <path d={svgPathsDove.p39404b80} fill="var(--fill-0, #555555)" id="Vector_7" />
          <path d={svgPathsDove.p1939f500} fill="var(--fill-0, #FFC300)" id="Vector_8" />
        </g>
      </svg>
    </div>
  );
}

function NotoDove() {
  return (
    <div className="overflow-clip relative" style={{ width: '40px', height: '40px' }} data-name="noto:dove">
      <Icon />
    </div>
  );
}

function TitleContainer() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Title Container">
      <div className="flex items-center w-full" style={{ gap: '8px' }}>
        <span style={{
          fontFamily: 'Pretendard Variable',
          fontWeight: 600,
          lineHeight: '24px',
          color: '#151515',
          fontSize: '18px',
          letterSpacing: '-0.36px'
        }}>
          26년 5월 4주차 보고서
        </span>
        <span style={{
          fontFamily: 'Pretendard Variable',
          fontWeight: 400,
          lineHeight: '17px',
          color: '#999999',
          fontSize: '13px',
          letterSpacing: '-0.26px',
          paddingTop: '2px',
          paddingBottom: '3px'
        }}>
          01.25 ~ 01.31
        </span>
      </div>
    </div>
  );
}

function TextContainer() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '8px' }} data-name="Text Container">
      <TitleContainer />
      <div style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 400,
        lineHeight: '28.5px',
        color: '#151515',
        fontSize: '16px',
        letterSpacing: '-0.32px',
        width: '100%'
      }}>
        <p className="mb-0">이번 주 당신은 겉으론 또렷하고 논리적인데 속마음은 관계 걱정으로 몽글몽글 불안이 떠 있는 사람에 가까워요.</p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">당신 사주는 머리가 빠르게 회전하고 말과 표현이 뛰어난 형이에요. 재물과 현실 감각도 좋아서 일과 돈 문제는 어느 정도 스스로 길을 찾아가요. 대신 에너지가 바깥으로 치우쳐 관계와 평가에 민감해지기 쉬워요. 그래서 요즘처럼 연애와 인간관계에 시선이 집중되면 '왜 나만 이렇게 비껴가나'라는 마음이 더 커질 수 있어요.</p>
        <p className="mb-0">&nbsp;</p>
        <p>또 당신은 애초에 책임감과 자존심이 강한 사람이라 무리 없이 섞이기보다 '내가 괜찮은 사람으로 보이는가'를 기준으로 사람을 바라봐요. 이 기질과 지금의 관계 갈증이 부딪히니 사소한 말 한마디에도 상처받고 조급해진 거예요. 덜 사랑받아서가 아니라 사랑과 인정에 예민한 구조라서 더 크게 느껴지는 것뿐이에요.</p>
      </div>
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="flex flex-col items-start relative self-stretch shrink-0 w-full" style={{ gap: '20px' }} data-name="Content Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <NotoDove />
        </div>
      </div>
      <TextContainer />
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 w-full" style={{ borderRadius: '16px', backgroundColor: '#f9f9f9' }} data-name="Container">
      <div className="flex flex-row justify-center" style={{ width: '100%', height: '100%' }}>
        <div className="flex items-start justify-center relative w-full" style={{ padding: '28px 20px' }}>
          <ContentContainer />
        </div>
      </div>
    </div>
  );
}

function CardInterpretationCard() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Card / Interpretation Card">
      <Container />
    </div>
  );
}

function ContentContainer1() {
  return (
    <div className="flex items-center justify-center relative shrink-0 w-full" style={{ padding: '12px 20px 40px 20px' }} data-name="Content Container">
      <CardInterpretationCard />
    </div>
  );
}

function ContentContainer2() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Content Container">
      <ContentContainer1 />
      <div className="shrink-0 w-full" style={{ height: '12px', backgroundColor: '#f9f9f9' }} data-name="Divider" />
    </div>
  );
}

function Icons({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: '16px', height: '16px' }}
      data-name="Icons"
      animate={{ rotate: isOpen ? -180 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-up">
          <path d={svgPathsDove.peb9d380} id="Vector" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
        </g>
      </svg>
    </motion.div>
  );
}

function Frame({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center" style={{ width: '100%', height: '100%' }}>
        <div className="flex items-center justify-center relative w-full" style={{ gap: '11px', padding: '14px 20px' }}>
          <p className="flex-[1_0_0]" style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 500,
            lineHeight: '24px',
            color: '#000000',
            fontSize: '17px',
            letterSpacing: '-0.34px'
          }}>이주의 나의 성향 태그</p>
          <Icons isOpen={isOpen} />
        </div>
      </div>
    </div>
  );
}

function ReportAccordion({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex flex-col items-start relative shrink-0 w-full cursor-pointer"
      data-name="Report Accordion"
      onClick={onToggle}
    >
      <Frame isOpen={isOpen} />
    </div>
  );
}

function TagLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center relative shrink-0" style={{ padding: '3px 10px 4px 10px', borderRadius: '99px' }} data-name="Tag label">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ border: '1px solid #e7e7e7', borderRadius: '99px' }} />
      <p style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 400,
        lineHeight: '22px',
        color: '#151515',
        fontSize: '13px'
      }}># {text}</p>
    </div>
  );
}

function Frame1() {
  const tags = [
    "배려심 많은", "성실한", "책임감 있는", "리더십 있는", "감정 변화가 큰",
    "관찰력 있는", "섬세한", "결단력 있는", "쉽게 흔들리지 않는", "버티는 힘이 있는",
    "스스로를 잘 지키는", "상황을 주도하는", "위기에도 침착한", "기준이 분명한", "솔직한",
    "자유로운", "창의적인", "도전적인", "긍정적인", "활기찬",
    "차분한", "사려 깊은", "열정적인", "유머러스한", "감각적인",
    "논리적인", "직관적인", "포용력 있는", "단호한", "융통성 있는",
    "겸손한", "용기 있는", "호기심 많은", "끈기 있는", "낙천적인",
    "신중한", "공감 능력이 뛰어난", "협동적인", "독창적인", "분석적인",
    "계획적인", "모험을 즐기는", "이성적인", "감성적인", "정직한",
    "신뢰할 수 있는", "따뜻한", "자신감 있는", "대담한", "주체적인"
  ];

  return (
    <div className="flex items-center justify-start relative shrink-0 w-full content-start" style={{ flexWrap: 'wrap', gap: '6px' }}>
      {tags.map((tag, i) => (
        <TagLabel key={i} text={tag} />
      ))}
    </div>
  );
}

function Frame2() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-start relative w-full" style={{ padding: '0 20px' }}>
        <Frame1 />
      </div>
    </div>
  );
}

function TagListAccordion() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Tag List Accordion">
      <ReportAccordion isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden", width: "100%" }}
          >
            <Frame2 />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContentContainer3() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '16px', paddingBottom: '230px' }} data-name="Content Container">
      <ContentContainer2 />
      <TagListAccordion />
    </div>
  );
}


function RightAction() {
  return (
    <div className="flex items-center justify-center opacity-0 relative shrink-0" style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }} data-name="Right Action">
      <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
         <Settings className="size-full text-[#848484]" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function Icon1({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <ArrowLeft onClick={onBack || (() => {})} />
      <p className="flex-[1_0_0] overflow-hidden text-center text-ellipsis" style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 600,
        lineHeight: '25.5px',
        color: '#000000',
        fontSize: '18px',
        letterSpacing: '-0.36px'
      }}>이번 주 보고서</p>
      <RightAction />
    </div>
  );
}

function NavigationTopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full" style={{ height: '52px' }} data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="flex flex-col items-start justify-center relative size-full" style={{ padding: '4px 12px' }}>
          <Icon1 onBack={onBack} />
        </div>
      </div>
    </div>
  );
}

function NavigationTopNavigationWidget({ onBack }: { onBack?: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-white w-full" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar onBack={onBack} />
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="flex items-center relative shrink-0" style={{ gap: '4px' }} data-name="Button Container">
      <p style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 500,
        lineHeight: '25px',
        color: '#ffffff',
        fontSize: '16px',
        letterSpacing: '-0.32px'
      }}>이번 주 타로 뽑기</p>
    </div>
  );
}

function ButtonSquareButton({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center justify-center relative shrink-0 w-full cursor-pointer transition-all duration-200 ease-in-out active:scale-[0.99] active:bg-[#41A09E]" style={{ height: '56px', padding: '0 12px', borderRadius: '16px', backgroundColor: '#48b2af' }} data-name="Button / Square Button">
      <ButtonContainer />
    </div>
  );
}

function CommonBottomButton({ onTarotStart }: { onTarotStart?: () => void }) {
  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }} data-name="Common / Bottom Button">
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <ButtonSquareButton onClick={onTarotStart} />
      </div>
    </div>
  );
}

interface ReportWeeklyDetailProps {
  onBack: () => void;
  onTarotStart?: () => void;
}

export default function ReportWeeklyDetail({ onBack, onTarotStart }: ReportWeeklyDetailProps) {
  return (
    <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }} data-name="나의 보고서 (보고서 상세)">
      <NavigationTopNavigationWidget onBack={onBack} />
      <div className="flex-1 overflow-y-auto w-full">
        <ContentContainer3 />
      </div>
      <CommonBottomButton onTarotStart={onTarotStart} />
    </div>
  );
}
