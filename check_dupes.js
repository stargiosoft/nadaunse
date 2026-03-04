// 프로덕션 DB 본인 사주 중복 현황 확인 스크립트
const https = require('https');

const url = 'https://kcthtpmxffppfbkjjkub.supabase.co/rest/v1/saju_records?select=user_id,id,full_name,notes,birth_date,created_at,is_primary&notes=eq.%EB%B3%B8%EC%9D%B8&order=user_id,created_at.asc';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdGh0cG14ZmZwcGZia2pqa3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAzOTE1MSwiZXhwIjoyMDgxNjE1MTUxfQ.Atr2OS7rkqsmkfxi2qdWwbSqvBUrwCozbz5l121oKeQ';

const options = {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
};

https.get(url, options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    if (!Array.isArray(data)) { console.log('Error:', body); return; }

    const counts = {};
    data.forEach(r => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
    const dupes = Object.entries(counts).filter(([_, c]) => c > 1).sort((a, b) => b[1] - a[1]);

    console.log('=== 프로덕션 본인 사주 중복 현황 ===');
    console.log('전체 본인 사주 레코드:', data.length, '개');
    console.log('고유 사용자:', Object.keys(counts).length, '명');
    console.log('본인 사주 2개 이상 사용자:', dupes.length, '명');
    console.log('');

    dupes.forEach(([uid, cnt]) => {
      const records = data.filter(r => r.user_id === uid);
      console.log(`  user_id: ${uid} (${cnt}개)`);
      records.forEach(r => {
        const primary = r.is_primary ? ' [대표]' : '';
        console.log(`    - ${r.full_name || '(이름없음)'} | ${r.birth_date?.slice(0, 10)} | 생성: ${r.created_at?.slice(0, 19)}${primary}`);
      });
      console.log('');
    });
  });
}).on('error', e => console.error('Request error:', e));
