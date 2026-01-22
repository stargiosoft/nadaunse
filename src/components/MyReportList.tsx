import { useState } from 'react';
import { DEV } from '@/lib/env';
import svgPaths from "@/imports/svg-o5jcc01aog";
import ArrowLeft from './ArrowLeft';
import NavigationTabBar from './NavigationTabBar';
import MyReportEmpty from './MyReportEmpty';
import MyReportWeekly, { MonthlyReport } from './MyReportWeekly';

function CommonLogo() {
  return (
    <div className="relative shrink-0" style={{ height: '20px', width: '67px', paddingLeft: '8px' }}>
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 59 20">
        <g>
          <path d={svgPaths.p1fb34640} fill="#151515" />
          <path d={svgPaths.p1bbbb200} fill="#151515" />
          <path d={svgPaths.p11620600} fill="#151515" />
          <path d={svgPaths.p9a70500} fill="#151515" />
          <path d={svgPaths.p115ca080} fill="#151515" />
          <path d={svgPaths.pb2cf980} fill="#151515" />
          <path d={svgPaths.p211e0700} fill="#151515" />
          <path d={svgPaths.p3088fdc0} fill="#151515" />
          <path d={svgPaths.p2e718980} fill="#151515" />
          <path d={svgPaths.p15169200} fill="#151515" />
        </g>
      </svg>
    </div>
  );
}

const reportData: MonthlyReport[] = [
  {
    id: '2026-05',
    title: '26년 5월 보고서',
    reports: [
      {
        id: '2026-05-04',
        title: '4주차 보고서',
        period: '2026.05.25 ~ 05.31',
        tags: [
          { label: '# 결단력 있는' },
          { label: '# 책임감이 강한' },
          { label: '# 상황을 주도하는' }
        ],
        extraTagsCount: 3,
        message: {
          label: '이번 주 나에게 :',
          content: '이번 주도 고생했어. 혼자 애쓴 부분들, 내가 다 알고 있어\n괜찮다고 더 버텨보자고 애썼다고 칭찬해주고 싶어'
        }
      }
    ]
  },
  {
    id: '2026-04',
    title: '26년 4월 보고서',
    reports: [
      {
        id: '2026-04-03',
        title: '3주차 보고서',
        period: '2026.04.14 ~ 04.20',
        tags: [
          { label: '# 결단력 있는' },
          { label: '# 책임감이 강한' },
          { label: '# 상황을 주도하는' }
        ],
        extraTagsCount: 8,
        message: {
          label: '이번 주 나에게 :',
          content: '봄바람처럼 설레는 일이 생길지도 몰라.\n작은 변화를 즐기면서 너만의 속도로 나아가면 돼.'
        }
      }
    ]
  },
  {
    id: '2026-03',
    title: '26년 3월 보고서',
    reports: [
      {
        id: '2026-03-04',
        title: '4주차 보고서',
        period: '2026.03.25 ~ 03.31',
        tags: [
          { label: '# 섬세한' },
          { label: '# 감각적인' },
          { label: '# 창의적인' }
        ],
        extraTagsCount: 5,
        message: {
          label: '이번 주 나에게 :',
          content: '따뜻한 햇살처럼 기분 좋은 소식이 기다리고 있어.\n긍정적인 마음으로 주변을 둘러봐.'
        }
      },
      {
        id: '2026-03-03',
        title: '3주차 보고서',
        period: '2026.03.18 ~ 03.24',
        tags: [
          { label: '# 침착한' },
          { label: '# 꾸준한' },
          { label: '# 노력하는' }
        ],
        extraTagsCount: 2
      },
      {
        id: '2026-03-02',
        title: '2주차 보고서',
        period: '2026.03.11 ~ 03.17',
        tags: [
          { label: '# 열정적인' },
          { label: '# 긍정적인' },
          { label: '# 활기찬' }
        ],
        extraTagsCount: 4,
        message: {
          label: '이번 주 나에게 :',
          content: '작은 성취들이 모여 큰 꿈을 이룰 거야.\n지금처럼 꾸준히 나아가면 돼.'
        }
      },
      {
        id: '2026-03-01',
        title: '1주차 보고서',
        period: '2026.03.04 ~ 03.10',
        tags: [
          { label: '# 새로운' },
          { label: '# 도전적인' },
          { label: '# 용기있는' }
        ],
        extraTagsCount: 1
      }
    ]
  },
  {
    id: '2026-02',
    title: '26년 2월 보고서',
    reports: [
      {
        id: '2026-02-04',
        title: '4주차 보고서',
        period: '2026.02.22 ~ 02.28',
        tags: [
          { label: '# 성실한' },
          { label: '# 끈기있는' },
          { label: '# 노력하는' }
        ],
        extraTagsCount: 2,
        message: {
          label: '이번 주 나에게 :',
          content: '겨울의 끝자락에서 너의 노력이 결실을 맺고 있어.\n조금만 더 힘내면 원하던 목표에 닿을 수 있을 거야.'
        }
      },
      {
        id: '2026-02-03',
        title: '3주차 보고서',
        period: '2026.02.15 ~ 02.21',
        tags: [
          { label: '# 차분한' },
          { label: '# 사려깊은' },
          { label: '# 이해심 많은' }
        ],
        extraTagsCount: 3
      },
      {
        id: '2026-02-02',
        title: '2주차 보고서',
        period: '2026.02.08 ~ 02.14',
        tags: [
          { label: '# 명랑한' },
          { label: '# 쾌활한' },
          { label: '# 즐거운' }
        ],
        extraTagsCount: 0,
        message: {
          label: '이번 주 나에게 :',
          content: '너의 밝은 에너지가 주변 사람들에게 힘이 되고 있어.\n너 스스로도 그 에너지를 즐겨봐.'
        }
      },
      {
        id: '2026-02-01',
        title: '1주차 보고서',
        period: '2026.02.01 ~ 02.07',
        tags: [
          { label: '# 단호한' },
          { label: '# 확실한' },
          { label: '# 믿음직한' }
        ],
        extraTagsCount: 5
      }
    ]
  },
  {
    id: '2026-01',
    title: '26년 1월 보고서',
    reports: [
      {
        id: '2026-01-04',
        title: '4주차 보고서',
        period: '2026.01.25 ~ 01.31',
        tags: [
          { label: '# 새로운' },
          { label: '# 희망찬' },
          { label: '# 열정적인' }
        ],
        extraTagsCount: 4,
        message: {
          label: '이번 주 나에게 :',
          content: '새해의 다짐들이 작심삼일이 되지 않도록,\n오늘 하루도 알차게 보낸 너를 칭찬해.'
        }
      },
      {
        id: '2026-01-03',
        title: '3주차 보고서',
        period: '2026.01.18 ~ 01.24',
        tags: [
          { label: '# 계획적인' },
          { label: '# 치밀한' },
          { label: '# 꼼꼼한' }
        ],
        extraTagsCount: 2
      },
      {
        id: '2026-01-02',
        title: '2주차 보고서',
        period: '2026.01.11 ~ 01.17',
        tags: [
          { label: '# 창의적인' },
          { label: '# 독창적인' },
          { label: '# 기발한' }
        ],
        extraTagsCount: 6,
        message: {
          label: '이번 주 나에게 :',
          content: '너의 새로운 아이디어들이 빛을 발할 거야.\n자신감을 가지고 도전해봐.'
        }
      },
      {
        id: '2026-01-01',
        title: '1주차 보고서',
        period: '2026.01.04 ~ 01.10',
        tags: [
          { label: '# 시작하는' },
          { label: '# 설레는' },
          { label: '# 기대되는' }
        ],
        extraTagsCount: 1
      }
    ]
  }
];

function Footer() {
  return (
    <div className="flex flex-col items-start w-full shrink-0 mt-auto" style={{ backgroundColor: '#f9f9f9', padding: '40px 20px' }}>
      <div className="flex flex-col w-full" style={{ gap: '8px' }}>
        <CommonLogo />
        <div className="flex flex-col w-full" style={{ gap: '4px', paddingLeft: '8px', fontSize: '13px', color: '#6d6d6d', lineHeight: '19px', letterSpacing: '-0.26px' }}>
          <p>Copyright 2024@Stargiosoft All Rights Reserved.</p>
          <p>대표자 서지현 | 사업자등록번호 827-88-01815</p>
          <p>통신판매업번호 2024-서울영등포-2084</p>
          <p>서울시 영등포구 양평로 149, 1507호</p>
          <p>문의 stargiosoft@gmail.com</p>
        </div>
        <div className="flex items-center" style={{ gap: '0px', marginTop: '-4px' }}>
          <button className="flex items-center justify-center transition-all duration-200 active:scale-97" style={{ height: '34px', padding: '0 8px', borderRadius: '6px' }}>
            <span style={{ fontSize: '14px', color: '#848484', fontWeight: 500 }}>이용약관</span>
          </button>
          <div style={{ height: '10px', width: '1px', backgroundColor: '#d4d4d4' }} />
          <button className="flex items-center justify-center transition-all duration-200 active:scale-97" style={{ height: '34px', padding: '0 8px', borderRadius: '6px' }}>
            <span style={{ fontSize: '14px', color: '#848484', fontWeight: 500 }}>개인정보 처리방침</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface MyReportListProps {
  onBack?: () => void;
  onTabChange?: (index: number) => void;
  onReportClick?: (id: string) => void;
  forceEmptyState?: boolean; // 테스트용: 빈 상태 강제
}

export default function MyReportList({ onBack, onTabChange, onReportClick, forceEmptyState = false }: MyReportListProps) {
  const [reports, setReports] = useState(forceEmptyState ? [] : reportData);
  const [activeTab, setActiveTab] = useState(1); // "나의 분석 보고서" 탭이 기본 활성화

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    onTabChange?.(index);
  };

  const handleDevNoTags = () => {
    const newReports = JSON.parse(JSON.stringify(reportData));
    if (newReports[0]?.reports[0]) {
      newReports[0].reports[0].tags = [];
      newReports[0].reports[0].extraTagsCount = 0;
      setReports(newReports);
    }
  };

  const handleDevManyTags = () => {
    const newReports = JSON.parse(JSON.stringify(reportData));
    if (newReports[0]?.reports[0]) {
      newReports[0].reports[0].tags = [
        { label: '# 결단력 있는' },
        { label: '# 책임감이 강한' },
        { label: '# 상황을 주도하는' }
      ];
      newReports[0].reports[0].extraTagsCount = 5; // Total 8 tags (3 visible + 5 extra)
      setReports(newReports);
    }
  };

  const handleDevInitialState = () => {
    // Empty reports to simulate initial user state
    setReports([]);
  };

  // Check current week's tags (assuming first report of first month is current week)
  const currentWeekReport = reports[0]?.reports[0];
  const currentWeekTagsCount = currentWeekReport
    ? currentWeekReport.tags.length + (currentWeekReport.extraTagsCount || 0)
    : 0;

  // Filter for Jan-March reports for the list
  const filteredReports = reports.filter(month =>
    ['2026-01', '2026-02', '2026-03'].includes(month.id)
  );

  const isInitialEmptyState = reports.length === 0;

  return (
    // iOS Safari 스크롤 바운스 방지 패턴 (fixed inset-0)
    <div className="bg-white fixed inset-0 flex justify-center">
      {/* 내부 컨테이너: 최대 440px 제한 */}
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">

        {/* Top Navigation */}
        <div className="bg-white shrink-0 w-full z-20" style={{ height: '52px' }}>
          <div className="flex flex-col justify-center" style={{ width: '100%', height: '100%' }}>
            <div className="flex items-center justify-between" style={{ padding: '4px 12px', width: '100%' }}>
              <ArrowLeft onClick={onBack || (() => window.history.back())} />
              <p style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                lineHeight: '25.5px',
                letterSpacing: '-0.36px',
                color: '#000000',
                textAlign: 'center',
                flex: 1,
              }}>
                마이페이지
              </p>
              {/* 우측 공간 확보 (뒤로가기 버튼과 대칭) */}
              <div style={{ width: '44px', height: '44px' }} />
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="shrink-0 w-full">
          <NavigationTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Main Content - 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="w-full bg-white flex flex-col min-h-full">
            {isInitialEmptyState ? (
              <MyReportEmpty />
            ) : (
              <MyReportWeekly
                currentWeekTagsCount={currentWeekTagsCount}
                filteredReports={filteredReports}
                onReportClick={onReportClick}
              />
            )}

            {/* Dev Controls - only visible in dev/staging environments */}
            {DEV && (
              <div className="flex items-center justify-center flex-wrap w-full" style={{ gap: '12px', padding: '0 20px', marginTop: '40px', paddingBottom: '20px' }}>
                <div className="flex items-center justify-center flex-wrap" style={{ gap: '12px' }}>
                  <button
                    onClick={handleDevNoTags}
                    style={{ backgroundColor: '#f5f5f5', fontSize: '12px', color: '#999', fontWeight: 500, padding: '8px 12px', borderRadius: '6px' }}
                  >
                    dev 이번주 저장 태그 없음
                  </button>
                  <button
                    onClick={handleDevManyTags}
                    style={{ backgroundColor: '#f5f5f5', fontSize: '12px', color: '#999', fontWeight: 500, padding: '8px 12px', borderRadius: '6px' }}
                  >
                    dev 이번주 태그 쌓음
                  </button>
                  <button
                    onClick={handleDevInitialState}
                    style={{ backgroundColor: '#f5f5f5', fontSize: '12px', color: '#999', fontWeight: 500, padding: '8px 12px', borderRadius: '6px' }}
                  >
                    dev 보고서 없음
                  </button>
                </div>
              </div>
            )}

            {!isInitialEmptyState && <div style={{ height: '20px' }} />}
            <Footer />
          </div>
        </div>

      </div>
    </div>
  );
}
