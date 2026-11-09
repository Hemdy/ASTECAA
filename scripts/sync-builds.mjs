import { cp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function sync() {
  const adminDist = resolve(ROOT_DIR, 'dist/admin');
  const websiteDist = resolve(ROOT_DIR, 'dist/astecaa/browser');
  const websiteAdminDist = resolve(ROOT_DIR, 'dist/astecaa/browser/admin');
  const appsAdminDist = resolve(ROOT_DIR, 'apps/admin/dist');
  const appsWebsiteDist = resolve(ROOT_DIR, 'apps/website/dist');
  const adminSubfolderInAdminDist = resolve(ROOT_DIR, 'dist/admin/admin');

  // 1. Sync Admin if built
  if (existsSync(resolve(adminDist, 'index.html'))) {
    await mkdir(adminSubfolderInAdminDist, { recursive: true });
    await cp(resolve(adminDist, 'index.html'), resolve(adminSubfolderInAdminDist, 'index.html'));
    if (existsSync(resolve(adminDist, 'main.js'))) {
      await cp(resolve(adminDist, 'main.js'), resolve(adminSubfolderInAdminDist, 'main.js'));
    }
    if (existsSync(resolve(adminDist, 'styles.css'))) {
      await cp(resolve(adminDist, 'styles.css'), resolve(adminSubfolderInAdminDist, 'styles.css'));
    }
    if (existsSync(resolve(adminDist, 'api-config.js'))) {
      await cp(resolve(adminDist, 'api-config.js'), resolve(adminSubfolderInAdminDist, 'api-config.js'));
    }
    if (existsSync(resolve(adminDist, 'images'))) {
      await cp(resolve(adminDist, 'images'), resolve(adminSubfolderInAdminDist, 'images'), { recursive: true });
    }

    // Mirror to website admin subpath if website was also built
    if (existsSync(websiteDist)) {
      await mkdir(websiteAdminDist, { recursive: true });
      await cp(adminDist, websiteAdminDist, { recursive: true });

      const subpathIndexHtml = resolve(websiteAdminDist, 'index.html');
      if (existsSync(subpathIndexHtml)) {
        let html = await readFile(subpathIndexHtml, 'utf8');
        html = html.replace('<base href="/"', '<base href="/admin/"');
        await writeFile(subpathIndexHtml, html, 'utf8');
      }
    }

    // Sync to apps/admin/dist (when Vercel Root Directory is apps/admin)
    await mkdir(appsAdminDist, { recursive: true });
    await cp(adminDist, appsAdminDist, { recursive: true });
  }

  // 2. Sync website build to apps/website/dist (when Vercel Root Directory is apps/website)
  if (existsSync(resolve(websiteDist, 'index.html'))) {
    await mkdir(appsWebsiteDist, { recursive: true });
    await cp(websiteDist, appsWebsiteDist, { recursive: true });
  }

  console.log('[sync-builds] Successfully synced builds.');
}

void sync();
