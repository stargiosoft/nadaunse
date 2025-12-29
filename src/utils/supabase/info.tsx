// Supabase 설정 - 환경 변수 우선, 없으면 프로덕션 기본값 사용
const FALLBACK_PROJECT_ID = "hyltbeewxaqashyivilu";
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bHRiZWV3eGFxYXNoeWl2aWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDIzODAsImV4cCI6MjA3Nzg3ODM4MH0.NmGHO2S31SYjoZ60ZkWyyon8ObjFgb3bHlKvbINcu4U";

// 환경 변수에서 URL 파싱하여 projectId 추출
function getProjectIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

const envProjectId = getProjectIdFromUrl(import.meta.env.VITE_SUPABASE_URL);
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const projectId = envProjectId || FALLBACK_PROJECT_ID;
export const publicAnonKey = envAnonKey || FALLBACK_ANON_KEY;

// 디버깅용 로그 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config:', {
    projectId,
    usingEnvVar: !!envProjectId,
    env: import.meta.env.MODE
  });
}