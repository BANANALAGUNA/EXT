chrome.action.onClicked.addListener(function (tab) {
  saveTab(tab)
})

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'save-mht',
    title: 'Save as .mht...',
    contexts: ['all'],
  })
})

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId == 'save-mht') {
    saveTab(tab)
  }
})

async function saveTab(tab: chrome.tabs.Tab) {
  chrome.downloads.download({
    conflictAction: 'prompt',
    filename: `${sanitizeFilename(tab.title)}.mht`,
    saveAs: true,
    url: await captureTabWithLink(tab),
  })
}

// --- Source URL link: added to the page only for the capture (patch AddSourceLink) ---
async function captureTabWithLink(tab: chrome.tabs.Tab) {
  mhtTickReset(); try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectSourceLink,
      args: [tab.url],
    })
  } catch (e) {
    console.warn('SaveAsMHT: could not add source link to this page', e)
  }

  try {
    
    await mhtGuard(tab.id); await mhtLoopSample(tab.id); await mhtMotionTime(tab.id); mhtTick('motionTime'); await mhtAnimState(tab.id); mhtTick('animState'); await mhtExpandVirtualRows(tab.id); mhtTick('linkAndVirtualRows');   await mhtChildFrames(tab.id); mhtTick('childFrames'); await mhtExpandAbsLists(tab.id); mhtTick('fillLists'); await mhtExpandSpacers(tab.id);
    mhtTick('spacers');  await mhtFreezeHidden(tab.id)
    mhtTick('freezeHidden'); await mhtShadowStyles(tab.id);
    mhtTick('shadowStyles'); await mhtLazyThumbs(tab.id);
    mhtTick('lazyThumbs'); await mhtKeepControlColors(tab.id); mhtTick('controlColors'); await mhtMarkNested(tab.id)
    mhtTick('markNested'); await mhtSettleDom(tab.id); mhtTick('settle'); await mhtMotionApply(tab.id); mhtTick('motion'); await mhtTfsApply(tab.id); mhtTick('virtualScroll'); await mhtAutoApply(tab.id); mhtTick('autoMotion'); await mhtChildFramesDedupe(tab.id); return await mhtCaptureWithFrames(tab.id, tab.url)
  } finally {
    try {
        mhtTick('captureTotal'); mhtTickReport(); await mhtAutoCleanup(tab.id); await mhtTfsCleanup(tab.id); await mhtAnimStateCleanup(tab.id); await mhtMotionCleanup(tab.id); await mhtExpandSpacersCleanup(tab.id); await mhtChildFramesCleanup(tab.id); await mhtNestCleanup(tab.id); await mhtVideoFramesCleanup(tab.id); await mhtLazyThumbsCleanup(tab.id);
        await mhtShadowStylesCleanup(tab.id);
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: removeSourceLink,
      })
    } catch (e) {}
  }
}

// Runs inside the page
function injectSourceLink(url: string) {
  const id = '__save_as_mht_source_link__'
  document.getElementById(id)?.remove()
  const a = document.createElement('a')
  a.id = id
  a.href = url
  a.target = '_blank'
  a.rel = 'opener'
  a.title = url
  a.textContent = 'PROCESSING'
  a.style.cssText = [
    'all:initial!important',
    'display:block!important',
    'position:fixed!important',
    'top:8px!important',
    'left:8px!important',
    'z-index:2147483647!important',
    'box-sizing:border-box!important',
    'width:max-content!important', 'inline-size:max-content!important', 'max-width:none!important',
    'padding:7px 18px!important', 'padding-block:7px!important', 'padding-inline:18px!important', 'text-align:center!important',
    'background:#bb1919!important',
    'color:#ffffff!important',
    'border:0!important',
    'border-radius:9999px!important', 'border-start-start-radius:9999px!important', 'border-start-end-radius:9999px!important', 'border-end-start-radius:9999px!important', 'border-end-end-radius:9999px!important',
    'box-shadow:0 2px 10px rgba(0,0,0,.4)!important',
    'font:700 15px/1.4 Arial,Helvetica,sans-serif!important',
    'text-decoration:none!important',
    'white-space:nowrap!important', 'text-transform:uppercase!important',
    'cursor:pointer!important',
    'pointer-events:auto!important',
    'opacity:1!important',
    'visibility:visible!important',
  ].join(';')
  document.documentElement.appendChild(a)
}

// Runs inside the page
function removeSourceLink() {
  document.getElementById('__save_as_mht_source_link__')?.remove();
document.querySelectorAll('[data-save-as-mht-injected]').forEach(function (el: Element) { el.remove(); });
document.querySelectorAll('[data-save-as-mht-vl-style]').forEach(function (el: Element) {
    const v = el.getAttribute('data-save-as-mht-vl-style') || '';
    if (v.charAt(0) === 'S') el.setAttribute('style', v.slice(1)); else el.removeAttribute('style');
    el.removeAttribute('data-save-as-mht-vl-style');
});
    const mhtCs = document.getElementById('__save_as_mht_controls_style__');
    if (mhtCs) mhtCs.remove();
    document.querySelectorAll('[data-save-as-mht-ctl]').forEach(function (el: Element) { el.removeAttribute('data-save-as-mht-ctl'); });
    ;
    document.querySelectorAll('[data-save-as-mht-prev-style]').forEach(function (el: Element) {
        const v = el.getAttribute('data-save-as-mht-prev-style') || '';
        if (v.charAt(0) === 'S') el.setAttribute('style', v.slice(1)); else el.removeAttribute('style');
        el.removeAttribute('data-save-as-mht-prev-style');
    })
}
function sanitizeFilename(filename: string) {
  return filename.replace(/[<>:"/\\|?*\x00-\x1F~]/g, '_')
}

async function captureTabToDataUrl(tabId: number, pageUrl: string) {
  const tabText = await new Promise<string>(function (resolve, reject) {
    chrome.pageCapture.saveAsMHTML({ tabId }, function (mhtmlData) {
      return mhtmlData
        ? resolve(mhtmlData.text())
        : reject(new Error(chrome.runtime.lastError.message))
    })
  })

  mhtTick('saveAsMHTML'); const withFonts = await appendFontParts(mhtFixCidFontUrls(mhtFixSavedLinks(mhtLinkFrameParts(mhtDenestParts(tabText))), pageUrl), pageUrl, tabId)
  mhtTick('fonts'); const withImages = await mhtAppendMissingImages(withFonts, pageUrl, tabId)
  mhtTick('images'); const withVideos = await mhtEmbedDecorVideos(withImages, pageUrl); const withCookies = await appendCookiesPart(withVideos, pageUrl)
  return `data:multipart/related;base64,${btoa(withCookies)}`
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status != 'loading') {
    return
  }

  setPopup(tabId, tab.url)
})

chrome.tabs.query({}).then(function (tabs) {
  tabs.forEach(function (tab) {
    setPopup(tab.id, tab.url)
  })
})

async function setPopup(tabId: number, url: string) {
  if (!/^file:\/\/\/.*\.mht(ml)?$/i.test(url)) {
    return
  }

  const { text, popup }: { text: string; popup: string } =
    (await chrome.permissions.contains({ origins: ['file:///*'] }))
      ? { text: '🛈', popup: 'mht-info.html' }
      : { text: '⚠', popup: 'file-permission.html' }
  chrome.action.setBadgeText({ tabId, text })
  chrome.action.setPopup({ tabId, popup })
}

// === MHT session cookies (patch MhtSessionCookies) ===
const MHT_COOKIES_LOCATION = 'urn:saveasmht:cookies';
function mhtUtf8ToB64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}
function mhtB64ToUtf8(b64: string): string {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}
async function appendCookiesPart(mhtmlText: string, pageUrl: string): Promise<string> {
    try {
        if (!/^https?:/i.test(pageUrl || '')) return mhtmlText;
        const cookies = await chrome.cookies.getAll({ url: pageUrl });
        const payload = JSON.stringify({ url: pageUrl, savedAt: new Date().toISOString(), cookies: cookies });
        try { await chrome.storage.local.set({ ['mhtCookies:' + pageUrl]: payload }); } catch (e) { }
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm) return mhtmlText;
        const pos = mhtmlText.lastIndexOf('--' + bm[1] + '--');
        if (pos < 0) return mhtmlText;
        const b64 = mhtUtf8ToB64(payload).replace(/(.{76})/g, '$1\r\n');
        const part = '--' + bm[1] + '\r\n' +
            'Content-Type: application/json\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            'Content-Location: ' + MHT_COOKIES_LOCATION + '\r\n\r\n' +
            b64 + '\r\n';
        return mhtmlText.slice(0, pos) + part + mhtmlText.slice(pos);
    } catch (e) {
        console.warn('SaveAsMHT: cookie capture failed', e);
        return mhtmlText;
    }
}
function extractSavedCookies(mhtText: string): any {
    const m = mhtText.match(/Content-Location: urn:saveasmht:cookies\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/);
    if (!m) return null;
    try { return JSON.parse(mhtB64ToUtf8(m[1].replace(/\s+/g, ''))); } catch (e) { return null; }
}
async function restoreSavedCookies(list: any[]): Promise<number> {
    let ok = 0, fail = 0;
    const now = Date.now() / 1000;
    for (const c of list || []) {
        try {
            if (c.expirationDate && c.expirationDate < now) continue;
            const host = (c.domain || '').replace(/^\./, '');
            if (!host || !c.name) { fail++; continue; }
            const details: any = {
                url: (c.secure ? 'https://' : 'http://') + host + (c.path || '/'),
                name: c.name,
                value: c.value || '',
                path: c.path || '/',
                secure: !!c.secure,
                httpOnly: !!c.httpOnly,
            };
            if (!c.hostOnly && c.domain) details.domain = c.domain;
            if (c.sameSite) details.sameSite = c.sameSite;
            if (c.expirationDate) details.expirationDate = c.expirationDate;
            if (c.partitionKey) details.partitionKey = c.partitionKey;
            const r = await chrome.cookies.set(details);
            if (r) ok++; else fail++;
        } catch (e) { fail++; }
    }
    console.log('SaveAsMHT: session cookies restored:', ok, 'failed:', fail);
    return ok;
}
function mhtSameOrigin(a: string, b: string): boolean {
    try { return new URL(a).origin === new URL(b).origin; } catch (e) { return false; }
}
function waitTabHttpUrl(tabId: number): Promise<string> {
    return new Promise<string>(function (resolve) {
        const timer = setTimeout(function () { cleanup(); resolve(''); }, 15000);
        function onUpd(id: number, info: chrome.tabs.TabChangeInfo, t: chrome.tabs.Tab) {
            const u = (t && t.url) || info.url || '';
            if (id === tabId && /^https?:/i.test(u)) { cleanup(); resolve(u); }
        }
        function cleanup() { clearTimeout(timer); chrome.tabs.onUpdated.removeListener(onUpd); }
        chrome.tabs.onUpdated.addListener(onUpd);
    });
}
const mhtRestoreBusy = new Set<number>();
async function handleMhtLinkTab(tab: chrome.tabs.Tab) {
    if (!tab || tab.id == null || mhtRestoreBusy.has(tab.id)) return;
    let url = tab.pendingUrl || tab.url || '';
    let opener: chrome.tabs.Tab | null = null;
    try {
        if (tab.openerTabId != null) opener = await chrome.tabs.get(tab.openerTabId).catch(function () { return null; });
        if (!opener && tab.windowId != null) {
            const act = await chrome.tabs.query({ windowId: tab.windowId, active: true });
            if (act && act[0] && act[0].id !== tab.id) opener = act[0];
        }
        if (!opener || !/^file:\/\/\/.*\.mht(ml)?$/i.test(opener.url || '')) return;
        mhtRestoreBusy.add(tab.id);
        if (!/^https?:/i.test(url)) url = await waitTabHttpUrl(tab.id);
        if (!/^https?:/i.test(url)) return;
        let saved: any = null;
        try {
            const res = await fetch(opener.url);
            saved = extractSavedCookies(await res.text());
        } catch (e) { }
        if (saved && saved.url && !mhtSameOrigin(url, saved.url)) saved = null;
        if (!saved) {
            try {
                const key = 'mhtCookies:' + url;
                const obj = await chrome.storage.local.get(key);
                if (obj && obj[key]) saved = JSON.parse(obj[key]);
            } catch (e) { }
        }
        if (saved && saved.cookies && saved.cookies.length) {
            const ok = await restoreSavedCookies(saved.cookies);
            if (ok > 0) chrome.tabs.reload(tab.id);
        }
    } catch (e) {
        console.warn('SaveAsMHT: session restore failed', e);
    } finally {
        if (mhtRestoreBusy.has(tab.id)) setTimeout(function () { mhtRestoreBusy.delete(tab.id); }, 5000);
    }
}
chrome.tabs.onCreated.addListener(handleMhtLinkTab);

// === MHT embed images (patch MhtEmbedImages) ===
// Chrome does not always put every image that the page shows into the .mht. After the capture the
// worker asks the page for every image it displays (img, video poster, svg image, CSS backgrounds
// of rendered elements) and adds the ones that are missing in the .mht as extra MIME parts.
const MHT_EMBED_IMAGES = true;
const MHT_IMG_MAX_ONE = 25 * 1024 * 1024;
const MHT_IMG_MAX_TOTAL = 120 * 1024 * 1024;
const MHT_IMG_MAX_COUNT = 1000;
// Runs inside the page
function mhtCollectImageUrlsInPage(limit: number): string[] {
    const out: string[] = [];
    const seen: { [k: string]: number } = {};
    const t0 = Date.now();
    const add = function (u: string | undefined | null): void {
        if (!u || out.length >= limit || !/^https?:/i.test(u)) return;
        const k = u.split('#')[0];
        if (seen[k]) return;
        seen[k] = 1;
        out.push(k);
    };
    // image that the browser has not picked a source for yet (never loaded): take every candidate
    const addSet = function (set: string): void {
        if (!set) return;
        set.split(',').forEach(function (c: string) {
            const u = c.trim().split(/\s+/)[0];
            if (!u) return;
            try { add(new URL(u, document.baseURI).href); } catch (e) { }
        });
    };
    const urlsIn = function (v: string): string[] {
        const r: string[] = [];
        if (!v || v === 'none') return r;
        const re = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(v)) !== null) r.push(m[1] || m[2] || m[3] || '');
        return r;
    };
    const skip: { [k: string]: number } = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1 };
    const props = ['backgroundImage', 'borderImageSource', 'listStyleImage', 'webkitMaskImage', 'maskImage'];
    const readStyle = function (cs: CSSStyleDeclaration): void {
        for (let k = 0; k < props.length; k++) {
            urlsIn((cs as any)[props[k]]).forEach(add);
        }
    };
    const all: any[] = [];
    const mhtGatherEls = function (root: any): void {
        root.querySelectorAll('*').forEach(function (node: any) {
            all.push(node);
            let sr: any = null;
            try {
                const dom = (chrome as any).dom;
                sr = (dom && dom.openOrClosedShadowRoot) ? dom.openOrClosedShadowRoot(node) : node.shadowRoot;
            } catch (ex) { sr = node.shadowRoot; }
            if (sr) mhtGatherEls(sr);
        });
    };
    mhtGatherEls(document);
    for (let i = 0; i < all.length && Date.now() - t0 < 15000; i++) {
        const el = all[i] as any;
        if (el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName !== 'svg' && el.tagName !== 'image') continue; if (skip[el.tagName] || (el.getClientRects().length === 0 && !el.closest('[data-save-as-mht-injected]'))) continue;
        if (el.tagName === 'IMG') {
            const b = el.getBoundingClientRect();
            if (b.width * b.height >= 16 || el.closest('[data-save-as-mht-injected]')) {
                if (el.currentSrc) {
                    add(el.currentSrc); add(el.src); /* Chrome drops srcset in .mht, the saved <img> keeps src */
                } else {
                    add(el.src); if (!el.src) addSet(el.srcset);
                    const pic = el.parentElement;
                    if (pic && pic.tagName === 'PICTURE') {
                        pic.querySelectorAll('source').forEach(function (s: HTMLSourceElement) { addSet(s.srcset); });
                    }
                }
            }
        } else if (el.tagName === 'VIDEO') {
            add(el.poster);
        } else if (el.tagName === 'INPUT' && el.type === 'image') {
            add(el.src);
        } else if (el.tagName.toLowerCase() === 'image' && el.href && el.href.baseVal) {
            try { add(new URL(el.href.baseVal, document.baseURI).href); } catch (e) { }
        }
        readStyle(getComputedStyle(el));
        const pb = getComputedStyle(el, '::before');
        if (pb.content !== 'none' && pb.content !== 'normal') readStyle(pb);
        const pa = getComputedStyle(el, '::after');
        if (pa.content !== 'none' && pa.content !== 'normal') readStyle(pa);
    }
    return out;
}
function mhtImageMime(b64: string, headerType: string | null): string | null {
    const ht = (headerType || '').split(';')[0].trim().toLowerCase();
    if (/^image\//.test(ht)) return ht;
    let s = '';
    try { s = atob(b64.slice(0, 400)); } catch (e) { return null; }
    if (s.slice(0, 3) === '\xFF\xD8\xFF') return 'image/jpeg';
    if (s.slice(1, 4) === 'PNG') return 'image/png';
    if (s.slice(0, 4) === 'GIF8') return 'image/gif';
    if (s.slice(0, 4) === 'RIFF' && s.slice(8, 12) === 'WEBP') return 'image/webp';
    if (s.slice(4, 8) === 'ftyp') return 'image/avif';
    if (s.slice(0, 2) === 'BM') return 'image/bmp';
    if (s.indexOf('<svg') >= 0) return 'image/svg+xml';
    return null;
}
async function mhtFetchImage(url: string): Promise<{ b64: string; mime: string } | null> {
    const ctl = new AbortController(); const timer = setTimeout(function () { ctl.abort(); }, 15000); try { const r = await fetch(url, { credentials: 'omit', cache: 'force-cache', signal: ctl.signal }); if (!r.ok) return null; const buf = await r.arrayBuffer(); if (!buf.byteLength || buf.byteLength > MHT_IMG_MAX_ONE) return null;
        const b64 = mhtBufToB64(buf);
        const mime = mhtImageMime(b64, r.headers.get('content-type'));
        return mime ? { b64: b64, mime: mime } : null;
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}
async function mhtAppendMissingImages(mhtmlText: string, pageUrl: string, tabId: number): Promise<string> {
    if (!MHT_EMBED_IMAGES) return mhtmlText;
    try {
        const info = mhtListParts(mhtmlText);
        if (!info) return mhtmlText;
        const have = new Set<string>();
        info.parts.forEach(function (p) { if (p.loc) have.add(mhtNormUrl(p.loc).split('#')[0]); });
        const inj = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: mhtCollectImageUrlsInPage,
            args: [MHT_IMG_MAX_COUNT],
        });
        const urls = (inj && inj[0] && inj[0].result) || [];
        const todo: string[] = [];
        urls.forEach(function (u: string) {
            const n = mhtNormUrl(u).split('#')[0];
            if (!have.has(n) && todo.indexOf(n) < 0) todo.push(n);
        });
        if (!todo.length) return mhtmlText;
        const got = new Map<string, { b64: string; mime: string }>();
        const imgDeadline = Date.now() + MHT_IMG_BUDGET_MS; const res = await mhtMapLimit(todo, MHT_IMG_CONCURRENCY, function (u) { if (Date.now() > imgDeadline) return Promise.resolve(undefined); const startedAt = Date.now(); return mhtFetchImage(u).then(function (r) { return (r === null && Date.now() - startedAt >= 14000) ? undefined : r; }); }); todo.forEach(function (u, i) { if (res[i]) got.set(u, res[i]); }); const missing = todo.filter(function (u, i) { return res[i] === null; });
        if (missing.length) {
            try {
                const inj2 = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: mhtFetchManyInPage, args: [missing, MHT_IMG_MAX_ONE, 8, 15000, 40000],
                });
                const list = (inj2 && inj2[0] && inj2[0].result) || [];
                list.forEach(function (it: { url: string; b64: string }) {
                    const mime = it && it.b64 ? mhtImageMime(it.b64, '') : null;
                    if (mime) got.set(it.url, { b64: it.b64, mime: mime });
                });
            } catch (e) {
                console.warn('SaveAsMHT: in-page image fetch failed', e);
            }
        }
        const pos = mhtmlText.lastIndexOf('--' + info.boundary + '--');
        if (pos < 0) return mhtmlText;
        let total = 0;
        let added = 0;
        let out = '';
        got.forEach(function (img: { b64: string; mime: string }, url: string) {
            if (total + img.b64.length > MHT_IMG_MAX_TOTAL) return;
            total += img.b64.length;
            added++;
            out += '--' + info.boundary + '\r\n' +
                'Content-Type: ' + img.mime + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                'Content-Location: ' + url + '\r\n\r\n' +
                (img.b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
        });
        console.log('SaveAsMHT: images missing in the capture:', todo.length, ', embedded:', added);
        return mhtmlText.slice(0, pos) + out + mhtmlText.slice(pos);
    } catch (e) {
        console.warn('SaveAsMHT: image embedding failed', e);
        return mhtmlText;
    }
}

// === MHT page state (patch MhtPageState) ===
// 1) (image loading by scrolling was removed, images are embedded by patch MhtEmbedImages)
// 2) Chrome shows every form control (button, input, ...) of a saved .mht as :disabled, so controls
//    without an author color get the grey disabled text color. The live text color of every enabled
//    control is written into a temporary low-priority <style> that is captured with the page.
// Set the constants to false to switch a feature off.


const MHT_KEEP_CONTROL_COLORS = true;

// Runs inside the page
function mhtKeepControlColorsInPage(): number {
    const A = 'data-save-as-mht-ctl';
    let css = '';
    let n = 0;
    document.querySelectorAll('button, input, select, textarea').forEach(function (el: Element) {
        if (el.matches(':disabled')) return;
        el.setAttribute(A, String(n));
        css += ':where([' + A + '="' + n + '"]){color:' + getComputedStyle(el).color + '}\n';
        n++;
    });
    if (n) {
        const st = document.createElement('style');
        st.id = '__save_as_mht_controls_style__';
        st.textContent = css;
        (document.head || document.documentElement).appendChild(st);
    }
    return n;
}

async function mhtKeepControlColors(tabId: number): Promise<void> {
    if (!MHT_KEEP_CONTROL_COLORS) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtKeepControlColorsInPage });
    } catch (e) {
        console.warn('SaveAsMHT: keeping control colors failed', e);
    }
}

// === MHT shadow styles (patch MhtShadowStyles) ===
// Chrome's pageCapture does not save the styles of a shadow tree: <style> elements inside a shadow
// root, rules added through the CSSOM and adoptedStyleSheets are dropped, only the markup is kept.
// Pages that build a part of the UI in shadow DOM (cookie banners, Dynamic Yield banners, web
// components) look unstyled in the saved .mht and the broken blocks push the rest of the page around.
// Before the capture the worker copies the CSS of every shadow root (open or closed, every frame) and
// of document.adoptedStyleSheets into temporary <link rel="stylesheet" href="data:..."> elements,
// which pageCapture keeps. They are removed from the page right after the capture.
// Set MHT_SHADOW_STYLES to false to switch the feature off.
const MHT_SHADOW_STYLES = true;
// Runs inside the page (in every frame)
function mhtShadowStylesInPage(): any {
    const MARK = 'data-save-as-mht-sr';
    const CTL = 'data-save-as-mht-sr-ctl';
    const rep = { frame: location.href, roots: 0, styles: 0, adopted: 0, controls: 0, links: 0, unreadable: 0 };
    const shadowOf = function (el: any): any {
        try {
            const dom = (chrome as any).dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const roots: any[] = [];
    const walk = function (root: any): void {
        roots.push(root);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
    // leftovers of an earlier capture that did not finish
    roots.forEach(function (root: any) {
        root.querySelectorAll('[' + MARK + ']').forEach(function (el: any) { el.remove(); });
        root.querySelectorAll('[' + CTL + ']').forEach(function (el: any) { el.removeAttribute(CTL); });
    });
    const base = document.baseURI;
    // relative url() would resolve against the data: URL of the <link>, make them absolute
    const absUrls = function (css: string, from: string): string {
        return css.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)/gi, function (m: string, a: string, b: string, c: string) {
            const raw = (a || b || c || '').trim();
            if (!raw || /^(data|https?|file|blob|about|chrome-extension):/i.test(raw) || raw.charAt(0) === '#') return m;
            try { return 'url("' + new URL(raw, from).href + '")'; } catch (e) { return m; }
        });
    };
    // text of one stylesheet, null when its rules can not be read (cross-origin <link> without CORS)
    const sheetCss = function (sheet: any, from: string, depth: number): string | null {
        let rules: any = null;
        try { rules = sheet.cssRules; } catch (e) { return null; }
        if (!rules) return null;
        let css = '';
        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            if (r.type === 3 && r.styleSheet && depth < 5) {
                const sub = sheetCss(r.styleSheet, r.styleSheet.href || from, depth + 1);
                if (sub === null) { css += r.cssText + '\n'; continue; }
                const mm = r.media && r.media.mediaText;
                css += (mm && mm !== 'all') ? '@media ' + mm + '{\n' + sub + '}\n' : sub;
            } else {
                css += r.cssText + '\n';
            }
        }
        return absUrls(css, from);
    };
    const withMedia = function (sheet: any, css: string): string {
        let m = '';
        try { m = sheet.media ? sheet.media.mediaText : ''; } catch (e) { }
        return (m && m !== 'all') ? '@media ' + m + '{\n' + css + '}\n' : css;
    };
    const makeLink = function (css: string): HTMLLinkElement {
        const bytes = new TextEncoder().encode(css);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as any);
        }
        const l = document.createElement('link');
        l.setAttribute('rel', 'stylesheet');
        l.setAttribute('href', 'data:text/css;charset=utf-8;base64,' + btoa(bin));
        l.setAttribute(MARK, '1');
        return l;
    };
    let n = 0;
    roots.forEach(function (root: any) {
        const isDoc = root === document;
        if (!isDoc) rep.roots++;
        // 1) <style> / <link rel=stylesheet> of a shadow tree: a <link> with the same CSS right after each
        //    of them (pageCapture drops the <style> and keeps the <link> in its place, so :nth-child etc. still match)
        if (!isDoc) {
            const els = root.querySelectorAll('style, link');
            for (let i = 0; i < els.length; i++) {
                const el = els[i];
                if (el.tagName === 'LINK' && (el.getAttribute('rel') || '').toLowerCase().split(/\s+/).indexOf('stylesheet') < 0) continue;
                const sheet = el.sheet;
                if (!sheet || sheet.disabled) continue;
                const css = sheetCss(sheet, sheet.href || base, 0);
                if (css === null) { rep.unreadable++; continue; }
                el.parentNode.insertBefore(makeLink(withMedia(sheet, css)), el.nextSibling);
                rep.styles++;
            }
        }
        // 2) adoptedStyleSheets: one <link> at the end of the root (they come after all other sheets)
        let css = '';
        let ad: any[] = [];
        try { ad = Array.prototype.slice.call(root.adoptedStyleSheets || []); } catch (e) { }
        ad.forEach(function (sheet: any) {
            if (!sheet || sheet.disabled) return;
            const t = sheetCss(sheet, base, 0);
            if (t === null) { rep.unreadable++; return; }
            css += withMedia(sheet, t);
            rep.adopted++;
        });
        // 3) text color of the controls inside a shadow tree (shadow twin of patch MhtPageState)
        if (!isDoc) {
            root.querySelectorAll('button, input, select, textarea').forEach(function (el: any) {
                if (el.matches(':disabled')) return;
                el.setAttribute(CTL, String(n));
                css += ':where([' + CTL + '="' + n + '"]){color:' + getComputedStyle(el).color + '}\n';
                n++;
                rep.controls++;
            });
        }
        if (css) {
            const link = makeLink(css);
            if (isDoc) (document.head || document.documentElement).appendChild(link); else root.appendChild(link);
            rep.links++;
        }
    });
    return rep;
}
// Runs inside the page (in every frame): removes everything that mhtShadowStylesInPage added
function mhtShadowStylesCleanupInPage(): void {
    const MARK = 'data-save-as-mht-sr';
    const CTL = 'data-save-as-mht-sr-ctl';
    const shadowOf = function (el: any): any {
        try {
            const dom = (chrome as any).dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const walk = function (root: any): void {
        root.querySelectorAll('[' + MARK + ']').forEach(function (el: any) { el.remove(); });
        root.querySelectorAll('[' + CTL + ']').forEach(function (el: any) { el.removeAttribute(CTL); });
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
}
async function mhtShadowStyles(tabId: number): Promise<void> {
    if (!MHT_SHADOW_STYLES) return;
    try {
        const res = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtShadowStylesInPage });
        console.log('SaveAsMHT: shadow styles:', JSON.stringify((res || []).map(function (r: any) { return r.result; }).filter(Boolean)));
    } catch (e) {
        console.warn('SaveAsMHT: copying shadow styles failed', e);
    }
}
async function mhtShadowStylesCleanup(tabId: number): Promise<void> {
    if (!MHT_SHADOW_STYLES) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtShadowStylesCleanupInPage });
    } catch (e) { }
}

// === MHT lazy thumbnails (patch MhtLazyThumbs) ===
// YouTube creates the <img> of a video thumbnail without src and fills it (and adds the class
// ytCoreImageLoaded, CSS: .ytCoreImageHost{visibility:hidden}) only when the card gets close to the
// viewport. The cards that are already rendered below the part the user has looked at stay empty and
// the saved .mht shows empty frames there. Nothing is scrolled: before the capture the worker gives
// every empty thumbnail of a rendered card the URL i.ytimg.com/vi/<video id>/..., waits until it is
// loaded and marks it as loaded the way YouTube does; the images are embedded by patch MhtEmbedImages.
// The end of the rendered cards is the scroll limit (YouTube renders cards only while the user scrolls).
// Everything is removed from the page right after the capture. Only youtube.com pages are touched.
// MHT_LAZY_THUMBS_AHEAD: 0 = every rendered card, N = only cards up to N screens below the visible part.
const MHT_LAZY_THUMBS = true;
const MHT_LAZY_THUMBS_AHEAD = 0;
// Runs inside the page
async function mhtLazyThumbsInPage(ahead: number): Promise<any> {
    const MARK = 'data-save-as-mht-lazy';
    const CLS_MARK = 'data-save-as-mht-lazy-cls';
    const LOADED = 'ytCoreImageLoaded';
    const rep: any = { lazy: 0, filled: 0, failed: 0, noId: 0, farAway: 0, avatars: 0 };
    if (!/(^|\.)youtube\.com$/i.test(location.hostname)) return rep;
    const t0 = Date.now();
    const todo: any[] = [];
    const imgs = document.querySelectorAll<HTMLImageElement>('img.ytCoreImageHost');
    for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img.getAttribute('src') || img.getAttribute('srcset')) continue;
        if (img.getClientRects().length === 0) continue;
        if ((img.getAttribute('class') || '').indexOf('AvatarShape') >= 0) { rep.avatars++; continue; }
        const a = img.closest('a[href]') as HTMLAnchorElement | null;
        const href = a ? a.href : '';
        let id = '';
        let isShort = false;
        let m: RegExpExecArray | null = /[?&]v=([\w-]{11})(?![\w-])/.exec(href);
        if (m) {
            id = m[1];
        } else {
            m = /\/(shorts|live)\/([\w-]{11})(?![\w-])/.exec(href);
            if (m) {
                id = m[2];
                isShort = m[1] === 'shorts';
            } else {
                const c = img.closest('[class*="content-id-"]');
                m = c ? /content-id-([\w-]{11})(?![\w-])/.exec(c.getAttribute('class') || '') : null;
                if (m) id = m[1];
            }
        }
        if (!id) { rep.noId++; continue; }
        if (ahead > 0 && img.getBoundingClientRect().top > window.innerHeight * (1 + ahead)) { rep.farAway++; continue; }
        todo.push({ img: img, id: id, isShort: isShort });
    }
    rep.lazy = todo.length;
    const tryLoad = function (img: HTMLImageElement, url: string): Promise<boolean> {
        return new Promise<boolean>(function (resolve) {
            let done = false;
            let timer = 0;
            const fin = function (ok: boolean): void {
                if (done) return;
                done = true;
                clearTimeout(timer);
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
                resolve(ok);
            };
            // i.ytimg.com answers a missing size with a 120x90 placeholder
            const onLoad = function () { fin(img.naturalWidth > 120); };
            const onError = function () { fin(false); };
            timer = setTimeout(function () { fin(false); }, 8000);
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
            img.setAttribute('src', url);
        });
    };
    const fill = async function (it: any): Promise<void> {
        const img = it.img;
        const names = it.isShort ? ['oardefault.jpg', 'hq720.jpg', 'hqdefault.jpg', 'mqdefault.jpg'] : ['hq720.jpg', 'hqdefault.jpg', 'mqdefault.jpg'];
        for (let k = 0; k < names.length && Date.now() - t0 < 20000; k++) {
            const url = 'https://i.ytimg.com/vi/' + it.id + '/' + names[k];
            img.setAttribute(MARK, url);
            if (await tryLoad(img, url)) {
                if (!img.classList.contains(LOADED)) {
                    img.classList.add(LOADED);
                    img.setAttribute(CLS_MARK, '1');
                }
                rep.filled++;
                return;
            }
        }
        if (img.getAttribute('src') === img.getAttribute(MARK)) img.removeAttribute('src');
        img.removeAttribute(MARK);
        rep.failed++;
    };
    let next = 0;
    const run = async function (): Promise<void> {
        while (next < todo.length) {
            const it = todo[next++];
            try { await fill(it); } catch (e) { rep.failed++; }
        }
    };
    const workers: Promise<void>[] = [];
    for (let k = 0; k < Math.min(6, todo.length); k++) workers.push(run());
    await Promise.all(workers);
    return rep;
}
// Runs inside the page: puts the thumbnails back to the state they had before the capture
function mhtLazyThumbsCleanupInPage(): void {
    const MARK = 'data-save-as-mht-lazy';
    const CLS_MARK = 'data-save-as-mht-lazy-cls';
    document.querySelectorAll('[' + MARK + ']').forEach(function (img: Element) {
        // only when the site has not put its own image there in the meantime
        if (img.getAttribute('src') === img.getAttribute(MARK)) {
            img.removeAttribute('src');
            if (img.getAttribute(CLS_MARK) === '1') img.classList.remove('ytCoreImageLoaded');
        }
        img.removeAttribute(MARK);
        img.removeAttribute(CLS_MARK);
    });
}
async function mhtLazyThumbs(tabId: number): Promise<void> {
    if (!MHT_LAZY_THUMBS) return;
    try {
        const res = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtLazyThumbsInPage, args: [MHT_LAZY_THUMBS_AHEAD] });
        const r = res && res[0] && res[0].result;
        if (r && (r.lazy || r.avatars)) console.log('SaveAsMHT: lazy thumbnails:', JSON.stringify(r));
    } catch (e) {
        console.warn('SaveAsMHT: loading lazy thumbnails failed', e);
    }
}
async function mhtLazyThumbsCleanup(tabId: number): Promise<void> {
    if (!MHT_LAZY_THUMBS) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtLazyThumbsCleanupInPage });
    } catch (e) { }
}

// === MHT virtual rows (patch MhtVirtualRows) ===
// Some sites (for example grok.com) keep in the DOM only the rows near the viewport (virtual list),
// the other rows live only in the page's memory, so pageCapture can not see them and the saved
// .mht has an empty space instead of the rest of the chat. No scrolling is done: the worker makes
// the scroll viewport as tall as the whole list, so the site itself mounts every row, copies the
// rows, restores the viewport and puts the copies back into the DOM only for the time of the capture.
// Set MHT_VIRTUAL_ROWS to false to switch the feature off. MHT_VIRTUAL_SCROLL_FALLBACK (off by default)
// allows a quick scroll through the list when the viewport trick did not mount every row.
const MHT_VIRTUAL_ROWS = true;
const MHT_VIRTUAL_SCROLL_FALLBACK = false;
// Runs inside the page
async function mhtExpandVirtualRowsInPage(allowScroll: boolean): Promise<any[]> {
    const ROW = '[data-plane-row]';
    const KEY = 'data-plane-row';
    const INJ = 'data-save-as-mht-injected';
    const SAVED = 'data-save-as-mht-vl-style';
    const sleep = function (ms: number) { return new Promise<void>(function (r) { setTimeout(r, ms); }); };
    const yOf = function (el: Element): number {
        const m = /translate(?:Y|3d)?\(\s*(?:[^,)]*,\s*)?(-?[\d.]+)px/i.exec(el.getAttribute('style') || '');
        if (m) return parseFloat(m[1]);
        const t = /(?:^|;)\s*top\s*:\s*(-?[\d.]+)px/i.exec(el.getAttribute('style') || '');
        return t ? parseFloat(t[1]) : 0;
    };
    const rowsOf = function (box: Element): Element[] {
        return Array.prototype.filter.call(box.children, function (el: Element) {
            return el.hasAttribute(KEY) && !el.hasAttribute(INJ);
        });
    };
    const findScroller = function (box: Element): HTMLElement | null {
        for (let p = box.parentElement as HTMLElement | null; p && p !== document.documentElement && p !== document.body; p = p.parentElement as HTMLElement | null) {
            const oy = getComputedStyle(p).overflowY;
            if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
        }
        return null;
    };
    const restoreStyle = function (el: Element) {
        const v = el.getAttribute(SAVED);
        if (v === null) return;
        if (v.charAt(0) === 'S') el.setAttribute('style', v.slice(1)); else el.removeAttribute('style');
        el.removeAttribute(SAVED);
    };
    const boxes: HTMLElement[] = [];
    document.querySelectorAll(ROW).forEach(function (el: Element) {
        if (el.parentElement && boxes.indexOf(el.parentElement) < 0) boxes.push(el.parentElement as HTMLElement);
    });
    const report: any[] = [];
    for (let b = 0; b < boxes.length; b++) {
        const box = boxes[b];
        const info: any = { mountedBefore: rowsOf(box).length, mountedExpanded: 0, copied: 0, injected: 0, covered: false, scroller: false };
        report.push(info);
        const scroller = findScroller(box);
        if (!scroller) continue;
        info.scroller = true;
        const total = function () { return parseFloat(box.style.height) || box.offsetHeight || 0; };
        const covered = function () {
            let bottom = 0;
            rowsOf(box).forEach(function (el: Element) { bottom = Math.max(bottom, yOf(el) + (el as HTMLElement).offsetHeight); });
            return bottom >= total() - 500;
        };
        const store: { [k: string]: Node } = {};
        const snap = function (overwrite: boolean) {
            rowsOf(box).forEach(function (el: Element) {
                const k = el.getAttribute(KEY) as string;
                if (overwrite || !(k in store)) store[k] = el.cloneNode(true);
            });
        };
        const top0 = scroller.scrollTop;
        try {
            // 1) make the viewport as tall as the list: the site mounts every row by itself
            const prev = scroller.getAttribute('style');
            scroller.setAttribute(SAVED, prev === null ? 'N' : 'S' + prev);
            const need = Math.max(scroller.scrollHeight, box.scrollHeight, total()) + 400;
            scroller.style.setProperty('height', need + 'px', 'important');
            scroller.style.setProperty('max-height', 'none', 'important');
            scroller.style.setProperty('min-height', '0', 'important');
            scroller.style.setProperty('flex', 'none', 'important');
            let last = -1, same = 0;
            for (let t = 0; t < 50 && !(same >= 4 && covered()); t++) {
                await sleep(100);
                const n = rowsOf(box).length;
                snap(false);
                if (n === last) same++; else { same = 0; last = n; }
            }
            snap(true);
            info.mountedExpanded = rowsOf(box).length;
            info.covered = covered();
        } finally {
            restoreStyle(scroller);
            scroller.scrollTop = top0;
        }
        // 2) optional quick scroll through the list (off by default)
        if (allowScroll && !info.covered) {
            const step = Math.max(200, scroller.clientHeight * 0.8);
            for (let pos = 0; pos < scroller.scrollHeight; pos += step) {
                scroller.scrollTop = pos;
                await sleep(150);
                snap(false);
            }
            scroller.scrollTop = top0;
        }
        info.copied = Object.keys(store).length;
        // 3) wait until the site drops the rows that are far from the viewport again
        let last2 = -1, same2 = 0;
        for (let t = 0; t < 30 && same2 < 3; t++) {
            await sleep(100);
            const n = rowsOf(box).length;
            if (n === last2) same2++; else { same2 = 0; last2 = n; }
        }
        // 4) put back the copies of the rows that are not in the DOM now (removed after the capture)
        const present: { [k: string]: number } = {};
        rowsOf(box).forEach(function (el: Element) { present[el.getAttribute(KEY) as string] = 1; });
        Object.keys(store).forEach(function (k) {
            if (present[k]) return;
            const node = store[k] as Element;
            node.setAttribute(INJ, '1');
            const y = yOf(node);
            let ref: Element | null = null;
            const sib: Element[] = Array.prototype.filter.call(box.children, function (el: Element) { return el.hasAttribute(KEY); });
            for (let i = 0; i < sib.length; i++) {
                if (yOf(sib[i]) > y) { ref = sib[i]; break; }
            }
            box.insertBefore(node, ref);
            info.injected++;
        });
    }
    return report;
}
async function mhtExpandVirtualRows(tabId: number): Promise<void> {
    if (!MHT_VIRTUAL_ROWS) return;
    try {
        const r = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: mhtExpandVirtualRowsInPage,
            args: [MHT_VIRTUAL_SCROLL_FALLBACK],
        });
        const res = r && r[0] && r[0].result;
        if (res && res.length) console.log('SaveAsMHT: virtual rows:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: virtual rows expansion failed', e);
    }
}
// === MHT freeze hidden (patch MhtFreezeHidden) ===
// Elements that are hidden in the live page by something outside the page's own CSS (ad blocker
// cosmetic filters, other extensions) are not hidden in the saved .mht, because that CSS is not saved.
// Set to false to keep the old behaviour.
const MHT_FREEZE_HIDDEN = true;
// Runs inside the page: marks the topmost display:none elements with an inline display:none !important
function mhtFreezeHiddenInPage(): void {
    const A = 'data-save-as-mht-prev-style';
    const skip: { [k: string]: number } = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1, DATALIST: 1, AREA: 1, PARAM: 1, SOURCE: 1, TRACK: 1 };
    const walk = function (el: Element): void {
        for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
            if (skip[c.tagName] || c.id === '__save_as_mht_source_link__') continue;
            if (getComputedStyle(c).display === 'none') {
                const h = c as HTMLElement;
                const prev = h.getAttribute('style');
                h.setAttribute(A, prev === null ? 'N' : 'S' + prev);
                h.style.setProperty('display', 'none', 'important');
            } else {
                walk(c);
            }
        }
    };
    if (document.body) walk(document.body);
}
async function mhtFreezeHidden(tabId: number): Promise<void> {
    if (!MHT_FREEZE_HIDDEN) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtFreezeHiddenInPage });
    } catch (e) {
        console.warn('SaveAsMHT: freezing hidden elements failed', e);
    }
}

// === MHT font URLs (patch MhtFontUrls) ===
// Chrome stores inline <style> as "cid:" parts but leaves relative url() in @font-face untouched,
// and those resolve against "cid:", not against the site, so the embedded fonts never load.
// Rewrite such url() to absolute ones (before the fonts are fetched/embedded).
function mhtAbsFontUrls(css: string, baseUrl: string): string {
    return css.replace(/@font-face\s*\{[^}]*\}/gi, function (block: string) {
        return block.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)/gi, function (m: string, a: string, b: string, c: string) {
            const raw = (a || b || c || '').trim();
            if (!raw || /^(data|https?|file|blob):/i.test(raw) || raw.charAt(0) === '#') return m;
            try { return 'url("' + new URL(raw, baseUrl).href + '")'; } catch (e) { return m; }
        });
    });
}
function mhtFixCidFontUrls(mhtmlText: string, pageUrl: string): string {
    try {
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm) return mhtmlText;
        const sep = '--' + bm[1];
        const chunks = mhtmlText.split(sep);
        const info = function (c: string) {
            const e = c.indexOf('\r\n\r\n');
            if (e < 0) return null;
            const raw = c.slice(0, e);
            const head = raw.replace(/\r\n[ \t]+/g, '');
            const get = function (name: string): string {
                const m = head.match(new RegExp('^' + name + ':[ \\t]*(.*)$', 'im'));
                return m ? m[1].trim() : '';
            };
            return { raw: raw, type: get('Content-Type').toLowerCase(), enc: get('Content-Transfer-Encoding').toLowerCase(), loc: get('Content-Location'), body: c.slice(e + 4) };
        };
        const main = chunks.length > 1 ? info(chunks[1]) : null;
        let docUrl = main && /^https?:/i.test(main.loc) ? main.loc : (pageUrl || '');
        if (!/^https?:/i.test(docUrl)) return mhtmlText;
        if (main && main.type === 'text/html') {
            const bh = mhtDecodeText(main).match(/<base\s[^>]*?href\s*=\s*["']([^"']+)["']/i);
            if (bh) { try { docUrl = new URL(bh[1], docUrl).href; } catch (e) { } }
        }
        let fixed = 0;
        for (let i = 1; i < chunks.length; i++) {
            if (chunks[i].slice(0, 2) === '--') break;
            const p = info(chunks[i]);
            if (!p || p.type !== 'text/css' || /^(https?|file):/i.test(p.loc)) continue;
            const text = mhtDecodeText(p);
            if (text.indexOf('@font-face') < 0) continue;
            const abs = mhtAbsFontUrls(text, docUrl);
            if (abs === text) continue;
            const b64 = p.enc ? btoa(abs) : mhtUtf8ToB64(abs);
            const head = /^Content-Transfer-Encoding:/im.test(p.raw)
                ? p.raw.replace(/^Content-Transfer-Encoding:.*$/im, 'Content-Transfer-Encoding: base64')
                : p.raw + '\r\nContent-Transfer-Encoding: base64';
            chunks[i] = head + '\r\n\r\n' + (b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
            fixed++;
        }
        if (!fixed) return mhtmlText;
        console.log('SaveAsMHT: relative font URLs fixed in', fixed, 'inline stylesheet(s)');
        return chunks.join(sep);
    } catch (e) {
        console.warn('SaveAsMHT: font URL fix failed', e);
        return mhtmlText;
    }
}

// === MHT fonts (patch MhtFonts) ===
// Chrome's pageCapture drops web fonts, so offline the page falls back to system fonts.
// After the capture we fetch every font declared in @font-face and append it as an MHT part.
type MhtPart = { type: string; enc: string; loc: string; body: string };
const MHT_FONT_MAX_ONE = 15 * 1024 * 1024;
const MHT_FONT_MAX_TOTAL = 60 * 1024 * 1024;
const MHT_FONT_FORMATS = ['woff2', 'woff', 'truetype', 'opentype', 'collection', 'woff2-variations', 'woff-variations', 'truetype-variations', 'opentype-variations'];
function mhtQpDecode(s: string): string {
    return s.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, function (m: string, h: string) { return String.fromCharCode(parseInt(h, 16)); });
}
function mhtListParts(text: string): { boundary: string; parts: MhtPart[] } | null {
    const bm = text.slice(0, 4096).match(/boundary="([^"]+)"/);
    if (!bm) return null;
    const chunks = text.split('--' + bm[1]);
    const parts: MhtPart[] = [];
    for (let i = 1; i < chunks.length; i++) {
        const c = chunks[i];
        if (c.slice(0, 2) === '--') break;
        const hEnd = c.indexOf('\r\n\r\n');
        if (hEnd < 0) continue;
        const head = c.slice(0, hEnd).replace(/\r\n[ \t]+/g, '');
        const get = function (name: string): string {
            const m = head.match(new RegExp('^' + name + ':[ \\t]*(.*)$', 'im'));
            return m ? m[1].trim() : '';
        };
        parts.push({
            type: get('Content-Type').toLowerCase(),
            enc: get('Content-Transfer-Encoding').toLowerCase(),
            loc: get('Content-Location'),
            body: c.slice(hEnd + 4),
        });
    }
    return { boundary: bm[1], parts: parts };
}
function mhtDecodeText(part: MhtPart): string {
    try {
        if (part.enc === 'quoted-printable') return mhtQpDecode(part.body);
        if (part.enc === 'base64') return atob(part.body.replace(/\s+/g, ''));
    } catch (e) { return ''; }
    return part.body;
}
function mhtNormUrl(u: string): string {
    try { return new URL(u).href; } catch (e) { return u; }
}
// Adds to "out" the URL of the font that Chrome would pick for each @font-face (first supported src)
function mhtCollectFontUrls(css: string, baseUrl: string, out: string[]): void {
    const faceRe = /@font-face\s*\{([^}]*)\}/gi;
    const urlRe = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)\s*(?:format\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\))?/gi;
    let fm: RegExpExecArray | null;
    while ((fm = faceRe.exec(css)) !== null) {
        const block = fm[1];
        let um: RegExpExecArray | null;
        urlRe.lastIndex = 0;
        while ((um = urlRe.exec(block)) !== null) {
            const raw = (um[1] || um[2] || um[3] || '').trim();
            const fmt = (um[4] || um[5] || um[6] || '').trim().toLowerCase();
            if (!raw) continue;
            if (fmt && MHT_FONT_FORMATS.indexOf(fmt) < 0) continue;
            if (!/^data:/i.test(raw)) {
                try {
                    const abs = new URL(raw, baseUrl).href;
                    if (/^https?:/i.test(abs)) out.push(abs);
                } catch (e) { }
            }
            break;
        }
    }
}
function mhtBufToB64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    }
    return btoa(bin);
}
function mhtFontMime(b64: string): string {
    let sig = '';
    try { sig = atob(b64.slice(0, 8)); } catch (e) { }
    const s4 = sig.slice(0, 4);
    if (s4 === 'wOF2') return 'font/woff2';
    if (s4 === 'wOFF') return 'font/woff';
    if (s4 === 'OTTO') return 'font/otf';
    if (s4 === 'ttcf') return 'font/collection';
    return 'font/ttf';
}
async function mhtFetchFont(url: string): Promise<string | null> {
    const ctl = new AbortController();
    const timer = setTimeout(function () { ctl.abort(); }, 30000);
    try {
        const r = await fetch(url, { credentials: 'omit', signal: ctl.signal });
        if (!r.ok) return null;
        const buf = await r.arrayBuffer();
        if (!buf.byteLength || buf.byteLength > MHT_FONT_MAX_ONE) return null;
        return mhtBufToB64(buf);
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}
// Runs inside the page: fallback for fonts the worker could not download (Referer/cookies checks)
async function mhtFetchFontsInPage(urls: string[], maxOne: number): Promise<{ url: string; b64: string }[]> {
    const out: { url: string; b64: string }[] = [];
    for (const u of urls) {
        try {
            const r = await fetch(u);
            if (!r.ok) continue;
            const buf = await r.arrayBuffer();
            if (!buf.byteLength || buf.byteLength > maxOne) continue;
            const bytes = new Uint8Array(buf);
            let bin = '';
            for (let i = 0; i < bytes.length; i += 0x8000) {
                bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
            }
            out.push({ url: u, b64: btoa(bin) });
        } catch (e) { }
    }
    return out;
}
async function mhtMapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
    const res: R[] = new Array(items.length);
    let next = 0;
    async function run() {
        while (next < items.length) {
            const i = next++;
            res[i] = await fn(items[i]);
        }
    }
    const workers: Promise<void>[] = [];
    for (let k = 0; k < Math.min(limit, items.length); k++) workers.push(run());
    await Promise.all(workers);
    return res;
}
async function appendFontParts(mhtmlText: string, pageUrl: string, tabId: number): Promise<string> {
    try {
        const info = mhtListParts(mhtmlText);
        if (!info) return mhtmlText;
        const have = new Set<string>();
        info.parts.forEach(function (p) { if (p.loc) have.add(mhtNormUrl(p.loc)); });
        const first = info.parts[0];
        const docUrl = first && /^https?:/i.test(first.loc) ? first.loc : (pageUrl || '');
        const found: string[] = [];
        info.parts.forEach(function (p) {
            if (p.type !== 'text/css' && p.type !== 'text/html') return;
            const text = mhtDecodeText(p);
            if (text.indexOf('@font-face') < 0) return;
            const base = /^(https?|file):/i.test(p.loc) ? p.loc : docUrl;
            mhtCollectFontUrls(text, base, found);
        });
        const todo: string[] = [];
        found.forEach(function (u) { if (!have.has(u) && todo.indexOf(u) < 0) todo.push(u); });
        if (!todo.length) return mhtmlText;
        const got = new Map<string, string>();
        const res = await mhtMapLimit(todo, 6, mhtFetchFont);
        todo.forEach(function (u, i) { if (res[i]) got.set(u, res[i]); });
        const missing = todo.filter(function (u) { return !got.has(u); });
        if (missing.length && tabId != null) {
            try {
                const inj = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: mhtFetchManyInPage, args: [missing, MHT_FONT_MAX_ONE, 8, 15000, 40000],
                });
                const list = (inj && inj[0] && inj[0].result) || [];
                list.forEach(function (it: { url: string; b64: string }) { if (it && it.b64) got.set(it.url, it.b64); });
            } catch (e) {
                console.warn('SaveAsMHT: in-page font fetch failed', e);
            }
        }
        const pos = mhtmlText.lastIndexOf('--' + info.boundary + '--');
        if (pos < 0) return mhtmlText;
        let total = 0;
        let added = 0;
        let out = '';
        got.forEach(function (b64: string, url: string) {
            if (total + b64.length > MHT_FONT_MAX_TOTAL) return;
            total += b64.length;
            added++;
            out += '--' + info.boundary + '\r\n' +
                'Content-Type: ' + mhtFontMime(b64) + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                'Content-Location: ' + url + '\r\n\r\n' +
                (b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
        });
        console.log('SaveAsMHT: fonts embedded:', added, 'of', todo.length);
        return mhtmlText.slice(0, pos) + out + mhtmlText.slice(pos);
    } catch (e) {
        console.warn('SaveAsMHT: font embedding failed', e);
        return mhtmlText;
    }
}

// === MHT nested interactive (patch MhtNestedInteractive) ===
// The HTML parser can not rebuild the DOM of a page that nests elements which HTML forbids inside each
// other, although a script can create them: <button> inside <button> (the YouTube player badges),
// <a> inside <a>, <form> inside <form>, a block element inside <p>. Chrome writes the DOM into the .mht
// as it is. When the .mht is opened the parser closes the outer element at the inner start tag, and every
// following </div> then closes one container too many: the player column collapses, the sidebar falls
// below the page, the comments move aside. Before the capture the worker marks the inner element of every
// such pair with a temporary attribute (it also stores the look the element had). After the capture the
// marked start and end tags in the saved HTML are renamed to a neutral element (mht-nested-button, ...)
// that can be nested anywhere, and the stored look is written into its style attribute. The live page is
// only touched by the temporary attribute, which is removed right after the capture.
// Set MHT_FIX_NESTED to false to switch the feature off.
const MHT_FIX_NESTED = true;
const MHT_NEST_PREFIX = 'mht-nested-';
// Runs inside the page (in every frame)
function mhtMarkNestedInPage(): any {
    const A = 'data-save-as-mht-nest';
    const AS = 'data-save-as-mht-nest-style';
    const HTML = 'http://www.w3.org/1999/xhtml';
    const SVG = 'http://www.w3.org/2000/svg';
    const MATH = 'http://www.w3.org/1998/Math/MathML';
    const rep: any = { frame: location.href, button: 0, a: 0, form: 0, p: 0 };
    const shadowOf = function (el: any): any {
        try {
            const dom = (chrome as any).dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    // elements that stop the parser's search for an open element (button scope / active formatting elements)
    const SCOPE: { [k: string]: number } = { applet: 1, caption: 1, html: 1, table: 1, td: 1, th: 1, marquee: 1, object: 1, template: 1 };
    const SCOPE_BTN: { [k: string]: number } = { applet: 1, caption: 1, html: 1, table: 1, td: 1, th: 1, marquee: 1, object: 1, template: 1, button: 1 };
    const MARKERS: { [k: string]: number } = { applet: 1, caption: 1, object: 1, marquee: 1, template: 1, td: 1, th: 1 };
    const TPL: { [k: string]: number } = { template: 1 };
    const BLOCKS = 'address,article,aside,blockquote,center,details,dialog,dir,div,dl,fieldset,figcaption,figure,footer,header,hgroup,main,menu,nav,ol,p,search,section,summary,ul,pre,listing,form,li,dd,dt,h1,h2,h3,h4,h5,h6,hr,table,xmp';
    // the defaults of the original tag that the renamed element would lose
    const BTN_PROPS = ['display', 'box-sizing', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border-top-width', 'border-top-style', 'border-top-color', 'border-right-width', 'border-right-style', 'border-right-color',
        'border-bottom-width', 'border-bottom-style', 'border-bottom-color', 'border-left-width', 'border-left-style', 'border-left-color',
        'background-color', 'color', 'cursor', 'text-align', 'text-indent', 'text-transform', 'text-shadow', 'letter-spacing', 'word-spacing',
        'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-variant-caps', 'line-height', 'text-rendering', 'white-space'];
    const A_PROPS = ['display', 'color', 'text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'cursor'];
    const FORM_PROPS = ['display', 'margin-top'];
    const P_PROPS = ['display', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
    // the open <name> element above el that the parser still sees at the start tag of el (null when none)
    const openAbove = function (el: any, name: string, stops: { [k: string]: number }): any {
        for (let p = el.parentNode; p && p.nodeType === 1; p = p.parentNode) {
            const ln = p.localName;
            if (p.namespaceURI === HTML) {
                if (ln === name) return p;
                if (stops[ln]) return null;
            } else if ((p.namespaceURI === SVG && (ln === 'foreignObject' || ln === 'desc' || ln === 'title')) ||
                (p.namespaceURI === MATH && (ln === 'mi' || ln === 'mo' || ln === 'mn' || ln === 'ms' || ln === 'mtext' || ln === 'annotation-xml'))) {
                return null;
            }
        }
        return null;
    };
    const mark = function (el: any, tag: string, props: string[]): void {
        if (el.namespaceURI !== HTML || el.hasAttribute(A)) return;
        const cs = getComputedStyle(el);
        let s = '';
        for (let k = 0; k < props.length; k++) {
            const v = cs.getPropertyValue(props[k]);
            if (v) s += props[k] + ':' + v + ';';
        }
        el.setAttribute(A, tag);
        el.setAttribute(AS, s);
        rep[tag]++;
    };
    const roots: any[] = [];
    const walk = function (root: any): void {
        roots.push(root);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
    roots.forEach(function (root: any) {
        // leftovers of an earlier capture that did not finish
        root.querySelectorAll('[' + A + ']').forEach(function (el: any) { el.removeAttribute(A); el.removeAttribute(AS); });
        root.querySelectorAll('button').forEach(function (el: any) {
            if (openAbove(el, 'button', SCOPE)) mark(el, 'button', BTN_PROPS);
        });
        root.querySelectorAll('a').forEach(function (el: any) {
            if (el.namespaceURI === HTML && openAbove(el, 'a', MARKERS)) mark(el, 'a', A_PROPS);
        });
        root.querySelectorAll('form').forEach(function (el: any) {
            if (openAbove(el, 'form', TPL)) mark(el, 'form', FORM_PROPS);
        });
        // a block element start tag closes an open <p>: the <p> that holds such an element is renamed
        root.querySelectorAll('p').forEach(function (p: any) {
            if (p.namespaceURI !== HTML || !p.querySelector(BLOCKS)) return;
            const blocks = p.querySelectorAll(BLOCKS);
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].namespaceURI === HTML && openAbove(blocks[i], 'p', SCOPE_BTN) === p) {
                    mark(p, 'p', P_PROPS);
                    break;
                }
            }
        });
    });
    return rep;
}
// Runs inside the page (in every frame): removes the temporary attributes of mhtMarkNestedInPage
function mhtNestCleanupInPage(): void {
    const A = 'data-save-as-mht-nest';
    const AS = 'data-save-as-mht-nest-style';
    const shadowOf = function (el: any): any {
        try {
            const dom = (chrome as any).dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const walk = function (root: any): void {
        root.querySelectorAll('[' + A + ']').forEach(function (el: any) { el.removeAttribute(A); el.removeAttribute(AS); });
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
}
async function mhtMarkNested(tabId: number): Promise<void> {
    if (!MHT_FIX_NESTED) return;
    try {
        const res = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtMarkNestedInPage });
        const list = (res || []).map(function (r: any) { return r.result; }).filter(function (r: any) { return r && (r.button || r.a || r.form || r.p); });
        if (list.length) console.log('SaveAsMHT: nested elements marked:', JSON.stringify(list));
    } catch (e) {
        console.warn('SaveAsMHT: marking nested elements failed', e);
    }
}
async function mhtNestCleanup(tabId: number): Promise<void> {
    if (!MHT_FIX_NESTED) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtNestCleanupInPage });
    } catch (e) { }
}
// end of the start tag (the index of its ">"), quoted attribute values may contain ">"
function mhtTagEnd(s: string, from: number): number {
    let q = '';
    for (let k = from; k < s.length; k++) {
        const ch = s.charAt(k);
        if (q) {
            if (ch === q) q = '';
        } else if (ch === '"' || ch === "'") {
            q = ch;
        } else if (ch === '>') {
            return k;
        }
    }
    return -1;
}
// <button data-save-as-mht-nest="button" data-save-as-mht-nest-style="..." ...> -> <mht-nested-button style="..." ...>
function mhtRenameNestedTag(tag: string, from: string, to: string): string {
    const sm = /\sdata-save-as-mht-nest-style="([^"]*)"/.exec(tag);
    const snap = sm ? sm[1] : '';
    let t = tag.replace(/\sdata-save-as-mht-nest-style="[^"]*"/, '').replace(/\sdata-save-as-mht-nest="[^"]*"/, '');
    t = '<' + to + ' data-mht-nested="' + from + '"' + t.slice(1 + from.length);
    if (snap) {
        if (/\sstyle="/.test(t)) {
            t = t.replace(/(\sstyle=")/, function (m: string, a: string) { return a + snap; });
        } else {
            t = t.replace(/\s*\/?>$/, function (m: string) { return ' style="' + snap + '"' + m; });
        }
    }
    return t;
}
// Renames the marked start tags and their end tags in one HTML document (a string of bytes or characters)
function mhtDenestHtml(html: string): { html: string; fixed: number } {
    const RAW: { [k: string]: number } = { script: 1, style: 1, textarea: 1, title: 1, xmp: 1, iframe: 1, noembed: 1, noframes: 1, noscript: 1 };
    const VOID: { [k: string]: number } = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
    const n = html.length;
    const edits: { s: number; e: number; t: string }[] = [];
    const stack: { tag: string; to: string; s: number; e: number; t: string }[] = [];
    let i = 0;
    while (i < n) {
        const lt = html.indexOf('<', i);
        if (lt < 0) break;
        const c1 = html.charAt(lt + 1);
        if (c1 === '!' || c1 === '?') {
            if (html.substr(lt, 4) === '<!--') {
                const ce = html.indexOf('-->', lt + 4);
                i = ce < 0 ? n : ce + 3;
            } else {
                const ge = html.indexOf('>', lt + 2);
                i = ge < 0 ? n : ge + 1;
            }
            continue;
        }
        const closing = c1 === '/';
        const nameAt = lt + (closing ? 2 : 1);
        const nm = /^[A-Za-z][^\s\/>]*/.exec(html.substr(nameAt, 64));
        if (!nm) { i = lt + 1; continue; }
        const name = nm[0].toLowerCase();
        const te = mhtTagEnd(html, nameAt + nm[0].length);
        if (te < 0) break;
        i = te + 1;
        if (closing) {
            for (let k = stack.length - 1; k >= 0; k--) {
                if (stack[k].tag !== name) continue;
                const it = stack[k];
                if (it.to) {
                    edits.push({ s: it.s, e: it.e, t: it.t });
                    edits.push({ s: lt, e: te + 1, t: '</' + it.to + '>' });
                }
                stack.length = k;
                break;
            }
            continue;
        }
        let to = '';
        let startText = '';
        const tagText = html.slice(lt, te + 1);
        if (tagText.indexOf('data-save-as-mht-nest') > 0) {
            const mk = /\sdata-save-as-mht-nest="([a-z]+)"/.exec(tagText);
            if (mk && mk[1] === name) {
                to = MHT_NEST_PREFIX + name;
                startText = mhtRenameNestedTag(tagText, name, to);
            }
        }
        if (!VOID[name]) stack.push({ tag: name, to: to, s: lt, e: te + 1, t: startText });
        if (RAW[name]) {
            // the text up to the matching end tag is not markup
            const re = new RegExp('</' + name + '[\\s/>]', 'ig');
            re.lastIndex = i;
            const m = re.exec(html);
            i = m ? m.index : n;
        }
    }
    if (!edits.length) return { html: html, fixed: 0 };
    edits.sort(function (a, b) { return a.s - b.s; });
    let out = '';
    let last = 0;
    for (let k = 0; k < edits.length; k++) {
        out += html.slice(last, edits[k].s) + edits[k].t;
        last = edits[k].e;
    }
    out += html.slice(last);
    return { html: out, fixed: edits.length / 2 };
}
// Applies mhtDenestHtml to every text/html part of the captured .mht
function mhtDenestParts(mhtmlText: string): string {
    if (!MHT_FIX_NESTED) return mhtmlText;
    try {
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm) return mhtmlText;
        const sep = '--' + bm[1];
        const chunks = mhtmlText.split(sep);
        let fixed = 0;
        for (let i = 1; i < chunks.length; i++) {
            const c = chunks[i];
            if (c.slice(0, 2) === '--') break;
            const e = c.indexOf('\r\n\r\n');
            if (e < 0) continue;
            const raw = c.slice(0, e);
            const head = raw.replace(/\r\n[ \t]+/g, '');
            const get = function (name: string): string {
                const m = head.match(new RegExp('^' + name + ':[ \\t]*(.*)$', 'im'));
                return m ? m[1].trim() : '';
            };
            if (get('Content-Type').toLowerCase().split(';')[0].trim() !== 'text/html') continue;
            const enc = get('Content-Transfer-Encoding').toLowerCase();
            const text = mhtDecodeText({ type: 'text/html', enc: enc, loc: get('Content-Location'), body: c.slice(e + 4) });
            if (text.indexOf('data-save-as-mht-nest') < 0) continue;
            const r = mhtDenestHtml(text);
            if (!r.fixed) continue;
            const b64 = (enc === 'quoted-printable' || enc === 'base64') ? btoa(r.html) : mhtUtf8ToB64(r.html);
            const newHead = /^Content-Transfer-Encoding:/im.test(raw)
                ? raw.replace(/^Content-Transfer-Encoding:.*$/im, 'Content-Transfer-Encoding: base64')
                : raw + '\r\nContent-Transfer-Encoding: base64';
            chunks[i] = newHead + '\r\n\r\n' + (b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
            fixed += r.fixed;
        }
        if (!fixed) return mhtmlText;
        console.log('SaveAsMHT: nested elements renamed in the saved HTML:', fixed);
        return chunks.join(sep);
    } catch (e) {
        console.warn('SaveAsMHT: renaming nested elements failed', e);
        return mhtmlText;
    }
}

// === MHT video frame (patch MhtVideoFrame) ===
// The picture of a <video> is not part of the DOM: a saved page shows a black box in its place, because the
// video source (a blob: or a stream) does not exist when the .mht is opened. Right before the capture the
// worker draws the frame that is on the screen now into a canvas in every frame of the tab (also inside
// shadow roots) and puts it into the poster attribute of that <video>. A poster is drawn in the same box
// as the video, with the same size, position and object-fit, so the frame appears exactly in the player.
// The old poster value is kept in a temporary attribute and is restored right after the capture.
// A page without scripts (an opened .mht) makes the browser show its own controls on every <video>, so a
// temporary style hides them on videos that have no controls attribute, as on the live page.
// Not possible: video of another origin that the page may not read (the canvas is blocked), and protected
// (DRM) video, which gives a black frame; such a video keeps its own poster, if it has one.
// Set MHT_VIDEO_FRAMES to false to switch the feature off.
const MHT_VIDEO_FRAMES = true;
const MHT_VIDEO_FRAMES_MAX = 24;
const MHT_VIDEO_FRAMES_QUALITY = 0.95;
// Runs inside the page (in every frame)
function mhtVideoFramesInPage(quality: number, max: number): any {
    const P = 'data-save-as-mht-prev-poster';
    const SA = 'data-save-as-mht-video-style';
    const rep: any = { frame: location.href, videos: 0, set: 0, skipped: 0 };
    const shadowOf = function (el: any): any {
        try {
            const dom = (chrome as any).dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const roots: any[] = [];
    const walk = function (root: any): void {
        roots.push(root);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
    // true when the picture is completely black (a protected video or a video that has not started)
    const isBlack = function (src: any): boolean {
        const s = document.createElement('canvas');
        s.width = 16;
        s.height = 16;
        const g = s.getContext('2d');
        if (!g) return false;
        g.drawImage(src, 0, 0, 16, 16);
        const d = g.getImageData(0, 0, 16, 16).data;
        for (let i = 0; i < d.length; i += 4) {
            if (d[i] > 6 || d[i + 1] > 6 || d[i + 2] > 6) return false;
        }
        return true;
    };
    roots.forEach(function (root: any) {
        // leftovers of an earlier capture that did not finish
        root.querySelectorAll('video[' + P + ']').forEach(function (v: any) {
            const old = v.getAttribute(P) || '';
            if (old.charAt(0) === 'S') v.setAttribute('poster', old.slice(1)); else v.removeAttribute('poster');
            v.removeAttribute(P);
        });
        root.querySelectorAll('style[' + SA + ']').forEach(function (s: any) { s.remove(); });
        const before = rep.set;
        root.querySelectorAll('video').forEach(function (v: any) {
            rep.videos++;
            if (rep.set >= max) { rep.skipped++; return; }
            try {
                // a video that is hidden, or has no picture yet, has nothing to show
                if (v.readyState < 2 || !v.videoWidth || !v.videoHeight || !v.getClientRects().length) { rep.skipped++; return; }
                const c = document.createElement('canvas');
                c.width = v.videoWidth;
                c.height = v.videoHeight;
                const g = c.getContext('2d');
                if (!g) { rep.skipped++; return; }
                g.drawImage(v, 0, 0, c.width, c.height);
                const had = v.hasAttribute('poster');
                if (had && isBlack(c)) { rep.skipped++; return; }
                const url = c.toDataURL('image/jpeg', quality);
                if (!url || url.length < 200) { rep.skipped++; return; }
                v.setAttribute(P, had ? 'S' + (v.getAttribute('poster') || '') : '');
                v.setAttribute('poster', url);
                rep.set++;
            } catch (e) {
                // a canvas that the page may not read (video of another origin)
                rep.skipped++;
                rep.error = String((e && (e as any).name) || e);
            }
        });
        if (rep.set > before) {
            // the browser's own controls are shown on a video when a page has no scripts: hide them where the live page shows none
            const st = document.createElement('style');
            st.setAttribute(SA, '1');
            st.textContent = 'video:not([controls])::-webkit-media-controls,video:not([controls])::-webkit-media-controls-enclosure,video:not([controls])::-webkit-media-controls-panel{display:none!important}';
            ((root.nodeType === 9 ? (root.head || root.documentElement) : root) as any).appendChild(st);
        }
    });
    return rep;
}
// Runs inside the page (in every frame): puts the old poster values back
function mhtVideoFramesCleanupInPage(): void {
    const P = 'data-save-as-mht-prev-poster';
    const SA = 'data-save-as-mht-video-style';
    const shadowOf = function (el: any): any {
        try {
            const dom = (chrome as any).dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const walk = function (root: any): void {
        root.querySelectorAll('video[' + P + ']').forEach(function (v: any) {
            const old = v.getAttribute(P) || '';
            if (old.charAt(0) === 'S') v.setAttribute('poster', old.slice(1)); else v.removeAttribute('poster');
            v.removeAttribute(P);
        });
        root.querySelectorAll('style[' + SA + ']').forEach(function (s: any) { s.remove(); });
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
}
async function mhtVideoFrames(tabId: number): Promise<void> {
    if (!MHT_VIDEO_FRAMES) return;
    try {
        const res = await chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: true },
            func: mhtVideoFramesInPage,
            args: [MHT_VIDEO_FRAMES_QUALITY, MHT_VIDEO_FRAMES_MAX],
        });
        const list = (res || []).map(function (r: any) { return r.result; }).filter(function (r: any) { return r && r.videos; });
        if (list.length) console.log('SaveAsMHT: video frames:', JSON.stringify(list));
    } catch (e) {
        console.warn('SaveAsMHT: video frame capture failed', e);
    }
}
async function mhtVideoFramesCleanup(tabId: number): Promise<void> {
    if (!MHT_VIDEO_FRAMES) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtVideoFramesCleanupInPage });
    } catch (e) { }
}
// The frames are taken as late as possible, right before the capture, so that they are as fresh as possible
async function mhtCaptureWithFrames(tabId: number, pageUrl: string): Promise<string> {
    await mhtVideoFrames(tabId);
    mhtTick('videoFrames'); return await mhtCaptureVerified(tabId, pageUrl);
}

// === MHT virtual spacers (patch MhtVirtualSpacers) ===
// Some feeds (for example the Instagram home feed) keep in the DOM only the posts that are near the
// viewport. The posts that are scrolled away are replaced by an empty space: the list box gets a big
// inline padding-top / padding-bottom, the posts themselves live only in the page's memory. pageCapture
// saves the DOM, so the saved .mht has the mounted posts and then a blank area, although the scroll
// bar is long. (patch MhtVirtualRows only knows lists with data-plane-row, for example grok.com.)
// Nothing is scrolled: the worker finds every list box whose padding is a placeholder, measures the
// whole scroll extent (scrollHeight of the document) and makes the page report a viewport
// (window.innerHeight, documentElement.clientHeight, visualViewport.height) as tall as that extent,
// then fires resize/scroll, so the site mounts every row by itself. The rows stay mounted for the
// time of the capture, so the .mht holds exactly the DOM that the site built. Right after the
// capture the real values are put back (a timer in the page does the same if the worker dies).
// Nothing is written into the DOM. Lists that live in their own scroll box (not the window) are
// left alone. Set MHT_VIRTUAL_SPACERS to false to switch the feature off.
const MHT_VIRTUAL_SPACERS = true;
const MHT_SPACERS_MIN_PX = 300;
const MHT_SPACERS_MAX_MS = 15000;
// Runs inside the page (in the MAIN world, the site's own scripts must see the changed viewport)
async function mhtExpandSpacersInPage(minPx: number, maxMs: number): Promise<any> {
    const KEY = '__saveAsMhtSpacers';
    const W: any = window;
    const sleep = function (ms: number) { return new Promise(function (r) { setTimeout(r, ms); }); };
    // leftovers of an earlier capture that did not finish
    try { if (W[KEY] && W[KEY].restore) W[KEY].restore(); } catch (e) { }
    const rep: any = { boxes: 0, scroller: 'window', rowsBefore: 0, rowsAfter: 0, padBefore: 0, padAfter: 0, extent: 0, viewport: 0, ms: 0, mounted: false, skipped: '' };
    const se: any = document.scrollingElement || document.documentElement;
    const num = function (v: any) { const n = parseFloat(v); return isFinite(n) ? n : 0; };
    const inlinePx = function (el: Element, prop: string) {
        const m = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([\\d.]+)px', 'i').exec(el.getAttribute('style') || '');
        return m ? parseFloat(m[1]) : 0;
    };
    // 1) list boxes whose inline padding is a placeholder for rows that are not mounted
    const boxes: any[] = [];
    const cand = document.querySelectorAll('[style*="padding-top"],[style*="padding-bottom"]');
    for (let i = 0; i < cand.length && boxes.length < 8; i++) {
        const el = cand[i];
        if (Math.max(inlinePx(el, 'padding-top'), inlinePx(el, 'padding-bottom')) < minPx) continue;
        if (el.childElementCount < 1 || !el.getClientRects().length) continue;
        boxes.push(el);
    }
    const absBoxes: any[] = [];
{
    // boxes with a big inline height whose rows are all position:absolute and cover only a part of it (patch MhtFillLists)
    const hc = document.querySelectorAll('[style*="height"]');
    for (let i = 0; i < hc.length && boxes.length < 8; i++) {
        const el = hc[i];
        if (boxes.indexOf(el) >= 0 || inlinePx(el, 'height') < minPx || !el.childElementCount || !el.getClientRects().length) continue;
        let n = 0, abs = 0, bottom = 0, minY = Infinity;
        for (let c: any = el.firstElementChild; c; c = c.nextElementSibling) {
            n++;
            if (getComputedStyle(c).position === 'absolute') abs++;
            const st = c.getAttribute('style') || '';
            const m = /translate(?:Y|3d)?\(\s*(?:[^,)]*,\s*)?(-?[\d.]+)px/i.exec(st) || /(?:^|;)\s*top\s*:\s*(-?[\d.]+)px/i.exec(st);
            bottom = Math.max(bottom, (m ? parseFloat(m[1]) : 0) + (c.offsetHeight || 0)); minY = Math.min(minY, (m ? parseFloat(m[1]) : 0));
        }
        if (n && abs === n && (inlinePx(el, 'height') - bottom >= 400 || minY >= 400)) { boxes.push(el); absBoxes.push(el); }
    }
}
const fallbackOn = arguments.length > 2 ? !!arguments[2] : true;
const ghostBoxes: any[] = [];
const sy0 = Math.round(W.scrollY || se.scrollTop || 0);
rep.scrollY = sy0;
let quick = false;
{
    // empty boxes with an inline height that stand where rows were unmounted (patch MhtScrollTop)
    const gc = document.querySelectorAll('[style*="height"]');
    const byParent = new Map();
    for (let i = 0; i < gc.length && i < 8000; i++) {
        const el = gc[i];
        if (el.firstElementChild || (el.textContent || '').trim() || !el.getClientRects().length) continue;
        if (Math.max(inlinePx(el, 'height'), inlinePx(el, 'min-height')) < 120) continue;
        const p = el.parentElement;
        if (!p || boxes.indexOf(p) >= 0) continue;
        byParent.set(p, (byParent.get(p) || 0) + 1);
    }
    byParent.forEach(function (n: number, p: any) {
        if (boxes.length >= 8) return;
        if (n >= 2 || (n >= 1 && p.childElementCount >= 3)) { boxes.push(p); ghostBoxes.push(p); }
    });
    rep.ghosts = ghostBoxes.length;
}
if (!boxes.length && fallbackOn && sy0 > 200) { boxes.push(document.body); ghostBoxes.push(document.body); quick = true; rep.fallback = true; }
// the page reports its coordinates as if it was not scrolled
const shiftRects = function () {
    const EP = Element.prototype;
    const origB = EP.getBoundingClientRect;
    const origC = EP.getClientRects;
    const mk = function (r: any) { return new DOMRect(r.left, r.top + sy0, r.width, r.height); };
    EP.getBoundingClientRect = function () { return mk(origB.call(this)); };
    EP.getClientRects = function () {
        const l = origC.call(this);
        const out: any = [];
        for (let i = 0; i < l.length; i++) out.push(mk(l[i]));
        out.item = function (i: number) { return out[i] || null; };
        return out;
    };
    undo.push(function () { EP.getBoundingClientRect = origB; EP.getClientRects = origC; });
    rep.rectShift = sy0;
};
if (!boxes.length) { rep.skipped = 'no spacer'; return rep; }
    // a box inside its own scroll box is not driven by the window: not touched here
    const inOwnScroller = function (box: any) {
        for (let p = box.parentElement; p && p !== document.documentElement && p !== document.body; p = p.parentElement) {
            const oy = getComputedStyle(p).overflowY;
            if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return true;
        }
        return false;
    };
    const live = boxes.filter(function (b) { return !inOwnScroller(b); });
    if (!live.length) { rep.skipped = 'own scroller'; return rep; }
    const padOf = function (box: any) {
        const cs = getComputedStyle(box);
        return num(cs.paddingTop) + num(cs.paddingBottom);
    };
    const rowsNow = function () { let n = 0; live.forEach(function (b: any) { n += b.childElementCount; }); return n; };
    const padNow = function () { let n = 0; live.forEach(function (b: any) { n += padOf(b); }); return Math.round(n); };
    rep.boxes = live.length;
    rep.rowsBefore = rowsNow();
    rep.padBefore = padNow();
    // 2) the scroll extent: the whole height of the scroll bar
    const extentNow = function () {
        return Math.ceil(Math.max(se.scrollHeight || 0, document.documentElement.scrollHeight || 0, document.body ? document.body.scrollHeight : 0));
    };
    const LIMIT = 400000;
    rep.extent = extentNow();
    let curH = Math.min(Math.max(rep.extent + 200, W.innerHeight), LIMIT);
    const needTop = live.some(function (b: any) { return inlinePx(b, 'padding-top') >= minPx || absBoxes.indexOf(b) >= 0 || ghostBoxes.indexOf(b) >= 0 || sy0 > 200; });
    // 3) the page reports a viewport as tall as the extent (and, when rows above the visible part are
    //    missing too, a scroll position at the top)
    const undo: Array<() => void> = [];
    const override = function (obj: any, name: string, getter: () => number) {
        if (!obj) return;
        let own: any = null;
        try { own = Object.getOwnPropertyDescriptor(obj, name) || null; } catch (e) { }
        try {
            Object.defineProperty(obj, name, { configurable: true, enumerable: own ? own.enumerable : false, get: getter });
            undo.push(function () { try { if (own) Object.defineProperty(obj, name, own); else delete obj[name]; } catch (e) { } });
        } catch (e) { }
    };
    const fire = function () {
        try { W.dispatchEvent(new Event('resize')); } catch (e) { }
        try { document.dispatchEvent(new Event('scroll', { bubbles: true })); } catch (e) { }
        try { if (W.visualViewport) { W.visualViewport.dispatchEvent(new Event('resize')); W.visualViewport.dispatchEvent(new Event('scroll')); } } catch (e) { }
    };
    const state: any = { done: false, timer: 0, restore: function () { } };
    state.restore = function () {
        if (state.done) return;
        state.done = true;
        clearTimeout(state.timer);
        for (let i = undo.length - 1; i >= 0; i--) undo[i]();
        try { if (W[KEY] === state) delete W[KEY]; } catch (e) { }
        fire();
    };
    // fail-safe: the real values come back even if the worker never calls the cleanup
    state.timer = setTimeout(state.restore, 90000);
    W[KEY] = state;
    override(W, 'innerHeight', function () { return curH; });
    override(document.documentElement, 'clientHeight', function () { return curH; });
    override(W.visualViewport, 'height', function () { return curH; });
    if (needTop) {
        override(W, 'scrollY', function () { return 0; });
        override(W, 'pageYOffset', function () { return 0; });
        override(se, 'scrollTop', function () { return 0; }); if (sy0 > 0) shiftRects();
    }
    // 4) wait until the site has mounted the rows (and the pictures of the rows are loaded)
    const sig = function () { let d = 0; live.forEach(function (b: any) { d += b.getElementsByTagName('*').length; }); return rowsNow() + ':' + padNow() + ':' + d; };
    const pending = function () { if (quick) return 0;
        let n = 0;
        live.forEach(function (b: any) {
            b.querySelectorAll('img').forEach(function (im: any) { if (im.getAttribute('src') && !im.complete) n++; });
        });
        return n;
    };
    const first = sig();
    const t0 = Date.now();
    let last = first;
    let same = 0;
    let tick = 0;
    try {
        fire();
        while (Date.now() - t0 < (quick ? Math.min(maxMs, 4000) : maxMs)) { await sleep(150);
            tick++;
            const ext = extentNow();
            if (ext + 200 > curH + 100 && ext + 200 < LIMIT) { curH = ext + 200; fire(); }
            else if (tick % 4 === 0 && same < 4) fire();
            const s = sig();
            if (s === last) same++; else { same = 0; last = s; }
            // nothing changed at all: give the site a bit more time (and two more events) before giving up
            if (same >= (quick ? 4 : (last === first ? 10 : 5)) && pending() === 0) break;
        }
    } catch (e) {
        state.restore();
        throw e;
    }
    rep.rowsAfter = rowsNow();
    rep.padAfter = padNow();
    rep.viewport = curH;
    rep.ms = Date.now() - t0;
    rep.mounted = rep.rowsAfter > rep.rowsBefore;
    return rep;
}
// Runs inside the page (in the MAIN world): puts the real viewport values back
function mhtExpandSpacersCleanupInPage(): void {
    const s = (window as any)['__saveAsMhtSpacers'];
    if (s && s.restore) s.restore();
}
async function mhtExpandSpacers(tabId: number): Promise<void> {
    if (!MHT_VIRTUAL_SPACERS) return;
    try {
        const r = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: 'MAIN',
            func: mhtExpandSpacersInPage,
            args: [MHT_SPACERS_MIN_PX, MHT_SPACERS_MAX_MS, MHT_SCROLLTOP_FALLBACK],
        } as any);
        const res: any = r && r[0] && r[0].result;
        if (res && (res.boxes || res.scrollY > 0)) console.log('SaveAsMHT: virtual spacers:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: virtual spacers expansion failed', e);
    }
}
async function mhtExpandSpacersCleanup(tabId: number): Promise<void> {
    if (!MHT_VIRTUAL_SPACERS) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId }, world: 'MAIN', func: mhtExpandSpacersCleanupInPage } as any);
    } catch (e) { }
}
// === END MhtVirtualSpacers ===
// === MHT scroll top (patch MhtScrollTop) ===
// The page is saved as if it was scrolled to the very top, wherever the scroll bar is now (nothing is scrolled):
//  - empty "ghost" cells (an empty box with an inline height) that stand where the site unmounted the rows are recognised as a virtual list
//  - the page reports its coordinates as if it was not scrolled: getBoundingClientRect / getClientRects get the real scroll offset added
//    (sites that decide by the position of an element on the screen, not by window.scrollY, mount the rows above too)
//  - a scrolled page where nothing else was recognised is still tried for a moment (MHT_SCROLLTOP_FALLBACK)
// The lower limit is the same as before: the whole scroll extent that is loaded now.
const MHT_SCROLLTOP_FALLBACK = true;
// === MHT fill lists (patch MhtFillLists) ===
// (version 3: width of the scroll box is kept, the sentinel is hidden, one pass per scroll box, screenshot while working,
//  cards that the site fills only while they are visible (IntersectionObserver) are filled too;
//  speed tweaks: shorter polling, at most 8 s per scroll box, the second capture is off by default;
//  version 4: a list that lacks rows at its START (the page is scrolled down) is found and filled too)
// 1) Virtual lists that live in the page's own scroll box. Example: civitai.red keeps the gallery in a box
//    with an inline height of tens of thousands of pixels and mounts only the few rows that are near the
//    visible part (absolutely positioned rows, translateY). Nothing is scrolled: the worker finds every
//    such box (inline height, all rows absolute, the mounted rows cover only a part of the height), makes
//    the scroll box as tall as its content (the site's own ResizeObserver mounts the rows), copies the rows,
//    puts the scroll box back and writes the copies into the DOM only for the time of the capture.
//    (Windows that scroll the whole document are handled by patch MhtVirtualSpacers, which now also knows
//    this kind of box.)
// 2) The page is given time to settle right before the capture (carousels and other components that mount
//    their content after the styles / layout changed) and the capture is verified: when the live page shows
//    images that are not in the saved HTML, the capture is repeated (MHT_RECAPTURE_MAX times at most).
// Set a constant to false to switch the feature off.
const MHT_FILL_LISTS = true;
const MHT_FILL_LISTS_MIN_PX = 300;
const MHT_SETTLE = true;
const MHT_SETTLE_QUIET_MS = 350;
const MHT_SETTLE_MAX_MS = 2500;
const MHT_RECAPTURE = false;
const MHT_RECAPTURE_MAX = 1;
// Runs inside the page. detectOnly = true: only count the virtual lists that need filling.
async function mhtExpandAbsListsInPage(minPx: number, shot: string, detectOnly: any) {
    const INJ = 'data-save-as-mht-injected';
    const SAVED = 'data-save-as-mht-vl-style';
    const sleep = function (ms: number) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const styleOf = function (el: any) { return el.getAttribute('style') || ''; };
    const inlinePx = function (el: any, prop: string) {
        const m = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*(-?[\\d.]+)px', 'i').exec(styleOf(el));
        return m ? parseFloat(m[1]) : 0;
    };
    const yOf = function (el: any) {
        const s = styleOf(el);
        let y = 0;
        let m = /translate(?:Y|3d)?\(\s*(?:[^,)]*,\s*)?(-?[\d.]+)px/i.exec(s);
        if (m) y += parseFloat(m[1]);
        m = /(?:^|;)\s*top\s*:\s*(-?[\d.]+)px/i.exec(s);
        if (m) y += parseFloat(m[1]);
        return y;
    };
    const xOf = function (el: any) {
        const s = styleOf(el);
        let x = 0;
        let m = /translate(?:X|3d)?\(\s*(-?[\d.]+)px/i.exec(s);
        if (m) x += parseFloat(m[1]);
        m = /(?:^|;)\s*left\s*:\s*(-?[\d.]+)px/i.exec(s);
        if (m) x += parseFloat(m[1]);
        return x;
    };
    const keyOf = function (el: any) { return Math.round(xOf(el)) + ':' + Math.round(yOf(el)); };
    const rowsOf = function (box: any) {
        return Array.prototype.filter.call(box.children, function (el: any) { return !el.hasAttribute(INJ); });
    };
    const rec = function (el: any, withNode: any) {
        return { key: keyOf(el), node: withNode ? el.cloneNode(true) : null, x: xOf(el), y: yOf(el), w: el.offsetWidth || 0, h: el.offsetHeight || 0 };
    };
    const overlaps = function (a: any, c: any) {
        const ix = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
        const iy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
        return ix > 0 && iy > 0 && ix * iy > 0.3 * Math.min(a.w * a.h, c.w * c.h);
    };
    const findScroller = function (box: any) {
        for (let p = box.parentElement; p && p !== document.documentElement && p !== document.body; p = p.parentElement) {
            const oy = getComputedStyle(p).overflowY;
            if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
        }
        return null;
    };
    const isPopulated = function (el: any) {
        return !!el.querySelector('img,svg,video,canvas,picture') || (el.textContent || '').trim() !== '';
    };
    // 1) boxes: big inline height, every child absolutely positioned, the mounted rows cover only a part of the height
    const boxes: any[] = [];
    const diag: any[] = [];
    const cand = document.querySelectorAll('[style*="height"]');
    for (let i = 0; i < cand.length && boxes.length < 12; i++) {
        const el = cand[i];
        const h = inlinePx(el, 'height');
        if (h < minPx || el.hasAttribute(INJ) || !el.getClientRects().length) continue;
        const kids = rowsOf(el);
        if (!kids.length) {
            // no row is mounted at all (the list is far from the visible part): a tall "position: relative" box with no content
            if (h >= 1500 && /(?:^|;)\s*position\s*:\s*relative/i.test(styleOf(el)) && el.offsetWidth > 0 && !el.childNodes.length) boxes.push(el);
            continue;
        }
        if (kids[0].hasAttribute('data-plane-row')) continue;
        let abs = 0;
        let bottom = 0;
        let minY = Infinity;
        kids.forEach(function (c: any) {
            if (getComputedStyle(c).position === 'absolute') abs++;
            bottom = Math.max(bottom, yOf(c) + (c.offsetHeight || 0));
            minY = Math.min(minY, yOf(c));
        });
        // rows are missing at the end of the list (the page is at its top) or at its start (the page is scrolled down)
        if (abs !== kids.length || (h - bottom < 400 && minY < 400)) {
            if (diag.length < 6) diag.push({ h: h, kids: kids.length, abs: abs, minY: Math.round(minY), bottom: Math.round(bottom) });
            continue;
        }
        boxes.push(el);
    }
    // 2) empty "shells" (a box with an inline aspect-ratio and an empty container inside): the site fills them
    //    only while they are visible (cards of carousels and feeds)
    const shells: any[] = [];
    const sc2 = document.querySelectorAll('[style*="aspect-ratio"]');
    for (let i = 0; i < sc2.length && shells.length < 400; i++) {
        const el = sc2[i];
        if (el.hasAttribute(INJ) || !el.childElementCount || !el.getClientRects().length || isPopulated(el)) continue;
        if (boxes.some(function (b: any) { return b.contains(el); })) continue;
        if (el.closest('[' + INJ + ']')) continue;
        shells.push(el);
    }
    // 3) everything that shares a scroll box is filled together, in one pass
    const groups: any[] = [];
    const groupOf = function (anchor: any) {
        const sc = findScroller(anchor);
        if (!sc) return null;
        let g = null;
        groups.forEach(function (x: any) { if (x.scroller === sc) g = x; });
        if (!g) { g = { scroller: sc, boxes: [], shells: [] }; groups.push(g); }
        return g;
    };
    boxes.forEach(function (box: any) { const g = groupOf(box); if (g) g.boxes.push(box); });
    shells.forEach(function (el: any) { const g = groupOf(el); if (g) g.shells.push(el); });
    if (detectOnly) return { n: groups.length, diag: diag };
    const report: any[] = [];
    for (let gi = 0; gi < groups.length; gi++) {
        const scroller = groups[gi].scroller;
        const gb = groups[gi].boxes;
        const gs = groups[gi].shells;
        const info = { boxes: gb.length, shells: gs.length, shellsPopulated: 0, shellsFilled: 0, rowsBefore: gb.map(function (b: any) { return rowsOf(b).length; }), rowsExpanded: [], copied: 0, injected: 0, covered: false, widthBefore: scroller.clientWidth, widthDuring: scroller.clientWidth, hidden: 0, ms: 0 };
        report.push(info);
        const t0 = Date.now();
        const top0 = scroller.scrollTop;
        const left0 = scroller.scrollLeft;
        const total = function (box: any) { return inlinePx(box, 'height') || box.offsetHeight || 0; };
        const needNow = function () {
            let need = 0;
            const st = scroller.getBoundingClientRect().top;
            gb.forEach(function (box: any) {
                const r = box.getBoundingClientRect();
                need = Math.max(need, r.bottom - st + scroller.scrollTop, r.top - st + scroller.scrollTop + total(box));
            });
            return Math.ceil(need) + 600;
        };
        const coveredBox = function (box: any) {
            let bottom = 0;
            let minY = Infinity;
            rowsOf(box).forEach(function (el: any) { bottom = Math.max(bottom, yOf(el) + el.offsetHeight); minY = Math.min(minY, yOf(el)); });
            return bottom >= total(box) - 500 && minY <= 500;
        };
        const covered = function () { return gb.every(coveredBox); };
        const countSig = function () {
            let n = 0;
            gb.forEach(function (box: any) { n += rowsOf(box).length * 1000 + box.getElementsByTagName('img').length + total(box); });
            gs.forEach(function (el: any) { if (isPopulated(el)) n += 7; });
            return n;
        };
        // the picture the user was looking at stays on the screen while the layout is changed
        let overlay: any = null;
        if (shot) {
            await new Promise(function (r) { const im = new Image(); im.onload = r; im.onerror = r; im.src = shot; });
            overlay = document.createElement('div');
            overlay.setAttribute(INJ, '1');
            overlay.style.cssText = 'all:initial!important;position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;z-index:2147483646!important;pointer-events:none!important;background:#000 url("' + shot + '") 0 0/100% 100% no-repeat!important';
            document.documentElement.appendChild(overlay);
            await sleep(60);
        }
        const hiddenEls: any[] = [];
        const shellSnap: any[] = [];
        const setH = function (n: number) { scroller.style.setProperty('height', Math.min(Math.ceil(n), 400000) + 'px', 'important'); };
        const early: any[] = gb.map(function () { return []; });
        const seen: any[] = gb.map(function () { return {}; });
        let final: any[] = gb.map(function () { return []; });
        const restoreAll = function () {
            const v = scroller.getAttribute(SAVED);
            if (v !== null) {
                if (v.charAt(0) === 'S') scroller.setAttribute('style', v.slice(1)); else scroller.removeAttribute('style');
                scroller.removeAttribute(SAVED);
            }
            hiddenEls.forEach(function (h: any) {
                if (h.prev === null) h.el.removeAttribute('style'); else h.el.setAttribute('style', h.prev);
                h.el.removeAttribute(SAVED);
            });
            hiddenEls.length = 0;
            scroller.scrollTop = top0;
            scroller.scrollLeft = left0;
        };
        try {
            // 3) what follows the lists (the "load more" sentinel, the footer) is hidden for a moment:
            //    otherwise the sentinel sees the tall scroll box and the site loads the next page
            const anchors = gb.concat(gs);
            const sources = gb.slice();
            if (gs.length) {
                const lastShell = gs[gs.length - 1];
                if (!gb.length || (gb[gb.length - 1].compareDocumentPosition(lastShell) & 4)) sources.push(lastShell);
            }
            sources.forEach(function (src: any) {
                for (let a = src.parentElement; a && a !== scroller; a = a.parentElement) {
                    for (let s = a.nextElementSibling; s; s = s.nextElementSibling) {
                        if (s.hasAttribute(INJ) || s.hasAttribute(SAVED) || anchors.some(function (b: any) { return s.contains(b); })) continue;
                        const prev = s.getAttribute('style');
                        s.setAttribute(SAVED, prev === null ? 'N' : 'S' + prev);
                        s.style.setProperty('display', 'none', 'important');
                        hiddenEls.push({ el: s, prev: prev });
                    }
                }
            });
            info.hidden = hiddenEls.length;
            // 4) the scroll box becomes as tall as the lists: the site mounts every row by itself.
            //    The width must not change (the site lays the columns out by it), so the scroll bar stays.
            const prevStyle = scroller.getAttribute('style');
            scroller.setAttribute(SAVED, prevStyle === null ? 'N' : 'S' + prevStyle);
            scroller.style.setProperty('max-height', 'none', 'important');
            scroller.style.setProperty('min-height', '0', 'important');
            scroller.style.setProperty('overflow-y', 'scroll', 'important');
            const par = scroller.parentElement;
            if (par) {
                const ps = getComputedStyle(par);
                if (/flex/.test(ps.display) && /column/.test(ps.flexDirection)) scroller.style.setProperty('flex', 'none', 'important');
            }
            let cur = Math.max(scroller.scrollHeight + 600, needNow());
            setH(cur);
            let last = -1;
            let same = 0;
            for (let t = 0; t < 150 && Date.now() - t0 < 8000 && !(same >= 5 && covered()); t++) {
                await sleep(70);
                const want = needNow();
                if (want > cur) { cur = want; setH(cur); }
                gb.forEach(function (box: any, bi: number) {
                    rowsOf(box).forEach(function (el: any) {
                        const k = keyOf(el);
                        if (!seen[bi][k]) { seen[bi][k] = 1; early[bi].push(rec(el, true)); }
                    });
                });
                info.widthDuring = scroller.clientWidth;
                const sig = countSig();
                if (sig === last) same++; else { same = 0; last = sig; }
            }
            gs.forEach(function (el: any) {
                if (el.isConnected && isPopulated(el)) shellSnap.push({ el: el, kids: Array.prototype.map.call(el.childNodes, function (n: any) { return n.cloneNode(true); }) });
            });
            info.shellsPopulated = shellSnap.length;
            final = gb.map(function (box: any) { return rowsOf(box).map(function (el: any) { return rec(el, true); }); });
            info.rowsExpanded = final.map(function (f: any) { return f.length; });
            info.covered = covered();
        } finally {
            restoreAll();
        }
        // 5) rows seen only before the final state are kept when they do not overlap
        const keeps = gb.map(function (box: any, bi: number) {
            const keep = final[bi].slice();
            early[bi].forEach(function (e: any) {
                if (!keep.some(function (f: any) { return f.key === e.key || overlaps(f, e); })) keep.push(e);
            });
            return keep;
        });
        info.copied = keeps.reduce(function (n: number, k: any) { return n + k.length; }, 0);
        // 6) wait until the site drops the rows that are far from the visible part again
        let last2 = -1;
        let same2 = 0;
        for (let t = 0; t < 20 && same2 < 3; t++) {
            await sleep(70);
            let n = 0;
            gb.forEach(function (box: any) { n += rowsOf(box).length; });
            if (n === last2) same2++; else { same2 = 0; last2 = n; }
        }
        // 7) put back the copies of the rows that are not in the DOM now (removed right after the capture)
        gb.forEach(function (box: any, bi: number) {
            const sib = rowsOf(box);
            const present = sib.map(function (el: any) { return rec(el, false); });
            keeps[bi].forEach(function (it: any) {
                if (present.some(function (p: any) { return p.key === it.key || overlaps(p, it); })) return;
                const node = it.node;
                node.setAttribute(INJ, '1');
                let ref = null;
                for (let i = 0; i < sib.length; i++) {
                    if (yOf(sib[i]) > it.y) { ref = sib[i]; break; }
                }
                box.insertBefore(node, ref);
                info.injected++;
            });
        });
        // 8) shells that are empty again get the content they had while they were visible (removed right after the capture;
        //    the empty original children are only hidden, the site's own nodes are never removed)
        shellSnap.forEach(function (it: any) {
            const el = it.el;
            if (!el.isConnected || isPopulated(el)) return;
            Array.prototype.slice.call(el.children).forEach(function (c: any) {
                if (c.hasAttribute(INJ) || c.hasAttribute(SAVED)) return;
                const prev = c.getAttribute('style');
                c.setAttribute(SAVED, prev === null ? 'N' : 'S' + prev);
                c.style.setProperty('display', 'none', 'important');
            });
            it.kids.forEach(function (k: any) {
                if (k.nodeType !== 1) return;
                k.setAttribute(INJ, '1');
                el.appendChild(k);
            });
            info.shellsFilled++;
        });
        await sleep(100);
        if (overlay) overlay.remove();
        info.ms = Date.now() - t0;
    }
    return report;
}
async function mhtExpandAbsLists(tabId: number) {
    if (!MHT_FILL_LISTS) return;
    try {
        const d = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: mhtExpandAbsListsInPage,
            args: [MHT_FILL_LISTS_MIN_PX, '', true],
        });
        const det = d && d[0] && d[0].result;
        if (det && !det.n && det.diag && det.diag.length) console.log('SaveAsMHT: fill lists - tall boxes that were not taken:', JSON.stringify(det.diag));
        if (!det || !det.n) return;
        let shot = '';
        try {
            const tab = await chrome.tabs.get(tabId);
            shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 100 });
        } catch (e) { shot = ''; }
        const r = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: mhtExpandAbsListsInPage,
            args: [MHT_FILL_LISTS_MIN_PX, shot, false],
        });
        const res = r && r[0] && r[0].result;
        if (res && res.length) console.log('SaveAsMHT: fill lists:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: filling virtual lists failed', e);
    }
}
// Runs inside the page: waits until no element is added to / removed from the DOM for quietMs
// (and the temporary stylesheets of patch MhtShadowStyles are applied), at most maxMs
async function mhtSettleDomInPage(quietMs: number, maxMs: number) {
    const rep = { waited: 0, mutations: 0 };
    const t0 = Date.now();
    let last = Date.now();
    const ours = function (n: any) {
        return n.hasAttribute('data-save-as-mht-injected') || n.hasAttribute('data-save-as-mht-sr') ||
            (n.id || '').indexOf('__save_as_mht') === 0;
    };
    const mo = new MutationObserver(function (list: any) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].type !== 'childList') continue;
            const nodes = Array.prototype.slice.call(list[i].addedNodes).concat(Array.prototype.slice.call(list[i].removedNodes));
            for (let k = 0; k < nodes.length; k++) {
                if (nodes[k].nodeType === 1 && !ours(nodes[k])) { last = Date.now(); rep.mutations++; return; }
            }
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    const linksPending = function () {
        let n = 0;
        document.querySelectorAll('link[data-save-as-mht-sr]').forEach(function (l: any) { if (!l.sheet) n++; });
        return n;
    };
    try {
        while (Date.now() - t0 < maxMs) {
            await new Promise(function (r) { setTimeout(r, 100); });
            if (Date.now() - last >= quietMs && linksPending() === 0) break;
        }
    } finally {
        mo.disconnect();
    }
    rep.waited = Date.now() - t0;
    return rep;
}
async function mhtSettleDom(tabId: number) {
    if (!MHT_SETTLE) return;
    try {
        const r = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: mhtSettleDomInPage,
            args: [MHT_SETTLE_QUIET_MS, MHT_SETTLE_MAX_MS],
        });
        const res = r && r[0] && r[0].result;
        if (res) console.log('SaveAsMHT: page settled:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: waiting for the page failed', e);
    }
}
// Runs inside the page: addresses of the images that the page shows now
function mhtLiveImageUrlsInPage() {
    const out: any[] = [];
    const seen: any = {};
    const walk = function (root: any) {
        root.querySelectorAll('*').forEach(function (el: any) {
            if (el.tagName === 'IMG' && el.getClientRects().length) {
                const b = el.getBoundingClientRect();
                const u = el.src || el.currentSrc;
                if (b.width * b.height >= 16 && u && /^https?:/i.test(u)) {
                    const k = u.split('#')[0];
                    if (!seen[k]) { seen[k] = 1; out.push(k); }
                }
            }
            let sr = null;
            try {
                sr = (chrome.dom && chrome.dom.openOrClosedShadowRoot) ? chrome.dom.openOrClosedShadowRoot(el) : el.shadowRoot;
            } catch (ex) { sr = el.shadowRoot; }
            if (sr) walk(sr);
        });
    };
    walk(document);
    return out;
}
// How many images that the live page shows are not referenced by the HTML of the finished capture
async function mhtCountMissingImages(tabId: number, dataUrl: string) {
    try {
        const head = dataUrl.indexOf(',') + 1;
        const text = atob(dataUrl.slice(head, head + 24 * 1024 * 1024));
        const info = mhtListParts(text);
        if (!info) return 0;
        let html = '';
        info.parts.forEach(function (p: any) { if (/^text\/html/.test(p.type)) html += mhtDecodeText(p) + '\n'; });
        const inj = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtLiveImageUrlsInPage });
        const urls = (inj && inj[0] && inj[0].result) || [];
        let miss = 0;
        urls.forEach(function (u: string) {
            let dec = u;
            try { dec = decodeURI(u); } catch (e) { }
            const has = function (s: string) { return html.indexOf(s) >= 0 || html.indexOf(s.replace(/&/g, '&amp;')) >= 0; };
            if (!has(u) && !has(dec)) miss++;
        });
        console.log('SaveAsMHT: images shown by the page:', urls.length, ', missing in the saved HTML:', miss);
        return miss;
    } catch (e) {
        console.warn('SaveAsMHT: capture check failed', e);
        return 0;
    }
}
async function mhtCaptureVerified(tabId: number, pageUrl: string) {
    let url = await captureTabToDataUrl(tabId, pageUrl);
    if (!MHT_RECAPTURE) return url;
    for (let i = 0; i < MHT_RECAPTURE_MAX; i++) {
        const miss = await mhtCountMissingImages(tabId, url);
        if (!miss) break;
        console.log('SaveAsMHT: the page changed during the capture, capturing again (' + (i + 1) + ')');
        await mhtSettleDom(tabId);
        url = await captureTabToDataUrl(tabId, pageUrl);
    }
    return url;
}
// === END MhtFillLists ===
// === MHT speed (patch MhtSpeed) ===
// Where the time goes: the worker itself needs only tens of milliseconds (JavaScript is single-threaded, there is nothing to
// split between threads); the time is spent waiting for the page and for the network. So:
//  - the in-page fallback that fetches images / fonts one by one (no time limit) now runs several requests at a time with limits
//  - the worker fetches up to MHT_IMG_CONCURRENCY images at once and stops starting new ones after MHT_IMG_BUDGET_MS
//  - srcset candidates of an <img> that has a src are not fetched (Chrome keeps only src in the .mht)
//  - children of <svg> are not asked for computed styles (thousands of icon paths)
//  - MHT_TIMINGS prints how long every step took (service worker console, line "SaveAsMHT: timings")
const MHT_TIMINGS = true;
const MHT_IMG_CONCURRENCY = 16;
const MHT_IMG_BUDGET_MS = 40000;
let mhtTickLast = 0;
let mhtTickLog: string[] = [];
function mhtTickReset() { mhtTickLast = Date.now(); mhtTickLog = []; }
function mhtTick(label: string) {
    const n = Date.now();
    mhtTickLog.push(label + ' ' + (n - mhtTickLast));
    mhtTickLast = n;
}
function mhtTickReport() {
    if (MHT_TIMINGS && mhtTickLog.length) console.log('SaveAsMHT: timings (ms):', mhtTickLog.join(', '));
    mhtTickLog = [];
}
// Runs inside the page: fetches several addresses at a time (limit), every request has its own time limit (perMs)
// and the whole job has one (totalMs). Same result as mhtFetchFontsInPage: [{ url, b64 }]
async function mhtFetchManyInPage(urls: any[], maxOne: number, limit: number, perMs: number, totalMs: number) {
    const out: any[] = [];
    const t0 = Date.now();
    let next = 0;
    const run = async function () {
        while (next < urls.length && Date.now() - t0 < totalMs) {
            const u = urls[next++];
            const ctl = new AbortController();
            const timer = setTimeout(function () { ctl.abort(); }, perMs);
            try {
                const r = await fetch(u, { signal: ctl.signal });
                if (!r.ok) continue;
                const buf = await r.arrayBuffer();
                if (!buf.byteLength || buf.byteLength > maxOne) continue;
                const bytes = new Uint8Array(buf);
                let bin = '';
                for (let i = 0; i < bytes.length; i += 0x8000) {
                    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
                }
                out.push({ url: u, b64: btoa(bin) });
            } catch (e) { } finally { clearTimeout(timer); }
        }
    };
    const w: any[] = [];
    for (let k = 0; k < Math.min(limit, urls.length); k++) w.push(run());
    await Promise.all(w);
    return out;
}
// === END MhtSpeed ===
// === MHT child frames (patch MhtChildFrames) ===
// Why the mail on https://app.mail.ru was missing in the saved .mht: the page is a shell, and the mailbox lives in an
// <iframe> that has no src attribute (the site navigates it with a form target / location.replace). pageCapture saves
// the frame as a separate part of the .mht, but it writes the link "src=cid:..." only into an iframe that HAS a src,
// so the saved shell contained an empty iframe and the saved mailbox stayed an orphan part nobody showed.
// What this patch does (nothing is scrolled, nothing of the site is changed for good):
//  1) FRAME LINKS. Before the capture every child frame gets a temporary id on its <html>, and the parent marks the
//     <iframe> that holds that frame (the child posts one message to its parent; the parent compares event.source with
//     iframe.contentWindow, the message is swallowed in the capture phase, the page never sees it). After the capture
//     the saved HTML of the parent gets src="cid:..." of the saved frame for every marked iframe that lacks it, and
//     the temporary attributes are removed. Works for any depth and for cross-origin frames.
//  2) CHILD FRAMES GET THE SAME PREPARATION AS THE TOP PAGE: hidden elements are frozen (what an ad blocker hides stays
//     hidden), control colors are kept, absolutely positioned virtual lists are filled.
//  3) VIEWPORT-DRIVEN LISTS (every frame, also the top one). Lists made with react-virtualized / AutoSizer, react-window
//     and similar keep in the DOM only the rows near the visible part of their own scroll box: the box has a tall
//     inner container (the whole scroll extent), but only the rows around the viewport are mounted, the rest of the
//     extent is empty. The worker measures the extent (scrollHeight), makes the box and the elements that give it its
//     height as tall as the extent for a moment (the site's own resize observer mounts every row), copies the rows,
//     puts the sizes back and writes the copies into the DOM for the time of the capture. The live page is covered by
//     a picture of itself meanwhile, so nothing flickers. The scroll box stays a scroll box in the saved file.
//  (version 2: the lists are filled BEFORE the older list filler runs - that one used to copy only the rows at the top and
//   left the rest empty; MHT_VP_KEEP_WIDTH: the saved page keeps the width of the window it was saved in, so a narrower
//   window does not push an empty ad column over the scroll bar of a list whose width the site fixed in pixels)
//  (version 4: the red button says PROCESSING on the live page and ORIGINAL LINK only in the saved file; links to web addresses
//   open in a new tab in the saved file; the live page is watched during the capture; layers of lists are not made huge)
//  (version 3: a list counts as complete only when no part of its scroll extent is empty, not just its two ends; the site is
//   given time to load rows; if it still does not give some part, the scroll box is moved to that part under the picture of
//   the page (MHT_VP_SCROLL_HOLES); rows the site mounts again are not doubled; the list goes above overlapping columns)
// Set MHT_CHILD_FRAMES / MHT_FRAME_LINKS / MHT_VP_LISTS / MHT_VP_KEEP_WIDTH / MHT_VP_SCROLL_HOLES to false to switch a part off.
const MHT_CHILD_FRAMES = true;
const MHT_FRAME_LINKS = true;
const MHT_VP_LISTS = true;
const MHT_VP_MIN_GAP = 300;
const MHT_VP_MAX_MS = 15000;
const MHT_VP_SCROLL_HOLES = true;
// the red button of the live page says PROCESSING while the extension works; the saved file gets ORIGINAL LINK
const MHT_SOURCE_LINK_TEXT = true;
// every link to a web address opens in a new tab in the saved file (the saved page stays on the screen)
const MHT_LINKS_NEW_TAB = true;
// watches the live page during the capture: lists the errors the page raised and reloads the page if it lost its content
const MHT_GUARD = true;
const MHT_AUTO_RELOAD = true;
const MHT_VP_KEEP_WIDTH = true;
// Runs inside the page (every frame). pass 1: temporary id + listener, pass 2: the child tells its parent, pass 3: collect
function mhtFramesPassInPage(pass: any) {
    const KEY = '__saveAsMhtFrames';
    const A = 'data-save-as-mht-fid';
    const C = 'data-save-as-mht-child';
    const W: any = window;
    const isTop = W === W.top;
    const rep: any = { frame: location.href, top: isTop, marked: 0 };
    if (pass === 1) {
        try { const o = W[KEY]; if (o && o.l) W.removeEventListener('message', o.l, true); } catch (e) { }
        const st: any = { n: 0, fid: '', l: null };
        st.l = function (ev: any) {
            const d = ev && ev.data;
            if (!d || d.__saveAsMht !== 1 || typeof d.fid !== 'string') return;
            try { ev.stopImmediatePropagation(); } catch (e) { }
            const els: any = document.querySelectorAll('iframe,frame');
            for (let i = 0; i < els.length; i++) {
                let same = false;
                try { same = els[i].contentWindow === ev.source; } catch (e) { }
                if (same) { els[i].setAttribute(C, d.fid); st.n++; }
            }
        };
        W.addEventListener('message', st.l, true);
        if (!isTop) {
            st.fid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
            document.documentElement.setAttribute(A, st.fid);
        }
        W[KEY] = st;
        return rep;
    }
    const s2: any = W[KEY];
    if (!s2) return rep;
    if (pass === 2) {
        if (!isTop && s2.fid) {
            try { W.parent.postMessage({ __saveAsMht: 1, fid: s2.fid }, '*'); } catch (e) { }
        }
        return rep;
    }
    return new Promise(function (resolve: any) {
        setTimeout(function () { rep.marked = s2.n; resolve(rep); }, 80);
    });
}
// Runs inside the page (every frame): removes the temporary ids and the listener
function mhtFramesCleanupInPage() {
    const W: any = window;
    try {
        const o = W['__saveAsMhtFrames'];
        if (o && o.l) W.removeEventListener('message', o.l, true);
        delete W['__saveAsMhtFrames'];
    } catch (e) { }
    try { document.documentElement.removeAttribute('data-save-as-mht-fid'); } catch (e) { }
    try {
        document.querySelectorAll('[data-save-as-mht-vp]').forEach(function (el: any) { el.remove(); });
        const mw = document.getElementById('__save_as_mht_minw__');
        if (mw) mw.remove();
    } catch (e) { }
    try {
        document.querySelectorAll('[data-save-as-mht-child]').forEach(function (el: any) { el.removeAttribute('data-save-as-mht-child'); });
    } catch (e) { }
}
// Runs inside the page (top frame): a picture of the screen above the page while child frames are rearranged
function mhtShotOverlayInPage(shot: any, on: any) {
    const id = '__save_as_mht_shot__';
    const old = document.getElementById(id);
    if (old) old.remove();
    if (!on || !shot) return false;
    const d = document.createElement('div');
    d.id = id;
    d.setAttribute('data-save-as-mht-injected', '1');
    d.style.cssText = 'all:initial!important;position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;z-index:2147483646!important;pointer-events:none!important;background:#000 url("' + shot + '") 0 0/100% 100% no-repeat!important';
    document.documentElement.appendChild(d);
    return true;
}
// Runs inside the page (any frame). detectOnly = true: only counts the lists that need filling.
async function mhtFillViewportListsInPage(detectOnly: any, minGap: any, maxMs: any, keepWidth: any, scrollHoles: any) {
    const INJ = 'data-save-as-mht-injected';
    const VP = 'data-save-as-mht-vp';
    const SAVED = 'data-save-as-mht-vl-style';
    const sleep = function (ms: any) { return new Promise(function (r: any) { setTimeout(r, ms); }); };
    // rows of a list: the children of the inner container that have a height (rows the worker added are rows too)
    const rowsOf = function (box: any) {
        return Array.prototype.filter.call(box.children, function (el: any) { return !el.hasAttribute(INJ) && el.offsetHeight > 0; });
    };
    const relPos = function (el: any, box: any) {
        const r = el.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        return { x: Math.round(r.left - b.left), y: Math.round(r.top - b.top), w: Math.round(r.width), h: Math.round(r.height) };
    };
    // holes = parts of [0, total] that no row covers (the list is not complete while there is one)
    const holesOf = function (items: any, total: any) {
        const a = items.slice().sort(function (p: any, q: any) { return p.y - q.y; });
        const holes: any = [];
        let cur = 0;
        a.forEach(function (it: any) {
            if (it.y > cur + 6) holes.push([cur, it.y]);
            cur = Math.max(cur, it.y + it.h);
        });
        if (total - cur > 6) holes.push([cur, total]);
        return holes;
    };
    const mountedItems = function (box: any) {
        return rowsOf(box).map(function (el: any) { return relPos(el, box); });
    };
    // the element that spans the whole scroll extent and holds the mounted rows (the "inner container" of a virtual list)
    const boxOf = function (sc: any) {
        const ext = sc.scrollHeight;
        let best: any = null;
        const walk = function (el: any, d: any) {
            for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
                if (c.hasAttribute(INJ)) continue;
                if (c.offsetHeight >= ext - 2 && c.childElementCount > 0) {
                    best = c;
                    if (d < 3) walk(c, d + 1);
                }
            }
        };
        walk(sc, 0);
        return best;
    };
    const found: any = [];
    const all = document.getElementsByTagName('*');
    const lim = Math.min(all.length, 60000);
    for (let i = 0; i < lim && found.length < 6; i++) {
        const sc: any = all[i];
        if (sc === document.documentElement || sc === document.body) continue;
        if (sc.clientHeight < 100 || sc.scrollHeight < sc.clientHeight + minGap) continue;
        const oy = getComputedStyle(sc).overflowY;
        if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') continue;
        if (!sc.getClientRects().length) continue;
        const box = boxOf(sc);
        if (!box || box.querySelector('[' + INJ + ']')) continue;
        const total = box.offsetHeight;
        if (holesOf(mountedItems(box), total).length === 0) continue;
        if (found.some(function (f: any) { return f.sc.contains(sc) || sc.contains(f.sc); })) continue;
        found.push({ sc: sc, box: box });
    }
    if (detectOnly) return { n: found.length };
    const report: any = [];
    for (let gi = 0; gi < found.length; gi++) {
        const sc: any = found[gi].sc;
        const box: any = found[gi].box;
        const info: any = { rowsBefore: rowsOf(box).length, rowsSeen: 0, injected: 0, holesExpand: -1, holesFinal: -1, steps: 0, chain: 0, ms: 0 };
        report.push(info);
        const t0 = Date.now();
        const top0 = sc.scrollTop;
        const left0 = sc.scrollLeft;
        let need = Math.min(Math.ceil(sc.scrollHeight) + 400, 300000);
        const chain: any = [sc];
        const ch0 = sc.clientHeight;
        for (let p = sc.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
            const h = p.clientHeight;
            if (h === 0) continue;
            if (Math.abs(h - ch0) <= 3) chain.push(p); else break;
        }
        info.chain = chain.length;
        const byKey: any = {};
        let seenCount = 0;
        const harvest = function () {
            rowsOf(box).forEach(function (el: any) {
                const p = relPos(el, box);
                const k = p.x + ':' + p.y;
                if (!byKey[k]) seenCount++;
                byKey[k] = { x: p.x, y: p.y, w: p.w, h: p.h, node: el.cloneNode(true) };
            });
        };
        const sigNow = function () {
            let n = 0;
            rowsOf(box).forEach(function (el: any) { n += (el.textContent || '').length + el.getElementsByTagName('*').length; });
            return n;
        };
        const setSizes = function (px: any) {
            chain.forEach(function (el: any) {
                el.style.setProperty('height', px + 'px', 'important');
                el.style.setProperty('min-height', px + 'px', 'important');
            });
        };
        const holesNow = function () {
            return holesOf(Object.keys(byKey).map(function (k: any) { return byKey[k]; }), box.offsetHeight);
        };
        const restoreSizes = function () {
            chain.forEach(function (el: any) {
                const v = el.getAttribute(SAVED);
                if (v === null) return;
                if (v.charAt(0) === 'S') el.setAttribute('style', v.slice(1)); else el.removeAttribute('style');
                el.removeAttribute(SAVED);
            });
        };
        // the rows stay in the order of the page: wait until the site has finished its own re-rendering
        const settle = async function (minPolls: any, maxPolls: any) {
            let last = -1;
            let same = 0;
            for (let t = 0; t < maxPolls; t++) {
                await sleep(70);
                const n = rowsOf(box).length;
                if (n === last) same++; else { same = 0; last = n; }
                if (t >= minPolls && same >= 4) break;
            }
        };
        try {
            // phase 1: the box and the elements that give it its height are as tall as its content, the site mounts every row itself
            chain.forEach(function (el: any) {
                const prev = el.getAttribute('style');
                el.setAttribute(SAVED, prev === null ? 'N' : 'S' + prev);
                el.style.setProperty('height', need + 'px', 'important');
                el.style.setProperty('min-height', need + 'px', 'important');
                el.style.setProperty('max-height', 'none', 'important');
                el.style.setProperty('flex', 'none', 'important');
                // a layer as tall as the whole list would be very heavy for the graphics card
                el.style.setProperty('will-change', 'auto', 'important');
            });
            // the scroll bar stays, so the width of the rows does not change
            sc.style.setProperty('overflow-y', 'scroll', 'important');
            const first = rowsOf(box).length;
            let lastSeen = -1;
            let lastSig = -1;
            let quiet = 0;
            for (let t = 0; t < 400 && Date.now() - t0 < maxMs; t++) {
                await sleep(70);
                harvest();
                // the height of the box grows while the site measures the rows it has not seen yet: the viewport follows it
                const tot = box.offsetHeight;
                if (tot + 400 > need && need < 300000) {
                    need = Math.min(tot + 400, 300000);
                    setSizes(need);
                    quiet = 0;
                }
                const sg = sigNow();
                if (seenCount === lastSeen && sg === lastSig) quiet++; else { quiet = 0; lastSeen = seenCount; lastSig = sg; }
                const holes = holesNow();
                if (holes.length === 0 && quiet >= 9) break;
                // rows keep coming (the site loads them), give it time; nothing new for 2.5 s means it will not come
                if (quiet >= 36) break;
                if (seenCount <= first && t >= 14) break;
            }
            harvest();
            info.holesExpand = holesNow().length;
        } finally {
            restoreSizes();
            sc.scrollTop = top0;
            sc.scrollLeft = left0;
            // the site measures its boxes again (a list of the AutoSizer kind may miss the shrinking)
            try { window.dispatchEvent(new Event('resize')); } catch (e) { }
        }
        await settle(6, 40);
        harvest();
        // phase 2: the site did not give some parts, the scroll box is moved to them (it is covered by the picture of the page)
        if (scrollHoles && holesNow().length > 0) {
            const giveUp: any = {};
            for (let step = 0; step < 120 && Date.now() - t0 < maxMs; step++) {
                const hs = holesNow().filter(function (h: any) { return !giveUp[Math.round(h[0] / 50)]; });
                if (!hs.length) break;
                const h0 = hs[0];
                sc.scrollTop = Math.max(0, Math.min(Math.max(0, sc.scrollHeight - sc.clientHeight), h0[0] - 60));
                info.steps++;
                const before = seenCount;
                let lastSeen = -1;
                let lastSig = -1;
                let quiet = 0;
                for (let t = 0; t < 34; t++) {
                    await sleep(70);
                    harvest();
                    const sg = sigNow();
                    if (seenCount === lastSeen && sg === lastSig) quiet++; else { quiet = 0; lastSeen = seenCount; lastSig = sg; }
                    if (t >= 2 && quiet >= 8) break;
                }
                if (seenCount === before) giveUp[Math.round(h0[0] / 50)] = 1;
            }
            sc.scrollTop = top0;
            sc.scrollLeft = left0;
            await settle(6, 40);
            harvest();
        }
        info.rowsSeen = seenCount;
        info.holesFinal = holesNow().length;
        // the clones go into the box, in the order of the page, where the site has no row of its own
        const keys = Object.keys(byKey).sort(function (a: any, b: any) { return byKey[a].y - byKey[b].y || byKey[a].x - byKey[b].x; });
        const sib = rowsOf(box);
        const present = sib.map(function (el: any) { return relPos(el, box); });
        keys.forEach(function (k: any) {
            const it = byKey[k];
            const clash = present.some(function (p: any) {
                if (p.x === it.x && p.y === it.y) return true;
                const ix = Math.min(p.x + p.w, it.x + it.w) - Math.max(p.x, it.x);
                const iy = Math.min(p.y + p.h, it.y + it.h) - Math.max(p.y, it.y);
                return ix > 0 && iy > 0 && ix * iy > 0.3 * Math.min(p.w * p.h, it.w * it.h);
            });
            if (clash) return;
            it.node.setAttribute(VP, '1');
            let ref: any = null;
            for (let i = 0; i < sib.length; i++) {
                if (relPos(sib[i], box).y > it.y) { ref = sib[i]; break; }
            }
            box.insertBefore(it.node, ref);
            present.push({ x: it.x, y: it.y, w: it.w, h: it.h });
            info.injected++;
        });
        info.ms = Date.now() - t0;
        // the scroll bar of the list must stay reachable: the list (and what holds it) goes above elements that lie over it
        // in a narrower window (an ad column, for example); restored with the other temporary styles after the capture
        if (info.injected > 0) {
            const raise = function (el: any, force: any) {
                const cs = getComputedStyle(el);
                if (!force && (cs.position === 'static' || cs.zIndex === 'auto')) return;
                if (el.getAttribute(SAVED) === null) {
                    const prev = el.getAttribute('style');
                    el.setAttribute(SAVED, prev === null ? 'N' : 'S' + prev);
                }
                if (cs.position === 'static') el.style.setProperty('position', 'relative', 'important');
                el.style.setProperty('z-index', '2147483000', 'important');
            };
            raise(sc, true);
            for (let p = sc.parentElement; p && p !== document.documentElement; p = p.parentElement) raise(p, false);
        }
    }
    // the site fixed the width of its list in pixels: the saved layout keeps the width of the window it was saved in
    // (a narrower window scrolls sideways instead of squeezing the page and pushing other columns over the list)
    if (keepWidth && report.some(function (x: any) { return x.injected > 0; })) {
        const w = document.documentElement.clientWidth;
        const old = document.getElementById('__save_as_mht_minw__');
        if (old) old.remove();
        if (w > 300) {
            const st = document.createElement('style');
            st.id = '__save_as_mht_minw__';
            st.textContent = 'html{min-width:' + w + 'px!important;overflow-x:auto!important}';
            (document.head || document.documentElement).appendChild(st);
        }
    }
    return report;
}
// Runs inside the page (any frame), right before the capture: rows the site mounted again by itself while the worker was
// busy with other things replace the worker's copies of the same rows (no row twice)
function mhtVpDedupeInPage() {
    const VP = 'data-save-as-mht-vp';
    const mine = document.querySelectorAll('[' + VP + ']');
    if (!mine.length) return 0;
    const boxes: any = [];
    for (let i = 0; i < mine.length; i++) {
        const p = mine[i].parentElement;
        if (p && boxes.indexOf(p) < 0) boxes.push(p);
    }
    let removed = 0;
    boxes.forEach(function (box: any) {
        const b = box.getBoundingClientRect();
        const pos = function (el: any) {
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.left - b.left), y: Math.round(r.top - b.top), w: Math.round(r.width), h: Math.round(r.height) };
        };
        const own: any = [];
        const copies: any = [];
        for (let c = box.firstElementChild; c; c = c.nextElementSibling) {
            if (c.offsetHeight <= 0) continue;
            if (c.hasAttribute(VP)) copies.push(c); else own.push(pos(c));
        }
        const seen: any = {};
        copies.forEach(function (el: any) {
            const p = pos(el);
            const k = p.x + ':' + p.y;
            const clash = seen[k] || own.some(function (o: any) {
                if (o.x === p.x && o.y === p.y) return true;
                const ix = Math.min(o.x + o.w, p.x + p.w) - Math.max(o.x, p.x);
                const iy = Math.min(o.y + o.h, p.y + p.h) - Math.max(o.y, p.y);
                return ix > 0 && iy > 0 && ix * iy > 0.3 * Math.min(o.w * o.h, p.w * p.h);
            });
            if (clash) { el.remove(); removed++; } else seen[k] = 1;
        });
    });
    return removed;
}
async function mhtChildFramesDedupe(tabId: any) {
    if (!MHT_CHILD_FRAMES || !MHT_VP_LISTS) return;
    try {
        const r = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtVpDedupeInPage });
        const n = (r || []).reduce(function (a: any, x: any) { return a + (x.result || 0); }, 0);
        if (n) console.log('SaveAsMHT: rows the site mounted again, copies dropped:', n);
    } catch (e) { }
}
// Child frames get the preparation the top page gets, the frames are linked, lists that follow the viewport are filled
async function mhtChildFrames(tabId: any) {
    if (!MHT_CHILD_FRAMES) return;
    let ids: any = [];
    let all: any = [0];
    try {
        const r1 = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtFramesPassInPage, args: [1] });
        all = (r1 || []).map(function (r: any) { return r.frameId; });
        ids = all.filter(function (f: any) { return f !== 0; });
        if (ids.length && MHT_FRAME_LINKS) {
            await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtFramesPassInPage, args: [2] });
            const r3 = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtFramesPassInPage, args: [3] });
            const marked = (r3 || []).map(function (r: any) { return r.result; }).filter(function (r: any) { return r && r.marked; });
            console.log('SaveAsMHT: child frames: ' + ids.length + ', linked iframes: ' + marked.reduce(function (n: any, r: any) { return n + r.marked; }, 0));
        }
    }
    catch (e) {
        console.warn('SaveAsMHT: marking child frames failed', e);
    }
    if (ids.length) {
        try { await chrome.scripting.executeScript({ target: { tabId: tabId, frameIds: ids }, func: mhtFreezeHiddenInPage }); } catch (e) { }
        try { await chrome.scripting.executeScript({ target: { tabId: tabId, frameIds: ids }, func: mhtKeepControlColorsInPage }); } catch (e) { }
    }
    const handled: any = await mhtFillViewportLists(tabId, all);
    // frames whose lists were just filled are not given to the older filler (it would wait for rows that are already there)
    const rest = ids.filter(function (f: any) { return handled.indexOf(f) < 0; });
    if (rest.length && MHT_FILL_LISTS) {
        try {
            const d = await chrome.scripting.executeScript({ target: { tabId: tabId, frameIds: rest }, func: mhtExpandAbsListsInPage, args: [MHT_FILL_LISTS_MIN_PX, '', true] });
            const need = (d || []).filter(function (r: any) { return r.result && r.result.n; }).map(function (r: any) { return r.frameId; });
            if (need.length) {
                const r = await chrome.scripting.executeScript({ target: { tabId: tabId, frameIds: need }, func: mhtExpandAbsListsInPage, args: [MHT_FILL_LISTS_MIN_PX, '', false] });
                console.log('SaveAsMHT: fill lists in child frames:', JSON.stringify((r || []).map(function (x: any) { return x.result; })));
            }
        }
        catch (e) { console.warn('SaveAsMHT: filling lists in child frames failed', e); }
    }
}
// Lists that follow the viewport (every frame): detect, cover the screen with its picture, fill, uncover
async function mhtFillViewportLists(tabId: any, all: any) {
    const handled: any = [];
    if (!MHT_VP_LISTS) return handled;
    let overlayOn = false;
    try {
        const det = await chrome.scripting.executeScript({ target: { tabId: tabId, frameIds: all }, func: mhtFillViewportListsInPage, args: [true, MHT_VP_MIN_GAP, MHT_VP_MAX_MS, MHT_VP_KEEP_WIDTH, MHT_VP_SCROLL_HOLES] });
        const need = (det || []).filter(function (r: any) { return r.result && r.result.n; }).map(function (r: any) { return r.frameId; });
        if (!need.length) return handled;
        let shot = '';
        try {
            const tab = await chrome.tabs.get(tabId);
            shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 100 });
        } catch (e) { shot = ''; }
        if (shot) {
            try {
                const o = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtShotOverlayInPage, args: [shot, true] });
                overlayOn = !!(o && o[0] && o[0].result);
            } catch (e) { overlayOn = false; }
        }
        for (let i = 0; i < need.length; i++) {
            const r = await chrome.scripting.executeScript({ target: { tabId: tabId, frameIds: [need[i]] }, func: mhtFillViewportListsInPage, args: [false, MHT_VP_MIN_GAP, MHT_VP_MAX_MS, MHT_VP_KEEP_WIDTH, MHT_VP_SCROLL_HOLES] });
            const res = r && r[0] && r[0].result;
            if (res && res.length) {
                console.log('SaveAsMHT: viewport lists (frame ' + need[i] + '):', JSON.stringify(res));
                if (res.some(function (x: any) { return x.injected > 0; })) handled.push(need[i]);
            }
        }
    }
    catch (e) {
        console.warn('SaveAsMHT: filling viewport lists failed', e);
    }
    finally {
        if (overlayOn) {
            try { await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtShotOverlayInPage, args: ['', false] }); } catch (e) { }
        }
    }
    return handled;
}
// After the capture: the child frames lose the temporary ids, the listeners go away, and everything the child frames
// got for the capture (injected rows, frozen styles, colors) is put back, as it is done for the top page
async function mhtChildFramesCleanup(tabId: any) {
    if (!MHT_CHILD_FRAMES) return;
    try { await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtFramesCleanupInPage }); } catch (e) { }
    try { await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: removeSourceLink }); } catch (e) { }
    mhtGuardAfter(tabId);
}
// In the saved .mht: an iframe marked by the worker gets src="cid:..." of the saved frame that it holds
function mhtLinkFrameParts(mhtmlText: any) {
    if (!MHT_CHILD_FRAMES || !MHT_FRAME_LINKS) return mhtmlText;
    try {
        if (mhtmlText.indexOf('data-save-as-mht-fid') < 0 && mhtmlText.indexOf('data-save-as-mht-child') < 0) return mhtmlText;
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm) return mhtmlText;
        const sep = '--' + bm[1];
        const chunks = mhtmlText.split(sep);
        const items: any = [];
        const fidToCid: any = {};
        for (let i = 1; i < chunks.length; i++) {
            const c = chunks[i];
            if (c.slice(0, 2) === '--') break;
            const e = c.indexOf('\r\n\r\n');
            if (e < 0) continue;
            const raw = c.slice(0, e);
            const head = raw.replace(/\r\n[ \t]+/g, '');
            const get = function (name: any) {
                const m = head.match(new RegExp('^' + name + ':[ \\t]*(.*)$', 'im'));
                return m ? m[1].trim() : '';
            };
            if (get('Content-Type').toLowerCase().split(';')[0].trim() !== 'text/html') continue;
            const enc = get('Content-Transfer-Encoding').toLowerCase();
            const text = mhtDecodeText({ type: 'text/html', enc: enc, loc: get('Content-Location'), body: c.slice(e + 4) });
            if (text.indexOf('data-save-as-mht-fid') < 0 && text.indexOf('data-save-as-mht-child') < 0) continue;
            const cid = get('Content-ID').replace(/^</, '').replace(/>$/, '');
            const hs = text.search(/<html[\s>]/i);
            if (hs >= 0 && cid) {
                const he = mhtTagEnd(text, hs);
                const fm = he > 0 ? /\sdata-save-as-mht-fid="([^"]*)"/.exec(text.slice(hs, he + 1)) : null;
                if (fm) fidToCid[fm[1]] = cid;
            }
            items.push({ i: i, raw: raw, enc: enc, text: text });
        }
        let linked = 0;
        items.forEach(function (it: any) {
            const t = it.text;
            let out = '';
            let pos = 0;
            const re = /<(iframe|frame)(?=[\s>\/])/gi;
            let m: any;
            while ((m = re.exec(t)) !== null) {
                const end = mhtTagEnd(t, m.index);
                if (end < 0) break;
                const tag = t.slice(m.index, end + 1);
                const cm = /\sdata-save-as-mht-child="([^"]*)"/.exec(tag);
                if (!cm) continue;
                let nt = tag.replace(/\sdata-save-as-mht-child="[^"]*"/, '');
                const cid = fidToCid[cm[1]];
                if (cid && !/\ssrcdoc[\s=>]/i.test(nt)) {
                    nt = nt.replace(/\ssrc=("[^"]*"|'[^']*'|[^\s>]+)/i, '');
                    nt = nt.replace(/^<(iframe|frame)/i, function (x: any) { return x + ' src="cid:' + cid + '"'; });
                    linked++;
                }
                out += t.slice(pos, m.index) + nt;
                pos = end + 1;
                re.lastIndex = end + 1;
            }
            out += t.slice(pos);
            out = out.replace(/(<html\b[^>]*?)\sdata-save-as-mht-fid="[^"]*"/i, '$1');
            it.html = out;
        });
        if (!items.length) return mhtmlText;
        items.forEach(function (it: any) {
            if (it.html === it.text) return;
            const b64 = (it.enc === 'quoted-printable' || it.enc === 'base64') ? btoa(it.html) : mhtUtf8ToB64(it.html);
            const newHead = /^Content-Transfer-Encoding:/im.test(it.raw)
                ? it.raw.replace(/^Content-Transfer-Encoding:.*$/im, 'Content-Transfer-Encoding: base64')
                : it.raw + '\r\nContent-Transfer-Encoding: base64';
            chunks[it.i] = newHead + '\r\n\r\n' + (b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
        });
        console.log('SaveAsMHT: iframes linked to their saved frames:', linked);
        return chunks.join(sep);
    }
    catch (e) {
        console.warn('SaveAsMHT: linking frames failed', e);
        return mhtmlText;
    }
}
// Runs inside the page (top frame): watches the live page during the capture
function mhtGuardInPage(op: any) {
    const K = '__saveAsMhtGuard';
    const W: any = window;
    if (op === 'start') {
        try {
            const old = W[K];
            if (old && old.on) { W.removeEventListener('error', old.on, true); W.removeEventListener('unhandledrejection', old.on, true); }
        } catch (e) { }
        const g: any = { errs: [], base: document.getElementsByTagName('*').length, on: null };
        g.on = function (ev: any) {
            if (g.errs.length >= 8) return;
            const r = ev && ev.reason;
            g.errs.push((String((ev && ev.message) || (r && r.message) || (ev && ev.type) || '')).slice(0, 200) + ' @' + String((ev && ev.filename) || '').slice(-70));
        };
        W.addEventListener('error', g.on, true);
        W.addEventListener('unhandledrejection', g.on, true);
        W[K] = g;
        return { base: g.base };
    }
    const g2: any = W[K];
    if (!g2) return null;
    try { W.removeEventListener('error', g2.on, true); W.removeEventListener('unhandledrejection', g2.on, true); } catch (e) { }
    delete W[K];
    return { base: g2.base, now: document.getElementsByTagName('*').length, errs: g2.errs };
}
async function mhtGuard(tabId: any) {
    if (!MHT_GUARD) return;
    try { await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtGuardInPage, args: ['start'] }); } catch (e) { }
}
// not awaited: looks at the page a little after everything was put back
async function mhtGuardAfter(tabId: any) {
    if (!MHT_GUARD) return;
    try {
        await new Promise(function (r: any) { setTimeout(r, 2500); });
        const r = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtGuardInPage, args: ['end'] });
        const x: any = r && r[0] && r[0].result;
        if (!x) return;
        console.log('SaveAsMHT: live page after the capture: elements ' + x.base + ' -> ' + x.now + (x.errs.length ? ', errors raised by the page: ' + JSON.stringify(x.errs) : ', no errors raised by the page'));
        if (MHT_AUTO_RELOAD && x.base > 300 && x.now < x.base * 0.3) {
            console.warn('SaveAsMHT: the page lost its content after the capture, reloading it');
            await chrome.tabs.reload(tabId);
        }
    } catch (e) { }
}
// In the saved .mht: the red button says ORIGINAL LINK (the live page says PROCESSING), links to web addresses open in a new tab
function mhtFixSavedLinks(mhtmlText: any) {
    if (!MHT_SOURCE_LINK_TEXT && !MHT_LINKS_NEW_TAB) return mhtmlText;
    try {
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm) return mhtmlText;
        const sep = '--' + bm[1];
        const chunks = mhtmlText.split(sep);
        let changed = 0;
        let links = 0;
        for (let i = 1; i < chunks.length; i++) {
            const c = chunks[i];
            if (c.slice(0, 2) === '--') break;
            const e = c.indexOf('\r\n\r\n');
            if (e < 0) continue;
            const raw = c.slice(0, e);
            const head = raw.replace(/\r\n[ \t]+/g, '');
            const typeM = head.match(/^Content-Type:[ \t]*([^;\r\n]*)/im);
            if (!typeM || typeM[1].trim().toLowerCase() !== 'text/html') continue;
            const encM = head.match(/^Content-Transfer-Encoding:[ \t]*(.*)$/im);
            const enc = encM ? encM[1].trim().toLowerCase() : '';
            const locM = head.match(/^Content-Location:[ \t]*(.*)$/im);
            const text = mhtDecodeText({ type: 'text/html', enc: enc, loc: locM ? locM[1].trim() : '', body: c.slice(e + 4) });
            let out = text;
            if (MHT_SOURCE_LINK_TEXT && out.indexOf('__save_as_mht_source_link__') >= 0) {
                out = out.replace(/(<a\b[^>]*\bid="__save_as_mht_source_link__"[^>]*>)\s*PROCESSING\s*(<\/a>)/i, '$1ORIGINAL LINK$2');
            }
            if (MHT_LINKS_NEW_TAB && /<a[\s>]/i.test(out)) {
                let res = '';
                let pos = 0;
                const re = /<a(?=[\s>])/gi;
                let m: any;
                while ((m = re.exec(out)) !== null) {
                    const end = mhtTagEnd(out, m.index);
                    if (end < 0) break;
                    const tag = out.slice(m.index, end + 1);
                    re.lastIndex = end + 1;
                    if (/\starget\s*=/i.test(tag) || /\sdownload[\s=>\/]/i.test(tag)) continue;
                    const hm = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
                    const href = hm ? (hm[1] !== undefined ? hm[1] : hm[2]) : '';
                    if (!/^https?:\/\//i.test(href)) continue;
                    res += out.slice(pos, m.index) + '<a target="_blank"' + tag.slice(2);
                    pos = end + 1;
                    links++;
                }
                out = res + out.slice(pos);
            }
            if (out === text) continue;
            const b64 = (enc === 'quoted-printable' || enc === 'base64') ? btoa(out) : mhtUtf8ToB64(out);
            const newHead = /^Content-Transfer-Encoding:/im.test(raw)
                ? raw.replace(/^Content-Transfer-Encoding:.*$/im, 'Content-Transfer-Encoding: base64')
                : raw + '\r\nContent-Transfer-Encoding: base64';
            chunks[i] = newHead + '\r\n\r\n' + (b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
            changed++;
        }
        if (!changed) return mhtmlText;
        console.log('SaveAsMHT: saved links: ' + links + ' links open in a new tab');
        return chunks.join(sep);
    }
    catch (e) {
        console.warn('SaveAsMHT: fixing the links failed', e);
        return mhtmlText;
    }
}
// === END MhtChildFrames ===
// === MHT animation state (patch MhtAnimState) ===
// Why the animation of text and pictures was missing in the saved .mht: a saved page has no JavaScript. Everything that a site
// reveals / moves while the user scrolls (Framer Motion useScroll / whileInView, IntersectionObserver classes, AOS-like scripts,
// parallax, GSAP, ...) is written into the page as the state that it had at the moment of the capture: blocks that the user has not
// scrolled to stay transparent (opacity 0) or pushed away (translate), and nothing ever plays them again in the saved file.
// What this patch does (nothing is scrolled for real, the scroll bar and the screen do not move):
//  1) The worker finds out by itself how long the scroll extent is. Right before the capture the page is moved through the whole
//     extent virtually: window.scrollY / scrollTop report the virtual position and the page body is shifted by the same distance
//     (a Web Animation, it leaves nothing in the DOM), so scroll listeners, getBoundingClientRect and IntersectionObserver of the site
//     see exactly what they would see when the user scrolls there. The site itself reveals / moves its blocks.
//  2) For every element that the site changed on the way (style / class) the state that it had when it was in front of the user
//     (the most visible and the most central position) is remembered. Elements that the user sees right now are left as they are.
//  3) The page returns to the real position, the remembered states are written for the capture (and pinned against late changes
//     of the site), and the previous values are put back right after the capture (the cleanup runs before all other cleanups).
//  4) Responsive images (picture / srcset): Chrome keeps in the .mht only the candidate that it picked for this window, any other
//     window size or zoom showed an empty frame. The picked candidate is made the only one for the time of the capture.
//  5) Animations that are running now are finished (libraries commit their end values to the DOM when an animation ends).
// The pass is made only when the page has something that waits for the scroll position, it is covered by a picture of the screen.
// Not used for pages with a virtual viewport (patch MhtVirtualSpacers), for the hosts of MHT_ANIM_SKIP_HOSTS and for pages that do not scroll.
// Set MHT_ANIM_STATE / MHT_ANIM_IMAGES to false to switch a part off.
const MHT_ANIM_STATE = true;
const MHT_ANIM_IMAGES = true;
const MHT_ANIM_MAX_MS = 30000;
const MHT_ANIM_FRAME_MS = 700;
const MHT_ANIM_QUIET_MS = 120;
const MHT_ANIM_MAX_FRAMES = 40;
const MHT_ANIM_SKIP_HOSTS = '(^|\\.)youtube\\.com$';
// Runs inside the page (in the MAIN world: the site's own scripts must see the virtual scroll position)
// Runs inside the page (in the MAIN world: the site's own scripts must see the virtual scroll position)
async function mhtAnimStateInPage(opts: any): Promise<any> {
    const KEY = '__saveAsMhtAnim';
    const W: any = window;
    const SVGNS = 'http://www.w3.org/2000/svg';
    const sleep = function (ms: any) { return new Promise(function (r: any) { setTimeout(r, ms); }); };
    // requestAnimationFrame does not tick in a hidden tab: never wait for it longer than 120 ms
    const raf = function () { return new Promise(function (r: any) { let d = false; const f = function () { if (!d) { d = true; r(); } }; requestAnimationFrame(f); setTimeout(f, 120); }); };
    try { if (W[KEY] && W[KEY].restore) W[KEY].restore(); } catch (e) { }
    const rep: any = { mode: opts.mode, suspects: 0, extent: 0, frames: 0, tracked: 0, baked: 0, pictures: 0, finished: 0, ms: 0, skipped: '' };
    const t0 = Date.now();
    const skipTag: any = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1 };
    const ours = function (el: any) {
        return !!(el.id && el.id.indexOf('__save_as_mht') === 0) || el.hasAttribute('data-save-as-mht-injected') || el.hasAttribute('data-save-as-mht-sr');
    };
    const se = document.scrollingElement || document.documentElement;
    const sy0 = Math.round(W.scrollY || se.scrollTop || 0);
    const vh = W.innerHeight;
    const vw = W.innerWidth;
    const extentNow = function () {
        return Math.ceil(Math.max(se.scrollHeight || 0, document.documentElement.scrollHeight || 0, document.body ? document.body.scrollHeight : 0));
    };
    // ---- 1) is there anything that waits for the scroll position? ----
    const hasContent = function (el: any) {
        if (/^(IMG|VIDEO|CANVAS|SVG|PICTURE)$/i.test(el.tagName)) return true;
        if (el.querySelector && el.querySelector('img,video,canvas,svg,picture')) return true;
        return !!(el.textContent || '').trim();
    };
    const findSuspects = function () {
        let n = 0;
        const els: any = document.body ? document.body.getElementsByTagName('*') : [];
        const lim = Math.min(els.length, 12000);
        for (let i = 0; i < lim; i++) {
            const el = els[i];
            if (skipTag[el.tagName] || (el.namespaceURI === SVGNS && el.tagName !== 'svg') || ours(el)) continue;
            let sus = false;
            const st = el.getAttribute('style');
            if (st) {
                if (/(?:^|;)\s*opacity\s*:\s*(?:0(?:\.\d+)?|\.\d+)\s*(?:;|!|$)/i.test(st)) sus = true;
                else if (/(?:^|;)\s*transform\s*:[^;]*(?:translate|scale|rotate|matrix)/i.test(st)) sus = true;
            }
            if (!sus) {
                const cs = getComputedStyle(el);
                if (parseFloat(cs.opacity) < 0.05 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.transitionDuration) > 0) sus = true;
            }
            if (!sus) continue;
            const r = el.getBoundingClientRect();
            if (r.width * r.height < 64) continue;
            if (!(r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw)) continue;
            if (!hasContent(el)) continue;
            n++;
        }
        return n;
    };
    // lists that mount only the rows near the viewport are the business of patch MhtVirtualSpacers / MhtFillLists: not moved here
    const looksVirtual = function (): boolean {
        if (document.querySelector('[data-plane-row]')) return true;
        const inl = function (el: any, prop: string): number {
            const m = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([\\d.]+)px', 'i').exec(el.getAttribute('style') || '');
            return m ? parseFloat(m[1]) : 0;
        };
        const c1 = document.querySelectorAll('[style*="padding-top"],[style*="padding-bottom"]');
        for (let i = 0; i < c1.length && i < 400; i++) {
            if (Math.max(inl(c1[i], 'padding-top'), inl(c1[i], 'padding-bottom')) >= 300 && c1[i].childElementCount >= 1 && c1[i].getClientRects().length) return true;
        }
        const c2 = document.querySelectorAll('[style*="height"]');
        for (let i = 0; i < c2.length && i < 800; i++) {
            const el: any = c2[i];
            if (inl(el, 'height') < 300 || !el.childElementCount || !el.getClientRects().length) continue;
            let abs = 0, n = 0;
            for (let c = el.firstElementChild; c; c = c.nextElementSibling) { n++; if (getComputedStyle(c).position === 'absolute') abs++; }
            if (n >= 2 && abs === n && !mhtFreeLayout(el)) return true;
}
return false;
};
const mhtFreeLayout = function (el: any): boolean {
    const kr: any[] = [];
    for (let c = el.firstElementChild; c && kr.length < 80; c = c.nextElementSibling) {
        const r = c.getBoundingClientRect();
        if (r.width * r.height > 0) kr.push(r);
    }
    for (let a = 0; a < kr.length; a++) {
        for (let b = a + 1; b < kr.length; b++) {
            const ix = Math.min(kr[a].right, kr[b].right) - Math.max(kr[a].left, kr[b].left);
            const iy = Math.min(kr[a].bottom, kr[b].bottom) - Math.max(kr[a].top, kr[b].top);
            if (ix > 4 && iy > 4) return true;
        }
    }
    if (kr.length < 3) return false;
    kr.sort(function (a: any, b: any) { return a.top - b.top || a.left - b.left; });
    const d0 = kr[1].top - kr[0].top;
    let tiled = 0, uni = 0;
    for (let i = 1; i < kr.length; i++) {
        if (Math.abs(kr[i].top - kr[i - 1].bottom) <= 2 || Math.abs(kr[i].top - kr[i - 1].top) <= 2) tiled++;
        const st = kr[i].top - kr[i - 1].top;
        if (st > 0 && Math.abs(st - d0) <= 2) uni++;
    }
    return !tiled && uni < 2;
};
const hasScrollAnim = function (): boolean {
    return document.querySelectorAll('[style*="animation-play-state"],[style*="offset-distance"]').length >= 3;
};
    const maxVNative = Math.max(0, extentNow() - vh);
// ---- transform scroll (patch MhtTransformScroll): the page does not scroll by itself, a tall block is moved with a transform by the site's own script ----
const tfsTy = function (el) {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  let m = /^matrix3d\((.+)\)$/.exec(t);
  if (m) return Number(m[1].split(',')[13]) || 0;
  m = /^matrix\((.+)\)$/.exec(t);
  if (m) return Number(m[1].split(',')[5]) || 0;
  return 0;
};
const tfsDetect = function () {
  if (!document.body) return null;
  const lock = function (e) { const o = getComputedStyle(e).overflowY; return o === 'hidden' || o === 'clip'; };
  const locked = lock(document.documentElement) || lock(document.body);
  let best = null, bh = 0, seen = 0;
  const q = [[document.body, 0]];
  while (q.length && seen < 4000) {
    const it = q.shift();
    if (it[1] >= 6) continue;
    for (let c = it[0].firstElementChild; c; c = c.nextElementSibling) {
      seen++;
      if (skipTag[c.tagName] || c.namespaceURI === SVGNS || ours(c)) continue;
      const cs = getComputedStyle(c);
      if (cs.display === 'none') continue;
      const r = c.getBoundingClientRect();
      if (r.height >= vh * 1.5 && r.width >= vw * 0.5 && (cs.transform !== 'none' || /transform/.test(cs.willChange)) && (locked || cs.position === 'fixed')) {
        if (r.height > bh + 2) { best = c; bh = r.height; }
      }
      q.push([c, it[1] + 1]);
    }
  }
  return best ? { el: best, h: bh } : null;
};
const tfsInfo = opts.tfs !== false && maxVNative < vh * 0.25 ? tfsDetect() : null;
const tfsCand = !!tfsInfo;
const tfsOff0 = tfsInfo ? Math.max(0, Math.round(-tfsTy(tfsInfo.el))) : 0;
let maxV0 = tfsInfo ? Math.max(0, Math.round(tfsInfo.h - vh)) : maxVNative;
rep.tfs = tfsInfo ? { h: Math.round(tfsInfo.h), off0: tfsOff0 } : null;
    rep.extent = maxV0 + vh;
    const blocked = function () {
        if (W.__saveAsMhtSpacers) return 'virtual viewport is active';
        if (opts.skipHost && new RegExp(opts.skipHost, 'i').test(location.hostname)) return 'host is skipped';
        if (!document.body) return 'no body';
        if (maxV0 < vh * 0.25) return 'page does not scroll';
        if (maxV0 > vh * 150) return 'page is too long';
        // body is a scroll box of its own only when its overflow is not handed to the window (html has an overflow of its own)
        const cs = getComputedStyle(document.body);
        if (getComputedStyle(document.documentElement).overflowY !== 'visible' && (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && document.body.scrollHeight > document.body.clientHeight + 1 && se !== document.body) return 'body is a scroll box';
        if (!tfsCand && looksVirtual() && !hasScrollAnim()) return "virtual list";
        return '';
    };
    if (opts.mode === 'detect') {
        rep.skipped = blocked();
        if (!rep.skipped) rep.suspects = findSuspects();
        rep.need = !rep.skipped && (rep.suspects > 0 || !!opts.motion);
        rep.ms = Date.now() - t0;
        return rep;
    }
    // ---- state of this pass, put back by the cleanup ----
    const undo: any[] = [];
    const state: any = { done: false, timer: 0, restore: function () { } };
    state.restore = function () {
        if (state.done) return;
        state.done = true;
        clearTimeout(state.timer);
        for (let i = undo.length - 1; i >= 0; i--) { try { undo[i](); } catch (e) { } }
        try { if (W[KEY] === state) delete W[KEY]; } catch (e) { }
    };
    state.timer = setTimeout(state.restore, 90000);
    W[KEY] = state;
    // ---- 2) responsive images: the saved .mht holds only the candidate that the browser picked, so any other window size / zoom would show an empty frame ----
    const A_IMG = 'data-save-as-mht-img';
    if (opts.images !== false) {
        const pin = function (img: any) {
            if (!img.currentSrc || !img.complete || !img.naturalWidth) return;
            const pic = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
            const hasSet = !!img.getAttribute('srcset') || (pic && pic.querySelector('source[srcset]'));
            if (!hasSet) return;
            const cur = img.currentSrc;
            const desc = function (set: any) {
                const c = (set || '').split(',');
                for (let k = 0; k < c.length; k++) {
                    const p = c[k].trim().split(/\s+/);
                    if (!p[0]) continue;
                    let abs = '';
                    try { abs = new URL(p[0], document.baseURI).href; } catch (e) { abs = p[0]; }
                    if (abs === cur) return p.slice(1).join(' ');
                }
                return null;
            };
            const rec: any[] = [];
            const keep = function (el: any) { rec.push([el, el.getAttribute('srcset'), el.getAttribute('media')]); };
            let chosen: any = null;
            if (pic) {
                const srcs = pic.querySelectorAll('source');
                for (let k = 0; k < srcs.length; k++) {
                    if (chosen === null && srcs[k].getAttribute('srcset') && desc(srcs[k].getAttribute('srcset')) !== null) chosen = srcs[k];
                }
                for (let k = 0; k < srcs.length; k++) {
                    keep(srcs[k]);
                    if (srcs[k] === chosen) {
                        srcs[k].setAttribute('srcset', cur + ' ' + desc(srcs[k].getAttribute('srcset')));
                        srcs[k].removeAttribute('media');
                    } else {
                        srcs[k].removeAttribute('srcset');
                    }
                }
            }
            if (img.getAttribute('srcset')) {
                keep(img);
                const d = desc(img.getAttribute('srcset'));
                if (chosen) img.removeAttribute('srcset');
                else if (d !== null) img.setAttribute('srcset', cur + ' ' + d);
                else img.removeAttribute('srcset');
            }
            if (!rec.length) return;
            rep.pictures++;
            undo.push(function () {
                rec.forEach(function (x: any) {
                    if (x[1] === null) x[0].removeAttribute('srcset'); else x[0].setAttribute('srcset', x[1]);
                    if (x[2] === null) x[0].removeAttribute('media'); else x[0].setAttribute('media', x[2]);
                });
            });
        };
        const imgs = document.getElementsByTagName('img');
        for (let i = 0; i < imgs.length && i < 3000; i++) { try { pin(imgs[i]); } catch (e) { } }
    }
    // ---- 3) animations that are running now are brought to their end (JS animation libraries commit their end values to the DOM when an animation ends) ----
    let geoAnim: any = null;
    const finishAnims = function () {
        let n = 0;
        try {
            document.getAnimations().forEach(function (a: any) {
                if (a === geoAnim) return;
                try {
                    const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
                    if (t && t.endTime === Infinity) return;
                    if (a.playState === 'running') { a.finish(); n++; }
                } catch (e) { }
            });
        } catch (e) { }
        return n;
    };
    rep.finished += finishAnims();
    if (opts.mode === 'light') { rep.ms = Date.now() - t0; return rep; }
    // ---- 4) virtual scroll through the whole scroll extent (nothing is scrolled for real) ----
    rep.skipped = blocked();
    if (rep.skipped) { rep.ms = Date.now() - t0; return rep; }
let tfsx = null;
if (tfsCand) {
  // The page is moved by the site's own script: its input (wheel) is replayed, the position is read back from the transform of the block.
  // The frame clock of the page is run faster for the time of the pass (the smoothing of such scripts is made of frames), the cover picture hides all of it.
  const tfsStart = async function (el, off0) {
    const nraf = W.requestAnimationFrame.bind(W);
    const ncaf = W.cancelAnimationFrame.bind(W);
    const frame = function () { return new Promise(function (r) { let d = false; const f = function () { if (!d) { d = true; r(); } }; nraf(f); setTimeout(f, 120); }); };
    const off = function () { return -tfsTy(el); };
    const queue = new Map();
    let nid = 9e6, pumping = false, on = false;
    const pump = function () {
      pumping = false;
      if (!on) return;
      // several frames of the page per timer tick: the frame clock of the page runs many times faster than the screen
      for (let round = 0; round < 4 && queue.size && on; round++) {
        const batch = Array.from(queue.values());
        queue.clear();
        const now = performance.now();
        for (let i = 0; i < batch.length; i++) { try { batch[i](now); } catch (e) { } }
      }
      if (queue.size && on && !pumping) { pumping = true; setTimeout(pump, 0); }
    };
    const accelOn = function () {
      if (on) return;
      on = true;
      W.requestAnimationFrame = function (cb) { const k = ++nid; queue.set(k, cb); if (!pumping) { pumping = true; setTimeout(pump, 0); } return k; };
      W.cancelAnimationFrame = function (k) { if (!queue.delete(k)) ncaf(k); };
    };
    const accelOff = function () {
      if (!on) return;
      on = false;
      W.requestAnimationFrame = nraf;
      W.cancelAnimationFrame = ncaf;
      const rest = Array.from(queue.values());
      queue.clear();
      rest.forEach(function (cb) { nraf(cb); });
    };
    const still = async function (maxMs) {
      const t1 = Date.now();
      let last = off(), n = 0;
      while (Date.now() - t1 < maxMs) {
        await frame();
        const o = off();
        if (Math.abs(o - last) < 0.05) { if (++n >= 5) break; } else n = 0;
        last = o;
      }
      return off();
    };
    const send = function (kind, d) {
      const t = document.elementFromPoint(vw / 2, vh / 2) || document.body;
      const init = { deltaX: 0, deltaY: d, deltaZ: 0, deltaMode: 0, bubbles: true, cancelable: true, clientX: vw / 2, clientY: vh / 2, view: W };
      if (kind === 'A') { init.wheelDeltaX = 0; init.wheelDeltaY = -Math.round(d); }
      t.dispatchEvent(new WheelEvent('wheel', init));
    };
    accelOn();
    let kind = '', sign = 1, gain = 1;
    const tries = [['A', 1], ['A', -1], ['B', 1], ['B', -1]];
    for (let i = 0; i < tries.length && !kind; i++) {
      const b = off();
      send(tries[i][0], tries[i][1] * 150);
      const a = await still(3000);
      if (a - b > 5) { kind = tries[i][0]; sign = tries[i][1]; gain = (a - b) / 150; }
    }
    if (!kind) { accelOff(); return null; }
    send(kind, sign * 1e6);
    const mx = Math.round(await still(8000));
    if (mx < 40) { accelOff(); return null; }
    const goto = async function (v) {
      accelOn();
      v = Math.round(v);
      if (v <= 0) { send(kind, -sign * 1e6); return await still(6000); }
      if (v >= mx) { send(kind, sign * 1e6); return await still(6000); }
      for (let it = 0; it < 8; it++) {
        const cur = off();
        const err = v - cur;
        if (Math.abs(err) <= 1.2) break;
        const d = err / gain;
        send(kind, sign * d);
        const a = await still(6000);
        const mv = a - cur;
        if (Math.abs(d) > 20 && Math.abs(mv) > 2) { const g = mv / d; if (g > 0.05 && g < 20) gain = g; }
        else if (Math.abs(mv) < 0.5) break;
      }
      return off();
    };
    return {
      el: el, maxV: mx, variant: kind + (sign < 0 ? '-' : '+'), goto: goto,
      // back to the start position and a calm page (the pages' own transitions of the probe run out) before the recorder starts to count mutations
      park: async function () { await goto(off0); accelOff(); await new Promise(function (r) { setTimeout(r, 1600); }); },
      back: async function () { const r = await goto(off0); accelOff(); return r; },
      stop: function () { accelOff(); }
    };
  };
  try { tfsx = await tfsStart(tfsInfo.el, tfsOff0); } catch (e) { rep.tfsError = String((e && e.message) || e); tfsx = null; }
  if (!tfsx) { rep.skipped = 'transform scroll does not react'; rep.ms = Date.now() - t0; return rep; }
  maxV0 = tfsx.maxV;
  rep.extent = maxV0 + vh;
  rep.tfs.maxV = tfsx.maxV;
  rep.tfs.variant = tfsx.variant;
  try { await tfsx.park(); } catch (e) { }
  // such scripts end their own time-based tweens after the move: wait longer for the page to be calm before a frame is taken (the wait ends as soon as nothing changes any more)
  opts.frameMs = Math.max(opts.frameMs, 1200);
  undo.push(function () { try { tfsx.stop(); } catch (e) { } });
  if (maxV0 > vh * 150) { try { await tfsx.back(); } catch (e) { } rep.skipped = 'page is too long'; rep.ms = Date.now() - t0; return rep; }
  W.__saveAsMhtTfs = { el: tfsInfo.el, maxV: tfsx.maxV, sy0: tfsOff0 };
}
    // elements that the user sees right now are left exactly as they are
    const seen0 = new WeakSet<any>();
    {
        const els = document.body.getElementsByTagName('*');
        for (let i = 0; i < els.length && i < 20000; i++) {
            const r = els[i].getBoundingClientRect();
            if (r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw) seen0.add(els[i]);
        }
        seen0.add(document.body); seen0.add(document.documentElement);
    }
    let curV = sy0;
    const override = function (obj: any, name: any, getter: any) {
        if (!obj) return;
        let own: any = null;
        try { own = Object.getOwnPropertyDescriptor(obj, name) || null; } catch (e) { }
        try {
            Object.defineProperty(obj, name, { configurable: true, enumerable: own ? own.enumerable : false, get: getter });
            undo.push(function () { try { if (own) Object.defineProperty(obj, name, own); else delete obj[name]; } catch (e) { } });
        } catch (e) { }
    };
    const spoofOn = function () {
        override(W, 'scrollY', function () { return curV; });
        override(W, 'pageYOffset', function () { return curV; });
        override(se, 'scrollTop', function () { return curV; });
        if (se !== document.documentElement) override(document.documentElement, 'scrollTop', function () { return curV; });
        if (W.visualViewport) override(W.visualViewport, 'pageTop', function () { return curV; });
    };
    const spoofOff = function () {
        // the overrides made above are removed in reverse order; the cleanup does it too if this is not reached
        for (let i = undo.length - 1; i >= 0; i--) { if ((undo[i] as any).isSpoof) { try { undo[i](); } catch (e) { } undo.splice(i, 1); } }
    };
    const nBefore = undo.length; if (!tfsx) spoofOn();
    for (let i = nBefore; i < undo.length; i++) (undo[i] as any).isSpoof = true;
    const moveTo = function (v: any) {
        curV = v;
        try { if (geoAnim) geoAnim.cancel(); } catch (e) { }
        const T = 'translateY(' + (sy0 - v) + 'px)';
        try {
            geoAnim = document.body.animate([{ transform: T }, { transform: T }], { duration: 1, fill: 'forwards' });
            geoAnim.finish();
        } catch (e) { geoAnim = null; }
    };
    const geoOff = function () { try { if (geoAnim) geoAnim.cancel(); } catch (e) { } geoAnim = null; };
    undo.push(geoOff);
    const fire = function () {
        try { document.dispatchEvent(new Event('scroll', { bubbles: true })); } catch (e) { }
        try { if (W.visualViewport) W.visualViewport.dispatchEvent(new Event('scroll')); } catch (e) { }
    };
    // attribute history of every element that the site changes while the page is moved
    const hist = new Map<any, any>();
    let pending: any[] = [];
    let lastMut = Date.now();
    const mo = new MutationObserver(function (list: any) { pending = pending.concat(list);
    // transform scroll pages: scripts that write the same class / style every frame are not a change, the page is calm
    if (!(W.__saveAsMhtMo && W.__saveAsMhtMo.mute && W.__saveAsMhtMo.mute(list)) && (!tfsx || list.some(function (m) { return m.type !== 'attributes' || m.oldValue !== m.target.getAttribute(m.attributeName); }))) lastMut = Date.now(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'], attributeOldValue: true, subtree: true });
    undo.push(function () { try { mo.disconnect(); } catch (e) { } });
    const scores = new Map<any, any>(); // el -> { frame: {s, d} }
    const stickyBox = new WeakMap<any, any>();
    const boxOf = function (el: any) {
        if (stickyBox.has(el)) return stickyBox.get(el);
        let box: any = null;
        for (let p = el, k = 0; p && p !== document.body && k < 10; p = p.parentElement, k++) {
            if (getComputedStyle(p).position === 'sticky') { box = p.parentElement; break; }
        }
        stickyBox.set(el, box);
        return box;
    };
    const frameIdx = { n: -1 };
    const takePending = function () {
        const recs = pending; pending = [];
        const changed = new Set<any>();
        recs.forEach(function (m: any) {
            const el = m.target;
            if (!el || el.nodeType !== 1 || ours(el) || skipTag[el.tagName]) return;
            let h: any = hist.get(el);
            if (!h) { h = { base: { style: null, class: null, set: {} }, list: [] }; hist.set(el, h); }
            if (!h.base.set[m.attributeName]) { h.base.set[m.attributeName] = 1; h.base[m.attributeName] = m.oldValue; }
            changed.add(el);
        });
        changed.forEach(function (el: any) {
            hist.get(el).list.push({ f: frameIdx.n, style: el.getAttribute('style'), cls: el.getAttribute('class') });
        });
    };
    const scoreFrame = function () {
        const opc = new Map<any, number>();
        const eff = function (el: any): number {
            if (!el || el === document.documentElement) return 1;
            if (opc.has(el)) return opc.get(el) as number;
            const cs = getComputedStyle(el);
            let o = parseFloat(cs.opacity);
            if (!isFinite(o)) o = 1;
            if (cs.display === 'none' || cs.visibility === 'hidden') o = 0;
            const v: number = o * eff(el.parentElement);
            opc.set(el, v);
            return v;
        };
        hist.forEach(function (h: any, el: any) {
            if (!el.isConnected || seen0.has(el)) return;
            const r = el.getBoundingClientRect();
            let s = 0, d = 1;
            if (r.width > 0 && r.height > 0) {
                const box = boxOf(el);
                const ox = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
                let oy;
                let cy = r.top + r.height / 2;
                if (box) {
                    const b = box.getBoundingClientRect();
                    oy = (b.bottom > 0 && b.top < vh) ? Math.min(r.height, vh) : 0;
                    cy = b.top + b.height / 2;
                } else {
                    oy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
                }
                const denom = Math.min(r.width, vw) * Math.min(r.height, vh);
                s = denom > 0 ? (ox * oy) / denom : 0;
                s *= eff(el);
                d = Math.abs(cy - vh / 2) / vh;
            }
            let m: any = scores.get(el);
            if (!m) { m = {}; scores.set(el, m); }
            m[frameIdx.n] = { s: s, d: d };
        });
    };
    const settle = async function (maxMs: any) {
        await raf(); await raf();
        const t1 = Date.now();
        while (Date.now() - t1 < maxMs) {
            finishAnims();
            if (Date.now() - lastMut >= opts.quietMs) break;
            await sleep(40);
        }
        await raf();
    };
    // the positions: the whole scroll extent, step = half a screen (at most opts.maxFrames positions)
    const maxV = maxV0;
    const nFrames = Math.max(2, Math.min(opts.maxFrames, Math.ceil(maxV / Math.max(120, vh * 0.5)) + 1));
    const positions: number[] = [];
    for (let i = 0; i < nFrames; i++) positions.push(Math.round(maxV * i / (nFrames - 1)));
    // layout height does not depend on the transform that moves the page (scrollHeight does)
    const layoutH = function () { return Math.max(document.body.offsetHeight || 0, document.documentElement.offsetHeight || 0); };
    const layoutH0 = layoutH();
    const grew = function () { return layoutH() > layoutH0 + Math.max(300, vh * 0.5); };
    try {
        if (W.__saveAsMhtMo && W.__saveAsMhtMo.begin) await W.__saveAsMhtMo.begin({ sy0: tfsx ? tfsOff0 : sy0, vh: vh, vw: vw, maxV: maxV, seen0: seen0, t0: t0, maxMs: tfsx ? Math.min(opts.maxMs, Math.round(positions.length * 800) + 9000) : opts.maxMs, suspects: opts.suspects || 0, tfsEl: tfsx ? tfsx.el : null, goto: async function (v) { if (tfsx) { await tfsx.goto(v); } else { moveTo(v); } fire(); await settle(opts.frameMs); pending = []; } }); for (let i = 0; i < positions.length && Date.now() - t0 < opts.maxMs; i++) {
            frameIdx.n = i;
            if (tfsx) { await tfsx.goto(positions[i]); } else { moveTo(positions[i]); } fire();
            await settle(opts.frameMs);
            takePending();
            scoreFrame();
            rep.frames++; if (W.__saveAsMhtMo && W.__saveAsMhtMo.frame && W.__saveAsMhtMo.frame(i, positions[i]) === false) break;
            // a feed that loads more by itself while it is moved: stop, nothing more is asked from it
            if (grew()) { rep.stoppedGrowing = true; break; }
        } if (W.__saveAsMhtMo && W.__saveAsMhtMo.refine) await W.__saveAsMhtMo.refine(); if (W.__saveAsMhtMo.refine2) await W.__saveAsMhtMo.refine2();
    } catch (e) {
        rep.error = String(e && (e as any).message || e);
    }
    // ---- 5) the page goes back to the real position; the state each element had when it was in front of the user is written for the capture ----
    if (tfsx) { try { await tfsx.back(); } catch (e) { } } geoOff(); spoofOff(); fire();
    try { W.dispatchEvent(new Event('resize')); } catch (e) { }
    frameIdx.n = 9999;
    await settle(opts.frameMs);
    pending = [];
    try { mo.disconnect(); } catch (e) { }
    try { if (W.__saveAsMhtMo && W.__saveAsMhtMo.end) W.__saveAsMhtMo.end(); } catch (e) { } const plan: any[] = [];
    hist.forEach(function (h: any, el: any) {
        if (!el.isConnected || seen0.has(el)) return;
        const m: any = scores.get(el);
        if (!m) return;
        let best = -1, bf: any = null;
        Object.keys(m).forEach(function (k: any) {
            const q = m[k].s - 0.02 * m[k].d;
            if (m[k].s > 0.01 && q > best) { best = q; bf = Number(k); }
        });
        if (bf === null) return;
        // the state that was valid in frame bf: the last record up to bf, the first state if none
        let st: any = { style: h.base.style, cls: h.base.class };
        if (!h.base.set.style) st.style = el.getAttribute('style');
        if (!h.base.set.class) st.cls = el.getAttribute('class');
        for (let k = 0; k < h.list.length; k++) { if (h.list[k].f <= bf) st = { style: h.list[k].style, cls: h.list[k].cls }; }
        plan.push({ el: el, style: st.style, cls: st.cls });
    });
    rep.tracked = hist.size;
    const setAttr = function (el: any, name: any, val: any) {
        if (val === null || val === undefined) { if (el.hasAttribute(name)) el.removeAttribute(name); }
        else if (el.getAttribute(name) !== val) el.setAttribute(name, val);
    };
    const pins = new Map<any, any>(); // el -> { style, cls, pStyle, pCls } (pinned values and the last values written by the page)
    plan.forEach(function (p: any) {
        const cs = p.el.getAttribute('style'), cc = p.el.getAttribute('class');
        if (cs === p.style && cc === p.cls) return;
        pins.set(p.el, { style: p.style, cls: p.cls, pStyle: cs, pCls: cc });
        setAttr(p.el, 'style', p.style);
        setAttr(p.el, 'class', p.cls);
    });
    rep.baked = pins.size;
    if (pins.size) {
        const keepEls = Array.from(pins.keys());
        const po = new MutationObserver(function (list: any) {
            for (let i = 0; i < list.length; i++) {
                const el = list[i].target, p = pins.get(el);
                if (!p) continue;
                const nm = list[i].attributeName;
                const cur = el.getAttribute(nm);
                const want = nm === 'style' ? p.style : p.cls;
                if (cur === want) continue;
                if (nm === 'style') p.pStyle = cur; else p.pCls = cur;
                setAttr(el, nm, want);
            }
        });
        keepEls.forEach(function (el: any) { po.observe(el, { attributes: true, attributeFilter: ['style', 'class'] }); });
        undo.push(function () {
            try { po.disconnect(); } catch (e) { }
            pins.forEach(function (p: any, el: any) {
                if (!el.isConnected) return;
                setAttr(el, 'style', p.pStyle);
                setAttr(el, 'class', p.pCls);
            });
        });
        await raf();
    }
    rep.ms = Date.now() - t0;
    return rep;
}
// Runs inside the page (in the MAIN world): puts everything that the pass changed back
function mhtAnimStateCleanupInPage(): void {
    const s = (window as any)['__saveAsMhtAnim'];
    if (s && s.restore) s.restore();
    try { document.dispatchEvent(new Event('scroll', { bubbles: true })); } catch (e) { }
}

async function mhtAnimState(tabId: number): Promise<void> {
    if (!MHT_ANIM_STATE && !MHT_ANIM_IMAGES) return;
    let overlayOn = false;
    try {
        const base = { maxMs: MHT_ANIM_MAX_MS, frameMs: MHT_ANIM_FRAME_MS, quietMs: MHT_ANIM_QUIET_MS, maxFrames: MHT_ANIM_MAX_FRAMES, skipHost: MHT_ANIM_SKIP_HOSTS, images: MHT_ANIM_IMAGES, motion: MHT_MOTION && MHT_MOTION_SCROLL, tfs: MHT_TRANSFORM_SCROLL };
        const run = function (mode: string) {
            return chrome.scripting.executeScript({ target: { tabId: tabId }, world: 'MAIN', func: mhtAnimStateInPage, args: [Object.assign({}, base, { mode: mode })] });
        };
        let need = false;
        if (MHT_ANIM_STATE) {
            const d = await run('detect');
            const det = d && d[0] && d[0].result;
            need = !!(det && det.need); base.suspects = (det && det.suspects) || 0;
        }
        if (!need) {
            const l = await run('light');
            const lr = l && l[0] && l[0].result;
            if (lr && (lr.pictures || lr.finished)) console.log('SaveAsMHT: animation state (light):', JSON.stringify(lr));
            return;
        }
        let shot = '';
        try {
            const tab = await chrome.tabs.get(tabId);
            shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 100 });
        } catch (e) { shot = ''; }
        if (shot) {
            try {
                const o = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtShotOverlayInPage, args: [shot, true] });
                overlayOn = !!(o && o[0] && o[0].result);
            } catch (e) { overlayOn = false; }
        }
        const r = await run('run');
        const res = r && r[0] && r[0].result;
        if (res) console.log('SaveAsMHT: animation state:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: animation state failed', e);
    } finally {
        if (overlayOn) {
            try { await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtShotOverlayInPage, args: ['', false] }); } catch (e) { }
        }
    }
}
async function mhtAnimStateCleanup(tabId: number): Promise<void> {
    if (!MHT_ANIM_STATE && !MHT_ANIM_IMAGES) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId }, world: 'MAIN', func: mhtAnimStateCleanupInPage });
    } catch (e) { }
}
// === END MhtAnimState ===
// === MHT motion (patch MhtMotion) ===
// A saved .mht has no scripts, so everything the site's JavaScript did with the page in reaction to
// scrolling or time (parallax, text and images that fade / slide in, sticky sections that move text
// sideways, headers that change colour, animations made with element.animate()) stays frozen in one
// frame. The worker watches what the page does while the existing scroll sweep (MhtAnimState) walks
// over the whole scroll extent WITHOUT really scrolling, notes how every element looks at every
// scroll position and writes it back into the page as plain CSS scroll-driven animations
// (animation-timeline: scroll(root)), which a browser plays without any script. Animations made with
// the Web Animations API are written as @keyframes with the same timing and the same phase.
// Nothing is changed for good: the helper style and the data-save-as-mht-mo attributes are removed
// right after the capture. Set MHT_MOTION to false to switch the whole feature off.
const MHT_MOTION = true;
const MHT_MOTION_TIME = true;
const MHT_MOTION_SCROLL = true;
const MHT_MOTION_MAX_EL = 1500;
const MHT_MOTION_MAX_CSS = 700000;
// The sweep stops early when nothing at all reacted to the first N screens and the page has no hidden elements (0 = never stop early)
const MHT_MOTION_IDLE_VH = 4;
// Runs inside the page (MAIN world, the same world as the scroll sweep)
function mhtMotionInitInPage(opts) {
  const W = window;
  const KEY = "__saveAsMhtMo";
  try {
    if (W[KEY] && W[KEY].clear) W[KEY].clear();
  } catch (e) {
  }
  const ATTR = "data-save-as-mht-mo";
  const skipTag = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1 };
  const ours = function(el) {
    return !!(el.id && el.id.indexOf("__save_as_mht") === 0) || el.hasAttribute("data-save-as-mht-injected") || el.hasAttribute("data-save-as-mht-sr");
  };
  const sleep = function(ms) {
    return new Promise(function(r) {
      setTimeout(r, ms);
    });
  };
  const kebab = function(s) {
    return s.replace(/[A-Z]/g, function(m) {
      return "-" + m.toLowerCase();
    });
  };
  const splitTop = function(s) {
    const out = [];
    let depth = 0, cur = "";
    for (let i = 0; i < s.length; i++) {
      const ch = s.charAt(i);
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim() || out.length) out.push(cur.trim());
    return out;
  };
  const fmt = function(n) {
    return String(Math.round(n * 1e3) / 1e3);
  };
  const T1 = ["opacity", "transform", "translate", "rotate", "scale", "filter", "clip-path", "visibility", "background-color", "color", "box-shadow", "offset-distance", "offset-rotate", "z-index", "display"];
  const INL = /^(--[\w-]+|opacity|transform|translate|rotate|scale|filter|backdrop-filter|clip-path|clip|visibility|color|background-color|background-position(-x|-y)?|background-size|box-shadow|text-shadow|border-(top-|right-|bottom-|left-)?color|outline-color|fill|stroke|stroke-dasharray|stroke-dashoffset|stroke-width|stroke-opacity|fill-opacity|width|height|min-width|min-height|max-width|max-height|top|left|right|bottom|inset|margin(-top|-right|-bottom|-left)?|padding(-top|-right|-bottom|-left)?|object-position|mask-position|mask-size|-webkit-mask-position|-webkit-mask-size|border-radius|flex-basis|gap)$/;
  const rep = { waapi: 0, tracks: 0, reveals: 0, continuous: 0, cands: 0, noisy: 0, refine: 0, ms: 0, skippedCss: 0 };
  const regs = /* @__PURE__ */ new Map();
  const keyframes = /* @__PURE__ */ new Map();
  const rawRules = /* @__PURE__ */ new Map();
  let kfN = 0;
  const kfName = function(body) {
    let n = keyframes.get(body);
    if (!n) {
      n = "__mht_k" + ++kfN;
      keyframes.set(body, n);
    }
    return n;
  };
  const addAnim = function(el, spec) {
    let l = regs.get(el);
    if (!l) {
      l = [];
      regs.set(el, l);
    }
    l.push(spec);
  };
  const addRaw = function(el, decl) {
    rawRules.set(el, (rawRules.get(el) || "") + decl);
  };
  const api = { rep, stats: rep };
  const undo = [];
  let timer = 0;
  api.clear = function() {
    clearTimeout(timer);
    for (let i = undo.length - 1; i >= 0; i--) {
      try {
        undo[i]();
      } catch (e) {
      }
    }
    undo.length = 0;
    try {
      document.querySelectorAll("[" + ATTR + "]").forEach(function(el) {
        el.removeAttribute(ATTR);
      });
      document.querySelectorAll("style[data-save-as-mht-motion]").forEach(function(el) {
        el.remove();
      });
    } catch (e) {
    }
    try {
      if (W[KEY] === api) delete W[KEY];
    } catch (e) {
    }
  };
  timer = setTimeout(api.clear, 12e4);
  W[KEY] = api;
  api.collectTime = function() {
    let list = [];
    try {
      list = document.getAnimations();
    } catch (e) {
    }
    for (let li = 0; li < list.length; li++) {
      const a = list[li];
      try {
        if (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation) continue;
        if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) continue;
        const ef = a.effect;
        if (!ef || typeof ef.getKeyframes !== "function") continue;
        const el = ef.target;
        if (!el || ef.pseudoElement || !el.isConnected || ours(el) || skipTag[el.tagName]) continue;
        if (a.playState === "idle") continue;
        const kfs = ef.getKeyframes();
        if (!kfs.length) continue;
        const tm = ef.getTiming();
        const ct = ef.getComputedTiming();
        const body = kfs.map(function(kf) {
          const decl = [];
          Object.keys(kf).forEach(function(k) {
            if (k === "offset" || k === "computedOffset" || k === "easing" || k === "composite") return;
            const v = kf[k];
            if (v === null || v === void 0 || v === "") return;
            const prop = k === "cssFloat" ? "float" : k === "cssOffset" ? "offset" : kebab(k);
            decl.push(prop + ":" + v);
          });
          if (kf.easing && kf.easing !== "linear") decl.push("animation-timing-function:" + kf.easing);
          const off = typeof kf.computedOffset === "number" ? kf.computedOffset : 0;
          return fmt(off * 100) + "%{" + decl.join(";") + "}";
        }).join("");
        const spec = {
          name: kfName(body),
          dur: "1000ms",
          tim: tm.easing && tm.easing !== "linear" && kfs.length === 2 ? tm.easing : "linear",
          del: "0ms",
          it: tm.iterations === Infinity ? "infinite" : String(tm.iterations),
          dir: tm.direction || "normal",
          fill: tm.fill && tm.fill !== "auto" ? tm.fill : "none",
          st: a.playState === "paused" ? "paused" : "running",
          tl: "auto",
          rs: "normal",
          re: "normal"
        };
        const tl = a.timeline;
        const isDoc = !tl || typeof DocumentTimeline !== "undefined" && tl instanceof DocumentTimeline;
        if (isDoc) {
          let rate = a.playbackRate;
          if (!rate) rate = 1;
          if (rate < 0) continue;
          let d = Number(ct.duration);
          if (!isFinite(d) || d <= 0) d = 1;
          const cur = a.currentTime === null || a.currentTime === void 0 ? 0 : Number(a.currentTime);
          spec.dur = fmt(d / rate) + "ms";
          spec.del = fmt((Number(tm.delay) - cur) / rate) + "ms";
        } else if (typeof ScrollTimeline !== "undefined" && tl instanceof ScrollTimeline) {
          spec.dur = "auto";
          spec.del = "0ms";
          if (typeof ViewTimeline !== "undefined" && tl instanceof ViewTimeline) {
            const sub = tl.subject;
            if (!sub || !sub.isConnected) continue;
            const nm = "--mht-vt" + ++kfN;
            addRaw(sub, "view-timeline-name:" + nm + ";view-timeline-axis:" + (tl.axis || "block") + ";");
            spec.tl = nm;
          } else {
            const src = tl.source;
            if (!(src === document.scrollingElement || src === document.documentElement)) continue;
            spec.tl = "scroll(root " + (tl.axis || "block") + ")";
          }
          try {
            const rs = a.rangeStart, re = a.rangeEnd;
            const str = function(v) {
              if (!v) return "normal";
              if (typeof v === "string") return v;
              if (v.rangeName) return v.rangeName + " " + String(v.offset);
              return String(v);
            };
            spec.rs = str(rs);
            spec.re = str(re);
          } catch (e) {
          }
        } else continue;
        addAnim(el, spec);
        rep.waapi++;
      } catch (e) {
      }
    }
  };
  const rec = { on: false, ctx: null, pre: /* @__PURE__ */ new Map(), cand: /* @__PURE__ */ new Map(), noisy: /* @__PURE__ */ new Set(), mc: /* @__PURE__ */ new Map(), obs: null, pos: [], posX: [], fixedCache: /* @__PURE__ */ new Map(), scratch: null };
  const readT1 = function(el, cs) {
    const c = new Array(T1.length), e = new Array(T1.length);
    const st = el.style;
    for (let i = 0; i < T1.length; i++) {
      const v = cs.getPropertyValue(T1[i]);
      c[i] = v;
      const iv = st ? st.getPropertyValue(T1[i]) : "";
      e[i] = iv || v;
    }
    return { c, e };
  };
  const CXN = ["width", "height", "min-width", "min-height", "max-width", "max-height", "top", "left", "right", "bottom", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left", "background-position", "background-size", "object-position", "border-radius", "flex-basis", "gap", "text-shadow", "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-dashoffset", "backdrop-filter"];
const readCx = function (cs: any) {
    const o: any = {};
    for (let i = 0; i < CXN.length; i++) o[CXN[i]] = cs.getPropertyValue(CXN[i]);
    return o;
};
const xv = function (s: any, n: any) {
    return s.x[n] || s.cx && s.cx[n] || "";
};
const readInline = function(el) {
    const x = {};
    const st = el.style;
    if (!st) return x;
    for (let i = 0; i < st.length; i++) {
      const n = st[i];
      if (T1.indexOf(n) >= 0 || !INL.test(n)) continue;
      x[n] = st.getPropertyValue(n);
    }
    return x;
  };
  const parseOld = function(text) {
    const x = {};
    if (!text) return x;
    if (!rec.scratch) rec.scratch = document.createElement("div");
    rec.scratch.setAttribute("style", text);
    const st = rec.scratch.style;
    for (let i = 0; i < st.length; i++) {
      const n = st[i];
      if (T1.indexOf(n) >= 0 || !INL.test(n)) continue;
      x[n] = st.getPropertyValue(n);
    }
    return x;
  };
  const admit = function(el, why) {
    if (rec.cand.has(el)) return rec.cand.get(el);
    if (rec.cand.size >= opts.maxEl) return null;
    if (!el || el.nodeType !== 1 || skipTag[el.tagName] || ours(el)) return null;
    if (el.namespaceURI === "http://www.w3.org/2000/svg" && el.tagName !== "svg" && !el.style) return null;
    const c = { el, why, old: null, oldSeen: false, s: [] };
    rec.cand.set(el, c);
    return c;
  };
  const sample = function(c, p) {
    const el = c.el;
    const cs = getComputedStyle(el);
    const t = readT1(el, cs);
    c.s.push({ p, c: t.c, e: t.e, x: readInline(el), cx: readCx(cs), disp: cs.display });
  };
  api.mute = function(list) {
    if (!rec.on) return false;
    for (let i = 0; i < list.length; i++) {
      const t = list[i].target;
      if (!t || !rec.noisy.has(t)) return false;
    }
    return list.length > 0;
  };
  api.begin = async function(ctx) {
    if (!opts.scroll) return;
    const t0 = Date.now();
    rec.ctx = ctx; if (ctx.tfsEl) { rec.tfsEl = ctx.tfsEl; rec.noisy.add(ctx.tfsEl); }
    const els = document.body ? document.body.getElementsByTagName("*") : [];
    const lim = Math.min(els.length, 15e3);
    let pre = 0, tierB = 0;
    for (let i = 0; i < lim; i++) {
      const el = els[i];
      if (skipTag[el.tagName] || ours(el)) continue;
      if (!el.style) continue;
      const cs = getComputedStyle(el);
      const t = readT1(el, cs);
      t.cx = readCx(cs); rec.pre.set(el, t);
      const o = parseFloat(t.c[0]);
      const inlineMotion = !!(el.style.opacity || el.style.transform || el.style.translate || el.style.scale || el.style.rotate);
      const wc = cs.willChange || "";
      let tierA = o < 0.999 || t.c[7] !== "visible" || inlineMotion && t.c[1] !== "none" || /transform|opacity/.test(wc) || !!el.style.getPropertyValue("offset-distance") || cs.animationName !== "none" && /paused/.test(cs.animationPlayState);
      if (tierA && pre < 700) {
        pre++;
        admit(el, "pre");
      } else if (t.c[1] !== "none" && tierB < 200) {
        tierB++;
        admit(el, "pre");
      }
    }
    rec.obs = new MutationObserver(function(list) {
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        const el = m.target;
        const an = m.attributeName || "";
        if (!el || el.nodeType !== 1 || an.indexOf("data-save-as-mht") === 0) continue;
        if (skipTag[el.tagName] || ours(el)) continue;
        rec.mc.set(el, (rec.mc.get(el) || 0) + 1);
        if (!rec.noisy.has(el)) rec.mutSeen = true;
        const c = admit(el, "mut");
        if (c && an === "style" && !c.oldSeen) {
          c.oldSeen = true;
          c.old = m.oldValue;
        }
        if (c && an === "class" && el !== document.body && el !== document.documentElement) {
          const ds = el.getElementsByTagName("*");
          for (let k = 0; k < ds.length && k < 40; k++) admit(ds[k], "desc");
        }
      }
    });
    rec.obs.observe(document.documentElement, { attributes: true, subtree: true, attributeOldValue: true });
    rec.on = true;
    undo.push(function() {
      try {
        rec.obs && rec.obs.disconnect();
      } catch (e) {
      }
      rec.on = false;
    });
    try {
      document.getAnimations().forEach(function(a) {
        const ef = a.effect;
        const el = ef && ef.target;
        if (!el) return;
        const tl = a.timeline;
        if (tl && typeof ScrollTimeline !== "undefined" && tl instanceof ScrollTimeline) return;
        const t = ef.getComputedTiming ? ef.getComputedTiming() : null;
        if (t && t.endTime === Infinity && a.playState === "running") {
          rec.noisy.add(el);
          rep.noisy++;
        }
      });
    } catch (e) {
    }
    await sleep(140);
    rec.mc.forEach(function(n, el) {
      if (n >= 3) {
        rec.noisy.add(el);
        rep.noisy++;
      }
    });
    rec.mc.clear();
    rec.mutSeen = false;
    rep.begin = Date.now() - t0;
  };
  api.frame = function(i, pos) {
    if (!rec.on) return true;
    if (i < 0) {
      if (rec.posX.indexOf(pos) < 0) rec.posX.push(pos);
    } else if (rec.pos.indexOf(pos) < 0) rec.pos.push(pos);
    rec.cand.forEach(function(c) {
      if (rec.noisy.has(c.el) || !c.el.isConnected) return;
      try {
        sample(c, pos);
      } catch (e) {
      }
    });
    rep.frames = (rep.frames || 0) + 1;
    if (i >= 3 && opts.idleVh > 0 && !rec.ctx.suspects && !rec.mutSeen && pos >= Math.min(rec.ctx.maxV, opts.idleVh * rec.ctx.vh)) {
      rep.idleStop = true;
      return false;
    }
    return true;
  };
  const fixedLike = function(el) {
    if (rec.fixedCache.has(el)) return rec.fixedCache.get(el);
    let r = false;
    for (let p = el, k = 0; p && p !== document.documentElement && p !== rec.tfsEl && k < 40; p = p.parentElement, k++) {
      const pos = getComputedStyle(p).position;
      if (pos === "fixed" || pos === "sticky") {
        r = true;
        break;
      }
    }
    rec.fixedCache.set(el, r);
    return r;
  };
  const buildSeq = function(c, withExtra) {
    const ctx = rec.ctx;
    const byPos = /* @__PURE__ */ new Map();
    c.s.forEach(function(s) {
      byPos.set(s.p, s);
    });
    const pre = rec.pre.get(c.el);
    const oldX = parseOld(c.old);
    const preS = pre ? { p: ctx.sy0, c: pre.c, e: pre.e, x: oldX, cx: pre.cx, disp: "" } : null;
    const first = c.s.length ? c.s[0] : null;
    const allPos = rec.pos.slice();
    if (withExtra) rec.posX.forEach(function(p) {
      if (allPos.indexOf(p) < 0) allPos.push(p);
    });
    if (allPos.indexOf(ctx.sy0) < 0) allPos.push(ctx.sy0);
    allPos.sort(function(a, b) {
      return a - b;
    });
    const seq = [];
    let started = false;
    for (let i = 0; i < allPos.length; i++) {
      const p = allPos[i];
      let s = byPos.get(p);
      if (s) started = true;
      else if (!started || !first) s = preS ? { p, c: preS.c, e: preS.e, x: preS.x, cx: preS.cx, disp: "" } : null;
      else {
        s = null;
      }
      if (!s) continue;
      seq.push(s);
    }
    return seq;
  };
  const varying = function(seq) {
    const props = [];
    for (let j = 0; j < T1.length; j++) {
      let diff = false;
      for (let i = 1; i < seq.length; i++) {
        if (seq[i].c[j] !== seq[0].c[j]) {
          diff = true;
          break;
        }
      }
      if (diff) props.push({ k: "t", j, name: T1[j] });
    }
    const names = {};
    seq.forEach(function(s) {
      Object.keys(s.x).forEach(function(n) {
        names[n] = 1;
      });
    });
    Object.keys(names).forEach(function(n) {
      let diff = false;
      for (let i = 1; i < seq.length; i++) {
        if (xv(seq[i], n) !== xv(seq[0], n)) {
          diff = true;
          break;
        }
      }
      if (diff) props.push({ k: "x", name: n });
    });
    return props;
  };
  const stateKey = function(s, props) {
    let k = "";
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      k += (p.k === "t" ? s.c[p.j] : xv(s, p.name)) + "\u0001";
    }
    return k;
  };
  const stepInterval = function(c) {
    if (!c.el.isConnected) return null;
    if (!rec.ctx.seen0.has(c.el) && !fixedLike(c.el)) return null;
    const seq = buildSeq(c, true);
    if (seq.length < 2) return null;
    const props = varying(seq);
    if (!props.length) return null;
    const keys = seq.map(function(s) {
      return stateKey(s, props);
    });
    let tr = 0, a = 0, b = 0;
    for (let i = 1; i < keys.length; i++) {
      if (keys[i] !== keys[i - 1]) {
        tr++;
        a = seq[i - 1].p;
        b = seq[i].p;
      }
    }
    if (tr !== 1) return null;
    return { a, b };
  };
  api.refine = async function() {
    if (!rec.on || !rec.ctx || !rec.ctx.goto) return;
    const ctx = rec.ctx;
    for (let round = 0; round < 8; round++) {
      if (Date.now() - ctx.t0 > ctx.maxMs * 0.8) break;
      const groups = /* @__PURE__ */ new Map();
      rec.cand.forEach(function(c) {
        if (rec.noisy.has(c.el)) return;
        let iv = null;
        try {
          iv = stepInterval(c);
        } catch (e) {
        }
        if (iv && iv.b - iv.a > 6) {
          const k = iv.a + "|" + iv.b;
          groups.set(k, (groups.get(k) || 0) + 1);
        }
      });
      let best = null, bn = 0;
      groups.forEach(function(n, k) {
        if (n > bn) {
          bn = n;
          best = k;
        }
      });
      if (!best) break;
      const ab = best.split("|").map(Number);
      const mid = Math.round((ab[0] + ab[1]) / 2);
      if (rec.pos.indexOf(mid) >= 0 || rec.posX.indexOf(mid) >= 0) break;
      await ctx.goto(mid);
      api.frame(-1, mid);
      rep.refine++;
    }
  };
  api.refine2 = async function () {
    if (!rec.on || !rec.ctx || !rec.ctx.goto) return;
    const ctx = rec.ctx;
    const step = Math.max(90, Math.round(ctx.vh * 0.12));
    const endBy = ctx.t0 + ctx.maxMs * 0.95;
    let extra = 0;
    for (let round = 0; round < 7 && extra < 60; round++) {
        if (Date.now() > endBy) break;
        const w = new Map();
        rec.cand.forEach(function (c) {
            if (rec.noisy.has(c.el) || !c.el.isConnected || !c.s.length) return;
            if (!ctx.seen0.has(c.el) && !fixedLike(c.el)) return;
            let seq, props;
            try {
                seq = buildSeq(c, true);
                if (seq.length < 2) return;
                props = varying(seq);
            } catch (e) {
                return;
            }
            if (!props.length) return;
            let prev = stateKey(seq[0], props);
            for (let i = 1; i < seq.length; i++) {
                const k = stateKey(seq[i], props);
                if (k !== prev && seq[i].p - seq[i - 1].p > step) {
                    const key = seq[i - 1].p + "|" + seq[i].p;
                    w.set(key, (w.get(key) || 0) + 1);
                }
                prev = k;
            }
        });
        if (!w.size) break;
        const list = Array.from(w.entries()).sort(function (a, b) {
            return b[1] - a[1];
        }).slice(0, 30);
        let did = 0;
        for (let q = 0; q < list.length; q++) {
            if (Date.now() > endBy || extra >= 60) break;
            const ab = list[q][0].split("|").map(Number);
            const mid = Math.round((ab[0] + ab[1]) / 2);
            if (rec.pos.indexOf(mid) >= 0 || rec.posX.indexOf(mid) >= 0) continue;
            await ctx.goto(mid);
            api.frame(-1, mid);
            extra++;
            did++;
        }
        if (!did) break;
    }
    if (extra) rec.adaptive = true;
    rep.adaptive = extra;
};
api.end = function() {
    if (!rec.on) return;
    const ctx = rec.ctx;
    const t0 = Date.now();
    try {
      rec.obs && rec.obs.disconnect();
    } catch (e) {
    }
    rec.on = false;
    const vh = ctx.vh;
    const maxV = Math.max(1, ctx.maxV, rec.pos.length ? Math.max.apply(null, rec.pos) : 0);
    const loopFor = function(f) {
      rec.cand.forEach(function(c) {
        if (rec.noisy.has(c.el) || !c.el.isConnected || !c.s.length) return;
        f(c);
      });
    };
    loopFor(function(c) {
      let seq, props;
      const trOf = function(q) {
        const pr = varying(q);
        let n = 0;
        for (let i = 1; i < q.length; i++) {
          if (stateKey(q[i], pr) !== stateKey(q[i - 1], pr)) n++;
        }
        return n;
      };
      try {
        seq = buildSeq(c, false);
        if (seq.length < 2) return;
        if (rec.posX.length && (ctx.seen0.has(c.el) || fixedLike(c.el))) {
          const s2 = buildSeq(c, true);
          if (rec.adaptive || trOf(s2) <= trOf(seq)) seq = s2;
        }
        props = varying(seq);
      } catch (e) {
        return;
      }
      if (!props.length) return;
      const el = c.el;
      if (seq.every(function(s) {
        return s.disp === "none";
      })) return;
      const key = function(s) {
        return stateKey(s, props);
      };
      const keys = seq.map(key);
      let tr = 0, ia = 0, ib = 0;
      for (let i = 1; i < keys.length; i++) {
        if (keys[i] !== keys[i - 1]) {
          tr++;
          ia = seq[i - 1].p;
          ib = seq[i].p;
        }
      }
      const decl = function(s) {
        let d = "";
        props.forEach(function(p) {
          if (p.k === "t") d += p.name + ":" + (s.e[p.j] || "initial") + ";";
          else d += p.name + ":" + (xv(s, p.name) || "unset") + ";";
        });
        return d;
      };
      let spec = null;
      const reveal = tr === 1 && !ctx.seen0.has(el) && !fixedLike(el);
      if (reveal) {
        let T = NaN;
        try {
          const r = el.getBoundingClientRect();
          if (r.width > 0 || r.height > 0) T = r.top + ctx.sy0;
        } catch (e) {
        }
        let sa = ia;
        if (isFinite(T)) sa = Math.max(ia, Math.min(ib, T - 0.95 * vh));
        const len = Math.max(60, Math.round(0.15 * vh));
        const sb = sa + len;
        const from = decl(seq[0]), to = decl(seq[seq.length - 1]);
        if (from === to) return;
        spec = {
          name: kfName("0%{" + from + "}100%{" + to + "}"),
          dur: "auto",
          tim: "linear",
          del: "0ms",
          it: "1",
          dir: "normal",
          fill: "both",
          st: "running",
          tl: "scroll(root block)",
          rs: Math.round(sa) + "px",
          re: Math.round(sb) + "px"
        };
        rep.reveals++;
      } else {
        const frames = [];
        for (let i = 0; i < seq.length; i++) {
          if (i > 0 && i < seq.length - 1 && keys[i] === keys[i - 1] && keys[i] === keys[i + 1]) continue;
          frames.push({ p: seq[i].p, d: decl(seq[i]) });
        }
        if (frames.length < 2) return;
        if (frames[0].p > 0) frames.unshift({ p: 0, d: frames[0].d });
        let body = "";
        frames.forEach(function(f) {
          body += fmt(Math.min(100, Math.max(0, f.p / maxV * 100))) + "%{" + f.d + "}";
        });
        const last = frames[frames.length - 1];
        if (last.p < maxV) body += "100%{" + last.d + "}";
        spec = {
          name: kfName(body),
          dur: "auto",
          tim: "linear",
          del: "0ms",
          it: "1",
          dir: "normal",
          fill: "both",
          st: "running",
          tl: "scroll(root block)",
          rs: "0px",
          re: Math.round(maxV) + "px"
        };
        rep.continuous++;
      }
      addAnim(el, spec);
      rep.tracks++;
    });
    rep.cands = rec.cand.size;
    rep.endMs = Date.now() - t0;
  };
  api.flush = function() {
    const out = [];
    const used = /* @__PURE__ */ new Set();
    let id = 0, size = 0;
    const targets = /* @__PURE__ */ new Set();
    regs.forEach(function(l, el) {
      targets.add(el);
    });
    rawRules.forEach(function(l, el) {
      targets.add(el);
    });
    targets.forEach(function(el) {
      if (!el.isConnected) return;
      const list = regs.get(el) || [];
      id++;
      el.setAttribute(ATTR, String(id));
      let rule = "[" + ATTR + '="' + id + '"]{' + (rawRules.get(el) || "");
      if (list.length) {
        const cols = { name: [], dur: [], tim: [], del: [], it: [], dir: [], fill: [], st: [], tl: [], rs: [], re: [] };
        try {
          const cs = getComputedStyle(el);
          const nm = cs.animationName;
          if (nm && nm !== "none") {
            const names = splitTop(nm);
            const cyc = function(v, d) {
              const a = splitTop(v || "");
              return a.length && a[0] ? a : [d];
            };
            const L = {
              dur: cyc(cs.animationDuration, "0s"),
              tim: cyc(cs.animationTimingFunction, "ease"),
              del: cyc(cs.animationDelay, "0s"),
              it: cyc(cs.animationIterationCount, "1"),
              dir: cyc(cs.animationDirection, "normal"),
              fill: cyc(cs.animationFillMode, "none"),
              st: cyc(cs.animationPlayState, "running"),
              tl: cyc(cs.animationTimeline, "auto"),
              rs: cyc(cs.animationRangeStart, "normal"),
              re: cyc(cs.animationRangeEnd, "normal")
            };
            for (let i = 0; i < names.length; i++) {
              cols.name.push(names[i]);
              Object.keys(L).forEach(function(k) {
                cols[k].push(L[k][i % L[k].length]);
              });
            }
          }
        } catch (e) {
        }
        list.forEach(function(sp) {
          used.add(sp.name);
          Object.keys(cols).forEach(function(k) {
            cols[k].push(sp[k === "name" ? "name" : k]);
          });
        });
        const P = [["name", "animation-name"], ["dur", "animation-duration"], ["tim", "animation-timing-function"], ["del", "animation-delay"], ["it", "animation-iteration-count"], ["dir", "animation-direction"], ["fill", "animation-fill-mode"], ["st", "animation-play-state"], ["tl", "animation-timeline"], ["rs", "animation-range-start"], ["re", "animation-range-end"]];
        P.forEach(function(p) {
          rule += p[1] + ":" + cols[p[0]].join(",") + " !important;";
        });
      }
      rule += "}";
      size += rule.length;
      if (size > opts.maxCss) {
        rep.skippedCss++;
        el.removeAttribute(ATTR);
        return;
      }
      out.push(rule);
    });
    let css = "";
    keyframes.forEach(function(name, body) {
      if (used.has(name)) css += "@keyframes " + name + "{" + body + "}\n";
    });
    css += out.join("\n");
    rep.targets = id;
    rep.cssBytes = css.length;
    return { css, rep };
  };
  if (opts.time) api.collectTime();
  return rep;
}
function mhtMotionFlushInPage() {
  const a = window["__saveAsMhtMo"];
  if (!a || !a.flush) return null;
  return a.flush();
}
function mhtMotionInjectInPage(css) {
  document.querySelectorAll("style[data-save-as-mht-motion]").forEach(function(el) {
    el.remove();
  });
  if (!css) return false;
  const st = document.createElement("style");
  st.setAttribute("data-save-as-mht-injected", "1");
  st.setAttribute("data-save-as-mht-motion", "1");
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
  return true;
}
function mhtMotionClearInPage() {
  const a = window["__saveAsMhtMo"];
  if (a && a.clear) a.clear();
  document.querySelectorAll("[data-save-as-mht-mo]").forEach(function(el) {
    el.removeAttribute("data-save-as-mht-mo");
  });
}
async function mhtMotionTime(tabId) {
  if (!MHT_MOTION) return;
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func: mhtMotionInitInPage, args: [{ scroll: MHT_MOTION_SCROLL, time: MHT_MOTION_TIME, maxEl: MHT_MOTION_MAX_EL, maxCss: MHT_MOTION_MAX_CSS, idleVh: MHT_MOTION_IDLE_VH }] });
    const res = r && r[0] && r[0].result;
    if (res && res.waapi) console.log("SaveAsMHT: motion (Web Animations):", JSON.stringify(res));
  } catch (e) {
    console.warn("SaveAsMHT: motion init failed", e);
  }
}
async function mhtMotionApply(tabId) {
  if (!MHT_MOTION) return;
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func: mhtMotionFlushInPage });
    const res = r && r[0] && r[0].result;
    if (!res) return;
    console.log("SaveAsMHT: motion:", JSON.stringify(res.rep));
    if (res.css) await chrome.scripting.executeScript({ target: { tabId }, func: mhtMotionInjectInPage, args: [res.css] });
  } catch (e) {
    console.warn("SaveAsMHT: motion apply failed", e);
  }
}
async function mhtMotionCleanup(tabId) {
  if (!MHT_MOTION) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func: mhtMotionClearInPage });
  } catch (e) {
  }
}
// === END MhtMotion ===

// === MHT transform scroll (patch MhtTransformScroll) ===
// Some sites do not scroll the page at all: the body is locked (overflow: hidden) and a tall block is moved with a transform by the site's own script
// (smooth / virtual scrolling made of wheel events). A saved .mht has no scripts, so such a page could not be scrolled and none of its scroll animations
// could play. The scroll pass (MhtAnimState) replays the wheel input of the page through the whole extent of that block, the motion recorder (MhtMotion)
// writes what every element does on the way as scroll-driven CSS, and here, only for the time of the capture, the block is turned into an ordinary
// part of the page (no transform, no lock) so the saved page scrolls with its own scroll bar and the recorded animations play on it.
// Nothing stays changed: the helper style and the data-save-as-mht-tfs* attributes are removed right after the capture.
// Set MHT_TRANSFORM_SCROLL to false to switch the whole feature off.
const MHT_TRANSFORM_SCROLL = true;
// Runs inside the page (MAIN world: the block was found by the pass that runs in the same world)
function mhtTfsApplyInPage() {
  const W = window;
  const st = W.__saveAsMhtTfs;
  if (!st || !st.el || !st.el.isConnected || st.applied) return null;
  const el = st.el, de = document.documentElement, body = document.body;
  if (!body) return null;
  const wraps = [];
  for (let p = el.parentElement; p && p !== body && p !== de; p = p.parentElement) wraps.push(p);
  const H = Math.ceil(st.maxV + W.innerHeight);
  const css =
    'html[data-save-as-mht-tfsroot]{overflow-y:auto!important;height:auto!important}\n' +
    'body[data-save-as-mht-tfsroot]{overflow:visible!important;height:auto!important;min-height:' + H + 'px!important;position:relative!important}\n' +
    '[data-save-as-mht-tfswrap]{position:static!important;transform:none!important;overflow:visible!important;height:auto!important;max-height:none!important;clip-path:none!important}\n' +
    '[data-save-as-mht-tfs]{position:absolute!important;top:0!important;left:0!important;transform:none!important;translate:none!important}\n';
  el.setAttribute('data-save-as-mht-tfs', '1');
  wraps.forEach(function (p) { p.setAttribute('data-save-as-mht-tfswrap', '1'); });
  de.setAttribute('data-save-as-mht-tfsroot', '1');
  body.setAttribute('data-save-as-mht-tfsroot', '1');
  const s = document.createElement('style');
  s.setAttribute('data-save-as-mht-injected', '1');
  s.setAttribute('data-save-as-mht-tfsstyle', '1');
  s.textContent = css;
  (document.head || de).appendChild(s);
  st.applied = true;
  st.style = s;
  if (st.sy0 > 0) { try { W.scrollTo(0, st.sy0); } catch (e) { } }
  return { wraps: wraps.length, height: H, sy0: st.sy0 };
}
// Runs inside the page (MAIN world): puts everything that mhtTfsApplyInPage changed back
function mhtTfsCleanupInPage() {
  const W = window;
  const st = W.__saveAsMhtTfs;
  try {
    document.querySelectorAll('style[data-save-as-mht-tfsstyle]').forEach(function (e) { e.remove(); });
    document.querySelectorAll('[data-save-as-mht-tfs],[data-save-as-mht-tfswrap],[data-save-as-mht-tfsroot]').forEach(function (e) {
      e.removeAttribute('data-save-as-mht-tfs');
      e.removeAttribute('data-save-as-mht-tfswrap');
      e.removeAttribute('data-save-as-mht-tfsroot');
    });
  } catch (e) { }
  try { if (st && st.applied) W.scrollTo(0, 0); } catch (e) { }
  try { delete W.__saveAsMhtTfs; } catch (e) { W.__saveAsMhtTfs = null; }
}
async function mhtTfsApply(tabId) {
  if (!MHT_TRANSFORM_SCROLL) return;
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId: tabId }, world: 'MAIN', func: mhtTfsApplyInPage });
    const res = r && r[0] && r[0].result;
    if (res) console.log('SaveAsMHT: transform scroll made native for the capture:', JSON.stringify(res));
  } catch (e) {
    console.warn('SaveAsMHT: transform scroll apply failed', e);
  }
}
async function mhtTfsCleanup(tabId) {
  if (!MHT_TRANSFORM_SCROLL) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tabId }, world: 'MAIN', func: mhtTfsCleanupInPage });
  } catch (e) { }
}
// === END MhtTransformScroll ===// === MHT auto motion (patch MhtAutoMotion) ===
// A saved .mht has no scripts. Three things that a site does with scripts (or with a timer) were lost in it:
//  1) Endless motion that a script writes into the page on every frame (a marquee / ticker / "rail", a spinner): the saved page keeps
//     one frozen frame. The worker watches the page for a moment before the capture, finds the elements whose inline style is rewritten
//     on every frame, measures their motion and, if it is a steady endless translation (with a wrap-around) or a steady rotation,
//     writes it back as a plain CSS animation (translate / rotate property, linear, infinite) that a browser plays without any script.
//     The period of a wrap-around is taken from the wrap that was seen, or from the distance between two equal neighbours of the
//     moving block (a marquee repeats its text). The loop is kept inside the part of the block that covers the screen.
//  2) A finite CSS animation that a script starts when a block comes into view (a class such as is-inview is added: a handwriting
//     that is drawn, a text that slides in). The class is saved, so the animation plays once, right when the saved file is opened,
//     while the block is far below the screen, and nobody sees it. Such an animation (a block that is below the first screen) is written
//     as a scroll-driven animation (animation-timeline: scroll(root)) over a short piece of the scroll bar just before the block
//     reaches the screen, so it plays when the saved page is scrolled there. The keyframes stay the ones of the site.
//  3) A decorative video (muted, looping / autoplaying, without controls: a background video) is not part of an .mht, and a saved
//     page may not load anything that is not inside the file, so it stayed a still picture. Such a video is downloaded by the worker
//     and put into the saved page as a data: address, so it plays by itself. Videos that look like a player (controls, sound,
//     a player container, a very long file, a blob / stream address) are left alone: for them the poster frame is used as before.
// Nothing is scrolled and nothing stays changed: the helper style and the data-save-as-mht-lp / -sa / -dv attributes are removed
// right after the capture. Set MHT_AUTO_MOTION to false to switch the whole patch off, or one part off with its own constant.
const MHT_AUTO_MOTION = true;
const MHT_AUTO_LOOPS = true;
const MHT_AUTO_LOOPS_MS = 1300;
const MHT_AUTO_LOOPS_PROBE_MS = 450;
const MHT_AUTO_ONCE = true;
const MHT_DECOR_VIDEOS = true;
const MHT_DECOR_VIDEOS_MAX_COUNT = 6;
const MHT_DECOR_VIDEOS_MAX_ONE = 20 * 1024 * 1024;
const MHT_DECOR_VIDEOS_MAX_TOTAL = 40 * 1024 * 1024;
const MHT_DECOR_VIDEOS_MAX_DUR = 180;
const MHT_DECOR_VIDEOS_FETCH_MS = 90000;
let mhtDvList = [];
// Runs inside the page: watches the page, measures the endless motion of the elements that a script moves on every frame
async function mhtAutoLoopSampleInPage(opts) {
    const W = window;
    const KEY = '__saveAsMhtAutoLoop';
    try {
        if (W[KEY] && W[KEY].stop) W[KEY].stop();
    } catch (e) { }
    const skipTag = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1, HTML: 1, BODY: 1 };
    const counts = new Map();
    const track = new Map();
    const state = { specs: [], stop: null, rep: { tracked: 0, loops: 0, spins: 0 } };
    const obs = new MutationObserver(function (list) {
        for (let i = 0; i < list.length; i++) {
            const el = list[i].target;
            if (!el || el.nodeType !== 1 || skipTag[el.tagName]) continue;
            counts.set(el, (counts.get(el) || 0) + 1);
        }
    });
    obs.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['style'] });
    state.stop = function () {
        try { obs.disconnect(); } catch (e) { }
    };
    W[KEY] = state;
    const readM = function (el) {
        const t = getComputedStyle(el).transform;
        if (!t || t === 'none') return [1, 0, 0, 1, 0, 0];
        try {
            const m = new DOMMatrix(t);
            return [m.a, m.b, m.c, m.d, m.e, m.f];
        } catch (e) {
            return null;
        }
    };
    const frame = function () {
        return new Promise(function (resolve) {
            let done = false;
            const f = function () {
                if (!done) {
                    done = true;
                    resolve();
                }
            };
            try { requestAnimationFrame(f); } catch (e) { }
            setTimeout(f, 40);
        });
    };
    const t0 = performance.now();
    let probed = false;
    for (;;) {
        await frame();
        const now = performance.now();
        const spent = now - t0;
        counts.forEach(function (n, el) {
            if (n >= 5 && !track.has(el) && el.isConnected && track.size < 12) track.set(el, []);
        });
        track.forEach(function (arr, el) {
            if (!el.isConnected) return;
            const m = readM(el);
            if (m) arr.push({ t: now, m: m });
        });
        if (!probed && spent >= opts.probeMs) {
            probed = true;
            if (!track.size) break;
        }
        if (spent >= opts.ms) break;
    }
    try { obs.disconnect(); } catch (e) { }
    const median = function (a) {
        const s = a.slice().sort(function (x, y) { return x - y; });
        return s.length ? s[s.length >> 1] : 0;
    };
    const fit = function (ts, ys) {
        const n = ts.length;
        let st = 0, sy = 0;
        for (let i = 0; i < n; i++) {
            st += ts[i];
            sy += ys[i];
        }
        const mt = st / n, my = sy / n;
        let stt = 0, sty = 0, syy = 0;
        for (let i = 0; i < n; i++) {
            stt += (ts[i] - mt) * (ts[i] - mt);
            sty += (ts[i] - mt) * (ys[i] - my);
            syy += (ys[i] - my) * (ys[i] - my);
        }
        if (stt <= 0) return null;
        const k = sty / stt;
        const r2 = syy > 0 ? (sty * sty) / (stt * syy) : 0;
        return { k: k, r2: r2 };
    };
    // one number per sample (a position or an angle); wrap = true when a sudden jump back is a wrap-around of an endless loop
    const analyse = function (ts, vs, minRate, minR2, wrap) {
        const n = vs.length;
        if (n < 12) return null;
        const pairs = [];
        for (let i = 1; i < n; i++) {
            const dt = ts[i] - ts[i - 1];
            if (dt < 1) continue;
            pairs.push({ t: ts[i], dt: dt, dx: vs[i] - vs[i - 1], jump: 0 });
        }
        if (pairs.length < 10) return null;
        const s0 = median(pairs.map(function (p) { return p.dx / p.dt; }));
        if (Math.abs(s0) < minRate) return null;
        const jumps = [];
        let good = 0, bad = 0;
        pairs.forEach(function (p) {
            const expect = s0 * p.dt;
            const dev = p.dx - expect;
            if (wrap && Math.abs(dev) > Math.max(30, 8 * Math.abs(expect)) && Math.sign(dev) === -Math.sign(s0)) {
                p.jump = Math.abs(dev);
                jumps.push(p.jump);
            } else if (Math.abs(dev) <= Math.max(1.5, 0.6 * Math.abs(expect))) good++;
            else bad++;
        });
        if (good < 0.85 * (good + bad)) return null;
        const T = [ts[0]], C = [0];
        let cum = 0;
        pairs.forEach(function (p) {
            cum += p.jump ? s0 * p.dt : p.dx;
            T.push(p.t);
            C.push(cum);
        });
        const f = fit(T, C);
        if (!f || f.r2 < minR2 || Math.abs(f.k) < minRate) return null;
        return { rate: f.k * 1000, r2: f.r2, wrapW: jumps.length ? median(jumps) : 0 };
    };
    track.forEach(function (arr, el) {
        try {
            state.rep.tracked++;
            if (arr.length < 12) return;
            const ts = arr.map(function (s) { return s.t; });
            const xs = arr.map(function (s) { return s.m[4]; });
            const ys = arr.map(function (s) { return s.m[5]; });
            const ax = analyse(ts, xs, 0.006, 0.95, true);
            const ay = analyse(ts, ys, 0.006, 0.95, true);
            if (ax && (!ay || Math.abs(ax.rate) >= Math.abs(ay.rate) * 5)) {
                state.specs.push({ el: el, kind: 't', axis: 'x', v: ax.rate, wrapW: ax.wrapW });
                state.rep.loops++;
                return;
            }
            if (ay && (!ax || Math.abs(ay.rate) >= Math.abs(ax.rate) * 5)) {
                state.specs.push({ el: el, kind: 't', axis: 'y', v: ay.rate, wrapW: ay.wrapW });
                state.rep.loops++;
                return;
            }
            // steady rotation of an element that only rotates
            let still = true;
            arr.forEach(function (s) {
                const m = s.m;
                if (Math.abs(m[4]) > 0.6 || Math.abs(m[5]) > 0.6) still = false;
                if (Math.abs(m[0] * m[0] + m[1] * m[1] - (m[2] * m[2] + m[3] * m[3])) > 0.02) still = false;
            });
            if (!still) return;
            const ang = [];
            let prev = 0, acc = 0;
            arr.forEach(function (s, i) {
                const a = Math.atan2(s.m[1], s.m[0]) * 180 / Math.PI;
                if (i === 0) acc = a;
                else {
                    let d = a - prev;
                    d -= 360 * Math.round(d / 360);
                    acc += d;
                }
                prev = a;
                ang.push(acc);
            });
            const ar = analyse(ts, ang, 0.003, 0.97, false);
            if (ar) {
                state.specs.push({ el: el, kind: 'r', v: ar.rate });
                state.rep.spins++;
            }
        } catch (e) { }
    });
    return state.rep;
}
// Runs inside the page: writes what was measured, and the finite animations that wait for a scroll, as CSS into the page
function mhtAutoApplyInPage(opts) {
    const W = window;
    const KEY = '__saveAsMhtAutoLoop';
    const A_LOOP = 'data-save-as-mht-lp';
    const A_ONCE = 'data-save-as-mht-sa';
    const rep = { loops: 0, spins: 0, once: 0, scanned: 0, skippedCss: 0 };
    const skipTag = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1 };
    const ours = function (el) {
        return !!(el.id && el.id.indexOf('__save_as_mht') === 0) || el.hasAttribute('data-save-as-mht-injected');
    };
    const splitTop = function (s) {
        const out = [];
        let depth = 0, cur = '';
        for (let i = 0; i < s.length; i++) {
            const ch = s.charAt(i);
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            if (ch === ',' && depth === 0) {
                out.push(cur.trim());
                cur = '';
            } else cur += ch;
        }
        if (cur.trim() || out.length) out.push(cur.trim());
        return out;
    };
    const num = function (v) {
        return Math.round(v * 1000) / 1000;
    };
    const parseDur = function (s) {
        const m = /^(-?[\d.]+)(ms|s)$/.exec((s || '').trim());
        if (!m) return 0;
        return m[2] === 'ms' ? parseFloat(m[1]) / 1000 : parseFloat(m[1]);
    };
    const readM = function (el) {
        const t = getComputedStyle(el).transform;
        if (!t || t === 'none') return [1, 0, 0, 1, 0, 0];
        try {
            const m = new DOMMatrix(t);
            return [m.a, m.b, m.c, m.d, m.e, m.f];
        } catch (e) {
            return null;
        }
    };
    // what the element animates now (one entry per animation-name)
    const readAnims = function (cs) {
        const out = [];
        const nm = cs.animationName;
        if (!nm || nm === 'none') return out;
        const names = splitTop(nm);
        const cyc = function (v, d) {
            const a = splitTop(v || '');
            return a.length && a[0] ? a : [d];
        };
        const L = {
            dur: cyc(cs.animationDuration, '0s'),
            tim: cyc(cs.animationTimingFunction, 'ease'),
            del: cyc(cs.animationDelay, '0s'),
            it: cyc(cs.animationIterationCount, '1'),
            dir: cyc(cs.animationDirection, 'normal'),
            fill: cyc(cs.animationFillMode, 'none'),
            st: cyc(cs.animationPlayState, 'running'),
            tl: cyc(cs.animationTimeline, 'auto'),
            rs: cyc(cs.animationRangeStart, 'normal'),
            re: cyc(cs.animationRangeEnd, 'normal')
        };
        for (let i = 0; i < names.length; i++) {
            const e = { name: names[i] };
            Object.keys(L).forEach(function (k) {
                e[k] = L[k][i % L[k].length];
            });
            out.push(e);
        }
        return out;
    };
    const P = [['name', 'animation-name'], ['dur', 'animation-duration'], ['tim', 'animation-timing-function'], ['del', 'animation-delay'], ['it', 'animation-iteration-count'], ['dir', 'animation-direction'], ['fill', 'animation-fill-mode'], ['st', 'animation-play-state'], ['tl', 'animation-timeline'], ['rs', 'animation-range-start'], ['re', 'animation-range-end']];
    const rules = [];
    const frames = [];
    let ruleBytes = 0;
    let idLoop = 0, idOnce = 0, kfN = 0;
    const emit = function (el, attr, id, ents) {
        let rule = '[' + attr + '="' + id + '"]{';
        P.forEach(function (p) {
            rule += p[1] + ':' + ents.map(function (e) { return e[p[0]]; }).join(',') + ' !important;';
        });
        rule += '}';
        ruleBytes += rule.length;
        if (ruleBytes > 400000) {
            rep.skippedCss++;
            return false;
        }
        el.setAttribute(attr, String(id));
        rules.push(rule);
        return true;
    };
    // ---- 1) endless motion measured before the capture ----
    const st = W[KEY];
    if (opts.loops && st && st.specs) {
        const vw = W.innerWidth || document.documentElement.clientWidth || 1000;
        st.specs.forEach(function (spec) {
            try {
                const el = spec.el;
                if (!el || !el.isConnected) return;
                const cs = getComputedStyle(el);
                const ents = readAnims(cs);
                if (spec.kind === 'r') {
                    const sp = Math.abs(spec.v);
                    if (!(sp >= 3)) return;
                    const name = '__mht_lp' + ++kfN;
                    frames.push('@keyframes ' + name + '{from{rotate:0deg}to{rotate:' + (spec.v < 0 ? '-360' : '360') + 'deg}}');
                    ents.push({ name: name, dur: num(360 / sp) + 's', tim: 'linear', del: '0s', it: 'infinite', dir: 'normal', fill: 'none', st: 'running', tl: 'auto', rs: 'normal', re: 'normal' });
                    if (emit(el, A_LOOP, ++idLoop, ents)) rep.spins++;
                    return;
                }
                const m = readM(el);
                if (!m) return;
                const horiz = spec.axis === 'x';
                const xcap = horiz ? m[4] : m[5];
                const r = el.getBoundingClientRect();
                const size = horiz ? Math.max(r.width, el.scrollWidth || 0) : Math.max(r.height, el.scrollHeight || 0);
                let Wp = spec.wrapW;
                if (!(Wp > 20)) {
                    // the period is the distance between two equal neighbours (a marquee repeats its text)
                    const kids = el.children;
                    if (kids.length >= 2) {
                        const a = kids[0], b = kids[1];
                        const ta = (a.textContent || '').replace(/\s+/g, ' ').trim();
                        const tb = (b.textContent || '').replace(/\s+/g, ' ').trim();
                        const same = a.tagName === b.tagName && a.childElementCount === b.childElementCount && (ta ? ta === tb : a.innerHTML === b.innerHTML);
                        if (same) {
                            const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
                            Wp = Math.abs(horiz ? rb.left - ra.left : rb.top - ra.top);
                        }
                    }
                }
                if (!(Wp > 20) || Wp > size * 1.01) return;
                const v = Math.abs(spec.v);
                let top = xcap;
                if (horiz) {
                    const left0 = r.left - xcap;
                    const xMin = vw - (left0 + size);
                    const xMax = -left0;
                    if (spec.v < 0) {
                        for (let k = Math.max(0, Math.floor((xMax - xcap) / Wp)); k >= 0; k--) {
                            const c = xcap + Wp * k;
                            if (c - Wp >= xMin - 1 && c <= xMax + 1) {
                                top = c;
                                break;
                            }
                        }
                    } else {
                        for (let k = Math.max(0, Math.floor((xcap - xMin) / Wp)); k >= 0; k--) {
                            const c = xcap - Wp * k;
                            if (c >= xMin - 1 && c + Wp <= xMax + 1) {
                                top = c;
                                break;
                            }
                        }
                    }
                }
                const d0 = top - xcap;
                const d1 = spec.v < 0 ? d0 - Wp : d0 + Wp;
                const delay = spec.v < 0 ? -d0 / v : d0 / v;
                const pv = function (d) {
                    return horiz ? 'translate:' + num(d) + 'px 0' : 'translate:0 ' + num(d) + 'px';
                };
                const name = '__mht_lp' + ++kfN;
                frames.push('@keyframes ' + name + '{from{' + pv(d0) + '}to{' + pv(d1) + '}}');
                ents.push({ name: name, dur: num(Wp / v) + 's', tim: 'linear', del: num(delay) + 's', it: 'infinite', dir: 'normal', fill: 'none', st: 'running', tl: 'auto', rs: 'normal', re: 'normal' });
                if (emit(el, A_LOOP, ++idLoop, ents)) rep.loops++;
            } catch (e) { }
        });
    }
    // ---- 2) finite CSS animations of blocks below the first screen: they would play unseen when the saved file is opened ----
    if (opts.once && document.body) {
        const vh = W.innerHeight || document.documentElement.clientHeight || 800;
        const sy = W.scrollY || document.documentElement.scrollTop || 0;
        const maxV = Math.max(0, (document.documentElement.scrollHeight || 0) - vh);
        const len = Math.max(80, Math.round(vh * 0.3));
        const fixedCache = new Map();
        const fixedUp = function (el) {
            let r = false;
            for (let p = el, k = 0; p && p !== document.documentElement && k < 40; p = p.parentElement, k++) {
                if (fixedCache.has(p)) {
                    r = fixedCache.get(p);
                    break;
                }
                if (getComputedStyle(p).position === 'fixed') {
                    r = true;
                    break;
                }
            }
            fixedCache.set(el, r);
            return r;
        };
        const all = document.body.getElementsByTagName('*');
        const lim = Math.min(all.length, 20000);
        for (let i = 0; i < lim; i++) {
            const el = all[i];
            try {
                if (skipTag[el.tagName] || ours(el)) continue;
                const cs = getComputedStyle(el);
                const nm = cs.animationName;
                if (!nm || nm === 'none') continue;
                rep.scanned++;
                const ents = readAnims(cs);
                let geo;
                let changed = false;
                ents.forEach(function (e) {
                    if (!e.name || e.name === 'none' || e.name.indexOf('__mht_') === 0) return;
                    if (e.it === 'infinite' || e.st !== 'running') return;
                    const itn = parseFloat(e.it);
                    if (!(itn > 0) || !isFinite(itn)) return;
                    if (e.tl && e.tl !== 'auto') return;
                    if (!(parseDur(e.dur) > 0)) return;
                    if (geo === undefined) {
                        geo = null;
                        if (cs.display !== 'none' && el.getClientRects().length && !fixedUp(el)) {
                            const r = el.getBoundingClientRect();
                            const T = r.top + sy;
                            if (T >= vh * 0.95) geo = { T: T };
                        }
                    }
                    if (!geo) return;
                    let a = Math.round(geo.T - vh * 0.9);
                    a = Math.max(0, Math.min(a, Math.max(0, maxV - len)));
                    e.dur = 'auto';
                    e.del = '0s';
                    e.it = '1';
                    e.fill = 'both';
                    e.tl = 'scroll(root block)';
                    e.rs = a + 'px';
                    e.re = (a + len) + 'px';
                    changed = true;
                });
                if (changed && emit(el, A_ONCE, ++idOnce, ents)) rep.once++;
            } catch (e) { }
        }
    }
    if (rules.length) {
        document.querySelectorAll('style[data-save-as-mht-auto]').forEach(function (s) { s.remove(); });
        const style = document.createElement('style');
        style.setAttribute('data-save-as-mht-injected', '1');
        style.setAttribute('data-save-as-mht-auto', '1');
        style.textContent = frames.join('\n') + '\n' + rules.join('\n');
        (document.head || document.documentElement).appendChild(style);
    }
    return rep;
}
// Runs inside the page (in every frame): puts everything of this patch back
function mhtAutoCleanupInPage() {
    const W = window;
    const KEY = '__saveAsMhtAutoLoop';
    try {
        if (W[KEY] && W[KEY].stop) W[KEY].stop();
        delete W[KEY];
    } catch (e) { }
    const shadowOf = function (el) {
        try {
            const dom = chrome.dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const walk = function (root) {
        root.querySelectorAll('[data-save-as-mht-lp],[data-save-as-mht-sa],[data-save-as-mht-dv]').forEach(function (el) {
            el.removeAttribute('data-save-as-mht-lp');
            el.removeAttribute('data-save-as-mht-sa');
            el.removeAttribute('data-save-as-mht-dv');
        });
        root.querySelectorAll('style[data-save-as-mht-auto]').forEach(function (s) { s.remove(); });
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
}
async function mhtLoopSample(tabId) {
    if (!MHT_AUTO_MOTION || !MHT_AUTO_LOOPS) return;
    try {
        const r = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtAutoLoopSampleInPage, args: [{ ms: MHT_AUTO_LOOPS_MS, probeMs: MHT_AUTO_LOOPS_PROBE_MS }] });
        const res = r && r[0] && r[0].result;
        if (res && res.tracked) console.log('SaveAsMHT: endless motion watched:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: endless motion watch failed', e);
    }
}
async function mhtAutoApply(tabId) {
    if (!MHT_AUTO_MOTION) return;
    try {
        const r = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtAutoApplyInPage, args: [{ loops: MHT_AUTO_LOOPS, once: MHT_AUTO_ONCE }] });
        const res = r && r[0] && r[0].result;
        if (res) console.log('SaveAsMHT: auto motion:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: auto motion failed', e);
    }
    await mhtDecorVideosTag(tabId);
}
async function mhtAutoCleanup(tabId) {
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtAutoCleanupInPage });
    } catch (e) { }
    mhtDvList = [];
}
// Runs inside the page (in every frame): marks the decorative videos
function mhtDecorVideosTagInPage(maxDur) {
    const A = 'data-save-as-mht-dv';
    const out = [];
    const token = Math.random().toString(36).slice(2, 8);
    const shadowOf = function (el) {
        try {
            const dom = chrome.dom;
            if (dom && dom.openOrClosedShadowRoot) return dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const roots = [];
    const walk = function (root) {
        roots.push(root);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
    let n = 0;
    roots.forEach(function (root) {
        root.querySelectorAll('video[' + A + ']').forEach(function (v) { v.removeAttribute(A); });
        root.querySelectorAll('video').forEach(function (v) {
            try {
                if (v.controls || v.hasAttribute('controls')) return;
                const muted = v.muted || v.defaultMuted || v.hasAttribute('muted');
                const loop = v.loop || v.hasAttribute('loop');
                const auto = v.autoplay || v.hasAttribute('autoplay') || (!v.paused && !v.ended);
                if (!muted || !(loop || auto)) return;
                let url = v.currentSrc || v.src || '';
                if (!url) {
                    const s = v.querySelector('source[src]');
                    if (s) url = s.src;
                }
                if (!/^https?:/i.test(url)) return;
                if (/\.(m3u8|mpd)([?#]|$)/i.test(url)) return;
                const d = v.duration;
                if (isFinite(d) && d > maxDur) return;
                if (!(muted && loop && auto)) {
                    for (let p = v.parentElement, k = 0; p && k < 8; p = p.parentElement, k++) {
                        const cn = p.className && typeof p.className === 'object' ? p.className.baseVal : p.className;
                        const s = (cn || '') + ' ' + (p.id || '') + ' ' + (p.getAttribute('role') || '');
                        if (/player|plyr|vjs|video-js|jwplayer|mejs|lightbox|modal/i.test(s)) return;
                    }
                }
                const id = token + '-' + (n++);
                v.setAttribute(A, id);
                out.push({ id: id, url: url, loop: !!loop, auto: !!auto });
            } catch (e) { }
        });
    });
    return out;
}
function mhtVideoMime(b64, headerType, url) {
    const ht = (headerType || '').split(';')[0].trim().toLowerCase();
    if (/^video\//.test(ht)) return ht;
    let s = '';
    try { s = atob(b64.slice(0, 64)); } catch (e) { }
    if (s.slice(4, 8) === 'ftyp') return 'video/mp4';
    if (s.slice(0, 4) === '\x1A\x45\xDF\xA3') return 'video/webm';
    if (s.slice(0, 4) === 'OggS') return 'video/ogg';
    if (/\.webm([?#]|$)/i.test(url)) return 'video/webm';
    if (/\.ogv([?#]|$)/i.test(url)) return 'video/ogg';
    if (/\.(mp4|m4v|mov)([?#]|$)/i.test(url)) return 'video/mp4';
    return null;
}
async function mhtFetchVideo(url) {
    const ctl = new AbortController();
    const timer = setTimeout(function () { ctl.abort(); }, MHT_DECOR_VIDEOS_FETCH_MS);
    try {
        const r = await fetch(url, { credentials: 'omit', cache: 'force-cache', signal: ctl.signal });
        if (!r.ok) return null;
        if (r.status === 206) {
            const cr = /^bytes 0-(\d+)\/(\d+)$/.exec(r.headers.get('content-range') || '');
            if (!cr || Number(cr[1]) + 1 !== Number(cr[2])) return null;
        }
        const len = Number(r.headers.get('content-length') || 0);
        if (len > MHT_DECOR_VIDEOS_MAX_ONE) {
            ctl.abort();
            return null;
        }
        const buf = await r.arrayBuffer();
        if (!buf.byteLength || buf.byteLength > MHT_DECOR_VIDEOS_MAX_ONE) return null;
        const b64 = mhtBufToB64(buf);
        const mime = mhtVideoMime(b64, r.headers.get('content-type'), url);
        return mime ? { b64: b64, mime: mime } : null;
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}
// Marks the decorative videos of the tab and starts to download them (the result is awaited when the capture is ready)
async function mhtDecorVideosTag(tabId) {
    mhtDvList = [];
    if (!MHT_AUTO_MOTION || !MHT_DECOR_VIDEOS) return;
    try {
        const res = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtDecorVideosTagInPage, args: [MHT_DECOR_VIDEOS_MAX_DUR] });
        const list = [];
        (res || []).forEach(function (r) {
            (r.result || []).forEach(function (it) { list.push(it); });
        });
        const byUrl = new Map();
        const keep = [];
        list.forEach(function (it) {
            if (keep.length >= MHT_DECOR_VIDEOS_MAX_COUNT) return;
            if (!byUrl.has(it.url)) byUrl.set(it.url, mhtFetchVideo(it.url));
            it.p = byUrl.get(it.url);
            keep.push(it);
        });
        mhtDvList = keep;
        if (keep.length) console.log('SaveAsMHT: decorative videos found:', keep.map(function (it) { return it.url; }).join(' '));
    } catch (e) {
        console.warn('SaveAsMHT: decorative video search failed', e);
    }
}
// Changes the marked <video> start tags (and the <source> that the browser picked) of one HTML document: src becomes a data: address
function mhtDvPatchHtml(html, items) {
    let out = '';
    let pos = 0;
    let patched = 0;
    const re = /<video\b/gi;
    let m;
    const setSrc = function (tag, dataUrl) {
        return tag.replace(/(\ssrc\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/i, function (all, a) { return a + '"' + dataUrl + '"'; });
    };
    const addFlag = function (tag, name) {
        if (new RegExp('\\s' + name + '(?=[\\s=/>])', 'i').test(tag)) return tag;
        return tag.replace(/(\s*\/?>)$/, function (x) { return ' ' + name + x; });
    };
    while ((m = re.exec(html)) !== null) {
        const start = m.index;
        const end = mhtTagEnd(html, start);
        if (end < 0) break;
        let tag = html.slice(start, end + 1);
        const im = /\sdata-save-as-mht-dv="([^"]*)"/.exec(tag);
        if (!im) continue;
        tag = tag.replace(/\sdata-save-as-mht-dv="[^"]*"/, '');
        const it = items.get(im[1]);
        if (!it) {
            out += html.slice(pos, start) + tag;
            pos = end + 1;
            re.lastIndex = end + 1;
            continue;
        }
        let inner = '';
        let innerEnd = end + 1;
        if (/\ssrc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i.test(tag)) {
            tag = setSrc(tag, it.dataUrl);
        } else {
            const rc = /<\/video/gi;
            rc.lastIndex = end + 1;
            const cm = rc.exec(html);
            innerEnd = cm ? cm.index : end + 1;
            inner = html.slice(end + 1, innerEnd);
            const rs = /<source\b/gi;
            let sm;
            let firstTag = null;
            let done = false;
            let rebuilt = '';
            let ipos = 0;
            while (!done && (sm = rs.exec(inner)) !== null) {
                const se = mhtTagEnd(inner, sm.index);
                if (se < 0) break;
                const stag = inner.slice(sm.index, se + 1);
                const sv = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(stag);
                if (!sv) continue;
                const sUrl = sv[1] || sv[2] || sv[3] || '';
                if (firstTag === null) firstTag = { s: sm.index, e: se, tag: stag };
                if (mhtNormUrl(sUrl) === mhtNormUrl(it.url)) {
                    rebuilt += inner.slice(ipos, sm.index) + setSrc(stag, it.dataUrl);
                    ipos = se + 1;
                    done = true;
                }
            }
            if (!done && firstTag) {
                rebuilt += inner.slice(ipos, firstTag.s) + setSrc(firstTag.tag, it.dataUrl);
                ipos = firstTag.e + 1;
                done = true;
            }
            if (!done) {
                out += html.slice(pos, start) + tag;
                pos = end + 1;
                re.lastIndex = end + 1;
                continue;
            }
            inner = rebuilt + inner.slice(ipos);
        }
        tag = addFlag(tag, 'muted');
        tag = addFlag(tag, 'playsinline');
        if (it.auto) tag = addFlag(tag, 'autoplay');
        if (it.loop) tag = addFlag(tag, 'loop');
        out += html.slice(pos, start) + tag + inner;
        pos = innerEnd;
        re.lastIndex = innerEnd;
        patched++;
    }
    out += html.slice(pos);
    return { html: out, patched: patched };
}
// Puts the downloaded decorative videos into the saved HTML documents (as data: addresses: a page of an .mht plays a video only from there)
async function mhtEmbedDecorVideos(mhtmlText, pageUrl) {
    if (!MHT_AUTO_MOTION || !MHT_DECOR_VIDEOS || !mhtDvList.length) return mhtmlText;
    try {
        const items = new Map();
        let total = 0;
        for (let i = 0; i < mhtDvList.length; i++) {
            const it = mhtDvList[i];
            const got = await it.p;
            if (!got) continue;
            if (total + got.b64.length > MHT_DECOR_VIDEOS_MAX_TOTAL * 1.4) continue;
            total += got.b64.length;
            items.set(it.id, { url: it.url, loop: it.loop, auto: it.auto, dataUrl: 'data:' + got.mime + ';base64,' + got.b64 });
        }
        if (!items.size) return mhtmlText;
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm) return mhtmlText;
        const sep = '--' + bm[1];
        const chunks = mhtmlText.split(sep);
        let patched = 0;
        for (let i = 1; i < chunks.length; i++) {
            const c = chunks[i];
            if (c.slice(0, 2) === '--') break;
            const e = c.indexOf('\r\n\r\n');
            if (e < 0) continue;
            const raw = c.slice(0, e);
            const head = raw.replace(/\r\n[ \t]+/g, '');
            const get = function (name) {
                const hm = head.match(new RegExp('^' + name + ':[ \\t]*(.*)$', 'im'));
                return hm ? hm[1].trim() : '';
            };
            if (get('Content-Type').toLowerCase().split(';')[0].trim() !== 'text/html') continue;
            const enc = get('Content-Transfer-Encoding').toLowerCase();
            const text = mhtDecodeText({ type: 'text/html', enc: enc, loc: get('Content-Location'), body: c.slice(e + 4) });
            if (text.indexOf('data-save-as-mht-dv=') < 0) continue;
            const r = mhtDvPatchHtml(text, items);
            if (!r.patched) continue;
            const b64 = (enc === 'quoted-printable' || enc === 'base64') ? btoa(r.html) : mhtUtf8ToB64(r.html);
            const newHead = /^Content-Transfer-Encoding:/im.test(raw)
                ? raw.replace(/^Content-Transfer-Encoding:.*$/im, 'Content-Transfer-Encoding: base64')
                : raw + '\r\nContent-Transfer-Encoding: base64';
            chunks[i] = newHead + '\r\n\r\n' + (b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
            patched += r.patched;
        }
        if (!patched) return mhtmlText;
        console.log('SaveAsMHT: decorative videos embedded in the saved page:', patched);
        return chunks.join(sep);
    } catch (e) {
        console.warn('SaveAsMHT: embedding decorative videos failed', e);
        return mhtmlText;
    }
}
// === END MhtAutoMotion ===

