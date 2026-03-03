import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import ArrowLeft from './ArrowLeft';
import { PageLoader } from './ui/PageLoader';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { NavigationHeader } from './NavigationHeader';
import SEO from './SEO';
import { supabase } from '../lib/supabase';
import { getManseData, getManseDataPublic, formatBirthday } from '../lib/manseService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ManseData = Record<string, any>;

interface MansePageProps {
  onBack: () => void;
}

interface GuestSajuInfo {
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female';
  unknownTime: boolean;
}

const MANSE_GUEST_KEY = 'manse_guest_saju';

// ── 오행 색상 ──
const OHENG_COLORS: Record<string, string> = {
  '木': '#22c55e',
  '火': '#ef4444',
  '土': '#a16207',
  '金': '#6b7280',
  '水': '#3b82f6',
};

// ── 스타일 상수 ──
const FONT = 'Pretendard Variable, sans-serif';

const textStyle = (size: number, weight: number, color: string, extra?: Record<string, string | number>) => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  fontWeight: weight,
  color,
  letterSpacing: '-0.32px',
  ...extra,
});

// ── 헬퍼 함수들 ──

/** 천간/지지 한자에서 오행 추출 */
function getOhengFromChar(char: string): string {
  const map: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
    '庚': '金', '辛': '金', '壬': '水', '癸': '水',
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
  };
  return map[char] || '';
}

/** 오행 문자열 "土金" → ["土", "金"] */
function splitOheng(oheng: string): [string, string] {
  if (oheng.length === 2) return [oheng[0], oheng[1]];
  return ['', ''];
}

/** 생년월일 포맷 */
function formatBirthDisplay(birthDate: string): string {
  const datePart = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate.split(' ')[0];
  const [y, m, d] = datePart.split('-');
  return `양력 ${y}.${m}.${d}`;
}

// ── 서브 컴포넌트들 ──

/** 오행 색상 텍스트 */
function OhengText({ children, oheng, size = 14, weight = 600 }: { children: React.ReactNode; oheng: string; size?: number; weight?: number }) {
  const color = OHENG_COLORS[oheng] || '#151515';
  return <span style={textStyle(size, weight, color)}>{children}</span>;
}

/** 사주 기둥 (시/일/월/년) */
function PillarCard({ label, ganji, oheng, sipsung, sinsal12, gitaSinsal, isDay }: {
  label: string;
  ganji: string;  // "戊申"
  oheng: string;  // "土金"
  sipsung: string[]; // ["편관", "편인"]
  sinsal12: string[];
  gitaSinsal: string[];
  isDay?: boolean;
}) {
  const cheongan = ganji[0] || '';
  const jiji = ganji[1] || '';
  const [ohengTop, ohengBottom] = splitOheng(oheng);

  return (
    <div
      className="flex flex-col items-center gap-[2px] rounded-[12px] p-[8px] flex-1"
      style={{ backgroundColor: isDay ? '#f0faf9' : '#f9f9f9', border: isDay ? '1.5px solid #41a09e' : '1px solid #e7e7e7' }}
    >
      <span style={textStyle(11, 500, '#848484')}>{label}</span>
      {/* 천간 */}
      <OhengText oheng={ohengTop} size={24} weight={700}>{cheongan}</OhengText>
      <span style={textStyle(11, 400, OHENG_COLORS[ohengTop] || '#6d6d6d')}>{ohengTop ? `${ohengTop}` : ''} {sipsung[0] || ''}</span>
      {/* 구분선 */}
      <div className="w-full my-[2px]" style={{ height: '1px', backgroundColor: '#e7e7e7' }} />
      {/* 지지 */}
      <OhengText oheng={ohengBottom} size={24} weight={700}>{jiji}</OhengText>
      <span style={textStyle(11, 400, OHENG_COLORS[ohengBottom] || '#6d6d6d')}>{ohengBottom ? `${ohengBottom}` : ''} {sipsung[1] || ''}</span>
      {/* 12신살 */}
      {sinsal12.length > 0 && (
        <div className="flex flex-wrap gap-[2px] mt-[4px] justify-center">
          {sinsal12.map((s, i) => (
            <span key={i} className="rounded-[4px] px-[4px] py-[1px]" style={{ ...textStyle(9, 500, '#41a09e'), backgroundColor: '#e8f5f4' }}>{s}</span>
          ))}
        </div>
      )}
      {/* 기타신살 (최대 2개) */}
      {gitaSinsal.length > 0 && (
        <div className="flex flex-wrap gap-[2px] mt-[2px] justify-center">
          {gitaSinsal.slice(0, 2).map((s, i) => (
            <span key={i} className="rounded-[4px] px-[4px] py-[1px]" style={{ ...textStyle(9, 400, '#6d6d6d'), backgroundColor: '#f3f3f3' }}>{s}</span>
          ))}
          {gitaSinsal.length > 2 && <span style={textStyle(9, 400, '#b7b7b7')}>+{gitaSinsal.length - 2}</span>}
        </div>
      )}
    </div>
  );
}

/** 강도 바 (오행/십성) */
function StrengthBar({ label, value, color, maxValue = 100 }: { label: string; value: number; color: string; maxValue?: number }) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="flex items-center gap-[8px]">
      <span className="shrink-0" style={{ ...textStyle(13, 500, '#6d6d6d'), width: '40px' }}>{label}</span>
      <div className="flex-1 rounded-full overflow-hidden transform-gpu" style={{ height: '8px', backgroundColor: '#f0f0f0' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="shrink-0" style={{ ...textStyle(12, 500, '#848484'), width: '28px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/** 운세 점수 바 */
function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#41a09e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-[8px]">
      <span className="shrink-0" style={{ ...textStyle(13, 400, '#6d6d6d'), width: '80px' }}>{label}</span>
      <div className="flex-1 rounded-full overflow-hidden transform-gpu" style={{ height: '6px', backgroundColor: '#f0f0f0' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="shrink-0" style={{ ...textStyle(13, 600, color), width: '30px', textAlign: 'right' }}>{score}</span>
    </div>
  );
}

/** 섹션 헤더 */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-[20px] pt-[24px] pb-[12px]">
      <p style={textStyle(18, 700, '#151515')}>{title}</p>
      {subtitle && <p className="mt-[2px]" style={textStyle(13, 400, '#848484')}>{subtitle}</p>}
    </div>
  );
}

/** 대운 아이템 */
function DaeunItem({ ganji, ageRange, isCurrent, summary }: { ganji: string; ageRange?: number[]; isCurrent?: boolean; summary?: string }) {
  const cheongan = ganji[0] || '';
  const jiji = ganji[1] || '';
  const ohengTop = getOhengFromChar(cheongan);
  const ohengBottom = getOhengFromChar(jiji);

  return (
    <div
      className="flex flex-col items-center shrink-0 rounded-[10px] p-[8px]"
      style={{
        minWidth: '56px',
        backgroundColor: isCurrent ? '#f0faf9' : '#f9f9f9',
        border: isCurrent ? '1.5px solid #41a09e' : '1px solid #e7e7e7',
      }}
    >
      <OhengText oheng={ohengTop} size={18} weight={700}>{cheongan}</OhengText>
      <OhengText oheng={ohengBottom} size={18} weight={700}>{jiji}</OhengText>
      {ageRange && (
        <span style={textStyle(10, 400, '#848484', { marginTop: '2px' })}>{ageRange[0]}~{ageRange[1]}세</span>
      )}
      {isCurrent && (
        <span className="mt-[2px] rounded-[4px] px-[4px] py-[1px]" style={{ ...textStyle(9, 600, 'white'), backgroundColor: '#41a09e' }}>현재</span>
      )}
    </div>
  );
}

/** 합/충/형 등 관계 분석 아이템들 */
function RelationItems({ data }: { data: Record<string, string> }) {
  const fields = ['천간합', '타간합', '일간합', '진술축미', '삼합', '방합', '인사신축술미', '육합', '반합', '형', '충', '충타간합', '충일간합', '원진', '귀문살', '백호살', '천을귀인', '양인살', '괴강살', '현침살', '정록'];
  const items = fields.filter(f => data[f] && typeof data[f] === 'string' && data[f].trim());

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-[8px] mt-[8px]">
      {items.map((key) => (
        <div key={key} className="rounded-[8px] px-[12px] py-[14px]" style={{ backgroundColor: '#f9f9f9' }}>
          <span style={textStyle(12, 600, '#41a09e')}>{key}</span>
          <p className="mt-[6px]" style={textStyle(13, 400, '#6d6d6d', { lineHeight: '20px' })}>{data[key]}</p>
        </div>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ──

export default function MansePage({ onBack }: MansePageProps) {
  const navigate = useNavigate();

  // 상태
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manseData, setManseData] = useState<ManseData | null>(null);
  const [displayInfo, setDisplayInfo] = useState<{ birthDate: string; gender: string } | null>(null);
  const [showForm, setShowForm] = useState(false); // 폼 표시 여부
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null); // 로그인 사용자 ID

  // 폼 상태 (비로그인용)
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [birthDateError, setBirthDateError] = useState<string | undefined>();
  const [birthTimeError, setBirthTimeError] = useState<string | undefined>();

  const scrollRef = useRef<HTMLDivElement>(null);
  const daeunScrollRef = useRef<HTMLDivElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const birthTimeInputRef = useRef<HTMLInputElement>(null);

  /** 아코디언 열릴 때 해당 항목을 화면 상단으로 스크롤 */
  const handleAccordionClick = (e: React.MouseEvent) => {
    const item = (e.currentTarget as HTMLElement).closest('[data-slot="accordion-item"]');
    if (item && item.getAttribute('data-state') === 'closed' && scrollRef.current) {
      const container = scrollRef.current;
      const itemRect = item.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const targetScrollTop = container.scrollTop + (itemRect.top - containerRect.top);
      requestAnimationFrame(() => {
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      });
    }
  };

  // ── 24시간 ↔ 12시간 변환 (SajuInputPage 동일) ──
  const convertTo24Hour = (time: string): string => {
    const match = time.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
    if (!match) return time;
    const [, period, hourStr, minute] = match;
    let hour = parseInt(hourStr);
    if (period === '오전' && hour === 12) hour = 0;
    else if (period === '오후' && hour !== 12) hour += 12;
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  const convertTo12Hour = (time: string): string => {
    if (time.includes('오전') || time.includes('오후')) return time;
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return time;
    const hour = parseInt(match[1]);
    const minute = match[2];
    if (hour < 12) {
      const displayHour = hour === 0 ? 12 : hour;
      return `오전 ${String(displayHour).padStart(2, '0')}:${minute}`;
    } else {
      const displayHour = hour === 12 ? 12 : hour - 12;
      return `오후 ${String(displayHour).padStart(2, '0')}:${minute}`;
    }
  };

  // ── 날짜/시간 유효성 (SajuInputPage 동일) ──
  const isValidDate = (dateStr: string): boolean => {
    if (dateStr.length !== 10) return false;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return false;
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  const isValidTime = (timeStr: string): boolean => {
    const match = timeStr.match(/^(오전|오후)\s(\d{2}):(\d{2})$/);
    if (!match) return false;
    const h = Number(match[2]);
    const m = Number(match[3]);
    return h >= 0 && h <= 12 && m >= 0 && m <= 59;
  };

  // ── 초기 로드 ──
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setLoggedInUserId(user.id);

          // 로그인 사용자 → 대표 사주 확인
          const { data: sajuList, error: sajuError } = await supabase
            .from('saju_records')
            .select('id, birth_date, birth_time, gender, calendar_type')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .limit(1);

          if (sajuError) throw sajuError;

          if (!sajuList || sajuList.length === 0) {
            // 대표 사주 없음 → 인라인 폼 표시
            setShowForm(true);
            return;
          }

          // 대표 사주 있음 → 만세력 API 호출
          const saju = sajuList[0];
          const result = await getManseData({
            id: saju.id,
            birth_date: saju.birth_date,
            birth_time: saju.birth_time,
            gender: saju.gender,
            calendar_type: saju.calendar_type,
          });

          if (result.success) {
            const datePart = saju.birth_date?.includes('T') ? saju.birth_date.split('T')[0] : saju.birth_date?.split(' ')[0] || '';
            setManseData(result.data);
            setDisplayInfo({ birthDate: datePart, gender: saju.gender });
          } else {
            setError(result.error);
          }
        } else {
          // 비로그인 → localStorage 확인
          const saved = localStorage.getItem(MANSE_GUEST_KEY);
          if (saved) {
            try {
              const guest: GuestSajuInfo = JSON.parse(saved);
              // 저장된 정보로 폼 프리필
              setBirthDate(guest.birthDate);
              setBirthTime(guest.birthTime);
              setGender(guest.gender);
              setUnknownTime(guest.unknownTime);
            } catch {
              // 파싱 실패 시 무시
            }
          }
          setShowForm(true);
        }
      } catch {
        setError('데이터를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate]);

  // 대운 스크롤 → 현재 대운 위치로 자동 스크롤
  useEffect(() => {
    if (manseData && daeunScrollRef.current) {
      const currentEl = daeunScrollRef.current.querySelector('[data-current="true"]');
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [manseData]);

  // ── 생년월일 입력 핸들러 (SajuInputPage 동일) ──
  const handleBirthDateChange = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length > 8) return;
    let formatted = numbers;
    if (numbers.length >= 5) {
      formatted = `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}${numbers.length > 6 ? `-${numbers.slice(6, 8)}` : ''}`;
    }
    setBirthDate(formatted);

    if (numbers.length === 8) {
      const fullDate = `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
      if (!isValidDate(fullDate)) {
        setBirthDateError('생년월일을 정확하게 입력해주세요.');
      } else {
        setBirthDateError(undefined);
        setTimeout(() => birthTimeInputRef.current?.focus(), 100);
      }
    } else {
      setBirthDateError(undefined);
    }
  };

  // ── 태어난 시간 입력 핸들러 (SajuInputPage 동일) ──
  const handleBirthTimeChange = (value: string) => {
    if (value.includes('오전') || value.includes('오후')) {
      setBirthTime('');
      return;
    }
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length > 4) return;
    setBirthTime(numbers);

    if (numbers.length === 4) {
      const hour = Number(numbers.slice(0, 2));
      const minute = numbers.slice(2, 4);
      if (hour >= 0 && hour <= 23 && Number(minute) >= 0 && Number(minute) <= 59) {
        const period = hour < 12 ? '오전' : '오후';
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        setBirthTime(`${period} ${String(displayHour).padStart(2, '0')}:${minute}`);
        setBirthTimeError(undefined);
      } else {
        setBirthTimeError('태어난 시를 정확하게 입력해주세요.');
      }
    } else {
      setBirthTimeError(undefined);
    }
  };

  // ── "모르겠어요" 토글 (SajuInputPage 동일) ──
  const handleUnknownTimeToggle = () => {
    const newValue = !unknownTime;
    setUnknownTime(newValue);
    if (newValue) {
      setBirthTime('오후 12:00');
      setBirthTimeError(undefined);
    } else {
      setBirthTime('');
    }
  };

  // ── 폼 유효성 ──
  const isFormValid = () => {
    const birthDateValid = birthDate.replace(/[^\d]/g, '').length === 8 && isValidDate(birthDate);
    const birthTimeValid = birthTime.length === 0 || unknownTime || isValidTime(birthTime);
    return birthDateValid && birthTimeValid;
  };

  // ── 폼 제출 ──
  async function handleSubmit() {
    if (!isFormValid()) return;

    setError(null);
    setSubmitting(true);

    try {
      const finalTime = (!unknownTime && birthTime.trim() === '')
        ? '12:00'
        : (unknownTime ? '12:00' : convertTo24Hour(birthTime));

      const birthday = formatBirthday(birthDate, finalTime);

      if (loggedInUserId) {
        // ── 로그인 사용자: DB에 대표 사주 저장 → 만세력 API 호출 ──
        const birthDateForDb = birthDate.replace(/[^\d]/g, '');
        const formattedBirthDate = `${birthDateForDb.slice(0, 4)}-${birthDateForDb.slice(4, 6)}-${birthDateForDb.slice(6, 8)}`;

        const { data: inserted, error: insertError } = await supabase
          .from('saju_records')
          .insert({
            user_id: loggedInUserId,
            full_name: '',
            gender,
            calendar_type: 'solar',
            birth_date: formattedBirthDate + 'T00:00:00Z',
            birth_time: finalTime,
            notes: '본인',
            is_primary: true,
          })
          .select('id, birth_date, birth_time, gender, calendar_type')
          .single();

        if (insertError) throw insertError;

        // 캐시 업데이트 (ProfilePage에서 즉시 표시)
        const { data: updatedSajuList } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', loggedInUserId)
          .order('created_at', { ascending: true });

        if (updatedSajuList && updatedSajuList.length > 0) {
          const newPrimary = updatedSajuList.find((s: Record<string, unknown>) => s.is_primary) || updatedSajuList[0];
          localStorage.setItem('primary_saju', JSON.stringify(newPrimary));
          localStorage.setItem('saju_records_cache', JSON.stringify(updatedSajuList));
        }

        // 만세력 API 호출
        const result = await getManseData({
          id: inserted.id,
          birth_date: inserted.birth_date,
          birth_time: inserted.birth_time,
          gender: inserted.gender,
          calendar_type: inserted.calendar_type,
        });

        if (result.success) {
          setManseData(result.data);
          setDisplayInfo({ birthDate, gender });
          setShowForm(false);
        } else {
          setError(result.error);
        }
      } else {
        // ── 비로그인: localStorage에 저장 → 공개 API 호출 ──
        const guestInfo: GuestSajuInfo = { birthDate, birthTime, gender, unknownTime };
        localStorage.setItem(MANSE_GUEST_KEY, JSON.stringify(guestInfo));

        const result = await getManseDataPublic({ birthday, gender, lunar: 'false' });

        if (result.success) {
          setManseData(result.data);
          setDisplayInfo({ birthDate, gender });
          setShowForm(false);
        } else {
          setError(result.error);
        }
      }
    } catch {
      setError('네트워크 연결을 확인해주세요');
    } finally {
      setSubmitting(false);
    }
  }

  // ── 결과에서 폼으로 돌아가기 ──
  function handleBackToForm() {
    setManseData(null);
    setDisplayInfo(null);
    setError(null);
    setShowForm(true);
  }

  // ── 로딩 ──
  if (loading) return <PageLoader message="만세력을 불러오고 있어요" />;

  // ── 에러 (로그인 사용자 API 실패 등) ──
  if (error && !showForm && !manseData) {
    return (
      <div className="bg-white fixed inset-0 flex justify-center overflow-x-hidden">
        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
          <div className="shrink-0 flex items-center px-[4px]" style={{ height: '52px' }}>
            <ArrowLeft onClick={onBack} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-[16px] px-[20px]">
            <p style={textStyle(16, 500, '#6d6d6d')}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-[12px] px-[24px] py-[12px] cursor-pointer border-none"
              style={{ ...textStyle(15, 600, 'white'), backgroundColor: '#41a09e' }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 비로그인 폼 (SajuInputPage UI 복사) ──
  if (showForm && !manseData) {
    return (
      <div className="bg-white relative min-h-screen w-full flex justify-center">
        <div className="w-full max-w-[440px] relative">
          {/* Status Bar */}
          <div className="fixed left-1/2 -translate-x-1/2 top-0 w-full max-w-[440px] z-10 bg-white h-[47px]" />

          {/* Navigation Header */}
          <NavigationHeader title="만세력" onBack={onBack} />

          {/* Content */}
          <motion.div
            className="pt-[115px] pb-[120px] px-[20px]"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {/* 성별 */}
            <motion.div
              className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mt-[-44px]"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
            >
              <div className="relative shrink-0 w-full">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                    <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">성별</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#f8f8f8] rounded-[16px] p-[8px] w-full overflow-hidden isolate">
                <div className="flex gap-[8px] w-full">
                  <button
                    onClick={() => setGender('female')}
                    className="flex-1 h-[48px] rounded-[12px] flex items-center justify-between px-[20px] py-[12px] relative bg-transparent transition-colors duration-200"
                  >
                    {gender === 'female' && (
                      <motion.div
                        layoutId="manse-gender-indicator"
                        className="absolute inset-0 bg-[#48b2af] rounded-[12px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={`text-[15px] font-medium leading-[20px] tracking-[-0.45px] relative z-[1] transition-colors duration-200 ${gender === 'female' ? 'text-white' : 'text-[#b7b7b7]'}`}>여성</span>
                    <svg className="size-[24px] relative z-[1]" fill="none" viewBox="0 0 24 24">
                      <path d="M7 11.625L10.3294 16L17 9" stroke={gender === 'female' ? 'white' : '#E7E7E7'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="transition-colors duration-200" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setGender('male')}
                    className="flex-1 h-[48px] rounded-[12px] flex items-center justify-between px-[20px] py-[12px] relative bg-transparent transition-colors duration-200"
                  >
                    {gender === 'male' && (
                      <motion.div
                        layoutId="manse-gender-indicator"
                        className="absolute inset-0 bg-[#48b2af] rounded-[12px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={`text-[15px] font-medium leading-[20px] tracking-[-0.45px] relative z-[1] transition-colors duration-200 ${gender === 'male' ? 'text-white' : 'text-[#b7b7b7]'}`}>남성</span>
                    <svg className="size-[24px] relative z-[1]" fill="none" viewBox="0 0 24 24">
                      <path d="M7 11.625L10.3294 16L17 9" stroke={gender === 'male' ? 'white' : '#E7E7E7'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="transition-colors duration-200" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 생년월일 */}
            <motion.div
              className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mt-[36px]"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
            >
              <div className="relative shrink-0 w-full">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                    <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">생년월일 (양력 기준으로 입력해 주세요)</p>
                  </div>
                </div>
              </div>
              <div className={`h-[56px] relative rounded-[16px] border transition-colors shrink-0 w-full ${
                birthDateError ? 'bg-white border-[#FF0000]' : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]'
              }`}>
                <div className="flex items-center h-full px-[12px] relative">
                  <input
                    ref={birthDateInputRef}
                    type="text"
                    inputMode="numeric"
                    value={birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); birthTimeInputRef.current?.focus(); } }}
                    placeholder="예: 1992-07-15"
                    autoComplete="off"
                    className={`peer flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent text-left placeholder:text-[#b7b7b7] w-full ${
                      isValidDate(birthDate) ? 'text-transparent focus:text-[#151515]' : 'text-[#151515]'
                    }`}
                  />
                  {isValidDate(birthDate) && (
                    <div className="absolute left-[12px] h-full flex items-center pointer-events-none peer-focus:hidden">
                      <span className="text-[16px] leading-[20px] tracking-[-0.45px] text-[#151515]">{birthDate}</span>
                      <span className="text-[16px] leading-[20px] tracking-[-0.45px] text-[#848484] ml-[4px]">(양력)</span>
                    </div>
                  )}
                </div>
                {birthDateError && (
                  <div className="absolute top-full left-0 mt-[4px] w-full px-[4px]">
                    <div className="flex gap-[4px] items-center">
                      <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                        <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 11C7.72 11 7.5 10.78 7.5 10.5V8C7.5 7.72 7.72 7.5 8 7.5C8.28 7.5 8.5 7.72 8.5 8V10.5C8.5 10.78 8.28 11 8 11ZM8.5 6.5H7.5V5.5H8.5V6.5Z" fill="#FA5B4A" />
                      </svg>
                      <p className="text-[#fa5b4a] text-[13px] leading-[22px]">{birthDateError}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 태어난 시간 */}
            <motion.div
              className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full mt-[36px]"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
            >
              <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                <div className="relative shrink-0 w-full">
                  <div className="flex flex-row items-center size-full">
                    <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                      <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">태어난 시간</p>
                    </div>
                  </div>
                </div>
                <div className={`h-[48px] relative rounded-[12px] border transition-colors shrink-0 w-full ${
                  unknownTime ? 'bg-[#f5f5f5] border-[#e7e7e7]'
                    : birthTimeError ? 'bg-white border-[#FF0000]'
                    : birthTime.length > 0 && (birthTime.includes('오전') || birthTime.includes('오후')) ? 'bg-white border-[#48b2af]'
                    : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]'
                }`}>
                  <div className="flex flex-row items-center size-full">
                    <div className="content-stretch flex items-center px-[12px] py-0 relative size-full">
                      <input
                        ref={birthTimeInputRef}
                        type="text"
                        value={birthTime}
                        onChange={(e) => handleBirthTimeChange(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); if (isFormValid() && !submitting) handleSubmit(); } }}
                        placeholder="예: 21:00"
                        disabled={unknownTime}
                        inputMode="numeric"
                        autoComplete="off"
                        className="basis-0 font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[16px] tracking-[-0.45px] bg-transparent outline-none placeholder:text-[#b7b7b7] disabled:text-[#b7b7b7]"
                      />
                    </div>
                  </div>
                  {birthTimeError && (
                    <div className="absolute top-full left-0 mt-[4px] w-full px-[4px]">
                      <div className="flex gap-[4px] items-center">
                        <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                          <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 11C7.72 11 7.5 10.78 7.5 10.5V8C7.5 7.72 7.72 7.5 8 7.5C8.28 7.5 8.5 7.72 8.5 8V10.5C8.5 10.78 8.28 11 8 11ZM8.5 6.5H7.5V5.5H8.5V6.5Z" fill="#FA5B4A" />
                        </svg>
                        <p className="text-[#fa5b4a] text-[13px] leading-[22px]">{birthTimeError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div onClick={handleUnknownTimeToggle} className="content-stretch flex gap-[4px] items-center pb-0 pt-[24px] px-0 relative shrink-0 cursor-pointer">
                <p className="leading-[20px] relative shrink-0 text-[#525252] text-[15px] text-nowrap tracking-[-0.45px]">모르겠어요</p>
                <div className="content-stretch flex items-center justify-center relative shrink-0 size-[44px]">
                  <div className={`${unknownTime ? 'bg-[#48b2af]' : 'bg-white border border-[#e7e7e7]'} content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[28px]`}>
                    {unknownTime && (
                      <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                        <path d="M7 11.625L10.3294 16L17 9" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>


            {/* 에러 메시지 */}
            {error && (
              <motion.div
                className="mt-[24px] rounded-[10px] px-[16px] py-[12px]"
                style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
              >
                <p className="text-[#dc2626] text-[13px]">{error}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Bottom Button */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 content-stretch flex flex-col items-start bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[440px] z-10 pb-[env(safe-area-inset-bottom)]">
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                  <motion.div
                    onClick={handleSubmit}
                    className={`${isFormValid() && !submitting ? 'bg-[#48b2af] cursor-pointer active:bg-[#3a9794]' : 'bg-[#f8f8f8] cursor-not-allowed'} h-[56px] relative rounded-[16px] shrink-0 w-full transition-colors`}
                    whileTap={isFormValid() && !submitting ? { scale: 0.96 } : {}}
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                    style={{ transformOrigin: "center" }}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex h-[56px] items-center justify-center px-[12px] py-0 relative w-full">
                        <p className={`leading-[25px] relative shrink-0 text-[16px] text-nowrap tracking-[-0.32px] ${isFormValid() && !submitting ? 'text-white font-medium' : 'text-[#b7b7b7] font-medium'}`}>
                          {submitting ? '조회 중...' : '만세력 보기'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 데이터 추출 ──
  const saju: string[] = manseData['사주'] || [];           // ["戊申", "壬戌", "甲寅", "癸未"]
  const oheng: string[] = manseData['오행'] || [];           // ["土金", "水土", "木木", "水土"]
  const sipsung: string[][] = manseData['십성'] || [];       // [["편관","편인"], ...]
  const sinsal12: string[][] = manseData['12신살'] || [];
  const gitaSinsal: string[][] = manseData['기타신살'] || [];
  const labels = ['시주', '일주', '월주', '년주'];

  // 격국/용신
  const gyeokGuBun = manseData['격구분'] || '';
  const yongsin = manseData['용신'] as Record<string, string[]> | undefined;
  const yongsinOheng = manseData['용신오행'] as Record<string, string[]> | undefined;
  const yongsinDesc = manseData['용신설명'] || '';

  // 물상론
  const mulsangron = manseData['물상론'] as Record<string, string> | undefined;

  // 일주론
  const iljuron = manseData['일주론'] as Record<string, string> | undefined;

  // 사주강약
  const sajuStrength = manseData['사주강약'] || '';

  // 발달 오행/십성
  const baldalOheng = manseData['발달오행'] as Record<string, number> | undefined;
  const baldalSipsung = manseData['발달십성'] as Record<string, number> | undefined;

  // 대운
  const daeunOrder: string[] = manseData['대운순서'] || [];
  const daeunData = manseData['대운'] as Record<string, ManseData> | undefined;
  const currentDaeun = daeunData?.['현재'];
  const nextDaeun = daeunData?.['다음'];

  // 세운
  const seunData = manseData['세운'] as Record<string, ManseData> | undefined;
  const seunYears = seunData ? Object.keys(seunData).sort() : [];

  // 본사주
  const bonSaju = manseData['본사주'] as Record<string, string> | undefined;

  // 사주귀천
  const sajuGuicheon = manseData['사주귀천'] as Record<string, string> | undefined;

  return (
    <div className="bg-white fixed inset-0 flex justify-center overflow-x-hidden">
      <SEO
        title="무료 만세력 - 사주팔자 원국 대운 세운 조회"
        description="생년월일시로 사주팔자 원국, 오행, 대운, 세운을 무료로 확인하세요. 일주론, 용신, 물상론까지 AI가 분석해드립니다."
        keywords="만세력, 무료만세력, 사주만세력, 사주팔자, 원국, 대운, 세운, 오행, 일주론, 용신"
        canonical="/manse"
      />
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
        {/* 네비게이션 바 */}
        <div className="shrink-0 flex items-center justify-between px-[4px] z-20" style={{ height: '52px' }}>
          <ArrowLeft onClick={onBack} />
          <p style={textStyle(17, 600, '#151515')}>만세력</p>
          <div style={{ width: '44px' }} />
        </div>

        {/* 스크롤 콘텐츠 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto w-full pb-[40px]">

          {/* ── 프로필 헤더 ── */}
          <div className="px-[20px] py-[16px]" style={{ backgroundColor: '#f9f9f9' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[8px]">
                <span style={textStyle(14, 400, '#6d6d6d')}>{displayInfo?.gender === 'male' ? '남' : '여'}</span>
                <span style={textStyle(14, 400, '#b7b7b7')}>|</span>
                <span style={textStyle(14, 400, '#6d6d6d')}>{displayInfo ? formatBirthDisplay(displayInfo.birthDate) : ''}</span>
              </div>
              {!loggedInUserId && (
                <button
                  onClick={handleBackToForm}
                  className="rounded-[8px] px-[12px] py-[6px] cursor-pointer border-none"
                  style={{ ...textStyle(13, 600, '#41a09e'), backgroundColor: '#e8f5f4' }}
                >
                  다시 입력
                </button>
              )}
            </div>
            {sajuGuicheon && (
              <div className="mt-[8px] rounded-[8px] px-[12px] py-[14px]" style={{ backgroundColor: 'white', border: '1px solid #e7e7e7' }}>
                <span style={textStyle(13, 600, '#41a09e')}>{sajuGuicheon['용어']}</span>
                <p className="mt-[6px]" style={textStyle(13, 400, '#6d6d6d', { lineHeight: '20px' })}>{sajuGuicheon['해설']}</p>
              </div>
            )}
          </div>

          {/* ── Section 1: 사주 원국 ── */}
          <SectionHeader title="사주 원국" subtitle="태어난 사주의 네 기둥" />

          {/* 4주 카드 (시→일→월→년) */}
          <div className="px-[20px] flex gap-[8px]">
            {saju.map((g, i) => (
              <PillarCard
                key={i}
                label={labels[i]}
                ganji={g}
                oheng={oheng[i] || ''}
                sipsung={sipsung[i] || []}
                sinsal12={sinsal12[i] || []}
                gitaSinsal={gitaSinsal[i] || []}
                isDay={i === 1}
              />
            ))}
          </div>

          {/* 사주강약 + 격국 */}
          <div className="px-[20px] mt-[16px] flex gap-[8px]">
            {sajuStrength && (
              <div className="rounded-[10px] px-[12px] py-[8px] flex-1" style={{ backgroundColor: '#f9f9f9', border: '1px solid #e7e7e7' }}>
                <span style={textStyle(11, 500, '#848484')}>사주 강약</span>
                <p className="mt-[2px]" style={textStyle(16, 700, '#151515')}>{sajuStrength}</p>
              </div>
            )}
            {gyeokGuBun && (
              <div className="rounded-[10px] px-[12px] py-[8px] flex-1" style={{ backgroundColor: '#f9f9f9', border: '1px solid #e7e7e7' }}>
                <span style={textStyle(11, 500, '#848484')}>격국</span>
                <p className="mt-[2px]" style={textStyle(16, 700, '#151515')}>{gyeokGuBun}</p>
              </div>
            )}
          </div>

          {/* 용신 */}
          {yongsin && (
            <div className="px-[20px] mt-[12px]">
              <div className="rounded-[10px] p-[12px]" style={{ backgroundColor: '#f9f9f9', border: '1px solid #e7e7e7' }}>
                <span style={textStyle(11, 500, '#848484')}>용신 / 희신 / 기신</span>
                <div className="flex gap-[12px] mt-[6px]">
                  {yongsin['용신'] && (
                    <div className="flex items-center gap-[4px]">
                      <span className="rounded-[4px] px-[6px] py-[2px]" style={{ ...textStyle(12, 600, 'white'), backgroundColor: '#22c55e' }}>용신</span>
                      <span style={textStyle(13, 500, '#151515')}>{yongsin['용신'].join(', ')}</span>
                      {yongsinOheng?.['용신'] && <span style={textStyle(12, 400, '#848484')}>({yongsinOheng['용신'].join(', ')})</span>}
                    </div>
                  )}
                  {yongsin['희신'] && (
                    <div className="flex items-center gap-[4px]">
                      <span className="rounded-[4px] px-[6px] py-[2px]" style={{ ...textStyle(12, 600, 'white'), backgroundColor: '#3b82f6' }}>희신</span>
                      <span style={textStyle(13, 500, '#151515')}>{yongsin['희신'].join(', ')}</span>
                    </div>
                  )}
                </div>
                {yongsin['기신'] && (
                  <div className="flex items-center gap-[4px] mt-[4px]">
                    <span className="rounded-[4px] px-[6px] py-[2px]" style={{ ...textStyle(12, 600, 'white'), backgroundColor: '#ef4444' }}>기신</span>
                    <span style={textStyle(13, 500, '#151515')}>{yongsin['기신'].join(', ')}</span>
                    {yongsinOheng?.['기신'] && <span style={textStyle(12, 400, '#848484')}>({yongsinOheng['기신'].join(', ')})</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 본사주 합충형 */}
          {bonSaju && (
            <div className="px-[20px] mt-[12px]">
              <Accordion type="single" collapsible size="medium">
                <AccordionItem value="bonsaju" style={{ border: '1px solid #e7e7e7', borderRadius: '10px', padding: '0 12px' }}>
                  <AccordionTrigger onClick={handleAccordionClick}>
                    <span style={textStyle(14, 600, '#151515')}>본사주 합충형 분석</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-[8px]">
                      <RelationItems data={bonSaju} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* ── Section 2: 분석 ── */}
          <SectionHeader title="분석" subtitle="사주의 특성과 성향" />

          <div className="px-[20px]">
            <Accordion type="multiple" size="medium">
              {/* 물상론 */}
              {mulsangron && (
                <AccordionItem value="mulsangron" style={{ border: '1px solid #e7e7e7', borderRadius: '10px', padding: '0 12px', marginBottom: '8px' }}>
                  <AccordionTrigger onClick={handleAccordionClick}>
                    <div className="flex flex-col items-start">
                      <span style={textStyle(14, 600, '#151515')}>물상론</span>
                      {mulsangron['닉네임'] && <span style={textStyle(12, 400, '#41a09e')}>{mulsangron['닉네임']}</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-[12px] pb-[8px]">
                      {mulsangron['성격'] && (
                        <div>
                          <span style={textStyle(12, 600, '#848484')}>성격</span>
                          <p className="mt-[4px]" style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{mulsangron['성격']}</p>
                        </div>
                      )}
                      {mulsangron['인간관계'] && (
                        <div>
                          <span style={textStyle(12, 600, '#848484')}>인간관계</span>
                          <p className="mt-[4px]" style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{mulsangron['인간관계']}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* 일주론 */}
              {iljuron && (
                <AccordionItem value="iljuron" style={{ border: '1px solid #e7e7e7', borderRadius: '10px', padding: '0 12px', marginBottom: '8px' }}>
                  <AccordionTrigger onClick={handleAccordionClick}>
                    <span style={textStyle(14, 600, '#151515')}>일주 분석</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-[12px] pb-[8px]">
                      {iljuron['총평'] && (
                        <div>
                          <span style={textStyle(12, 600, '#848484')}>총평</span>
                          <p className="mt-[4px]" style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{iljuron['총평']}</p>
                        </div>
                      )}
                      {iljuron['연애성향'] && (
                        <div>
                          <span style={textStyle(12, 600, '#848484')}>연애 성향</span>
                          <p className="mt-[4px]" style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{iljuron['연애성향']}</p>
                        </div>
                      )}
                      {iljuron['추천직업'] && (
                        <div>
                          <span style={textStyle(12, 600, '#848484')}>추천 직업</span>
                          <p className="mt-[4px]" style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{iljuron['추천직업']}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* 용신 설명 */}
              {yongsinDesc && (
                <AccordionItem value="yongsindesc" style={{ border: '1px solid #e7e7e7', borderRadius: '10px', padding: '0 12px', marginBottom: '8px' }}>
                  <AccordionTrigger onClick={handleAccordionClick}>
                    <span style={textStyle(14, 600, '#151515')}>용신 해설</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-[8px]">
                      <p style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{yongsinDesc}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>

          {/* 발달 오행 */}
          {baldalOheng && (
            <div className="px-[20px] mt-[16px]">
              <p style={textStyle(14, 600, '#151515')}>발달 오행</p>
              <div className="flex flex-col gap-[6px] mt-[8px]">
                {Object.entries(baldalOheng).map(([key, val]) => (
                  <StrengthBar key={key} label={key} value={val} color={OHENG_COLORS[key] || '#6b7280'} />
                ))}
              </div>
            </div>
          )}

          {/* 발달 십성 */}
          {baldalSipsung && (
            <div className="px-[20px] mt-[16px]">
              <p style={textStyle(14, 600, '#151515')}>발달 십성</p>
              <div className="flex flex-col gap-[6px] mt-[8px]">
                {Object.entries(baldalSipsung).map(([key, val]) => (
                  <StrengthBar key={key} label={key} value={val} color="#41a09e" />
                ))}
              </div>
            </div>
          )}

          {/* ── Section 3: 대운 ── */}
          <SectionHeader title="대운" subtitle="10년 주기의 큰 운의 흐름" />

          {/* 대운 타임라인 (가로 스크롤) */}
          {daeunOrder.length > 0 && (
            <div ref={daeunScrollRef} className="flex gap-[6px] px-[20px] overflow-x-auto pb-[8px]" style={{ scrollbarWidth: 'none' }}>
              {daeunOrder.map((ganji, i) => {
                const isCurrent = currentDaeun && currentDaeun['간지'] === ganji;
                return (
                  <DaeunItem
                    key={i}
                    ganji={ganji}
                    isCurrent={!!isCurrent}
                  />
                );
              })}
            </div>
          )}

          {/* 현재/다음 대운 상세 */}
          <div className="px-[20px] mt-[12px]">
            <Accordion type="multiple" size="medium">
              {currentDaeun && (
                <AccordionItem value="current-daeun" style={{ border: '1.5px solid #41a09e', borderRadius: '10px', padding: '0 12px', marginBottom: '8px' }}>
                  <AccordionTrigger onClick={handleAccordionClick}>
                    <div className="flex items-center gap-[8px]">
                      <span className="rounded-[4px] px-[6px] py-[2px]" style={{ ...textStyle(11, 600, 'white'), backgroundColor: '#41a09e' }}>현재 대운</span>
                      <span style={textStyle(15, 700, '#151515')}>{currentDaeun['간지']}</span>
                      {currentDaeun['대운기간나이'] && (
                        <span style={textStyle(12, 400, '#848484')}>{currentDaeun['대운기간나이'][0]}~{currentDaeun['대운기간나이'][1]}세</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-[12px] pb-[8px]">
                      {currentDaeun['총평'] && <p className="px-[2px] py-[6px]" style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{currentDaeun['총평']}</p>}
                      <RelationItems data={currentDaeun} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {nextDaeun && (
                <AccordionItem value="next-daeun" style={{ border: '1px solid #e7e7e7', borderRadius: '10px', padding: '0 12px', marginBottom: '8px' }}>
                  <AccordionTrigger onClick={handleAccordionClick}>
                    <div className="flex items-center gap-[8px]">
                      <span className="rounded-[4px] px-[6px] py-[2px]" style={{ ...textStyle(11, 600, '#6d6d6d'), backgroundColor: '#f0f0f0' }}>다음 대운</span>
                      <span style={textStyle(15, 700, '#151515')}>{nextDaeun['간지']}</span>
                      {nextDaeun['대운기간나이'] && (
                        <span style={textStyle(12, 400, '#848484')}>{nextDaeun['대운기간나이'][0]}~{nextDaeun['대운기간나이'][1]}세</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-[12px] pb-[8px]">
                      {nextDaeun['총평'] && <p className="px-[2px] py-[6px]" style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{nextDaeun['총평']}</p>}
                      <RelationItems data={nextDaeun} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>

          {/* ── Section 4: 세운 ── */}
          {seunYears.length > 0 && (
            <>
              <SectionHeader title="세운" subtitle="연도별 운의 흐름" />

              <div className="px-[20px]">
                <Accordion type="multiple" size="medium">
                  {seunYears.map((year) => {
                    const seun = seunData![year];
                    if (!seun) return null;
                    const isCurrentYear = year === String(new Date().getFullYear());
                    const scores = seun['운세점수'] as Record<string, number> | undefined;

                    return (
                      <AccordionItem
                        key={year}
                        value={`seun-${year}`}
                        style={{
                          border: isCurrentYear ? '1.5px solid #41a09e' : '1px solid #e7e7e7',
                          borderRadius: '10px',
                          padding: '0 12px',
                          marginBottom: '8px',
                        }}
                      >
                        <AccordionTrigger onClick={handleAccordionClick}>
                          <div className="flex items-center gap-[8px] flex-1">
                            <span style={textStyle(16, 700, '#151515')}>{year}년</span>
                            <OhengText oheng={getOhengFromChar(seun['간지']?.[0] || '')} size={15} weight={600}>
                              {seun['간지']}
                            </OhengText>
                            {seun['12신살'] && (
                              <span className="rounded-[4px] px-[4px] py-[1px]" style={{ ...textStyle(10, 500, '#41a09e'), backgroundColor: '#e8f5f4' }}>
                                {seun['12신살']}
                              </span>
                            )}
                            {isCurrentYear && (
                              <span className="rounded-[4px] px-[4px] py-[1px]" style={{ ...textStyle(10, 600, 'white'), backgroundColor: '#41a09e' }}>올해</span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-[12px] pb-[8px]">
                            {/* 총평 */}
                            {seun['총평'] && (
                              <p style={textStyle(14, 400, '#151515', { lineHeight: '22px' })}>{seun['총평']}</p>
                            )}

                            {/* 운세 점수 */}
                            {scores && (
                              <div className="rounded-[8px] px-[12px] py-[14px]" style={{ backgroundColor: '#f9f9f9' }}>
                                <span style={textStyle(12, 600, '#848484')}>운세 점수</span>
                                <div className="flex flex-col gap-[6px] mt-[6px]">
                                  {Object.entries(scores).map(([key, val]) => (
                                    <ScoreBar key={key} label={key} score={val} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 합충형 등 */}
                            <RelationItems data={seun} />

                            {/* 월별 간지 & 십성 */}
                            {seun['월별간지'] && (
                              <div className="rounded-[8px] p-[10px]" style={{ backgroundColor: '#f9f9f9' }}>
                                <span style={textStyle(12, 600, '#848484')}>월별 간지</span>
                                <div className="grid grid-cols-4 gap-[4px] mt-[6px]">
                                  {Object.entries(seun['월별간지'] as Record<string, string>).map(([month, ganji]) => {
                                    const monthSipsung = seun['월별십성']?.[month] as string[] | undefined;
                                    return (
                                      <div key={month} className="flex flex-col items-center rounded-[6px] p-[4px]" style={{ backgroundColor: 'white', border: '1px solid #e7e7e7' }}>
                                        <span style={textStyle(10, 500, '#848484')}>{month}월</span>
                                        <OhengText oheng={getOhengFromChar(ganji[0] || '')} size={13} weight={600}>{ganji}</OhengText>
                                        {monthSipsung && (
                                          <span style={textStyle(9, 400, '#6d6d6d')}>{monthSipsung.join('/')}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
