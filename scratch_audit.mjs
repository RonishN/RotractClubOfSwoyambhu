import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('C:/Users/sohai/.gemini/antigravity-ide/brain/54c094c2-7599-4f28-92cd-bac79441a650/playwright_audit');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();
  const issues = [];

  const checkOverflow = async (pageName) => {
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth ||
             document.body.scrollWidth > window.innerWidth;
    });
    if (hasHorizontalScroll) {
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientW = await page.evaluate(() => document.documentElement.clientWidth);
      issues.push(`[OVERFLOW] ${pageName}: scrollWidth (${scrollW}px) > clientWidth (${clientW}px)`);
    }
  };

  console.log('--- 1. Testing Homepage ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await checkOverflow('Home Page');
  await page.screenshot({ path: path.join(outDir, '01_home_top.png') });
  
  // Scroll down homepage
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '01_home_initiatives.png') });

  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '01_home_team.png') });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '01_home_footer.png') });

  console.log('--- 2. Testing Events Page ---');
  await page.goto('http://localhost:5173/events', { waitUntil: 'networkidle' });
  await checkOverflow('Events Page');
  await page.screenshot({ path: path.join(outDir, '02_events.png'), fullPage: false });

  console.log('--- 3. Testing Gallery Page ---');
  await page.goto('http://localhost:5173/gallery', { waitUntil: 'networkidle' });
  await checkOverflow('Gallery Page');
  await page.screenshot({ path: path.join(outDir, '03_gallery.png'), fullPage: false });

  console.log('--- 4. Testing Login Page ---');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await checkOverflow('Login Page');
  await page.screenshot({ path: path.join(outDir, '04_login.png') });

  // Test Forgot Password Flow
  const forgotBtn = await page.$('text=Forgot password?');
  if (forgotBtn) {
    await forgotBtn.click();
    await page.waitForTimeout(300);
    await checkOverflow('Forgot Password Screen');
    await page.screenshot({ path: path.join(outDir, '04_forgot_password.png') });
    
    // Go back to login
    const backBtn = await page.$('text=Back to Sign In');
    if (backBtn) await backBtn.click();
    await page.waitForTimeout(300);
  }

  console.log('--- 5. Logging into Admin ---');
  await page.fill('input[type="text"]', 'sohail');
  await page.fill('input[type="password"]', 'Sohailk@2064');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  console.log('Current URL after login:', page.url());
  await checkOverflow('Admin Settings');
  await page.screenshot({ path: path.join(outDir, '05_admin_settings.png') });

  console.log('--- 6. Testing Admin Events ---');
  await page.goto('http://localhost:5173/admin/events', { waitUntil: 'networkidle' });
  await checkOverflow('Admin Events');
  await page.screenshot({ path: path.join(outDir, '06_admin_events.png') });

  console.log('--- 7. Testing Manage Admins ---');
  await page.goto('http://localhost:5173/admin/manage', { waitUntil: 'networkidle' });
  await checkOverflow('Manage Admins');
  await page.screenshot({ path: path.join(outDir, '07_admin_manage.png') });

  console.log('--- 8. Testing Audit Logs ---');
  await page.goto('http://localhost:5173/admin/logs', { waitUntil: 'networkidle' });
  await checkOverflow('Audit Logs');
  await page.screenshot({ path: path.join(outDir, '08_admin_logs.png') });

  console.log('--- 9. Testing Admin Edit Page (Content Editor) ---');
  await page.goto('http://localhost:5173/admin/edit', { waitUntil: 'networkidle' });
  await checkOverflow('Admin Edit Page');
  await page.screenshot({ path: path.join(outDir, '09_admin_edit.png') });

  console.log('--- 10. Testing Gallery Edit Page (Gallery Manager) ---');
  await page.goto('http://localhost:5173/admin/edit/gallery', { waitUntil: 'networkidle' });
  await checkOverflow('Gallery Edit Page');
  await page.screenshot({ path: path.join(outDir, '10_gallery_edit.png') });

  console.log('\n================ AUDIT REPORT ================');
  if (issues.length === 0) {
    console.log('No horizontal overflow detected!');
  } else {
    console.log('Issues detected:');
    issues.forEach(i => console.log(' - ' + i));
  }
  console.log('Screenshots saved to:', outDir);

  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
