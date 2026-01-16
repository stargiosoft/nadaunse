#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');

// Read project config
const projectConfig = require('../.vercel/project.json');
const projectId = projectConfig.projectId;

// Get Vercel token from CLI
let token;
try {
  // Try to get token from vercel CLI
  const tokenOutput = execSync('npx vercel token ls --json 2>/dev/null || echo ""', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();

  if (!tokenOutput) {
    console.error('❌ Could not get Vercel token. Please run: npx vercel login');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error getting Vercel token:', error.message);
  console.log('\n💡 Alternative: Update Production Branch in Vercel Dashboard:');
  console.log('   1. Go to https://vercel.com/stargiosofts-projects/nadaunse/settings/git');
  console.log('   2. Change Production Branch from "main" to "production"');
  console.log('   3. Click Save');
  process.exit(1);
}

// Make API request to update production branch
const data = JSON.stringify({
  gitProductionBranch: 'production'
});

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v9/projects/${projectId}`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': `Bearer ${token}`
  }
};

console.log('🔄 Updating Vercel Production Branch to "production"...');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Production Branch updated successfully!');
      console.log('🚀 Vercel will now deploy from the "production" branch');
    } else {
      console.error('❌ Failed to update Production Branch');
      console.error('Status:', res.statusCode);
      console.error('Response:', responseData);
      console.log('\n💡 Please update manually in Vercel Dashboard:');
      console.log('   https://vercel.com/stargiosofts-projects/nadaunse/settings/git');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('\n💡 Please update manually in Vercel Dashboard:');
  console.log('   https://vercel.com/stargiosofts-projects/nadaunse/settings/git');
});

req.write(data);
req.end();
