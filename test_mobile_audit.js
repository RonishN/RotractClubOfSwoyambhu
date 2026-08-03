import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'C:\\Users\\sohai\\.gemini\\antigravity-ide\\brain\\54c094c2-7599-4f28-92cd-bac79441a650\\playwright_audit_final';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  // Emulate iPhone 14
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  console.log('1. Checking Home Page Mobile...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, '01_home_top.png') });

  // Scroll down to team
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '02_home_team.png') });

  // Open Drawer Menu via More button
  console.log('2. Checking Mobile Bottom Nav & Drawer...');
  const moreBtn = await page.locator('.mobile-bottom-nav-bar button:has-text("More"), .mobile-bottom-nav-bar button:has-text("थप")');
  if (await moreBtn.count() > 0) {
    await moreBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, '03_mobile_drawer_open.png') });
    
    // Close drawer by clicking handle or overlay
    await page.locator('.drawer-handle').click();
    await page.waitForTimeout(400);
  }

  console.log('3. Checking Events Page Mobile...');
  await page.goto('http://localhost:5173/events', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, '04_events_page.png') });

  console.log('4. Checking Gallery Page Mobile...');
  await page.goto('http://localhost:5173/gallery', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, '05_gallery_page.png') });

  console.log('5. Checking Login Page Mobile...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, '06_login_page.png') });

  // Fill in login credentials
  console.log('6. Logging in as Admin...');
  await page.fill('#username', 'sohail');
  await page.fill('#password', 'Sohailk@2064');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1000);

  console.log('7. Checking Admin Settings Mobile...');
  await page.screenshot({ path: path.join(OUT_DIR, '07_admin_settings.png') });

  console.log('8. Checking Admin Events Mobile...');
  await page.goto('http://localhost:5173/admin/events', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '08_admin_events.png') });

  console.log('9. Checking Manage Admins Mobile...');
  await page.goto('http://localhost:5173/admin/manage', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '09_admin_manage.png') });

  console.log('10. Checking Audit Logs Mobile...');
  await page.goto('http://localhost:5173/admin/logs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '10_admin_logs.png') });

  console.log('11. Checking Visual Editor Mobile...');
  await page.goto('http://localhost:5173/admin/edit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '11_admin_visual_editor.png') });

  console.log('12. Checking Gallery Visual Editor Mobile...');
  await page.goto('http://localhost:5173/admin/edit/gallery', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '12_admin_gallery_editor.png') });

  await browser.close();
  console.log('✅ Audit Completed Successfully!');
}

run().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
