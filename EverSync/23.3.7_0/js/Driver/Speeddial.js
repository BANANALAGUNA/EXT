import { EventType } from '../types.js';
import { _r, _b, _isb } from '../Utils.js';
import { _ } from '../Localizer.js';

const DriverSpeeddialModule = function (fvdSynchronizer) {
  var Errors = fvdSynchronizer.Errors;

  const Speeddial = function (fvdSynchronizer) {
    var UPLOAD_PREVIEW_FILENAME = 'preview.png';

    var _debugLogBuffer = [];
    var _debugLogFlushTimer = null;

    function debugLog() {
      var args = Array.prototype.slice.call(arguments);

      var line =
        new Date().toISOString() +
        ' ' +
        args
          .map(function (a) {
            try {
              return typeof a === 'string' ? a : JSON.stringify(a);
            } catch (ex) {
              return String(a);
            }
          })
          .join(' ');

      console.info.apply(console, ['[SYNC DEBUG]'].concat(args));

      _debugLogBuffer.push(line);

      if (_debugLogBuffer.length > 1000) {
        _debugLogBuffer = _debugLogBuffer.slice(-1000);
      }

      if (!_debugLogFlushTimer) {
        _debugLogFlushTimer = setTimeout(function () {
          _debugLogFlushTimer = null;

          try {
            chrome.storage.local.set({
              syncDebugLog: _debugLogBuffer,
            });
          } catch (e) {}
        }, 500);
      }
    }

    var changeMainSyncStateListeners = [];

    var fvdSpeedDialName =
      'Speed Dial [FVD] - New Tab Page, 3D, Sync...';
    var fvdSpeedDialId = 'llaficoajjainaijghjlofdfmbjpebpa';

    var isSyncNow = false;
    var port = null;
    var allow = false;

    var apiVersion = 0;
    var abortCurrentSync = false;

    var currentSyncType;
    var currentSyncId;

    var self = this;

    var _initToSyncData = {
      dials: [],
      groups: [],
      newDials: [],
      newGroups: [],
      deleteDials: [],
      deleteGroups: [],
      specialActions: [],
    };

    var _pendingSDRequests = [];

    const PENDING_REQUESTS_TIMEOUT = 1000 * 5 * 60;

    var mainSyncState = 'nosync';
    var mainSyncProgress = {};
      // __EVERSYNC_UI_DIAG_PAGE__
   if (typeof window === 'object') {
     chrome.runtime.onMessage.addListener(function (msg) {
       if (!msg) { return; }
       if (msg.__everSyncWorkerState) {
         console.log('[UI-DIAG] page got workerState', msg.mainState, msg.progress && msg.progress.state);
       } else if (msg.__everSyncDelegateState) {
         console.log('[UI-DIAG] page got delegate', msg.method, msg.phase || msg.state, msg.error);
       }
     });
   }
      self.attachSyncUI = function (m, cb, scb) { __eversyncRegisterUI(m, cb, scb); };
/* EVERSYNC_LOCK_ALERT_FOR_ATTACH_V7 */
if (typeof window === 'object') {
chrome.runtime.onMessage.addListener(function (msg) {
if (!msg || msg.subject !== 'syncError') { return; }
try {
if (msg.error === fvdSynchronizer.Errors.ERROR_ALREADY_LOCKED && document.querySelector('[data-es-attach] .syncProgressDialog')) {
fvdSynchronizer.Dialogs.alert(_('popup_alert_sync_already_active_title'), _('popup_alert_sync_already_active'));
}
} catch (e) {}
});
}
   // __EVERSYNC_PATCH_ATTACH_API__
   // __EVERSYNC_PATCH_PAGE_STATE_BRIDGE__
   var __eversyncUIPending = {};
   function __eversyncRegisterUI(method, cb, scb) {
     if (cb || scb) { __eversyncUIPending[method] = { callback: cb, stateCallback: scb }; }
     else { delete __eversyncUIPending[method]; }
   }
   if (typeof window === 'object') {
     chrome.runtime.onMessage.addListener(function (msg) {
       if (!msg) { return; }
       if (msg.__everSyncWorkerState) {
         if (msg.mainState) { mainSyncState = msg.mainState; }
         if (msg.progress) { mainSyncProgress = msg.progress; }
         callChangeMainSyncStateListeners();
         return;
       }
       if (msg.__everSyncDelegateState) {
         var entry = __eversyncUIPending[msg.method];
         if (!entry) { return; }
         if (msg.phase === 'done') {
           delete __eversyncUIPending[msg.method];
           if (typeof entry.callback === 'function') { try { entry.callback(msg.error || 0); } catch (e) {} }
         } else if (typeof entry.stateCallback === 'function') {
           try { entry.stateCallback(msg.state, msg.data); } catch (e) {}
         }
       }
     });
   }

    this.ignoreSyncProgress = false;

    this.displayQuotaExceedMessage = function (countItemsToSave) {
      fvdSynchronizer.Dialogs.typedWindow('syncQuotaExceed', {
        query: {
          count: countItemsToSave,
          category: 'dials_count',
        },
      });
    };

    this.addChangeMainSyncStateListener = function (callback) {
      changeMainSyncStateListeners.push(callback);
    };

    this.getMainSyncState = function () {
      return mainSyncState;
    };

    this.getMainSyncProgress = function () {
      return mainSyncProgress;
    };
  this.getCurrentSyncType = function () {
    return currentSyncType;
  };
  // __EVERSYNC_PATCH_CURRENT_SYNC_TYPE__

    this.onLogin = function (userInfo) {
      messageToSD({
        action: 'sync:login',
        data: {
          user: userInfo,
        },
      });
    };

    this.onLogout = function () {
      fvdSynchronizer.Prefs.set('userInfo', null);
      messageToSD({
        action: 'sync:logout',
      });
    };

    this.startAutoSync = function (params, callback) {
      if (isSyncNow) {
        callback(fvdSynchronizer.Errors.ERROR_DRIVER_BUSY);
        return;
      }

      this.ignoreSyncProgress = true;

      fvdSynchronizer.Utils.Async.chain([
        function (next) {
          self.isAllowed(function (allowed) {
            if (allowed || port) {
              next();
            } else {
              callback(fvdSynchronizer.Errors.ERROR_NEED_ADDITIONAL_SOFTWARE);
            }
          });
        },
        function () {
          self.startMainSync(
            {
              type: 'auto',
            },
            function (error) {
              self.ignoreSyncProgress = false;
              callback(error);
            }
          );
        },
      ]);
    };

    this.startMainSync = function (options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      options = options || {};
      options.type = options.type || 'main';
   // __EVERSYNC_PATCH_DELEGATE_MAIN_V2__
   if (typeof window === 'object' && !self.__eversyncNoDelegateMain) {
     var __delOkMain = true;
     try {
       __eversyncRegisterUI('startMainSync', callback, null);
       chrome.runtime.sendMessage({ action: '__eversyncRunInWorker', method: 'startMainSync', options: { type: options.type } }, function (resp) {
         if (chrome.runtime.lastError || !resp || !resp.ok) {
           __eversyncRegisterUI('startMainSync', null, null);
           self.__eversyncNoDelegateMain = true;
           try { self.startMainSync(options, callback); } finally { self.__eversyncNoDelegateMain = false; }
         }
       });
     } catch (e) { __delOkMain = false; }
     if (__delOkMain) { return; }
   }

      trackSync(options.type);

      callback = callback || function () {};

      var keepAliveInterval = setInterval(function () {
        debugLog('keepalive ping');
        messageToSD({
          action: 'ping',
        });
      }, 15000);

      var callbackCalled = false;
      var originalCallback = callback;

      callback = function (error) {
        if (callbackCalled) {
          return;
        }

        callbackCalled = true;

        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        debugLog('startMainSync finished, error:', error);

        originalCallback(error);
      };

      function nullMainSyncProgress() {
        mainSyncProgress = {
          action: 'upload_changes',
          state: '',
          successStates: [],
          dialsCount: 0,
          groupsCount: 0,
          specialActionsCount: 0,
          specialActionsCurrent: 0,
        };
      }

      nullMainSyncProgress();
      setMainSyncState('sync');

      debugLog('startMainSync begin, type:', options.type);

      acquireSyncLock(function (error) {
        debugLog('acquireSyncLock result, error code:', error);

        if (error !== 0) {
          try { chrome.runtime.sendMessage({ subject: 'syncError', error: error }, function () { void chrome.runtime.lastError; }); } catch (e) {} /* __EVERSYNC_PATCH_SYNCERROR_ALWAYS__ */

          setMainSyncState('nosync');
          callback(error);
        } else {
          var syncError = 0;
          var transId = 0;
          var hasUpdates = false;

          var fvdSpeedDialLastUpdateTime = {
            dials: 1,
            groups: 1,
          };

          var toSyncData = getToSyncData();
          var specialActions = toSyncData.specialActions;

          fvdSynchronizer.Utils.Async.chain([
            function (chainCallback) {
              startTransaction(function (id) {
                transId = id;
                chainCallback();
              });
            },
            function (chainCallback) {
              getSyncDialsAndGroupsLastUpdateTime(function (result) {
                if(result){fvdSpeedDialLastUpdateTime=result;}else{fvdSpeedDialLastUpdateTime={dials:getDialsLastUpdateTime()||1,groups:getGroupsLastUpdateTime()||1};}chainCallback();
              });
            },
            function (chainCallback) {
              nullMainSyncProgress(); /* EVERSYNC_FAST_FIRST_SYNC_V1 */
           var __esFirstSyncAfter = fvdSynchronizer.Prefs.get('speeddial.first_sync_after');
           var __esFastFirstSyncDisabled = _b(fvdSynchronizer.Prefs.get('speeddial.disable_fast_first_sync'));
           var __esFastFirstSync = (!__esFastFirstSyncDisabled && !options.forceMerge && __esFirstSyncAfter !== 'none' && (__esFirstSyncAfter === 'login' || !__esFirstSyncAfter) && options.type === 'auto');
           if (__esFastFirstSync) { try { console.log('[EverSync FastFirstSync] initial auto sync fast path, previous first_sync_after:', __esFirstSyncAfter); } catch (e) {} fvdSynchronizer.Prefs.set('speeddial.first_sync_after', 'none'); __esFirstSyncAfter = 'none'; }
           if (__esFirstSyncAfter !== 'none') {
                mainSyncProgress.action = 'upload_changes';

                fvdSynchronizer.Driver.Speeddial.mergeLocalAndServerData(
                  function (error) {
                    setMainSyncState('nosync');

                    fvdSynchronizer.Prefs.set(
                      'speeddial.first_sync_after',
                      'none'
                    );

                    if (error) {
                      syncError = error;
                    }

                    chainCallback();
                  },
                  function (state, progress) {
                    fvdSynchronizer.Utils.objectsMerge(
                      mainSyncProgress,
                      progress
                    );

                    if (mainSyncProgress.state) {
                      mainSyncProgress.successStates.push(
                        mainSyncProgress.state
                      );
                    }

                    mainSyncProgress.state = state;

                    setMainSyncState('sync');
                  }
                );
              } else {
                mainSyncProgress.action = 'upload_changes';

                fvdSynchronizer.Driver.Speeddial.hasUpdates(function (
                  error,
                  has,
                  updateInfo
                ) {
                  if (error) {
                    syncError = error;
                  }

                  hasUpdates = has;

                  fvdSynchronizer.Utils.Async.chain([
                    function (chainCallback) {
                      if (syncError) {
                        return chainCallback();
                      }

                      nullMainSyncProgress();

                      mainSyncProgress.action = 'download_changes';

                      setMainSyncState('sync');

                      mainSyncProgress.successStates = [];
                      mainSyncProgress.dialsCount=0;mainSyncProgress.groupsCount=0; /* EVERSYNC_FAST_FIRST_SYNC_GATE_V1 */
if(!_b(fvdSynchronizer.Prefs.get('speeddial.full_sync_done'))){
if(_b(fvdSynchronizer.Prefs.get('speeddial.disable_fast_first_sync'))){console.log('[EverSync FullGate] fast baseline disabled - old skip');chainCallback();return;}
try{console.log('[EverSync FastFirstSync] FullGate baseline adoption: marking full sync done and using server lastUpdateTime as baseline');}catch(e){}
try{
var __esBaselineDials=(updateInfo&&updateInfo.lastUpdateTimeDials)?updateInfo.lastUpdateTimeDials:Date.now();
var __esBaselineGroups=(updateInfo&&updateInfo.lastUpdateTimeGroups)?updateInfo.lastUpdateTimeGroups:Date.now();
setDialsLastUpdateTime(__esBaselineDials);
setGroupsLastUpdateTime(__esBaselineGroups);
fvdSynchronizer.Prefs.set('speeddial.first_sync_after','none');
fvdSynchronizer.Prefs.set('speeddial.full_sync_done',true);
messageToSD({action:'localStorage.set',data:{key:'syncLastUpdateTime',value:{dials:getDialsLastUpdateTime()||1,groups:getGroupsLastUpdateTime()||1}}});
}catch(e){try{console.warn('[EverSync FastFirstSync] baseline error',e);}catch(e2){}}
chainCallback();return;}self.applyServerUpdates(fvdSpeedDialLastUpdateTime.groups,fvdSpeedDialLastUpdateTime.dials,
                        function (error) {
                          if (error) {
                            syncError = error;
                          }

                          if (error === 0) {
                            messageToSD({
                              action: 'localStorage.set',
                              data: {
                                key: 'syncLastUpdateTime',
                                value: {
                                  dials: getDialsLastUpdateTime() || 1,
                                  groups: getGroupsLastUpdateTime() || 1,
                                },
                              },
                            });
                          }

                          chainCallback();
                        },
                        function (state, progress) {
                          fvdSynchronizer.Utils.objectsMerge(
                            mainSyncProgress,
                            progress
                          );

                          if (mainSyncProgress.state) {
                            mainSyncProgress.successStates.push(
                              mainSyncProgress.state
                            );
                          }

                          mainSyncProgress.state = state;

                          setMainSyncState('sync');
                        }
                      );
                    },
                    function () {
                      toSyncData = getToSyncData();

                      self.uploadUpdates(
                        function (error, _result) {
                          _result = _result || {}; if (error === 0) { try { messageToSD({ action: "localStorage.set", data: { key: "syncLastUpdateTime", value: { dials: getDialsLastUpdateTime() || 1, groups: getGroupsLastUpdateTime() || 1 } } }); } catch (e) {} } /* EVERSYNC_SELF_CLOBBER_FIX_V3 */

                          if (error) {
                            if (
                              error ==
                              fvdSynchronizer.Errors
                                .ERROR_COUNT_ITEMS_QUOTA_EXCEED
                            ) {
                              self.displayQuotaExceedMessage(_result.count);
                            }
                          }

                          if (has && error === 0) {
                            releaseSyncLock(function () {
                              setMainSyncState('nosync');
                            });

                            chainCallback();
                          } else {
                            releaseSyncLock(function () {
                              setMainSyncState('nosync');
                            });

                            if (error) {
                              syncError = error;
                            }

                            chainCallback();
                          }
                        },
                        function (state, progress) {
                          fvdSynchronizer.Utils.objectsMerge(
                            mainSyncProgress,
                            progress
                          );

                          if (mainSyncProgress.state) {
                            mainSyncProgress.successStates.push(
                              mainSyncProgress.state
                            );
                          }

                          mainSyncProgress.state = state;

                          setMainSyncState('sync');
                        }
                      );
                    },
                  ]);
                });
              }
            },
            function (chainCallback) {
              mainSyncProgress.action = 'special_actions';
              mainSyncProgress.specialActionsCount = specialActions.length;

              fvdSynchronizer.Utils.Async.arrayProcess(
                specialActions,
                function (specialAction, arrayProcessCallback) {
                  nullMainSyncProgress();

                  mainSyncProgress.specialActionsCurrent++;

                  if (specialAction.indexOf('merge_group') == 0) {
                    hasUpdates = true;

                    var params = specialAction.split(':');
                    var groupId = params[1];
                    var groupGlobalId = params[2];

                    mergeLocalAndServerData(
                      {
                        groupId: groupId,
                        groupGlobalId: groupGlobalId,
                      },
                      function (error) {
                        setMainSyncState('nosync');

                        if (error) {
                          syncError = error;
                        }

                        arrayProcessCallback();
                      },
                      function (state, progress) {
                        fvdSynchronizer.Utils.objectsMerge(
                          mainSyncProgress,
                          progress
                        );

                        mainSyncProgress.groupsCount = 1;

                        if (mainSyncProgress.state) {
                          mainSyncProgress.successStates.push(
                            mainSyncProgress.state
                          );
                        }

                        mainSyncProgress.state = state;

                        setMainSyncState('sync');
                      }
                    );
                  } else {
                    arrayProcessCallback();
                  }
                },
                function () {
                  chainCallback();
                }
              );
            },
            function (chainCallback) {
              if (syncError != 0) {
                rollbackTransaction(transId, chainCallback);
              } else {
                clearToSyncData();
                commitTransaction(transId, chainCallback);
              }
            },
            function () {
              if (hasUpdates) {
                messageToSD({
                  action: 'rebuild',
                });
              }

              callback(syncError);
            },
          ]);
        }
      });
    };

    this.setFirstSyncAfter = function (after) {
      fvdSynchronizer.Prefs.set('speeddial.first_sync_after', after);
    };

    this.getFirstSyncAfter = function () {
      return fvdSynchronizer.Prefs.get('speeddial.first_sync_after');
    };

    this.isAllowed = function (cb) {
      return cb(allow);
    };

    this.abortCurrentSync = function () {
abortCurrentSync = true;
if (typeof window === 'object') {
try { chrome.runtime.sendMessage({ action: '__eversyncAbortInWorker' }, function () { void chrome.runtime.lastError; }); } catch (e) {}
}
    };

    this.gMessageToSD = function (message, callback) {
      messageToSD(message, callback);
    };

    this.mergeLocalAndServerData = function (callback, stateCallback) {
      trackSync('merge');
   // __EVERSYNC_PATCH_DELEGATE_MERGE_V2__
   if (typeof window === 'object' && !self.__eversyncNoDelegateMerge) {
     var __delOkMerge = true;
     try {
       __eversyncRegisterUI('mergeLocalAndServerData', callback, stateCallback);
       chrome.runtime.sendMessage({ action: '__eversyncRunInWorker', method: 'mergeLocalAndServerData' }, function (resp) {
         if (chrome.runtime.lastError || !resp || !resp.ok) {
           __eversyncRegisterUI('mergeLocalAndServerData', null, null);
           self.__eversyncNoDelegateMerge = true;
           try { self.mergeLocalAndServerData(callback, stateCallback); } finally { self.__eversyncNoDelegateMerge = false; }
         }
       });
     } catch (e) { __delOkMerge = false; }
     if (__delOkMerge) { return; }
   }

      var keepAliveInterval = startSyncKeepAlive();
      var callbackCalled = false;
      var originalCallback = callback || function () {};

      callback = function (error) {
        if (callbackCalled) {
          return;
        }

        callbackCalled = true;

        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        originalCallback(error);
      };

      acquireSyncLockCallback(callback, function () {
        abortCurrentSync = false;
        clearToSyncData();
        startSync();

        startTransaction(function (transId) {
          mergeLocalAndServerData(
            {},
            function (error, _result) {
              _result = _result || {};

              endSync();

              if (error) {
                if (
                  error ==
                  fvdSynchronizer.Errors.ERROR_COUNT_ITEMS_QUOTA_EXCEED
                ) {
                  self.displayQuotaExceedMessage(_result.count);
                }
              }

              fvdSynchronizer.Utils.Async.chain([
                function (chainCallback) {
                  if (error == 0) {
                    commitTransaction(transId, chainCallback);

                    fvdSynchronizer.Prefs.set(
                      'speeddial.first_sync_after',
                      'none'
                    );
                  } else {
                    rollbackTransaction(transId, chainCallback);
                  }
                },
                function () {
                  messageToSD({
                    action: 'rebuild',
                  });

                  releaseSyncLock(function () {
                    callback(error);
                  });
                },
              ]);
            },
            stateCallback
          );
        });
      });
    };

    this.overwriteLocalData = function (callback, stateCallback) {
      trackSync('overwrite-local');
   // __EVERSYNC_PATCH_DELEGATE_OVERLOCAL_V2__
   if (typeof window === 'object' && !self.__eversyncNoDelegateOverLocal) {
     var __delOkOverLocal = true;
     try {
       __eversyncRegisterUI('overwriteLocalData', callback, stateCallback);
       chrome.runtime.sendMessage({ action: '__eversyncRunInWorker', method: 'overwriteLocalData' }, function (resp) {
         if (chrome.runtime.lastError || !resp || !resp.ok) {
           __eversyncRegisterUI('overwriteLocalData', null, null);
           self.__eversyncNoDelegateOverLocal = true;
           try { self.overwriteLocalData(callback, stateCallback); } finally { self.__eversyncNoDelegateOverLocal = false; }
         }
       });
     } catch (e) { __delOkOverLocal = false; }
     if (__delOkOverLocal) { return; }
   }

      var keepAliveInterval = startSyncKeepAlive();
      var callbackCalled = false;
      var originalCallback = callback || function () {};

      callback = function (error) {
        if (callbackCalled) {
          return;
        }

        callbackCalled = true;

        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        originalCallback(error);
      };

      acquireSyncLockCallback(callback, function () {
        clearToSyncData();
        abortCurrentSync = false;
        startSync();

        var transId = 0;
        var syncError = 0;

        fvdSynchronizer.Utils.Async.chain([
          function (chainCallback) {
            startTransaction(function (id) {
              transId = id;
              chainCallback();
            });
          },
          function (chainCallback) {
            messageToSD(
              {
                action: 'clearGroupsAndDials',
              },
              function () {
                chainCallback();
              }
            );
          },
          function (chainCallback) {
            mergeLocalAndServerData(
              {},
              function (error) {
                endSync();

                syncError = error;

                chainCallback();
              },
              stateCallback
            );
          },
          function (chainCallback) {
            if (syncError == 0) {
              commitTransaction(transId, chainCallback);

              fvdSynchronizer.Prefs.set(
                'speeddial.first_sync_after',
                'none'
              );
            } else {
              rollbackTransaction(transId, chainCallback);
            }
          },
          function () {
            messageToSD({
              action: 'rebuild',
            });

            if (syncError == 0) {
              fvdSynchronizer.Driver.Speeddial.Backup.setHasChanges();
            }

            releaseSyncLock(function () {
              callback(syncError);
            });
          },
        ]);
      });
    };

    this.overwriteServerData = function (callback, stateCallback) {
      trackSync('overwrite-server');
   // __EVERSYNC_PATCH_DELEGATE_OVERSERVER_V2__
   if (typeof window === 'object' && !self.__eversyncNoDelegateOverServer) {
     var __delOkOverServer = true;
     try {
       __eversyncRegisterUI('overwriteServerData', callback, stateCallback);
       chrome.runtime.sendMessage({ action: '__eversyncRunInWorker', method: 'overwriteServerData' }, function (resp) {
         if (chrome.runtime.lastError || !resp || !resp.ok) {
           __eversyncRegisterUI('overwriteServerData', null, null);
           self.__eversyncNoDelegateOverServer = true;
           try { self.overwriteServerData(callback, stateCallback); } finally { self.__eversyncNoDelegateOverServer = false; }
         }
       });
     } catch (e) { __delOkOverServer = false; }
     if (__delOkOverServer) { return; }
   }

      acquireSyncLockCallback(callback, function () {
        clearToSyncData();
        abortCurrentSync = false;
        startSync();

        fvdSynchronizer.Utils.Async.chain([
          function (chainCallback) {
            putAllDataOnServer(
              function (error, _result) {
                _result = _result || {};

                endSync();

                if (error) {
                  if (
                    error ==
                    fvdSynchronizer.Errors.ERROR_COUNT_ITEMS_QUOTA_EXCEED
                  ) {
                    self.displayQuotaExceedMessage(_result.count);
                  }
                }

                if (error == 0) {
                  fvdSynchronizer.Prefs.set(
                    'speeddial.first_sync_after',
                    'none'
                  );
                }

                releaseSyncLock(function () {
                  callback(error);
                });
              },
              stateCallback,
              {
                overwrite: true,
              }
            );
          },
        ]);
      });
    };

    this.hasUpdates = function (callback) {
      startSync();

      hasUpdates(function (...args) {
        endSync();
        callback(...args);
      });
    };

    this.uploadUpdates = function (callback, stateCallback) {
      startSync();

      uploadUpdates(
        function (error, _result) {
          endSync();
          callback(error, _result);
        },
        stateCallback
      );
    };

    this.applyServerUpdates = function (
      groupsLastUpdateTime,
      dialsLastUpdateTime,
      callback,
      stateCallback
    ) {
      startSync();

      applyServerUpdates(
        groupsLastUpdateTime,
        dialsLastUpdateTime,
        function (error) {
          endSync();
          callback(error);
        },
        stateCallback
      );
    };

    this.connectToSpeeddial = function () {
      connectToSpeeddial();
    };

    this.hasToSyncData = function () {
      var toSyncData = getToSyncData();
      var has = false;

      Object.keys(toSyncData).forEach(function (key) {
        if (toSyncData[key].length > 0) {
          has = true;
        }
      });

      return has;
    };

    this.isSyncNow = function () {
      return isSyncNow || this.getMainSyncState() == 'sync';
    };

    this.setSyncNow = function (state) {
      if (state) {
        startSync();
      } else {
        endSync();
      }
    };

    function removeChangeMainSyncStateListener(listener) {
      var index = changeMainSyncStateListeners.indexOf(listener);

      if (index != -1) {
        changeMainSyncStateListeners.splice(index, 1);
      }
    }

    function callChangeMainSyncStateListeners() {
      var listenersToRemove = [];

      changeMainSyncStateListeners.forEach(function (listener) {
        try {
          listener();
        } catch (ex) {
          listenersToRemove.push(listener);
        }
      });

      listenersToRemove.forEach(function (listener) {
        removeChangeMainSyncStateListener(listener);
      });
    }

    function startSync() {
      isSyncNow = true;
   // __EVERSYNC_PATCH_START_SYNC__
   try { if (globalThis.__everSyncPatch && globalThis.__everSyncPatch.setDriverSyncActive) globalThis.__everSyncPatch.setDriverSyncActive(true); } catch (e) {}

      fvdSynchronizer.Server.Sync.syncStateRefresh();
      fvdSynchronizer.Observer.fireEvent('syncStart', ['SpeedDial']);

      messageToSD({
        action: 'syncStartNotification', syncType: currentSyncType, /* __EVERSYNC_PATCH_SYNC_TYPE_START__ */
      });
    }

    function endSync() {
      isSyncNow = false;
   // __EVERSYNC_PATCH_END_SYNC__
   try { if (globalThis.__everSyncPatch && globalThis.__everSyncPatch.setDriverSyncActive) globalThis.__everSyncPatch.setDriverSyncActive(false); } catch (e) {}

      fvdSynchronizer.Observer.fireEvent('syncEnd', ['SpeedDial']);
      fvdSynchronizer.Server.Sync.syncStateRefresh();

      messageToSD({
        action: 'syncEndNotification', syncType: currentSyncType, /* __EVERSYNC_PATCH_SYNC_TYPE_END__ */
      });
    }

    function checkSyncAbort() {
      return abortCurrentSync;
    }

    function arrayProcessConcurrently(items, worker, concurrency, done) {
      if (!items || items.length === 0) {
        if (done) {
          done();
        }

        return;
      }

      var index = 0;
      var active = 0;
      var finished = false;

      function next() {
        if (finished) {
          return;
        }

        if (index >= items.length && active === 0) {
          finished = true;

          if (done) {
            done();
          }

          return;
        }

        while (active < concurrency && index < items.length) {
          var item = items[index++];

          active++;

          try {
            worker(item, function () {
              active--;
              next();
            });
          } catch (ex) {
            console.warn('arrayProcessConcurrently worker error', ex);

            active--;
            next();
          }
        }
      }

      next();
    }

    function startSyncKeepAlive() {
      return setInterval(function () {
        try {
          messageToSD({
            action: 'ping',
          });
        } catch (e) {}

        try {
          chrome.runtime.getPlatformInfo(function () {});
        } catch (e) {}
      }, 15000);
    }

    function isFailedResponse(response) {
      return (
        !response ||
        response.error === true ||
        response.timedOut === true ||
        response.disconnected === true
      );
    }

    function trackSync(type) {
      currentSyncType = type;
      currentSyncId = new Date().toUTCString();
    }

    function getTrackingData() {
      return {
        _sync_type: currentSyncType,
        _sync_id: currentSyncId,
      };
    }

    function makeRequest(data, callback) {
      Object.assign(data, getTrackingData());

      fvdSynchronizer.Server.Sync.authorizedMessage(data, callback);
    }

    function startTransaction(callback) {
      messageToSD(
        {
          action: 'startTransaction',
        },
        function (response) {
          callback(response.transId);
        }
      );
    }

    function commitTransaction(transId, callback) {
      messageToSD(
        {
          action: 'commitTransaction',
          transId: transId,
        },
        callback
      );
    }

    function rollbackTransaction(transId, callback) {
      messageToSD(
        {
          action: 'rollbackTransaction',
          transId: transId,
        },
        callback
      );
    }

    function getSyncDialsAndGroupsLastUpdateTime(callback) {
      messageToSD(
        {
          action: 'localStorage.get',
          data: {
            key: 'syncLastUpdateTime',
          },
        },
        function (response) {
          callback(response.result);
        }
      );
    }

    function getToSyncData() {
      var result = null;

      try {
        var str = fvdSynchronizer.Prefs.get('speeddial.to_sync_data');

        if (str != '{}') {
          result = JSON.parse(str);
        }
      } catch (ex) {}

      if (!result) {
        result = fvdSynchronizer.Utils.objectClone(_initToSyncData);
      } else {
        for (var k in _initToSyncData) {
          if (!result[k]) {
            result[k] = _initToSyncData[k];
          }
        }
      }

      return result;
    }

    function setToSyncData(toSyncData) {
      fvdSynchronizer.Prefs.set(
        'speeddial.to_sync_data',
        JSON.stringify(toSyncData)
      );

      messageToSD({
        action: 'toSyncDataChanged',
        toSyncData: toSyncData,
      });

      fvdSynchronizer.Server.Sync.syncStateRefresh();
    }

    function clearToSyncData() {
      setToSyncData(_initToSyncData);
    }

    function mapDialsLocalToServer(localDials, extra) {
      extra = extra || {};

      var serverDials = [];

      var mapThumbSourceType = {
        screen: 'url',
        url: 'force_url',
        local_file: 'local_file',
      };

      localDials.forEach(function (localDial) {
        var serverDial = {
          url: localDial.url,
          title: localDial.title ? localDial.title : localDial.auto_title,
          thumb_source_type: mapThumbSourceType[localDial.thumb_source_type],
          position: localDial.position,
          hand_changed: localDial.title ? 1 : 0,
          thumb_width: localDial.thumb_width,
          thumb_height: localDial.thumb_height,
          thumb_url: localDial.thumb_url == null ? '' : localDial.thumb_url,
          global_id: localDial.global_id,
          group_global_id: localDial.group_global_id,
          local_file_type:
            localDial.get_screen_method == 'manual' ? 'manual_crop' : 'custom',
          update_interval: localDial.update_interval,
        };

        var isManuallyCroppedPreview =
          localDial.get_screen_method == 'manual' &&
          localDial.thumb_source_type == 'screen';

        if (
          localDial.thumb_source_type == 'local_file' ||
          isManuallyCroppedPreview
        ) {
          if (
            typeof localDial.need_sync_screen == 'undefined' ||
            localDial.need_sync_screen ||
            extra.forceStorePic
          ) {
            try {
              serverDial._previewContent = localDial.thumb;
            } catch (ex) {}
          }
        }

        if (isManuallyCroppedPreview) {
          serverDial.thumb_source_type = 'local_file';
        }

        serverDials.push(serverDial);
      });

      return serverDials;
    }

    function mapDialsServerToLocal(serverDials) {
      var localDials = [];

      var mapThumbSourceType = {
        screen: 'screen',
        url: 'screen',
        force_url: 'url',
        local_file: 'local_file',
      };

      serverDials.forEach(function (serverDial) {
        var localDial = {
          url: serverDial.url,
          title: serverDial.hand_changed == 1 ? serverDial.title : '',
          auto_title: serverDial.hand_changed == 0 ? serverDial.title : '',
          thumb_source_type: mapThumbSourceType[serverDial.thumb_source_type],
          position: serverDial.position,
          thumb_width: serverDial.thumb_width,
          thumb_height: serverDial.thumb_height,
          thumb_url: serverDial.thumb_url,
          global_id: serverDial.global_id,
          group_global_id: serverDial.group_global_id,
          last_change_by: serverDial.last_change_by,
          update_interval: serverDial.update_interval,
        };

        var getScreenMethod = 'auto';

        if (
          (localDial.thumb_source_type == 'screen' ||
            localDial.thumb_source_type == 'local_file') &&
          serverDial.local_file_type == 'manual_crop'
        ) {
          localDial.thumb_source_type = 'screen';
          getScreenMethod = 'manual';
        }

        localDial.get_screen_method = getScreenMethod;

        if (serverDial._previewContent) {
          localDial.thumb =
            'data:image/png;base64,' + serverDial._previewContent;
        } else if (serverDial._previewUrl) {
          localDial._previewUrl = serverDial._previewUrl;
        }

        localDials.push(localDial);
      });

      return localDials;
    }

    function applyServerUpdates(
      groupsLastUpdateTime,
      dialsLastUpdateTime,
      callback,
      stateCallback
    ) {
      var anyChangesMaked = false;

      function changeState(state, data) {
        if (stateCallback) {
          stateCallback(state, data);
        }
      }

      var toSyncData = getToSyncData();

      var needFixGroupsPositions = false;
      var needFixDialsPositionsGroupsIds = [];

      var groupsDownloadCount = 0;
      var dialsDownloadCount = 0;

      fvdSynchronizer.Utils.Async.chain([
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          changeState('syncGroups');

          var currentLastUpdateTime =
            groupsLastUpdateTime || getGroupsLastUpdateTime();

          getGroupsFromServer(currentLastUpdateTime, function (
            error,
            result
          ) {
            if (error != 0) {
              callback(error);
            } else {
              var groups, lastUpdateTime;

              try {
                groups = result.groups.filter((serverGroup) => {
                  return !toSyncData.deleteGroups.includes(
                    serverGroup.global_id
                  );
                }); groups = groups.filter(function (serverGroup) { return toSyncData.groups.indexOf(serverGroup.global_id) === -1 && toSyncData.newGroups.indexOf(serverGroup.global_id) === -1; }); /* EVERSYNC_SELF_CLOBBER_FIX_V2 */

                lastUpdateTime = result.lastUpdateTime;
              } catch (ex) {
                callback(Errors.ERROR_SERVER_RESPONSE_MALFORMED);
                return;
              }

              groupsDownloadCount += groups.length;

              if (groups.length > 0) {
                anyChangesMaked = true;
                needFixGroupsPositions = true;
              }

              fvdSynchronizer.Utils.Async.chain([
                function (chainCallback2) {
                  if (!toSyncData.groups.length) {
                    return chainCallback2();
                  }

                  var positionsServer = {};

                  groups.forEach(function (group) {
                    positionsServer[group.position] = group.global_id;
                  });

                  messageToSD(
                    {
                      action: 'queryGroups',
                      where: [
                        "`global_id` IN ('" +
                          toSyncData.groups.join("','") +
                          "')",
                      ],
                    },
                    function (response) {
                      if (response.list) {
                        response.list.forEach(function (clientGroup) {
                          var conflictServerGlobalId =
                            positionsServer[clientGroup.position];

                          if (conflictServerGlobalId) {
                            console.log(
                              'Got a conflict on position',
                              clientGroup.position
                            );

                            syncData('groups', conflictServerGlobalId);
                          }
                        });
                      }

                      chainCallback2();
                    }
                  );
                },
                function (chainCallback2) {
                  arrayProcessConcurrently(
                    groups,
                    function (group, arrayProcessCallback) {
                      messageToSD(
                        {
                          action: 'saveGroup',
                          group: group,
                        },
                        function () {
                          arrayProcessCallback();
                        }
                      );
                    },
                    4,
                    function () {
                      if (currentLastUpdateTime != lastUpdateTime) {
                        setGroupsLastUpdateTime(lastUpdateTime);
                      }

                      chainCallback2();
                    }
                  );
                },
                function (chainCallback2) {
                  if (result.groupIds && result.groupIds.length > 0) {
                    anyChangesMaked = true;

                    result.groupIds = result.groupIds.concat(
                      toSyncData.newGroups
                    );

                    var serverGroupIds = result.groupIds;

                    messageToSD(
                      {
                        action: 'removeGroupsNotInList',
                        groupsIds: result.groupIds,
                      },
                      function (result) {
                        var countRemovedGroups = result.removed;

                        if (countRemovedGroups > 0) {
                          groupsDownloadCount += countRemovedGroups;
                          needFixGroupsPositions = true;
                        }

                        if (toSyncData.groups && toSyncData.groups.length) {
                          toSyncData.groups.forEach(function (global_id) {
                            if (serverGroupIds.indexOf(global_id) == -1) {
                              removeSyncData(['groups'], global_id);
                            }
                          });
                        }

                        chainCallback2();
                      }
                    );
                  } else {
                    chainCallback2();
                  }
                },
                function () {
                  chainCallback();
                },
              ]);
            }
          });
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            return;
          }

          changeState('syncDials', {
            groupsCount: groupsDownloadCount,
          });

          var currentLastUpdateTime =
            dialsLastUpdateTime || getDialsLastUpdateTime();

          getDialsFromServer(
            {
              lastUpdateTime: currentLastUpdateTime,
            },
            function (error, result) {
              if (error != 0) {
                callback(error);
              } else {
                try {
                  var dials = result.dials;
                  var lastUpdateTime = result.lastUpdateTime; dials = dials.filter(function (serverDial) { return toSyncData.dials.indexOf(serverDial.global_id) === -1 && toSyncData.deleteDials.indexOf(serverDial.global_id) === -1; }); /* EVERSYNC_SELF_CLOBBER_FIX_V1 */
                } catch (ex) {
                  callback(Errors.ERROR_SERVER_RESPONSE_MALFORMED);
                  return;
                }

                dialsDownloadCount += dials.length;

                if (dials.length > 0) {
                  anyChangesMaked = true;
                }

                fvdSynchronizer.Utils.Async.chain([
                  function (chainCallback2) {
                    var anyDialSaveFailed = false;

                    debugLog(
                      'starting saveDial loop, dials count:',
                      dials.length
                    );

                    var savedOkCount = 0;
                    var savedFailCount = 0;

                    arrayProcessConcurrently(
                      dials,
                      function (dial, arrayProcessCallback) {
                        messageToSD(
                          {
                            action: 'saveDial',
                            dial: dial,
                          },
                          function (result) {
                            if (isFailedResponse(result)) {
                              anyDialSaveFailed = true;
                              savedFailCount++;

                              console.warn(
                                'saveDial did not get a confirmed response, will retry next sync',
                                dial && dial.global_id,
                                result
                              );

                              arrayProcessCallback();

                              return;
                            }

                            savedOkCount++;

                            var saveInfo = result.saveInfo;

                            if (saveInfo) {
                              if (saveInfo.move) {
                                needFixDialsPositionsGroupsIds.push(
                                  saveInfo.move.from
                                );

                                needFixDialsPositionsGroupsIds.push(
                                  saveInfo.move.to
                                );
                              } else {
                                needFixDialsPositionsGroupsIds.push(
                                  saveInfo.group_id
                                );
                              }
                            }

                            arrayProcessCallback();
                          }
                        );
                      },
                      15,
                      function () {
                        debugLog(
                          'saveDial loop finished. ok:',
                          savedOkCount,
                          'failed:',
                          savedFailCount,
                          'total:',
                          dials.length
                        );

                        if (anyDialSaveFailed) {
                          console.warn(
                            'Some dials failed to save this sync -- cursor not advanced, will retry next sync'
                          );
                        } else if (currentLastUpdateTime != lastUpdateTime) {
                          setDialsLastUpdateTime(lastUpdateTime);
                        }

                        chainCallback2();
                      }
                    );
                  },
                  function (chainCallback2) {
                    if (result.dialIds) {
                      anyChangesMaked = true;

                      result.dialIds = result.dialIds.concat(
                        toSyncData.newDials
                      );

                      messageToSD(
                        {
                          action: 'removeDialsNotInList',
                          dialsIds: result.dialIds,
                        },
                        function (response) {
                          var removeInfo = response.removeInfo;

                          if (removeInfo.count > 0) {
                            dialsDownloadCount += removeInfo.count;

                            needFixDialsPositionsGroupsIds =
                              needFixDialsPositionsGroupsIds.concat(
                                removeInfo.removedFromGroups
                              );
                          }

                          chainCallback2();
                        }
                      );
                    } else {
                      chainCallback2();
                    }
                  },
                  function () {
                    chainCallback();
                  },
                ]);
              }
            }
          );
        },
        function (chainCallback) {
          changeState('applyChanges', {
            dialsCount: dialsDownloadCount,
          });

          if (needFixGroupsPositions) {
            messageToSD(
              {
                action: 'fixGroupsPositions',
              },
              function () {
                chainCallback();
              }
            );
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          if (needFixDialsPositionsGroupsIds.length > 0) {
            needFixDialsPositionsGroupsIds =
              fvdSynchronizer.Utils.arrayUnique(
                needFixDialsPositionsGroupsIds
              );

            arrayProcessConcurrently(
              needFixDialsPositionsGroupsIds,
              function (groupId, arrayProcessCallback) {
                if (groupId) {
                  messageToSD(
                    {
                      action: 'fixDialsPositions',
                      groupId: groupId,
                    },
                    function () {
                      arrayProcessCallback();
                    }
                  );
                } else {
                  arrayProcessCallback();
                }
              },
              4,
              function () {
                chainCallback();
              }
            );
          } else {
            chainCallback();
          }
        },
        function () {
          if(dialsDownloadCount>0||groupsDownloadCount>0){fvdSynchronizer.Driver.Speeddial.Backup.setHasChanges();}fvdSynchronizer.Prefs.set('speeddial.full_sync_done',true);callback(0,anyChangesMaked);
        },
      ]);
    }

    function removeDialsFromServer(dialIds, callback) {
      var request = {
        action: 'remove_dials',
        dialIds: dialIds,
      };

      makeRequest(request, function (error, data) {
        if (error == 0) {
          setDialsLastUpdateTime(data.lastUpdateTime);
        }

        callback(error);
      });
    }

    function removeGroupsFromServer(groupIds, callback) {
      var request = {
        action: 'remove_groups',
        groupIds: groupIds,
      };

      makeRequest(request, function (error, data) {
        if (error == 0) {
          setGroupsLastUpdateTime(data.lastUpdateTime);
        }

        callback(error);
      });
    }

    function uploadUpdates(callback, stateCallback) {
      var toSyncData = getToSyncData();

      var groupsUploadedCount = 0;
      var dialsUploadedCount = 0;

      var serverMissedGroups = [];

      function changeState(state, countObjectsSynced) {
        if (stateCallback) {
          stateCallback(state, countObjectsSynced);
        }
      }

      fvdSynchronizer.Utils.Async.chain([
        function (chainCallback) {
          changeState('syncGroups');

          if (toSyncData.deleteGroups.length > 0) {
            groupsUploadedCount += toSyncData.deleteGroups.length;

            removeGroupsFromServer(toSyncData.deleteGroups, function (error) {
              if (error) {
                return callback(error);
              }

              toSyncData.deleteGroups = [];

              chainCallback();
            });
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          if (toSyncData.groups.length > 0) {
            messageToSD(
              {
                action: 'queryGroups',
                where: [
                  "`global_id` IN ('" + toSyncData.groups.join("','") + "')",
                ],
              },
              function (response) {
                var groups = response.list;

                groupsUploadedCount += groups.length;

                toSyncData.groups = [];

                if (!groups.length) {
                  return chainCallback();
                }

                putGroupsListOnserver(groups, function (error, data) {
                  if (error) {
                    return callback(error, {
                      count: groups.length,
                    });
                  }

                  chainCallback();
                });
              }
            );
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          changeState('syncDials', {
            groupsCount: groupsUploadedCount,
          });

          if (toSyncData.deleteDials.length > 0) {
            dialsUploadedCount += toSyncData.deleteDials.length;

            removeDialsFromServer(toSyncData.deleteDials, function (error) {
              if (error) {
                return callback(error);
              }

              toSyncData.deleteDials = [];

              chainCallback();
            });
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          setTimeout(function () {
            chainCallback();
          }, 500);
        },
        function (chainCallback) {
          if (toSyncData.dials.length > 0) {
            queryDials(
              {
                where: [
                  "`dials`.`global_id` IN ('" +
                    toSyncData.dials.join("','") +
                    "')",
                ],
                fetchThumb: false,
              },
              function (response) {
                var dials = response.list;

                dialsUploadedCount += dials.length;

                toSyncData.dials = [];

                putDialsListOnserver(dials, function (error, data) {
                  if (error) {
                    return callback(error, {
                      count: dials.length,
                    });
                  }

                  if (data.serverMissedGroups && data.serverMissedGroups.length) {
                    serverMissedGroups = data.serverMissedGroups;
                  }

                  chainCallback();
                });
              }
            );
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          if (!serverMissedGroups || !serverMissedGroups.length) {
            return chainCallback();
          }

          console.log(
            'Reupload all groups because server has missed:',
            serverMissedGroups
          );

          messageToSD(
            {
              action: 'queryGroups',
            },
            function (response) {
              var groups = response.list;

              if (!groups.length) {
                return chainCallback();
              }

              putGroupsListOnserver(groups, function (error, data) {
                chainCallback();
              });
            }
          );
        },
        function (chainCallback) {
          changeState('applyChanges', {
            dialsCount: dialsUploadedCount,
          });

          chainCallback();
        },
        function (chainCallback) {
          setTimeout(function () {
            chainCallback();
          }, 500);
        },
        function () {
          callback(0);
        },
      ]);
    }

    function hasUpdates(callback) {
      var request = {
        action: 'found_changes',
        lastUpdateTimeDials: getDialsLastUpdateTime() || 1,
        lastUpdateTimeGroups: getGroupsLastUpdateTime() || 1,
      };

      makeRequest(request, function (error, response) {
        if (!error) {
          callback(error, response.foundChanges, {
            lastUpdateTimeDials: response.lastUpdateTimeDials,
            lastUpdateTimeGroups: response.lastUpdateTimeGroups,
            localLastUpdateTimeDials: getDialsLastUpdateTime(),
            localLastUpdateTimeGroups: getGroupsLastUpdateTime(),
          });
        } else {
          callback(error);
        }
      });
    }

    function getDialsFromServer(params, callback) {
      var params = params || {};

      var request = {
        action: 'list_dials',
      };

      for (var k in params) {
        request[k] = params[k];
      }

      makeRequest(request, function (error, data) {
        if (error == 0) {
          debugLog(
            'server list_dials raw count:',
            data && data.dials ? data.dials.length : 'n/a',
            'response keys:',
            data ? Object.keys(data) : []
          );

          data.dials = mapDialsServerToLocal(data.dials);

          debugLog('mapped dials count:', data.dials.length);
        }

        callback(error, data);
      });
    }

    function putDialsListOnserver(dials, callback, extra) {
      extra = extra || {};

      var serverMissedGroups = [];

      dials.forEach(function (dial) {
        delete dial.rowid;
        delete dial.deny;
        delete dial.group_id;
        delete dial.clicks;
        delete dial.status;
        delete dial.restore_previous_thumb;
        delete dial.ignore_restore_previous_thumb;
        delete dial.thumb_update_date;
        delete dial.thumb_src;
      });

      var preDials = mapDialsLocalToServer(dials, extra);

      var sendData = {
        action: 'put_dials',
        dials: preDials,
      };

      var uploadError = 0;
      var resetSyncManualPreviewDialsIds = [];
      var putDialsServerResponse;
      var previewUploadAborted = false;

      function abortPreviewUploadOnce(err) {
        if (previewUploadAborted) {
          return;
        }

        previewUploadAborted = true;

        callback(err);
      }

      fvdSynchronizer.Utils.Async.chain([
        function (chainCallback) {
          arrayProcessConcurrently(
            preDials,
            function (dial, apCallback) {
              if (previewUploadAborted) {
                return apCallback();
              }

              if (
                dial._previewContent &&
                typeof dial._previewContent === 'string'
              ) {
                fvdSynchronizer.Utils.Async.chain([
                  function (next) {
                    if (dial._previewContent.indexOf('filesystem:') === 0) {
                      queryDialThumb(dial.global_id, function (thumb) {
                        dial._previewContent = thumb;
                        next();
                      });
                    } else {
                      next();
                    }
                  },
                  function () {
                    if (!dial._previewContent) {
                      console.info(
                        'Fail to receive thumb, received empty:',
                        dial._previewContent
                      );

                      return apCallback();
                    }

                    let blob;

                    try {
                      blob = fvdSynchronizer.Utils.dataURItoBlob(
                        dial._previewContent
                      );
                    } catch (ex) {
                      console.warn(ex, dial);

                      return apCallback();
                    }

                    fvdSynchronizer.Server.Sync.preUploadFile(
                      {
                        blob: blob,
                        name: UPLOAD_PREVIEW_FILENAME,
                      },
                      function (error, data) {
                        if (error) {
                          abortPreviewUploadOnce(error);
                          return apCallback();
                        }

                        if (!data || !data.files) {
                          abortPreviewUploadOnce(
                            fvdSynchronizer.Errors
                              .ERROR_STORAGE_ENGINE_RETURNS_ERROR
                          );

                          return apCallback();
                        }

                        var filesMap = data.files;

                        if (!filesMap.file) {
                          abortPreviewUploadOnce(
                            fvdSynchronizer.Errors
                              .ERROR_STORAGE_ENGINE_RETURNS_ERROR
                          );

                          return apCallback();
                        }

                        dial._tempfilename = filesMap.file;

                        delete dial._previewContent;

                        resetSyncManualPreviewDialsIds.push(dial.global_id);

                        apCallback();
                      }
                    );
                  },
                ]);
              } else {
                apCallback();
              }
            },
            8,
            function () {
              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (previewUploadAborted) {
            return;
          }

          makeRequest(sendData, function (error, result) {
            if (error == 0) {
              setDialsLastUpdateTime(result.lastUpdateTime);
            }

            putDialsServerResponse = result;
            uploadError = error;

            chainCallback();
          });
        },
        function (chainCallback) {
          if (previewUploadAborted) {
            return;
          }

          if (
            !putDialsServerResponse.extra ||
            !putDialsServerResponse.extra.notFoundGroups ||
            !Array.isArray(putDialsServerResponse.extra.notFoundGroups) ||
            !putDialsServerResponse.extra.notFoundGroups.length
          ) {
            return chainCallback();
          }

          let nfGroupsGlobalIds =
            putDialsServerResponse.extra.notFoundGroups.map((group) => {
              return group.global_id;
            });

          serverMissedGroups = nfGroupsGlobalIds;

          setTimeout(function () {
            let toSend = {};

            fvdSynchronizer.Utils.Async.chain([
              (next) => {
                messageToSD(
                  {
                    action: 'countItems',
                  },
                  (res) => {
                    toSend.count = res;

                    next();
                  }
                );
              },
              (next) => {
                messageToSD(
                  {
                    action: 'queryGroups',
                  },
                  function (response) {
                    const groups = response.list;

                    toSend.groups = {
                      notFoundGroups: nfGroupsGlobalIds,
                      localGroups: groups,
                    };

                    next();
                  }
                );
              },
              () => {
                const params = {
                  method: 'post',
                  credentials: 'same-origin',
                  data: JSON.stringify(toSend),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                };

                const request = new Request(
                  'https://everhelper.pro/spec/nogroups_put_dials_dbg.php',
                  params
                );

                fetch(request)
                  .then((response) => {
                    return response.json();
                  })
                  .then((data) => {
                    console.log(data);
                  })
                  .catch(function (err) {
                    console.warn(err);
                  });
              },
            ]);
          }, 0);

          chainCallback();
        },
        function (chainCallback) {
          if (previewUploadAborted) {
            return;
          }

          if (resetSyncManualPreviewDialsIds.length != 0) {
            messageToSD(
              {
                action: 'updateMass',
                globalIds: resetSyncManualPreviewDialsIds,
                data: {
                  need_sync_screen: 0,
                },
              },
              function () {
                chainCallback();
              }
            );
          } else {
            chainCallback();
          }
        },
        function () {
          if (!previewUploadAborted) {
            callback(uploadError, {
              serverMissedGroups,
            });
          }
        },
      ]);
    }

    function getGroupsFromServer(params, callback) {
      var lastUpdateTime = null;

      if (typeof params == 'object' && params) {
        lastUpdateTime = params.lastUpdateTime;
      } else {
        lastUpdateTime = params;
        params = {};
      }

      var request = {
        action: 'list_groups',
      };

      for (var k in params) {
        request[k] = params[k];
      }

      if (lastUpdateTime) {
        request.lastUpdateTime = lastUpdateTime;
      }

      makeRequest(request, callback);
    }

    function putGroupsListOnserver(groups, callback) {
      groups.forEach(function (group) {
        delete group.rowid;
      });

      var sendData = {
        action: 'put_groups',
        groups: groups,
      };

      makeRequest(sendData, function (error, result) {
        if (error == 0) {
          setGroupsLastUpdateTime(result.lastUpdateTime);
        }

        callback(error);
      });
    }

    function mergeLocalAndServerData(params, callback, stateCallback) {
      params = params || {};

      var newGroups = [];
      var toServerGroups = [];
      var collisedGroups = [];
      var collisedGroupsTranslateGlobalIds = {};

      var newDials = [];
      var toServerDials = [];
      var collisedDials = [];

      var dialsToReplaceIds = [];
      var dialsToOverrideIds = [];

      var clientGroups = [];
      var serverGroups = [];
      var clientDials = [];
      var serverDials = [];

      var lastUpdateGroups = null;
      var lastUpdateDials = null;

      var syncedDialsCount = 0;
      var syncedGroupsCount = 0;
      var localDatabaseAffected = false;

      var anySaveFailed = false;

      if (params.groupGlobalId) {
        collisedGroupsTranslateGlobalIds[params.groupGlobalId] =
          params.groupGlobalId;
      }

      function changeState(newState, data) {
        if (stateCallback) {
          stateCallback(newState, data);
        }
      }

      var needFixGroups = [];
      var transId = null;

      fvdSynchronizer.Utils.Async.chain([
        function (chainCallback) {
          changeState('syncGroups');

          if (params.groupId) {
            chainCallback();
          } else {
            messageToSD(
              {
                action: 'queryGroups',
                where: ['`global_id` IS NOT NULL'],
                transId: transId,
              },
              function (response) {
                clientGroups = response.list;

                chainCallback();
              }
            );
          }
        },
        function (chainCallback) {
          if (params.groupId) {
            chainCallback();
          } else {
            getGroupsFromServer(null, function (error, serverResponse) {
              if (error != 0) {
                callback(error);
              } else {
                try {
                  serverGroups = serverResponse.groups;
                  lastUpdateGroups = serverResponse.lastUpdateTime;
                } catch (ex) {
                  console.log('EX: ' + ex + '\n');

                  callback(Errors.ERROR_SERVER_RESPONSE_MALFORMED);

                  return;
                }

                chainCallback();
              }
            });
          }
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          function isGroupInList(groupName, list) {
            for (var i = 0; i != list.length; i++) {
              if (list[i].name == groupName) {
                return list[i];
              }
            }

            return null;
          }

          clientGroups.forEach(function (clientGroup) {
            var collisedGroup = isGroupInList(clientGroup.name, serverGroups);

            if (!collisedGroup) {
              toServerGroups.push(clientGroup);
            } else {
              collisedGroupsTranslateGlobalIds[clientGroup.global_id] =
                collisedGroup.global_id;

              collisedGroups.push({
                clientGroup: clientGroup,
                serverGroup: collisedGroup,
              });
            }
          });

          serverGroups.forEach(function (serverGroup) {
            if (!isGroupInList(serverGroup.name, clientGroups)) {
              newGroups.push(serverGroup);
            }
          });

          chainCallback();
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          syncedGroupsCount = newGroups.length + toServerGroups.length;

          var where = ['`dials`.`global_id` IS NOT NULL'];

          if (params.groupId) {
            where.push('`group_id` = ' + params.groupId);
          }

          queryDials(
            {
              where: where,
              transId: transId,
              fetchThumb: false,
            },
            function (response) {
              clientDials = response.list;

              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          changeState('syncDials', {
            groupsCount: syncedGroupsCount,
          });

          var getDialsParams = {};

          if (params.groupGlobalId) {
            getDialsParams.groupId = params.groupGlobalId;
          }

          getDialsFromServer(getDialsParams, function (
            error,
            serverResponse
          ) {
            if (error != 0) {
              callback(error);
            } else {
              try {
                serverDials = serverResponse.dials;
                lastUpdateDials = serverResponse.lastUpdateTime;
              } catch (ex) {
                console.log(ex);

                callback(Errors.ERROR_SERVER_RESPONSE_MALFORMED);

                return;
              }

              chainCallback();
            }
          });
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          function clientDialInList(dial, list) {
            for (var i = 0; i != list.length; i++) {
              if (fvdSynchronizer.Utils.isUrlsEqual(list[i].url, dial.url)) {
                var groupGlobalId =
                  collisedGroupsTranslateGlobalIds[dial.group_global_id];

                if (
                  groupGlobalId == list[i].group_global_id &&
                  dialsToOverrideIds.indexOf(list[i].global_id) == -1
                ) {
                  dialsToOverrideIds.push(list[i].global_id);

                  return list[i];
                }
              }
            }

            return null;
          }

          clientDials.forEach(function (clientDial) {
            var collisedDial = clientDialInList(clientDial, serverDials);

            if (collisedDial) {
              if (dialsToReplaceIds.indexOf(clientDial.global_id) == -1) {
                dialsToReplaceIds.push(clientDial.global_id);

                collisedDials.push({
                  clientDial: clientDial,
                  serverDial: collisedDial,
                });
              } else {
                collisedDial = null;
              }
            }

            if (!collisedDial) {
              toServerDials.push(clientDial);
            }
          });

          serverDials.forEach(function (serverDial) {
            if (dialsToOverrideIds.indexOf(serverDial.global_id) == -1) {
              newDials.push(serverDial);
            }
          });

          chainCallback();
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          syncedDialsCount = newDials.length + toServerDials.length;

          changeState('applyChanges', {
            dialsCount: syncedDialsCount,
          });

          arrayProcessConcurrently(
            collisedGroups,
            function (collision, arrayProcessCallback) {
              messageToSD(
                {
                  action: 'mergeUpdateCollisedGroup',
                  clientGroup: collision.clientGroup,
                  serverGroup: collision.serverGroup,
                  transId: transId,
                },
                function (response) {
                  if (isFailedResponse(response)) {
                    anySaveFailed = true;
                  }

                  arrayProcessCallback();
                }
              );
            },
            4,
            function () {
              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          arrayProcessConcurrently(
            newGroups,
            function (newGroup, arrayProcessCallback) {
              messageToSD(
                {
                  action: 'saveGroup',
                  group: newGroup,
                  transId: transId,
                },
                function (response) {
                  if (isFailedResponse(response)) {
                    anySaveFailed = true;
                  }

                  arrayProcessCallback();
                }
              );
            },
            4,
            function () {
              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          if (toServerGroups && toServerGroups.length) {
            putGroupsListOnserver(toServerGroups, function (error) {
              if (error) {
                return callback(error, {
                  count: toServerGroups.length,
                });
              }

              chainCallback();
            });
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          arrayProcessConcurrently(
            collisedDials,
            function (collision, arrayProcessCallback) {
              messageToSD(
                {
                  action: 'mergeUpdateCollisedDial',
                  clientDial: collision.clientDial,
                  serverDial: collision.serverDial,
                  transId: transId,
                },
                function (response) {
                  if (isFailedResponse(response)) {
                    anySaveFailed = true;
                  } else if (response.saveInfo) {
                    if (response.saveInfo.move) {
                      needFixGroups.push(response.saveInfo.move.from);
                      needFixGroups.push(response.saveInfo.move.to);
                    } else {
                      needFixGroups.push(response.saveInfo.group_id);
                    }
                  }

                  arrayProcessCallback();
                }
              );
            },
            8,
            function () {
              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          arrayProcessConcurrently(
            newDials,
            function (newDial, arrayProcessCallback) {
              messageToSD(
                {
                  action: 'saveDial',
                  dial: newDial,
                  transId: transId,
                },
                function (response) {
                  if (isFailedResponse(response)) {
                    anySaveFailed = true;
                  } else if (response.saveInfo) {
                    if (response.saveInfo.move) {
                      needFixGroups.push(response.saveInfo.move.from);
                      needFixGroups.push(response.saveInfo.move.to);
                    } else {
                      needFixGroups.push(response.saveInfo.group_id);
                    }
                  }

                  arrayProcessCallback();
                }
              );
            },
            10,
            function () {
              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          if (toServerDials.length > 0) {
            for (var i = 0; i != toServerDials.length; i++) {
              var d = toServerDials[i];

              var groupGlobalId = d.group_global_id;

              if (collisedGroupsTranslateGlobalIds[groupGlobalId]) {
                d.group_global_id =
                  collisedGroupsTranslateGlobalIds[groupGlobalId];
              }
            }

            putDialsListOnserver(
              toServerDials,
              function (error) {
                if (error != 0) {
                  callback(error, {
                    count: toServerDials.length,
                  });
                } else {
                  chainCallback();
                }
              },
              {
                forceStorePic: true,
              }
            );
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          if (anySaveFailed) {
            callback(Errors.ERROR_CONNECTION_ERROR);
            return;
          }

          messageToSD(
            {
              action: 'fixGroupsPositions',
              transId: transId,
            },
            function (response) {
              if (isFailedResponse(response)) {
                anySaveFailed = true;
              }

              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (anySaveFailed) {
            callback(Errors.ERROR_CONNECTION_ERROR);
            return;
          }

          needFixGroups = needFixGroups.filter(function (v) {
            if (!v || v == 'undefined') {
              return false;
            }

            return true;
          });

          needFixGroups = fvdSynchronizer.Utils.arrayUnique(needFixGroups);
          needFixGroups = fvdSynchronizer.Utils.arrayFilter(needFixGroups);

          arrayProcessConcurrently(
            needFixGroups,
            function (groupId, arrayProcessCallback) {
              messageToSD(
                {
                  action: 'fixDialsPositions',
                  groupId: groupId,
                  transId: transId,
                },
                function (response) {
                  if (isFailedResponse(response)) {
                    anySaveFailed = true;
                  }

                  arrayProcessCallback();
                }
              );
            },
            4,
            function () {
              chainCallback();
            }
          );
        },
        function () {
          if (anySaveFailed) {
            callback(Errors.ERROR_CONNECTION_ERROR);
            return;
          }

          localDatabaseAffected =
            newDials.length ||
            newGroups.length ||
            collisedGroups.length ||
            collisedDials.length;

          if (checkSyncAbort()) {
            callback(Errors.ERROR_SYNC_USER_ABORTED);
            return;
          }

          setDialsLastUpdateTime(lastUpdateDials);setGroupsLastUpdateTime(lastUpdateGroups);fvdSynchronizer.Prefs.set('speeddial.full_sync_done',true);

          if (localDatabaseAffected) {
            fvdSynchronizer.Driver.Speeddial.Backup.setHasChanges();
          }

          callback(0);
        },
      ]);
    }

    function clearServerData(callback) {
      var sendData = {
        action: 'remove_all',
      };

      makeRequest(sendData, function (error) {
        callback(error);
      });
    }

    function acquireSyncLockCallback(errorCallback, successCallback) {
      acquireSyncLock(function (error) {
if (error != 0) {
try { chrome.runtime.sendMessage({ subject: 'syncError', error: error }, function () { void chrome.runtime.lastError; }); } catch (e) {}
errorCallback(error);
        } else {
          successCallback();
        }
      });
    }

    function putAllDataOnServer(callback, stateCallback, params) {
      params = params || {};

      function changeState(newState, data) {
        if (stateCallback) {
          stateCallback(newState, data);
        }
      }

      var uploadedDialsCount = 0;
      var uploadedGroupsCount = 0;

      var groups = [];
      var dials = [];

      fvdSynchronizer.Utils.Async.chain([
        function (chainCallback) {
          changeState('syncGroups');

          messageToSD(
            {
              action: 'queryGroups',
              where: ['`global_id` IS NOT NULL'],
            },
            function (response) {
              groups = response.list;

              chainCallback();
            }
          );
        },
        function (chainCallback) {
          changeState('syncDials', {
            groupsCount: uploadedGroupsCount,
          });

          queryDials(
            {
              where: ['`dials`.`global_id` IS NOT NULL'],
              fetchThumb: false,
            },
            function (response) {
              dials = response.list;

              chainCallback();
            }
          );
        },
        function (chainCallback) {
          if (params.overwrite) {
            fvdSynchronizer.Server.Sync.getQuotaByType(
              'dials_count',
              '',
              function (error, max) {
                if (error) {
                  return callback(error);
                }

                if (max && groups.length + dials.length > max) {
                  return callback(
                    fvdSynchronizer.Errors.ERROR_COUNT_ITEMS_QUOTA_EXCEED,
                    {
                      count: groups.length + dials.length,
                    }
                  );
                }

                clearServerData(function () {
                  chainCallback();
                });
              }
            );
          } else {
            chainCallback();
          }
        },
        function (chainCallback) {
          putGroupsListOnserver(groups, function (error) {
            uploadedGroupsCount = groups.length;

            if (error != 0) {
              callback(error, {
                count: groups.length,
              });
            } else {
              chainCallback();
            }
          });
        },
        function (chainCallback) {
          putDialsListOnserver(
            dials,
            function (error) {
              uploadedDialsCount = dials.length;

              if (error != 0) {
                callback(error, {
                  count: dials.length,
                });
              } else {
                chainCallback();
              }
            },
            {
              forceStorePic: true,
            }
          );
        },
        function () {
          changeState('applyChanges',{dialsCount:uploadedDialsCount,});fvdSynchronizer.Prefs.set('speeddial.full_sync_done',true);

          callback(0);
        },
      ]);
    }

    function acquireSyncLock(callback) {
      fvdSynchronizer.Server.Sync.acquireSyncLock(getTrackingData(), callback);
    }

    function releaseSyncLock(callback) {
      debugLog('releaseSyncLock called');

      fvdSynchronizer.Server.Sync.releaseSyncLock(
        getTrackingData(),
        function () {
          debugLog('releaseSyncLock finished');

          callback.apply(this, arguments);
        }
      );
    }

    function setDialsLastUpdateTime(time) {
      fvdSynchronizer.Prefs.set('speeddial.last_dials_update', time);
    }

    function getDialsLastUpdateTime() {
      return fvdSynchronizer.Prefs.get('speeddial.last_dials_update');
    }

    function setGroupsLastUpdateTime(time) {
      fvdSynchronizer.Prefs.set('speeddial.last_groups_update', time);
    }

    function getGroupsLastUpdateTime(time) {
      return fvdSynchronizer.Prefs.get('speeddial.last_groups_update');
    }

    function getTemporaryStoredSyncData() {
      let tempData = fvdSynchronizer.localStorage.getItem(
        'speeddial.temporary_sync_data'
      );

      if (!tempData) {
        tempData = [];
      } else {
        try {
          tempData = JSON.parse(tempData);
        } catch (ex) {
          tempData = [];
        }
      }

      return tempData;
    }

    function storeSyncDataTemporary(category, data) {
      let tempData = getTemporaryStoredSyncData();

      tempData.push({
        category,
        data,
      });

      console.log('saving syncData temporary', category, data);

      fvdSynchronizer.localStorage.setItem(
        'speeddial.temporary_sync_data',
        JSON.stringify(tempData)
      );
    }

    this.restoreTemporaryStoredSyncData = function () {
      let tempData = getTemporaryStoredSyncData();

      for (let record of tempData) {
        console.log(
          'Restoring temporary stored syncData',
          record.category,
          record.data
        );

        syncDataAndStore(record.category, record.data);
      }

      fvdSynchronizer.localStorage.setItem(
        'speeddial.temporary_sync_data',
        '[]'
      );
    };

    function syncData(category, data) {
      if (self.isSyncNow()) {
        storeSyncDataTemporary(category, data);
      } else {
        syncDataAndStore(category, data);
      }
    }

    function syncDataAndStore(category, data) {
      if (typeof category === 'string') {
        category = [category];
      }

      if (!data) {
        return;
      }

      var toSyncData = getToSyncData();

      category.forEach(function (cat) {
        if (!toSyncData[cat]) {
          toSyncData[cat] = [];
        }

        try {
          if (toSyncData[cat].indexOf(data) == -1 && data != null) {
            toSyncData[cat].push(data);
          }
        } catch (ex) {
          console.log('Fail add to sync data to ', cat);
        }
      });

      fvdSynchronizer.Driver.Speeddial.Backup.setHasChanges();

      setToSyncData(toSyncData);
    }

    function removeSyncData(category, data) {
      if (typeof category == 'string') {
        category = [category];
      }

      if (!data) {
        return;
      }

      var toSyncData = getToSyncData();

      category.forEach(function (cat) {
        if (!toSyncData[cat]) {
          toSyncData[cat] = [];
        }

        var index = toSyncData[cat].indexOf(data);

        if (index != -1) {
          toSyncData[cat].splice(index, 1);
        }
      });

      setToSyncData(toSyncData);
    }

    function queryDialThumb(globalId, cb) {
      messageToSD(
        {
          action: 'queryDialThumb',
          global_id: globalId,
        },
        function (r) {
          cb(r.thumb);
        }
      );
    }

    function queryDials(message, callback) {
      message.action = 'queryDials';

      var originalWhere = null;

      if (message.where) {
        originalWhere = message.where;
      }

      if (message.fetchThumb || message.fetchOnlyCustomThumb) {
        message.limit = 25;
      } else {
        message.limit = 200;
      }

      var result = {
        list: [],
      };

      var lastId = 0;

      fvdSynchronizer.Utils.Async.cc(function (next) {
        var where = [];

        if (originalWhere) {
          where = fvdSynchronizer.Utils.objectClone(originalWhere);
        }

        where.push('dials.rowid > ' + lastId);

        message.where = where;

        delete message.requestId;
        message.__syncTries = 0;

        messageToSD(message, function (r) {
          if (!r || isFailedResponse(r)) {
            callback(result);
            return;
          }

          const list = r.list || [];

          for (var i = 0; i != list.length; i++) {
            var dial = list[i];

            result.list.push(dial);

            if (dial.rowid > lastId) {
              lastId = dial.rowid;
            }
          }

          if (list.length < message.limit) {
            callback(result);
          } else {
            next();
          }
        });
      });
    }

    function uploadTempData(data, cb) {
      var dataStr = JSON.stringify(data);

      var chunkSize = 10 * 1024 * 1024;

      var chunks = fvdSynchronizer.Utils.splitString(dataStr, chunkSize);

      var tempDataId = fvdSynchronizer.Utils.generateGUID();

      var chunksStored = 0;

      fvdSynchronizer.Utils.Async.arrayProcess(
        chunks,
        function (chunk, next) {
          console.log('Save chunk', chunksStored, chunks.length);

          messageToSD(
            {
              action: 'saveTempData',
              data: {
                id: tempDataId,
                value: chunk,
              },
            },
            function () {
              chunksStored++;

              next();
            }
          );
        },
        function () {
          cb(null, tempDataId);
        }
      );
    }

    function messageToSD(message, callback) {
      connectToSpeeddial();

      if (callback && !message.requestId) {
        message.requestId = fvdSynchronizer.addPendingRequest(callback);
      }

      message.__syncTries = (message.__syncTries || 0) + 1;

      if (port) {
     try {
       port.postMessage(message);
       message.__syncTries = 0;
     } catch (e) {
       port = null; /* __EVERSYNC_PATCH_PORT_POST_TRY__ */
       setTimeout(function () { messageToSD(message, callback); }, 250);
     }
   } else if (message.__syncTries >= 18000 /* __EVERSYNC_PATCH_RETRY__ */) {
        console.log('Extension not found. syncData stoped.');

        return;
      } else {
        setTimeout(function () { messageToSD(message, callback); }, 500); /* __EVERSYNC_PATCH_RETRY_TIMEOUT__ */
      }
    }

    function _setAllow(value, apiv) {
      allow = value;
      apiVersion = apiv;

      fvdSynchronizer.Observer.fireEvent('syncDriverAllowedStateChanged', [
        'SpeedDial',
      ]);
    }

    function portMessageProcess(message) {
      if (!message.action) {
        console.log('Fail process', message, 'Action not found');
      }

      switch (message.action) {
        case 'startSync':
          if (isSyncNow) {
            if (message.requestId) {
              port.postMessage({
                action: '_response',
                requestId: message.requestId,
                state: 'sdSyncActive',
              });
            }

            return;
          }

          if (fvdSynchronizer.Server.Sync.isSyncNow()) {
            if (message.requestId) {
              port.postMessage({
                action: '_response',
                requestId: message.requestId,
                state: 'syncActive',
              });
            }

            return;
          }

          switch (message.type) {
            case 'main':
              fvdSynchronizer.Server.Sync.activityState(function (state) {
                if (state != 'logged') {
                  chrome.tabs.create({
                    url: chrome.runtime.getURL('options.html#login'),
                    active: true,
                  });
                } else if (true) /* __EVERSYNC_PATCH_START_SYNC_ALWAYS__ */ {
                  self.startMainSync();
                } else {
                  chrome.tabs.create({
                    url: chrome.runtime.getURL('options.html#sync'),
                    active: true,
                  });
                }

                if (message.requestId) {
                  port.postMessage({
                    action: '_response',
                    requestId: message.requestId,
                    state: 'ok',
                  });
                }
              });

              break;
          }

          break;

        case 'restoreBackupProgress':
          self.Backup.setRestoreBackupProgress(message.current, message.max);

          break;

        case 'needInitialSync':
          fvdSynchronizer.Prefs.set('speeddial.first_sync_after','none');

          break;

        case 'deactivate':
          console.log('SpeedDial request deactivation');

          _setAllow(false);

          break;

        case 'activate':
          console.log('SpeedDial driver activated');

          message.apiv = message.apiv || 1;

          _setAllow(true, message.apiv);

          break;

        case 'hasToSyncData':
          var has = self.hasToSyncData();

          if (message.requestId) {
            port.postMessage({
              action: '_response',
              requestId: message.requestId,
              has: has,
            });
          }

          break;

        case 'addDataToSync':
          syncData(message.category, message.data);

          fvdSynchronizer.Driver.Speeddial.Backup.setHasChanges();

          if (message.requestId) {
            port.postMessage({
              action: '_response',
              requestId: message.requestId,
            });
          }

          break;

        case 'removeSyncData':
          removeSyncData(message.category, message.data);

          if (message.requestId) {
            port.postMessage({
              action: '_response',
              requestId: message.requestId,
            });
          }

          break;

        case 'importFinished':
          fvdSynchronizer.Driver.Speeddial.setFirstSyncAfter('register');
          fvdSynchronizer.Driver.Speeddial.Backup.setHasChanges();

          break;

        case 'getAccountInfo':
          if (!message.requestId) {
            return;
          }

          var result = {};

          fvdSynchronizer.Utils.Async.chain([
            function (chainCallback) {
              fvdSynchronizer.Server.Sync.activityState(function (aState) {
                if (aState !== 'logged') {
                  result.auth = false;
                } else {
                  result.auth = true;
                }

                chainCallback();
              });
            },
            function (chainCallback) {
              if (result.auth) {
                fvdSynchronizer.Server.Sync.userInfo(function (err, info) {
                  result.user = info || {};

                  chainCallback();
                });
              } else {
                chainCallback();
              }
            },
            function () {
              port.postMessage({
                action: '_response',
                requestId: message.requestId,
                info: result,
              });
            },
          ]);

          break;

        case '_response':
          if (message.requestId) {
            var request = fvdSynchronizer.getPendingRequest(message.requestId);

            if (request) {
              fvdSynchronizer.removePendingRequestById(request.id);

              request.callback(message);
            }
          }

          break;
      }
    }

    function connectToSpeeddial(params = {}) {
      if (port != null && allow) {
        return;
      }

      getSpeedDialId((id) => {
        if (!id) {
          return;
        }

        try {
          port = chrome.runtime.connect(id, {
            name: 'synchronizer',
          });

          _setAllow(true);

          port.onMessage.addListener(function (...args) {
            portMessageProcess(...args);
          });

          port.onDisconnect.addListener(function (...args) {
            debugLog(
              'port disconnected',
              chrome.runtime.lastError
                ? chrome.runtime.lastError.message
                : null
            );

            if (params.disconnectCallback) {
              params.disconnectCallback();
            }

            port = null; /* __EVERSYNC_PATCH_PORT_NULL__ */
         _setAllow(false);

            fvdSynchronizer.failAllPendingRequests();

            setTimeout(() => {
              console.info('Recconnect', params.reconnect || 0);

              connectToSpeeddial({
                reconnect: 1 + (params.reconnect || 0),
              });
            }, 100);
          });
        } catch (ex) {
          console.warn(ex);
        }
      });
    }

    function getSpeedDialId(callback) {
      chrome.management.getAll(function (results) {
        var id = null;

        results.forEach(function (extension) {
          if (
            extension.enabled &&
            (extension.name == fvdSpeedDialName ||
              extension.id == fvdSpeedDialId)
          ) {
            id = extension.id;
          }
        });

        callback(id);
      });
    }

    function setMainSyncState(state) {
      mainSyncState = state;
   // __EVERSYNC_PATCH_WORKER_STATE_BRIDGE__
   if (typeof window !== 'object') {
     try {
       console.log('[UI-DIAG] SW broadcast workerState', state, mainSyncProgress && mainSyncProgress.state); chrome.runtime.sendMessage({ __everSyncWorkerState: true, mainState: state, progress: mainSyncProgress }, function () { void chrome.runtime.lastError; }); /* __EVERSYNC_UI_DIAG_SW__ */
     } catch (e) {}
   }
   // __EVERSYNC_PATCH_MAIN_STATE__
   try { if (globalThis.__everSyncPatch && globalThis.__everSyncPatch.setMainSyncActive) globalThis.__everSyncPatch.setMainSyncActive(state === 'sync'); } catch (e) {}

      if (typeof window === 'object') {
        chrome.runtime.sendMessage({
          subject: 'mainSyncStateChange',
        });
      }

      callChangeMainSyncStateListeners();

      if (state == 'sync') {
        fvdSynchronizer.Observer.fireEvent('syncStart', ['SpeedDial']);
      } else if (state == 'nosync') {
        fvdSynchronizer.Observer.fireEvent('syncEnd', ['SpeedDial']);
      }

      fvdSynchronizer.Server.Sync.syncStateRefresh();
    }

    this.totalItemsCount = function (callback) {
      messageToSD(
        {
          action: 'countItems',
        },
        function (response) {
          callback(response.dials + response.groups);
        }
      );
    };

    this.Backup = new (function () {
      var selfBackup = this;

      const AUTOBACKUP_CHECK_INTERVAL = 60 * 1000;
      const MAX_BACKUPS = 30;

      var _ignoreBackupChecker = false;

      var restoreBackupProgress = {
        current: 0,
        max: 0,
      };

      setInterval(function () {
        if (_ignoreBackupChecker || !enabled()) {
          return;
        }

        if (fvdSynchronizer.Server.Sync.isSyncNow()) {
          return;
        }

        var now = new Date().getTime();
        var lastCheckTime = 0;

        lastCheckTime = parseInt(
          fvdSynchronizer.Prefs.get('sd.backup.last_check_time')
        );

        if (
          isNaN(lastCheckTime) ||
          now - lastCheckTime >= AUTOBACKUP_CHECK_INTERVAL
        ) {
          var hasChanges = _b(
            fvdSynchronizer.Prefs.get('sd.backup.has_changes')
          );

          if ((isNaN(lastCheckTime) && hasChanges) || lastCheckTime) {
            fvdSynchronizer.Prefs.set('sd.backup.last_check_time', now);
          }

          if (hasChanges) {
            if (fvdSynchronizer.hasOwnProperty('FileSystem')) {
              selfBackup.make(function (doesBackupMade) {
                fvdSynchronizer.Prefs.set(
                  'sd.backup.has_changes',
                  !doesBackupMade
                );
              });
            } else {
              chrome.runtime.sendMessage({
                action: 'makeBackup',
              });
            }
          }
        }
      }, 1000);

      function enabled() {
        return _b(fvdSynchronizer.Prefs.get('autobackup.enabled'));
      }

      this.getRestoreProgress = function () {
        return restoreBackupProgress;
      };

      this.setRestoreBackupProgress = function (current, max) {
        restoreBackupProgress.current = current;
        restoreBackupProgress.max = max;
      };

      this.setHasChanges = function () {
        fvdSynchronizer.Prefs.set('sd.backup.has_changes', true);
      };

      this.setNotHasChanges = function () {
        fvdSynchronizer.Prefs.set('sd.backup.has_changes', false);
      };

      this.removeOldBackups = function (callback) {
        selfBackup.listBackups(function (backups) {
          backups.sort(function (a, b) {
            return a.time - b.time;
          });

          fvdSynchronizer.Utils.Async.cc(function (ccCallback) {
            if (backups.length <= MAX_BACKUPS) {
              return callback();
            }

            var backup = backups.shift();

            fvdSynchronizer.FileSystem.removeDir(
              'backups/sd/' + backup.dir,
              function () {
                ccCallback();
              }
            );
          });
        });
      };

      this.listBackups = function (callback) {
        var result = [];

        fvdSynchronizer.FileSystem.dirContents('backups/sd', function (dirs) {
          console.log('SpeedDial backups: ', dirs);

          if (!dirs) {
            return callback([]);
          }

          fvdSynchronizer.Utils.Async.arrayProcess(
            dirs,
            function (dir, apc) {
              fvdSynchronizer.FileSystem.read(
                'backups/sd/' + dir + '/info.json',
                function (r, contents) {
                  if (!r) {
                    return apc();
                  }

                  try {
                    var info = JSON.parse(contents);

                    info.dir = dir;

                    result.push(info);
                  } catch (ex) {
                  } finally {
                    apc();
                  }
                }
              );
            },
            function () {
              callback(result);
            }
          );
        });
      };

      this.make = function (callback) {
        var bookmarks = [];

        var nowDate = new Date();

        var backupDir =
          nowDate.getFullYear() +
          '' +
          nowDate.getMonth() +
          '' +
          nowDate.getDay() +
          '' +
          nowDate.getHours() +
          nowDate.getMinutes() +
          '' +
          nowDate.getSeconds();

        var dir = 'backups/sd/' + backupDir;

        var dials = [];
        var groups = [];

        fvdSynchronizer.Utils.Async.chain([
          function (chainCallback) {
            messageToSD(
              {
                action: 'queryGroups',
              },
              function (message) {
                groups = message.list;

                chainCallback();
              }
            );
          },
          function (chainCallback) {
            queryDials(
              {
                fetchOnlyCustomThumb: true,
              },
              function (message) {
                dials = message.list;

                dials.forEach(function (dial) {
                  delete dial.group_global_id;
                });

                chainCallback();
              }
            );
          },
          function (chainCallback) {
            if (fvdSynchronizer.hasOwnProperty('FileSystem')) {
              fvdSynchronizer.FileSystem.makeDir(dir, function () {
                chainCallback();
              });
            } else {
              console.info('FileSystem is', typeof fvdSynchronizer.FileSystem);

              return callback(false);
            }
          },
          function (chainCallback) {
            var data = {
              dials: dials,
              groups: groups,
            };

            fvdSynchronizer.FileSystem.write(
              dir + '/data.json',
              JSON.stringify(data),
              function (result) {
                if (!result) {
                  return callback(result);
                }

                chainCallback();
              }
            );
          },
          function (chainCallback) {
            var info = {
              time: nowDate.getTime(),
              countDials: dials.length,
              countGroups: groups.length,
            };

            fvdSynchronizer.FileSystem.write(
              dir + '/info.json',
              JSON.stringify(info),
              function (result) {
                if (!result) {
                  return callback(result);
                }

                chainCallback();
              }
            );
          },
          function (chainCallback) {
            selfBackup.removeOldBackups(function () {
              chainCallback();
            });
          },
          function () {
            fvdSynchronizer.Observer.fireEvent('sdBackupMaked');

            return callback(true);
          },
        ]);
      };

      this.connectToSpeeddial = function (params) {
        connectToSpeeddial(params);
      };

      this.restore = function (dir, callback) {
        _ignoreBackupChecker = true;

        fvdSynchronizer.Driver.Speeddial.setSyncNow(true);

        this._restore(dir, function (r) {
          fvdSynchronizer.Driver.Speeddial.setSyncNow(false);

          selfBackup.setNotHasChanges();

          _ignoreBackupChecker = false;

          callback(r);
        });
      };

      this._restore = function (dir, callback) {
        console.log('Restore from', 'backups/sd/' + dir + '/data.json');

        restoreBackupProgress.current = 0;

        fvdSynchronizer.FileSystem.read(
          'backups/sd/' + dir + '/data.json',
          function (result, data) {
            var bookmarks = [];

            try {
              data = JSON.parse(data);
            } catch (ex) {
              return callback(false);
            }

            fvdSynchronizer.Utils.Async.chain([
              function (chainCallback) {
                if (apiVersion < 2) {
                  console.info(
                    "speed dial doesn't support the chunked requests, crashes can happen on a large dataset"
                  );

                  return chainCallback();
                }

                uploadTempData(data, function (err, tempDataId) {
                  data = tempDataId;

                  chainCallback();
                });
              },
              function (chainCallback) {
                messageToSD(
                  {
                    action: 'restoreBackup',
                    data: data,
                  },
                  function () {
                    chainCallback();
                  }
                );
              },
              function () {
                messageToSD(
                  {
                    action: 'rebuild',
                  },
                  function () {}
                );

                fvdSynchronizer.Driver.Speeddial.setFirstSyncAfter(
                  'register'
                );

                callback();
              },
            ]);
          }
        );
      };

      this.hasBackup = function (callback) {
        selfBackup.listBackups(function (backups) {
          callback(backups.length > 0);
        });
      };
    })();

    chrome.runtime.onMessage.addListener(function (message) {
      if (
        fvdSynchronizer.hasOwnProperty('FileSystem') &&
        message.action === 'makeBackup'
      ) {
        fvdSynchronizer.Driver.Speeddial.Backup.make(function (
          doesBackupMade
        ) {
          fvdSynchronizer.Prefs.set(
            'sd.backup.has_changes',
            !doesBackupMade
          );
        });
      }
    });

    fvdSynchronizer.addEventListener(
      EventType.LOAD,
      function () {
        connectToSpeeddial();

        setTimeout(function () {
          connectToSpeeddial();
        }, 3e3);

        var HelloWaiter = function (id, callback) {
          function req(_callback) {
            chrome.runtime.sendMessage(
              id,
              {
                action: 'sayHello',
              },
              function (response) {
                if (chrome.runtime.lastError) {
                  return;
                }

                _callback(response);
              }
            );
          }

          var tryNum = 0;

          fvdSynchronizer.Utils.Async.cc(function (ccCallback) {
            if (tryNum > 20) {
              return;
            }

            tryNum++;

            req(function (response) {
              if (response == 'hello') {
                callback();
              } else {
                setTimeout(function () {
                  ccCallback();
                }, 500);
              }
            });
          });
        };

        function installCallback(ext) {
          getSpeedDialId(function (id) {
            if (id) {
              if (id === ext.id) {
                setTimeout(() => {
                  new HelloWaiter(ext.id, function () {
                    connectToSpeeddial();
                  });
                }, 500);
              }
            }
          });
        }

        chrome.management.onEnabled.addListener(installCallback);
        chrome.management.onInstalled.addListener(installCallback);
      },
      false
    );
  };

  fvdSynchronizer.Driver.Speeddial = new Speeddial(fvdSynchronizer);

  fvdSynchronizer.Driver.Speeddial.restoreTemporaryStoredSyncData();

  fvdSynchronizer.Observer.registerCallback(
    'syncEnd',
    function onSyncEnd(driverName) {
      if (
        driverName === 'SpeedDial' &&
        !fvdSynchronizer.Driver.Speeddial.isSyncNow()
      ) {
        fvdSynchronizer.Driver.Speeddial.restoreTemporaryStoredSyncData();
      }
    }
  );
};

export default DriverSpeeddialModule;