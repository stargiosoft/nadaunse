import { useNavigate, useLocation } from 'react-router-dom';

const font = "'Pretendard Variable', sans-serif";

// ─── Design Tokens (★DESIGN_SYSTEM★.md 기준) ────────────────────────────────

const ACTIVE = '#48b2af';
const ACTIVE_BG = '#f0f8f8';
const INACTIVE = '#b7b7b7';

// ─── Icons ───────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10.5Z"
          fill={ACTIVE}
          fillOpacity={0.12}
          stroke={ACTIVE}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V12H15V22"
          stroke={ACTIVE}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10.5Z"
        stroke={INACTIVE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 22V12H15V22"
        stroke={INACTIVE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NadaumIcon({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* 거울 몸체 (둥근 사각형) */}
      <rect
        x="5" y="2" width="14" height="17" rx="7"
        stroke={color} strokeWidth="1.8"
        fill={active ? ACTIVE : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      {/* 반사 하이라이트 */}
      <path
        d="M10 7C10.5 6.5 12.5 6.5 13 7"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"
      />
      {/* 손잡이 */}
      <line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MaumTalkIcon({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
        fill={active ? ACTIVE : 'none'}
        fillOpacity={active ? 0.12 : 0}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="1" fill={color} />
      <circle cx="12.5" cy="12" r="1" fill={color} />
      <circle cx="16" cy="12" r="1" fill={color} />
    </svg>
  );
}

function UnteIcon({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* 클립보드 체크리스트 — 테스트/퀴즈 느낌 */}
      <rect
        x="5" y="3" width="14" height="18" rx="2"
        stroke={color} strokeWidth="1.8"
        fill={active ? ACTIVE : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      <path d="M9 1.5V4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 1.5V4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* 체크 항목들 */}
      <path d="M9 10L10.5 11.5L13 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9" y1="15" x2="15" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" fill={active ? ACTIVE : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type TabKey = 'home' | 'nadaum' | 'maumtalk' | 'unte' | 'profile';

interface Tab {
  key: TabKey;
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactNode;
}

const tabs: Tab[] = [
  { key: 'home', label: '홈', path: '/', icon: (a) => <HomeIcon active={a} /> },
  { key: 'nadaum', label: '나다움', path: '/nadaum', icon: (a) => <NadaumIcon active={a} /> },
  { key: 'maumtalk', label: '마음톡', path: '/maumtalk', icon: (a) => <MaumTalkIcon active={a} /> },
  { key: 'unte', label: '운테', path: '/unte', icon: (a) => <UnteIcon active={a} /> },
  { key: 'profile', label: '프로필', path: '/profile', icon: (a) => <ProfileIcon active={a} /> },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeTab: TabKey =
    pathname === '/nadaum' ? 'nadaum'
    : pathname === '/maumtalk' || pathname.startsWith('/maumtalk/') ? 'maumtalk'
    : pathname === '/unte' || pathname.startsWith('/unte/') ? 'unte'
    : pathname === '/profile' || pathname.startsWith('/profile/') ? 'profile'
    : 'home';

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px]"
      style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f3f3', zIndex: 40 }}
    >
      <div className="flex items-stretch justify-around" style={{ height: '56px' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer relative"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                gap: '2px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: 0,
                    width: '20px',
                    height: '2px',
                    borderRadius: '0 0 2px 2px',
                    backgroundColor: ACTIVE,
                  }}
                />
              )}

              {/* Icon with active background */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '28px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {tab.icon(isActive)}
              </div>

              {/* Label */}
              <span
                style={{
                  fontFamily: font,
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: '14px',
                  letterSpacing: '-0.2px',
                  color: isActive ? ACTIVE : INACTIVE,
                  transition: 'color 0.2s ease',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* iOS Safe Area */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', backgroundColor: '#ffffff' }} />
    </div>
  );
}
