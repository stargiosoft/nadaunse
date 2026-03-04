import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'sprout_balance_cache';

interface SproutBalanceCache {
  balance: number;
  timestamp: number;
}

/** 캐시에서 잔액 읽기 */
function readCache(): SproutBalanceCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SproutBalanceCache;
  } catch {
    return null;
  }
}

/** 캐시에 잔액 저장 */
export function writeSproutBalanceCache(balance: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ balance, timestamp: Date.now() }));
}

/** 캐시 무효화 (잔액 변경 시 호출) */
export function invalidateSproutBalanceCache() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * 새싹 잔액 조회 훅
 * - 캐시 있으면 즉시 반환 (loading: false), 없으면 DB 조회
 * - refetch: 강제 DB 재조회 + 캐시 갱신
 */
export function useSproutBalance() {
  const cached = readCache();
  const [balance, setBalance] = useState<number>(cached?.balance ?? 0);
  const [loading, setLoading] = useState(!cached);

  const fetchBalance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBalance(0);
        writeSproutBalanceCache(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('sprout_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ [useSproutBalance] 잔액 조회 실패:', error);
        setBalance(0);
      } else {
        const newBalance = data?.sprout_balance ?? 0;
        setBalance(newBalance);
        writeSproutBalanceCache(newBalance);
      }
    } catch (err) {
      console.error('❌ [useSproutBalance] 예외:', err);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 캐시 유무와 관계없이 항상 DB에서 최신 잔액 조회
    // 캐시가 있으면 loading=false로 즉시 표시, 백그라운드에서 동기화
    fetchBalance();
  }, [fetchBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  return { balance, loading, refetch: fetchBalance };
}
