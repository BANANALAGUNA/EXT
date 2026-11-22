var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import './js/bg/welcome.js';
import { EventType } from './js/types.js';
import PunycodeModule from './js/_external/punycode.js';
import { UriModule, factory as UriFactory } from './js/_external/uri.js';
import FilerModule from './js/_external/filer.js';
import { default as FvdSynchronizerModule } from './js/index.js';
import BackgroundModule from './js/Background.js';
import ButtonControllerModule from './js/ButtonController.js';
import AutoSyncModule from './js/AutoSync.js';
import ContentScriptsController from './js/content-scripts/controller.js';
class SyncWorker {
    constructor() {
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            PunycodeModule(this);
            UriModule(this, UriFactory);
            FilerModule(this);
            const fvdSynchronizer = new FvdSynchronizerModule(this.addEventListener, {
                sync: true,
                mode: 0,
            });
            yield fvdSynchronizer.init();
            new AutoSyncModule(fvdSynchronizer);
            new ContentScriptsController(fvdSynchronizer);
            new ButtonControllerModule(fvdSynchronizer);
            new BackgroundModule(fvdSynchronizer);
            globalThis.fvdSynchronizer = fvdSynchronizer;
        });
    }
    addEventListener(eventType, cb) {
        if (eventType === EventType.LOAD) {
            cb();
        }
        else if (eventType === EventType.UNLOAD) {
        }
    }
}
new SyncWorker();


/* __EVERSYNC_SURVIVE_CLOSE_PATCH__ */
(function () {
  try {
    const STORAGE_KEY = '__everSyncSyncActive';
    const STORAGE_TIME_KEY = '__everSyncSyncActiveTime';
    const ALARM_NAME = '__everSyncSyncActiveAlarm';
    const OFFSCREEN_PATH = 'patch-keepalive.html';
    const RESUME_WINDOW_MS = 30 * 60 * 1000;
    const state = { main: false, driver: false, persisted: false };

    function log() {
      try {
        console.log.apply(console, ['[EverSync Survive Patch]'].concat(Array.prototype.slice.call(arguments)));
      } catch (e) {}
    }

    function storageGetState() {
      return new Promise(function (resolve) {
        try {
          if (!self.chrome || !chrome.storage || !chrome.storage.local) {
            resolve({ active: false, ts: 0 });
            return;
          }

          chrome.storage.local.get([STORAGE_KEY, STORAGE_TIME_KEY], function (v) {
            resolve({
              active: !!(v && v[STORAGE_KEY]),
              ts: (v && v[STORAGE_TIME_KEY]) || 0
            });
          });
        } catch (e) {
          resolve({ active: false, ts: 0 });
        }
      });
    }

    function storageSetActive(active) {
      return new Promise(function (resolve) {
        try {
          if (!self.chrome || !chrome.storage || !chrome.storage.local) {
            resolve();
            return;
          }

          const obj = {};
          obj[STORAGE_KEY] = !!active;
          obj[STORAGE_TIME_KEY] = Date.now();

          chrome.storage.local.set(obj, function () {
            resolve();
          });
        } catch (e) {
          resolve();
        }
      });
    }

    function createAlarm() {
      return new Promise(function (resolve) {
        try {
          if (!self.chrome || !chrome.alarms || !chrome.alarms.create) {
            resolve();
            return;
          }

          chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 }, function () {
            void chrome.runtime.lastError;
            resolve();
          });
        } catch (e) {
          resolve();
        }
      });
    }

    function clearAlarm() {
      return new Promise(function (resolve) {
        try {
          if (!self.chrome || !chrome.alarms || !chrome.alarms.clear) {
            resolve();
            return;
          }

          chrome.alarms.clear(ALARM_NAME, function () {
            void chrome.runtime.lastError;
            resolve();
          });
        } catch (e) {
          resolve();
        }
      });
    }

    async function ensureOffscreen() {
      try {
        if (!self.chrome || !chrome.offscreen || !chrome.offscreen.createDocument) {
          return;
        }

        if (chrome.offscreen.hasDocument) {
          const has = await chrome.offscreen.hasDocument();
          if (has) {
            return;
          }
        }

        await chrome.offscreen.createDocument({
          url: OFFSCREEN_PATH,
          reasons: ['WORKERS'],
          justification: 'Keep EverSync synchronization alive'
        });
      } catch (e) {
        // Not fatal: alarms and storage-resume still work.
      }
    }

    async function closeOffscreen() {
      try {
        if (!self.chrome || !chrome.offscreen || !chrome.offscreen.closeDocument) {
          return;
        }

        await chrome.offscreen.closeDocument();
      } catch (e) {
        // Ignore.
      }
    }

    async function persist() {
      const active = !!(state.main || state.driver);

      if (active === state.persisted) {
        return;
      }

      state.persisted = active;
      await storageSetActive(active);

      if (active) {
        await createAlarm();
        await ensureOffscreen();
        log('keepalive enabled');
      } else {
        await clearAlarm();
        await closeOffscreen();
        log('keepalive disabled');
      }
    }

    if (self.chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message && message.__everSyncKeepAlivePing) {
          try {
            sendResponse({ ok: true, ts: Date.now() });
          } catch (e) {}
          return false;
        }
      });
    }

    if (self.chrome && chrome.alarms && chrome.alarms.onAlarm) {
      chrome.alarms.onAlarm.addListener(function (alarm) {
        if (!alarm || alarm.name !== ALARM_NAME) {
          return;
        }

        storageGetState().then(function (stored) {
          if (!stored.active) {
            return;
          }

          if (Date.now() - stored.ts > RESUME_WINDOW_MS) {
            storageSetActive(false);
            return;
          }

          const sd = globalThis.fvdSynchronizer &&
            globalThis.fvdSynchronizer.Driver &&
            globalThis.fvdSynchronizer.Driver.Speeddial;

          if (
            sd &&
            typeof sd.isSyncNow === 'function' &&
            typeof sd.startMainSync === 'function' &&
            !sd.isSyncNow()
          ) {
            log('alarm resuming interrupted main sync');
            try {
              sd.startMainSync({ type: 'resume' }, function () {});
            } catch (e) {
              console.warn(e);
            }
          }
        });
      });
    }

    async function watchdog() {
      try {
        const sd = globalThis.fvdSynchronizer &&
          globalThis.fvdSynchronizer.Driver &&
          globalThis.fvdSynchronizer.Driver.Speeddial;

        const runtimeActive = !!(
          state.main ||
          state.driver ||
          (sd && typeof sd.isSyncNow === 'function' && sd.isSyncNow())
        );

        const stored = await storageGetState();

        if (runtimeActive) {
          if (!stored.active || (Date.now() - stored.ts > 60000)) {
            await storageSetActive(true);
          }

          state.persisted = true;
          await createAlarm();
          await ensureOffscreen();
        } else if (stored.active) {
          if (Date.now() - stored.ts > RESUME_WINDOW_MS) {
            await storageSetActive(false);
            state.persisted = false;
            await clearAlarm();
            await closeOffscreen();
          } else {
            state.persisted = true;
            await createAlarm();
            await ensureOffscreen();
          }
        } else {
          if (state.persisted) {
            state.persisted = false;
            await clearAlarm();
            await closeOffscreen();
          }
        }
      } catch (e) {
        console.warn('[EverSync Survive Patch] watchdog error', e);
      }
    }

    globalThis.__everSyncPatch = {
      setMainSyncActive: function (value) {
        state.main = !!value;
        persist();
      },
      setDriverSyncActive: function (value) {
        state.driver = !!value;
        persist();
      }
    };

    watchdog();
    setInterval(watchdog, 20000);
  } catch (e) {
    console.error('[EverSync Survive Patch] fatal', e);
  }
})();



/* __EVERSYNC_DELEGATE_LISTENER_V2__ */
(function () {
  try {
    function broadcast(obj) {
      try {
        chrome.runtime.sendMessage(obj, function () { void chrome.runtime.lastError; });
      } catch (e) {}
    }

    /* EVERSYNC_QUEUE_INFRA_V9 */
var __everSyncWaiters = [];
 globalThis.__everSyncRejectWaiters = function (err) {
   var list = __everSyncWaiters.splice(0, __everSyncWaiters.length);
   list.forEach(function (w) {
     try { chrome.runtime.sendMessage({ __everSyncDelegateState: true, method: w.method, phase: 'done', error: err }, function () { void chrome.runtime.lastError; }); } catch (e) {}
   });
 };
var __everSyncFlushTimer = null;
function __everSyncGetSD() {
  return globalThis.fvdSynchronizer && globalThis.fvdSynchronizer.Driver && globalThis.fvdSynchronizer.Driver.Speeddial;
}
function __everSyncScheduleFlush() {
  if (__everSyncFlushTimer) { return; }
  __everSyncFlushTimer = setInterval(function () {
    var sd = __everSyncGetSD();
    if (!sd) { return; }
    if (typeof sd.isSyncNow === 'function' && sd.isSyncNow()) { return; }
    clearInterval(__everSyncFlushTimer);
    __everSyncFlushTimer = null;
    __everSyncFlushWaiters();
  }, 500);
}
function __everSyncWaiterAlive(waiter, cb) {
try {
if (!waiter.docId || !chrome.runtime.getContexts) { return cb(true); }
chrome.runtime.getContexts({ documentIds: [waiter.docId] }, function (ctxs) {
void chrome.runtime.lastError;
cb(!!(ctxs && ctxs.length));
});
} catch (e) { cb(true); }
}
function __everSyncFlushWaiters() {
var sd = __everSyncGetSD();
if (!sd) { return; }
if (typeof sd.isSyncNow === 'function' && sd.isSyncNow()) { return; }
var next = __everSyncWaiters.shift();
if (!next) { return; }
__everSyncWaiterAlive(next, function (alive) {
if (!alive) {
console.log('[EverSync Delegate Patch] dropping queued request from closed page:', next.method);
__everSyncFlushWaiters();
return;
}
console.log('[EverSync Delegate Patch] starting queued request:', next.method);
var done = function (error) {
globalThis.__everSyncDelegatedMethod = null;
try { chrome.runtime.sendMessage({ __everSyncDelegateState: true, method: next.method, phase: 'done', error: error || 0 }, function () { void chrome.runtime.lastError; }); } catch (e) {}
__everSyncScheduleFlush();
};
globalThis.__everSyncDelegatedMethod = next.method;
var scb = stateCbFor(next.method);
try {
if (next.method === 'startMainSync') { sd.startMainSync(next.options || {}, done); }
else if (next.method === 'mergeLocalAndServerData') { sd.mergeLocalAndServerData(done, scb); }
else if (next.method === 'overwriteLocalData') { sd.overwriteLocalData(done, scb); }
else if (next.method === 'overwriteServerData') { sd.overwriteServerData(done, scb); }
else { done(0); }
} catch (e) {
console.error('[EverSync Delegate Patch] queued start error', e);
done(-1000);
}
if (__everSyncWaiters.length) { __everSyncScheduleFlush(); }
});
}
function stateCbFor(method) {
      return function (state, data) {
        console.log('[UI-DIAG] SW broadcast delegate', method, state); broadcast({ __everSyncDelegateState: true, method: method, state: state, data: data || null }); /* __EVERSYNC_UI_DIAG_SW2__ */
      };
    }

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || message.action !== '__eversyncRunInWorker') {
        return;
      }

      console.log('[EverSync Delegate Patch] request received:', message.method);

      var sd = globalThis.fvdSynchronizer &&
        globalThis.fvdSynchronizer.Driver &&
        globalThis.fvdSynchronizer.Driver.Speeddial;

      if (!sd) {
        sendResponse({ ok: false, reason: 'not_ready' });
        return;
      }

      if (typeof sd.isSyncNow === 'function' && sd.isSyncNow()) {
        console.log('[EverSync Delegate Patch] worker busy, sync already running');
        for (var wi = __everSyncWaiters.length - 1; wi >= 0; wi--) { if (__everSyncWaiters[wi].method === message.method) { __everSyncWaiters.splice(wi, 1); } } /* ES_QUEUE_DEDUP_V1 */
__everSyncWaiters.push({ method: message.method, options: message.options || null, docId: (sender && sender.documentId) || null }); /* ES_QUEUE_DOCID_V1 */
    __everSyncScheduleFlush();
    sendResponse({ ok: true, busy: true, queued: true });
        return;
      }

      var done = function (error) {
        globalThis.__everSyncDelegatedMethod = null; /* __EVERSYNC_DELEGATED_FLAG_CLEAR__ */
        broadcast({ __everSyncDelegateState: true, method: message.method, phase: 'done', error: error || 0 });
    __everSyncScheduleFlush();
      };
      globalThis.__everSyncDelegatedMethod = message.method; /* __EVERSYNC_DELEGATED_FLAG_SET__ */
      var scb = stateCbFor(message.method);

      try {
        if (message.method === 'startMainSync') {
          sd.startMainSync(message.options || {}, done);
        } else if (message.method === 'mergeLocalAndServerData') {
          sd.mergeLocalAndServerData(done, scb);
        } else if (message.method === 'overwriteLocalData') {
          sd.overwriteLocalData(done, scb);
        } else if (message.method === 'overwriteServerData') {
          sd.overwriteServerData(done, scb);
        } else {
          sendResponse({ ok: false, reason: 'unknown_method' });
          return;
        }
        sendResponse({ ok: true });
      } catch (e) {
        console.error('[EverSync Delegate Patch] error', e);
        sendResponse({ ok: false, reason: 'error' });
      }
      return false;
    });
  } catch (e) {
    console.error('[EverSync Delegate Patch] fatal', e);
  }
})();



/* __EVERSYNC_GET_SYNC_STATE_V2__ */
(function () {
  try {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || message.action !== '__eversyncGetSyncState') {
        return;
      }
      var sd = globalThis.fvdSynchronizer &&
        globalThis.fvdSynchronizer.Driver &&
        globalThis.fvdSynchronizer.Driver.Speeddial;
      if (!sd) {
        sendResponse({ ready: false });
        return;
      }
      var resp = {
        ready: true,
        syncing: false,
        syncType: null,
        progress: null,
        mainState: 'nosync',
        delegated: false,
        method: null,
      };
      try {
        resp.syncing = typeof sd.isSyncNow === 'function' ? !!sd.isSyncNow() : false;
        resp.syncType = typeof sd.getCurrentSyncType === 'function' ? sd.getCurrentSyncType() : null;
        resp.progress = typeof sd.getMainSyncProgress === 'function' ? sd.getMainSyncProgress() : null;
        resp.mainState = typeof sd.getMainSyncState === 'function' ? sd.getMainSyncState() : 'nosync';
        resp.method = globalThis.__everSyncDelegatedMethod || null;
        resp.delegated = !!(resp.method && resp.syncing);
      } catch (e) {}
      sendResponse(resp);
      return false;
    });
  } catch (e) {
    console.error('[EverSync Attach Patch] fatal', e);
  }
})();
/* EVERSYNC_ABORT_IN_WORKER_V3 */
(function () {
try {
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
if (!message || message.action !== '__eversyncAbortInWorker') { return; }
var sd = globalThis.fvdSynchronizer && globalThis.fvdSynchronizer.Driver && globalThis.fvdSynchronizer.Driver.Speeddial;
if (sd && typeof sd.abortCurrentSync === 'function') { try { sd.abortCurrentSync(); } catch (e) {} }
try { if (globalThis.__everSyncRejectWaiters) { globalThis.__everSyncRejectWaiters(-1002); } } catch (e) {}
try { sendResponse({ ok: true }); } catch (e) {}
return false;
});
} catch (e) {
console.error('[EverSync Abort Patch] fatal', e);
}
})();

/* EVERSYNC_PUSH_ON_CHANGE_V2 */
(function () {
  var DEBOUNCE_MS = 1500;
  var POLL_MS = 3000;
  var COOLDOWN_MS = 60000;
  var timer = null;
  var starting = false;
  var lastFail = 0;

  function log() {
    try {
      console.info.apply(console, ['[EverSync PushOnChange]'].concat(Array.prototype.slice.call(arguments)));
    } catch (e) {}
  }

  function getFS() { return globalThis.fvdSynchronizer; }
  function getSD() {
    var fs = getFS();
    return fs && fs.Driver && fs.Driver.Speeddial;
  }
  function getSync() {
    var fs = getFS();
    return fs && fs.Server && fs.Server.Sync;
  }

  function doStart(source) {
    if (starting) {
      return;
    }
    var sd = getSD();
    if (!sd) {
      return;
    }
    starting = true;
    log(source, ': calling existing sd.startMainSync(auto)');
    try {
      sd.startMainSync({ type: 'auto' }, function (err) {
        starting = false;
        if (err) {
          lastFail = Date.now();
        }
        log(source, ': startMainSync finished, error:', err);
      });
    } catch (e) {
      starting = false;
      lastFail = Date.now();
      log(source, ': startMainSync threw', e);
    }
  }

  function tryStart(source) {
    var sd = getSD();
    var sync = getSync();
    if (!sd || !sync) {
      log(source, ': not ready yet');
      return;
    }
    if (globalThis.__everSyncDelegatedMethod) {
      log(source, ': manual delegated op in progress, skip');
      return;
    }
    if (sd.isSyncNow()) {
      log(source, ': sync is running, skip');
      return;
    }
    if (!sd.hasToSyncData()) {
      log(source, ': no pending data, skip');
      return;
    }
    if (lastFail && Date.now() - lastFail < COOLDOWN_MS) {
      log(source, ': cooldown after error, skip');
      return;
    }
    sync.activityState(function (state) {
      log(source, ': activityState =', state);
      if (state !== 'logged') {
        return;
      }
      if (globalThis.__everSyncDelegatedMethod) { return; }
      if (sd.isSyncNow()) { return; }
      if (!sd.hasToSyncData()) { return; }
      doStart(source);
    });
  }

  function schedule(source) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      timer = null;
      tryStart(source);
    }, DEBOUNCE_MS);
  }

  (function installHook(tries) {
    var sync = getSync();
    if (!sync) {
      if ((tries || 0) < 60) {
        setTimeout(function () { installHook((tries || 0) + 1); }, 1000);
      }
      return;
    }
    if (sync.__everSyncPushOnChangeV2) {
      return;
    }
    sync.__everSyncPushOnChangeV2 = true;
    var orig = sync.syncStateRefresh;
    sync.syncStateRefresh = function () {
      try {
        return orig.apply(this, arguments);
      } finally {
        try {
          var sd = getSD();
          if (sd && sd.hasToSyncData() && !sd.isSyncNow()) {
            schedule('refresh');
          }
        } catch (e) {}
      }
    };
    log('hook v2 installed on syncStateRefresh');
  })(0);

  setInterval(function () {
    try {
      var sd = getSD();
      if (!sd) {
        return;
      }
      if (
        sd.hasToSyncData() &&
        !sd.isSyncNow() &&
        !globalThis.__everSyncDelegatedMethod &&
        !starting &&
        !timer
      ) {
        log('poll: pending data found while idle');
        tryStart('poll');
      }
    } catch (e) {}
  }, POLL_MS);
})();


/* EVERSYNC_SESSION_REFRESH_WORKER_V14_NO_DANGLING_LOCK */
(function () {
  try {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || message.action !== '__eversyncRefreshSessionInWorker') {
        return;
      }
      console.log('[EverSync SessionRefresh] worker refresh requested (safe, no dangling lock)');
      var fs = globalThis.fvdSynchronizer;
      if (fs && fs.Server && fs.Server.Sync && typeof fs.Server.Sync.forceNewToken === 'function') {
        var S = fs.Server.Sync;
        if (typeof S.isSyncNow === 'function' && S.isSyncNow()) {
          try { sendResponse({ ok: false, reason: 'sync_active' }); } catch (e) {}
          return false;
        }
        function finish() {
          S.forceNewToken(function (error, data) {
            console.log('[EverSync SessionRefresh] worker token refreshed, error:', error);
            try { sendResponse({ ok: !error, error: error || 0 }); } catch (e) {}
          });
        }
        try {
          if (typeof S.getToken === 'function') {
            S.getToken(null, function (token) {
              try { fs.Server.Connection.setCurrentToken(token); } catch (e) {}
              try {
                S.releaseSyncLock({}, function (releaseError) {
                  console.log('[EverSync SessionRefresh] release before refresh, code:', releaseError);
                  if (typeof S.isSyncNow === 'function' && S.isSyncNow()) {
                    try { sendResponse({ ok: false, reason: 'sync_active' }); } catch (e) {}
                    return;
                  }
                  finish();
                });
                return;
              } catch (e) {
                console.warn('[EverSync SessionRefresh] release error', e);
              }
              finish();
            });
            return true;
          }
        } catch (e) {
          console.warn('[EverSync SessionRefresh] token/release error', e);
        }
        finish();
        return true;
      }
      try { sendResponse({ ok: false, reason: 'not_ready' }); } catch (e) {}
      return false;
    });

    setTimeout(function () {
      try {
        var fs2 = globalThis.fvdSynchronizer;
        if (!fs2 || !fs2.Server || !fs2.Server.Sync) { return; }
        if (globalThis.__everSyncDelegatedMethod) { return; }
        if (typeof fs2.Server.Sync.isSyncNow === 'function' && fs2.Server.Sync.isSyncNow()) { return; }
        var S2 = fs2.Server.Sync;
        if (typeof S2.getToken === 'function' && typeof S2.releaseSyncLock === 'function') {
          S2.getToken(null, function (token) {
            try { fs2.Server.Connection.setCurrentToken(token); } catch (e) {}
            if (globalThis.__everSyncDelegatedMethod) { return; }
            if (typeof fs2.Server.Sync.isSyncNow === 'function' && fs2.Server.Sync.isSyncNow()) { return; }
            S2.releaseSyncLock({}, function (err) {
              console.log('[EverSync Startup] stale lock release result:', err);
            });
          });
        }
      } catch (e) {
        console.warn('[EverSync Startup] release error', e);
      }
    }, 8000);
  } catch (e) {
    console.error('[EverSync SessionRefresh Worker] fatal', e);
  }
})();