/* EverSync keepalive offscreen */
try {
  setInterval(function () {
    try {
      chrome.runtime.sendMessage({ __everSyncKeepAlivePing: true, ts: Date.now() }, function () {
        void chrome.runtime.lastError;
      });
    } catch (e) {}
  }, 15000);
} catch (e) {}