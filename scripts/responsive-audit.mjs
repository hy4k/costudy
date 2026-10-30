/**
 * Responsive audit for the public entry surfaces (landing, login, signup).
 *
 * Builds nothing and submits no credentials. It serves the existing `dist/`
 * build, drives the real UI with Playwright, and reports three machine-checkable
 * failures per viewport/theme:
 *
 *   1. pageOverflowPx  - page content wider than the viewport (horizontal scroll)
 *   2. viewportOffenders - the leaf elements that stick out past the viewport
 *   3. clipped - elements cut off by an `overflow: hidden` ancestor
 *
 * Usage:  npm run audit:responsive
 *         npm run audit:responsive -- --update   (rewrite the committed baseline)
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import net from 'node:net';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'audit/responsive');
const PORT = Number(process.env.AUDIT_PORT || 4173);
const BASE = `http://127.0.0.1:${PORT}`;

/** Target widths from issue #12, plus a desktop control. */
const VIEWPORTS = [
    { name: '320', width: 320, height: 800 },
    { name: '375', width: 375, height: 812 },
    { name: '390', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 900 },
];
const THEMES = ['light', 'dark'];

/** Tap targets below this are reported as advisory, not failures. */
const MIN_TAP_PX = 44;

const SCREENS = [
    {
        name: 'landing',
        async open(page) {
            await page.goto(BASE, { waitUntil: 'networkidle' });
            await page.getByRole('heading', { name: 'COSTUDY', exact: true }).waitFor({ timeout: 15000 });
        },
    },
    {
        name: 'login',
        async open(page) {
            await page.goto(BASE, { waitUntil: 'networkidle' });
            await page.getByRole('button', { name: 'Candidate Login' }).click();
            await page.getByRole('button', { name: 'Authorize Entry' }).waitFor({ timeout: 15000 });
        },
    },
    {
        name: 'signup',
        async open(page) {
            await page.goto(BASE, { waitUntil: 'networkidle' });
            await page.getByRole('button', { name: 'Start Free' }).click();
            await page.getByRole('heading', { name: /Choose Your/i }).waitFor({ timeout: 15000 });
        },
    },
];

function waitForPort(port, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    return new Promise((resolvePort, rejectPort) => {
        const attempt = () => {
            const socket = net.connect(port, '127.0.0.1');
            socket.once('connect', () => { socket.destroy(); resolvePort(); });
            socket.once('error', () => {
                socket.destroy();
                if (Date.now() > deadline) rejectPort(new Error(`port ${port} never opened`));
                else setTimeout(attempt, 200);
            });
        };
        attempt();
    });
}

/**
 * Collected inside the page. Reports the *leaf* offenders rather than every
 * ancestor of an overflowing node, so the output names the element to fix.
 */
function collectLayoutFacts(minTapPx) {
    const vw = window.innerWidth;
    const describe = (el) => {
        const cls = (el.getAttribute('class') || '').slice(0, 110);
        const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);
        return `${el.tagName.toLowerCase()}${cls ? `.${cls.split(/\s+/).slice(0, 4).join('.')}` : ''}${text ? ` "${text}"` : ''}`;
    };

    /**
     * Decorative nodes are deliberately oversized and clipped (the blurred brand
     * glows are `w-[1000px]` behind an `overflow-hidden` section). Only content a
     * user has to read or tap counts, so require real text and ignore anything
     * non-interactive that is painted purely for effect.
     */
    const isContent = (el) => {
        if (el.ownerSVGElement) return false; // path/circle inside an <svg>
        if (!(el.textContent || '').trim()) return false;
        const cs = getComputedStyle(el);
        if (cs.pointerEvents === 'none') return false;
        if (cs.visibility === 'hidden' || cs.opacity === '0') return false;
        return true;
    };

    const all = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    });
    const content = all.filter(isContent);

    // --- past the viewport ---
    const past = new Set(
        content.filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right - vw > 1 || -r.left > 1;
        })
    );
    const viewportOffenders = [...past]
        .filter((el) => ![...el.children].some((c) => past.has(c)))
        .map((el) => {
            const r = el.getBoundingClientRect();
            return { el: describe(el), overflowRight: Math.round(r.right - vw), overflowLeft: Math.round(-r.left) };
        })
        .filter((o) => o.overflowRight > 1 || o.overflowLeft > 1)
        .sort((a, b) => Math.max(b.overflowRight, b.overflowLeft) - Math.max(a.overflowRight, a.overflowLeft))
        .slice(0, 12);

    // --- cut off by an overflow:hidden ancestor ---
    const clipped = [];
    for (const el of content) {
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
            const ox = getComputedStyle(parent).overflowX;
            if (ox === 'hidden' || ox === 'clip') break;
            parent = parent.parentElement;
        }
        if (!parent || parent === document.body) continue;
        if ([...el.children].length > 0) continue; // leaf content only
        const r = el.getBoundingClientRect();
        const p = parent.getBoundingClientRect();
        const cut = Math.round(Math.max(r.right - p.right, p.left - r.left));
        if (cut > 1) clipped.push({ el: describe(el), cutOffPx: cut, by: describe(parent).slice(0, 60) });
    }

    /**
     * Text wider than the box that holds it. The rect checks above miss this
     * entirely: an `<h1>` can sit well inside the viewport while the word it
     * contains spills out of its own 144px box and gets clipped further up.
     */
    const textOverflow = content
        .filter((el) => {
            const cs = getComputedStyle(el);
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return false; // meant to scroll
            // Measure the element that actually lays the text out. A block-level
            // child sizes itself, so its parent is not the one at fault; inline
            // children (a `<span>` inside a heading) flow as part of this box.
            const hasBlockChild = [...el.children].some((c) => {
                const d = getComputedStyle(c).display;
                return d !== '' && !d.startsWith('inline') && d !== 'contents';
            });
            if (hasBlockChild) return false;
            return el.scrollWidth - el.clientWidth > 1;
        })
        .map((el) => ({ el: describe(el), spillPx: el.scrollWidth - el.clientWidth, boxPx: el.clientWidth }))
        .sort((a, b) => b.spillPx - a.spillPx)
        .slice(0, 12);

    // --- tap targets (advisory) ---
    const smallTargets = [...document.querySelectorAll('a, button, [role="button"]')]
        .map((el) => ({ el: describe(el), rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0 && rect.height < minTapPx)
        .map(({ el, rect }) => ({ el, height: Math.round(rect.height), width: Math.round(rect.width) }))
        .slice(0, 12);

    return {
        pageOverflowPx: Math.max(0, document.documentElement.scrollWidth - vw),
        viewportOffenders,
        clipped: clipped.sort((a, b) => b.cutOffPx - a.cutOffPx).slice(0, 12),
        textOverflow,
        smallTargets,
        // Sanity probe: proves the Tailwind CDN actually applied before we trust any number above.
        tailwindApplied: getComputedStyle(document.body).fontFamily.includes('Jakarta'),
    };
}

async function main() {
    if (!existsSync(resolve(ROOT, 'dist/index.html'))) {
        console.error('dist/ not found — run `npm run build` first.');
        process.exit(2);
    }

    await rm(OUT_DIR, { recursive: true, force: true });
    await mkdir(OUT_DIR, { recursive: true });

    const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
        cwd: ROOT,
        stdio: 'ignore',
        detached: false,
    });
    const shutdown = () => { try { server.kill('SIGTERM'); } catch { /* already gone */ } };
    process.on('exit', shutdown);

    let browser;
    try {
        await waitForPort(PORT);

        // The Tailwind/Fonts CDNs are remote; honour a proxy when one is configured.
        const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
        browser = await chromium.launch({
            // Set AUDIT_CHROMIUM_PATH where a Chromium already exists (CI images,
            // sandboxes) instead of running `npx playwright install`.
            executablePath: process.env.AUDIT_CHROMIUM_PATH || undefined,
            proxy: proxyUrl ? { server: proxyUrl, bypass: '127.0.0.1,localhost' } : undefined,
        });

        const results = [];
        let failures = 0;

        for (const screen of SCREENS) {
            for (const vp of VIEWPORTS) {
                for (const theme of THEMES) {
                    const context = await browser.newContext({
                        viewport: { width: vp.width, height: vp.height },
                        deviceScaleFactor: 1,
                        ignoreHTTPSErrors: true,
                    });
                    const page = await context.newPage();
                    // Layout.tsx owns the `dark` class and re-applies it from
                    // localStorage on mount, so seeding storage before any app code
                    // runs is the only way to actually land in light mode.
                    await page.addInitScript((t) => {
                        try { localStorage.setItem('theme', t); } catch { /* storage blocked */ }
                        document.documentElement.classList.toggle('dark', t === 'dark');
                    }, theme);

                    await screen.open(page);
                    // Tailwind's Play CDN generates styles from a DOM scan; let it settle.
                    await page.waitForTimeout(800);

                    const facts = await page.evaluate(collectLayoutFacts, MIN_TAP_PX);
                    // Never report a theme we did not actually render: the auth screens
                    // sit outside Layout and are dark-only by construction.
                    facts.observedTheme = await page.evaluate(() =>
                        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                    );
                    if (!facts.tailwindApplied) {
                        throw new Error(
                            `Tailwind/webfont did not load for ${screen.name}@${vp.name}/${theme}; ` +
                            'measurements would be meaningless. Check CDN reachability.'
                        );
                    }

                    const id = `${screen.name}-${vp.name}-${theme}`;
                    await page.screenshot({ path: resolve(OUT_DIR, `${id}.png`), fullPage: true });

                    const failed =
                        facts.pageOverflowPx > 0 ||
                        facts.clipped.length > 0 ||
                        facts.viewportOffenders.length > 0 ||
                        facts.textOverflow.length > 0;
                    if (failed) failures++;
                    results.push({ id, screen: screen.name, width: vp.width, theme, failed, ...facts });

                    const flag = failed ? 'FAIL' : 'pass';
                    const themeNote = facts.observedTheme === theme ? '' : `  [rendered ${facts.observedTheme}]`;
                    console.log(
                        `${flag}  ${(id + themeNote).padEnd(26)} scroll=${String(facts.pageOverflowPx).padStart(3)}px  ` +
                        `pastViewport=${facts.viewportOffenders.length}  clipped=${facts.clipped.length}  ` +
                        `textSpill=${facts.textOverflow.length}  smallTaps=${facts.smallTargets.length}`
                    );
                    for (const o of facts.viewportOffenders.slice(0, 3)) {
                        console.log(`        past viewport +${o.overflowRight}px  ${o.el}`);
                    }
                    for (const c of facts.clipped.slice(0, 3)) {
                        console.log(`        clipped ${c.cutOffPx}px  ${c.el}`);
                    }
                    for (const t of facts.textOverflow.slice(0, 3)) {
                        console.log(`        text spills ${t.spillPx}px out of ${t.boxPx}px box  ${t.el}`);
                    }

                    await context.close();
                }
            }
        }

        await writeFile(resolve(OUT_DIR, 'report.json'), `${JSON.stringify(results, null, 2)}\n`);
        console.log(`\n${results.length - failures}/${results.length} combinations pass.`);
        console.log(`Report + screenshots: ${OUT_DIR}`);
        process.exitCode = failures > 0 ? 1 : 0;
    } finally {
        if (browser) await browser.close();
        shutdown();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
