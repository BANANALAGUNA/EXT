var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Broadcaster from './js/_external/broadcaster.js';
import collectAndSendReport from './js/crashreport.js';
import { refreshIdleInterval } from './js/bg/poweroffidle.js';
import { sendEvent } from './js/bg/analytics.js';
import Sync from './js/sync/bg.js';
import UserInfoSync from './js/sync/user.js';
import HiddenCaptureQueueModule from './js/capture/hiddencapturequeue.js';
import ContextMenu from './js/bg/contextmenu.js';
import ThumbMakerModule from './js/thumbmaker/bg.js';
import runMigrations from './js/bg/v2vmigrations.js';
import SpeedDialBgModule from './js/bg/speeddiIalBgModule.js';
import { getPreviousSession } from './js/bg/sessions.js';
import StorageModuleSD from './js/storage.js';
import { Utils, _b } from './js/utils.js';
import Config from './js/config.js';
import { EventType } from './js/types.js';
import PowerOffModule from './js/poweroff.js';
import UpdateDials from './js/bg/updatedialsModule.js';
import { _ } from './js/localizer.js';
import { default as FvdSpeedDialModule } from './js/speedDialCore.js';
import Analytics from './js/bg/google-analytics.js';
import { defaultGroupGlobalIDs } from './js/constants.js';/* __FVD_LOG_GATE_V1 */
(function () {
  function __fvdLogsOn() {
    try {
      var fsd = (typeof window !== 'undefined' && window.fvdSpeedDial) ? window.fvdSpeedDial : (typeof globalThis !== 'undefined' ? globalThis.fvdSpeedDial : null);
      if (!fsd || !fsd.Prefs) { return true; }
      var v = fsd.Prefs.get('sd.create_logs');
      if (typeof v === 'undefined' || v === null || v === '') { return true; }
      return !(v === false || v === 'false' || v === '0' || v === 0);
    } catch (e) { return true; }
  }
  var __FVD_SUPPRESS = ['[THUMB SWEEP]', '[FVD DIAG]', 'thumbmaker:getimagedatapath', 'Write File', 'Write end for', 'Redundancy set', 'hiddencapture:done', 'To update preview dials count'];
  function __fvdWrapConsole(method) {
    if (!console[method]) { return; }
    var orig = console[method].bind(console);
    console[method] = function () {
      try {
        if (!__fvdLogsOn() && typeof arguments[0] === 'string') {
          for (var i = 0; i < __FVD_SUPPRESS.length; i++) {
            if (arguments[0].indexOf(__FVD_SUPPRESS[i]) !== -1) { return; }
          }
        }
      } catch (e) {}
      return orig.apply(null, arguments);
    };
  }
  __fvdWrapConsole('log');
  __fvdWrapConsole('info');
})();
/* __FVD_DIAG_GATE_V1 */
function __fvdWorkerDiagEnabled() {
try {
var fsd = globalThis.fvdSpeedDial;
if (!fsd || !fsd.Prefs) return true;
var v = fsd.Prefs.get('sd.create_logs');
if (typeof v === 'undefined' || v === null || v === '') return true;
return !(v === false || v === 'false' || v === '0' || v === 0);
} catch (e) { return true; }
}
class Worker {
    constructor() {
this.fvdSpeedDial = new FvdSpeedDialModule(this.addEventListener, { mode: "worker" });
chrome.runtime.onInstalled.addListener((details) => {
this.onInstalledDetails = details;
});
this.__fvdCoreReady = this.fvdSpeedDial.init().then(() => { /* __FVD_WORKER_ONSTARTUP_WAIT_V1__ */
this.init();
});
chrome.runtime.onStartup.addListener(() => {
(this.__fvdCoreReady || Promise.resolve()).then(() => {
this.init().then(() => {
this.refetchDials();
});
});
});
}
    init() { /* __FVD_WORKER_SINGLE_INIT_V1__ */
if (this.__fvdWorkerInitStarted) {
return Promise.resolve();
}
this.__fvdWorkerInitStarted = true;
var _a;
return __awaiter(this, void 0, void 0, function* () {
const { fvdSpeedDial } = this;
yield fvdSpeedDial.Backup.localStorageCheck();
            globalThis.fvdSpeedDial = fvdSpeedDial;
            this.storage();
            this.modules();
            this.broadcasterListener();
            this.externalListener();
            this.onInstalledListener();
            this.contextMenu();
            yield this.setUninstallURL();
            fvdSpeedDial.localStorage.setItem('just-opened', 1);
            try {
                globalThis.fvdSpeedDial = fvdSpeedDial;
            }
            catch (ex) {
                console.warn(ex);
            }
            if (((_a = this.onInstalledDetails) === null || _a === void 0 ? void 0 : _a.reason) === 'update') {
                fvdSpeedDial.Prefs.set('sd.enable_search', fvdSpeedDial.UserInfoSync.getIsSearchEnable());
            }
            this.browserAction();
        });
    }
    refetchDials() {
        const { localStorage, UpdateDialsModule, Prefs } = this.fvdSpeedDial;
        const lastRequestDate = localStorage.getItem('last-refetch');
        const currentDate = new Date();
        if (false) { // PATCH: server dials refetch disabled
            if (!lastRequestDate || isDifferentDay(new Date(lastRequestDate), currentDate)) {
                UpdateDialsModule.update();
                localStorage.setItem('last-refetch', currentDate.toString());
            }
        }
    }
    contextMenu() {
        const { fvdSpeedDial } = this;
        new ContextMenu(fvdSpeedDial);
        fvdSpeedDial.ContextMenu.init();
    }
    modules() {
        const { fvdSpeedDial } = this;
        fvdSpeedDial.Utils = Utils;
        fvdSpeedDial.SpeedDial = new SpeedDialBgModule(fvdSpeedDial);
        fvdSpeedDial.ThumbMaker = new ThumbMakerModule(fvdSpeedDial);
        fvdSpeedDial.UpdateDialsModule = new UpdateDials(fvdSpeedDial);
        fvdSpeedDial.UserInfoSync = new UserInfoSync(fvdSpeedDial);
        fvdSpeedDial.Sync = new Sync(fvdSpeedDial);
        fvdSpeedDial.PowerOff = new PowerOffModule(fvdSpeedDial);
        fvdSpeedDial.HiddenCaptureQueue = new HiddenCaptureQueueModule(fvdSpeedDial);
    }
    browserAction() {
        const { fvdSpeedDial } = this;
        const { Utils } = fvdSpeedDial;
        Utils.browserAction(fvdSpeedDial);
    }
    storage() {
        const that = this;
        const { fvdSpeedDial, onStorageConnected } = this;
        fvdSpeedDial.StorageSD = new StorageModuleSD(fvdSpeedDial);
        const { StorageSD } = fvdSpeedDial;
        StorageSD.connect(() => {
            fvdSpeedDial.ContextMenu.rebuild();
            onStorageConnected.apply(that);
        });
        StorageSD.addGroupsCallback(function () {
            fvdSpeedDial.ContextMenu.sheduleRebuild();
        });
        StorageSD.addDialsCallback(function (message) {
            if (message.action === 'remove') {
                try {
                    fvdSpeedDial.HiddenCaptureQueue.removeFromQueueById(message.data.id);
                }
                catch (ex) {
                    console.warn(ex);
                }
            }
        });
        StorageSD.addGroupsCallback((data) => {
            if (data.action === 'remove') {
                if (data.groupId === fvdSpeedDial.Prefs.get('sd.default_group')) {
                    StorageSD.groupsList(function (groups) {
                        const group = groups[0]; const newId = group ? group.id : 0;
                        fvdSpeedDial.Prefs.set('sd.default_group', newId);
                    });
                }
                else {
                    chrome.runtime.sendMessage({
                        action: 'forceRebuild',
                        resetActiveGroup: true,
                        needDisplayType: 'speeddial',
                    });
                }
            }
        });
    }
    onStorageConnected() {
        const { onInstalledDetails } = this;
        if (onInstalledDetails && onInstalledDetails.reason === 'install') {
            Utils.openSpeedDialSingle('newtab');
        }
    }
    broadcasterListener() {
        const that = this;
        const { fvdSpeedDial } = this;
        const { SpeedDial, StorageSD, ThumbMaker, Backup, HiddenCaptureQueue } = fvdSpeedDial;
        const { ThumbManager } = SpeedDial;
        let isFirstInstall = false;
        Broadcaster.onMessage.addListener(function (message, sender, sendResponse) {
            if (message.action === 'web:pp-donate-success') {
                fvdSpeedDial.localStorage.setItem('paypal-donate-state', JSON.stringify({ date: new Date().getTime() }));
            }
            else if (message.action === 'storage:connected') {
                const currentV = chrome.runtime.getManifest().version;
                const lastV = fvdSpeedDial.localStorage.getItem('__v2vmigrations_last_ver');
                if (lastV !== currentV) {
                    fvdSpeedDial.localStorage.setItem('__v2vmigrations_last_ver', chrome.runtime.getManifest().version);
                    if (isFirstInstall) {
                        return;
                    }
                    runMigrations(lastV, currentV);
                }
            }
            else if ((message.action === 'storage:fs:updatestate' && message.state === 'normal') ||
                message.action === 'finishLocalStorageRestore') {
            }
            else if (message.action === 'pref:changed') {
                fvdSpeedDial.ContextMenu.rebuild();
            }
            else if (message && message.action === 'databaseBackup:getState') {
                sendResponse(Backup.isRestoring ? 'restoring' : 'normal');
            }
            else if (message.action === 'crash') {
                collectAndSendReport(message);
            }
            else if (message.action === 'previousSession:get') {
                getPreviousSession(message.sessionId, false);
            }
            else if (message.action === 'previousSession:restore') {
                getPreviousSession(message.sessionId, true);
            }
            else if (message.action === 'first-install') {
                sendEvent('install');
            }
            else if (message.action === 'sdtab:open') {
                setTimeout(() => {
                }, 3000);
            }
            else if (message.action === 'storage:fs:getState') {
                sendResponse('normal');
            }
            /* FVD_THUMBCACHE_V1 */
else if (message.action === 'thumbmaker:getimagedatapath') {
    globalThis.__fvdThumbCache = globalThis.__fvdThumbCache || new Map();
    globalThis.__fvdThumbInFlight = globalThis.__fvdThumbInFlight || new Map();

    const __thumbKey = JSON.stringify({
        u: message.params && message.params.imgUrl,
        w: message.params && message.params.screenWidth
    });

    if (globalThis.__fvdThumbCache.has(__thumbKey)) {
        const cached = globalThis.__fvdThumbCache.get(__thumbKey);
        sendResponse({
            imgUrl: cached.imgUrl,
            size: cached.size
        });
        return true;
    }

    if (!globalThis.__fvdThumbInFlight.has(__thumbKey)) {
        globalThis.__fvdThumbInFlight.set(__thumbKey, []);
    } else {
        globalThis.__fvdThumbInFlight.get(__thumbKey).push(sendResponse);
        return true;
    }

    if (__fvdWorkerDiagEnabled()) { console.info('thumbmaker:getimagedatapath', message.params); }

    ThumbMaker.getImageDataPath(message.params, function (imgUrl, size) {
        const waiters = globalThis.__fvdThumbInFlight.get(__thumbKey) || [];
        globalThis.__fvdThumbInFlight.delete(__thumbKey);

        if (imgUrl) {
            globalThis.__fvdThumbCache.set(__thumbKey, {
                imgUrl: imgUrl,
                size: size
            });

            if (globalThis.__fvdThumbCache.size > 300) {
                const firstKey = globalThis.__fvdThumbCache.keys().next().value;
                globalThis.__fvdThumbCache.delete(firstKey);
            }
        }

        sendResponse({
            imgUrl: imgUrl,
            size: size
        });

        waiters.forEach(function (cb) {
            try {
                cb({
                    imgUrl: imgUrl,
                    size: size
                });
            } catch (e) {}
        });
    });

    return true;
}
else if (message.action === 'thumbmaker:screentab') {
                ThumbMaker.screenTab(message.params);
            }
            else if (message.action === 'sync:adddatatosync') {
                fvdSpeedDial.Sync.addDataToSync(message.params, function () {
                    if (message.wantResponse) {
                        sendResponse();
                    }
                });
                if (message.wantResponse) {
                    return true;
                }
            }
            else if (message.action === 'sync:removesyncdata') {
                fvdSpeedDial.Sync.removeSyncData(message.params, function () {
                    sendResponse();
                });
                return true;
            }
            else if (message.action === 'sync:isactive') {
                sendResponse(fvdSpeedDial.Sync.isActive());
                return true;
            }
            else if (message.action === 'sync:hasdatatosync') {
                fvdSpeedDial.Sync.hasDataToSync(message.requestId, function (has) {
                    sendResponse(has);
                });
                return true;
            }
            else if (message.action === 'sync:getaccountinfo') {
                fvdSpeedDial.Sync.getAccountInfo(function (info) {
                    sendResponse(info);
                });
                return true;
            }
            else if (message.action === 'sync:start') {
                fvdSpeedDial.Sync.startSync(message.type, message.requestId, function (state) {
                    sendResponse(state);
                });
                return true;
            }
            else if (message.action === 'sync:addonoptionsurl') {
                fvdSpeedDial.Sync.syncAddonOptionsUrl(sendResponse);
                return true;
            }
            else if (message.action === 'sync:importfinish') {
                fvdSpeedDial.Sync.importFinished();
            }
            else if (message.action === 'sync:syncaddonexists') {
                fvdSpeedDial.Sync.syncAddonExists(sendResponse);
                return true;
            }
            else if (message.action === 'hiddencapture:queue') {
                const params = message.params;
                let cb = null;
                if (params.wantResponse) {
                    cb = function (res) {
                        sendResponse(res);
                    };
                }
                if (fvdSpeedDial && typeof fvdSpeedDial.__isThumbSweepBlocked === 'function' && fvdSpeedDial.__isThumbSweepBlocked() && params && params.saveImage && params.type === 'speeddial') { console.info('[THUMB SWEEP] capture blocked during upload-only window', params && params.id); if (cb) { cb(null); return true; } } else { HiddenCaptureQueue.capture(params, cb); /* __FVD_PATCH_SWEEP_QUEUE_BLOCK__ */ }
                if (cb) {
                    return true;
                }
            }
            else if (message.action === 'hiddencapture:empty') {
                HiddenCaptureQueue.empty();
            }
            else if (message.action === 'storage:dialsCleared') {
                HiddenCaptureQueue.empty();
            }
            else if (message.action === 'deny:changed') {
            }
            else if (message.action === 'proxy:storage') {
                const startTime = new Date().getTime();
                if (message.wantResponse) {
                    message.args.push(function () {
                        const duration = (new Date().getTime() - startTime) / 1000;
                        sendResponse({
                            args: Array.prototype.slice.call(arguments),
                            receiveTime: startTime,
                            duration: duration,
                        });
                    });
                }
                let accessObj = StorageSD;
                const parts = message.method.split('.');
                const m = parts.pop();
                parts.forEach(function (part) {
                    accessObj = accessObj[part];
                });
                accessObj[m].apply(accessObj, message.args);
                if (message.wantResponse) {
                    return true;
                }
            }
            else if (message.action === 'miscDataSet' && message.name === 'sd.background') {
            }
            if (message.action === 'pref:changed' &&
                (message.name === 'poweroff.enabled' || message.name === 'poweroff.hidden')) {
                Broadcaster.sendMessage({
                    action: 'poweroff:hiddenchange',
                    isHidden: message.value,
                });
            }
            if (message.action === 'pref:changed') {
                that._prefChangeCallback(message.name, message.value);
            }
            if (message.action === 'pref:changed' && message.name === 'poweroff.idle.interval') {
                refreshIdleInterval(fvdSpeedDial);
            }
        });
    }
    externalListener() {
        chrome.runtime.onMessageExternal.addListener(function (message, sender, callback) {
            switch (message.action) {
                case 'sayHello':
                    callback('hello');
                    break;
            }
        });
    }
    onInstalledListener() {
        const { fvdSpeedDial } = this;
        const { onInstalledDetails, fvdSpeedDial: { localStorage, Utils, StorageSD }, } = this;
        if (onInstalledDetails) {
            if (onInstalledDetails.reason === 'install') {
                localStorage.setItem('installVersion', chrome.runtime.getManifest().version);
                localStorage.setItem('prefs.sd.install_time', new Date().getTime());
                Analytics.fireInstallEvent();
            }
            else if (onInstalledDetails.reason === 'update') {
                Utils.releaseNotes(fvdSpeedDial, true);
                Analytics.fireUpdateEvent();
                if (onInstalledDetails.previousVersion <= '81.8.2') {
                    StorageSD.groupIdByGlobalId(defaultGroupGlobalIDs.recommend, (_recommendId) => {
                        StorageSD.groupUpdate(_recommendId, { name: _('newtab_dial_info') });
                    });
                }
            }
        }
    }
    addEventListener(eventType, cb) {
        if (eventType === EventType.LOAD) {
            cb();
        }
        else if (eventType === EventType.UNLOAD) {
        }
    }
    refreshUrls() {
        const refreshUrls = [Config.NEWTAB_URL];
        refreshUrls.forEach(function (url) {
            chrome.tabs.query({
                url: url,
            }, function (tabs) {
                if (!tabs) {
                    return;
                }
                for (let i = 0; i < tabs.length; i++) {
                    const { id, status } = tabs[i];
                    if (status === 'loading' || typeof id === 'undefined') {
                        continue;
                    }
                    chrome.tabs.update(id, {
                        url: chrome.runtime.getURL('newtab.html'),
                    });
                }
            });
        });
    }
    _prefChangeCallback(name, value) {
        const { fvdSpeedDial: { Prefs, StorageSD }, } = this;
        if (['sd.enable_top_sites', 'sd.enable_most_visited', 'sd.enable_recently_closed'].indexOf(name) !== -1) {
            const enableSpeedDial = _b(Prefs.get('sd.enable_top_sites'));
            const enableMostVisited = _b(Prefs.get('sd.enable_most_visited'));
            const enableRecentlyClosed = _b(Prefs.get('sd.enable_recently_closed'));
            console.info({ enableSpeedDial, enableMostVisited, enableRecentlyClosed });
            const disabledItems = [];
            if (!enableSpeedDial) {
                disabledItems.push('speeddial');
            }
            if (!enableMostVisited) {
                disabledItems.push('mostvisited');
            }
            if (!enableRecentlyClosed) {
                disabledItems.push('recentlyclosed');
            }
            try {
                const [type] = Utils.arrayDiff(['speeddial', 'mostvisited', 'recentlyclosed'], disabledItems);
                if (disabledItems.indexOf(Prefs.get('sd.display_type')) !== -1) {
                    Prefs.set('sd.display_type', type);
                }
                if (disabledItems.indexOf(Prefs.get('sd.last_selected_display_type')) !== -1) {
                    Prefs.set('sd.last_selected_display_type', type);
                }
            }
            catch (ex) {
                console.warn(ex);
            }
            chrome.runtime.sendMessage({
                action: 'forceRebuild',
                needActiveTab: true,
            });
        }
        else if (name === 'sd.scrolling') {
            Prefs.set('sd.recentlyclosed_columns', 'auto');
            Prefs.set('sd.top_sites_columns', 'auto');
        }
        else if (name === 'sd.display_popular_group') {
            Utils.Async.chain([
                function (chainCallback) {
                    if (parseInt(Prefs.get('sd.default_group')) === 0) {
                        StorageSD.groupsList(function (groups) {
                            const group = groups[0]; const newId = group ? group.id : 0;
                            Prefs.set('sd.default_group', newId);
                            chainCallback();
                        });
                    }
                    else {
                        chainCallback();
                    }
                },
                function () {
                    chrome.runtime.sendMessage({
                        action: 'forceRebuild',
                        resetActiveGroup: true,
                        needDisplayType: 'speeddial',
                    });
                },
            ]);
        }
    }
    setUninstallURL() {
        return __awaiter(this, void 0, void 0, function* () {
            const { fvdSpeedDial: { Prefs, localStorage }, } = this;
            if (chrome.runtime.hasOwnProperty('setUninstallURL')) {
                const clientId = yield (Analytics === null || Analytics === void 0 ? void 0 : Analytics.getOrCreateClientId());
                const uninstallURL = Config.UNINSTALL_URL +
                    '?client=sd_chrome' +
                    '&version=' +
                    chrome.runtime.getManifest().version +
                    '&version_install=' +
                    localStorage.getItem('installVersion') +
                    '&start=' +
                    localStorage.getItem('prefs.sd.install_time') +
                    '&end=' +
                    Date.now() +
                    '&provider=' +
                    encodeURIComponent(Prefs.get('sd.search_provider') || 'fvd') +
                    '&user_id=' +
                    clientId;
                chrome.runtime.setUninstallURL(uninstallURL);
            }
            else {
                console.info('set uninstall url is not available');
            }
        });
    }
}
function isDifferentDay(date1, date2) {
    return (date1.getFullYear() !== date2.getFullYear() ||
        date1.getMonth() !== date2.getMonth() ||
        date1.getDate() !== date2.getDate());
}
/* __FVD_DEFAULT_PREFS_APPLY_V1 */
(function applyDefaultPrefsOnFreshInstall() {
function tryApply(tries) {
var fsd = globalThis.fvdSpeedDial;
if (!fsd || !fsd.Prefs || !fsd.localStorage) {
if ((tries || 0) < 60) { setTimeout(function () { tryApply((tries || 0) + 1); }, 1000); }
return;
}
if (fsd.localStorage.getItem('__fvdDefaultPrefsApplied')) { return; }
fetch(chrome.runtime.getURL('fvd_default_prefs.json'), { cache: 'no-store' })
.then(function (r) { if (!r.ok) { throw new Error('no defaults file'); } return r.json(); })
.then(function (data) {
if (!data || !data.prefs) { return; }
var keys = Object.keys(data.prefs);
keys.forEach(function (k) {
try { fsd.Prefs.set(k, data.prefs[k]); } catch (e) {}
});
/* __FVD_SEARCH_RESTORE_GUARD_V1 */
if (Object.prototype.hasOwnProperty.call(data.prefs, 'sd.enable_search')) {
var __rb = !!data.prefs['sd.enable_search'];
try { fsd.Prefs.set('sd.enable_search_user_set', true); } catch (e) {}
try {
var __cfgKey = 'sync.user-config__search-enable';
var __cfg = fsd.localStorage.getItem(__cfgKey);
if (__cfg && typeof __cfg === 'object') {
var __fix = false;
Object.keys(__cfg).forEach(function (uid) {
if (!!__cfg[uid] !== __rb) { __cfg[uid] = __rb; __fix = true; }
});
if (__fix) { fsd.localStorage.setItem(__cfgKey, __cfg); }
}
} catch (e) {}
try { if (fsd.UserInfoSync) { fsd.UserInfoSync.isSearchEnable = __rb; } } catch (e) {}
}
fsd.localStorage.setItem('__fvdDefaultPrefsApplied', '1');
console.info('[FVD DEFAULT PREFS] applied from fvd_default_prefs.json, keys:', keys.length);
})
.catch(function () {
try { fsd.localStorage.setItem('__fvdDefaultPrefsApplied', '1'); } catch (e) {}
});
}
tryApply(0);
})();
/* __FVD_SYNC_STATE_QUERY_V1 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	try {
		if (message && message.action === 'fvd:syncStateQuery') {
			var fsd = globalThis.fvdSpeedDial;
			var inProgress = !!(fsd && fsd.Sync && typeof fsd.Sync.isSyncInProgress === 'function' && fsd.Sync.isSyncInProgress());
			sendResponse({ inProgress: inProgress });
		}
	} catch (e) {}
});
new Worker();
