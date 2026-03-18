/**
 * 국립국어원 표준국어대사전 API에서 성격 관련 형용사 추출 스크립트
 *
 * 사용법:
 *   npx tsx src/data/태그\ 정규화/extract-personality-adjectives.ts
 *
 * 필요:
 *   - .env.local에 STDICT_API_KEY 설정
 *   - npm install dotenv (또는 프로젝트에 이미 있으면 생략)
 *
 * 출력:
 *   src/data/태그 정규화/extracted-adjectives.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// .env.local에서 API 키 읽기
const envPath = path.resolve(__dirname, '../../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/STDICT_API_KEY=(.+)/);
const API_KEY = apiKeyMatch?.[1]?.trim();

if (!API_KEY) {
  console.error('❌ .env.local에서 STDICT_API_KEY를 찾을 수 없습니다.');
  process.exit(1);
}

const BASE_URL = 'https://stdict.korean.go.kr/api/search.do';

// 뜻풀이에서 검색할 키워드 목록 (성격/성품 관련)
const SEARCH_KEYWORDS = [
  '성격',
  '성질',
  '성품',
  '태도',
  '마음',
  '심성',
  '됨됨이',
  '사람이',
  '성미',
  '심보',
  '기질',
  '마음씨',
  '인품',
  '품성',
  '심지',
  '기상',
  '도량',
  '심술',
  '성정',
  '성벽',
  '심사',
  '품행',
  '인격',
  '기개',
  '기풍',
  '심성이',
  '성깔',
  '천성',
  '본성',
  '기질이',
];

interface DictionaryItem {
  word: string;
  sup_no: string;
  target_code: string;
  pos: string;
  origin?: string;
  sense: {
    definition: string;
    link: string;
    type: string;
  };
}

interface SearchResult {
  channel: {
    total: number;
    start: number;
    num: number;
    item?: DictionaryItem[];
  };
}

interface ExtractedAdjective {
  /** 표제어 (예: "간거-하다" → "간거하다") */
  word: string;
  /** 뜻풀이 */
  definition: string;
  /** 한자 원어 */
  origin: string;
  /** 사전 링크 */
  link: string;
  /** 어떤 키워드로 검색되었는지 */
  matchedKeywords: string[];
}

async function fetchAdjectives(
  keyword: string,
  start: number = 1,
  num: number = 100
): Promise<SearchResult> {
  const params = new URLSearchParams({
    key: API_KEY!,
    q: keyword,
    req_type: 'json',
    advanced: 'y',
    pos: '6', // 형용사
    target: '8', // 뜻풀이 검색
    method: 'include',
    num: String(num),
    start: String(start),
  });

  const url = `${BASE_URL}?${params}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`API 요청 실패: ${resp.status} ${resp.statusText}`);
  }

  return resp.json();
}

async function fetchAllForKeyword(
  keyword: string
): Promise<DictionaryItem[]> {
  const allItems: DictionaryItem[] = [];
  let start = 1;
  const num = 100;

  // 첫 요청으로 total 확인
  const firstResult = await fetchAdjectives(keyword, start, num);
  const total = firstResult.channel?.total ?? 0;

  if (total === 0) {
    console.log(`  "${keyword}" → 결과 없음`);
    return allItems;
  }

  if (firstResult.channel?.item) {
    allItems.push(...firstResult.channel.item);
  }

  console.log(`  "${keyword}" → 총 ${total}건`);

  // 나머지 페이지 가져오기
  while (allItems.length < total && start + num <= 1000) {
    start += num;
    await sleep(300); // API 부하 방지

    try {
      const result = await fetchAdjectives(keyword, start, num);
      if (result.channel?.item) {
        allItems.push(...result.channel.item);
      } else {
        break; // 더 이상 결과 없음
      }
    } catch {
      break;
    }
  }

  return allItems;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWord(word: string): string {
  // "간거-하다" → "간거하다", "까다-롭다" → "까다롭다"
  return word.replace(/-/g, '');
}

async function main() {
  console.log('🔍 국립국어원 표준국어대사전에서 성격 형용사 추출 시작\n');
  console.log(`검색 키워드: ${SEARCH_KEYWORDS.length}개`);
  console.log('─'.repeat(50));

  // target_code 기준으로 중복 제거 (같은 단어가 여러 키워드에서 검색될 수 있음)
  const adjMap = new Map<string, ExtractedAdjective>();
  let totalApiCalls = 0;

  for (const keyword of SEARCH_KEYWORDS) {
    await sleep(500); // 키워드 간 간격

    try {
      const items = await fetchAllForKeyword(keyword);
      totalApiCalls++;

      for (const item of items) {
        const code = item.target_code;
        const word = normalizeWord(item.word);

        if (adjMap.has(code)) {
          // 이미 있으면 matchedKeywords에 추가
          adjMap.get(code)!.matchedKeywords.push(keyword);
        } else {
          adjMap.set(code, {
            word,
            definition: item.sense.definition,
            origin: item.origin || '',
            link: item.sense.link,
            matchedKeywords: [keyword],
          });
        }
      }
    } catch (err) {
      console.error(`  ⚠️ "${keyword}" 검색 실패:`, err);
    }
  }

  // 결과 정렬 (가나다순)
  const results = Array.from(adjMap.values()).sort((a, b) =>
    a.word.localeCompare(b.word, 'ko')
  );

  console.log('\n' + '─'.repeat(50));
  console.log(`✅ 추출 완료!`);
  console.log(`   총 API 호출: ${totalApiCalls}회`);
  console.log(`   고유 형용사: ${results.length}개`);
  console.log(
    `   다중 키워드 매칭: ${results.filter((r) => r.matchedKeywords.length > 1).length}개`
  );

  // 카테고리별 통계
  const keywordStats = new Map<string, number>();
  for (const r of results) {
    for (const kw of r.matchedKeywords) {
      keywordStats.set(kw, (keywordStats.get(kw) || 0) + 1);
    }
  }
  console.log('\n📊 키워드별 검색 결과:');
  for (const [kw, count] of [...keywordStats.entries()].sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`   ${kw}: ${count}개`);
  }

  // JSON 저장
  const outputPath = path.resolve(__dirname, 'extracted-adjectives.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        _meta: {
          source: '국립국어원 표준국어대사전 오픈 API',
          extractedAt: new Date().toISOString(),
          totalAdjectives: results.length,
          searchKeywords: SEARCH_KEYWORDS,
        },
        adjectives: results,
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`\n💾 저장 완료: ${outputPath}`);

  // 미리보기 (처음 20개)
  console.log('\n📝 미리보기 (처음 20개):');
  for (const adj of results.slice(0, 20)) {
    console.log(`   ${adj.word} — ${adj.definition}`);
  }
}

main().catch(console.error);
