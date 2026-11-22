chrome.action.onClicked.addListener(function (tab) {
    saveTab(tab);
});
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        id: 'save-mht',
        title: 'Save as .mht...',
        contexts: ['all'],
    });
});
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId == 'save-mht') {
        saveTab(tab);
    }
});
async function saveTab(tab) {
    chrome.downloads.download({
        conflictAction: 'prompt',
        filename: `${sanitizeFilename(tab.title)}.mht`,
        saveAs: true,
        url: await captureTabWithLink(tab),
    });
}
// --- Source URL link: added to the page only for the capture (patch AddSourceLink) ---
async function captureTabWithLink(tab) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: injectSourceLink,
            args: [tab.url],
        });
    }
    catch (e) {
        console.warn('SaveAsMHT: could not add source link to this page', e);
    }
    try {
        
        await mhtExpandVirtualRows(tab.id); await mhtExpandSpacers(tab.id);
    await mhtFreezeHidden(tab.id);
        await mhtShadowStyles(tab.id);
        await mhtLazyThumbs(tab.id);
        await mhtKeepControlColors(tab.id); await mhtMarkNested(tab.id);
        return await mhtCaptureWithFrames(tab.id, tab.url);
    }
    finally {
        try {
            await mhtExpandSpacersCleanup(tab.id); await mhtNestCleanup(tab.id); await mhtVideoFramesCleanup(tab.id); await mhtLazyThumbsCleanup(tab.id);
            await mhtShadowStylesCleanup(tab.id);
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: removeSourceLink,
            });
        }
        catch (e) { }
    }
}
// Runs inside the page
function injectSourceLink(url) {
    const id = '__save_as_mht_source_link__';
    document.getElementById(id)?.remove();
    const a = document.createElement('a');
    a.id = id;
    a.href = url;
    a.target = '_blank';
    a.rel = 'opener';
    a.title = url;
    a.textContent = 'ORIGINAL LINK';
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
    ].join(';');
    document.documentElement.appendChild(a);
}
// Runs inside the page
function removeSourceLink() {
    document.getElementById('__save_as_mht_source_link__')?.remove();
document.querySelectorAll('[data-save-as-mht-injected]').forEach(function (el) { el.remove(); });
document.querySelectorAll('[data-save-as-mht-vl-style]').forEach(function (el) {
    const v = el.getAttribute('data-save-as-mht-vl-style') || '';
    if (v.charAt(0) === 'S') el.setAttribute('style', v.slice(1)); else el.removeAttribute('style');
    el.removeAttribute('data-save-as-mht-vl-style');
});
    const mhtCs = document.getElementById('__save_as_mht_controls_style__');
    if (mhtCs) mhtCs.remove();
    document.querySelectorAll('[data-save-as-mht-ctl]').forEach(function (el) { el.removeAttribute('data-save-as-mht-ctl'); });
    ;
    document.querySelectorAll('[data-save-as-mht-prev-style]').forEach(function (el) {
        const v = el.getAttribute('data-save-as-mht-prev-style') || '';
        if (v.charAt(0) === 'S') el.setAttribute('style', v.slice(1)); else el.removeAttribute('style');
        el.removeAttribute('data-save-as-mht-prev-style');
    });
}
function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*\x00-\x1F~]/g, '_');
}
async function captureTabToDataUrl(tabId, pageUrl) {
    const tabText = await new Promise(function (resolve, reject) {
        chrome.pageCapture.saveAsMHTML({ tabId }, function (mhtmlData) {
            return mhtmlData
                ? resolve(mhtmlData.text())
                : reject(new Error(chrome.runtime.lastError.message));
        });
    });
    const withFonts = await appendFontParts(mhtFixCidFontUrls(mhtDenestParts(tabText), pageUrl), pageUrl, tabId);
    const withImages = await mhtAppendMissingImages(withFonts, pageUrl, tabId);
    const withCookies = await appendCookiesPart(withImages, pageUrl);
    return `data:multipart/related;base64,${btoa(withCookies)}`;
}
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status != 'loading') {
        return;
    }
    setPopup(tabId, tab.url);
});
chrome.tabs.query({}).then(function (tabs) {
    tabs.forEach(function (tab) {
        setPopup(tab.id, tab.url);
    });
});
async function setPopup(tabId, url) {
    if (!/^file:\/\/\/.*\.mht(ml)?$/i.test(url)) {
        return;
    }
    const { text, popup } = (await chrome.permissions.contains({ origins: ['file:///*'] }))
        ? { text: '🛈', popup: 'mht-info.html' }
        : { text: '⚠', popup: 'file-permission.html' };
    chrome.action.setBadgeText({ tabId, text });
    chrome.action.setPopup({ tabId, popup });
}

// === MHT session cookies (patch MhtSessionCookies) ===
const MHT_COOKIES_LOCATION = 'urn:saveasmht:cookies';
function mhtUtf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}
function mhtB64ToUtf8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}
async function appendCookiesPart(mhtmlText, pageUrl) {
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
function extractSavedCookies(mhtText) {
    const m = mhtText.match(/Content-Location: urn:saveasmht:cookies\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/);
    if (!m) return null;
    try { return JSON.parse(mhtB64ToUtf8(m[1].replace(/\s+/g, ''))); } catch (e) { return null; }
}
async function restoreSavedCookies(list) {
    let ok = 0, fail = 0;
    const now = Date.now() / 1000;
    for (const c of list || []) {
        try {
            if (c.expirationDate && c.expirationDate < now) continue;
            const host = (c.domain || '').replace(/^\./, '');
            if (!host || !c.name) { fail++; continue; }
            const details = {
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
function mhtSameOrigin(a, b) {
    try { return new URL(a).origin === new URL(b).origin; } catch (e) { return false; }
}
function waitTabHttpUrl(tabId) {
    return new Promise(function (resolve) {
        const timer = setTimeout(function () { cleanup(); resolve(''); }, 15000);
        function onUpd(id, info, t) {
            const u = (t && t.url) || info.url || '';
            if (id === tabId && /^https?:/i.test(u)) { cleanup(); resolve(u); }
        }
        function cleanup() { clearTimeout(timer); chrome.tabs.onUpdated.removeListener(onUpd); }
        chrome.tabs.onUpdated.addListener(onUpd);
    });
}
const mhtRestoreBusy = new Set();
async function handleMhtLinkTab(tab) {
    if (!tab || tab.id == null || mhtRestoreBusy.has(tab.id)) return;
    let url = tab.pendingUrl || tab.url || '';
    let opener = null;
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
        let saved = null;
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
function mhtCollectImageUrlsInPage(limit) {
    const out = [];
    const seen = {};
    const t0 = Date.now();
    const add = function (u) {
        if (!u || out.length >= limit || !/^https?:/i.test(u)) return;
        const k = u.split('#')[0];
        if (seen[k]) return;
        seen[k] = 1;
        out.push(k);
    };
    // image that the browser has not picked a source for yet (never loaded): take every candidate
    const addSet = function (set) {
        if (!set) return;
        set.split(',').forEach(function (c) {
            const u = c.trim().split(/\s+/)[0];
            if (!u) return;
            try { add(new URL(u, document.baseURI).href); } catch (e) { }
        });
    };
    const urlsIn = function (v) {
        const r = [];
        if (!v || v === 'none') return r;
        const re = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)/gi;
        let m;
        while ((m = re.exec(v)) !== null) r.push(m[1] || m[2] || m[3] || '');
        return r;
    };
    const skip = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1 };
    const props = ['backgroundImage', 'borderImageSource', 'listStyleImage', 'webkitMaskImage', 'maskImage'];
    const readStyle = function (cs) {
        for (let k = 0; k < props.length; k++) {
            urlsIn(cs[props[k]]).forEach(add);
        }
    };
    const all = [];
    const mhtGatherEls = function (root) {
        root.querySelectorAll('*').forEach(function (node) {
            all.push(node);
            let sr = null;
            try {
                sr = (chrome.dom && chrome.dom.openOrClosedShadowRoot) ? chrome.dom.openOrClosedShadowRoot(node) : node.shadowRoot;
            } catch (ex) { sr = node.shadowRoot; }
            if (sr) mhtGatherEls(sr);
        });
    };
    mhtGatherEls(document);
    for (let i = 0; i < all.length && Date.now() - t0 < 4000; i++) {
        const el = all[i];
        if (skip[el.tagName] || el.getClientRects().length === 0) continue;
        if (el.tagName === 'IMG') {
            const b = el.getBoundingClientRect();
            if (b.width * b.height >= 16) {
                if (el.currentSrc) {
                    add(el.currentSrc); add(el.src); /* Chrome drops srcset in .mht, the saved <img> keeps src */
                } else {
                    add(el.src);
                    addSet(el.srcset);
                    const pic = el.parentElement;
                    if (pic && pic.tagName === 'PICTURE') {
                        pic.querySelectorAll('source').forEach(function (s) { addSet(s.srcset); });
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
function mhtImageMime(b64, headerType) {
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
async function mhtFetchImage(url) {
    const ctl = new AbortController();
    const timer = setTimeout(function () { ctl.abort(); }, 30000);
    try {
        const r = await fetch(url, { credentials: 'omit', signal: ctl.signal });
        if (!r.ok) return null;
        const buf = await r.arrayBuffer();
        if (!buf.byteLength || buf.byteLength > MHT_IMG_MAX_ONE) return null;
        const b64 = mhtBufToB64(buf);
        const mime = mhtImageMime(b64, r.headers.get('content-type'));
        return mime ? { b64: b64, mime: mime } : null;
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}
async function mhtAppendMissingImages(mhtmlText, pageUrl, tabId) {
    if (!MHT_EMBED_IMAGES) return mhtmlText;
    try {
        const info = mhtListParts(mhtmlText);
        if (!info) return mhtmlText;
        const have = new Set();
        info.parts.forEach(function (p) { if (p.loc) have.add(mhtNormUrl(p.loc).split('#')[0]); });
        const inj = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: mhtCollectImageUrlsInPage,
            args: [MHT_IMG_MAX_COUNT],
        });
        const urls = (inj && inj[0] && inj[0].result) || [];
        const todo = [];
        urls.forEach(function (u) {
            const n = mhtNormUrl(u).split('#')[0];
            if (!have.has(n) && todo.indexOf(n) < 0) todo.push(n);
        });
        if (!todo.length) return mhtmlText;
        const got = new Map();
        const res = await mhtMapLimit(todo, 6, mhtFetchImage);
        todo.forEach(function (u, i) { if (res[i]) got.set(u, res[i]); });
        const missing = todo.filter(function (u) { return !got.has(u); });
        if (missing.length) {
            try {
                const inj2 = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: mhtFetchFontsInPage,
                    args: [missing, MHT_IMG_MAX_ONE],
                });
                const list = (inj2 && inj2[0] && inj2[0].result) || [];
                list.forEach(function (it) {
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
        got.forEach(function (img, url) {
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
function mhtKeepControlColorsInPage() {
    const A = 'data-save-as-mht-ctl';
    let css = '';
    let n = 0;
    document.querySelectorAll('button, input, select, textarea').forEach(function (el) {
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

async function mhtKeepControlColors(tabId) {
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
function mhtShadowStylesInPage() {
    const MARK = 'data-save-as-mht-sr';
    const CTL = 'data-save-as-mht-sr-ctl';
    const rep = { frame: location.href, roots: 0, styles: 0, adopted: 0, controls: 0, links: 0, unreadable: 0 };
    const shadowOf = function (el) {
        try {
            if (chrome.dom && chrome.dom.openOrClosedShadowRoot) return chrome.dom.openOrClosedShadowRoot(el) || null;
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
    // leftovers of an earlier capture that did not finish
    roots.forEach(function (root) {
        root.querySelectorAll('[' + MARK + ']').forEach(function (el) { el.remove(); });
        root.querySelectorAll('[' + CTL + ']').forEach(function (el) { el.removeAttribute(CTL); });
    });
    const base = document.baseURI;
    // relative url() would resolve against the data: URL of the <link>, make them absolute
    const absUrls = function (css, from) {
        return css.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)/gi, function (m, a, b, c) {
            const raw = (a || b || c || '').trim();
            if (!raw || /^(data|https?|file|blob|about|chrome-extension):/i.test(raw) || raw.charAt(0) === '#') return m;
            try { return 'url("' + new URL(raw, from).href + '")'; } catch (e) { return m; }
        });
    };
    // text of one stylesheet, null when its rules can not be read (cross-origin <link> without CORS)
    const sheetCss = function (sheet, from, depth) {
        let rules = null;
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
    const withMedia = function (sheet, css) {
        let m = '';
        try { m = sheet.media ? sheet.media.mediaText : ''; } catch (e) { }
        return (m && m !== 'all') ? '@media ' + m + '{\n' + css + '}\n' : css;
    };
    const makeLink = function (css) {
        const bytes = new TextEncoder().encode(css);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        const l = document.createElement('link');
        l.setAttribute('rel', 'stylesheet');
        l.setAttribute('href', 'data:text/css;charset=utf-8;base64,' + btoa(bin));
        l.setAttribute(MARK, '1');
        return l;
    };
    let n = 0;
    roots.forEach(function (root) {
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
        let ad = [];
        try { ad = Array.prototype.slice.call(root.adoptedStyleSheets || []); } catch (e) { }
        ad.forEach(function (sheet) {
            if (!sheet || sheet.disabled) return;
            const t = sheetCss(sheet, base, 0);
            if (t === null) { rep.unreadable++; return; }
            css += withMedia(sheet, t);
            rep.adopted++;
        });
        // 3) text color of the controls inside a shadow tree (shadow twin of patch MhtPageState)
        if (!isDoc) {
            root.querySelectorAll('button, input, select, textarea').forEach(function (el) {
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
function mhtShadowStylesCleanupInPage() {
    const MARK = 'data-save-as-mht-sr';
    const CTL = 'data-save-as-mht-sr-ctl';
    const shadowOf = function (el) {
        try {
            if (chrome.dom && chrome.dom.openOrClosedShadowRoot) return chrome.dom.openOrClosedShadowRoot(el) || null;
        } catch (e) { }
        return el.shadowRoot || null;
    };
    const walk = function (root) {
        root.querySelectorAll('[' + MARK + ']').forEach(function (el) { el.remove(); });
        root.querySelectorAll('[' + CTL + ']').forEach(function (el) { el.removeAttribute(CTL); });
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr) walk(sr);
        }
    };
    walk(document);
}
async function mhtShadowStyles(tabId) {
    if (!MHT_SHADOW_STYLES) return;
    try {
        const res = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtShadowStylesInPage });
        console.log('SaveAsMHT: shadow styles:', JSON.stringify((res || []).map(function (r) { return r.result; }).filter(Boolean)));
    } catch (e) {
        console.warn('SaveAsMHT: copying shadow styles failed', e);
    }
}
async function mhtShadowStylesCleanup(tabId) {
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
async function mhtLazyThumbsInPage(ahead) {
    const MARK = 'data-save-as-mht-lazy';
    const CLS_MARK = 'data-save-as-mht-lazy-cls';
    const LOADED = 'ytCoreImageLoaded';
    const rep = { lazy: 0, filled: 0, failed: 0, noId: 0, farAway: 0, avatars: 0 };
    if (!/(^|\.)youtube\.com$/i.test(location.hostname)) return rep;
    const t0 = Date.now();
    const todo = [];
    const imgs = document.querySelectorAll('img.ytCoreImageHost');
    for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img.getAttribute('src') || img.getAttribute('srcset')) continue;
        if (img.getClientRects().length === 0) continue;
        if ((img.getAttribute('class') || '').indexOf('AvatarShape') >= 0) { rep.avatars++; continue; }
        const a = img.closest('a[href]');
        const href = a ? a.href : '';
        let id = '';
        let isShort = false;
        let m = /[?&]v=([\w-]{11})(?![\w-])/.exec(href);
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
    const tryLoad = function (img, url) {
        return new Promise(function (resolve) {
            let done = false;
            let timer = 0;
            const fin = function (ok) {
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
    const fill = async function (it) {
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
    const run = async function () {
        while (next < todo.length) {
            const it = todo[next++];
            try { await fill(it); } catch (e) { rep.failed++; }
        }
    };
    const workers = [];
    for (let k = 0; k < Math.min(6, todo.length); k++) workers.push(run());
    await Promise.all(workers);
    return rep;
}
// Runs inside the page: puts the thumbnails back to the state they had before the capture
function mhtLazyThumbsCleanupInPage() {
    const MARK = 'data-save-as-mht-lazy';
    const CLS_MARK = 'data-save-as-mht-lazy-cls';
    document.querySelectorAll('[' + MARK + ']').forEach(function (img) {
        // only when the site has not put its own image there in the meantime
        if (img.getAttribute('src') === img.getAttribute(MARK)) {
            img.removeAttribute('src');
            if (img.getAttribute(CLS_MARK) === '1') img.classList.remove('ytCoreImageLoaded');
        }
        img.removeAttribute(MARK);
        img.removeAttribute(CLS_MARK);
    });
}
async function mhtLazyThumbs(tabId) {
    if (!MHT_LAZY_THUMBS) return;
    try {
        const res = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: mhtLazyThumbsInPage, args: [MHT_LAZY_THUMBS_AHEAD] });
        const r = res && res[0] && res[0].result;
        if (r && (r.lazy || r.avatars)) console.log('SaveAsMHT: lazy thumbnails:', JSON.stringify(r));
    } catch (e) {
        console.warn('SaveAsMHT: loading lazy thumbnails failed', e);
    }
}
async function mhtLazyThumbsCleanup(tabId) {
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
async function mhtExpandVirtualRowsInPage(allowScroll) {
    const ROW = '[data-plane-row]';
    const KEY = 'data-plane-row';
    const INJ = 'data-save-as-mht-injected';
    const SAVED = 'data-save-as-mht-vl-style';
    const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const yOf = function (el) {
        const m = /translate(?:Y|3d)?\(\s*(?:[^,)]*,\s*)?(-?[\d.]+)px/i.exec(el.getAttribute('style') || '');
        if (m) return parseFloat(m[1]);
        const t = /(?:^|;)\s*top\s*:\s*(-?[\d.]+)px/i.exec(el.getAttribute('style') || '');
        return t ? parseFloat(t[1]) : 0;
    };
    const rowsOf = function (box) {
        return Array.prototype.filter.call(box.children, function (el) {
            return el.hasAttribute(KEY) && !el.hasAttribute(INJ);
        });
    };
    const findScroller = function (box) {
        for (let p = box.parentElement; p && p !== document.documentElement && p !== document.body; p = p.parentElement) {
            const oy = getComputedStyle(p).overflowY;
            if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
        }
        return null;
    };
    const restoreStyle = function (el) {
        const v = el.getAttribute(SAVED);
        if (v === null) return;
        if (v.charAt(0) === 'S') el.setAttribute('style', v.slice(1)); else el.removeAttribute('style');
        el.removeAttribute(SAVED);
    };
    const boxes = [];
    document.querySelectorAll(ROW).forEach(function (el) {
        if (el.parentElement && boxes.indexOf(el.parentElement) < 0) boxes.push(el.parentElement);
    });
    const report = [];
    for (let b = 0; b < boxes.length; b++) {
        const box = boxes[b];
        const info = { mountedBefore: rowsOf(box).length, mountedExpanded: 0, copied: 0, injected: 0, covered: false, scroller: false };
        report.push(info);
        const scroller = findScroller(box);
        if (!scroller) continue;
        info.scroller = true;
        const total = function () { return parseFloat(box.style.height) || box.offsetHeight || 0; };
        const covered = function () {
            let bottom = 0;
            rowsOf(box).forEach(function (el) { bottom = Math.max(bottom, yOf(el) + el.offsetHeight); });
            return bottom >= total() - 500;
        };
        const store = {};
        const snap = function (overwrite) {
            rowsOf(box).forEach(function (el) {
                const k = el.getAttribute(KEY);
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
        const present = {};
        rowsOf(box).forEach(function (el) { present[el.getAttribute(KEY)] = 1; });
        Object.keys(store).forEach(function (k) {
            if (present[k]) return;
            const node = store[k];
            node.setAttribute(INJ, '1');
            const y = yOf(node);
            let ref = null;
            const sib = Array.prototype.filter.call(box.children, function (el) { return el.hasAttribute(KEY); });
            for (let i = 0; i < sib.length; i++) {
                if (yOf(sib[i]) > y) { ref = sib[i]; break; }
            }
            box.insertBefore(node, ref);
            info.injected++;
        });
    }
    return report;
}
async function mhtExpandVirtualRows(tabId) {
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
function mhtFreezeHiddenInPage() {
    const A = 'data-save-as-mht-prev-style';
    const skip = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TITLE: 1, BASE: 1, HEAD: 1, TEMPLATE: 1, NOSCRIPT: 1, DATALIST: 1, AREA: 1, PARAM: 1, SOURCE: 1, TRACK: 1 };
    const walk = function (el) {
        for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
            if (skip[c.tagName] || c.id === '__save_as_mht_source_link__') continue;
            if (getComputedStyle(c).display === 'none') {
                const prev = c.getAttribute('style');
                c.setAttribute(A, prev === null ? 'N' : 'S' + prev);
                c.style.setProperty('display', 'none', 'important');
            } else {
                walk(c);
            }
        }
    };
    if (document.body) walk(document.body);
}
async function mhtFreezeHidden(tabId) {
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
function mhtAbsFontUrls(css, baseUrl) {
    return css.replace(/@font-face\s*\{[^}]*\}/gi, function (block) {
        return block.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)/gi, function (m, a, b, c) {
            const raw = (a || b || c || '').trim();
            if (!raw || /^(data|https?|file|blob):/i.test(raw) || raw.charAt(0) === '#') return m;
            try { return 'url("' + new URL(raw, baseUrl).href + '")'; } catch (e) { return m; }
        });
    });
}
function mhtFixCidFontUrls(mhtmlText, pageUrl) {
    try {
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm) return mhtmlText;
        const sep = '--' + bm[1];
        const chunks = mhtmlText.split(sep);
        const info = function (c) {
            const e = c.indexOf('\r\n\r\n');
            if (e < 0) return null;
            const raw = c.slice(0, e);
            const head = raw.replace(/\r\n[ \t]+/g, '');
            const get = function (name) {
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
const MHT_FONT_MAX_ONE = 15 * 1024 * 1024;
const MHT_FONT_MAX_TOTAL = 60 * 1024 * 1024;
const MHT_FONT_FORMATS = ['woff2', 'woff', 'truetype', 'opentype', 'collection', 'woff2-variations', 'woff-variations', 'truetype-variations', 'opentype-variations'];
function mhtQpDecode(s) {
    return s.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); });
}
function mhtListParts(text) {
    const bm = text.slice(0, 4096).match(/boundary="([^"]+)"/);
    if (!bm) return null;
    const chunks = text.split('--' + bm[1]);
    const parts = [];
    for (let i = 1; i < chunks.length; i++) {
        const c = chunks[i];
        if (c.slice(0, 2) === '--') break;
        const hEnd = c.indexOf('\r\n\r\n');
        if (hEnd < 0) continue;
        const head = c.slice(0, hEnd).replace(/\r\n[ \t]+/g, '');
        const get = function (name) {
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
function mhtDecodeText(part) {
    try {
        if (part.enc === 'quoted-printable') return mhtQpDecode(part.body);
        if (part.enc === 'base64') return atob(part.body.replace(/\s+/g, ''));
    } catch (e) { return ''; }
    return part.body;
}
function mhtNormUrl(u) {
    try { return new URL(u).href; } catch (e) { return u; }
}
// Adds to "out" the URL of the font that Chrome would pick for each @font-face (first supported src)
function mhtCollectFontUrls(css, baseUrl, out) {
    const faceRe = /@font-face\s*\{([^}]*)\}/gi;
    const urlRe = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\)\s*(?:format\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]+))\s*\))?/gi;
    let fm;
    while ((fm = faceRe.exec(css)) !== null) {
        const block = fm[1];
        let um;
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
function mhtBufToB64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
}
function mhtFontMime(b64) {
    let sig = '';
    try { sig = atob(b64.slice(0, 8)); } catch (e) { }
    const s4 = sig.slice(0, 4);
    if (s4 === 'wOF2') return 'font/woff2';
    if (s4 === 'wOFF') return 'font/woff';
    if (s4 === 'OTTO') return 'font/otf';
    if (s4 === 'ttcf') return 'font/collection';
    return 'font/ttf';
}
async function mhtFetchFont(url) {
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
async function mhtFetchFontsInPage(urls, maxOne) {
    const out = [];
    for (const u of urls) {
        try {
            const r = await fetch(u);
            if (!r.ok) continue;
            const buf = await r.arrayBuffer();
            if (!buf.byteLength || buf.byteLength > maxOne) continue;
            const bytes = new Uint8Array(buf);
            let bin = '';
            for (let i = 0; i < bytes.length; i += 0x8000) {
                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            }
            out.push({ url: u, b64: btoa(bin) });
        } catch (e) { }
    }
    return out;
}
async function mhtMapLimit(items, limit, fn) {
    const res = new Array(items.length);
    let next = 0;
    async function run() {
        while (next < items.length) {
            const i = next++;
            res[i] = await fn(items[i]);
        }
    }
    const workers = [];
    for (let k = 0; k < Math.min(limit, items.length); k++) workers.push(run());
    await Promise.all(workers);
    return res;
}
async function appendFontParts(mhtmlText, pageUrl, tabId) {
    try {
        const info = mhtListParts(mhtmlText);
        if (!info) return mhtmlText;
        const have = new Set();
        info.parts.forEach(function (p) { if (p.loc) have.add(mhtNormUrl(p.loc)); });
        const first = info.parts[0];
        const docUrl = first && /^https?:/i.test(first.loc) ? first.loc : (pageUrl || '');
        const found = [];
        info.parts.forEach(function (p) {
            if (p.type !== 'text/css' && p.type !== 'text/html') return;
            const text = mhtDecodeText(p);
            if (text.indexOf('@font-face') < 0) return;
            const base = /^(https?|file):/i.test(p.loc) ? p.loc : docUrl;
            mhtCollectFontUrls(text, base, found);
        });
        const todo = [];
        found.forEach(function (u) { if (!have.has(u) && todo.indexOf(u) < 0) todo.push(u); });
        if (!todo.length) return mhtmlText;
        const got = new Map();
        const res = await mhtMapLimit(todo, 6, mhtFetchFont);
        todo.forEach(function (u, i) { if (res[i]) got.set(u, res[i]); });
        const missing = todo.filter(function (u) { return !got.has(u); });
        if (missing.length && tabId != null) {
            try {
                const inj = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: mhtFetchFontsInPage,
                    args: [missing, MHT_FONT_MAX_ONE],
                });
                const list = (inj && inj[0] && inj[0].result) || [];
                list.forEach(function (it) { if (it && it.b64) got.set(it.url, it.b64); });
            } catch (e) {
                console.warn('SaveAsMHT: in-page font fetch failed', e);
            }
        }
        const pos = mhtmlText.lastIndexOf('--' + info.boundary + '--');
        if (pos < 0) return mhtmlText;
        let total = 0;
        let added = 0;
        let out = '';
        got.forEach(function (b64, url) {
            if (total + b64.length > MHT_FONT_MAX_TOTAL) return;
            total += b64.length;
            added++;
            out += '--' + info.boundary + '\r\n' +
                'Content-Type: ' + mhtFontMime(b64) + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                'Content-Location: ' + url + '\r\n\r\n' +
                b64.match(/.{1,76}/g).join('\r\n') + '\r\n';
        });
        console.log('SaveAsMHT: fonts embedded:', added, 'of', todo.length);
        return mhtmlText.slice(0, pos) + out + mhtmlText.slice(pos);
    } catch (e) {
        console.warn('SaveAsMHT: font embedding failed', e);
        return mhtmlText;
    }
}
export {};

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
function mhtMarkNestedInPage() {
    const A = 'data-save-as-mht-nest';
    const AS = 'data-save-as-mht-nest-style';
    const HTML = 'http://www.w3.org/1999/xhtml';
    const SVG = 'http://www.w3.org/2000/svg';
    const MATH = 'http://www.w3.org/1998/Math/MathML';
    const rep = { frame: location.href, button: 0, a: 0, form: 0, p: 0 };
    const shadowOf = function (el) {
        try {
            const dom = chrome.dom;
            if (dom && dom.openOrClosedShadowRoot)
                return dom.openOrClosedShadowRoot(el) || null;
        }
        catch (e) { }
        return el.shadowRoot || null;
    };
    // elements that stop the parser's search for an open element (button scope / active formatting elements)
    const SCOPE = { applet: 1, caption: 1, html: 1, table: 1, td: 1, th: 1, marquee: 1, object: 1, template: 1 };
    const SCOPE_BTN = { applet: 1, caption: 1, html: 1, table: 1, td: 1, th: 1, marquee: 1, object: 1, template: 1, button: 1 };
    const MARKERS = { applet: 1, caption: 1, object: 1, marquee: 1, template: 1, td: 1, th: 1 };
    const TPL = { template: 1 };
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
    const openAbove = function (el, name, stops) {
        for (let p = el.parentNode; p && p.nodeType === 1; p = p.parentNode) {
            const ln = p.localName;
            if (p.namespaceURI === HTML) {
                if (ln === name)
                    return p;
                if (stops[ln])
                    return null;
            }
            else if ((p.namespaceURI === SVG && (ln === 'foreignObject' || ln === 'desc' || ln === 'title')) ||
                (p.namespaceURI === MATH && (ln === 'mi' || ln === 'mo' || ln === 'mn' || ln === 'ms' || ln === 'mtext' || ln === 'annotation-xml'))) {
                return null;
            }
        }
        return null;
    };
    const mark = function (el, tag, props) {
        if (el.namespaceURI !== HTML || el.hasAttribute(A))
            return;
        const cs = getComputedStyle(el);
        let s = '';
        for (let k = 0; k < props.length; k++) {
            const v = cs.getPropertyValue(props[k]);
            if (v)
                s += props[k] + ':' + v + ';';
        }
        el.setAttribute(A, tag);
        el.setAttribute(AS, s);
        rep[tag]++;
    };
    const roots = [];
    const walk = function (root) {
        roots.push(root);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr)
                walk(sr);
        }
    };
    walk(document);
    roots.forEach(function (root) {
        // leftovers of an earlier capture that did not finish
        root.querySelectorAll('[' + A + ']').forEach(function (el) { el.removeAttribute(A); el.removeAttribute(AS); });
        root.querySelectorAll('button').forEach(function (el) {
            if (openAbove(el, 'button', SCOPE))
                mark(el, 'button', BTN_PROPS);
        });
        root.querySelectorAll('a').forEach(function (el) {
            if (el.namespaceURI === HTML && openAbove(el, 'a', MARKERS))
                mark(el, 'a', A_PROPS);
        });
        root.querySelectorAll('form').forEach(function (el) {
            if (openAbove(el, 'form', TPL))
                mark(el, 'form', FORM_PROPS);
        });
        // a block element start tag closes an open <p>: the <p> that holds such an element is renamed
        root.querySelectorAll('p').forEach(function (p) {
            if (p.namespaceURI !== HTML || !p.querySelector(BLOCKS))
                return;
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
function mhtNestCleanupInPage() {
    const A = 'data-save-as-mht-nest';
    const AS = 'data-save-as-mht-nest-style';
    const shadowOf = function (el) {
        try {
            const dom = chrome.dom;
            if (dom && dom.openOrClosedShadowRoot)
                return dom.openOrClosedShadowRoot(el) || null;
        }
        catch (e) { }
        return el.shadowRoot || null;
    };
    const walk = function (root) {
        root.querySelectorAll('[' + A + ']').forEach(function (el) { el.removeAttribute(A); el.removeAttribute(AS); });
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr)
                walk(sr);
        }
    };
    walk(document);
}
async function mhtMarkNested(tabId) {
    if (!MHT_FIX_NESTED)
        return;
    try {
        const res = await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtMarkNestedInPage });
        const list = (res || []).map(function (r) { return r.result; }).filter(function (r) { return r && (r.button || r.a || r.form || r.p); });
        if (list.length)
            console.log('SaveAsMHT: nested elements marked:', JSON.stringify(list));
    }
    catch (e) {
        console.warn('SaveAsMHT: marking nested elements failed', e);
    }
}
async function mhtNestCleanup(tabId) {
    if (!MHT_FIX_NESTED)
        return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtNestCleanupInPage });
    }
    catch (e) { }
}
// end of the start tag (the index of its ">"), quoted attribute values may contain ">"
function mhtTagEnd(s, from) {
    let q = '';
    for (let k = from; k < s.length; k++) {
        const ch = s.charAt(k);
        if (q) {
            if (ch === q)
                q = '';
        }
        else if (ch === '"' || ch === "'") {
            q = ch;
        }
        else if (ch === '>') {
            return k;
        }
    }
    return -1;
}
// <button data-save-as-mht-nest="button" data-save-as-mht-nest-style="..." ...> -> <mht-nested-button style="..." ...>
function mhtRenameNestedTag(tag, from, to) {
    const sm = /\sdata-save-as-mht-nest-style="([^"]*)"/.exec(tag);
    const snap = sm ? sm[1] : '';
    let t = tag.replace(/\sdata-save-as-mht-nest-style="[^"]*"/, '').replace(/\sdata-save-as-mht-nest="[^"]*"/, '');
    t = '<' + to + ' data-mht-nested="' + from + '"' + t.slice(1 + from.length);
    if (snap) {
        if (/\sstyle="/.test(t)) {
            t = t.replace(/(\sstyle=")/, function (m, a) { return a + snap; });
        }
        else {
            t = t.replace(/\s*\/?>$/, function (m) { return ' style="' + snap + '"' + m; });
        }
    }
    return t;
}
// Renames the marked start tags and their end tags in one HTML document (a string of bytes or characters)
function mhtDenestHtml(html) {
    const RAW = { script: 1, style: 1, textarea: 1, title: 1, xmp: 1, iframe: 1, noembed: 1, noframes: 1, noscript: 1 };
    const VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
    const n = html.length;
    const edits = [];
    const stack = [];
    let i = 0;
    while (i < n) {
        const lt = html.indexOf('<', i);
        if (lt < 0)
            break;
        const c1 = html.charAt(lt + 1);
        if (c1 === '!' || c1 === '?') {
            if (html.substr(lt, 4) === '<!--') {
                const ce = html.indexOf('-->', lt + 4);
                i = ce < 0 ? n : ce + 3;
            }
            else {
                const ge = html.indexOf('>', lt + 2);
                i = ge < 0 ? n : ge + 1;
            }
            continue;
        }
        const closing = c1 === '/';
        const nameAt = lt + (closing ? 2 : 1);
        const nm = /^[A-Za-z][^\s\/>]*/.exec(html.substr(nameAt, 64));
        if (!nm) {
            i = lt + 1;
            continue;
        }
        const name = nm[0].toLowerCase();
        const te = mhtTagEnd(html, nameAt + nm[0].length);
        if (te < 0)
            break;
        i = te + 1;
        if (closing) {
            for (let k = stack.length - 1; k >= 0; k--) {
                if (stack[k].tag !== name)
                    continue;
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
        if (!VOID[name])
            stack.push({ tag: name, to: to, s: lt, e: te + 1, t: startText });
        if (RAW[name]) {
            // the text up to the matching end tag is not markup
            const re = new RegExp('</' + name + '[\\s/>]', 'ig');
            re.lastIndex = i;
            const m = re.exec(html);
            i = m ? m.index : n;
        }
    }
    if (!edits.length)
        return { html: html, fixed: 0 };
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
function mhtDenestParts(mhtmlText) {
    if (!MHT_FIX_NESTED)
        return mhtmlText;
    try {
        const bm = mhtmlText.slice(0, 4096).match(/boundary="([^"]+)"/);
        if (!bm)
            return mhtmlText;
        const sep = '--' + bm[1];
        const chunks = mhtmlText.split(sep);
        let fixed = 0;
        for (let i = 1; i < chunks.length; i++) {
            const c = chunks[i];
            if (c.slice(0, 2) === '--')
                break;
            const e = c.indexOf('\r\n\r\n');
            if (e < 0)
                continue;
            const raw = c.slice(0, e);
            const head = raw.replace(/\r\n[ \t]+/g, '');
            const get = function (name) {
                const m = head.match(new RegExp('^' + name + ':[ \\t]*(.*)$', 'im'));
                return m ? m[1].trim() : '';
            };
            if (get('Content-Type').toLowerCase().split(';')[0].trim() !== 'text/html')
                continue;
            const enc = get('Content-Transfer-Encoding').toLowerCase();
            const text = mhtDecodeText({ type: 'text/html', enc: enc, loc: get('Content-Location'), body: c.slice(e + 4) });
            if (text.indexOf('data-save-as-mht-nest') < 0)
                continue;
            const r = mhtDenestHtml(text);
            if (!r.fixed)
                continue;
            const b64 = (enc === 'quoted-printable' || enc === 'base64') ? btoa(r.html) : mhtUtf8ToB64(r.html);
            const newHead = /^Content-Transfer-Encoding:/im.test(raw)
                ? raw.replace(/^Content-Transfer-Encoding:.*$/im, 'Content-Transfer-Encoding: base64')
                : raw + '\r\nContent-Transfer-Encoding: base64';
            chunks[i] = newHead + '\r\n\r\n' + (b64.match(/.{1,76}/g) || []).join('\r\n') + '\r\n';
            fixed += r.fixed;
        }
        if (!fixed)
            return mhtmlText;
        console.log('SaveAsMHT: nested elements renamed in the saved HTML:', fixed);
        return chunks.join(sep);
    }
    catch (e) {
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
function mhtVideoFramesInPage(quality, max) {
    const P = 'data-save-as-mht-prev-poster';
    const SA = 'data-save-as-mht-video-style';
    const rep = { frame: location.href, videos: 0, set: 0, skipped: 0 };
    const shadowOf = function (el) {
        try {
            const dom = chrome.dom;
            if (dom && dom.openOrClosedShadowRoot)
                return dom.openOrClosedShadowRoot(el) || null;
        }
        catch (e) { }
        return el.shadowRoot || null;
    };
    const roots = [];
    const walk = function (root) {
        roots.push(root);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr)
                walk(sr);
        }
    };
    walk(document);
    // true when the picture is completely black (a protected video or a video that has not started)
    const isBlack = function (src) {
        const s = document.createElement('canvas');
        s.width = 16;
        s.height = 16;
        const g = s.getContext('2d');
        if (!g)
            return false;
        g.drawImage(src, 0, 0, 16, 16);
        const d = g.getImageData(0, 0, 16, 16).data;
        for (let i = 0; i < d.length; i += 4) {
            if (d[i] > 6 || d[i + 1] > 6 || d[i + 2] > 6)
                return false;
        }
        return true;
    };
    roots.forEach(function (root) {
        // leftovers of an earlier capture that did not finish
        root.querySelectorAll('video[' + P + ']').forEach(function (v) {
            const old = v.getAttribute(P) || '';
            if (old.charAt(0) === 'S')
                v.setAttribute('poster', old.slice(1));
            else
                v.removeAttribute('poster');
            v.removeAttribute(P);
        });
        root.querySelectorAll('style[' + SA + ']').forEach(function (s) { s.remove(); });
        const before = rep.set;
        root.querySelectorAll('video').forEach(function (v) {
            rep.videos++;
            if (rep.set >= max) {
                rep.skipped++;
                return;
            }
            try {
                // a video that is hidden, or has no picture yet, has nothing to show
                if (v.readyState < 2 || !v.videoWidth || !v.videoHeight || !v.getClientRects().length) {
                    rep.skipped++;
                    return;
                }
                const c = document.createElement('canvas');
                c.width = v.videoWidth;
                c.height = v.videoHeight;
                const g = c.getContext('2d');
                if (!g) {
                    rep.skipped++;
                    return;
                }
                g.drawImage(v, 0, 0, c.width, c.height);
                const had = v.hasAttribute('poster');
                if (had && isBlack(c)) {
                    rep.skipped++;
                    return;
                }
                const url = c.toDataURL('image/jpeg', quality);
                if (!url || url.length < 200) {
                    rep.skipped++;
                    return;
                }
                v.setAttribute(P, had ? 'S' + (v.getAttribute('poster') || '') : '');
                v.setAttribute('poster', url);
                rep.set++;
            }
            catch (e) {
                // a canvas that the page may not read (video of another origin)
                rep.skipped++;
                rep.error = String((e && e.name) || e);
            }
        });
        if (rep.set > before) {
            // the browser's own controls are shown on a video when a page has no scripts: hide them where the live page shows none
            const st = document.createElement('style');
            st.setAttribute(SA, '1');
            st.textContent = 'video:not([controls])::-webkit-media-controls,video:not([controls])::-webkit-media-controls-enclosure,video:not([controls])::-webkit-media-controls-panel{display:none!important}';
            (root.nodeType === 9 ? (root.head || root.documentElement) : root).appendChild(st);
        }
    });
    return rep;
}
// Runs inside the page (in every frame): puts the old poster values back
function mhtVideoFramesCleanupInPage() {
    const P = 'data-save-as-mht-prev-poster';
    const SA = 'data-save-as-mht-video-style';
    const shadowOf = function (el) {
        try {
            const dom = chrome.dom;
            if (dom && dom.openOrClosedShadowRoot)
                return dom.openOrClosedShadowRoot(el) || null;
        }
        catch (e) { }
        return el.shadowRoot || null;
    };
    const walk = function (root) {
        root.querySelectorAll('video[' + P + ']').forEach(function (v) {
            const old = v.getAttribute(P) || '';
            if (old.charAt(0) === 'S')
                v.setAttribute('poster', old.slice(1));
            else
                v.removeAttribute('poster');
            v.removeAttribute(P);
        });
        root.querySelectorAll('style[' + SA + ']').forEach(function (s) { s.remove(); });
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const sr = shadowOf(all[i]);
            if (sr)
                walk(sr);
        }
    };
    walk(document);
}
async function mhtVideoFrames(tabId) {
    if (!MHT_VIDEO_FRAMES)
        return;
    try {
        const res = await chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: true },
            func: mhtVideoFramesInPage,
            args: [MHT_VIDEO_FRAMES_QUALITY, MHT_VIDEO_FRAMES_MAX],
        });
        const list = (res || []).map(function (r) { return r.result; }).filter(function (r) { return r && r.videos; });
        if (list.length)
            console.log('SaveAsMHT: video frames:', JSON.stringify(list));
    }
    catch (e) {
        console.warn('SaveAsMHT: video frame capture failed', e);
    }
}
async function mhtVideoFramesCleanup(tabId) {
    if (!MHT_VIDEO_FRAMES)
        return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, func: mhtVideoFramesCleanupInPage });
    }
    catch (e) { }
}
// The frames are taken as late as possible, right before the capture, so that they are as fresh as possible
async function mhtCaptureWithFrames(tabId, pageUrl) {
    await mhtVideoFrames(tabId);
    return await captureTabToDataUrl(tabId, pageUrl);
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
async function mhtExpandSpacersInPage(minPx, maxMs) {
    const KEY = '__saveAsMhtSpacers';
    const W = window;
    const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    // leftovers of an earlier capture that did not finish
    try { if (W[KEY] && W[KEY].restore) W[KEY].restore(); } catch (e) { }
    const rep = { boxes: 0, scroller: 'window', rowsBefore: 0, rowsAfter: 0, padBefore: 0, padAfter: 0, extent: 0, viewport: 0, ms: 0, mounted: false, skipped: '' };
    const se = document.scrollingElement || document.documentElement;
    const num = function (v) { const n = parseFloat(v); return isFinite(n) ? n : 0; };
    const inlinePx = function (el, prop) {
        const m = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([\\d.]+)px', 'i').exec(el.getAttribute('style') || '');
        return m ? parseFloat(m[1]) : 0;
    };
    // 1) list boxes whose inline padding is a placeholder for rows that are not mounted
    const boxes = [];
    const cand = document.querySelectorAll('[style*="padding-top"],[style*="padding-bottom"]');
    for (let i = 0; i < cand.length && boxes.length < 8; i++) {
        const el = cand[i];
        if (Math.max(inlinePx(el, 'padding-top'), inlinePx(el, 'padding-bottom')) < minPx) continue;
        if (el.childElementCount < 1 || !el.getClientRects().length) continue;
        boxes.push(el);
    }
    if (!boxes.length) { rep.skipped = 'no spacer'; return rep; }
    // a box inside its own scroll box is not driven by the window: not touched here
    const inOwnScroller = function (box) {
        for (let p = box.parentElement; p && p !== document.documentElement && p !== document.body; p = p.parentElement) {
            const oy = getComputedStyle(p).overflowY;
            if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return true;
        }
        return false;
    };
    const live = boxes.filter(function (b) { return !inOwnScroller(b); });
    if (!live.length) { rep.skipped = 'own scroller'; return rep; }
    const padOf = function (box) {
        const cs = getComputedStyle(box);
        return num(cs.paddingTop) + num(cs.paddingBottom);
    };
    const rowsNow = function () { let n = 0; live.forEach(function (b) { n += b.childElementCount; }); return n; };
    const padNow = function () { let n = 0; live.forEach(function (b) { n += padOf(b); }); return Math.round(n); };
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
    const needTop = live.some(function (b) { return inlinePx(b, 'padding-top') >= minPx; });
    // 3) the page reports a viewport as tall as the extent (and, when rows above the visible part are
    //    missing too, a scroll position at the top)
    const undo = [];
    const override = function (obj, name, getter) {
        if (!obj) return;
        let own = null;
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
    const state = { done: false, timer: 0, restore: function () { } };
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
        override(se, 'scrollTop', function () { return 0; });
    }
    // 4) wait until the site has mounted the rows (and the pictures of the rows are loaded)
    const sig = function () { return rowsNow() + ':' + padNow(); };
    const pending = function () {
        let n = 0;
        live.forEach(function (b) {
            b.querySelectorAll('img').forEach(function (im) { if (im.getAttribute('src') && !im.complete) n++; });
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
        while (Date.now() - t0 < maxMs) {
            await sleep(150);
            tick++;
            const ext = extentNow();
            if (ext + 200 > curH + 100 && ext + 200 < LIMIT) { curH = ext + 200; fire(); }
            else if (tick % 4 === 0 && same < 4) fire();
            const s = sig();
            if (s === last) same++; else { same = 0; last = s; }
            // nothing changed at all: give the site a bit more time (and two more events) before giving up
            if (same >= (last === first ? 10 : 5) && pending() === 0) break;
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
function mhtExpandSpacersCleanupInPage() {
    const s = (window)['__saveAsMhtSpacers'];
    if (s && s.restore) s.restore();
}
async function mhtExpandSpacers(tabId) {
    if (!MHT_VIRTUAL_SPACERS) return;
    try {
        const r = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: 'MAIN',
            func: mhtExpandSpacersInPage,
            args: [MHT_SPACERS_MIN_PX, MHT_SPACERS_MAX_MS],
        });
        const res = r && r[0] && r[0].result;
        if (res && res.boxes) console.log('SaveAsMHT: virtual spacers:', JSON.stringify(res));
    } catch (e) {
        console.warn('SaveAsMHT: virtual spacers expansion failed', e);
    }
}
async function mhtExpandSpacersCleanup(tabId) {
    if (!MHT_VIRTUAL_SPACERS) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId }, world: 'MAIN', func: mhtExpandSpacersCleanupInPage });
    } catch (e) { }
}
// === END MhtVirtualSpacers ===

//# sourceMappingURL=worker.js.map
