// 프로덕션 DB: 중복 본인 사주 정리 스크립트
// 각 사용자당 가장 오래된(원본) 본인 사주만 유지, 나머지 삭제
const https = require('https');

const BASE = 'https://kcthtpmxffppfbkjjkub.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdGh0cG14ZmZwcGZia2pqa3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAzOTE1MSwiZXhwIjoyMDgxNjE1MTUxfQ.Atr2OS7rkqsmkfxi2qdWwbSqvBUrwCozbz5l121oKeQ';
const headers = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

function del(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'DELETE', headers }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // 1. 본인 사주 전체 조회
  const data = await fetch(`${BASE}/saju_records?select=user_id,id,full_name,notes,birth_date,created_at,is_primary&notes=eq.%EB%B3%B8%EC%9D%B8&order=user_id,created_at.asc`);

  // 2. 사용자별 그룹핑
  const byUser = {};
  data.forEach(r => {
    if (!byUser[r.user_id]) byUser[r.user_id] = [];
    byUser[r.user_id].push(r);
  });

  // 3. 중복 사용자 찾기
  const dupes = Object.entries(byUser).filter(([_, records]) => records.length > 1);

  if (dupes.length === 0) {
    console.log('중복 본인 사주 없음!');
    return;
  }

  console.log(`=== 중복 정리 시작 (${dupes.length}명) ===\n`);

  let totalDeleted = 0;

  for (const [userId, records] of dupes) {
    // 유지할 레코드: 이름이 있는 가장 오래된 것 > 없으면 가장 오래된 것
    const withName = records.filter(r => r.full_name && r.full_name.trim());
    const keep = withName.length > 0 ? withName[0] : records[0];
    const toDelete = records.filter(r => r.id !== keep.id);

    console.log(`user_id: ${userId}`);
    console.log(`  유지: ${keep.full_name || '(이름없음)'} | ${keep.birth_date?.slice(0, 10)} | ${keep.id}`);

    for (const r of toDelete) {
      const result = await del(`${BASE}/saju_records?id=eq.${r.id}`);
      const status = result.status === 204 ? '삭제완료' : `실패(${result.status})`;
      console.log(`  삭제: ${r.full_name || '(이름없음)'} | ${r.birth_date?.slice(0, 10)} | ${r.id} → ${status}`);
      if (result.status === 204) totalDeleted++;
    }
    console.log('');
  }

  console.log(`=== 완료: ${totalDeleted}개 삭제 ===`);
}

main().catch(console.error);
