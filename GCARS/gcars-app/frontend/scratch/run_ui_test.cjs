const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting UI E2E test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 1. Go to frontend
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:5173/');
    
    // 2. Login as super admin
    console.log('🔐 Logging in as superadmin...');
    await page.fill('input[type="text"]', 'superadmin');
    await page.fill('input[type="password"]', 'SuperAdmin@2026');
    await page.click('button[type="submit"]');
    
    // 3. Wait for dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForTimeout(2000); // give time for dashboard load
    
    // 4. Take a screenshot of the main dashboard to verify the committed budget is visible
    console.log('📸 Taking screenshot of Super Admin Dashboard...');
    const outDir = 'C:\\Users\\Sabarnik Lahiri\\.gemini\\antigravity-ide\\brain\\7d415b5b-12aa-4a64-884a-879c69a1c631';
    await page.screenshot({ path: path.join(outDir, 'dashboard.png'), fullPage: true });

    // 5. Navigate to Budget Allocation
    console.log('➡️ Navigating to Budget Allocation...');
    await page.goto('http://localhost:5173/budget-allocation');
    await page.waitForTimeout(2000);
    
    console.log('📸 Taking screenshot of Budget Allocation...');
    await page.screenshot({ path: path.join(outDir, 'budget_allocation.png'), fullPage: true });

    console.log('✅ UI Test completed successfully! Screenshots saved to artifacts.');
  } catch (error) {
    console.error('❌ UI Test failed:', error);
  } finally {
    await browser.close();
  }
})();
