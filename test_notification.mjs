import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'https://kentaxi-web-ten.vercel.app';
const SS_DIR = 'C:/Temp/kentaxi-screenshots';
try { mkdirSync(SS_DIR, { recursive: true }); } catch {}

let ssIdx = 0;
async function screenshot(page, name) {
  const path = `${SS_DIR}/${String(ssIdx++).padStart(2,'0')}_${name}.png`;
  await page.screenshot({ path });
  console.log(`  📸 ${path}`);
  return path;
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 20000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  // Wait for page to fully load (trains + pots)
  await page.waitForTimeout(3000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── Step 1: User A 로그인 및 팟 생성 ──
  console.log('\n[Step 1] 테스터A 로그인...');
  const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageA = await ctxA.newPage();
  await login(pageA, 'testa@kentech.ac.kr', 'test1234');
  await screenshot(pageA, 'userA_home');
  console.log('  ✅ 로그인 완료');

  // 팟 만들기 버튼
  console.log('[Step 2] 팟 생성...');
  await pageA.click('button:has-text("새로운 팟 만들기")');
  await pageA.waitForTimeout(1000);
  await screenshot(pageA, 'userA_sheet');

  // 팟 생성 확정
  await pageA.click('button:has-text("팟 생성 확정")');
  await pageA.waitForTimeout(2000);
  await screenshot(pageA, 'userA_after_create');
  console.log('  ✅ 팟 생성 완료');

  // 채팅방에서 뒤로 가기 (← 버튼)
  try {
    const backBtn = pageA.locator('header button').first();
    await backBtn.click({ timeout: 3000 });
    await pageA.waitForTimeout(1000);
  } catch {}
  await screenshot(pageA, 'userA_main_waiting');
  console.log('  ✅ 메인화면으로 복귀 - 알림 대기 중');

  // ── Step 3: User B 로그인 ──
  console.log('\n[Step 3] 테스터B 로그인...');
  const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageB = await ctxB.newPage();
  await login(pageB, 'testb@kentech.ac.kr', 'test1234');
  await screenshot(pageB, 'userB_home');
  console.log('  ✅ 로그인 완료');

  // 팟 목록 확인 (스크롤 후 대기)
  await pageB.evaluate(() => window.scrollTo(0, 300));
  await pageB.waitForTimeout(2000);
  await screenshot(pageB, 'userB_pots_list');

  // "참여하기" 버튼 찾기 (최대 15초 대기)
  console.log('[Step 4] 팟 참여하기 버튼 찾는 중...');
  let joined = false;
  for (let i = 0; i < 3; i++) {
    try {
      const btn = pageB.locator('button:has-text("참여하기")').first();
      await btn.waitFor({ timeout: 5000 });
      await screenshot(pageB, 'userB_found_join_button');
      await btn.click();
      await pageB.waitForTimeout(2000);
      await screenshot(pageB, 'userB_joined');
      console.log('  ✅ 팟 참여 완료!');
      joined = true;
      break;
    } catch {
      console.log(`  ⏳ 재시도 ${i+1}/3... 페이지 새로고침`);
      await pageB.reload();
      await pageB.waitForTimeout(3000);
    }
  }

  if (!joined) {
    await screenshot(pageB, 'userB_no_join_button');
    console.log('  ⚠️  "참여하기" 버튼을 찾지 못했습니다. 팟이 이미 내 팟이거나 다른 날에 있을 수 있습니다.');

    // API로 직접 확인
    const potsResp = await pageB.evaluate(async () => {
      const r = await fetch('/api/pots');
      return r.json();
    });
    console.log('  API 팟 목록:', JSON.stringify(potsResp.slice(0,3).map(p => ({ id: p.id, users: p._count.users, capacity: p.capacity }))));
  }

  // ── Step 5: User A 알림 확인 ──
  console.log('\n[Step 5] 테스터A 화면 알림 확인 (최대 10초)...');
  let toastFound = false;
  for (let i = 0; i < 10; i++) {
    await pageA.waitForTimeout(1000);
    const toast = await pageA.locator('text=새 파티원이 합류했습니다').isVisible().catch(() => false);
    if (toast) {
      toastFound = true;
      await screenshot(pageA, 'userA_TOAST_NOTIFICATION');
      console.log(`  ✅✅✅ 토스트 알림 확인! (${i+1}초 후)`);
      break;
    }
  }
  if (!toastFound) {
    await screenshot(pageA, 'userA_after_10s');
    console.log('  ⚠️  토스트가 4초 안에 사라졌거나 미감지. 채팅으로 시스템 메시지 확인...');
  }

  // ── Step 6: User A 채팅에서 시스템 메시지 확인 ──
  console.log('\n[Step 6] 채팅방 시스템 메시지 확인...');
  try {
    const chatBtn = pageA.locator('button:has-text("채팅")').first();
    await chatBtn.click({ timeout: 5000 });
    await pageA.waitForTimeout(3000);
    await screenshot(pageA, 'userA_chat_room');

    const sysMsg = await pageA.locator('text=팟에 참여했습니다').isVisible().catch(() => false);
    if (sysMsg) {
      await screenshot(pageA, 'userA_SYSTEM_MSG_FOUND');
      console.log('  ✅✅✅ 채팅방 시스템 메시지 확인: "테스터B님이 팟에 참여했습니다"');
    } else {
      console.log('  ⚠️  채팅방에서 시스템 메시지 미감지');
    }
  } catch (e) {
    console.log('  채팅 버튼 오류:', e.message.split('\n')[0]);
  }

  await browser.close();
  console.log(`\n✅ 테스트 종료. 스크린샷 폴더: ${SS_DIR}`);
})();
