import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { projectId } from '../utils/supabase/info';
import { clearUserCaches } from '../lib/auth';
import { setUser as setSentryUser } from '../lib/sentry';
import { setUserId as setGAUserId } from '../utils/analytics';
import { logger } from '../lib/logger';

/**
 * AI 테스트용 이메일 간이 회원가입/로그인 페이지
 * - UI에는 노출하지 않고 /test/email-auth 직접 접속으로만 사용
 * - 회원가입 시 기존 OAuth 사용자와 동일한 플로우 (약관 → 웰컴쿠폰 → 홈)
 */
export default function EmailAuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** 기존 사용자 로그인 후 처리 (AuthCallback.tsx 패턴 동일) */
  const handleExistingUser = async (session: { access_token: string; user: { id: string; email?: string } }) => {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get',
        user_data: {
          email: session.user.email,
          name: session.user.email?.split('@')[0] || 'Test User',
          provider: 'email',
        },
      }),
    });

    if (response.status === 404) {
      // public.users에 없음 → 신규 사용자 플로우
      handleNewUser(session);
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || '사용자 조회 실패');
    }

    const userData = {
      id: result.user.id,
      email: result.user.email,
      nickname: result.user.nickname || 'Test User',
      provider: result.user.provider || 'email',
      provider_id: result.user.provider_id || session.user.id,
      profile_image: result.user.profile_image || '',
    };

    clearUserCaches();
    localStorage.setItem('user', JSON.stringify(userData));
    setSentryUser(userData.id, userData.email);
    setGAUserId(userData.id);

    document.cookie = `last_login_provider=email; max-age=${60 * 60 * 24 * 365}; path=/`;
    if (userData.email) {
      document.cookie = `last_login_email=${encodeURIComponent(userData.email)}; max-age=${60 * 60 * 24 * 365}; path=/`;
    }

    sessionStorage.setItem('show_login_toast', 'true');
    sessionStorage.setItem('force_profile_reload', 'true');
    navigate('/', { replace: true });
  };

  /** 신규 사용자 → 약관 페이지로 이동 (AuthCallback.tsx 패턴 동일) */
  const handleNewUser = (session: { user: { id: string; email?: string } }) => {
    const tempUserData = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.email?.split('@')[0] || 'Test User',
      avatar_url: '',
      provider: 'email',
    };

    localStorage.setItem('tempUser', JSON.stringify(tempUserData));
    navigate('/signup/terms', { replace: true });
  };

  /** 회원가입 (signUp → 세션 확보 → 신규 사용자 플로우) */
  const handleSignUp = async () => {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          provider: 'email',
          name: email.split('@')[0],
        },
        emailRedirectTo: undefined,
      },
    });

    if (signUpError) {
      // 이미 가입된 이메일
      if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered')) {
        setError('이미 가입된 이메일입니다. 로그인을 이용해주세요.');
        setMode('signin');
        return;
      }
      throw signUpError;
    }

    // 세션 확보 (auto-confirm 비활성화 시 바로 세션 반환)
    let session = signUpData.session;

    // 세션 없으면 signInWithPassword 재시도 (카카오 로그인 패턴, auth.ts:80-96)
    if (!session) {
      logger.warn('signUp 후 세션 없음 → signInWithPassword 재시도');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      session = loginData.session;
    }

    if (!session) {
      throw new Error('세션을 확보하지 못했습니다.');
    }

    handleNewUser(session);
  };

  /** 로그인 (signInWithPassword → 기존 사용자 처리) */
  const handleSignIn = async () => {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      if (signInError.message?.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }
      throw signInError;
    }

    if (!data.session) {
      throw new Error('세션을 확보하지 못했습니다.');
    }

    await handleExistingUser(data.session);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (err: unknown) {
      logger.error('Email auth error:', err);
      setError('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <p
            className="inline-block rounded-full px-3 py-1"
            style={{ fontSize: '12px', fontWeight: 500, color: '#f59e0b', backgroundColor: '#fef3c7' }}
          >
            AI Test Only
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>
            {mode === 'signup' ? '이메일 회원가입' : '이메일 로그인'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            TestSprite 등 AI 테스트 도구용 간이 인증
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#48b2af]"
              style={{ fontSize: '15px', color: '#111827' }}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#48b2af]"
              style={{ fontSize: '15px', color: '#111827' }}
              disabled={loading}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 transition-colors disabled:opacity-50"
            style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', backgroundColor: '#48b2af' }}
          >
            {loading
              ? '처리중...'
              : mode === 'signup'
                ? '회원가입'
                : '로그인'
            }
          </button>
        </form>

        {/* 모드 전환 */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
            style={{ fontSize: '13px', color: '#6b7280' }}
          >
            {mode === 'signup'
              ? '이미 계정이 있으신가요? 로그인'
              : '계정이 없으신가요? 회원가입'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
