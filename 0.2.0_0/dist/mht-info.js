const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
const res = await fetch(tabs[0].url, { headers: { Range: 'bytes=0-16384' } });
const mhtText = await res.text();
function getMimeHeader(headerName) {
    return mhtText.match(new RegExp(`^${headerName}: (.*?)\r?\n[^ ]`, 'ms'))?.[1];
}
const originalLink = document.getElementById('original-link');
originalLink.title = originalLink.href = getMimeHeader('Content-Location');
originalLink.textContent = mimeDecode(getMimeHeader('Subject'));
function mimeDecode(mimeText) {
    return decodeURIComponent(mimeText
        .replace(/\r?\n /g, '')
        .replace(/=\?utf-8\?Q\?(.*?)\?=/g, function (_, mimeWord) {
        return mimeWord.replace(/=/g, '%');
    }));
}
const originalDate = document.getElementById('original-date');
originalDate.textContent = new Date(getMimeHeader('Date')).toLocaleString();
export {};
//# sourceMappingURL=mht-info.js.map