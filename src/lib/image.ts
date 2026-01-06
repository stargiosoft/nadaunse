/**
 * Supabase Storage 썸네일 URL 생성
 * @param url - 원본 이미지 URL
 * @param size - 'list' | 'detail' | 'original' (현재 Supabase Storage에서 변환 미지원으로 무시됨)
 * @returns 이미지 URL
 */
export const getThumbnailUrl = (url: string | null | undefined, size: ImageSize = 'list'): string | null => {
  if (!url) return null;
  
  // ⚠️ Supabase Storage에서 이미지 변환 파라미터 미지원
  // 원본 URL을 그대로 반환 (CSS object-fit으로 크기 조정)
  return url;
};