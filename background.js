var ai = {
  tabid: null,
  ready: false,
  provider: 'gemini'
};

var urls = {
  gemini:  'https://gemini.google.com/app',
  claude:  'https://claude.ai/new',
  chatgpt: 'https://chatgpt.com/',
  gmode:   'https://www.google.com/search?udm=50'
};

var pending = {};
var opening = false;

function openaitab(provider) {
  var url = urls[provider];
  if (!url || opening) return;

  opening = true;
  ai.provider = provider;
  ai.ready = false;

  chrome.tabs.create({ url: url, active: false }, function (tab) {
    ai.tabid = tab.id;
    opening = false;
  });
}

chrome.tabs.onRemoved.addListener(function (tabid) {
  if (tabid === ai.tabid) {
    ai.tabid = null;
    ai.ready = false;
  }
});

chrome.tabs.onUpdated.addListener(function (tabid, info) {
  if (tabid === ai.tabid && info.status === 'loading') {
    ai.ready = false;
  }
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendresponse) {

  if (msg.action === 'OPEN') {
    openaitab(msg.provider || 'gemini');
    sendresponse({ ok: true });
    return;
  }

  if (msg.action === 'GET_STATUS') {
    sendresponse({ ready: ai.ready, provider: ai.provider, tabid: ai.tabid });
    return;
  }

  if (msg.action === 'AI_READY') {
    ai.ready = true;
    ai.provider = msg.provider || ai.provider;
    sendresponse({ ok: true });
    return;
  }

  if (msg.action === 'ASK_AI') {
    if (!ai.ready || !ai.tabid) {
      sendresponse({ error: 'ai not ready' });
      return;
    }

    var id = Date.now() + '';
    pending[id] = sendresponse;

    chrome.tabs.sendMessage(ai.tabid, {
      action: 'ASK',
      question: msg.question,
      reqid: id
    });

    setTimeout(function () {
      if (pending[id]) {
        delete pending[id];
        sendresponse({ error: 'timeout' });
      }
    }, 60000);

    return true;
  }

  if (msg.action === 'AI_ANSWER') {
    var cb = pending[msg.reqid];
    if (cb) {
      delete pending[msg.reqid];
      cb({ answer: msg.answer });
    }
    return;
  }

});
