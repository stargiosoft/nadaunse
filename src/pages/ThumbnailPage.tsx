import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabaseUrl } from '../lib/supabase';
import ArrowLeft from '../components/ArrowLeft';
import { VariationSlider } from '../components/ui/VariationSlider';

// ── Types ──

type Step = 'input' | 'result';

type GeneratedImage = {
  id: number;
  src: string; // data:image/...;base64,...
  label?: string; // 항목별 생성 시 라벨
  itemPrompt?: string; // 항목별 개별 프롬프트
};

// ── Constants ──

const font = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const C = {
  primary: '#48b2af',
  primaryDark: '#41a09e',
  primaryLight: '#f0f8f8',
  surface: '#ffffff',
  surfaceDisabled: '#f8f8f8',
  surfaceSecondary: '#f9f9f9',
  borderDefault: '#e7e7e7',
  borderDivider: '#f3f3f3',
  textPrimary: '#151515',
  textBlack: '#000000',
  textSecondary: '#525252',
  textTertiary: '#6d6d6d',
  textCaption: '#848484',
  textDisabled: '#b7b7b7',
  textWhite: '#ffffff',
};

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16', desc: '릴스·쇼츠·틱톡', width: 1080, height: 1920 },
  { id: '3:4', label: '3:4', desc: '네이버 블로그', width: 900, height: 1200 },
  { id: '2:3', label: '2:3', desc: '로맨스 타로', width: 1000, height: 1500 },
  { id: '1:1', label: '1:1', desc: '인스타 정사각', width: 1080, height: 1080 },
  { id: '16:9', label: '16:9', desc: '유튜브 썸네일', width: 1280, height: 720 },
] as const;

const REFERENCE_MODES = [
  { id: 'style_only', label: '스타일만 참고', desc: '화풍 + 레퍼런스 이미지 첨부 — 화풍 정확하나 소재가 새어들 수 있음' },
  { id: 'style_text_only', label: '스타일만 (텍스트)', desc: '레퍼런스 이미지를 모델에 안 보냄 — 소재 누출 거의 없이 화풍만' },
  { id: 'style_and_character', label: '캐릭터+스타일', desc: '레퍼런스 인물·얼굴까지 유지' },
  { id: 'outpaint', label: '여백 채우기', desc: '레퍼런스 그대로, 빈 공간만 자동 확장' },
] as const;

const IMAGE_COUNTS = [1, 2, 3, 4] as const;

const FILE_FORMATS = [
  { id: 'png', label: 'PNG', desc: '고화질·투명 배경' },
  { id: 'jpg', label: 'JPG', desc: '작은 용량' },
  { id: 'webp', label: 'WebP', desc: '웹 최적화' },
] as const;

// 흰 여백 자동 채우기용: 레퍼런스를 선택된 비율에 맞춰 흰 padding으로 감싼 base64를 반환.
// 이렇게 하면 모델이 "어디를 채워야 하는지" 픽셀 레벨로 보게 되어 outpaint 정확도가 크게 올라감.
async function padReferenceForOutpaint(rawBase64: string, targetW: number, targetH: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetAspect = targetW / targetH;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      // 비율이 거의 같으면 padding 불필요
      if (Math.abs(targetAspect - imgAspect) < 0.01) {
        resolve(rawBase64);
        return;
      }
      let canvasW: number, canvasH: number;
      if (imgAspect > targetAspect) {
        // 레퍼런스가 더 가로로 길다 → 위/아래에 흰 padding (캔버스 폭은 그대로, 높이만 늘림)
        canvasW = img.naturalWidth;
        canvasH = Math.round(img.naturalWidth / targetAspect);
      } else {
        // 레퍼런스가 더 세로로 길다 → 좌/우에 흰 padding
        canvasH = img.naturalHeight;
        canvasW = Math.round(img.naturalHeight * targetAspect);
      }
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
      const x = Math.round((canvasW - img.naturalWidth) / 2);
      const y = Math.round((canvasH - img.naturalHeight) / 2);
      ctx.drawImage(img, x, y);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl.split(',')[1] || rawBase64);
    };
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = `data:image/png;base64,${rawBase64}`;
  });
}

// 멀티 생성(생성 개수 ≥ 2)에서 매 호출이 동일 prompt+레퍼런스라 결과가 너무 비슷하게 나오는 문제를 해결하기 위해,
// 호출별로 카메라/프레이밍/조명/표정/동작/시간대를 다르게 지정하는 directive를 백엔드 최상위 블록으로 주입한다.
// 카메라 차원만 흔들면 모델이 큰 차이를 못 만드므로, 콘텐츠 레벨(표정·동작·시간대)까지 같이 분기해야 사람 눈에 "다르다"고 느껴진다.
// 컷별로 순환할 앵글 후보. angleVariation 슬라이더가 0이면 directive에 포함하지 않음.
const ANGLE_PRESETS = [
  '정면 아이레벨 — 평범하고 자연스러운 시점',
  '로우 앵글 — 살짝 올려다보는 시점',
  '하이 앵글 — 살짝 내려다보는 시점',
  '사이드/오버더숄더 — 비스듬한 시점',
] as const;

// 슬라이더(0~100) → 앵글 강조 어조
function angleAdjective(v: number): string {
  if (v < 41) return '아주 살짝';
  if (v < 71) return '뚜렷하게';
  return '강하게';
}

// 사용자가 보는 helper 텍스트 (Slider 아래 보조 설명)
export function angleHelperText(v: number): string {
  if (v < 15) return '앵글 변화 없음 — 모든 컷이 같은 시점';
  if (v < 41) return '약한 앵글 변화 — 정면 위주, 미세한 시점 차이';
  if (v < 71) return '다양한 앵글 — 로우·하이·사이드 시점이 뚜렷하게 섞임';
  return '강한 앵글 변주 — 익스트림 시점까지 적극 활용';
}

export function imageHelperText(v: number): string {
  if (v < 15) return '거의 동일한 결과 — 컷 간 차이 최소';
  if (v < 41) return '비슷한 결과, 미세 변주만 — 같은 시리즈의 연속 컷 느낌';
  if (v < 71) return '프롬프트를 다양한 방향으로 해석 — 명확한 변주';
  return '자유로운 해석 — 결과 분기 폭이 큼';
}

// 슬라이더(0~100) → Gemini temperature (비선형 매핑)
export function imageVariationToTemperature(v: number): number {
  if (v <= 20) return 0.5 + (v / 20) * 0.15;          // 0~20 → 0.50~0.65
  if (v <= 50) return 0.65 + ((v - 20) / 30) * 0.15;  // 20~50 → 0.65~0.80
  if (v <= 80) return 0.80 + ((v - 50) / 30) * 0.20;  // 50~80 → 0.80~1.00
  return 1.0 + ((v - 80) / 20) * 0.20;                // 80~100 → 1.00~1.20
}

type VariationInfo = { index: number; total: number; directive: string };

function buildVariationInfo(
  index: number,
  total: number,
  angleVariation: number,
  imageVariation: number,
): VariationInfo | null {
  if (total <= 1) return null;
  // 두 슬라이더 모두 매우 낮으면 directive 자체를 생략 (seed 차이로만 자연 변주)
  if (angleVariation < 10 && imageVariation < 10) return null;

  const includeAngle = angleVariation >= 15;
  // 슬라이더 강도에 따라 사용할 앵글 프리셋 풀의 크기를 제한.
  // 낮은 값에서는 모든 컷이 같은(또는 비슷한) 앵글 → 컨셉 흔들림 최소화.
  const presetPoolSize = angleVariation < 41 ? 1 : angleVariation < 71 ? 2 : ANGLE_PRESETS.length;
  const angleClause = includeAngle
    ? `• 카메라 앵글: ${angleAdjective(angleVariation)} ${ANGLE_PRESETS[index % presetPoolSize]} (인물·캐릭터가 등장하는 이미지에 한해 자연스럽게 적용. 텍스트·플랫 일러스트·풍경 등 앵글이 어색한 경우 무시)\n`
    : '';

  const intensityNote = imageVariation < 41
    ? '"같은 시리즈의 연속 컷" 수준의 미세 변주만. 강한 차이 금지.'
    : imageVariation < 71
      ? '같은 시리즈처럼 일관성을 유지하되, 프롬프트 해석의 방향성은 컷마다 분명히 다르게.'
      : '프롬프트의 다양한 해석을 적극적으로 시도. 같은 화풍·색감·캐릭터는 유지.';

  // 앵글 다양성이 임계값 미만이면 "앵글 고정"이 directive 본문 전체에서 일관되게 유지되도록
  // 핵심 원칙·LOCK 목록·변주 차원 문구를 분기한다. (예전엔 angleClause만 빠지고 본문엔 "다른 각도"가 그대로 남아 모순)
  const sceneDescription = includeAngle
    ? '같은 씬을 다른 각도/순간에서 본 한 장면'
    : '같은 씬을 같은 카메라 앵글에서 본, 거의 동일한 한 장면';
  const angleLockLine = includeAngle ? '' : '\n• 카메라 앵글·시점 (모든 컷 동일 — 앵글 변화 없음)';
  const variationDimensionLine = includeAngle
    ? '• 변주는 카메라 시점·구도·포즈·순간 차원에서만 일어남.'
    : '• 변주는 구도·포즈·순간·미세한 디테일 차원에서만 일어남. 카메라 앵글·시점은 모든 컷 동일하게 고정.';

  const directive = `이 컷은 ${total}장 시리즈 중 ${index + 1}번째.

핵심 원칙: 시리즈의 모든 컷은 "${sceneDescription}"임. 새로운 씬·새로운 상황·새로운 디자인 컨셉으로 바꾸지 않음. 1번째 컷과 N번째 컷이 같은 영화의 연속된 다른 프레임처럼 보여야 함.

[일관성 LOCK — 레퍼런스 이미지 기반으로 절대 동일하게 유지]
• 그림체·일러스트 화풍 (medium·line work·rendering 기법)
• 질감·텍스처 (붓터치·러프함·픽셀감·필터·후처리 정도)
• 색감·팔레트·톤·전체 분위기
• 캐릭터/오브젝트 외형 (의상·헤어·얼굴 형태·디테일)
• 씬·상황·컨셉 (같은 장소, 같은 상황, 같은 서사적 순간 — 시리즈 전 컷 동일)
• 디자인 컨셉 (전체 구성·아트디렉션·씬 해석 — 1번째 컷의 컨셉을 N번째 컷도 그대로)
• 조명 무드와 시간대${angleLockLine}

레퍼런스 이미지가 있는 경우, 위 항목은 모두 레퍼런스에서 추출된 시각 정체성을 그대로 따름. 이 LOCK은 어떤 변주보다도 우선.

[이 컷의 변주 — 같은 씬 안에서, 컷마다 약간만 다른 디자인 표현]
${angleClause}• ${intensityNote}
${variationDimensionLine}
• 절대 다른 씬, 다른 상황, 다른 컨셉으로 바꾸지 않음. 새로운 디자인 아이디어를 추가하지 않음.
• 1번째 컷이 ${total}컷 중 컨셉의 기준선이며, 모든 컷이 그 기준선 위에서 디자인 변형만 있어야 함.`;

  return { index, total, directive };
}

// ── 영역 지정 수정(인페인팅) 유틸 ──

type NormRect = { x: number; y: number; w: number; h: number }; // 0~1 정규화 좌표

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

// 원본 이미지 위에 선택 영역들을 가는 테두리 선으로 표시 → base64(png, 헤더 제외) 반환.
// 모델이 "이 박스 안쪽만 바꿔라"를 픽셀 레벨로 인식하게 하는 마커. (채움색을 넣으면 결과에 그 색이 번지므로 선만.)
async function buildRegionMarkedImage(src: string, rects: NormRect[]): Promise<string> {
  const img = await loadImageEl(src);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context unavailable');
  ctx.drawImage(img, 0, 0, W, H);
  ctx.strokeStyle = 'rgba(255, 0, 80, 0.95)';
  ctx.lineWidth = Math.max(3, Math.round(Math.min(W, H) * 0.006));
  const inset = ctx.lineWidth; // 선을 사각형 안쪽으로 살짝 들여, 합성 영역 경계 바로 안에 위치하게
  for (const rect of rects) {
    const rx = Math.round(rect.x * W), ry = Math.round(rect.y * H);
    const rw = Math.round(rect.w * W), rh = Math.round(rect.h * H);
    ctx.strokeRect(rx + inset, ry + inset, Math.max(1, rw - inset * 2), Math.max(1, rh - inset * 2));
  }
  return canvas.toDataURL('image/png').split(',')[1] || '';
}

// AI 결과에서 선택 영역들만 잘라 원본 위에 페더 합성 → dataURL(png) 반환. 박스 바깥은 원본 픽셀 그대로.
async function compositeRegionResult(originalSrc: string, resultSrc: string, rects: NormRect[]): Promise<string> {
  const [orig, result] = await Promise.all([loadImageEl(originalSrc), loadImageEl(resultSrc)]);
  const W = orig.naturalWidth, H = orig.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context unavailable');
  ctx.drawImage(orig, 0, 0, W, H);
  const rW = result.naturalWidth, rH = result.naturalHeight;

  for (const rect of rects) {
    const dstX = rect.x * W, dstY = rect.y * H, dstW = rect.w * W, dstH = rect.h * H;
    const srcX = rect.x * rW, srcY = rect.y * rH, srcW = rect.w * rW, srcH = rect.h * rH;
    const pw = Math.max(1, Math.round(dstW));
    const ph = Math.max(1, Math.round(dstH));
    const patch = document.createElement('canvas');
    patch.width = pw; patch.height = ph;
    const pctx = patch.getContext('2d');
    if (!pctx) throw new Error('canvas context unavailable');
    pctx.drawImage(result, srcX, srcY, srcW, srcH, 0, 0, pw, ph);

    // 가장자리 페더 마스크 — 가로/세로 그라데이션을 destination-in으로 두 번 적용해 4변을 부드럽게.
    // (페더 폭이 넉넉해야 경계의 빨간 마커 선 잔상까지 원본으로 덮인다.)
    const feather = Math.max(2, Math.round(Math.min(pw, ph) * 0.1));
    pctx.globalCompositeOperation = 'destination-in';
    const fx = Math.min(0.49, feather / pw);
    let g = pctx.createLinearGradient(0, 0, pw, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(fx, 'rgba(0,0,0,1)');
    g.addColorStop(1 - fx, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    const fy = Math.min(0.49, feather / ph);
    g = pctx.createLinearGradient(0, 0, 0, ph);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(fy, 'rgba(0,0,0,1)');
    g.addColorStop(1 - fy, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    pctx.globalCompositeOperation = 'source-over';

    ctx.drawImage(patch, dstX, dstY);
  }
  return canvas.toDataURL('image/png');
}

// ── Component ──

export default function ThumbnailPage() {
  const navigate = useNavigate();

  // Step
  const [step, setStep] = useState<Step>('input');
  const [panelHidden, setPanelHidden] = useState(false);

  // Input
  const [prompt, setPrompt] = useState('');
  const [persistentPrompt, setPersistentPrompt] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('thumbnail-fixed-prompt') || '';
  });
  const [ratioId, setRatioId] = useState<string>('9:16');
  const [referenceMode, setReferenceMode] = useState<string>('style_only');
  // 여백 채우기 모드는 referenceMode에서 파생 (별도 체크박스 제거)
  const autoFillBackground = referenceMode === 'outpaint';
  const [imageCount, setImageCount] = useState<number>(2);
  const [customCountActive, setCustomCountActive] = useState(false);
  const [customCountText, setCustomCountText] = useState('');
  const [fileFormat, setFileFormat] = useState<string>('png');
  // 변주 강도 슬라이더 (생성 개수 ≥ 2일 때만 의미 있음)
  const [angleVariation, setAngleVariation] = useState<number>(33);
  const [imageVariation, setImageVariation] = useState<number>(33);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [referenceBase64s, setReferenceBase64s] = useState<string[]>([]);

  // Result
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isMainHover, setIsMainHover] = useState(false);
  const [hoverThumbId, setHoverThumbId] = useState<number | null>(null);

  // Edit (이미지 디벨롭)
  const [editPrompt, setEditPrompt] = useState('');
  const [editing, setEditing] = useState(false);

  // 영역 지정 수정 (인페인팅) — 결과 이미지 위에서 사각형 드래그 → 그 영역만 수정. 여러 개 선택 가능.
  const [regionMode, setRegionMode] = useState(false);
  const [selRects, setSelRects] = useState<NormRect[]>([]);
  const [draftRect, setDraftRect] = useState<NormRect | null>(null); // 드래그 중인 임시 박스
  const draftRectRef = useRef<NormRect | null>(null); // pointerup 시 최신 draft를 안전하게 읽기 위함
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // ── Handlers ──

  const MAX_REFERENCES = 8;

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processReferenceFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const remaining = MAX_REFERENCES - referencePreviews.length;
    if (remaining <= 0) {
      setError(`레퍼런스 이미지는 최대 ${MAX_REFERENCES}장까지 업로드 가능해요`);
      return;
    }
    const valid: File[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        setError('이미지는 10MB 이하만 업로드 가능해요');
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    const dataUrls = await Promise.all(valid.map(readFileAsDataUrl));
    setReferencePreviews(prev => [...prev, ...dataUrls]);
    setReferenceBase64s(prev => [...prev, ...dataUrls.map(u => u.split(',')[1])]);
    if (files.length > remaining) {
      setError(`최대 ${MAX_REFERENCES}장까지만 업로드돼요`);
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processReferenceFiles(files);
    e.target.value = '';
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    processReferenceFiles(files);
  };

  const removeReferenceAt = (index: number) => {
    setReferencePreviews(prev => prev.filter((_, i) => i !== index));
    setReferenceBase64s(prev => prev.filter((_, i) => i !== index));
  };

  const hasReferences = referencePreviews.length > 0;

  const callGenerateApi = async (
    promptOverride?: string,
    seedOverride?: number,
    variationInfo?: VariationInfo | null,
  ): Promise<{ image: string; mimeType: string }> => {
    const userPrompt = (promptOverride || prompt).trim();
    const fixedPrompt = persistentPrompt.trim();
    const combinedPrompt = [userPrompt, fixedPrompt].filter(Boolean).join('\n\n');
    // auto_fill 모드에서는 user prompt가 비어 있으면 백엔드의 outpaint 프롬프트가 전부 처리하므로 fallback 불필요.
    // 이전 fallback은 "Keep ... do not alter"라고 보내서 모델이 입력(흰 영역 포함)을 그대로 출력하는 부작용이 있었음.
    const effectivePrompt = combinedPrompt;
    const body: Record<string, unknown> = {
      prompt: effectivePrompt,
      aspect_ratio: ratioId,
      image_variation: imageVariation,
    };
    if (typeof seedOverride === 'number' && Number.isFinite(seedOverride)) {
      body.seed = seedOverride;
    }
    // variation hint는 prompt에 섞지 않고 별도 필드로 보내 백엔드에서 STYLE/CHARACTER LOCK과 동등한 최상위 블록으로 끌어올린다.
    if (variationInfo) {
      body.variation_directive = variationInfo.directive;
      body.variation_index = variationInfo.index;
      body.variation_total = variationInfo.total;
    }
    if (referenceBase64s.length > 0) {
      let refsToSend = referenceBase64s;
      if (autoFillBackground) {
        // 선택된 비율에 맞게 레퍼런스를 흰 padding으로 감싸 outpaint 영역을 명시
        const targetRatio = ASPECT_RATIOS.find(r => r.id === ratioId) || ASPECT_RATIOS[0];
        try {
          refsToSend = await Promise.all(
            referenceBase64s.map(b64 => padReferenceForOutpaint(b64, targetRatio.width, targetRatio.height))
          );
        } catch (e) {
          console.warn('[ThumbnailPage] padReferenceForOutpaint failed, falling back to raw:', e);
        }
      }
      body.reference_images = refsToSend;
      body.reference_mode = referenceMode;
      if (autoFillBackground) body.auto_fill_background = true;
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '이미지 생성 실패');
    return data as { image: string; mimeType: string };
  };

  const effectiveCount = imageCount;

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setImages([]);
    setGeneratedCount(0);
    setSelectedImageId(null);
    setStep('result');

    const BATCH_SIZE = 4;
    const results: GeneratedImage[] = [];
    const totalCount = imageCount;

    // 생성 개수 ≥ 2일 때만 variation directive를 주입해 같은 prompt+레퍼런스에서도 결과를 분기.
    // outpaint(여백 채우기)는 레퍼런스를 픽셀 단위로 보존해야 하므로 variation directive를 부착하지 않는다.
    const shouldVary = totalCount > 1 && !autoFillBackground;
    const tasks: { id: number; label?: string; itemPrompt?: string; seed: number; variation: VariationInfo | null }[] = [];
    for (let i = 0; i < totalCount; i++) {
      tasks.push({
        id: i + 1,
        seed: Math.floor(Math.random() * 2_147_483_647),
        variation: shouldVary ? buildVariationInfo(i, totalCount, angleVariation, imageVariation) : null,
      });
    }

    let firstFailureMessage: string | null = null;
    for (let batchStart = 0; batchStart < tasks.length; batchStart += BATCH_SIZE) {
      const batch = tasks.slice(batchStart, batchStart + BATCH_SIZE);

      const settled = await Promise.allSettled(
        batch.map(async (task) => {
          const data = await callGenerateApi(task.itemPrompt, task.seed, task.variation);
          return {
            id: task.id,
            src: `data:${data.mimeType};base64,${data.image}`,
            label: task.label,
            itemPrompt: task.itemPrompt,
          } as GeneratedImage;
        })
      );

      for (const result of settled) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Image generation failed:', result.reason);
          if (!firstFailureMessage) {
            firstFailureMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
          }
        }
      }

      results.sort((a, b) => a.id - b.id);
      setImages([...results]);
      setGeneratedCount(results.length);
    }

    if (results.length === 0) {
      setError(firstFailureMessage || '이미지 생성에 실패했어요');
    }

    setGenerating(false);
  }, [prompt, ratioId, referenceBase64s, referenceMode, autoFillBackground, imageCount, angleVariation, imageVariation]);

  const handleRegenerate = useCallback(async (targetId: number) => {
    setError(null);
    // 해당 이미지의 개별 프롬프트 찾기
    const targetImg = images.find(img => img.id === targetId);
    const regenPrompt = targetImg?.itemPrompt;
    setImages(prev => prev.map(img =>
      img.id === targetId ? { ...img, src: '' } : img
    ));
    try {
      // 재생성은 같은 슬롯이라도 매번 다른 결과가 나와야 하므로 fresh seed 사용.
      // 단, 그 슬롯의 variation directive(앵글·프레이밍·조명·순간)는 동일하게 유지해 다른 슬롯과의 차별화는 보존한다.
      const slotVariation = images.length > 1 && !autoFillBackground
        ? buildVariationInfo(targetId - 1, images.length, angleVariation, imageVariation)
        : null;
      const data = await callGenerateApi(regenPrompt, Math.floor(Math.random() * 2_147_483_647), slotVariation);
      setImages(prev => prev.map(img =>
        img.id === targetId ? { ...img, src: `data:${data.mimeType};base64,${data.image}` } : img
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '재생성 실패');
    }
  }, [prompt, ratioId, referenceBase64s, referenceMode, autoFillBackground, images, angleVariation, imageVariation]);

  const handleEdit = useCallback(async () => {
    const target = (selectedImageId !== null ? images.find(img => img.id === selectedImageId) : undefined) || images[0];
    const editText = editPrompt.trim();
    if (!target?.src || !editText || editing) return;

    setEditing(true);
    setError(null);

    const base64 = target.src.split(',')[1];
    const fixedPrompt = persistentPrompt.trim();
    const combinedPrompt = [editText, fixedPrompt].filter(Boolean).join('\n\n');
    const newId = images.reduce((max, img) => Math.max(max, img.id), 0) + 1;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: combinedPrompt,
          aspect_ratio: ratioId,
          reference_images: [base64],
          reference_mode: 'style_and_character',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '이미지 수정 실패');

      const newImage: GeneratedImage = {
        id: newId,
        src: `data:${data.mimeType};base64,${data.image}`,
      };
      setImages(prev => [...prev, newImage]);
      setSelectedImageId(newId);
      setEditPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 수정 실패');
    } finally {
      setEditing(false);
    }
  }, [selectedImageId, images, editPrompt, editing, persistentPrompt, ratioId]);

  const handleRegionEdit = useCallback(async () => {
    const target = (selectedImageId !== null ? images.find(img => img.id === selectedImageId) : undefined) || images[0];
    const editText = editPrompt.trim();
    if (!target?.src || !editText || editing) return;
    const rects = selRects.filter(r => r.w >= 0.02 && r.h >= 0.02);
    if (rects.length === 0) {
      setError('수정할 영역을 이미지 위에서 드래그해 선택해주세요');
      return;
    }

    setEditing(true);
    setError(null);

    const fixedPrompt = persistentPrompt.trim();
    const combinedPrompt = [editText, fixedPrompt].filter(Boolean).join('\n\n');
    const newId = images.reduce((max, img) => Math.max(max, img.id), 0) + 1;

    try {
      const markedBase64 = await buildRegionMarkedImage(target.src, rects);
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: combinedPrompt,
          aspect_ratio: ratioId,
          reference_images: [markedBase64],
          reference_mode: 'style_and_character',
          edit_region: true,
          edit_region_count: rects.length,
          image_variation: 5, // 영역 수정은 충실도가 우선 → 낮은 temperature
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '영역 수정 실패');

      const resultDataUrl = `data:${data.mimeType};base64,${data.image}`;
      // 박스 바깥은 원본 픽셀 그대로 유지하기 위해, AI 결과에서 선택 영역들만 잘라 원본 위에 합성.
      const composited = await compositeRegionResult(target.src, resultDataUrl, rects);

      const newImage: GeneratedImage = { id: newId, src: composited };
      setImages(prev => [...prev, newImage]);
      setSelectedImageId(newId);
      setEditPrompt('');
      setSelRects([]);
      setDraftRect(null);
      setRegionMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '영역 수정 실패');
    } finally {
      setEditing(false);
    }
  }, [selectedImageId, images, editPrompt, editing, selRects, persistentPrompt, ratioId]);

  const convertAndDownload = useCallback(async (src: string, filename: string) => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
    const mime = mimeMap[fileFormat] || 'image/png';
    const quality = fileFormat === 'png' ? undefined : 0.92;

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality));
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${fileFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fileFormat]);

  const toFileName = (img: GeneratedImage) =>
    img.label ? img.label.replace(/[\\?%*:|"<>]/g, '_') : `${img.id}`;

  const handleDownload = useCallback((img: GeneratedImage) => {
    convertAndDownload(img.src, toFileName(img));
  }, [convertAndDownload]);

  const [zipping, setZipping] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    const validImages = images.filter(img => img.src);
    if (validImages.length === 0) return;

    setZipping(true);
    try {
      const zip = new JSZip();
      const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
      const mime = mimeMap[fileFormat] || 'image/png';
      const quality = fileFormat === 'png' ? undefined : 0.92;

      for (const img of validImages) {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = img.src;
        });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d')!.drawImage(image, 0, 0);

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality));
        if (blob) {
          zip.file(`${toFileName(img)}.${fileFormat}`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'thumbnails.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP 생성 실패:', err);
      setError('ZIP 다운로드에 실패했어요');
    } finally {
      setZipping(false);
    }
  }, [images, fileFormat]);

  const selectedRatio = ASPECT_RATIOS.find(r => r.id === ratioId)!;
  const headerTitle = step === 'input' ? 'AI 이미지 제작' : '생성 결과';
  const canGenerate = prompt.trim().length > 0 || persistentPrompt.trim().length > 0 || (autoFillBackground && hasReferences);

  // 고정 명령어 localStorage 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('thumbnail-fixed-prompt', persistentPrompt);
  }, [persistentPrompt]);

  // 새 이미지가 도착하면 첫 번째를 선택, 또는 선택 항목이 사라졌으면 첫 번째로 폴백
  useEffect(() => {
    if (images.length === 0) return;
    if (selectedImageId === null || !images.find(img => img.id === selectedImageId)) {
      setSelectedImageId(images[0].id);
    }
  }, [images, selectedImageId]);

  const currentImage = (selectedImageId !== null
    ? images.find(img => img.id === selectedImageId)
    : undefined) || images[0];

  // 선택 이미지가 바뀌면 영역 선택 초기화 (좌표가 다른 이미지에 맞지 않으므로)
  useEffect(() => { setSelRects([]); setDraftRect(null); }, [selectedImageId]);
  // 결과 화면을 벗어나면 영역 지정 모드 해제
  useEffect(() => { if (step !== 'result') { setRegionMode(false); setSelRects([]); setDraftRect(null); setDragStart(null); } }, [step]);

  // Shift+1 단축키 → 썸네일 생성하기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === '!' && step === 'input' && canGenerate && !generating) {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, canGenerate, generating, handleGenerate]);

  // Cmd/Ctrl + \ → 사이드 패널 토글
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setPanelHidden(p => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Render ──

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full relative" style={{ maxWidth: '1200px', fontFamily: font }}>

        {/* NavigationHeader — sticky로 상단 고정 (transform 가진 조상이 있어도 동작, fixed와 달리 스크롤로 안 사라짐) */}
        <div style={{
          position: 'sticky', top: 0,
          width: '100%',
          height: '52px', zIndex: 50,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div className="flex flex-col justify-center size-full">
            <div className="flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={() => {
                if (step === 'result') { setStep('input'); return; }
                navigate(-1);
              }} />
              <p style={{
                fontFamily: font, fontSize: '16px', fontWeight: 500,
                lineHeight: '24px', letterSpacing: '0.14px',
                color: C.textBlack, textAlign: 'center',
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}>
                {headerTitle}
              </p>
              {step === 'result' && images.length > 0 && !generating ? (
                <div className="flex" style={{ gap: '8px' }}>
                  <button
                    onClick={() => setStep('input')}
                    style={{
                      height: '32px', padding: '0 24px', borderRadius: '12px',
                      backgroundColor: C.surface,
                      border: `1px solid ${C.borderDefault}`,
                      cursor: 'pointer',
                      fontFamily: font, fontSize: '13px', fontWeight: 400,
                      color: C.textSecondary, letterSpacing: '-0.26px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    처음으로
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    disabled={zipping}
                    style={{
                      height: '32px', padding: '0 24px', borderRadius: '12px',
                      backgroundColor: zipping ? C.primaryDark : C.primary, border: 'none',
                      cursor: zipping ? 'default' : 'pointer',
                      fontFamily: font, fontSize: '13px', fontWeight: 400,
                      color: C.textWhite, letterSpacing: '-0.26px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {zipping ? 'ZIP 생성 중...' : 'ZIP 다운로드'}
                  </button>
                </div>
              ) : (
                <div className="w-[44px]" />
              )}
            </div>
          </div>
        </div>

        {/* sticky 헤더는 흐름에 남아 52px를 차지하므로 별도 스페이서 불필요 */}

        {/* ════════ STEP: INPUT ════════ */}
        {step === 'input' && (
          <div style={{
            padding: '32px 20px 40px',
            display: 'flex', flexDirection: 'row-reverse', gap: '44px', flexWrap: 'nowrap',
            alignItems: 'flex-start', position: 'relative',
            minHeight: 'calc(100vh - 52px)',
          }}>
          {/* 패널 좌측 풀하이트 라인 (패널이 우측에 있을 때 메인과의 구분선) */}
          {!panelHidden && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              right: 'calc(20px + 240px)', width: '1px',
              backgroundColor: '#f0f0f0', pointerEvents: 'none',
            }} />
          )}

          {/* ── 좌측 설정 패널 (Figma 스타일) ── */}
          {!panelHidden && (
          <aside style={{
            width: '240px', flexShrink: 0,
            position: 'sticky', top: '68px',
            display: 'flex', flexDirection: 'column',
            paddingLeft: '28px',
          }}>

            {/* ── 이미지 비율 ── */}
            <div style={{
              padding: '0 20px 20px 28px', borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                이미지 비율
              </label>
              <div className="flex" style={{ gap: '4px' }}>
                {ASPECT_RATIOS.map(ratio => {
                  const selected = ratioId === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => setRatioId(ratio.id)}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      style={{
                        flex: 1, height: '26px', padding: '0 4px', borderRadius: '8px',
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.76px',
                        color: selected ? C.textWhite : '#5a5a5a',
                        backgroundColor: selected ? C.primary : '#f5f5f5',
                        border: 'none',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>
              <p style={{
                fontFamily: font, fontSize: '10px', fontWeight: 400,
                color: '#9a9a9a', marginTop: '8px',
                paddingLeft: '2px',
                letterSpacing: '0.78px',
              }}>
                {selectedRatio.desc} ({selectedRatio.width}×{selectedRatio.height}px)
              </p>
            </div>

            {/* ── 생성 개수 ── */}
            <div style={{
              padding: '20px 20px 18px 28px', borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                생성 개수
              </label>
              <div className="flex items-center" style={{ gap: '4px' }}>
                {IMAGE_COUNTS.map(count => {
                  const selected = imageCount === count && !customCountActive;
                  return (
                    <button
                      key={count}
                      onClick={() => { setImageCount(count); setCustomCountActive(false); setCustomCountText(''); }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      style={{
                        flex: 1, height: '26px', borderRadius: '8px',
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.76px',
                        color: selected ? C.textWhite : '#5a5a5a',
                        backgroundColor: selected ? C.primary : '#f5f5f5',
                        border: 'none',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
              <input
                type="number"
                min={1}
                max={50}
                value={customCountActive ? customCountText : ''}
                placeholder="직접 입력"
                onFocus={() => setCustomCountActive(true)}
                onChange={e => {
                  const txt = e.target.value;
                  setCustomCountActive(true);
                  setCustomCountText(txt);
                  const v = parseInt(txt, 10);
                  if (!isNaN(v) && v >= 1 && v <= 50) setImageCount(v);
                }}
                className="outline-none"
                style={{
                  width: '100%', height: '28px', borderRadius: '8px',
                  backgroundColor: C.surface,
                  padding: '0 12px', marginTop: '8px',
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  color: customCountActive ? C.primary : '#5a5a5a',
                  textAlign: 'left',
                  border: `1px solid ${customCountActive ? C.primary : C.borderDefault}`,
                  transition: 'all 0.15s ease',
                }}
              />
            </div>

            {/* ── 파일 형식 ── */}
            <div style={{
              padding: '20px 20px 20px 28px', borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                파일 형식
              </label>
              <div className="flex" style={{ gap: '4px' }}>
                {FILE_FORMATS.map(fmt => {
                  const selected = fileFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setFileFormat(fmt.id)}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      style={{
                        flex: 1, height: '26px', padding: '0', borderRadius: '8px',
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.76px',
                        color: selected ? C.textWhite : '#5a5a5a',
                        backgroundColor: selected ? C.primary : '#f5f5f5',
                        border: 'none',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
              <p style={{
                fontFamily: font, fontSize: '10px', fontWeight: 400,
                color: '#9a9a9a', marginTop: '8px',
                paddingLeft: '2px',
                letterSpacing: '0.78px',
              }}>
                {FILE_FORMATS.find(f => f.id === fileFormat)?.desc}
              </p>
            </div>

            {/* ── 참고 방식 ── */}
            <div style={{
              padding: '20px 20px 20px 28px', borderBottom: '1px solid #f0f0f0',
              marginLeft: '-28px', marginRight: '-20px',
            }}>
                <label style={{
                  fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '17px', letterSpacing: '-0.24px',
                  color: C.textPrimary, display: 'block', marginBottom: '8px',
                  paddingLeft: '2px',
                }}>
                  참고 방식
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {REFERENCE_MODES.map(mode => {
                    const selected = referenceMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setReferenceMode(mode.id)}
                        onMouseEnter={(e) => {
                          if (!selected) e.currentTarget.style.backgroundColor = '#ececec';
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        style={{
                          width: '100%', height: '30px', padding: '0', borderRadius: '8px',
                          fontFamily: font, fontSize: '11px', fontWeight: 400,
                          letterSpacing: '0.76px',
                          color: selected ? C.textWhite : '#5a5a5a',
                          backgroundColor: selected ? C.primary : '#f5f5f5',
                          border: 'none',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              <p style={{
                fontFamily: font, fontSize: '10px', fontWeight: 400,
                color: '#9a9a9a', marginTop: '8px',
                paddingLeft: '2px',
                letterSpacing: '0.78px',
              }}>
                {REFERENCE_MODES.find(m => m.id === referenceMode)?.desc}
              </p>
            </div>

            {/* ── 변주 강도 (생성 개수 ≥ 2일 때만 노출) ── */}
            {imageCount >= 2 && (
              <div style={{
                padding: '20px 20px 20px 28px', borderBottom: '1px solid #f0f0f0',
                marginLeft: '-28px', marginRight: '-20px',
                display: 'flex', flexDirection: 'column', gap: '20px',
              }}>
                <VariationSlider
                  label="앵글 다양성"
                  value={angleVariation}
                  onChange={setAngleVariation}
                  endLabels={['거의 동일', '매우 다양']}
                  getHelperText={angleHelperText}
                />
                <VariationSlider
                  label="이미지 다양성"
                  value={imageVariation}
                  onChange={setImageVariation}
                  endLabels={['일관성', '자유 해석']}
                  getHelperText={imageHelperText}
                />
              </div>
            )}

            {/* ── 스펙 요약 ── */}
            <div style={{ padding: '20px 0 0' }}>
              <div style={{
                padding: '13px 16px 10px', borderRadius: '12px',
                backgroundColor: C.surface,
                border: '1px solid #f0f0f0',
              }}>
                <p style={{
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  lineHeight: '18.3px', color: '#6a6a6a', letterSpacing: '-0.22px',
                  margin: 0,
                }}>
                  {selectedRatio.label} · {selectedRatio.width}×{selectedRatio.height}px
                </p>
                <p style={{
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  lineHeight: '18.3px', color: '#6a6a6a', letterSpacing: '-0.22px',
                  margin: 0,
                }}>
                  {imageCount}장 · {fileFormat.toUpperCase()}
                </p>
                <p style={{
                  fontFamily: font, fontSize: '11px', fontWeight: 400,
                  lineHeight: '18.3px', color: C.primary, letterSpacing: '-0.22px',
                  margin: 0,
                }}>
                  {REFERENCE_MODES.find(m => m.id === referenceMode)?.label || referenceMode}
                </p>
              </div>
            </div>

          </aside>
          )}

          {/* ── 메인 컬럼 ── */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>

            {/* ── 명령어 입력 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                명령어
              </label>
              <div style={{
                borderRadius: '20px', border: `1px solid ${C.borderDefault}`,
                padding: '14px 16px', backgroundColor: C.surface,
              }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="예: 유튜브 먹방 썸네일, 맛있는 치킨 앞에서 놀란 표정의 남자, 큰 글씨로 '역대급 치킨 먹방' 텍스트"
                  rows={4}
                  className="w-full outline-none bg-transparent resize-y"
                  style={{
                    fontFamily: font, fontSize: '14px', fontWeight: 400,
                    lineHeight: '21px', letterSpacing: '-0.42px',
                    color: C.textPrimary, border: 'none',
                    minHeight: '88px', display: 'block',
                  }}
                />
              </div>
            </div>

            {/* ── 고정 명령어 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                고정 명령어
              </label>
              <div style={{
                borderRadius: '20px', border: `1px solid ${C.borderDefault}`,
                padding: '14px 16px', backgroundColor: C.surface,
              }}>
                <textarea
                  value={persistentPrompt}
                  onChange={e => setPersistentPrompt(e.target.value)}
                  placeholder="예: 항상 한국어 텍스트는 또렷하게, 인물은 가운데 정렬, 톤은 따뜻하게"
                  rows={3}
                  className="w-full outline-none bg-transparent resize-y"
                  style={{
                    fontFamily: font, fontSize: '14px', fontWeight: 400,
                    lineHeight: '21px', letterSpacing: '-0.42px',
                    color: C.textPrimary, border: 'none',
                    minHeight: '64px', display: 'block',
                  }}
                />
              </div>
            </div>

            {/* ── 레퍼런스 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '17px', letterSpacing: '-0.24px',
                color: C.textPrimary, display: 'block', marginBottom: '8px',
                paddingLeft: '2px',
              }}>
                레퍼런스
              </label>

              {hasReferences ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex', flexWrap: 'wrap', gap: '10px',
                    padding: '12px', borderRadius: '20px',
                    border: `1.5px dashed ${isDragging ? C.primary : C.borderDefault}`,
                    backgroundColor: isDragging ? 'rgba(72, 178, 175, 0.06)' : C.surface,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {referencePreviews.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img
                        src={src}
                        alt={`레퍼런스 ${idx + 1}`}
                        style={{
                          width: '80px', height: '80px', objectFit: 'cover',
                          borderRadius: '16px', border: `1px solid ${C.borderDefault}`,
                          display: 'block',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeReferenceAt(idx)}
                        aria-label="이미지 삭제"
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          backgroundColor: '#1f1f1f', border: `2px solid ${C.surface}`,
                          color: C.textWhite, fontSize: '13px', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1, padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {referencePreviews.length < MAX_REFERENCES && (
                    <label
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.borderColor = '#cfcfcf';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.surface;
                        e.currentTarget.style.borderColor = C.borderDefault;
                      }}
                      style={{
                      width: '80px', height: '80px', borderRadius: '16px',
                      border: `1.5px dashed ${C.borderDefault}`,
                      backgroundColor: C.surface,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.textCaption} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReferenceUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onMouseEnter={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.backgroundColor = '#fcfcfc';
                      e.currentTarget.style.borderColor = '#dcdcdc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.backgroundColor = C.surface;
                      e.currentTarget.style.borderColor = C.borderDefault;
                    }
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: '120px', borderRadius: '20px',
                    border: `1.5px dashed ${isDragging ? C.primary : C.borderDefault}`,
                    backgroundColor: isDragging ? 'rgba(72, 178, 175, 0.06)' : C.surface,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    gap: '12px',
                  }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill={isDragging ? C.primary : '#e5e5e5'} xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.58078 19.0112L2.56078 19.0312C2.29078 18.4413 2.12078 17.7713 2.05078 17.0312C2.12078 17.7613 2.31078 18.4212 2.58078 19.0112Z" />
                    <path d="M9.00109 10.3811C10.3155 10.3811 11.3811 9.31553 11.3811 8.00109C11.3811 6.68666 10.3155 5.62109 9.00109 5.62109C7.68666 5.62109 6.62109 6.68666 6.62109 8.00109C6.62109 9.31553 7.68666 10.3811 9.00109 10.3811Z" />
                    <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.19C2 17.28 2.19 18.23 2.56 19.03C3.42 20.93 5.26 22 7.81 22H16.19C19.83 22 22 19.83 22 16.19V13.9V7.81C22 4.17 19.83 2 16.19 2ZM20.37 12.5C19.59 11.83 18.33 11.83 17.55 12.5L13.39 16.07C12.61 16.74 11.35 16.74 10.57 16.07L10.23 15.79C9.52 15.17 8.39 15.11 7.59 15.65L3.85 18.16C3.63 17.6 3.5 16.95 3.5 16.19V7.81C3.5 4.99 4.99 3.5 7.81 3.5H16.19C19.01 3.5 20.5 4.99 20.5 7.81V12.61L20.37 12.5Z" />
                  </svg>
                  <span style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    color: isDragging ? C.primary : '#c8c8c8',
                    letterSpacing: '0.76px',
                  }}>
                    {isDragging ? '여기에 놓으세요' : `최대 ${MAX_REFERENCES}장 · 장당 10MB 이하`}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              <div style={{
                marginTop: '8px', textAlign: 'right',
                fontFamily: font, fontSize: '12px', color: C.textCaption,
                letterSpacing: '-0.24px',
                paddingRight: '2px',
              }}>
                {referencePreviews.length}/{MAX_REFERENCES}
              </div>
            </div>


            {/* ── CTA: 메인 컬럼 끝, 우측 정렬 ── */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              marginTop: '8px',
            }}>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                onPointerDown={e => { if (canGenerate) e.currentTarget.style.transform = 'scale(0.99)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                style={{
                  height: '40px', padding: '0 44px', borderRadius: '12px',
                  backgroundColor: canGenerate ? C.primary : C.surfaceDisabled,
                  border: 'none', cursor: canGenerate ? 'pointer' : 'default',
                  fontFamily: font, fontSize: '13px', fontWeight: 400,
                  color: canGenerate ? C.textWhite : C.textDisabled,
                  letterSpacing: '0.72px',
                  transition: 'all 0.15s ease',
                }}
              >
                생성하기
              </button>
            </div>

          </div>{/* close main column */}
          </div>
        )}

        {/* ════════ STEP: RESULT ════════ */}
        {step === 'result' && (
          <div style={{ padding: '0 20px 40px', position: 'relative' }}>

            {/* Vertical divider — extends from nav bottom to result content bottom */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute', top: '-1px', bottom: 0,
                right: 'calc(20px + 88px + 16px)',
                width: '1px',
                backgroundColor: '#f0f0f0',
                pointerEvents: 'none',
              }} />
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '14px 16px', borderRadius: '12px',
                backgroundColor: '#fff2f0', border: '1px solid #ffccc7',
                marginBottom: '16px', marginTop: generating ? '0' : '8px',
              }}>
                <p style={{
                  fontFamily: font, fontSize: '13px', fontWeight: 400,
                  color: '#cf1322', letterSpacing: '-0.26px',
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Main viewer + thumbnail rail */}
            <div style={{
              display: 'flex', gap: '24px', alignItems: 'flex-start',
              marginTop: '24px',
            }}>
              {/* Main preview column */}
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                {currentImage?.src ? (
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
                      <div
                        className="transform-gpu"
                        onMouseEnter={() => setIsMainHover(true)}
                        onMouseLeave={() => setIsMainHover(false)}
                        onPointerDown={regionMode ? (e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
                          const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
                          setDragStart({ x, y });
                          const v = { x, y, w: 0, h: 0 };
                          draftRectRef.current = v;
                          setDraftRect(v);
                          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
                        } : undefined}
                        onPointerMove={regionMode ? (e) => {
                          if (!dragStart) return;
                          const r = e.currentTarget.getBoundingClientRect();
                          const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
                          const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
                          const v = {
                            x: Math.min(dragStart.x, x),
                            y: Math.min(dragStart.y, y),
                            w: Math.abs(x - dragStart.x),
                            h: Math.abs(y - dragStart.y),
                          };
                          draftRectRef.current = v;
                          setDraftRect(v);
                        } : undefined}
                        onPointerUp={regionMode ? (e) => {
                          try { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
                          setDragStart(null);
                          const v = draftRectRef.current;
                          if (v && v.w >= 0.02 && v.h >= 0.02) setSelRects(rs => [...rs, v]);
                          draftRectRef.current = null;
                          setDraftRect(null);
                        } : undefined}
                        style={{
                          position: 'relative',
                          aspectRatio: `${selectedRatio.width}/${selectedRatio.height}`,
                          maxHeight: 'min(72vh, 720px)',
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          borderRadius: '24px',
                          border: `1px solid ${C.borderDefault}`,
                          overflow: 'hidden',
                          cursor: regionMode ? 'crosshair' : 'default',
                          touchAction: regionMode ? 'none' : 'auto',
                          userSelect: regionMode ? 'none' : 'auto',
                          WebkitUserSelect: regionMode ? 'none' : 'auto',
                        }}
                      >
                        <img
                          src={currentImage.src}
                          alt={`썸네일 ${currentImage.id}`}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                        />
                        {/* 영역 지정 오버레이 — 선택 박스들 + 바깥 디밍 (SVG 마스크로 여러 박스 처리) */}
                        {regionMode && (selRects.length > 0 || draftRect) && (
                          <svg
                            viewBox="0 0 1 1" preserveAspectRatio="none"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                          >
                            <defs>
                              <mask id="thumb-sel-mask">
                                <rect x="0" y="0" width="1" height="1" fill="white" />
                                {selRects.map((rr, i) => <rect key={i} x={rr.x} y={rr.y} width={rr.w} height={rr.h} fill="black" />)}
                                {draftRect && <rect x={draftRect.x} y={draftRect.y} width={draftRect.w} height={draftRect.h} fill="black" />}
                              </mask>
                            </defs>
                            <rect x="0" y="0" width="1" height="1" fill="rgba(0,0,0,0.34)" mask="url(#thumb-sel-mask)" />
                            {selRects.map((rr, i) => (
                              <rect key={i} x={rr.x} y={rr.y} width={rr.w} height={rr.h} fill="none" stroke="#ff3b30" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                            ))}
                            {draftRect && (
                              <rect x={draftRect.x} y={draftRect.y} width={draftRect.w} height={draftRect.h} fill="none" stroke="#ff3b30" strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                            )}
                          </svg>
                        )}
                        {/* 각 선택 박스 삭제 버튼 */}
                        {regionMode && selRects.map((rr, i) => (
                          <button
                            key={i}
                            onPointerDown={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); setSelRects(rs => rs.filter((_, idx) => idx !== i)); }}
                            aria-label="영역 삭제"
                            style={{
                              position: 'absolute',
                              left: `calc(${(rr.x + rr.w) * 100}% - 11px)`,
                              top: `calc(${rr.y * 100}% - 11px)`,
                              width: '22px', height: '22px', borderRadius: '50%',
                              backgroundColor: '#1f1f1f', border: '2px solid #ffffff',
                              color: '#ffffff', fontSize: '12px', fontWeight: 700, lineHeight: 1,
                              cursor: 'pointer', padding: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 3,
                            }}
                          >
                            ×
                          </button>
                        ))}
                        {/* Hover overlay: full-width download button */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0,
                          padding: '16px',
                          opacity: (isMainHover && !regionMode) ? 1 : 0,
                          transition: 'opacity 0.15s ease',
                          pointerEvents: (isMainHover && !regionMode) ? 'auto' : 'none',
                        }}>
                          <button
                            onClick={() => handleDownload(currentImage)}
                            style={{
                              width: '100%',
                              padding: '14px',
                              borderRadius: '12px',
                              border: 'none',
                              backgroundColor: 'rgba(0, 0, 0, 0.65)',
                              backdropFilter: 'blur(6px)',
                              WebkitBackdropFilter: 'blur(6px)',
                              color: C.textWhite, cursor: 'pointer',
                              fontFamily: font, fontSize: '14px', fontWeight: 400,
                              letterSpacing: '-0.28px',
                            }}
                          >
                            다운로드
                          </button>
                        </div>
                      </div>

                      {/* ── 영역 지정 툴바 ── */}
                      <div style={{
                        marginTop: '16px',
                        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                      }}>
                        <button
                          onClick={() => { setRegionMode(m => !m); setSelRects([]); setDraftRect(null); setDragStart(null); }}
                          style={{
                            height: '32px', padding: '0 14px', borderRadius: '10px',
                            border: `1px solid ${regionMode ? C.primary : C.borderDefault}`,
                            backgroundColor: regionMode ? C.primaryLight : C.surface,
                            color: regionMode ? C.primaryDark : C.textSecondary,
                            cursor: 'pointer',
                            fontFamily: font, fontSize: '12px', fontWeight: 400,
                            letterSpacing: '-0.24px', transition: 'all 0.15s ease',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3" />
                          </svg>
                          {regionMode ? '영역 지정 중' : '영역 지정해서 수정'}
                        </button>
                        {regionMode && (
                          <span style={{
                            fontFamily: font, fontSize: '12px', color: C.textCaption, letterSpacing: '-0.24px',
                          }}>
                            {selRects.length > 0
                              ? `${selRects.length}개 영역 선택됨 · 드래그로 더 추가, 박스의 × 로 삭제`
                              : '이미지 위에서 드래그해 수정할 영역을 선택하세요 (여러 개 가능)'}
                          </span>
                        )}
                        {regionMode && selRects.length > 0 && (
                          <button
                            onClick={() => setSelRects([])}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                              fontFamily: font, fontSize: '12px', color: C.primary, letterSpacing: '-0.24px',
                            }}
                          >
                            전체 해제
                          </button>
                        )}
                      </div>

                      {/* ── 이미지 수정 입력 ── */}
                      <div style={{
                        marginTop: '10px',
                        display: 'flex', gap: '8px', alignItems: 'stretch',
                      }}>
                        <input
                          type="text"
                          value={editPrompt}
                          onChange={e => setEditPrompt(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing && editPrompt.trim() && !editing) {
                              e.preventDefault();
                              if (regionMode && selRects.length > 0) handleRegionEdit(); else if (!regionMode) handleEdit();
                            }
                          }}
                          placeholder={
                            regionMode
                              ? (selRects.length > 0 ? '선택한 부분(들)을 어떻게 바꿀까요? (예: 이 별을 더 크게)' : '먼저 이미지에서 수정할 영역을 드래그하세요')
                              : '어떻게 수정할까요? (예: 여자 드레스를 흰색으로)'
                          }
                          disabled={editing || (regionMode && selRects.length === 0)}
                          className="outline-none"
                          style={{
                            flex: 1, height: '44px', borderRadius: '12px',
                            padding: '0 16px',
                            fontFamily: font, fontSize: '13px', fontWeight: 400,
                            color: C.textPrimary,
                            backgroundColor: (editing || (regionMode && selRects.length === 0)) ? C.surfaceDisabled : C.surface,
                            border: `1px solid ${C.borderDefault}`,
                            letterSpacing: '-0.26px',
                            transition: 'all 0.15s ease',
                            minWidth: 0,
                          }}
                          onFocus={e => { if (!editing && !(regionMode && selRects.length === 0)) e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = C.borderDefault; }}
                        />
                        <button
                          onClick={() => { if (regionMode && selRects.length > 0) handleRegionEdit(); else if (!regionMode) handleEdit(); }}
                          disabled={!editPrompt.trim() || editing || (regionMode && selRects.length === 0)}
                          style={{
                            height: '44px', padding: '0 24px', borderRadius: '12px',
                            backgroundColor: (editPrompt.trim() && !editing && !(regionMode && selRects.length === 0)) ? C.primary : C.surfaceDisabled,
                            border: 'none',
                            cursor: (editPrompt.trim() && !editing && !(regionMode && selRects.length === 0)) ? 'pointer' : 'default',
                            fontFamily: font, fontSize: '13px', fontWeight: 400,
                            color: (editPrompt.trim() && !editing && !(regionMode && selRects.length === 0)) ? C.textWhite : C.textDisabled,
                            letterSpacing: '-0.26px',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {editing
                            ? (regionMode && selRects.length > 0 ? '영역 수정 중...' : '수정 중...')
                            : (regionMode && selRects.length > 0 ? `선택 영역 수정${selRects.length > 1 ? ` (${selRects.length})` : ''}` : '수정하기')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: 'min(72vh, 720px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div className="flex flex-col items-center" style={{ gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        border: `3px solid ${C.borderDefault}`,
                        borderTopColor: C.primary,
                        animation: 'spin 1s linear infinite',
                      }} />
                      <p style={{
                        fontFamily: font, fontSize: '14px', fontWeight: 400,
                        color: C.textCaption,
                      }}>
                        {generating ? `${effectiveCount}장 생성 중...` : '재생성 중...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right thumbnail rail */}
              {images.length > 1 && (
                <aside style={{
                  width: '88px',
                  flexShrink: 0,
                  position: 'sticky',
                  top: '68px',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {images.map((img) => {
                      const isSelected = img.id === selectedImageId;
                      const isHovered = hoverThumbId === img.id;
                      return (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImageId(img.id)}
                          onMouseEnter={() => setHoverThumbId(img.id)}
                          onMouseLeave={() => setHoverThumbId(null)}
                          className="transform-gpu"
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: `${selectedRatio.width}/${selectedRatio.height}`,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: isSelected
                              ? `2px solid ${C.primary}`
                              : `1px solid ${C.borderDefault}`,
                            padding: 0,
                            cursor: 'pointer',
                            backgroundColor: C.surfaceSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'border 0.15s ease',
                          }}
                        >
                          {img.src && (
                            <>
                              <img
                                src={img.src}
                                alt={`썸네일 ${img.id}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <span
                                onClick={(e) => { e.stopPropagation(); handleDownload(img); }}
                                style={{
                                  position: 'absolute',
                                  bottom: '6px', left: '6px', right: '6px',
                                  display: 'block',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                  backdropFilter: 'blur(4px)',
                                  WebkitBackdropFilter: 'blur(4px)',
                                  color: C.textWhite,
                                  fontFamily: font, fontSize: '10px', fontWeight: 400,
                                  letterSpacing: '-0.2px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  opacity: isHovered ? 1 : 0,
                                  transition: 'opacity 0.15s ease',
                                  pointerEvents: isHovered ? 'auto' : 'none',
                                }}
                              >
                                다운로드
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </aside>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
