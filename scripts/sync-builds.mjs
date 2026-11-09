import { cp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function sync() {
  const adminDist = resolve(ROOT_DIR, 'dist/admin');
  const websiteAdminDist = resolve(ROOT_DIR, 'dist/astecaa/browser/admin');
  const appsAdminDist = resolve(ROOT_DIR, 'apps/admin/dist');
  const adminSubfolderInAdminDist = resolve(ROOT_DIR, 'dist/admin/admin');

  if (!existsSync(adminDist)) {
    console.log('[sync-builds] No dist/admin found, skipping sync.');
    return;
  }

  // 1. In dist/admin, mirror files into dist/admin/admin so both / and /admin/ asset requests succeed
  await mkdir(adminSubfolderInAdminDist, { recursive: true });
  await cp(resolve(adminDist, 'index.html'), resolve(adminSubfolderInAdminDist, 'index.html'));
  await cp(resolve(adminDist, 'main.js'), resolve(adminSubfolderInAdminDist, 'main.js'));
  await cp(resolve(adminDist, 'styles.css'), resolve(adminSubfolderInAdminDist, 'styles.css'));
  if (existsSync(resolve(adminDist, 'api-config.js'))) {
    await cp(resolve(adminDist, 'api-config.js'), resolve(adminSubfolderInAdminDist, 'api-config.js'));
  }
  if (existsSync(resolve(adminDist, 'images'))) {
    await cp(resolve(adminDist, 'images'), resolve(adminSubfolderInAdminDist, 'images'), { recursive: true });
  }

  // 2. Sync to dist/astecaa/browser/admin (for monolithic astecaa.vercel.app/admin)
  await mkdir(websiteAdminDist, { recursive: true });
  await cp(adminDist, websiteAdminDist, { recursive: true });

  const subpathIndexHtml = resolve(websiteAdminDist, 'index.html');
  if (existsSync(subpathIndexHtml)) {
    let html = await readFile(subpathIndexHtml, 'utf8');
    html = html.replace('<base href="/"', '<base href="/admin/"');
    await writeFile(subpathIndexHtml, html, 'utf8');
  }

  // 3. Sync to apps/admin/dist (when Vercel Root Directory is apps/admin)
  await mkdir(appsAdminDist, { recursive: true });
  await cp(adminDist, appsAdminDist, { recursive: true });

  // 4. Sync website build to apps/website/dist (when Vercel Root Directory is apps/website)
  const websiteDist = resolve(ROOT_DIR, 'dist/astecaa/browser');
  const appsWebsiteDist = resolve(ROOT_DIR, 'apps/website/dist');
  if (existsSync(websiteDist)) {
    await mkdir(appsWebsiteDist, { recursive: true });
    await cp(websiteDist, appsWebsiteDist, { recursive: true });
  }

  console.log('[sync-builds] Successfully synced builds to all standalone and monolithic targets.');
}

void sync();
