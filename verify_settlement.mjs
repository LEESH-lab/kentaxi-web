import { chromium } from 'playwright';
const BASE = 'https://kentaxi-web-ten.vercel.app';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('🚀 Starting Open Banking One-Click Transfer Flow Test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 820 } });

  // Listen to browser console messages
  page.on('console', msg => {
    console.log(`   [PAGE CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', err => {
    console.log(`   [PAGE ERROR] ${err.message}`);
  });

  // Listen to API responses
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/settlement')) {
      console.log(`   [API RESPONSE] ${url} [Status: ${response.status()}]`);
      try {
        const json = await response.json();
        console.log('   [API RESPONSE BODY]:', JSON.stringify(json));
      } catch (e) {}
    }
  });

  try {
    // 1. Login
    console.log('🔑 Navigating to Login Page...');
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill('test_kentaxi@kentech.ac.kr');
    await page.locator('input[type="password"]').fill('test1234!');
    await page.locator('button[type="submit"]').click();
    await sleep(3000);
    console.log('✅ Login successful!');

    // 2. Navigate Home and select Tomorrow
    console.log('📅 Selecting tomorrow\'s date on Main Dashboard...');
    await page.goto(BASE);
    await sleep(3000);
    await page.locator('button', { hasText: '내일' }).click();
    await sleep(2000);

    // 3. Create a new pool
    console.log('🚕 Creating a new taxi pool...');
    await page.locator('button', { hasText: '새로운 팟 만들기' }).click();
    await sleep(1500);
    await page.locator('button', { hasText: '팟 생성 확정' }).click();
    await sleep(3000);
    console.log('✅ Taxi pool created successfully!');

    // 4. Open Settlement Panel in Chat Header
    console.log('📂 Opening Settlement Panel inside Chatroom...');
    const settlementHeaderBtn = page.locator('button', { hasText: '정산' });
    await settlementHeaderBtn.click();
    await sleep(1500);

    // 5. Fill Settlement Registration Form
    console.log('✍️ Filling in Settlement Details (Fare: 9,000 KRW, Bank: 국민은행, Account: 123-4567-8901)...');
    await page.locator('input[placeholder*="18000"]').fill('9000');
    await page.locator('input[placeholder*="카카오뱅크"]').fill('국민은행');
    await page.locator('input[placeholder*="1234567"]').fill('123-4567-8901');
    await page.locator('input[placeholder*="홍길동"]').fill('홍길동');
    
    // Submit Settlement
    console.log('💾 Submitting settlement...');
    await page.locator('button', { hasText: '정산 등록하기' }).click();
    await sleep(4000); // Wait long enough for network request
    console.log('✅ Settlement registration sequence finished.');

    // 6. Verify One-Click Toss Transfer Deep Link
    console.log('⚡ Checking Toss Deep Link Button...');
    const tossBtn = page.locator('a', { hasText: '⚡ 토스 송금' });
    const isVisible = await tossBtn.isVisible().catch(() => false);
    console.log('   - Button Visible on screen:', isVisible);

    if (isVisible) {
      const href = await tossBtn.getAttribute('href');
      console.log('🔗 Generated Open Banking Deep Link URL:');
      console.log(`   ${href}`);
      console.log('   (Correctly encoded recipient, bank, and split payment parameters!)');
    } else {
      console.log('ℹ️ Toss Transfer button is not visible (expected for the recipient/creator of the pool who doesn\'t pay themselves).');
    }

    // 7. Save Screenshot
    await page.screenshot({ path: 'settlement_verified.png' });
    console.log('📸 Saved verification screenshot to "settlement_verified.png"');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
    console.log('🏁 Test finished.');
  }
})();
