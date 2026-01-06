import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, ChevronLeft } from 'lucide-react';
import { supabase, testConnection } from '../lib/supabase';
import { getThumbnailUrl } from '../lib/image';
import { useNavigate } from 'react-router-dom';
import FileUploadDialog from './FileUploadDialog';
import ArrowLeft from './ArrowLeft';
import CheckboxIcon from './CheckboxIcon';
import { toast } from '../lib/toast';
import { SessionExpiredDialog } from './SessionExpiredDialog';

// 🔧 Build v1.2.6 - Router alias fix

// 캐시 설정
const CACHE_KEY = 'master_contents_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

interface MasterContent {
  id: string;
  content_type: 'free' | 'paid';
  title: string;
  status: 'loading' | 'failed' | 'ready' | 'deployed';
  created_at: string;
  thumbnail_url: string | null;
}

// 체크박스 컴포넌트
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative rounded-[2px] shrink-0 size-[18px] cursor-pointer ${
        checked ? 'bg-[#48b2af] border-2 border-[#48b2af]' : 'border-2 border-[#626262]'
      }`}
    >
      {checked && (
        <div className="absolute h-[7px] left-[4px] top-[5px] w-[11px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 9">
            <path d="M1 4.5L4.5 8L12 0.5" stroke="#EFF5FE" strokeWidth="1.8" />
          </svg>
        </div>
      )}
    </div>
  );
}

// 확인 다이얼로그 컴포넌트
function ConfirmDialog({ 
  message, 
  onConfirm, 
  onCancel 
}: { 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[16px] p-[24px] max-w-[320px] mx-[20px]">
        <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[16px] text-[#1b1b1b] text-center mb-[24px]">
          {message}
        </p>
        <div className="flex gap-[12px]">
          <button
            onClick={onCancel}
            className="flex-1 h-[44px] rounded-[8px] border border-[#e0e0e0] font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b]"
          >
            아니요
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-[44px] rounded-[8px] bg-[#48b2af] font-['Pretendard_Variable:SemiBold',sans-serif] text-[14px] text-white"
          >
            예
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentItem({ 
  content, 
  onClick, 
  isDeployMode, 
  isSelected, 
  onToggleSelect 
}: { 
  content: MasterContent; 
  onClick: () => void;
  isDeployMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const getStatusText = (status: MasterContent['status']) => {
    switch (status) {
      case 'loading': return '로딩중';
      case 'failed': return '실패';
      case 'ready': return '배포전';
      case 'deployed': return '배포완료';
      default: return '';
    }
  };

  const getTypeText = (type: MasterContent['content_type']) => {
    return type === 'paid' ? '유료' : '무료';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  return (
    <div 
      onClick={isDeployMode ? onToggleSelect : onClick}
      className={`bg-[#f0f8f8] h-[109px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:bg-[#e6f3f3] transition-colors`}
    >
      {/* 체크박스 (배포모드일 때만) - 왼쪽 배치 */}
      {isDeployMode && (
        <div 
          className="absolute left-[16px] top-1/2 -translate-y-1/2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          <CheckboxIcon checked={isSelected} size={24} />
        </div>
      )}
      
      {/* 썸네일 영역 - 배포모드일 때 오른쪽으로 이동 */}
      <div 
        className={`absolute top-[16px] w-[115px] h-[77px] bg-white rounded-[8px] overflow-hidden ${
          isDeployMode ? 'left-[56px]' : 'left-[13px]'
        }`}
      >
        {content.thumbnail_url ? (
          <img 
            src={content.thumbnail_url} 
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white" />
        )}
      </div>

      {/* 텍스트 영역 - 배포모드일 때 오른쪽으로 이동 */}
      <div 
        className={`absolute top-[16px] right-[40px] ${
          isDeployMode ? 'left-[184px]' : 'left-[141px]'
        }`}
      >
        <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[11px] text-[#808080] mb-[4px] leading-[13.75px]">
          [{getTypeText(content.content_type)}] {formatDate(content.created_at)}
        </p>
        <p className="font-['Pretendard_Variable:Bold',sans-serif] text-[15px] text-[#1b1b1b] leading-[18.75px] mb-[8px] line-clamp-1">
          {content.title}
        </p>
        {/* 상태 태그 */}
        <div className="inline-block bg-[#f0f0f0] px-[10px] py-[5px] rounded-[8px]">
          <p className="font-['Pretendard:Regular',sans-serif] text-[14px] text-black leading-[normal] not-italic whitespace-nowrap">
            {getStatusText(content.status)}
          </p>
        </div>
      </div>

      {/* 화살표 - 배포모드가 아닐 때만 */}
      {!isDeployMode && (
        <div className="absolute right-[15px] top-1/2 -translate-y-1/2 shrink-0 rotate-180">
          <ChevronLeft className="size-[14px] text-[#1b1b1b]" />
        </div>
      )}
    </div>
  );
}

interface MasterContentListProps {
  onBack: () => void;
  onNavigateHome: () => void;
}

export default function MasterContentList({ onBack, onNavigateHome }: MasterContentListProps) {
  const navigate = useNavigate();
  const [contents, setContents] = useState<MasterContent[]>([]);
  const [isDeployMode, setIsDeployMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'free'>('all');
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // 무한 스크롤 감지용 ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // 세션 체크
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSessionExpired(true);
      }
    };
    checkSession();
  }, []);

  // 사용자 ID 가져오기
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // 캐시가 유효한 경우 (5분 이내)
        if (now - timestamp < CACHE_EXPIRY) {
          console.log('✅ 캐시에서 데이터 로드 (마스터 콘텐츠 리스트)');
          setContents(data as MasterContent[]);
          return true;
        } else {
          console.log('⏰ 캐시 만료됨 (마스터 콘텐츠 리스트)');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패');
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, []);

  // 콘텐츠 로드
  useEffect(() => {
    const fetchContents = async () => {
      // 🔍 먼저 DB 연결 테스트
      console.log('🔍 DB 연결 테스트 시작...');
      const isConnected = await testConnection();
      
      if (!isConnected) {
        console.error('❌ DB 연결 실패 - Supabase 설정을 확인하세요');
        setContents([]);
        setHasMore(false);
        return;
      }

      // 🚀 먼저 캐시에서 로드 (전체 필터일 때만)
      // ❌ 캐시 비활성화: 로딩중 상태가 실시간으로 보이도록
      const hasCache = false; // filter === 'all' ? loadFromCache() : false;

      // 🔄 타임아웃 설정 (20초로 증가)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        // 🎯 쿼리 빌더 시작
        let query = supabase
          .from('master_contents')
          .select('id, content_type, title, status, created_at, thumbnail_url', { count: 'exact' });
        
        // 🔍 타입 필터 적용 (종합/심화 해석판/무료 체험판)
        if (filter === 'paid') {
          query = query.eq('content_type', 'paid');
        } else if (filter === 'free') {
          query = query.eq('content_type', 'free');
        }
        
        // 정렬 및 범위 설정
        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(0, 19) // 🎯 처음 20개만 로드
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        if (error) {
          throw error;
        }

        if (data) {
          // ✅ DB가 비어있으면 캐시 삭제하고 빈 배열 설정
          if (data.length === 0) {
            console.log('⚠️ 필터링 결과가 비어있습니다.');
            if (!hasCache) {
              setContents([]);
            }
            setHasMore(false);
            return;
          }

          // 🐛 디버깅: 실제 DB 데이터 확인
          console.log('🐛 [DEBUG] DB에서 가져온 원본 데이터:', data);
          data.forEach((item: any, index: number) => {
            console.log(`🐛 [${index}] ID: ${item.id}, Status: ${item.status}, Thumbnail: ${item.thumbnail_url ? '있음' : '없음'}`);
          });

          // Supabase 데이터를 Content 형식으로 변환
          const formattedContents: MasterContent[] = data.map((item: any) => ({
            id: item.id,
            content_type: item.content_type as 'free' | 'paid',
            title: item.title,
            status: item.status, // ✅ 폴백 제거: DB 값을 그대로 사용
            created_at: new Date(item.created_at).toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).replace(/\. /g, '.').replace(/\.$/, '').replace(', ', ' '),
            // 🎨 썸네일 최적화 (리스트용)
            thumbnail_url: getThumbnailUrl(item.thumbnail_url, 'list'),
          }));
          
          // 💾 캐시에 저장 (전체 필터일 때만)
          if (filter === 'all') {
            try {
              const cacheData = JSON.stringify({
                data: formattedContents,
                timestamp: Date.now()
              });
              localStorage.setItem(CACHE_KEY, cacheData);
            } catch (err) {
              console.warn('캐시 저장 실패:', err);
            }
          }
          
          setContents(formattedContents);
          setHasMore(count ? count > 20 : false);
          setIsInitialLoading(false); // 🔥 초기 로드 완료
          console.log(`✅ 콘텐츠 로드 성공 (${formattedContents.length}개, 전체: ${count}개, 필터: ${filter})`);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          console.warn('⏱️ 요청 타임아웃 - 캐시 데이터 사용 중');
        } else {
          console.warn('⚠️ 콘텐츠 로드 실패:', error.message || error);
        }
        
        // 캐시가 없으면 빈 배열로 초기화 (항상 UI 표시)
        if (!hasCache) {
          console.log('📭 캐시 없음 -  화면 표시');
          setContents([]);
          setHasMore(false);
        }
      }
    };

    fetchContents();
  }, [loadFromCache, filter]); // ✅ saveToCache 의존성 제거

  // 콘텐츠 수동 새로고침 함수
  const fetchContents = useCallback(async () => {
    const { data, error } = await supabase
      .from('master_contents')
      .select('id, content_type, title, status, created_at, thumbnail_url')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('콘텐츠 로드 실패:', error);
    } else if (data) {
      const formattedContents: MasterContent[] = data.map((item: any) => ({
        id: item.id,
        content_type: item.content_type as 'free' | 'paid',
        title: item.title,
        status: item.status, // ✅ 폴백 제거: DB 값을 그대로 사용
        created_at: new Date(item.created_at).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).replace(/\. /g, '.').replace(/\.$/, '').replace(', ', ' '),
        thumbnail_url: item.thumbnail_url || null,
      }));
      
      // 💾 캐시 저장
      try {
        const cacheData = JSON.stringify({
          data: formattedContents,
          timestamp: Date.now()
        });
        localStorage.setItem(CACHE_KEY, cacheData);
      } catch (err) {
        console.warn('캐시 저장 실패:', err);
      }
      
      setContents(formattedContents);
    }
  }, []); // ✅ 의존성 배열 비우기: saveToCache 제거

  // 📡 Realtime 구독: 콘텐츠 상태 변경 실시간 감지
  useEffect(() => {
    console.log('🔔 Realtime 구독 시작: master_contents');

    let channel: any = null;

    try {
      channel = supabase
        .channel('master-contents-changes', {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE 모두 감지
            schema: 'public',
            table: 'master_contents',
          },
          (payload) => {
            console.log('📡 콘텐츠 변경 감지:', payload);
            
            // 🎯 상태 추적 로그 추가
            if (payload.eventType === 'UPDATE') {
              const oldData = payload.old as any;
              const newData = payload.new as any;
              
              if (oldData?.status !== newData?.status) {
                console.log(`🔄 [상태 변경] ID: ${newData.id.substring(0, 8)}... | ${oldData.status} → ${newData.status}`);
                console.log(`   제목: ${newData.title}`);
                console.log(`   썸네일: ${newData.thumbnail_url ? '✅ 생성됨' : '❌ 없음'}`);
              }
            } else if (payload.eventType === 'INSERT') {
              const newData = payload.new as any;
              console.log(`✨ [새 콘텐츠] ID: ${newData.id.substring(0, 8)}... | ${newData.title} | 상태: ${newData.status}`);
            }

            // 🗑️ 캐시 무효화
            try {
              localStorage.removeItem(CACHE_KEY);
              console.log('🗑️ 캐시 무효화됨 (마스터 콘텐츠 리스트)');
            } catch (err) {
              console.warn('캐시 무효화 실패:', err);
            }

            if (payload.eventType === 'INSERT') {
              // 새 콘텐츠 추가
              const newContent = payload.new as any;
              const formattedContent: MasterContent = {
                id: newContent.id,
                content_type: newContent.content_type as 'free' | 'paid',
                title: newContent.title,
                status: newContent.status, // ❌ 폴백 제거: DB 값을 그대로 사용
                created_at: new Date(newContent.created_at).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }).replace(/\. /g, '.').replace(/\.$/, '').replace(', ', ' '),
                // 🎨 썸네일 최적화
                thumbnail_url: newContent.thumbnail_url 
                  ? `${newContent.thumbnail_url}?width=230&height=154&quality=80`
                  : null,
              };
              setContents(prev => {
                const updated = [formattedContent, ...prev];
                // 💾 새 데이터 캐싱
                try {
                  const cacheData = JSON.stringify({
                    data: updated,
                    timestamp: Date.now()
                  });
                  localStorage.setItem(CACHE_KEY, cacheData);
                } catch (err) {
                  console.warn('캐시 저장 실패:', err);
                }
                return updated;
              });
              console.log('✅ 새 콘텐츠 추가됨:', formattedContent.title);
            } else if (payload.eventType === 'UPDATE') {
              // 콘텐츠 업데이트
              const updatedContent = payload.new as any;
              setContents(prev => {
                const updated = prev.map(content => 
                  content.id === updatedContent.id 
                    ? {
                        ...content,
                        title: updatedContent.title,
                        status: updatedContent.status, // ✅ DB 값을 그대로 사용 (폴백 없음)
                        // 🎨 썸네일 최적화
                        thumbnail_url: updatedContent.thumbnail_url 
                          ? `${updatedContent.thumbnail_url}?width=230&height=154&quality=80`
                          : null,
                      }
                    : content
                );
                // 💾 새 데이터 캐싱
                try {
                  const cacheData = JSON.stringify({
                    data: updated,
                    timestamp: Date.now()
                  });
                  localStorage.setItem(CACHE_KEY, cacheData);
                } catch (err) {
                  console.warn('캐시 저장 실패:', err);
                }
                return updated;
              });
              console.log('✅ 콘텐츠 업데이트됨:', updatedContent.title, '→', updatedContent.status);
            } else if (payload.eventType === 'DELETE') {
              // 콘텐츠 삭제
              const deletedId = payload.old.id as string;
              setContents(prev => {
                const updated = prev.filter(content => content.id !== deletedId);
                // 💾 새 데이터 캐싱
                try {
                  const cacheData = JSON.stringify({
                    data: updated,
                    timestamp: Date.now()
                  });
                  localStorage.setItem(CACHE_KEY, cacheData);
                } catch (err) {
                  console.warn('캐시 저장 실패:', err);
                }
                return updated;
              });
              console.log('✅ 콘텐츠 삭제됨:', deletedId);
            }
          }
        )
        .subscribe();

      console.log('✅ Realtime 구독 설정 완료');
    } catch (error) {
      console.error('❌ Realtime 구독 설정 실패:', error);
      console.log('💡 폴링으로 대체합니다.');
    }

    return () => {
      try {
        if (channel) {
          console.log('🔕 Realtime 구독 해제');
          supabase.removeChannel(channel);
        }
      } catch (error) {
        console.warn('⚠️ Realtime 구독 해제 실패 (무시):', error);
      }
    };
  }, []); // ✅ 의존성 배열 비우기: 한 번만 구독

  // 🔄 폴링: status='loading'인 콘텐츠가 있으면 5초마다 상태 확인
  useEffect(() => {
    const loadingContents = contents.filter(c => c.status === 'loading');
    
    if (loadingContents.length === 0) {
      return; // 로딩 중인 콘텐츠가 없으면 폴링 안 함
    }

    const pollInterval = setInterval(async () => {
      try {
        const { data: updatedContents, error } = await supabase
          .from('master_contents')
          .select('id, status, thumbnail_url')
          .in('id', loadingContents.map(c => c.id));

        if (error) {
          console.error('❌ 상태 확인 실패:', error);
          return;
        }

        if (updatedContents && updatedContents.length > 0) {
          let hasChanges = false;
          
          setContents(prev => {
            const updated = prev.map(content => {
              const updatedContent = updatedContents.find(u => u.id === content.id);
              if (updatedContent && (updatedContent.status !== content.status || updatedContent.thumbnail_url !== content.thumbnail_url)) {
                hasChanges = true;
                console.log(`✅ [폴링] 상태 업데이트: ${content.title} → ${updatedContent.status}`);
                return {
                  ...content,
                  status: updatedContent.status,
                  thumbnail_url: updatedContent.thumbnail_url,
                };
              }
              return content;
            });
            
            // 💾 변경사항이 있을 때만 캐싱
            if (hasChanges) {
              try {
                const cacheData = JSON.stringify({
                  data: updated,
                  timestamp: Date.now()
                });
                localStorage.setItem(CACHE_KEY, cacheData);
              } catch (err) {
                console.warn('캐시 저장 실패:', err);
              }
            }
            
            return updated;
          });
        }
      } catch (error) {
        console.error('❌ 폴링 에러:', error);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [contents]); // ✅ saveToCache 의존성 제거

  // 배포전 콘텐츠만 필터링
  const readyContents = contents.filter(c => c.status === 'ready');
  
  // 🚫 클라이언트 사이드 필터링 제거 (서버에서 이미 필터링됨)
  // contents가 이미 필터링된 데이터이므로 그대로 사용
  
  // 표시할 콘텐츠 (배포모드일 때는 배포전만, 아니면 서버에서 필터링된 contents)
  const displayContents = isDeployMode ? readyContents : contents;
  
  // 전체선택 상태
  const isAllSelected = readyContents.length > 0 && selectedIds.size === readyContents.length;
  
  // 필터 변경 시 currentPage 리셋 및 데이터 다시 로드
  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    setIsInitialLoading(true); // 🔥 필터 변경 시 초기 로드 상태로 리셋
    // ❌ contents 초기화 제거 - useEffect에서 자동으로 다시 로드됨
  }, [filter]);

  // 배포선택 모드 진입
  const handleEnterDeployMode = () => {
    setIsDeployMode(true);
    setSelectedIds(new Set());
  };

  // 배포선택 모드 해제
  const handleExitDeployMode = () => {
    setIsDeployMode(false);
    setSelectedIds(new Set());
  };

  // 전체선택 토글
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(readyContents.map(c => c.id)));
    }
  };

  // 개별 선택 토글
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 배포하기 버튼 클릭
  const handleDeployClick = () => {
    if (selectedIds.size === 0) return;
    setShowConfirmDialog(true);
  };

  // 배포 실행
  const handleConfirmDeploy = async () => {
    setShowConfirmDialog(false);
    
    try {
      const selectedIdsArray = Array.from(selectedIds);
      console.log('🚀 배포 시작:', selectedIdsArray);
      console.log('🚀 배포할 콘텐츠 수:', selectedIdsArray.length);
      
      // 🐛 배포 전 상태 확인
      const { data: beforeData } = await supabase
        .from('master_contents')
        .select('id, title, status')
        .in('id', selectedIdsArray);
      console.log('🐛 [배포 전] 콘텐츠 상태:', beforeData);
      
      // Supabase DB 업데이트: 선택된 콘텐츠를 'deployed'로 상태 변경
      const { data: updatedData, error } = await supabase
        .from('master_contents')
        .update({ status: 'deployed' })
        .in('id', selectedIdsArray)
        .select('id, title, status');

      console.log('📡 DB 업데이트 결과:', { data: updatedData, error });

      if (error) {
        console.error('❌ 배포 실패:', error);
        console.error('❌ 에러 코드:', error.code);
        console.error('❌ 에러 메시지:', error.message);
        console.error('❌ 에러 상세:', error.details);
        toast.error(`배포 실패: ${error.message}`);
      } else if (!updatedData || updatedData.length === 0) {
        // ⚠️ 에러는 없지만 업데이트된 행이 0개인 경우
        console.warn('⚠️ 업데이트된 행이 0개입니다. RLS 정책을 확인하세요.');
        console.warn('⚠️ 현재 사용자:', (await supabase.auth.getSession()).data.session?.user);
        
        // 🐛 배포 후 상태 확인
        const { data: afterData } = await supabase
          .from('master_contents')
          .select('id, title, status')
          .in('id', selectedIdsArray);
        console.log('🐛 [배포 후] 콘텐츠 상태:', afterData);
        
        toast.error('배포 권한이 없거나 RLS 정책 문제가 있습니다.');
      } else {
        console.log('✅ DB 업데이트 성공!');
        console.log('✅ 업데이트된 콘텐츠:', updatedData);
        
        // 성공: 로컬 상태 업데이트
        setContents(prev => prev.map(content => 
          selectedIds.has(content.id) 
            ? { ...content, status: 'deployed' as const }
            : content
        ));
        
        // 캐시 무효화
        try {
          localStorage.removeItem(CACHE_KEY);
          console.log('✅ 캐시 무효화 완료');
        } catch (err) {
          console.warn('⚠️ 캐시 무효화 실패 (무시):', err);
        }
        
        toast.success('배포에 성공했어요.');
      }
    } catch (error) {
      console.error('💥 배포 중 예외 발생:', error);
      console.error('💥 예외 상세:', error instanceof Error ? error.message : String(error));
      toast.error('배포에 실패했어요.');
    }
    
    // 배포선택 모드 해제
    setIsDeployMode(false);
    setSelectedIds(new Set());
  };

  // 무한 스크롤 로드 함수
  const loadMoreContents = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const startIndex = (currentPage + 1) * 20;
      const endIndex = startIndex + 19;
      
      // 🎯 쿼리 빌더 시작 (필터 적용)
      let query = supabase
        .from('master_contents')
        .select('id, content_type, title, status, created_at, thumbnail_url', { count: 'exact' });
      
      // 🔍 타입 필터 적용 (종합/심화 해석판/무료 체험판)
      if (filter === 'paid') {
        query = query.eq('content_type', 'paid');
      } else if (filter === 'free') {
        query = query.eq('content_type', 'free');
      }
      
      // 정렬 및 범위 설정
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);
      
      if (error) {
        // 416 에러 (범위 초과)는 조용히 처리
        if (error.message?.includes('416') || error.code === 'PGRST103') {
          console.log('📭 더 이상 로드할 콘텐츠가 없습니다.');
          setHasMore(false);
          setIsLoading(false);
          return;
        }
        console.error('콘텐츠 로드 실패:', error);
        console.error('에러 상세:', error.message, error.code, error.details);
        setHasMore(false);
        setIsLoading(false);
        return;
      } else if (data) {
        // 데이터가 비어있으면 hasMore를 false로 설정
        if (data.length === 0) {
          console.log('📭 더 이상 로드할 콘텐츠가 없습니다.');
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const formattedContents: MasterContent[] = data.map((item: any) => ({
          id: item.id,
          content_type: item.content_type as 'free' | 'paid',
          title: item.title,
          status: item.status, // ✅ 폴백 제거: DB 값을 그대로 사용
          created_at: new Date(item.created_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).replace(/\. /g, '.').replace(/\.$/, '').replace(', ', ' '),
          // 🎨 썸네일 최적화
          thumbnail_url: getThumbnailUrl(item.thumbnail_url, 'list'),
        }));
        
        setContents(prev => [...prev, ...formattedContents]);
        setCurrentPage(prev => prev + 1);
        setHasMore(count ? endIndex < count - 1 : false);
        console.log(`✅ ${formattedContents.length}개 콘텐츠 추가 로드 완료 (전체: ${count}개, 필터: ${filter})`);
      }
    } catch (error) {
      console.error('무한 스크롤 로드 중 오류:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, hasMore, isLoading, filter]);

  // 무한 스크롤 감지
  useEffect(() => {
    // 🔥 초기 로드가 완료될 때까지 무한 스크롤 비활성화
    if (isInitialLoading) {
      console.log('⏸️ 초기 로드 중 - 무한 스크롤 대기 중...');
      return;
    }

    const currentRef = observerTarget.current;
    if (currentRef) {
      const currentObserver = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            loadMoreContents();
          }
        },
        { threshold: 0.1 }
      );
      currentObserver.observe(currentRef);

      return () => {
        currentObserver.disconnect();
      };
    }
  }, [loadMoreContents, isInitialLoading]);

  return (
    <div className="bg-white relative w-full min-h-screen flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-white">
        {/* Top Navigation - Fixed */}
        <div className="bg-white content-stretch flex flex-col items-start shrink-0 w-full sticky top-0 z-20 border-b border-[#f3f3f3]">
          <div className="h-[60px] content-stretch flex items-center justify-between relative shrink-0 w-full px-[16px]">
            <ArrowLeft onClick={onBack} />
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[18px] text-[#1b1b1b] tracking-[-0.2px] absolute left-1/2 transform -translate-x-1/2">
              마스터 콘텐츠 리스트
            </p>
            <div 
              onClick={onNavigateHome}
              className="flex items-center justify-center relative shrink-0 size-[24px] cursor-pointer z-10"
            >
              <Home className="size-[22px] text-[#030303]" />
            </div>
          </div>
        </div>

        {/* Action Buttons - Sticky */}
        <div className="bg-white content-stretch flex items-center gap-[10px] px-[20px] py-[15px] shrink-0 w-full sticky top-[60px] z-20 border-b border-[#f3f3f3]">
          {isDeployMode ? (
            <>
              <button 
                onClick={handleExitDeployMode}
                className="h-[42px] rounded-[8px] px-[24px] border border-[#e0e0e0] flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] whitespace-nowrap">선택해제</p>
              </button>
              <button 
                onClick={handleDeployClick}
                disabled={selectedIds.size === 0}
                className={`h-[42px] rounded-[8px] flex-1 flex items-center justify-center transition-colors ${
                  selectedIds.size > 0 
                    ? 'bg-[#48b2af] hover:bg-[#3fa3a0]' 
                    : 'bg-[#e0e0e0] cursor-not-allowed'
                }`}
              >
                <p className={`font-['Pretendard_Variable:SemiBold',sans-serif] text-[14px] whitespace-nowrap ${
                  selectedIds.size > 0 ? 'text-white' : 'text-[#999999]'
                }`}>
                  배포하기
                </p>
              </button>
            </>
          ) : (
            <>
              {/* 로딩 중인 콘텐츠가 있으면 재시도 버튼 표시 */}
              {contents.filter(c => c.status === 'loading').length > 0 && (
                <button 
                  onClick={async () => {
                    const loadingContents = contents.filter(c => c.status === 'loading');
                    console.log(`🔄 로딩 중인 ${loadingContents.length}개 콘텐츠 재시도 시작`);
                    
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      toast.error('로그인 세션이 만료되었습니다.');
                      return;
                    }
                    
                    for (const content of loadingContents) {
                      console.log(`  🔄 재시도: ${content.title}`);
                      supabase.functions.invoke('generate-master-content', {
                        body: { contentId: content.id },
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        }
                      }).then(({ data, error }) => {
                        if (error) {
                          console.error(`  ❌ 재시도 실패: ${content.title}`, error);
                        } else {
                          console.log(`  ✅ 재시도 성공: ${content.title}`);
                        }
                      });
                    }
                    
                    toast.info(`${loadingContents.length}개 콘텐츠 재시도 중입니다.`);
                  }}
                  className="h-[42px] rounded-[8px] px-[16px] border border-[#ff9800] bg-[#fff3e0] flex items-center justify-center hover:bg-[#ffe0b2] transition-colors"
                >
                  <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[14px] text-[#ff9800] whitespace-nowrap">
                    ⚠️ 재시도 ({contents.filter(c => c.status === 'loading').length})
                  </p>
                </button>
              )}
              <button 
                onClick={handleEnterDeployMode}
                className="h-[42px] rounded-[8px] px-[24px] border border-[#e0e0e0] flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#1b1b1b] whitespace-nowrap">배포선택</p>
              </button>
              <button 
                onClick={() => {
                  console.log('파일로 등록하기 버튼 클릭됨');
                  console.log('현재 userId:', userId);
                  setShowFileUploadDialog(true);
                }}
                className="bg-[#48b2af] h-[42px] rounded-[8px] flex-1 flex items-center justify-center hover:bg-[#3fa3a0] transition-colors"
              >
                <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[14px] text-white whitespace-nowrap">파일로 등록하기</p>
              </button>
            </>
          )}
        </div>

        {/* 필터 (Segmented Control) - 배포모드가 아닐 때만 */}
        {!isDeployMode && (
          <div className="bg-white px-[20px] py-[12px] shrink-0 w-full">
            <div className="bg-[#f9f9f9] rounded-[16px] p-[6px] flex gap-[4px]">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-[8px] rounded-[12px] transition-all ${
                  filter === 'all'
                    ? 'bg-white shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)]'
                    : 'bg-transparent'
                }`}
              >
                <p className={`font-['Pretendard_Variable:${filter === 'all' ? 'SemiBold' : 'Medium'}',sans-serif] text-[14px] text-center tracking-[-0.42px] ${
                  filter === 'all' ? 'text-[#151515]' : 'text-[#999999]'
                }`}>
                  종합
                </p>
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`flex-1 py-[8px] rounded-[12px] transition-all ${
                  filter === 'paid'
                    ? 'bg-white shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)]'
                    : 'bg-transparent'
                }`}
              >
                <p className={`font-['Pretendard_Variable:${filter === 'paid' ? 'SemiBold' : 'Medium'}',sans-serif] text-[14px] text-center tracking-[-0.42px] ${
                  filter === 'paid' ? 'text-[#151515]' : 'text-[#999999]'
                }`}>
                  심화 해석판
                </p>
              </button>
              <button
                onClick={() => setFilter('free')}
                className={`flex-1 py-[8px] rounded-[12px] transition-all ${
                  filter === 'free'
                    ? 'bg-white shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)]'
                    : 'bg-transparent'
                }`}
              >
                <p className={`font-['Pretendard_Variable:${filter === 'free' ? 'SemiBold' : 'Medium'}',sans-serif] text-[14px] text-center tracking-[-0.42px] ${
                  filter === 'free' ? 'text-[#151515]' : 'text-[#999999]'
                }`}>
                  무료 체험판
                </p>
              </button>
            </div>
          </div>
        )}

        {/* 전체선택 (배포모드일 때만) */}
        {isDeployMode && (
          <div className="bg-white px-[20px] py-[10px]">
            <div 
              onClick={handleToggleSelectAll}
              className="flex items-center gap-[10px] cursor-pointer"
            >
              <CheckboxIcon checked={isAllSelected} size={20} />
              <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[16px] text-black">
                전체선택
              </p>
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 flex flex-col gap-[10px] px-[20px] pb-[100px] overflow-y-auto">
          {displayContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[80px]">
              <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[14px] text-[#999999]">
                {isDeployMode ? '배포 가능한 콘텐츠가 없습니다' : '등록된 콘텐츠가 없습니다'}
              </p>
            </div>
          ) : (
            displayContents.map((content) => (
              <ContentItem 
                key={content.id} 
                content={content} 
                onClick={() => navigate(`/master/content/${content.id}`)}
                isDeployMode={isDeployMode}
                isSelected={selectedIds.has(content.id)}
                onToggleSelect={() => handleToggleSelect(content.id)}
              />
            ))
          )}
          {/* 무한 스크롤 감지용 요소 */}
          <div ref={observerTarget} className="h-[20px]"></div>
        </div>

        {/* FAB (배포모드가 아닐 때만) */}
        {!isDeployMode && (
          <div className="fixed bottom-[40px] left-1/2 transform -translate-x-1/2 z-10">
            <button 
              onClick={() => navigate('/master/content/create')}
              className="bg-[#48b2af] flex gap-[8px] h-[48px] items-center justify-center px-[24px] py-[12px] rounded-[30px] shadow-lg hover:bg-[#3fa3a0] transition-colors"
            >
              <span className="text-[18px]">✏️</span>
              <p className="font-['Pretendard_Variable:SemiBold',sans-serif] text-[15px] text-white whitespace-nowrap">콘텐츠 만들기</p>
            </button>
          </div>
        )}
      </div>

      {/* 확인 다이얼로그 */}
      {showConfirmDialog && (
        <ConfirmDialog
          message="선택한 콘텐츠를 운영 서버에 배포하시겠어요?"
          onConfirm={handleConfirmDeploy}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      {/* 파일 업로드 다이얼로그 */}
      {showFileUploadDialog && (
        <FileUploadDialog
          isOpen={showFileUploadDialog}
          onClose={() => setShowFileUploadDialog(false)}
          onSuccess={() => {
            // ❌ 페이지 새로고침 제거 (백그라운드 로그가 날아감)
            // window.location.reload();
            
            // ✅ 캐시 무효화만 하고, Realtime으로 자동 업데이트
            localStorage.removeItem(CACHE_KEY);
            
            // ✅ 수동으로 데이터 다시 로드 (새로고침 없이)
            fetchContents();
            
            console.log('✅ 파일 업로드 완료! 백그라운드 AI 생성은 계속 진행 중...');
            console.log('💡 콘솔을 열어두면 실시간 진행 상황을 확인할 수 있습니다.');
          }}
        />
      )}

      {/* 세션 만료 다이얼로그 */}
      <SessionExpiredDialog isOpen={isSessionExpired} />
    </div>
  );
}