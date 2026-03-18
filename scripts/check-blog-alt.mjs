// Temp script to check blog post content for missing alt attributes
const ANON_KEY = process.env.ANON_KEY;
const resp = await fetch(
  "https://kcthtpmxffppfbkjjkub.supabase.co/rest/v1/blog_posts?status=eq.published&select=slug,content&limit=31",
  {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  }
);
const data = await resp.json();
let totalMissing = 0;
for (const post of data) {
  const content = post.content || "";
  const imgs = content.match(/<img[^>]*>/g) || [];
  const missing = imgs.filter((img) => {
    return !img.includes("alt=") || img.includes('alt=""');
  });
  if (missing.length) {
    console.log(`[${post.slug}] ${missing.length} missing/empty alt:`);
    for (const m of missing) {
      console.log(`  ${m.substring(0, 120)}`);
    }
    totalMissing += missing.length;
  }
}
console.log(`\nTotal missing/empty alt in blog content: ${totalMissing}`);
console.log(`Total blog posts checked: ${data.length}`);
