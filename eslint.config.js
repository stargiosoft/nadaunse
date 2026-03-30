import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * 나다운세 ESLint 하네스
 *
 * 전략: 기존 코드 = warn (점진적 개선), 새 코드 = lint-staged --max-warnings=0 으로 강제
 * CLAUDE.md 규칙을 린터로 강제하여 어떤 AI/사람이 코딩하든 동일한 품질 보장 (멱등성)
 */
export default tseslint.config(
  // 무시할 디렉토리
  { ignores: ['dist', 'node_modules', 'supabase', 'scripts', '*.config.*', 'public'] },

  // 기본 규칙
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React + 나다운세 커스텀 규칙
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // ── React ──
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── TypeScript 강제 (CLAUDE.md #2) ──
      '@typescript-eslint/no-explicit-any': 'warn',

      // ── 보안 (CLAUDE.md #12) ──
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // ── 코드 품질 ──
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always'],

      // ── 완화 ──
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-useless-assignment': 'warn',
      'no-empty': 'warn',
    },
  },

  // ── Tailwind 폰트 클래스 금지 (CLAUDE.md #1) ──
  // 기존 코드가 많아서 warn으로 설정, 새 코드는 lint-staged에서 차단
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['warn',
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/\\b(text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|leading-(?:none|tight|snug|normal|relaxed|loose|\\d))\\b/]',
          message: '🚫 Tailwind 폰트 클래스 금지 (CLAUDE.md #1). globals.css 토큰 또는 inline style 사용.',
        },
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/\\btext-\\[\\d/]',
          message: '🚫 text-[size] arbitrary value 금지. inline style={{ fontSize: "..." }} 사용.',
        },
      ],
    },
  },
);
