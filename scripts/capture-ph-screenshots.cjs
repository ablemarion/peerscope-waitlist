/**
 * Product Hunt media kit screenshot capture script
 * Captures portal pages at 1270x760px for PH gallery using Puppeteer
 */
const puppeteer = require('/home/henkisdabro/.nvm/versions/node/v22.16.0/lib/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'ph-launch');
const PH_LAUNCH_DIR = `file://${OUTPUT_DIR}`;
const BASE_URL = 'https://peerscope-waitlist.pages.dev';

const GALLERY_PAGES = [
  {
    name: 'ph-gallery-1-hero',
    url: `${PH_LAUNCH_DIR}/mock-1-dashboard.html`,
    description: 'Agency dashboard — seeded hero shot',
    viewport: { width: 1270, height: 760, deviceScaleFactor: 1 },
    waitFor: 1000,
  },
  {
    name: 'ph-gallery-2-clients',
    url: `${PH_LAUNCH_DIR}/mock-2-clients.html`,
    description: 'Client list view',
    viewport: { width: 1270, height: 760, deviceScaleFactor: 1 },
    waitFor: 1000,
  },
  {
    name: 'ph-gallery-3-report',
    url: `${PH_LAUNCH_DIR}/mock-3-report.html`,
    description: 'Competitor tracking / report detail',
    viewport: { width: 1270, height: 760, deviceScaleFactor: 1 },
    waitFor: 1000,
  },
  {
    name: 'ph-gallery-4-client-portal',
    url: `${PH_LAUNCH_DIR}/mock-4-client-portal.html`,
    description: 'Client portal view',
    viewport: { width: 1270, height: 760, deviceScaleFactor: 1 },
    waitFor: 1000,
  },
  {
    name: 'ph-gallery-5-signup',
    url: `${BASE_URL}/portal/signup`,
    description: '/portal/signup page',
    viewport: { width: 1270, height: 760, deviceScaleFactor: 1 },
    waitFor: 2000,
  },
  {
    name: 'ph-thumbnail',
    url: `file://${path.join(__dirname, '..', 'product-hunt-assets', 'thumbnail.html')}`,
    description: 'Thumbnail 240x240',
    viewport: { width: 240, height: 240, deviceScaleFactor: 2 },
    waitFor: 500,
    clip: { x: 0, y: 0, width: 240, height: 240 },
  },
];

const PAGES = GALLERY_PAGES;

async function captureScreenshots() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  for (const pageConfig of PAGES) {
    console.log(`Capturing: ${pageConfig.description}`);
    const page = await browser.newPage();

    try {
      await page.setViewport(pageConfig.viewport);
      const waitUntil = pageConfig.url.startsWith('file://') ? 'networkidle0' : 'networkidle2';
      await page.goto(pageConfig.url, { waitUntil, timeout: 20000 });
      await new Promise(r => setTimeout(r, pageConfig.waitFor));

      const outputPath = path.join(OUTPUT_DIR, `${pageConfig.name}.png`);
      const clip = pageConfig.clip || { x: 0, y: 0, width: pageConfig.viewport.width, height: pageConfig.viewport.height };
      await page.screenshot({
        path: outputPath,
        fullPage: false,
        clip,
      });

      const stat = fs.statSync(outputPath);
      console.log(`  ✓ ${pageConfig.name}.png (${Math.round(stat.size / 1024)}KB)`);
    } catch (err) {
      console.error(`  ✗ Failed ${pageConfig.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to public/ph-launch/');
}

captureScreenshots().catch(console.error);
