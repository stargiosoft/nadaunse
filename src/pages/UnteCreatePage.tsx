/**
 * 운테 테스트 생성 페이지
 * ★DESIGN_SYSTEM★ 기반 — 아이디어 입력 → AI 생성 → 검토/승인
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { NavigationHeader } from '../components/NavigationHeader';

interface GeneratedResult {
  day_master: string;
  relation_type?: string;
  result_title: string;
  result_description: string;
  score: number;
  result_label?: string;
  result_image_url?: string | null;
}

/** 결과의 고유 키 (일반: day_master, 궁합: relation_type) */
function resultKey(r: GeneratedResult): string {
  return r.relation_type || r.day_master;
}

interface GeneratedTest {
  testId: string;
  slug: string;
  title: string;
  description: string;
  templateType: string;
  isAdult: boolean;
  resultFormat?: string;
  results: GeneratedResult[];
  imageStyleGuide?: string;
  thumbnailUrl?: string | null;
}

type Step = 'input' | 'generating' | 'review' | 'publishing';

const font = "'Pretendard Variable', sans-serif";

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A0';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B0';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C0';
  if (score >= 65) return 'D+';
  if (score >= 60) return 'D0';
  return 'F';
}

export function UnteCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') as 'slot_machine' | 'compatibility' | 'adult' | null;
  const [selectedCategory, setSelectedCategory] = useState<'slot_machine' | 'compatibility' | 'adult'>(initialCategory || 'slot_machine');
  const [step, setStep] = useState<Step>('input');
  const [idea, setIdea] = useState('');
  const [generated, setGenerated] = useState<GeneratedTest | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [published, setPublished] = useState(false);
  // AI 아이디어 추천
  const [aiIdeas, setAiIdeas] = useState<Array<{ title: string; type: string; resultFormat: string }>>([]);
  const [aiIdeasLoading, setAiIdeasLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generatedRef = useRef<GeneratedTest | null>(null);
  const [pollTrigger, setPollTrigger] = useState(0);
  const [regeneratingDayMasters, setRegeneratingDayMasters] = useState<Set<string>>(new Set());
  // 재생성 전 URL 스냅샷 (구 URL 복원 방지용)
  const preRegenUrlsRef = useRef<Map<string, string | null>>(new Map());
  const [isMaster, setIsMaster] = useState(false);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);

  // 레퍼런스 이미지 — Storage 경유 (base64 body 제거)
  interface RefImage {
    preview: string | null;    // 로컬 blob URL (미리보기)
    storageUrl: string | null; // Storage public URL (Edge Function 전달용)
    storagePath: string | null;// Storage 경로 (삭제용)
    uploading: boolean;
    fileName: string | null;
  }
  const emptyRef: RefImage = { preview: null, storageUrl: null, storagePath: null, uploading: false, fileName: null };
  const [refImage, setRefImage] = useState<RefImage>(emptyRef);
  const [thumbRef, setThumbRef] = useState<RefImage>(emptyRef);
  const refImageRef = useRef<RefImage>(emptyRef);
  const thumbRefRef = useRef<RefImage>(emptyRef);

  // ref 동기화 (cleanup에서 최신값 참조용)
  useEffect(() => { refImageRef.current = refImage; }, [refImage]);
  useEffect(() => { thumbRefRef.current = thumbRef; }, [thumbRef]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) {
        const { data } = await supabase.from('users').select('role').eq('id', uid).single();
        setIsMaster(data?.role === 'master');
      }
    });
  }, []);

  // AI 아이디어 추천 로드
  const fetchAiIdeas = useCallback(async (cat?: string) => {
    setAiIdeasLoading(true);
    try {
      const categoryToSend = cat ?? selectedCategory;
      const res = await fetch(`${supabaseUrl}/functions/v1/suggest-viral-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryToSend }),
      });
      if (!res.ok) throw new Error('추천 실패');
      const data = await res.json();
      if (data.ideas?.length) setAiIdeas(data.ideas);
    } catch (err) {
      console.error('AI 아이디어 추천 오류:', err);
    } finally {
      setAiIdeasLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => { fetchAiIdeas(); }, []);

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((cat: 'slot_machine' | 'compatibility' | 'adult') => {
    setSelectedCategory(cat);
    setAiIdeas([]);
    fetchAiIdeas(cat);
  }, [fetchAiIdeas]);

  // generated 상태를 ref에도 동기화 (cleanup에서 최신값 참조용)
  useEffect(() => {
    generatedRef.current = generated;
  }, [generated]);

  // 미게시 테스트 정리 (discard)
  const discardTest = useCallback(async (testId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      await fetch(`${supabaseUrl}/functions/v1/viral-test-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'discard', testId }),
      });
    } catch (err) {
      console.error('테스트 정리 실패:', err);
    }
  }, []);

  // Storage에서 레퍼런스 이미지 삭제 헬퍼
  const deleteRefFromStorage = useCallback(async (path: string | null) => {
    if (!path) return;
    try {
      await supabase.storage.from('assets').remove([path]);
    } catch (err) {
      console.error('ref 이미지 삭제 실패:', err);
    }
  }, []);

  // 이탈 시 미게시 테스트 + 레퍼런스 이미지 정리
  useEffect(() => {
    return () => {
      const gen = generatedRef.current;
      if (gen?.testId && !published) {
        discardTest(gen.testId);
      }
      // Storage ref 이미지 정리
      const ref = refImageRef.current;
      const thumb = thumbRefRef.current;
      if (ref.storagePath) deleteRefFromStorage(ref.storagePath);
      if (thumb.storagePath) deleteRefFromStorage(thumb.storagePath);
    };
  }, [published, discardTest, deleteRefFromStorage]);

  const [isDragging, setIsDragging] = useState(false);

  // 이미지 리사이즈 + WebP 변환 + Storage 업로드 공통 헬퍼
  const resizeAndUpload = useCallback(async (file: File, maxPx: number): Promise<{ storageUrl: string; storagePath: string }> => {
    const blob: Blob = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxPx || h > maxPx) {
          const ratio = Math.min(maxPx / w, maxPx / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Canvas 변환 실패')),
          'image/webp', 0.8
        );
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('이미지 로드 실패')); };
      img.src = URL.createObjectURL(file);
    });
    const path = `viral-tests/refs/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(path, blob, { contentType: 'image/webp', upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
    return { storageUrl: publicUrl, storagePath: path };
  }, []);

  // 레퍼런스 이미지 처리 (선택 → 미리보기 + Storage 업로드)
  const processRefFile = useCallback(async (file: File, type: 'main' | 'thumb') => {
    if (file.size > 10 * 1024 * 1024) { setError('이미지는 10MB 이하만 가능해요'); return; }
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 첨부할 수 있어요'); return; }
    setError('');

    const setter = type === 'main' ? setRefImage : setThumbRef;
    const oldState = type === 'main' ? refImageRef.current : thumbRefRef.current;

    // 이전 이미지 정리
    if (oldState.preview) URL.revokeObjectURL(oldState.preview);
    if (oldState.storagePath) deleteRefFromStorage(oldState.storagePath);

    const preview = URL.createObjectURL(file);
    setter({ preview, storageUrl: null, storagePath: null, uploading: true, fileName: file.name });

    try {
      const maxPx = type === 'thumb' ? 512 : 768;
      const { storageUrl, storagePath } = await resizeAndUpload(file, maxPx);
      setter({ preview, storageUrl, storagePath, uploading: false, fileName: file.name });
    } catch (err) {
      console.error('ref 업로드 실패:', err);
      setError('이미지 업로드에 실패했어요. 다시 시도해주세요.');
      URL.revokeObjectURL(preview);
      setter(emptyRef);
    }
  }, [resizeAndUpload, deleteRefFromStorage]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processRefFile(file, 'main');
  }, [processRefFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processRefFile(file, 'main');
  }, [processRefFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleRemoveImage = useCallback(() => {
    if (refImage.preview) URL.revokeObjectURL(refImage.preview);
    deleteRefFromStorage(refImage.storagePath);
    setRefImage(emptyRef);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [refImage, deleteRefFromStorage]);

  // 썸네일 레퍼런스 핸들러
  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processRefFile(file, 'thumb');
  }, [processRefFile]);

  const handleThumbnailDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsThumbnailDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processRefFile(file, 'thumb');
  }, [processRefFile]);

  const handleRemoveThumbnailRef = useCallback(() => {
    if (thumbRef.preview) URL.revokeObjectURL(thumbRef.preview);
    deleteRefFromStorage(thumbRef.storagePath);
    setThumbRef(emptyRef);
    if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = '';
  }, [thumbRef, deleteRefFromStorage]);

  // 검토 단계에서 결과 이미지 폴링 (pollTrigger로 명시적 시작만)
  useEffect(() => {
    if (step !== 'review' || !generated || pollTrigger === 0) return;

    const hasAllImages = generated.results.every(r => r.result_image_url);
    if (hasAllImages) {
      setImagesLoading(false);
      setRegeneratingDayMasters(new Set());
      return;
    }

    pollRef.current = setInterval(async () => {
      const [{ data }, { data: testData }] = await Promise.all([
        supabase
          .from('viral_test_results')
          .select('day_master, relation_type, result_image_url')
          .eq('test_id', generated.testId),
        supabase
          .from('viral_tests')
          .select('thumbnail_url')
          .eq('id', generated.testId)
          .single(),
      ]);

      if (!data) return;

      // 범용 키: 궁합은 relation_type, 일반은 day_master
      const imageMap = new Map(data.map(d => [d.relation_type || d.day_master, d.result_image_url]));
      const preRegenUrls = preRegenUrlsRef.current;

      setGenerated(prev => prev ? {
        ...prev,
        thumbnailUrl: testData?.thumbnail_url || prev.thumbnailUrl,
        results: prev.results.map(r => {
          const key = resultKey(r);
          const dbUrl = imageMap.get(key);
          // 재생성 중인 이미지 (state가 null): DB URL이 변경된 경우에만 반영
          if (!r.result_image_url && preRegenUrls.has(key)) {
            const oldUrl = preRegenUrls.get(key);
            if (dbUrl && dbUrl !== oldUrl) {
              return { ...r, result_image_url: dbUrl };
            }
            return r; // 구 URL 복원 방지 → null 유지
          }
          return { ...r, result_image_url: dbUrl || r.result_image_url };
        }),
      } : prev);

      // 재생성 완료된 키 제거 (URL이 실제 변경된 경우만)
      setRegeneratingDayMasters(prev => {
        const next = new Set(prev);
        for (const d of data) {
          const key = d.relation_type || d.day_master;
          if (next.has(key) && d.result_image_url) {
            const oldUrl = preRegenUrls.get(key);
            if (d.result_image_url !== oldUrl) {
              next.delete(key);
              preRegenUrls.delete(key);
            }
          }
        }
        return next.size === prev.size ? prev : next;
      });

      // 완료 체크: 재생성 중인 것은 URL 변경 확인, 나머지는 URL 존재 확인
      const allDone = data.every(d => {
        if (!d.result_image_url) return false;
        const key = d.relation_type || d.day_master;
        const oldUrl = preRegenUrls.get(key);
        if (oldUrl !== undefined) {
          return d.result_image_url !== oldUrl; // 재생성: URL 변경됨
        }
        return true; // 비재생성: URL 있으면 OK
      });

      if (allDone) {
        setImagesLoading(false);
        preRegenUrlsRef.current = new Map();
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, generated?.testId, pollTrigger]);

  const handleGenerate = async () => {
    if (!idea.trim() || idea.trim().length < 2) {
      setError('아이디어를 2글자 이상 입력해주세요');
      return;
    }

    setStep('generating');
    setError('');

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-viral-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea.trim(),
          creatorId: userId,
          ...(refImage.storageUrl && { hasReferenceImage: true }),
          category: selectedCategory,
        }),
      });

      const text = await response.text().catch(() => '') || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('응답 파싱 실패:', text.slice(0, 300));
        throw new Error('서버 응답을 처리할 수 없습니다. 다시 시도해주세요.');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI 생성에 실패했습니다.');
      }

      setGenerated(data);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setStep('review');
    } catch (err) {
      console.error('생성 실패:', err);
      setError(err instanceof Error ? err.message : '생성에 실패했습니다.');
      setStep('input');
    }
  };

  const handlePublish = async () => {
    if (!generated) return;

    setStep('publishing');

    try {
      if (editTitle !== generated.title || editDescription !== generated.description) {
        await supabase.from('viral_tests').update({
          title: editTitle,
          description: editDescription,
          updated_at: new Date().toISOString(),
        }).eq('id', generated.testId);
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        await supabase.from('viral_tests').update({
          status: 'live',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', generated.testId);
      } else {
        const adminResponse = await fetch(`${supabaseUrl}/functions/v1/viral-test-admin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'publish', testId: generated.testId }),
        });

        const adminData = await adminResponse.json();
        if (!adminData.success) throw new Error(adminData.error);
      }

      // 게시 완료 → 레퍼런스 이미지 Storage 정리 (더 이상 불필요)
      deleteRefFromStorage(refImage.storagePath);
      deleteRefFromStorage(thumbRef.storagePath);
      setPublished(true);
      navigate(`/unte/${generated.slug}`);
    } catch (err) {
      console.error('게시 실패:', err);
      setError(err instanceof Error ? err.message : '게시에 실패했습니다.');
      setStep('review');
    }
  };

  // 기획 다시하기 (Step 1+2 재실행, 기존 testId 재활용)
  const handleRegenerate = async () => {
    if (!generated) return;
    setStep('generating');
    setError('');

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-viral-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea.trim(),
          creatorId: userId,
          testId: generated.testId,
          ...(refImage.storageUrl && { hasReferenceImage: true }),
          category: selectedCategory,
        }),
      });

      const text = await response.text().catch(() => '') || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }
      if (!data.success) throw new Error(data.error || 'AI 생성에 실패했습니다.');

      setGenerated(data);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setRegeneratingDayMasters(new Set());
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : '기획 다시하기에 실패했습니다.');
      setStep('review');
    }
  };

  // 이미지 전체 다시 만들기
  const handleRegenerateImages = async () => {
    if (!generated) return;

    // 재생성 전 URL 스냅샷 저장 (폴링에서 구 URL 복원 방지)
    const urlMap = new Map<string, string | null>();
    for (const r of generated.results) {
      urlMap.set(resultKey(r), r.result_image_url);
    }
    preRegenUrlsRef.current = urlMap;

    // 로컬 이미지 초기화 (썸네일 포함)
    setGenerated(prev => prev ? {
      ...prev,
      thumbnailUrl: null,
      results: prev.results.map(r => ({ ...r, result_image_url: null })),
    } : prev);
    setImagesLoading(true);
    setRegeneratingDayMasters(new Set(generated.results.map(r => resultKey(r))));

    // DB 이미지 URL 초기화 (폴링이 새 이미지만 감지하도록)
    await supabase.from('viral_test_results')
      .update({ result_image_url: null, share_image_url: null })
      .eq('test_id', generated.testId);
    await supabase.from('viral_tests')
      .update({ thumbnail_url: null })
      .eq('id', generated.testId);

    // 이미지 생성 API 호출 (fire-and-forget) — URL만 전달
    fetch(`${supabaseUrl}/functions/v1/generate-viral-test-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: generated.testId,
        ...(refImage.storageUrl && { referenceImageUrl: refImage.storageUrl }),
        ...(thumbRef.storageUrl && { thumbnailReferenceImageUrl: thumbRef.storageUrl }),
      }),
    }).catch(console.error);

    setPollTrigger(c => c + 1);
  };

  // 개별 이미지 다시 만들기
  const handleRegenerateSingleImage = async (key: string) => {
    if (!generated) return;
    const isCompat = generated.templateType === 'compatibility';

    // 재생성 전 URL 스냅샷 저장 (폴링에서 구 URL 복원 방지)
    const target = generated.results.find(r => resultKey(r) === key);
    preRegenUrlsRef.current.set(key, target?.result_image_url || null);

    // 해당 이미지만 초기화
    setGenerated(prev => prev ? {
      ...prev,
      results: prev.results.map(r =>
        resultKey(r) === key ? { ...r, result_image_url: null } : r
      ),
    } : prev);
    setRegeneratingDayMasters(prev => new Set([...prev, key]));
    setImagesLoading(true);

    // DB 이미지 URL 초기화
    const query = supabase.from('viral_test_results')
      .update({ result_image_url: null, share_image_url: null })
      .eq('test_id', generated.testId);
    if (isCompat) {
      await query.eq('relation_type', key);
    } else {
      await query.eq('day_master', key);
    }

    // 이미지 생성 API 호출 — URL만 전달
    fetch(`${supabaseUrl}/functions/v1/generate-viral-test-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: generated.testId,
        ...(isCompat ? { relationTypes: [key] } : { dayMasters: [key] }),
        ...(refImage.storageUrl && { referenceImageUrl: refImage.storageUrl }),
      }),
    }).catch(console.error);

    setPollTrigger(c => c + 1);
  };

  // 썸네일만 다시 만들기
  const [thumbnailRegenerating, setThumbnailRegenerating] = useState(false);
  const handleRegenerateThumbnail = async () => {
    if (!generated) return;

    const oldUrl = generated.thumbnailUrl;
    setThumbnailRegenerating(true);
    setGenerated(prev => prev ? { ...prev, thumbnailUrl: null } : prev);

    await supabase.from('viral_tests')
      .update({ thumbnail_url: null })
      .eq('id', generated.testId);

    fetch(`${supabaseUrl}/functions/v1/generate-viral-test-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: generated.testId,
        thumbnailOnly: true,
        ...(thumbRef.storageUrl && { thumbnailReferenceImageUrl: thumbRef.storageUrl }),
        ...(refImage.storageUrl && { referenceImageUrl: refImage.storageUrl }),
      }),
    }).catch(console.error);

    // 썸네일 폴링
    const thumbPoll = setInterval(async () => {
      const { data } = await supabase
        .from('viral_tests')
        .select('thumbnail_url')
        .eq('id', generated.testId)
        .single();
      if (data?.thumbnail_url && data.thumbnail_url !== oldUrl) {
        setGenerated(prev => prev ? { ...prev, thumbnailUrl: data.thumbnail_url } : prev);
        setThumbnailRegenerating(false);
        clearInterval(thumbPoll);
      }
    }, 3000);

    // 60초 타임아웃
    setTimeout(() => { clearInterval(thumbPoll); setThumbnailRegenerating(false); }, 60000);
  };

  const elementEmoji: Record<string, string> = {
    '갑': '🌳', '을': '🍃', '병': '☀️', '정': '🕯️', '무': '⛰️',
    '기': '🌾', '경': '⚔️', '신': '💎', '임': '🌊', '계': '💧',
  };

  const sipsungEmoji: Record<string, string> = {
    '비견': '🤝', '겁재': '⚡', '식신': '🍽️', '상관': '💥', '편재': '💰',
    '정재': '💎', '편관': '⚔️', '정관': '👔', '편인': '🔮', '정인': '🎓',
  };

  const isCompatibilityTest = generated?.templateType === 'compatibility';
  const getEmoji = (r: GeneratedResult) =>
    isCompatibilityTest ? (sipsungEmoji[r.relation_type || ''] || '✨') : (elementEmoji[r.day_master] || '✨');

  const inputStyle: React.CSSProperties = {
    height: '56px',
    backgroundColor: '#ffffff',
    border: '1px solid #e7e7e7',
    borderRadius: '16px',
    padding: '0 16px',
    fontFamily: font,
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '-0.45px',
    color: '#151515',
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: font,
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '-0.24px',
    color: '#848484',
    display: 'block',
    marginBottom: '6px',
  };

  const isValid = idea.trim().length >= 2 && !refImage.uploading && !thumbRef.uploading;
  const hasAnyImage = generated?.results.some(r => r.result_image_url) ?? false;

  return (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="w-full max-w-[440px] relative">

        {/* 헤더 — NavigationHeader 공통 컴포넌트 */}
        <NavigationHeader title="테스트 만들기" onBack={() => {
          if (generated?.testId && !published) {
            discardTest(generated.testId);
          }
          navigate(-1);
        }} />

        <div style={{ padding: '24px 20px 100px', paddingTop: '84px', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {/* Step 1: 아이디어 입력 */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col"
                style={{ gap: '24px' }}
              >
                <div>
                  <p style={{
                    fontFamily: font, fontSize: '22px', fontWeight: 600,
                    lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
                  }}>
                    어떤 테스트를<br />만들고 싶으세요?
                  </p>
                  <p style={{
                    fontFamily: font, fontSize: '15px', fontWeight: 400,
                    lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
                    marginTop: '8px',
                  }}>
                    아이디어만 입력하면 AI가 자동으로 만들어줘요
                  </p>
                </div>

                {/* 카테고리 필터 */}
                <div className="flex" style={{ gap: '6px' }}>
                  {([
                    { key: 'slot_machine' as const, label: '운테' },
                    { key: 'compatibility' as const, label: '궁합' },
                    { key: 'adult' as const, label: '19금' },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleCategoryChange(f.key)}
                      className="flex items-center justify-center cursor-pointer"
                      style={{
                        height: '28px',
                        padding: '0 12px',
                        borderRadius: '9999px',
                        backgroundColor: selectedCategory === f.key ? '#48b2af' : '#f9f9f9',
                        border: selectedCategory === f.key ? 'none' : '1px solid #e7e7e7',
                        fontFamily: font,
                        fontSize: '12px',
                        fontWeight: selectedCategory === f.key ? 600 : 400,
                        color: selectedCategory === f.key ? '#ffffff' : '#6d6d6d',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label style={labelStyle}>아이디어</label>
                  <textarea
                    value={idea}
                    onChange={(e) => { setIdea(e.target.value); setError(''); }}
                    placeholder="예: 미래 남편 얼굴은?, 바람끼 테스트"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid #e7e7e7',
                      fontFamily: font,
                      fontSize: '15px',
                      fontWeight: 400,
                      lineHeight: '22px',
                      letterSpacing: '-0.45px',
                      color: '#151515',
                      resize: 'none',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />

                  {/* AI 아이디어 추천 */}
                  <div className="flex flex-col" style={{ gap: '8px', marginTop: '8px' }}>
                    <div className="flex items-center" style={{ gap: '6px' }}>
                      <p style={{
                        fontFamily: font, fontSize: '12px', fontWeight: 400,
                        lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484',
                      }}>
                        {aiIdeasLoading ? 'AI가 추천 중...' : 'AI 추천 아이디어'}
                      </p>
                      <button
                        onClick={() => fetchAiIdeas()}
                        disabled={aiIdeasLoading}
                        className="flex items-center justify-center cursor-pointer"
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '9999px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: 0,
                          color: '#848484',
                          transition: 'transform 0.3s',
                          transform: aiIdeasLoading ? 'rotate(360deg)' : 'none',
                          animation: aiIdeasLoading ? 'spin 1s linear infinite' : 'none',
                        }}
                        aria-label="새로운 추천 받기"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                      </button>
                      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '28px' }}>
                      {aiIdeasLoading && aiIdeas.length === 0 ? (
                        // 스켈레톤 3개
                        Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              height: '28px',
                              width: `${80 + i * 20}px`,
                              borderRadius: '9999px',
                              backgroundColor: '#f3f3f3',
                              animation: 'pulse 1.5s ease-in-out infinite',
                            }}
                          />
                        ))
                      ) : (
                        (aiIdeas.length > 0 ? aiIdeas.map((ai) => ai.title) : ['미래 남편 얼굴은?', '바람끼 테스트', '전생에 나는 뭐였을까']).map((ex) => (
                          <button
                            key={ex}
                            onClick={() => setIdea(ex)}
                            className="flex items-center justify-center cursor-pointer"
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              borderRadius: '9999px',
                              backgroundColor: aiIdeas.length > 0 ? '#f0f7ff' : '#f9f9f9',
                              border: `1px solid ${aiIdeas.length > 0 ? '#d0e3ff' : '#e7e7e7'}`,
                              fontFamily: font,
                              fontSize: '12px',
                              fontWeight: 400,
                              color: aiIdeas.length > 0 ? '#4a7fd4' : '#6d6d6d',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s',
                            }}
                          >
                            {ex}
                          </button>
                        ))
                      )}
                    </div>
                    <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
                  </div>
                </div>

                {/* 썸네일 레퍼런스 이미지 (마스터 전용) */}
                {isMaster && (
                  <div>
                    <label style={labelStyle}>썸네일 레퍼런스 이미지 (선택)</label>
                    <p style={{
                      fontFamily: font, fontSize: '12px', fontWeight: 400,
                      lineHeight: '18px', letterSpacing: '-0.24px', color: '#b7b7b7',
                      marginBottom: '8px',
                    }}>
                      첨부하면 이 이미지를 참고해서 썸네일을 생성해요
                    </p>

                    <input
                      ref={thumbnailFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                    />

                    {thumbRef.preview ? (
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '1px solid #e7e7e7',
                        }}
                      >
                        <img
                          src={thumbRef.preview}
                          alt="썸네일 레퍼런스"
                          style={{
                            width: '100%',
                            maxHeight: '240px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <button
                          onClick={handleRemoveThumbnailRef}
                          className="flex items-center justify-center cursor-pointer"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            color: '#ffffff',
                            fontFamily: font,
                            fontSize: '14px',
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                        <div
                          className="flex items-center"
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f9f9f9',
                            gap: '6px',
                          }}
                        >
                          <span style={{
                            fontFamily: font, fontSize: '12px', fontWeight: 400,
                            color: '#6d6d6d',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {thumbRef.fileName}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => thumbnailFileInputRef.current?.click()}
                        onDrop={handleThumbnailDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsThumbnailDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsThumbnailDragging(false); }}
                        className="w-full flex flex-col items-center justify-center cursor-pointer"
                        style={{
                          height: '120px',
                          borderRadius: '16px',
                          border: `1.5px dashed ${isThumbnailDragging ? '#48b2af' : '#d5d5d5'}`,
                          backgroundColor: isThumbnailDragging ? '#f0faf9' : '#fafafa',
                          gap: '8px',
                          transition: 'border-color 0.15s ease, background-color 0.15s ease',
                        }}
                        onPointerEnter={e => { if (!isThumbnailDragging) e.currentTarget.style.borderColor = '#48b2af'; }}
                        onPointerLeave={e => { if (!isThumbnailDragging) e.currentTarget.style.borderColor = '#d5d5d5'; }}
                      >
                        <span style={{ fontSize: '28px', lineHeight: 1 }}>🖼️</span>
                        <span style={{
                          fontFamily: font, fontSize: '13px', fontWeight: 400,
                          lineHeight: '18px', letterSpacing: '-0.26px', color: isThumbnailDragging ? '#48b2af' : '#848484',
                        }}>
                          {isThumbnailDragging ? '여기에 놓으세요' : '썸네일 레퍼런스 첨부'}
                        </span>
                        <span style={{
                          fontFamily: font, fontSize: '11px', fontWeight: 400,
                          color: '#b7b7b7',
                        }}>
                          JPG, PNG, WEBP · 최대 10MB
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* 레퍼런스 이미지 첨부 (마스터 전용) */}
                {isMaster && <div>
                  <label style={labelStyle}>결과 레퍼런스 이미지 (선택)</label>
                  <p style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    lineHeight: '18px', letterSpacing: '-0.24px', color: '#b7b7b7',
                    marginBottom: '8px',
                  }}>
                    첨부하면 이 이미지 스타일을 참고해서 결과 이미지를 생성해요
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {refImage.preview ? (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid #e7e7e7',
                      }}
                    >
                      <img
                        src={refImage.preview}
                        alt="레퍼런스 이미지"
                        style={{
                          width: '100%',
                          maxHeight: '240px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      {/* 삭제 버튼 */}
                      <button
                        onClick={handleRemoveImage}
                        className="flex items-center justify-center cursor-pointer"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          border: 'none',
                          color: '#ffffff',
                          fontFamily: font,
                          fontSize: '14px',
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                      {/* 파일명 */}
                      <div
                        className="flex items-center"
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9f9f9',
                          gap: '6px',
                        }}
                      >
                        <span style={{
                          fontFamily: font, fontSize: '12px', fontWeight: 400,
                          color: '#6d6d6d',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {refImage.fileName}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className="w-full flex flex-col items-center justify-center cursor-pointer"
                      style={{
                        height: '120px',
                        borderRadius: '16px',
                        border: `1.5px dashed ${isDragging ? '#48b2af' : '#d5d5d5'}`,
                        backgroundColor: isDragging ? '#f0faf9' : '#fafafa',
                        gap: '8px',
                        transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      }}
                      onPointerEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = '#48b2af'; }}
                      onPointerLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = '#d5d5d5'; }}
                    >
                      <span style={{ fontSize: '28px', lineHeight: 1 }}>🖼️</span>
                      <span style={{
                        fontFamily: font, fontSize: '13px', fontWeight: 400,
                        lineHeight: '18px', letterSpacing: '-0.26px', color: isDragging ? '#48b2af' : '#848484',
                      }}>
                        {isDragging ? '여기에 놓으세요' : '이미지를 첨부해주세요'}
                      </span>
                      <span style={{
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        color: '#b7b7b7',
                      }}>
                        JPG, PNG, WEBP · 최대 10MB
                      </span>
                    </button>
                  )}
                </div>}

                {error && (
                  <p style={{ fontFamily: font, fontSize: '12px', color: '#d4183d' }}>{error}</p>
                )}

                {/* CTA 56px */}
                <button
                  onClick={handleGenerate}
                  disabled={!isValid}
                  className="w-full flex items-center justify-center cursor-pointer"
                  style={{
                    height: '56px',
                    borderRadius: '16px',
                    backgroundColor: isValid ? '#48b2af' : '#f8f8f8',
                    border: 'none',
                    transition: 'all 0.15s ease',
                    marginTop: '8px',
                  }}
                  onPointerDown={e => { if (isValid) e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <span style={{
                    fontFamily: font, fontSize: '16px', fontWeight: 500,
                    lineHeight: '25px', letterSpacing: '-0.32px',
                    color: isValid ? '#ffffff' : '#b7b7b7',
                  }}>
                    AI로 만들기
                  </span>
                </button>
              </motion.div>
            )}

            {/* Step 2: 생성 중 */}
            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center"
                style={{ paddingTop: '120px', gap: '24px' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#E4F7F7' }}
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    style={{ fontSize: '32px' }}
                  >
                    🎰
                  </motion.span>
                </div>

                <div className="flex flex-col items-center" style={{ gap: '8px' }}>
                  <p style={{
                    fontFamily: font, fontSize: '18px', fontWeight: 600,
                    lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
                    textAlign: 'center',
                  }}>
                    테스트를 만들고 있어요
                  </p>
                  <p style={{
                    fontFamily: font, fontSize: '15px', fontWeight: 400,
                    lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
                    textAlign: 'center',
                  }}>
                    AI가 10가지 유형의 결과를 생성 중...
                  </p>
                </div>

                <div
                  className="overflow-hidden"
                  style={{ width: '200px', height: '4px', borderRadius: '2px', backgroundColor: '#f3f3f3' }}
                >
                  <motion.div
                    style={{ height: '100%', borderRadius: '2px', backgroundColor: '#48b2af' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 15, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: 검토 */}
            {step === 'review' && generated && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
                style={{ gap: '20px', paddingBottom: '80px' }}
              >
                <div>
                  <p style={{
                    fontFamily: font, fontSize: '22px', fontWeight: 600,
                    lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
                  }}>
                    테스트가 완성됐어요!
                  </p>
                  <p style={{
                    fontFamily: font, fontSize: '15px', fontWeight: 400,
                    lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
                    marginTop: '4px',
                  }}>
                    제목과 설명을 수정할 수 있어요
                  </p>
                </div>

                {/* 제목 수정 */}
                <div>
                  <label style={labelStyle}>제목</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={inputStyle}
                    maxLength={50}
                  />
                </div>

                {/* 설명 수정 */}
                <div>
                  <label style={labelStyle}>설명</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid #e7e7e7',
                      fontFamily: font,
                      fontSize: '15px',
                      fontWeight: 400,
                      lineHeight: '22px',
                      letterSpacing: '-0.45px',
                      color: '#151515',
                      resize: 'none',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                    maxLength={100}
                  />
                </div>

                {/* 유형 뱃지 */}
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <span style={{
                    backgroundColor: '#f0f8f8',
                    color: '#41a09e',
                    fontFamily: font,
                    fontSize: '10px',
                    fontWeight: 600,
                    lineHeight: '15px',
                    padding: '1px 4px',
                    borderRadius: '4px',
                  }}>
                    {generated.templateType === 'compatibility' ? '궁합' :
                     generated.templateType === 'adult' ? '19+' : '테스트'}
                  </span>
                  {generated.isAdult && (
                    <span style={{
                      backgroundColor: '#fff6f7',
                      color: '#ef6878',
                      fontFamily: font,
                      fontSize: '10px',
                      fontWeight: 600,
                      lineHeight: '15px',
                      padding: '1px 4px',
                      borderRadius: '4px',
                    }}>
                      성인
                    </span>
                  )}
                </div>

                {/* 다시 만들기 버튼들 */}
                <div className="flex" style={{ gap: '8px' }}>
                  <button
                    onClick={handleRegenerate}
                    className="flex-1 flex items-center justify-center cursor-pointer"
                    style={{
                      height: '40px',
                      borderRadius: '12px',
                      border: '1px solid #e7e7e7',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.15s ease',
                    }}
                    onPointerEnter={e => { e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                    onPointerLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    <span style={{
                      fontFamily: font, fontSize: '13px', fontWeight: 500,
                      lineHeight: '18px', letterSpacing: '-0.26px', color: '#6d6d6d',
                    }}>
                      기획 다시하기
                    </span>
                  </button>
                  <button
                    onClick={handleRegenerateImages}
                    disabled={imagesLoading}
                    className="flex-1 flex items-center justify-center cursor-pointer"
                    style={{
                      height: '40px',
                      borderRadius: '12px',
                      border: '1px solid #e7e7e7',
                      backgroundColor: '#ffffff',
                      opacity: imagesLoading ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    onPointerEnter={e => { if (!imagesLoading) e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                    onPointerLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    <span style={{
                      fontFamily: font, fontSize: '13px', fontWeight: 500,
                      lineHeight: '18px', letterSpacing: '-0.26px', color: '#6d6d6d',
                    }}>
                      {hasAnyImage ? '이미지 다시 만들기' : '이미지 만들기'}
                    </span>
                  </button>
                </div>

                {/* 썸네일 미리보기 */}
                <div style={{ marginBottom: '24px' }}>
                  <p style={{
                    fontFamily: font, fontSize: '16px', fontWeight: 600,
                    lineHeight: '22px', letterSpacing: '-0.32px', color: '#151515',
                    marginBottom: '12px',
                  }}>
                    썸네일
                  </p>
                  <div style={{ position: 'relative', width: '160px' }}>
                    <div
                      style={{
                        width: '160px',
                        aspectRatio: '1/1',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e7e7e7',
                      }}
                    >
                      {generated.thumbnailUrl ? (
                        <img
                          src={generated.thumbnailUrl}
                          alt="썸네일"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center" style={{ width: '100%', height: '100%', gap: '4px' }}>
                          <span style={{ fontSize: '24px' }}>🎨</span>
                          <span style={{
                            fontFamily: font, fontSize: '12px', fontWeight: 400, color: '#848484',
                          }}>
                            {thumbnailRegenerating || imagesLoading ? '생성 중...' : '썸네일 없음'}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* 썸네일 재생성 버튼 */}
                    {generated.thumbnailUrl && !thumbnailRegenerating && (
                      <button
                        onClick={handleRegenerateThumbnail}
                        title="썸네일 다시 만들기"
                        className="flex items-center justify-center"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#fff',
                          fontSize: '16px',
                        }}
                      >
                        ↻
                      </button>
                    )}
                  </div>
                </div>

                {/* 10개 결과 미리보기 */}
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                    <p style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 600,
                      lineHeight: '22px', letterSpacing: '-0.32px', color: '#151515',
                    }}>
                      10가지 유형 결과
                    </p>
                    {imagesLoading && (
                      <span style={{
                        fontFamily: font, fontSize: '12px', fontWeight: 400, color: '#848484',
                      }}>
                        이미지 생성 중...
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col" style={{ gap: '8px' }}>
                    {generated.results.map((r) => (
                      <div
                        key={resultKey(r)}
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e7e7e7',
                        }}
                      >
                        {/* 결과 이미지 */}
                        {regeneratingDayMasters.has(resultKey(r)) ? (
                          <div
                            className="flex flex-col items-center justify-center"
                            style={{
                              marginBottom: '12px',
                              borderRadius: '12px',
                              aspectRatio: '3/4',
                              backgroundColor: '#f9f9f9',
                              gap: '8px',
                            }}
                          >
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                              style={{ fontSize: '24px' }}
                            >
                              🎨
                            </motion.span>
                            <span style={{
                              fontFamily: font, fontSize: '12px', fontWeight: 400, color: '#848484',
                            }}>
                              이미지 생성 중...
                            </span>
                          </div>
                        ) : r.result_image_url ? (
                          <div style={{ position: 'relative', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}>
                            <img
                              src={r.result_image_url}
                              alt={r.result_title}
                              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                            />
                            <button
                              onClick={() => handleRegenerateSingleImage(resultKey(r))}
                              className="flex items-center justify-center cursor-pointer"
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.45)',
                                border: 'none',
                                color: '#ffffff',
                                fontFamily: font,
                                fontSize: '16px',
                                lineHeight: 1,
                              }}
                              title="이미지 다시 만들기"
                            >
                              ↻
                            </button>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                          <div className="flex items-center" style={{ gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{getEmoji(r)}</span>
                            <span style={{
                              fontFamily: font, fontSize: '14px', fontWeight: 600,
                              lineHeight: '20px', letterSpacing: '-0.42px', color: '#151515',
                            }}>
                              {r.result_title}
                            </span>
                          </div>
                          <span style={{
                            backgroundColor: r.score >= 70 ? '#E4F7F7' : r.score >= 40 ? '#FFF8E1' : '#fff6f7',
                            color: r.score >= 70 ? '#41a09e' : r.score >= 40 ? '#f5a623' : '#ef6878',
                            fontFamily: font,
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                          }}>
                            {r.result_label || (generated.resultFormat === 'grade' ? scoreToGrade(r.score) : generated.resultFormat === 'percentage' ? `${r.score}%` : generated.resultFormat === 'type' ? '???' : `${r.score}점`)}
                          </span>
                        </div>
                        <p style={{
                          fontFamily: font, fontSize: '13px', fontWeight: 400,
                          lineHeight: '20px', letterSpacing: '-0.26px', color: '#6d6d6d',
                        }}>
                          {r.result_description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p style={{ fontFamily: font, fontSize: '12px', color: '#d4183d' }}>{error}</p>}

                {/* 게시 버튼 — 하단 고정 */}
                <div
                  className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px]"
                  style={{ padding: '12px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #f3f3f3' }}
                >
                  <button
                    onClick={handlePublish}
                    className="w-full flex items-center justify-center cursor-pointer"
                    style={{
                      height: '56px',
                      borderRadius: '16px',
                      backgroundColor: '#48b2af',
                      border: 'none',
                      transition: 'transform 0.1s ease',
                    }}
                    onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                    onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                    onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                  >
                    <span style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 500,
                      lineHeight: '25px', letterSpacing: '-0.32px', color: '#ffffff',
                    }}>
                      게시하기
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: 게시 중 */}
            {step === 'publishing' && (
              <motion.div
                key="publishing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center"
                style={{ paddingTop: '120px', gap: '24px' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#E4F7F7' }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{ fontSize: '32px' }}
                  >
                    🚀
                  </motion.span>
                </div>
                <p style={{
                  fontFamily: font, fontSize: '18px', fontWeight: 600,
                  lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
                }}>
                  게시하는 중...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default UnteCreatePage;
