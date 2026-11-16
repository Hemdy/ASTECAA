import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function prefixSubpathAssets(html, subpath) {
  return html.replace(
    /\b(href|src)="(?!https?:\/\/|\/\/|\/|data:|#)([^"]+)"/g,
    `$1="${subpath}/$2"`
  );
}

async function sync() {
  const adminDist = resolve(ROOT_DIR, 'dist/admin');
  const websiteDist = resolve(ROOT_DIR, 'dist/astecaa/browser');
  const websiteAdminDist = resolve(ROOT_DIR, 'dist/astecaa/browser/admin');
  const appsAdminDist = resolve(ROOT_DIR, 'apps/admin/dist');
  const appsWebsiteDist = resolve(ROOT_DIR, 'apps/website/dist');

  // 1. Sync Admin if built
  if (existsSync(resolve(adminDist, 'index.html'))) {
    // Clean any legacy broken nested /admin folder inside dist/admin
    await rm(resolve(adminDist, 'admin'), { recursive: true, force: true });

    // Mirror to website /admin subpath if website was also built
    if (existsSync(websiteDist)) {
      await rm(websiteAdminDist, { recursive: true, force: true });
      await mkdir(websiteAdminDist, { recursive: true });
      await cp(adminDist, websiteAdminDist, { recursive: true });

      const subpathIndexHtml = resolve(websiteAdminDist, 'index.html');
      if (existsSync(subpathIndexHtml)) {
        const html = await readFile(subpathIndexHtml, 'utf8');
        // Keep <base href="/"> so /admin/* Angular routes resolve identically,
        // while prefixing relative bundle scripts/stylesheets with /admin/.
        await writeFile(subpathIndexHtml, prefixSubpathAssets(html, '/admin'), 'utf8');
      }
    }

    // Sync to apps/admin/dist (when Vercel Root Directory is apps/admin)
    await rm(appsAdminDist, { recursive: true, force: true });
    await mkdir(appsAdminDist, { recursive: true });
    await cp(adminDist, appsAdminDist, { recursive: true });
  }

  // 2. Sync website build to apps/website/dist (when Vercel Root Directory is apps/website)
  if (existsSync(resolve(websiteDist, 'index.html'))) {
    await rm(appsWebsiteDist, { recursive: true, force: true });
    await mkdir(appsWebsiteDist, { recursive: true });
    await cp(websiteDist, appsWebsiteDist, { recursive: true });
  }

  console.log('[sync-builds] Successfully synced builds.');
}

void sync();
