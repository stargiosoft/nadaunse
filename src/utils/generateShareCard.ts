/**
 * Canvas 기반 공유 카드 이미지 생성
 * ResultLabelCard와 동일한 비주얼을 Canvas로 그려 Blob 반환
 */

const ELEMENT_GRADIENT: Record<string, { from: string; to: string; accent: string }> = {
  '목': { from: '#e8f5e9', to: '#c8e6c9', accent: '#43a047' },
  '화': { from: '#fce4ec', to: '#f8bbd0', accent: '#e53935' },
  '토': { from: '#fff8e1', to: '#ffecb3', accent: '#f9a825' },
  '금': { from: '#f3e5f5', to: '#e1bee7', accent: '#8e24aa' },
  '수': { from: '#e3f2fd', to: '#bbdefb', accent: '#1e88e5' },
};

const ELEMENT_EMOJI: Record<string, string> = {
  '목': '🌿', '화': '🔥', '토': '🌏', '금': '⚡', '수': '💧',
};

interface ShareCardParams {
  label: string;
  score: number;
  element: string;
  title: string;
  testTitle: string;
}

export async function generateShareCardBlob(params: ShareCardParams): Promise<Blob> {
  const { label, score, element, title, testTitle } = params;
  const SIZE = 600;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  const grad = ELEMENT_GRADIENT[element] || ELEMENT_GRADIENT['토'];
  const emoji = ELEMENT_EMOJI[element] || '✨';

  // 배경 그라디언트
  const bgGrad = ctx.createLinearGradient(0, 0, SIZE * 0.6, SIZE);
  bgGrad.addColorStop(0, grad.from);
  bgGrad.addColorStop(0.5, grad.to);
  bgGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 장식 원 (우상단)
  const circleGrad1 = ctx.createRadialGradient(SIZE * 0.8, SIZE * 0.1, 0, SIZE * 0.8, SIZE * 0.1, SIZE * 0.3);
  circleGrad1.addColorStop(0, grad.from);
  circleGrad1.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = circleGrad1;
  ctx.beginPath();
  ctx.arc(SIZE * 0.8, SIZE * 0.1, SIZE * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 장식 원 (좌하단)
  const circleGrad2 = ctx.createRadialGradient(SIZE * 0.1, SIZE * 0.9, 0, SIZE * 0.1, SIZE * 0.9, SIZE * 0.2);
  circleGrad2.addColorStop(0, grad.to);
  circleGrad2.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = circleGrad2;
  ctx.beginPath();
  ctx.arc(SIZE * 0.1, SIZE * 0.9, SIZE * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 테스트 제목 (상단)
  ctx.font = '500 22px "Pretendard Variable", sans-serif';
  ctx.fillStyle = '#848484';
  ctx.textAlign = 'center';
  ctx.fillText(testTitle, SIZE / 2, 60);

  // 이모지
  ctx.font = '64px sans-serif';
  ctx.fillText(emoji, SIZE / 2, 190);

  // 라벨 (% 또는 점수)
  const isPercentage = label.includes('%');
  const numericValue = parseInt(label.replace(/[^0-9]/g, ''), 10) || score;

  // 숫자 부분
  ctx.font = `800 ${isPercentage ? 100 : 80}px "Pretendard Variable", sans-serif`;
  ctx.fillStyle = grad.accent;
  ctx.textAlign = 'center';

  const numText = isPercentage ? label.replace('%', '') : String(numericValue);
  const suffix = isPercentage ? '%' : '점';

  // 숫자 + 단위를 함께 측정해서 중앙 정렬
  const numWidth = ctx.measureText(numText).width;
  ctx.font = `700 40px "Pretendard Variable", sans-serif`;
  const suffixWidth = ctx.measureText(suffix).width;
  const totalWidth = numWidth + suffixWidth + 4;
  const startX = (SIZE - totalWidth) / 2;

  // 숫자
  ctx.font = `800 ${isPercentage ? 100 : 80}px "Pretendard Variable", sans-serif`;
  ctx.fillStyle = grad.accent;
  ctx.textAlign = 'left';
  ctx.fillText(numText, startX, 320);

  // 단위
  ctx.font = '700 40px "Pretendard Variable", sans-serif';
  ctx.globalAlpha = 0.7;
  ctx.fillText(suffix, startX + numWidth + 4, 320);
  ctx.globalAlpha = 1;

  // 결과 제목
  ctx.font = '600 24px "Pretendard Variable", sans-serif';
  ctx.fillStyle = '#151515';
  ctx.textAlign = 'center';
  // 긴 제목 2줄 처리
  const maxWidth = SIZE - 80;
  const words = title.split('');
  let line = '';
  const lines: string[] = [];
  for (const char of words) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  const lineY = 380;
  for (let i = 0; i < Math.min(lines.length, 2); i++) {
    ctx.fillText(lines[i], SIZE / 2, lineY + i * 32);
  }

  // 게이지 바
  const barWidth = SIZE * 0.6;
  const barHeight = 10;
  const barX = (SIZE - barWidth) / 2;
  const barY = lines.length > 1 ? 440 : 420;

  // 배경
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 5);
  ctx.fill();

  // 진행
  ctx.fillStyle = grad.accent;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * (numericValue / 100), barHeight, 5);
  ctx.fill();

  // 하단 워터마크
  ctx.font = '400 16px "Pretendard Variable", sans-serif';
  ctx.fillStyle = '#b7b7b7';
  ctx.textAlign = 'center';
  ctx.fillText('nadaunse.com', SIZE / 2, SIZE - 30);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/png',
      0.92,
    );
  });
}
