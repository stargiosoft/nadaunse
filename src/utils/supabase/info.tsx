/**
 * Supabase 환경 설정
 *
 * Vercel 환경변수 (필수):
 * - VITE_SUPABASE_PROJECT_ID: Supabase 프로젝트 ID
 * - VITE_SUPABASE_ANON_KEY: Supabase 익명 키
 *
 * 보안 참고: anon key는 RLS 보호하에 공개되지만, 키 로테이션을 위해 환경변수 사용 권장
 */

// Storage 전용 프로젝트 (스테이징 - 모든 환경에서 공용 사용)
const STORAGE_PROJECT_ID = "hyltbeewxaqashyivilu";

// 환경변수 필수 체크
const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!envProjectId || !envAnonKey) {
  console.error('[Supabase] 환경변수 누락: VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_ANON_KEY 설정 필요');
}

export const projectId = envProjectId || '';
export const publicAnonKey = envAnonKey || '';

// Storage URL은 항상 스테이징 프로젝트 사용 (이미지/파일 저장소 통합)
export const storageProjectId = STORAGE_PROJECT_ID;
export const storageBaseUrl = `https://${STORAGE_PROJECT_ID}.supabase.co/storage/v1/object/public`;