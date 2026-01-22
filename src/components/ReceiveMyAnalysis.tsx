import svgPaths from "@/imports/svg-rtee12494s";
import svgPathsInfo from "@/imports/svg-5e94f4h32t";
import { useState, useRef, useEffect } from "react";
import { motion, useDragControls, PanInfo, DragControls } from "motion/react";

function IndependentHandle({ dragControls }: { dragControls: DragControls }) {
  return (
    <div
      className="bg-white relative shrink-0 w-full touch-none cursor-grab active:cursor-grabbing"
      data-name="Independent / Handle"
      onPointerDown={(e) => dragControls.start(e)}
    >
      <div className="flex flex-col items-center justify-center size-full">
        {/* 모바일 사용성을 위해 터치 영역(padding)을 대폭 확장 (12px -> 24px) */}
        <div className="flex flex-col items-center justify-center relative w-full" style={{ padding: '12px 10px' }}>
          <div className="shrink-0" style={{ height: '4px', borderRadius: '999px', width: '48px', backgroundColor: '#d4d4d4' }} data-name="Handle" />
        </div>
      </div>
    </div>
  );
}

function IconAndLabel() {
  return (
    <div className="relative shrink-0" style={{ height: '18.537px', width: '20.179px' }} data-name="Icon and Label">
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 20.1788 18.5368">
        <g id="Icon and Label">
          <path clipRule="evenodd" d={svgPaths.p2d30f4f0} fill="var(--fill-0, #1F1F1F)" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="flex items-center justify-center relative shrink-0" style={{ padding: '12px', borderRadius: '16px', width: '44px', height: '44px', backgroundColor: '#fee500' }} data-name="Button">
      <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none" style={{ borderRadius: '16px', borderColor: '#fee500' }} />
      <IconAndLabel />
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="flex items-center justify-center relative w-full" style={{ padding: '0 2px' }}>
          <p className="flex-[1_0_0] min-h-px min-w-px relative" style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '15px', lineHeight: '20px', color: '#999999', letterSpacing: '-0.45px' }}>고객 정보는 알림톡 발송에만 사용돼요</p>
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col items-start relative" style={{ gap: '6px', padding: '0 2px', width: '100%', height: '100%' }} data-name="Container">
        <p className="relative shrink-0 w-full">
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '22px', lineHeight: '32.5px', color: '#151515', letterSpacing: '-0.22px' }}>
            매주 일요일 나의 분석 보고서를
            <br aria-hidden="true" />
          </span>
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 600, fontSize: '22px', lineHeight: '32.5px', color: '#41a09e', letterSpacing: '-0.22px' }}>알림톡</span>
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '22px', lineHeight: '32.5px', color: '#151515', letterSpacing: '-0.22px' }}>{`으로 `}</span>
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '22px', lineHeight: '32.5px', color: '#151515', letterSpacing: '-0.22px' }}>보내드릴게요</span>
        </p>
        <Container />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '20px' }} data-name="Container">
      <Button />
      <Container1 />
    </div>
  );
}

interface FormInputProps {
  phoneNumber: string;
  errors: { phoneNumber?: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FormInput({ phoneNumber, errors, onChange }: FormInputProps) {
  // 포커스 이동을 위한 Ref (필요 시)
  const phoneNumberInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 포커스 자동 지정
  useEffect(() => {
    // 약간의 딜레이를 주어 애니메이션이 끝난 후 포커스되도록 함
    const timer = setTimeout(() => {
      phoneNumberInputRef.current?.focus();
    }, 400); // 바텀 시트 올라오는 시간 고려
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '4px' }} data-name="Form / Input">
      <div className="relative shrink-0 w-full" data-name="Label Container">
        <div className="flex flex-row items-center" style={{ width: '100%', height: '100%' }}>
          <div className="flex items-center relative w-full" style={{ padding: '0 4px' }}>
            <p className="flex-[1_0_0] min-h-px min-w-px relative" style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#848484', letterSpacing: '-0.24px' }}>휴대폰 번호</p>
          </div>
        </div>
      </div>
      <div className={`relative border shrink-0 w-full transition-colors ${
        errors.phoneNumber
          ? 'bg-white'
          : phoneNumber.length > 0
            ? 'bg-white'
            : 'bg-white focus-within:border-[#48b2af]'
      }`} style={{
        height: '56px',
        borderRadius: '16px',
        borderColor: errors.phoneNumber ? '#fa5b4a' : phoneNumber.length > 0 ? '#48b2af' : '#e7e7e7'
      }} data-name="Input Container">
        <div className="flex flex-row items-center" style={{ width: '100%', height: '100%' }}>
          <div className="flex items-center relative" style={{ padding: '0 12px', width: '100%', height: '100%' }}>
            <div className="flex flex-[1_0_0] items-center min-h-px min-w-px relative" style={{ gap: '12px' }} data-name="Input Field Container">
              <input
                ref={phoneNumberInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="'-'하이픈 없이 숫자만 입력해 주세요"
                value={phoneNumber}
                onChange={onChange}
                className="flex-[1_0_0] bg-transparent outline-none placeholder:text-[#b7b7b7]"
                style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '20px',
                  color: '#151515',
                  letterSpacing: '-0.45px'
                }}
              />
            </div>
          </div>
        </div>
        {errors.phoneNumber && (
          <div className="absolute top-full left-0 flex items-center" style={{ marginTop: '4px', padding: '0 4px', gap: '4px' }}>
            <div className="relative shrink-0" style={{ width: '16px', height: '16px' }}>
              <svg className="block size-full" fill="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p27fcf00} fill="#fa5b4a" />
              </svg>
            </div>
            <p style={{ fontSize: '12px', color: '#fa5b4a', lineHeight: '16px' }}>
              {errors.phoneNumber}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Container3({ phoneNumber, errors, onChange }: FormInputProps) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '36px' }} data-name="Container">
      <Container2 />
      <FormInput phoneNumber={phoneNumber} errors={errors} onChange={onChange} />
    </div>
  );
}

function Container5({ phoneNumber, errors, onChange }: FormInputProps) {
  return (
    <div className="bg-white flex flex-col items-start relative shrink-0 w-full" style={{ padding: '20px 20px 44px 20px' }} data-name="Container">
      <Container3 phoneNumber={phoneNumber} errors={errors} onChange={onChange} />
    </div>
  );
}

interface ContentContainerProps {
  dragControls: DragControls;
  phoneNumber: string;
  errors: { phoneNumber?: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ContentContainer({ dragControls, phoneNumber, errors, onChange }: ContentContainerProps) {
  return (
    <div className="flex flex-col items-start overflow-clip relative shrink-0 w-full" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }} data-name="Content Container">
      <IndependentHandle dragControls={dragControls} />
      <Container5 phoneNumber={phoneNumber} errors={errors} onChange={onChange} />
    </div>
  );
}

function Container6({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center relative shrink-0 w-full" style={{ gap: '4px' }} data-name="Container">
      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '25px', color: isActive ? '#ffffff' : '#b7b7b7', letterSpacing: '-0.32px' }}>저장</p>
    </div>
  );
}

function ButtonSquareButton({ isActive, onClick }: { isActive: boolean, onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{
        WebkitTapHighlightColor: 'transparent',
        transformOrigin: 'center center',
        willChange: 'transform',
        backgroundColor: isActive ? '#48b2af' : '#f8f8f8'
      }}
      onClick={isActive ? onClick : undefined}
      className="flex items-center justify-center relative shrink-0 w-full transition-colors"
      style={{ height: '56px', padding: '0 12px', borderRadius: '16px' }}
      data-name="Button / Square Button"
      disabled={!isActive}
    >
      <Container6 isActive={isActive} />
    </motion.button>
  );
}

function ButtonContainer({ isActive, onClick }: { isActive: boolean, onClick: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="flex flex-col items-center justify-center relative w-full" style={{ padding: '12px 20px' }}>
          <ButtonSquareButton isActive={isActive} onClick={onClick} />
        </div>
      </div>
    </div>
  );
}

function CommonBottomButton({ isActive, onClick }: { isActive: boolean, onClick: () => void }) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }} data-name="Common / Bottom Button">
      <ButtonContainer isActive={isActive} onClick={onClick} />
    </div>
  );
}

interface ReceiveMyAnalysisProps {
  onClose: () => void;
  onSave: () => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
}

export default function ReceiveMyAnalysis({ onClose, onSave, phoneNumber, setPhoneNumber }: ReceiveMyAnalysisProps) {
  const dragControls = useDragControls();

  // 에러 상태는 화면이 유지되는 동안만 필요하므로 여기서 관리 (또는 필요시 상위로 이동 가능)
  // 여기서는 "입력 값 유지"가 핵심이므로 값만 상위에서 받고 에러는 다시 입력할 때 체크하도록 함
  const [errors, setErrors] = useState<{ phoneNumber?: string }>({});

  // 휴대폰 번호 정규식 검사
  const isValidPhoneNumber = (phone: string): boolean => {
    const numbers = phone.replace(/[^0-9]/g, '');
    // 010으로 시작하는 경우 11자리여야만 유효
    if (numbers.startsWith("010")) {
      return /^010[0-9]{8}$/.test(numbers);
    }
    // 그 외(011, 016 등)는 10~11자리 허용
    return /^01[1|6|7|8|9][0-9]{7,8}$/.test(numbers);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자만 입력 가능하도록 필터링
    const numbers = value.replace(/[^0-9]/g, '');

    // 11자리 초과 입력 방지
    if (numbers.length > 11) return;

    // 자동 포매팅 (000-0000-0000)
    let formatted = numbers;
    if (numbers.length < 4) {
      formatted = numbers;
    } else if (numbers.length < 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length < 11) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    } else {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }

    setPhoneNumber(formatted);

    // 10자리 이상 입력 시 유효성 검사
    if (numbers.length >= 10) {
      if (!isValidPhoneNumber(formatted)) {
        setErrors(prev => ({ ...prev, phoneNumber: '올바른 휴대폰 번호를 입력해주세요.' }));
      } else {
        setErrors(prev => ({ ...prev, phoneNumber: undefined }));
      }
    } else {
      // 입력 중일 때는 에러 메시지 초기화
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    // 감도를 높여서 50px만 내려도 닫히도록 수정
    if (info.offset.y > 50 || info.velocity.y > 300) {
      onClose();
    }
  };

  // 버튼 활성화 로직: 번호 길이 충족 & 에러 없음
  const isButtonActive = phoneNumber.length >= 10 && isValidPhoneNumber(phoneNumber);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center" data-name="나다움 기록하기 (태그컨펌)">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 touch-none"
        onClick={onClose}
        data-name="Background"
      />
      <motion.div
        className="relative w-full bg-white overflow-hidden shadow-xl"
        style={{ maxWidth: '440px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
        data-name="Contents Bottom Sheet"
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.001, bottom: 1 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      >
        <ContentContainer dragControls={dragControls} phoneNumber={phoneNumber} errors={errors} onChange={handlePhoneChange} />
        <CommonBottomButton isActive={isButtonActive} onClick={onSave} />
      </motion.div>
    </div>
  );
}
