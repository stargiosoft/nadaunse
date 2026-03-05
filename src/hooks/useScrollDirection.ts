import { useState, useEffect, useRef } from 'react';

/**
 * 스크롤 방향을 감지해 탭바 표시 여부(true = 보임)를 반환하는 훅.
 *
 * 동작 원칙:
 *  - requestAnimationFrame 기반으로 프레임당 1회만 업데이트 (과도한 setState 방지)
 *  - 같은 방향으로 `threshold`px 이상 스크롤되어야 토글 (너무 민감하게 반응 방지)
 *  - 방향이 바뀌면 누적값을 리셋하고 즉시 토글하지 않음 (히스테리시스)
 *  - 미세 진동(< 2px) 무시
 */
export function useScrollDirection(threshold = 16): boolean {
  const [visible, setVisible] = useState(true);

  // ref로 관리 → RAF 콜백 내부에서 stale closure 없이 최신값 접근
  const lastY       = useRef(0);
  const accumulated = useRef(0);   // 현재 방향으로 누적된 스크롤 거리 (px)
  const visibleRef  = useRef(true); // setVisible과 항상 동기화
  const rafPending  = useRef(false);

  useEffect(() => {
    // 마운트 시점의 scrollY를 기준점으로 초기화 (페이지 중간 진입 대응)
    lastY.current = window.scrollY;

    const onScroll = () => {
      // 이미 RAF가 예약되어 있으면 스킵 (같은 프레임에 여러 이벤트 방어)
      if (rafPending.current) return;
      rafPending.current = true;

      requestAnimationFrame(() => {
        rafPending.current = false;

        const y  = window.scrollY;
        const dy = y - lastY.current;
        lastY.current = y;

        // 최상단 도달 시 항상 탭바 노출 (iOS overscroll bounce 대응)
        if (y <= 0) {
          if (!visibleRef.current) {
            visibleRef.current = true;
            accumulated.current = 0;
            setVisible(true);
          }
          return;
        }

        // 미세 진동 무시 (이미지 lazy-load, resize 등으로 발생하는 1~2px 변동)
        if (Math.abs(dy) < 2) return;

        // ── 히스테리시스: 방향 전환 시 누적값 리셋, 즉시 토글하지 않음 ──
        if (accumulated.current !== 0) {
          const sameDirection = dy > 0 === accumulated.current > 0;
          if (!sameDirection) {
            accumulated.current = 0;
            return; // 방향이 바뀐 직후엔 아무 동작 없이 대기
          }
        }

        accumulated.current += dy;

        // ── threshold 초과 시 토글 ──
        if (accumulated.current > threshold && visibleRef.current) {
          // 아래로 충분히 스크롤 → 탭바 숨김
          visibleRef.current  = false;
          accumulated.current = 0;
          setVisible(false);
        } else if (accumulated.current < -threshold && !visibleRef.current) {
          // 위로 충분히 스크롤 → 탭바 노출
          visibleRef.current  = true;
          accumulated.current = 0;
          setVisible(true);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return visible;
}
