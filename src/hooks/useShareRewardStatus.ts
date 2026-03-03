/**
 * 공유 리워드 상태 조회 Hook
 * - 현재 회차, 진행률, 레퍼럴 코드 등
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchShareRewardStatus } from '../lib/shareRewardService';

interface ShareRewardStatus {
  referralCode: string;
  currentRound: number;
  requiredCount: number;
  currentCount: number;
  totalRewardsEarned: number;
  totalFriendsReferred: number;
}

export function useShareRewardStatus() {
  const [status, setStatus] = useState<ShareRewardStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus(null);
        return;
      }

      const result = await fetchShareRewardStatus(session.access_token);
      setStatus(result);
    } catch (e) {
      console.error('📊 [useShareRewardStatus] 조회 실패:', e);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { status, loading, refetch: fetch };
}
