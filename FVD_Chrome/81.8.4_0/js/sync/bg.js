import Broadcaster from '../_external/broadcaster.js';
import { Utils, _b } from '../utils.js';
import AppLog from '../log.js';
import { EventType } from '../types.js';

const MemoryCache = {
	_data: {},
	set: function (key, value, timeoutValue) {
		timeoutValue = timeoutValue || 300000;
		const self = this;
		let obj = {};


		if (this._data[key]) {
			try {
				clearTimeout(this._data[key].timeout);
			} catch (ex) {
			}
			obj = this._data[key];
		} else {
			this._data[key] = obj;
		}

		obj.timeout = setTimeout(function () {
			self._data[key] = null;
		}, timeoutValue);
		obj.value = value;
	},
	del: function (key) {
		if (!this._data[key]) {
			return;
		}

		try {
			clearTimeout(this._data[key].timeout);
		} catch (ex) {
		}
		delete this._data[key];
	},
	get: function (key) {
		if (!this._data[key]) {
			return null;
		}

		return this._data[key].value;
	},
};

const TempStore = {
	_key: function (id) {
		return '_tmp_store_' + id;
	},
	pop: function (id) {
		const value = MemoryCache.get(this._key(id));

		if (!value) {
			return null;
		}

		MemoryCache.del(this._key(id));
		return [value[0]].join('');
	},
	append: function (id, value) {
		let currentValue = MemoryCache.get(this._key(id));

		if (!currentValue) {
			currentValue = [];
		}

		currentValue.push(value);
		// save temp data for 10 minutes
		MemoryCache.set(this._key(id), currentValue, 600000);
	},
};

const __FVD_SYNC_BG_PREVIEW_PATCH = '2026-08-17-1'; /* __FVD_DIAG_V1 */
/* __FVD_DIAG_GATE_V1 */
function __fvdDiagEnabledSync() {
try {
var fsd = (typeof window !== 'undefined' && window.fvdSpeedDial) ? window.fvdSpeedDial : globalThis.fvdSpeedDial;
if (!fsd || !fsd.Prefs) return true;
var v = fsd.Prefs.get('sd.create_logs');
if (typeof v === 'undefined' || v === null || v === '') return true;
return !(v === false || v === 'false' || v === '0' || v === 0);
} catch (e) { return true; }
}
const __fvdDiag = { n: 0, page: 0, worker: 0, sum: 0, max: 0 };
function __fvdDiagSaveDial(path, ms) {
	__fvdDiag.n++;
	if (path === 'page') { __fvdDiag.page++; } else { __fvdDiag.worker++; }
	__fvdDiag.sum += ms;
	if (ms > __fvdDiag.max) { __fvdDiag.max = ms; }
	if (__fvdDiag.n >= 25 && __fvdDiagEnabledSync()) {
		console.info('[FVD DIAG] saveDial x' + __fvdDiag.n + ' page=' + __fvdDiag.page + ' worker=' + __fvdDiag.worker + ' avgMs=' + Math.round(__fvdDiag.sum / __fvdDiag.n) + ' maxMs=' + __fvdDiag.max);
		__fvdDiag.n = 0; __fvdDiag.page = 0; __fvdDiag.worker = 0; __fvdDiag.sum = 0; __fvdDiag.max = 0;
	}
}

const __fvdPreviewQueue = {
	active: 0,
	max: 9,
	waiting: [],
	next: function () {
		const self = this;
		if (self.active >= self.max || self.waiting.length === 0) {
			return;
		}
		self.active++;
		const task = self.waiting.shift();
		Promise.resolve()
			.then(function () {
				return task();
			})
			.catch(function (err) {
				console.warn('[FVD patch] preview task error', err);
			})
			.then(function () {
				self.active--;
				self.next();
			});
	},
	add: function (task) {
		this.waiting.push(task);
		this.next();
	}
};

function __fvdSleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

async function __fvdFetchWithTimeout(url, timeoutMs, credentialsMode) {
	const controller = new AbortController();
	const timer = setTimeout(function () {
		controller.abort();
	}, timeoutMs);

	try {
		return await fetch(url, {
			method: 'GET',
			cache: 'no-store',
			credentials: credentialsMode || 'include',
			redirect: 'follow',
			signal: controller.signal
		});
	} finally {
		clearTimeout(timer);
	}
}

async function __fvdBlobToDataUrl(blob) {
	if (typeof FileReader !== 'undefined') {
		return await new Promise(function (resolve, reject) {
			const reader = new FileReader();
			reader.onload = function () {
				resolve(reader.result);
			};
			reader.onerror = function () {
				reject(new Error('FileReader error'));
			};
			reader.readAsDataURL(blob);
		});
	}

	const buffer = await blob.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	let binary = '';
	const chunkSize = 32768;

	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
	}

	const mime = blob.type || 'image/png';
	return 'data:' + mime + ';base64,' + btoa(binary);
}

async function __fvdFetchDialPreviewToDataUrl(url, attempts) {
	if (!url) {
		return null;
	}

	if (url.indexOf('data:') === 0) {
		return url;
	}

	if (url.indexOf('//') === 0) {
		url = 'https:' + url;
	}

	if (url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) {
		return null;
	}

	attempts = attempts || 3;
	let lastError = null;

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const credentialsMode = attempt === 1
				? 'include'
				: (attempt === 2 ? 'same-origin' : 'omit');

			const response = await __fvdFetchWithTimeout(url, 120000, credentialsMode);

			if (!response.ok) {
				throw new Error('HTTP ' + response.status);
			}

			const blob = await response.blob();

			if (!blob || blob.size === 0) {
				throw new Error('empty preview blob');
			}

			return await __fvdBlobToDataUrl(blob);
		} catch (err) {
			lastError = err;
			console.warn('[FVD patch] preview fetch attempt failed', attempt, url, err);

			if (attempt < attempts) {
				await __fvdSleep(700 * attempt);
			}
		}
	}

	console.error('[FVD patch] preview fetch failed permanently', url, lastError);
	return null;
}

function __fvdDialNeedsCustomPreview(dial) {
	return !!(
		dial &&
		dial._previewUrl &&
		(
			dial.thumb_source_type === 'local_file' ||
			dial.get_screen_method === 'manual' ||
			dial.local_file_type === 'manual_crop'
		)
	);
}

function __fvdHasUsableThumb(dial) {
	return !!(
		dial &&
		typeof dial.thumb === 'string' &&
		dial.thumb.length > 0 &&
		dial.thumb.indexOf('filesystem:') !== 0 &&
		dial.thumb.indexOf('blob:') !== 0
	);
}

function __fvdPrepareWorkerDialPreview(dial, callback) {
	try {
		if (!dial) {
			callback(dial);
			return;
		}

		if (dial._previewContent && !__fvdHasUsableThumb(dial)) {
			if (dial._previewContent.indexOf('data:') === 0) {
				dial.thumb = dial._previewContent;
			} else {
				dial.thumb = 'data:image/png;base64,' + dial._previewContent;
			}
			delete dial._previewContent;
		}

		if (!__fvdDialNeedsCustomPreview(dial) || __fvdHasUsableThumb(dial)) {
			delete dial._previewUrl;
			callback(dial);
			return;
		}

		const previewUrl = dial._previewUrl;

		__fvdPreviewQueue.add(async function () {
			const dataUrl = await __fvdFetchDialPreviewToDataUrl(previewUrl, 3);

			if (dataUrl) {
				dial.thumb = dataUrl;
			} else {
				// Graceful fallback: if we cannot download preview inside worker,
				// keep at least remote URL as thumb instead of silently deleting it.
				console.warn('[FVD patch] using remote preview URL as fallback thumb', previewUrl);
				dial.thumb = previewUrl;
				dial.thumb_url = previewUrl;
			}

			dial.need_sync_screen = 0;
			dial.thumb_update_date = Date.now();
			delete dial._previewUrl;
			delete dial._previewContent;

			callback(dial);
		});
	} catch (ex) {
		console.error('[FVD patch] __fvdPrepareWorkerDialPreview error', ex);
		callback(dial);
	}
}
const Sync = function (fvdSpeedDial) {
	// __FVD_THUMB_SWEEP_WORKERHOOK 2026-08-17
	let __thumbSweepInProgress = false; fvdSpeedDial.__thumbSweepAllowed = false; let __syncWriteSeen = false; let __sweepBlockadeUntil = 0; let __sweepPending = false; let __sweepPendingSetAt = 0; let __syncInProgress = false; const __FVD_SWEEP_PENDING_MS = 300000; let __sweepRetryTimer = null; function __scheduleSweepRetry() { if (__sweepRetryTimer) { return; } __sweepRetryTimer = setTimeout(function () { __sweepRetryTimer = null; __runThumbSweep('retry'); }, 5000); } const __FVD_SWEEP_BLOCKADE_MS = 300000; fvdSpeedDial.__isThumbSweepBlocked = function () { return Date.now() < __sweepBlockadeUntil; }; /* __FVD_PATCH_SWEEP_BLOCKADE__ */
	function __runThumbSweep(source) { if (__thumbSweepInProgress) { return; } if (__sweepPending !== true) { console.info("[THUMB SWEEP] denied, source: ", source); return; } if (fvdSpeedDial.__thumbSweepAllowed !== true) { __sweepPending = false; console.info("[THUMB SWEEP] denied (shared lock - sweep already started), source: ", source); return; } if (fvdSpeedDial.__thumbSweepLastStarted && Date.now() - fvdSpeedDial.__thumbSweepLastStarted < 15000) { __sweepPending = false; console.info("[THUMB SWEEP] denied (recent shared run), source: ", source); return; } if (fvdSpeedDial.__isThumbSweepBlocked && fvdSpeedDial.__isThumbSweepBlocked()) { /* __FVD_SWEEP_DEFER_V1 */ var __blkRem = Math.max(0, __sweepBlockadeUntil - Date.now()); console.info("[THUMB SWEEP] blockade active - deferring pending sweep, source: ", source, "ms: ", __blkRem); if (__sweepRetryTimer) { clearTimeout(__sweepRetryTimer); __sweepRetryTimer = null; } __sweepRetryTimer = setTimeout(function () { __sweepRetryTimer = null; __runThumbSweep('post-blockade'); }, Math.max(2000, Math.min(__blkRem + 2000, __FVD_SWEEP_PENDING_MS - 1000))); return; } if (__syncInProgress) { console.info("[THUMB SWEEP] sync in progress - retry later, source: ", source); __scheduleSweepRetry(); return; } if (__sweepPendingSetAt && Date.now() - __sweepPendingSetAt > __FVD_SWEEP_PENDING_MS) { __sweepPending = false; fvdSpeedDial.__thumbSweepAllowed = false; console.info("[THUMB SWEEP] pending expired, source: ", source); return; } __sweepPending = false; fvdSpeedDial.__thumbSweepAllowed = false; fvdSpeedDial.__thumbSweepLastStarted = Date.now(); const SD = fvdSpeedDial && fvdSpeedDial.StorageSD;
		const HCQ = fvdSpeedDial && fvdSpeedDial.HiddenCaptureQueue;
		if (!SD || !SD.dialsRawList || !HCQ) {
			return;
		}
		__thumbSweepInProgress = true;
		try {
			SD.dialsRawList({}, function (list) {
				try {
					list = list || [];
					const targets = list.filter(function (d) {
						if (!d || !d.url) return false;
						if (d.thumb_source_type !== "screen") return false;
						if (d.get_screen_method === "manual") return false;
						if (/^(chrome|chrome-extension|moz-extension):/i.test(d.url)) return false;
						if (HCQ.isEnqueued(d.id)) return false;
						return true;
					});
					console.info("[THUMB SWEEP] source:", source, "total dials:", list.length, "enqueued:", targets.length);
					targets.forEach(function (d) {
						HCQ.capture({
							saveImage: true,
							id: d.id,
							url: d.url,
							type: "speeddial",
						}, null);
					});
				} catch (ex) {
					console.warn("[THUMB SWEEP] error", ex);
				}
				__thumbSweepInProgress = false;
			});
		} catch (ex) {
			console.warn("[THUMB SWEEP] error", ex);
			__thumbSweepInProgress = false;
		}
	}
	/* FVD_SWEEP_SCHEDULER_V1 */
let __thumbSweepScheduleTimer = null;
let __thumbSweepLastRun = 0;
const __FVD_SWEEP_MIN_INTERVAL_MS = 60000;
function __scheduleThumbSweep(source) {
    if (__thumbSweepScheduleTimer) {
        clearTimeout(__thumbSweepScheduleTimer);
    }
    __thumbSweepScheduleTimer = setTimeout(function () {
        __thumbSweepScheduleTimer = null;
        if (__sweepPending !== true && Date.now() - __thumbSweepLastRun < __FVD_SWEEP_MIN_INTERVAL_MS) {
            console.info('[THUMB SWEEP] skipped, recent run, source:', source);
            return;
        }
        __thumbSweepLastRun = Date.now();
        __runThumbSweep(source);
    }, 2000);
}
// FVD_PATCH_SWEEP_EXTERNAL_GATE
(function installSweepGate(tries) {
	try {
		if (fvdSpeedDial && typeof fvdSpeedDial.__runThumbSweep === 'function' && !fvdSpeedDial.__sweepGateWrapped) {
			const origExternal = fvdSpeedDial.__runThumbSweep;
			fvdSpeedDial.__runThumbSweep = function (source) {
				if (fvdSpeedDial.__thumbSweepAllowed !== true) {
					console.info('[THUMB SWEEP] external sweep denied, source: ', source);
					return;
				}
				return origExternal.apply(this, arguments);
			};
			fvdSpeedDial.__sweepGateWrapped = true;
			console.info('[THUMB SWEEP] external sweep gated');
		} else if ((tries || 0) < 120) {
			setTimeout(function () { installSweepGate((tries || 0) + 1); }, 1000);
		}
	} catch (e) {}
})(0);
const { Prefs, UserInfoSync } = fvdSpeedDial;
	const fvdSynchronizerName = 'EverSync';
	const fvdSynchronizerIds = [
		// Chrome Webstore EverSync ID
		'iohcojnlgnfbmjfjfkbhahhmppcggdog',
		// Opera addons EverSync ID
		'ffhogmjbkahkkpjpjmeppoegnjhpopmc',
	];

	let active = false;
	const port = null;
	const responsePorts = {
		['workerPort']: {
			active: false,
			port: null,
			pendingRequests: [],
		},
	};
	let lastTransactionId = 0;
	let lastRequestId = 0;
	const TRANSACTION_SNAPSHOT_STORAGE_PREFIX = '__eversync_txn_snapshot_';
	const pendingRequests = [];
	const PENDING_REQUESTS_TIMEOUT = 1000 * 5 * 60; // max life time of pending requests

	function setActivity(newActivity, currentPort) {
		currentPort.active = newActivity;
		active = newActivity;

		if (typeof window === 'object') {
			Broadcaster.sendMessage({ action: 'sync:activitystatechanged' });
		}
	}

	this.clearExpiredRequests = () => {
		const now = new Date().getTime();

		Object.entries(responsePorts).forEach(function (key, portData) {
			const ids = [];

			portData.pendingRequests.forEach(function (request) {
				if (now - request.time >= PENDING_REQUESTS_TIMEOUT) {
					ids.push(request.id);
				}
			});

			ids.forEach(function (id) {
				removePendingRequest(key, id);
			});
		});
	};

	function removePendingRequest(currentPortKey, id) {
		let index = -1;

		for (let i = 0; i !== responsePorts[currentPortKey].pendingRequests.length; i++) {
			if (responsePorts[currentPortKey].pendingRequests[i].id === id) {
				index = i;
				break;
			}
		}

		if (index !== -1) {
			responsePorts[currentPortKey].pendingRequests.splice(index, 1);
		}
	}

	function requestWithCallback(currentPort, data, callback) {
		if (!currentPort?.port || (!currentPort?.port && !responsePorts['workerPort']?.port)) {
			return callback(null);
		}
		
		lastRequestId++;
		data.requestId = lastRequestId;
		
		const toRequestPort = currentPort || responsePorts['workerPort'];
		
		if (!toRequestPort.pendingRequests) {
			toRequestPort.pendingRequests = [];
		}
		
		toRequestPort.pendingRequests.push({
			id: lastRequestId,
			callback: callback,
			time: new Date().getTime(),
		});

		try {
			toRequestPort.port.postMessage(data);
			return true;
		} catch (ex) {
			console.warn(ex);
			return callback(null);
		}
	}

	function getCurrentPortByRequestId(requestId) {
		// eslint-disable-next-line max-len
		const currentPortKey = Object.keys(responsePorts).find((portDataKey) => responsePorts[portDataKey].pendingRequests.find((request) => request.id === requestId));

		if (currentPortKey && responsePorts[currentPortKey].active) {
			return currentPortKey;
		}

		const withoutRequestIdPortKey = Object.keys(responsePorts).find((portKey) => responsePorts[portKey].active);
		return withoutRequestIdPortKey || responsePorts['workerPort'];
	}

	function callRequestResponse(requestId, data) {
		const currentPortKey = getCurrentPortByRequestId(requestId);

		if (responsePorts[currentPortKey]) {
			responsePorts[currentPortKey].pendingRequests.forEach(function (request) {
				if (request.id === requestId) {
					request.callback(data);
				}
			});
		}


		removePendingRequest(currentPortKey, requestId);
	}

	this.isActive = function () {
		return Object.values(responsePorts).some((port) => port.active);
	};
	this.isSyncInProgress = function () { return __syncInProgress === true; };

	this.hasDataToSync = function (requestId, callback) {
		const currentPortKey = getCurrentPortByRequestId(requestId);

		let currentPort = null;

		if (responsePorts[currentPortKey] && responsePorts[currentPortKey].active) {
			currentPort = responsePorts[currentPortKey];
		} else {
			const activePort = Object.values(responsePorts).find((acPort) => acPort.active);

			if (activePort) {
				currentPort = activePort;
			} else {
				currentPort = responsePorts['workerPort'];
			}
		}

		requestWithCallback(
			currentPort,
			{
				action: 'hasToSyncData',
			},
			function (response) {
				callback(response && response.has);
			}
		);
	};

	this.getAccountInfo = function (currentPort, callback) {
		requestWithCallback(currentPort, {
			action: 'getAccountInfo',
		},
		function (response) {
			callback(response && response.info);
		}
		);
	};

	this.groupSyncChanged = function (groupId, requestId, callback) {
		// need sync group as new and all it dials.
		fvdSpeedDial.StorageSD.getGroup(groupId, function (group) {
			if (group.sync === 1) {
				Utils.Async.chain([
					function (chainCallback) {
						// remove data from sync
						Sync.removeSyncData(
							requestId,
							{
								category: ['deleteGroups'],
								data: group.global_id,
							},
							function () {
								chainCallback();
							}
						);
					},

					function (chainCallback) {
						fvdSpeedDial.StorageSD.listDialsIdsByGroup(groupId, function (dials) {
							Utils.Async.arrayProcess(
								dials,
								function (dial, arrayProcessCallback) {
									Sync.removeSyncData(
										requestId,
										{
											category: ['deleteDials'],
											data: dial.global_id,
										},
										arrayProcessCallback
									);
								},
								function () {
									chainCallback();
								}
							);
						});
					},

					function (chainCallback) {
						// add data to sync
						// need to sync all groups
						fvdSpeedDial.StorageSD.groupsRawList({}, function (groups) {
							Utils.Async.arrayProcess(
								groups,
								function (group, arrayProcessCallback) {
									if (group.sync === 1) {
										Sync.addDataToSync(
											{
												category: ['groups', 'newGroups'],
												data: group.global_id,
												syncAnyWay: true,
											},
											arrayProcessCallback,
											requestId
										);
									} else {
										arrayProcessCallback();
									}
								},
								function () {
									chainCallback();
								}
							);
						});
					},
					function (chainCallback) {
						Sync.addDataToSync(
							{
								category: ['specialActions'],
								data: 'merge_group:' + groupId + ':' + group.global_id,
							},
							chainCallback,
							requestId
						);
					},
					function () {
						if (callback) {
							callback();
						}
					},
				]);
			} else if (group.sync === 0) {
				Utils.Async.chain([
					function (chainCallback) {
						// remove data from sync
						Sync.removeSyncData(
							requestId,
							{
								category: ['groups', 'newGroups'],
								data: group.global_id,
							},
							chainCallback
						);
					},

					function (chainCallback) {
						Sync.removeSyncData(
							requestId,
							{
								category: ['specialActions'],
								data: 'merge_group:' + groupId + ':' + group.global_id,
							},
							chainCallback
						);
					},

					function (chainCallback) {
						// add data to sync
						Sync.addDataToSync(
							{
								category: ['deleteGroups'],
								data: group.global_id,
								syncAnyWay: true,
							},
							chainCallback,
							requestId
						);
					},

					function (chainCallback) {
						fvdSpeedDial.StorageSD.listDialsIdsByGroup(groupId, function (dials) {
							Utils.Async.arrayProcess(
								dials,
								function (dial, arrayProcessCallback) {
									Sync.addDataToSync(
										{
											category: ['deleteDials'],
											data: dial.global_id,
											syncAnyWay: true,
										},
										arrayProcessCallback,
										requestId
									);
								},
								chainCallback
							);
						});
					},

					function () {
						if (typeof window === 'object') {
							chrome.runtime.sendMessage({
								message: 'displayNoSyncGroupAlert',
								needActiveTab: true,
							});
						}

						if (callback) {
							callback();
						}
					},
				]);
			}
		});
	};

	this.syncAddonOptionsUrl = function (callback) {
		getSynchronizerId(function (id) {
			let url = null;

			if (id) {
				url = 'chrome-extension://' + id + '/options.html';
			}

			callback(url);
		});
	};

	this.syncAddonExists = function (callback) {
		getSynchronizerId(function (id) {
			let exists = false;

			if (id) {
				exists = true;
			}

			callback(exists);
		});
	};


	this.removeSyncData = function (requestId, params, callback) {
		let category = params.category;

		const cuppertPortKey = getCurrentPortByRequestId(requestId);
		const currentPort = responsePorts[cuppertPortKey];

		if (!currentPort.active) {
			if (callback) {
				callback();
			}

			return;
		}

		if (typeof category === 'string') {
			category = [category];
		}

		requestWithCallback(
			currentPort,
			{
				action: 'removeSyncData',
				data: params.data,
				category: category,
			},
			function () {
				if (callback) {
					callback();
				}
			}
		);
	};

	this.importFinished = () => {
		if (!port) {
			return;
		}

		try {
			port.postMessage({
				action: 'importFinished',
			});
		} catch (ex) {
			// port gone, nothing to notify
		}
	};

	this.addDataToSync = function (params, callback, requestId) {
		let category = params.category;
		const _data = params.data;
		const currentPortKey = getCurrentPortByRequestId(requestId);
		let currentPort = currentPortKey !== 'workerPort' ? responsePorts[currentPortKey] : null;

		if (!currentPort) {
			const windowScopedPortKey = Object.keys(responsePorts).find((portKey) => responsePorts[portKey].active && portKey !== 'workerPort');

			if (windowScopedPortKey) {
				currentPort = responsePorts[windowScopedPortKey];
			} else {
				currentPort = responsePorts['workerPort'];
			}
		}

		if (!currentPort?.active) {
			if (callback) {
				callback();
			}

			return;
		}

		let data = null;

		if (typeof category === 'string') {
			category = [category];
		}

		Utils.Async.chain([
			function (chainCallback) {
				if (params.translate) {
					if (params.translate === 'group') {
						fvdSpeedDial.StorageSD.groupGlobalId(_data, function (globalId) {
							data = globalId;

							chainCallback();
						});
					} else if (params.translate === 'dial') {
						fvdSpeedDial.StorageSD.dialGlobalId(_data, function (globalId) {
							data = globalId;

							chainCallback();
						});
					} else {
						console.log('Undefined translate', params.translate);
					}
				} else {
					data = _data;
					chainCallback();
				}
			},
			function (chainCallback) {
				if (params.syncAnyWay) {
					chainCallback();
					return;
				}

				chainCallback();
			},

			function () {
				requestWithCallback(
					currentPort,
					{
						action: 'addDataToSync',
						data: data,
						category: category,
					},
					function () {
						if (callback) {
							callback();
						}
					}
				);
			},
		]);
	};

	this.startSync = function (type, requestId, callback) {
		type = type || 'main';

		const currentPortKey = getCurrentPortByRequestId(requestId);

		const currentPort = responsePorts[currentPortKey] || Object.values(responsePorts)[Object.values(responsePorts).length - 1];

		requestWithCallback(
			currentPort,
			{
				action: 'startSync',
				type: type,
			},
			function (result) {
				if (callback) {
					callback(result?.state);
				}
			}
		);
	};

	function clearGroupsAndDials(callback) {
		Utils.Async.chain([
			function (chainCallback) {
				fvdSpeedDial.StorageSD.getSyncGroupsList(1, function (groups) {
					fvdSpeedDial.StorageSD.clearDials(
						function () {
							chainCallback();
						},
						{ key: 'group_id', arr: groups }
					);
				});
			},
			function (chainCallback) {
				fvdSpeedDial.StorageSD.clearGroups(
					function () {
						chainCallback();
					},
					{ key: 'sync', val: 1 }
				);
			},
			callback,
		]);
	}

	function getStorage(message, callback) {
		callback(fvdSpeedDial.StorageSD);
	}

	// transactions

	function createTransaction(callback) {
		lastTransactionId++;
		const id = lastTransactionId;
		const storageKey = TRANSACTION_SNAPSHOT_STORAGE_PREFIX + id;

		fvdSpeedDial.StorageSD.fullDump(function (err, data) {
			if (err) {
				console.error('Fail to create transaction snapshot', err);
				callback(id);
				return;
			}

			// Persisted to chrome.storage.local (not a plain in-memory object):
			// MV3 service workers can be killed and restarted by Chrome at any
			// time (e.g. while waiting on a slow/blocked server response like a
			// sync-lock "please wait" reply). An in-memory snapshot dies with
			// the worker, so a later rollbackTransaction() silently finds
			// nothing to restore and the just-cleared local dials/groups are
			// lost for good. Persisting it here survives that restart.
			chrome.storage.local.set({ [storageKey]: data }, function () {
				if (chrome.runtime.lastError) {
					console.error('Fail to persist transaction snapshot', chrome.runtime.lastError);
				}

				callback(id);
			});
		});
	}

	function commitTransaction(id, callback) {
		chrome.storage.local.remove(TRANSACTION_SNAPSHOT_STORAGE_PREFIX + id, function () {
			callback();
		});
	}

	function rollbackTransaction(id, callback) {
		const storageKey = TRANSACTION_SNAPSHOT_STORAGE_PREFIX + id;

		chrome.storage.local.get(storageKey, function (result) {
			const snapshot = result ? result[storageKey] : null;

			if (!snapshot) {
				chrome.storage.local.remove(storageKey, function () {
					callback();
				});
				return;
			}

			fvdSpeedDial.StorageSD.restoreTablesDataInOneTransaction(
				snapshot,
				function () {
					chrome.storage.local.remove(storageKey, function () {
						callback();
					});
				},
				null,
				true
			);
		});
	}

	function processPortMessage(message, currentPort) {
		const { StorageSD, UserInfoSync, localStorage } = fvdSpeedDial;

		try {
			processPortMessageInner(message, currentPort, StorageSD, UserInfoSync, localStorage);
		} catch (ex) {
			// An uncaught exception here used to kill the whole service worker
			// (e.g. a case running before storage finished initializing right
			// after a fresh worker start), which drops the port and sends
			// EverSync into an endless reconnect loop, silently losing whatever
			// was mid-sync. Log it and keep the worker alive instead.
			console.error('processPortMessage failed for action', message && message.action, ex);
		}
	}

	function processPortMessageInner(message, currentPort, StorageSD, UserInfoSync, localStorage) {
		 if (["saveDial","saveGroup","restoreBackup","moveDial","clearGroupsAndDials","removeDialsNotInList","removeGroupsNotInList","mergeUpdateCollisedDial","mergeUpdateCollisedGroup"] /* __FVD_PATCH_SWEEP_NO_UPDATEMASS__ */.indexOf(message.action) !== -1) { __syncWriteSeen = true; } switch (message.action) {
			case 'saveTempData':
				const id = message.data.id;
				const value = message.data.value;

				TempStore.append(id, value);
				// console.log('Got a chunk', id);
				sendResponse(currentPort, message.requestId, {
					id: id,
				});
				break;

			// transactions
			case 'startTransaction':
				createTransaction(function (id) {
					sendResponse(currentPort, message.requestId, {
						transId: id,
					});
				});
				break;

			case 'rollbackTransaction': fvdSpeedDial.__thumbSweepAllowed = false;
				rollbackTransaction(message.transId, function () {
					sendResponse(currentPort, message.requestId, {});
				});
				break;

			case 'commitTransaction':
				commitTransaction(message.transId, function () {
					sendResponse(currentPort, message.requestId, {});
				});
				break;

			case 'syncStartNotification': AppLog.info('sync starts'); __syncInProgress = true; __syncWriteSeen = false; __sweepBlockadeUntil = 0; /* __FVD_SWEEP_BLOCKADE_DISARM_ON_SYNC_V1 */ Broadcaster.sendMessage({ action: 'syncStartNotification' }); break;

			case 'syncEndNotification':
				AppLog.info('sync ends'); if (message.syncType === 'overwrite-local' && __syncWriteSeen) { __sweepPending = true; __sweepPendingSetAt = Date.now(); fvdSpeedDial.__thumbSweepAllowed = true; console.info("[THUMB SWEEP] overwrite-local with local writes - sweep pending"); } else { console.info("[THUMB SWEEP] sync type " + (message.syncType || 'unknown') + " - sweep not scheduled"); } __syncInProgress = false; __syncWriteSeen = false; /* __FVD_PATCH_SWEEP_DIRECTION_GATE__ */
 			if (message.syncType === 'overwrite-server') { __sweepBlockadeUntil = Date.now() + __FVD_SWEEP_BLOCKADE_MS; console.info("[THUMB SWEEP] upload-only sync - capture blockade armed"); } /* __FVD_PATCH_SWEEP_BLOCKADE_ARM__ */
				// After EverSync import, positions may be strings or have gaps/duplicates.
				// Re-number every group's dials 1..N numerically so the order is stable.
				if (fvdSpeedDial && fvdSpeedDial.StorageSD) {
					fvdSpeedDial.StorageSD.groupsRawList({}, function (groups) {
						if (!groups || !groups.length) return;
						let idx = 0;
						function fixNext() {
							if (idx >= groups.length) return;
							const gid = groups[idx].id;
							idx++;
							fvdSpeedDial.StorageSD.syncFixDialsPositions(gid, fixNext);
						}
						fixNext();
					});
				}
				Broadcaster.sendMessage({ action: 'syncEndNotification', syncDirection: message.syncDirection || 'unknown' });
			__scheduleThumbSweep('syncEnd');
break;

			case 'clearGroupsAndDials':
				AppLog.info('sync clear groups and dials');
				clearGroupsAndDials(function () {
					sendResponse(currentPort, message.requestId, {});
				});
				break;

			case 'toSyncDataChanged':
				Broadcaster.sendMessage({
					action: 'sync:syncdatachanged',
				});

				break;

			case 'restoreBackup':
				AppLog.info('restore backup');

				if (typeof message.data === 'string') {
					// got a temp data id
					message.data = JSON.parse(TempStore.pop(message.data));
				}

				StorageSD.restoreTablesData(
					message.data,
					function () { fvdSpeedDial.__thumbSweepAllowed = true; console.info("[THUMB SWEEP] restore completed - sweep allowed");
						sendResponse(currentPort, message.requestId, {});
					},
					function (current, max) {
						const currentPortKey = getCurrentPortByRequestId(message.requestId);

						let currentPort = null;

						if (responsePorts[currentPortKey] && responsePorts[currentPortKey].active) {
							currentPort = responsePorts[currentPortKey];
						} else {
							const activePort = Object.values(responsePorts).find((rPort) => rPort.active);

							if (activePort) {
								currentPort = activePort;
							}
						}

						

						if (currentPort) {
							try {
								currentPort.port.postMessage({
									action: 'restoreBackupProgress',
									current: current,
									max: max,
								});
							} catch (ex) {
								currentPort.port = null;
							}
						}
					}
				);
				break;

			case 'queryGroups':
				if (!message.ignoreNoSync) {
					const whereSync = 'sync=1';

					if (message.where) {
						message.where.push(whereSync);
					} else {
						message.where = [whereSync];
					}
				}

				StorageSD.groupsRawList(message, function (list) {
					sendResponse(currentPort, message.requestId, { list: list });
				});
				break;

			case 'queryDialThumb':
				StorageSD.getDialThumb(message.global_id, function (thumb) {
					sendResponse(currentPort, message.requestId, {
						thumb: thumb,
					});
				});
				break;

			case 'queryDialThumbsBatch':
				StorageSD.getDialThumbsBatch(message.global_ids, function (thumbs) {
					sendResponse(currentPort, message.requestId, {
						thumbs: thumbs,
					});
				});
				break;

			case 'queryDials':
				StorageSD.getSyncGroupsList(1, function (groups) {
					if (!message.ignoreNoSync) {
						message.whereIn = {
							key: 'group_id',
							arr: groups,
						};
					}

					fvdSpeedDial.StorageSD.dialsRawList(message, function (list) {
						sendResponse(currentPort, message.requestId, {
							list: list,
						});
					});
				});

				break;

			case 'mergeUpdateCollisedGroup':
				StorageSD.groupUpdate(
					message.clientGroup.id,
					{
						global_id: message.serverGroup.global_id,
					},
					function () {
						sendResponse(currentPort, message.requestId);
					}
				);
				break;

			case 'mergeUpdateCollisedDial':
				StorageSD.updateDial(
					message.clientDial.rowid,
					{
						global_id: message.serverDial.global_id,
					},
					function () {
						StorageSD.dialCanSync(message.serverDial.global_id, function (can) {
							if (can) {
								StorageSD.syncSaveDial(message.serverDial, function (saveInfo) {
									sendResponse(currentPort, message.requestId, { saveInfo: saveInfo });
								});
							} else {
								sendResponse(currentPort, message.requestId, { saveInfo: null });
							}
						});
					}
				);
				break;

			case 'saveGroup':
				StorageSD.groupCanSync(message.group.global_id, function (can) {
					if (can) {
						StorageSD.syncSaveGroup(message.group, function () {
							sendResponse(currentPort, message.requestId);
						});
					} else {
						sendResponse(currentPort, message.requestId);
					}
				});
				break;

			case 'moveDial':
				StorageSD.moveDial(message.id, message.groupId, function () {
					sendResponse(currentPort, message.requestId);
				});
				break;

			case 'saveDial': {
const __diagT0 = Date.now(); /* __FVD_DIAG_V1 */
const originalDial = message.dial || {};
chrome.runtime.sendMessage({
action: 'windowScopeSaveDial',
dial: originalDial,
}, function (saveInfo) {
__fvdDiagSaveDial((chrome.runtime.lastError || typeof saveInfo === 'undefined') ? 'worker' : 'page', Date.now() - __diagT0);
if (chrome.runtime.lastError || typeof saveInfo === 'undefined') {
			const dialCopy = Object.assign({}, originalDial);

			__fvdPrepareWorkerDialPreview(dialCopy, function (preparedDial) {
				try {
					StorageSD.syncSaveDial(preparedDial, function (fallbackSaveInfo) {
						sendResponse(currentPort, message.requestId, {
							saveInfo: fallbackSaveInfo || {},
						});
					});
				} catch (ex) {
					console.error('[FVD patch] syncSaveDial failed', ex);
					sendResponse(currentPort, message.requestId, {
						error: true,
						reason: 'save_failed',
					});
				}
			});
		} else {
			sendResponse(currentPort, message.requestId, {
				saveInfo: saveInfo,
			});
		}
	});

	return true;
}
		case 'updateMass':
				// console.log('OBtained message', message);
				StorageSD.syncUpdateMass(message.globalIds, message.data, function () {
					if (message.requestId) {
						sendResponse(currentPort, message.requestId, {});
					}
				});
				break;

			case 'removeGroupsNotInList':
				const notRemoveGroups = message.groupsIds;

				StorageSD.syncRemoveGroups(notRemoveGroups, function (removed) {
					sendResponse(currentPort, message.requestId, {
						removed: removed,
					});
				});
				break;

			case 'removeDialsNotInList':
				const notRemoveDials = message.dialsIds;

				StorageSD.syncRemoveDials(notRemoveDials, function (removeInfo) {
					sendResponse(currentPort, message.requestId, { removeInfo: removeInfo });
				});
				break;

			case 'fixGroupsPositions':
				StorageSD.syncFixGroupsPositions(function () {
					sendResponse(currentPort, message.requestId);
				});
				break;

			case 'fixDialsPositions':
				StorageSD.syncFixDialsPositions(message.groupId, function () {
					sendResponse(currentPort, message.requestId);
				});
				break;

			case 'rebuild':
				if (typeof window === 'object') {
					chrome.runtime.sendMessage({
						action: 'forceRebuild',
					});
				}
				
				// need to refresh default group id
				const activeGroupId = Prefs.get('sd.default_group');

				if (activeGroupId && activeGroupId > 0) {
					fvdSpeedDial.StorageSD.groupExistsById(activeGroupId, function (exists) {
						if (!exists) {
							fvdSpeedDial.StorageSD.resetDefaultGroupId();
						}
					});
				}

				fvdSpeedDial.ContextMenu.rebuild();
				break;

			case 'syncAllGroupContents':
				StorageSD.syncGetGroupId(message.groupGlobalId, function (id) {
					if (id) {
						new Sync().groupSyncChanged(id, message.requestId, function () {
							sendResponse(currentPort, message.requestId);
						});
					} else {
						sendResponse(currentPort, message.requestId);
					}
				});
				break;

			case 'addGroupDialsToSync':
				Utils.Async.chain([
					function (chainCallback) {
						Sync.addDataToSync(
							{
								category: ['groups'],
								data: message.groupGlobalId,
							},
							chainCallback,
							message.requestId
						);
					},
					function () {
						fvdSpeedDial.StorageSD.syncGetGroupId(message.groupGlobalId, function (groupId) {
							fvdSpeedDial.StorageSD.listDialsIdsByGroup(groupId, function (dials) {
								Utils.Async.arrayProcess(
									dials,
									function (dial, arrayProcessCallback) {
										Sync.addDataToSync(
											{
												category: ['dials', 'newDials'],
												data: dial.global_id,
											},
											arrayProcessCallback,
											message.requestId
										);
									},
									function () {
										sendResponse(currentPort, message.requestId);
									}
								);
							});
						});
					},
				]);
				break;

			case 'setGroupSync':
				StorageSD.syncGetGroupId(message.global_id, function (groupId) {
					if (!groupId) {
						sendResponse(currentPort, message.requestId);
					} else {
						StorageSD.groupUpdate(
							groupId,
							{
								sync: message.value,
							},
							function () {
								sendResponse(currentPort, message.requestId);
							}
						);
					}
				});
				break;

			case 'dialCanSync':
				StorageSD.dialCanSync(message.global_id, function (can) {
					sendResponse(currentPort, message.requestId, { can: can });
				});
				break;

			case 'countItems':
				const result = {};

				Utils.Async.chain([
					function (chainCallback) {
						StorageSD.countDials(function (countDials) {
							result.dials = countDials;
							chainCallback();
						});
					},
					function (chainCallback) {
						StorageSD.groupsCount(function (countGroups) {
							result.groups = countGroups;
							chainCallback();
						});
					},
					function () {
						sendResponse(currentPort, message.requestId, result);
					},
				]);
				break;

			case 'localStorage.get':
				const fvdSpeedDialLastUpdateTime = localStorage.getItem(message.data.key);
				sendResponse(currentPort, message.requestId, { result: fvdSpeedDialLastUpdateTime });
				break;

			case 'localStorage.set':
				localStorage.setItem(message.data.key, message.data.value);
				break;

			case 'Deny.dump':
				StorageSD.denyList(function (result) {
					sendResponse(currentPort, message.requestId, { result: result });
				});
				break;

			case 'Deny.set':
				StorageSD.clearDeny(function () {
					Utils.Async.arrayProcess(
						message.data,
						function (deny, next) {
							StorageSD.deny(deny.type, deny.sign, function () {
								next();
							});
						},
						function () {
						}
					);
				});
				break;

			case 'Prefs.dump':
				Prefs.dump(dump => {
					sendResponse(currentPort, message.requestId, { result: dump });
				});
				break;
			case 'Prefs.set':
				Prefs.set(message.data.key, message.data.val);
				break;
			case 'reloadAllPages':
				Utils.reloadAllPages(message.timeout || 0);
				break;

			case 'miscItemGet':
				chrome.runtime.sendMessage({
					action: 'windowScopeMiscItemGet',
					data: {
						key: message.data.key,
					},
				}, function ({ result }) {
					sendResponse(currentPort, message.requestId, { result });
				});
				return true;

				break;

			case 'miscItemSet':
				chrome.runtime.sendMessage({
					action: 'windowScopeMiscItemSet',
					data: {
						key: message.data.key,
						val: message.data.val,
					},
				});

				return true;

				break;
			case '_response':
				callRequestResponse(message.requestId, message);
				break;
			
			case 'sync:logout':
				UserInfoSync.triggerOnLogout();
				break;
			case 'sync:login':
				UserInfoSync.triggerOnLogin(message.data);
				break;
		}
	}

	function sendResponse(currentPort, requestId, message) {
		message = message || {};

		message.action = '_response';
		message.requestId = requestId;

		// An async operation (e.g. fetching a thumbnail) can finish after the
		// port already disconnected. Calling postMessage on a dead port throws
		// synchronously -- left unguarded, that's an uncaught exception that
		// crashes/restarts the whole service worker mid-sync.
		if (!currentPort || !currentPort.port) {
			return;
		}

		try {
			currentPort.port.postMessage(message);
		} catch (ex) {
			currentPort.port = null;
		}
	}

	function getSynchronizerId(callback) {
		chrome.management.getAll(function (results) {
			let id = null;

			results.forEach(function (extension) {
				if (
					extension.enabled
					&& (extension.name.includes(fvdSynchronizerName) || fvdSynchronizerIds.indexOf(extension.id) >= 0)
				) {
					id = extension.id;
				}
			});
			callback(id);
		});
	}

	const that = this;

	chrome.runtime.onConnectExternal.addListener(function (_p) {


		if (!_p.sender) {
			return;
		}


		if (_p?.sender?.documentId && !responsePorts[_p?.sender?.documentId]) {
			responsePorts[_p?.sender?.documentId] = {
				port: null,
				active: false,
				pendingRequests: [],
			};
		}

		const currentPort = responsePorts[_p?.sender?.documentId || 'workerPort'];

		currentPort.port = _p;
		currentPort.port.onMessage.addListener((message) => processPortMessage(message, currentPort, responsePorts, _p?.sender?.documentId));
		currentPort.port.onDisconnect.addListener(function () {
			setActivity(false, currentPort);
			// currentPort.active = false;
		});

		if (fvdSpeedDial.PowerOff.isHidden()) {
			//do not send activate message to synchronizer if speed dial is locked
			return;
		}

		try {
			currentPort.port.postMessage({
				action: 'activate',
				apiv: 2,
			});
		} catch (ex) {
			currentPort.port = null;
			return;
		}

		if (!_b(Prefs.get('sd.synced_after_install'))) {
			console.info('needInitialSync');
			Prefs.set('sd.synced_after_install', true);
			try {
				currentPort.port.postMessage({
					action: 'needInitialSync',
				});
			} catch (ex) {
				currentPort.port = null;
				return;
			}
		}

		setActivity(true, currentPort);
		currentPort.active = true;

		that.getAccountInfo(currentPort, function (info) {
			UserInfoSync.setUserInfo(info);
			Prefs.set('sd.enable_search', UserInfoSync.getIsSearchEnable());
		});
	});

	

	Broadcaster.onMessage.addListener(function (msg, sender, sendResponse) {
		if (port) {
			try {
				if (msg.isHidden) {
					port.postMessage({
						action: 'deactivate',
					});
				} else {
					port.postMessage({
						action: 'activate',
					});
				}
			} catch (ex) {
				// console.warn(ex);
			}
		}
	});
};

export default Sync;