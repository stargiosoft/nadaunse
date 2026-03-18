/**
 * 미래 예측기 공유 카드 이미지 생성 (Canvas → Blob)
 *
 * 다크 그라데이션 배경 + 유형 이름 + 스펙트럼 미니 바 + 브랜딩
 * 1080×1080 (인스타 정방형 최적화)
 */

const CATEGORY_EMOJI: Record<string, string> = {
  '연애': '💕', '재물': '💰', '학업': '📚', '직장': '💼',
};

const SPECTRUM_COLORS = ['#FF5722', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'];

interface FuturePredictionCardParams {
  category: string;
  attitudeType: string;
  attitudeDescription: string;
  spectrumPosition: number;
  spectrumLabel: string;
}

export async function generateFuturePredictionCardBlob(
  params: FuturePredictionCardParams,
): Promise<Blob> {
  const { category, attitudeType, attitudeDescription, spectrumPosition, spectrumLabel } = params;
  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const emoji = CATEGORY_EMOJI[category] || '🔮';

  // ─── 다크 그라데이션 배경 ───
  const bgGrad = ctx.createLinearGradient(0, 0, SIZE * 0.4, SIZE);
  bgGrad.addColorStop(0, '#0f1923');
  bgGrad.addColorStop(0.5, '#162830');
  bgGrad.addColorStop(1, '#1e3a3a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ─── 장식: 별 점들 ───
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = Math.random() * 1.5 + 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ─── 장식: 글로우 원 ───
  const glow1 = ctx.createRadialGradient(SIZE * 0.7, SIZE * 0.25, 0, SIZE * 0.7, SIZE * 0.25, SIZE * 0.3);
  glow1.addColorStop(0, 'rgba(72, 178, 175, 0.15)');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.beginPath();
  ctx.arc(SIZE * 0.7, SIZE * 0.25, SIZE * 0.3, 0, Math.PI * 2);
  ctx.fill();

  const glow2 = ctx.createRadialGradient(SIZE * 0.25, SIZE * 0.75, 0, SIZE * 0.25, SIZE * 0.75, SIZE * 0.2);
  glow2.addColorStop(0, 'rgba(156, 100, 235, 0.12)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.beginPath();
  ctx.arc(SIZE * 0.25, SIZE * 0.75, SIZE * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // ─── 상단: 카테고리 ───
  ctx.font = '500 36px "Pretendard Variable", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(`${emoji} ${category} 미래 예측`, SIZE / 2, 140);

  // ─── 중앙: 유형 이름 (크게) ───
  ctx.font = '800 96px "Pretendard Variable", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  // 긴 유형명은 크기 조절
  let fontSize = 96;
  while (ctx.measureText(attitudeType).width > SIZE - 160 && fontSize > 48) {
    fontSize -= 4;
    ctx.font = `800 ${fontSize}px "Pretendard Variable", sans-serif`;
  }
  ctx.fillText(attitudeType, SIZE / 2, SIZE * 0.4);

  // ─── 유형 설명 (2줄까지) ───
  ctx.font = '400 32px "Pretendard Variable", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  const maxLineWidth = SIZE - 160;
  const descLines = wrapText(ctx, attitudeDescription, maxLineWidth);
  for (let i = 0; i < Math.min(descLines.length, 2); i++) {
    ctx.fillText(descLines[i], SIZE / 2, SIZE * 0.4 + 60 + i * 44);
  }

  // ─── 스펙트럼 미니 바 ───
  const barWidth = SIZE * 0.5;
  const barHeight = 14;
  const barX = (SIZE - barWidth) / 2;
  const barY = SIZE * 0.65;

  // 라벨
  ctx.font = '500 24px "Pretendard Variable", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('파극', barX, barY - 14);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#48b2af';
  ctx.fillText(spectrumLabel, SIZE / 2, barY - 14);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('대성', barX + barWidth, barY - 14);

  // 바 배경 (그라데이션)
  const barGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  SPECTRUM_COLORS.forEach((color, i) => {
    barGrad.addColorStop(i / (SPECTRUM_COLORS.length - 1), color);
  });
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 7);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 포인터
  const pointerX = barX + barWidth * spectrumPosition;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(pointerX, barY + barHeight / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#48b2af';
  ctx.beginPath();
  ctx.arc(pointerX, barY + barHeight / 2, 7, 0, Math.PI * 2);
  ctx.fill();

  // ─── 하단: 브랜딩 ───
  ctx.font = '400 28px "Pretendard Variable", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center';
  ctx.fillText('nadaunse.com', SIZE / 2, SIZE - 60);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
      0.92,
    );
  });
}

/** 텍스트 줄바꿈 유틸 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}
