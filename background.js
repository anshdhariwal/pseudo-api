var ai = {
  ready: false,
  provider: 'gemini'
};

var port = null;
var pending = {};

chrome.runtime.onConnect.addListener(function (p) {
  if (p.name !== 'pseudo-api-panel') return;

  port = p;

  p.onDisconnect.addListener(function () {
    port = null;
    ai.ready = false;
  });

  p.onMessage.addListener(function (msg) {
    if (msg.action === 'AI_READY') {
      ai.ready = true;
      ai.provider = msg.provider || ai.provider;
      return;
    }

    if (msg.action === 'AI_ANSWER') {
      var cb = pending[msg.reqid];
      if (cb) {
        delete pending[msg.reqid];
        cb({ answer: msg.answer });
      }
      return;
    }

    if (msg.action === 'AI_ERROR') {
      var ecb = pending[msg.reqid];
      if (ecb) {
        delete pending[msg.reqid];
        ecb({ error: msg.error });
      }
      return;
    }
  });
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendresponse) {

  if (msg.action === 'GET_STATUS') {
    sendresponse({ ready: ai.ready, provider: ai.provider });
    return;
  }

  if (msg.action === 'ASK_AI') {
    if (!ai.ready || !port) {
      sendresponse({ error: 'ai not ready' });
      return;
    }

    var id = Date.now() + '_' + Math.random().toString(36).slice(2);
    pending[id] = sendresponse;

    port.postMessage({
      action: 'ASK',
      question: msg.question,
      reqid: id
    });

    setTimeout(function () {
      if (pending[id]) {
        delete pending[id];
        sendresponse({ error: 'timeout' });
      }
    }, 90000);

    return true;
  }

});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function () {});

chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendresponse) {
  if (msg.action === 'GET_STATUS') {
    sendresponse({ ready: ai.ready, provider: ai.provider });
    return;
  }

  if (msg.action === 'ASK_AI') {
    if (!ai.ready || !port) {
      sendresponse({ error: 'ai not ready' });
      return;
    }

    var id = Date.now() + '_' + Math.random().toString(36).slice(2);
    pending[id] = sendresponse;

    port.postMessage({ action: 'ASK', question: msg.question, reqid: id });

    setTimeout(function () {
      if (pending[id]) {
        delete pending[id];
        sendresponse({ error: 'timeout' });
      }
    }, 90000);

    return true;
  }
});
