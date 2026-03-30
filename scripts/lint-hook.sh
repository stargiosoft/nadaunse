#!/bin/bash
# Claude Code PostToolUse hook — 편집된 .ts/.tsx 파일 자동 린트
# CLAUDE_TOOL_INPUT 환경변수에서 file_path 추출

FILE=$(echo "$CLAUDE_TOOL_INPUT" | node -e "
  try {
    const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(d.file_path || '');
  } catch { }
" 2>/dev/null)

# .ts/.tsx 파일만 린트
if [[ "$FILE" == *.ts || "$FILE" == *.tsx ]]; then
  cd "/c/Users/gksru/나다운세 원본" 2>/dev/null || cd "C:/Users/gksru/나다운세 원본"
  npx eslint "$FILE" --max-warnings=0 --no-error-on-unmatched-pattern 2>&1 | head -20
fi
