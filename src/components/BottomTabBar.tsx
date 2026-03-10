import { useNavigate, useLocation } from 'react-router-dom';

const font = "'Pretendard Variable', sans-serif";

// ─── Icons ───────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#41a09e' : '#b7b7b7';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 22V12H15V22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NadaumIcon({ active }: { active: boolean }) {
  const color = active ? '#41a09e' : '#b7b7b7';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path
        d="M12 3C12 3 8 8 8 12C8 16 12 21 12 21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 3C12 3 16 8 16 12C16 16 12 21 12 21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M3.5 10H20.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.5 14H20.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? '#41a09e' : '#b7b7b7';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type TabKey = 'home' | 'nadaum' | 'profile';

interface Tab {
  key: TabKey;
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactNode;
}

const tabs: Tab[] = [
  { key: 'home', label: '홈', path: '/', icon: (a) => <HomeIcon active={a} /> },
  { key: 'nadaum', label: '나다움', path: '/nadaum', icon: (a) => <NadaumIcon active={a} /> },
  { key: 'profile', label: '프로필', path: '/profile', icon: (a) => <ProfileIcon active={a} /> },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeTab: TabKey =
    pathname === '/nadaum' ? 'nadaum'
    : pathname === '/profile' || pathname.startsWith('/profile/') ? 'profile'
    : 'home';

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-50"
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f3f3f3',
      }}
    >
      <div className="flex items-center justify-around" style={{ height: '56px' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 cursor-pointer"
              style={{
                height: '56px',
                background: 'none',
                border: 'none',
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {tab.icon(isActive)}
              <span
                style={{
                  fontFamily: font,
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: '12px',
                  letterSpacing: '-0.2px',
                  color: isActive ? '#41a09e' : '#b7b7b7',
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
