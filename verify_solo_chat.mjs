import { chromium } from 'playwright';
const BASE = 'https://kentaxi-web-ten.vercel.app';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 420, height: 820 } });

  // 로그인
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"]').fill('test_kentaxi@kentech.ac.kr');
  await page.locator('input[type="password"]').fill('test1234!');
  await page.locator('button[type="submit"]').click();
  await sleep(2000);

  // 메인 → 내일 날짜 → 팟 생성
  await page.goto(BASE);
  await sleep(2000);
  await page.locator('button', { hasText: '내일' }).click();
  await sleep(1500);
  await page.locator('button', { hasText: '새로운 팟 만들기' }).click();
  await sleep(800);
  await page.locator('button', { hasText: '팟 생성 확정' }).click();
  await sleep(1500);
  await page.screenshot({ path: 'solo_01_chat_open.png' });

  // 메시지 전송 시도
  const input = page.locator('input[placeholder*="메시지"]');
  const isDisabled = await input.isDisabled();
  console.log('입력창 비활성화:', isDisabled);
  await input.fill('혼자라도 채팅 테스트!');

  const sendBtn = page.locator('button[type="submit"]').last();
  const btnDisabled = await sendBtn.isDisabled();
  console.log('전송 버튼 비활성화:', btnDisabled);

  await sendBtn.click();
  await sleep(1500);
  await page.screenshot({ path: 'solo_02_after_send.png' });

  const msgVisible = await page.locator('text=혼자라도 채팅 테스트').isVisible().catch(() => false);
  console.log('메시지 표시됨:', msgVisible);

  await sleep(1000);
  await browser.close();
})();
