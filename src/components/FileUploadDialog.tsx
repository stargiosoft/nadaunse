import React, { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FileUploadDialog({ isOpen, onClose, onSuccess }: FileUploadDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<'paid' | 'free'>('paid');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사용자 ID 가져오기
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        console.log('✅ 사용자 ID 로드됨:', user.id);
      }
    };
    if (isOpen) {
      fetchUserId();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 형식 검증
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('파일 업로드에 실패했어요');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 업로드에 실패했어요');
      return;
    }

    setUploadedFile(file);
  };

  const handleFileChange = () => {
    fileInputRef.current?.click();
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragCounter(prev => prev + 1);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // 파일 형식 검증
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('파일 업로드에 실패했어요');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 업로드에 실패했어요');
      return;
    }

    setUploadedFile(file);
  };

  const parseExcelData = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsBinaryString(file);
    });
  };

  const validateAndProcessData = (data: any[], type: 'paid' | 'free') => {
    const processedContents: any[] = [];

    data.forEach((row, index) => {
      // 빈 행 스킵
      if (!row['대분류'] && !row['중분류'] && !row['콘텐츠 제목']) {
        return;
      }

      // 🔍 첫 번째 행의 모든 키 출력 (디버깅용)
      if (index === 0) {
        console.log('📋 엑셀 파일의 컬럼명 목록:');
        Object.keys(row).forEach(key => {
          console.log(`   - "${key}"`);
        });
      }

      // 필수 컬럼 체크
      if (!row['대분류'] || !row['중분류'] || !row['콘텐츠 제목'] || !row['콘텐츠 소개글']) {
        throw new Error(`필수 항목이 누락된 행이 있습니다. (행 번호: ${index + 2})`);
      }

      // 최소 1개 질문 체크
      if (!row['콘텐츠 질문지 1'] || !row['콘텐츠 질문지 1'].toString().trim()) {
        throw new Error(`콘텐츠 질문지가 누락되었습니다. (행 번호: ${index + 2})`);
      }

      const questions: { text: string; type: 'saju' | 'tarot'; order: number }[] = [];

      if (type === 'paid') {
        // 유료 콘텐츠: 최대 10개 질문, 풀이방식 체크
        for (let i = 1; i <= 10; i++) {
          const questionText = row[`콘텐츠 질문지 ${i}`];
          
          // ✅ 여러 패턴으로 풀이방식 컬럼 찾기
          let questionTypeRaw = 
            row[`풀이방식${i}`] ||           // "풀이방식1", "풀이방식2" (공백 없음)
            row[`풀이방식 ${i}`] ||          // "풀이방식 1", "풀이방식 2" (공백 있음)
            row[`해석방식${i}`] ||           // "해석방식1", "해석방식2" (공백 없음)
            row[`해석방식 ${i}`] ||          // "해석방식 1", "해석방식 2" (공백 있음)
            undefined;

          if (questionText && questionText.toString().trim()) {
            // 기본값: saju
            let questionType: 'saju' | 'tarot' = 'saju';

            // 풀이방식이 입력되어 있으면 타로/사주 판단
            if (questionTypeRaw && questionTypeRaw.toString().trim()) {
              const typeValue = questionTypeRaw.toString().toLowerCase().trim();
              
              console.log(`🔍 [질문 ${i}] 원본 풀이방식:`, questionTypeRaw);
              console.log(`🔍 [질문 ${i}] 소문자 변환:`, typeValue);
              
              // ✅ 타로 인식: 'tarot', 'taro', '타로'
              if (typeValue === 'tarot' || typeValue === 'taro' || typeValue === '타로') {
                questionType = 'tarot';
                console.log(`✅ [질문 ${i}] 타로로 인식됨`);
              }
              // ✅ 사주 인식: 'saju', 'sa-ju', '사주' (명시적으로 확인)
              else if (typeValue === 'saju' || typeValue === 'sa-ju' || typeValue === '사주') {
                questionType = 'saju';
                console.log(`✅ [질문 ${i}] 사주로 인식됨`);
              } else {
                console.log(`⚠️ [질문 ${i}] 알 수 없는 값, 기본값(saju) 사용: "${typeValue}"`);
              }
              // 그 외 모든 값은 기본값 'saju' 유지
            } else {
              console.log(`ℹ️ [질문 ${i}] 풀이방식 미입력, 기본값(saju) 사용`);
            }

            questions.push({
              text: questionText.toString().trim(),
              type: questionType,
              order: i
            });
            
            console.log(`📝 [질문 ${i}] 최종 저장:`, { text: questionText.toString().trim(), type: questionType, order: i });
          }
        }

        processedContents.push({
          content_type: type,
          category_main: row['대분류'].toString().trim(),
          category_sub: row['중분류'].toString().trim(),
          title: row['콘텐츠 제목'].toString().trim(),
          questioner_info: row['질문자 정보']?.toString().trim() || '',
          description: row['콘텐츠 소개글'].toString().trim(),
          user_concern: row['사용자 고민글']?.toString().trim() || '',
          questions
        });
      } else {
        // 무료 콘텐츠: 최대 3개 질문, 모두 saju
        for (let i = 1; i <= 3; i++) {
          const questionText = row[`콘텐츠 질문지 ${i}`];

          if (questionText && questionText.toString().trim()) {
            questions.push({
              text: questionText.toString().trim(),
              type: 'saju',
              order: i
            });
          }
        }

        processedContents.push({
          content_type: type,
          category_main: row['대분류'].toString().trim(),
          category_sub: row['중분류'].toString().trim(),
          title: row['콘텐츠 제목'].toString().trim(),
          description: row['콘텐츠 소개글'].toString().trim(),
          questions
        });
      }
    });

    // 최대 100개 행 제한
    if (processedContents.length > 100) {
      throw new Error('한 번에 최대 100개까지만 처리 가능합니다.');
    }

    return processedContents;
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsLoading(true);
    
    console.log('🚀 파일 업로드 시작');
    console.log('📁 파일명:', uploadedFile.name);
    console.log('📦 콘텐츠 타입:', contentType);

    try {
      // 1. 엑셀 파���
      console.log('📊 1단계: 엑셀 파일 파싱 중...');
      const rawData = await parseExcelData(uploadedFile);
      console.log('✅ 엑셀 파싱 완료:', rawData.length, '행');
      
      // 2. 데이터 검증 및 가공
      console.log('🔍 2단계: 데이터 검증 중...');
      const processedContents = validateAndProcessData(rawData, contentType);
      console.log('✅ 데이터 검증 완료:', processedContents.length, '개 콘텐츠');

      // 3. DB 저장 (트랜잭션)
      console.log('💾 3단계: Edge Function을 통한 콘텐츠 생성 시작');
      const contentIds: string[] = [];
      
      for (const content of processedContents) {
        // 카테고리별 자동 가격 설정
        const getPriceByCategory = (categoryMain: string, categorySub: string) => {
          // 고가 카테고리: 연애, 이별, 궁합, 건강(성건강만) -> 29,800원 / 12,900원 (57% 할인)
          const isHighPrice = 
            ['연애', '이별', '궁합'].includes(categoryMain) ||
            (categoryMain === '건강' && categorySub === '성(성) 건강');
          
          if (isHighPrice) {
            return {
              priceOriginal: 29800,
              priceDiscount: 12900,
              discountRate: 57
            };
          }
          
          // 일반 카테고리 -> 19,800원 / 9,900원 (50% 할인)
          return {
            priceOriginal: 19800,
            priceDiscount: 9900,
            discountRate: 50
          };
        };

        const { priceOriginal, priceDiscount, discountRate } = getPriceByCategory(
          content.category_main,
          content.category_sub
        );

        // 🔐 현재 세션의 JWT 토큰 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        }

        // Edge Function을 통해 master_contents 저장
        const { data: newContent, error: contentError } = await supabase.functions.invoke('master-content', {
          body: {
            action: 'create',
            content_data: {
              content_type: contentType,
              category_main: content.category_main,
              category_sub: content.category_sub,
              title: content.title,
              questioner_info: content.questioner_info || null,
              description: content.description,
              user_concern: content.user_concern || null,
              price_original: contentType === 'free' ? 0 : priceOriginal,
              price_discount: contentType === 'free' ? 0 : priceDiscount,
              discount_rate: contentType === 'free' ? 0 : discountRate,
              status: 'loading',
              weekly_clicks: 0,
              view_count: 0
            },
            questions: content.questions.map((q: any) => ({
              question_order: q.order,
              question_text: q.text,
              question_type: q.type
            }))
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (contentError) {
          console.error('Content creation error:', contentError);
          throw new Error(`콘텐츠 생성 실패: ${contentError.message || '알 수 없는 오류'}`);
        }

        if (!newContent?.content?.id) {
          throw new Error('콘텐츠 ID를 받아오지 못했습니다.');
        }

        contentIds.push(newContent.content.id);
      }

      // 4. 백그라운드 AI 생성 API 호출 (각 콘텐츠마다)
      console.log('🎨 백그라운드 AI 생성 시작:', contentIds.length, '개');
      console.log('📋 콘텐츠 ID 목록:', contentIds);
      console.log('📋 contentIds 타입:', typeof contentIds);
      console.log('📋 contentIds.length:', contentIds.length);
      
      // 🔐 현재 세션 토큰 가져오기 (AI 생성용)
      const { data: { session: aiSession } } = await supabase.auth.getSession();
      if (!aiSession) {
        throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      // ✅ 백그라운드에서 배치 처리 (await 없음 - fire-and-forget)
      (async () => {
        console.log('🔥 IIFE 실행 시작!');
        console.log('🔥 IIFE 내부 contentIds.length:', contentIds.length);
        
        const BATCH_SIZE = 2; // 3개 → 2개로 줄여서 타임아웃 방지
        const BATCH_DELAY = 5000; // 3초 → 5초로 늘려서 서버 휴식 시간 증가
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📦 배치 처리 시작 (총 ${Math.ceil(contentIds.length / BATCH_SIZE)}개 배치)`);
        console.log(`   총 콘텐츠: ${contentIds.length}개`);
        console.log(`   배치 크기: ${BATCH_SIZE}개`);
        console.log(`   배치 간격: ${BATCH_DELAY / 1000}초`);
        console.log(`${'='.repeat(60)}\n`);
        
        console.log('🔍 for 루프 시작 조건 체크:');
        console.log('   i < contentIds.length:', 0, '<', contentIds.length, '=', 0 < contentIds.length);
        
        for (let i = 0; i < contentIds.length; i += BATCH_SIZE) {
          console.log(`\n🔁 for 루프 반복 시작: i = ${i}`);
          
          const batch = contentIds.slice(i, i + BATCH_SIZE);
          console.log('🎯 배치 생성 완료:', batch);
          console.log('🎯 배치 길이:', batch.length);
          
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(contentIds.length / BATCH_SIZE);
          
          console.log(`\n🚀 ${'━'.repeat(50)}`);
          console.log(`   배치 ${batchNumber}/${totalBatches} 시작`);
          console.log(`   처리할 ID: ${batch.length}개`);
          console.log(`   ${batch.map(id => id.substring(0, 8) + '...').join(', ')}`);
          console.log(`${'━'.repeat(50)}`);
          
          console.log('🔄 batch.map 실행 전...');
          
          // ✅ 배치 내에서 병렬 실행하되, 모두 완료될 때까지 대기
          const batchPromises = batch.map((contentId, index) => {
            const displayIndex = i + index + 1;
            console.log(`   [${displayIndex}/${contentIds.length}] Edge Function 호출 시작: ${contentId.substring(0, 8)}...`);
            
            return supabase.functions.invoke('generate-master-content', {
              body: { contentId },
              headers: {
                Authorization: `Bearer ${aiSession.access_token}`,
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error(`   ❌ [${displayIndex}/${contentIds.length}] AI 생성 실패: ${contentId.substring(0, 8)}...`);
                console.error('      에러:', error);
                return { success: false, contentId, error };
              } else {
                console.log(`   ✅ [${displayIndex}/${contentIds.length}] AI 생성 요청 성공: ${contentId.substring(0, 8)}...`);
                return { success: true, contentId, data };
              }
            }).catch(error => {
              console.error(`   ❌ [${displayIndex}/${contentIds.length}] API 호출 실패: ${contentId.substring(0, 8)}...`);
              console.error('      Catch 에러:', error);
              return { success: false, contentId, error };
            });
          });
          
          console.log('✅ batch.map 실행 완료, Promise 개수:', batchPromises.length);
          
          // ✅ 배치 내 모든 요청이 완료될 때까지 대기
          const batchResults = await Promise.all(batchPromises);
          const successCount = batchResults.filter(r => r.success).length;
          const failCount = batchResults.filter(r => !r.success).length;
          
          console.log(`\n📊 배치 ${batchNumber}/${totalBatches} 완료`);
          console.log(`   성공: ${successCount}개 | 실패: ${failCount}개`);
          
          // 🔄 실패한 항목 재시도 (1회만)
          if (failCount > 0) {
            console.log(`\n♻️ 실패한 ${failCount}개 항목 재시도...`);
            const failedIds = batchResults.filter(r => !r.success).map(r => r.contentId);
            
            const retryPromises = failedIds.map((contentId, index) => {
              const displayIndex = i + batch.indexOf(contentId) + 1;
              console.log(`   🔄 [${displayIndex}/${contentIds.length}] 재시도: ${contentId.substring(0, 8)}...`);
              
              return supabase.functions.invoke('generate-master-content', {
                body: { contentId },
                headers: {
                  Authorization: `Bearer ${aiSession.access_token}`,
                }
              }).then(({ data, error }) => {
                if (error) {
                  console.error(`   ❌ [${displayIndex}/${contentIds.length}] 재시도 실패: ${contentId.substring(0, 8)}...`);
                  return { success: false, contentId, error };
                } else {
                  console.log(`   ✅ [${displayIndex}/${contentIds.length}] 재시도 성공: ${contentId.substring(0, 8)}...`);
                  return { success: true, contentId, data };
                }
              }).catch(error => {
                console.error(`   ❌ [${displayIndex}/${contentIds.length}] 재시도 실패: ${contentId.substring(0, 8)}...`);
                return { success: false, contentId, error };
              });
            });
            
            const retryResults = await Promise.all(retryPromises);
            const retrySuccessCount = retryResults.filter(r => r.success).length;
            console.log(`   재시도 결과: ${retrySuccessCount}/${failCount}개 성공`);
          }
          
          // 다음 배치 전 대기 (마지막 배치는 제외)
          if (i + BATCH_SIZE < contentIds.length) {
            console.log(`   ⏳ 다음 배치까지 ${BATCH_DELAY / 1000}초 대기...\n`);
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ 모든 배치 처리 완료!`);
        console.log(`   총 ${contentIds.length}개 콘텐츠 AI 생성 요청 완료`);
        console.log(`   → 리스트 화면에서 실시간 상태를 확인하세요.`);
        console.log(`${'='.repeat(60)}\n`);
      })(); // 즉시 실행 함수로 백그라운드 처리

      // 5. 즉시 성공 처리 (AI 생성 대기 없음)
      setIsLoading(false);
      toast.success('등록에 성공했어요');
      setTimeout(() => {
        onSuccess();
        onClose();
        setUploadedFile(null);
        setContentType('paid');
      }, 800);

    } catch (error: any) {
      console.error('Upload error:', error);
      setIsLoading(false);
      toast.error(error.message || '등록에 실패했어요');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
        {/* Dialog */}
        <div 
          className="bg-white rounded-[16px] w-[340px] relative shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[#f0f0f0]">
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[18px] text-[#1b1b1b]">
              파일 업로드
            </p>
            <button onClick={onClose} className="p-[4px]">
              <X className="size-[20px] text-[#848484]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-[20px] py-[24px]">
            {/* 안내 문구 */}
            <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#5f5f5f] mb-[20px]">
              파일은 1개만 업로드 가능합니다. CSV 또는 XLSX 파일을 업로드 해주세요
            </p>

            {/* 파일 선택 영역 */}
            {!uploadedFile ? (
              <div 
                className={`border-2 border-dashed rounded-[12px] p-[32px] flex flex-col items-center justify-center mb-[20px] transition-colors ${
                  isDragging 
                    ? 'border-[#48b2af] bg-[#e4f7f7]' 
                    : 'border-[#d0d0d0] bg-white'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className={`size-[40px] mb-[12px] transition-colors ${
                  isDragging ? 'text-[#48b2af]' : 'text-[#d0d0d0]'
                }`} />
                <p className={`font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-center mb-[16px] transition-colors ${
                  isDragging ? 'text-[#48b2af]' : 'text-[#848484]'
                }`}>
                  {isDragging 
                    ? '파일을 여기에 놓으세요' 
                    : <>파일을 1개만 업로드 가능합니다<br/>CSV 또는 XLSX 파일을 업로드 해주세요</>
                  }
                </p>
                {!isDragging && (
                  <button
                    onClick={handleFileChange}
                    className="bg-[#48b2af] text-white px-[24px] py-[10px] rounded-[8px] font-['Pretendard_Variable:SemiBold',sans-serif] text-[14px]"
                  >
                    파일 선택
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="mb-[20px]">
                {/* 업로드된 파일명 */}
                <div className="bg-[#f9f9f9] rounded-[8px] p-[16px] mb-[12px]">
                  <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] mb-[8px]">
                    {uploadedFile.name}
                  </p>
                  <button
                    onClick={handleFileChange}
                    className="text-[#48b2af] font-['Pretendard_Variable:SemiBold',sans-serif] text-[12px]"
                  >
                    변경
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* 콘텐츠 ���형 선택 */}
                <div className="mb-[24px]">
                  <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[14px] text-[#1b1b1b] mb-[12px]">
                    콘텐츠 유형
                  </p>
                  <div className="flex gap-[16px]">
                    <label className="flex items-center gap-[8px] cursor-pointer">
                      <input
                        type="radio"
                        name="contentType"
                        value="paid"
                        checked={contentType === 'paid'}
                        onChange={() => setContentType('paid')}
                        className="w-[18px] h-[18px] accent-[#48b2af]"
                      />
                      <span className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b]">
                        유료
                      </span>
                    </label>
                    <label className="flex items-center gap-[8px] cursor-pointer">
                      <input
                        type="radio"
                        name="contentType"
                        value="free"
                        checked={contentType === 'free'}
                        onChange={() => setContentType('free')}
                        className="w-[18px] h-[18px] accent-[#48b2af]"
                      />
                      <span className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b]">
                        무료
                      </span>
                    </label>
                  </div>
                </div>

                {/* 로딩 상태 또는 등록 버튼 */}
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-[32px]">
                    <div className="animate-spin rounded-full h-[40px] w-[40px] border-b-2 border-[#48b2af] mb-[12px]"></div>
                    <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#848484]">
                      콘텐츠 등록 중이에요
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleUpload}
                    className="w-full bg-[#48b2af] text-white py-[14px] rounded-[8px] font-['Pretendard_Variable:SemiBold',sans-serif] text-[16px]"
                  >
                    콘텐츠 등록하기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}