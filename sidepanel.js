var frame = document.getElementById('aiframe');
var statusel = document.getElementById('status');
var sel = document.getElementById('provider');
var reloadbtn = document.getElementById('reload');

var urls = {
  gemini:  'https://gemini.google.com/app',
  claude:  'https://claude.ai/new',
  chatgpt: 'https://chatgpt.com/',
  gmode:   'https://www.google.com/search?udm=50&aep=11'
};

var port = chrome.runtime.connect({ name: 'pseudo-api-panel' });
var current = 'gemini';

function setstatus(text) {
  statusel.textContent = text;
}

function load(provider) {
  current = provider;
  setstatus('loading ' + provider + '...');
  port.postMessage({ action: 'AI_READY', provider: provider, ready: false });
  frame.src = urls[provider];
}

frame.addEventListener('load', function () {
  setstatus('waiting for ' + current + '...');
});

sel.addEventListener('change', function () {
  chrome.storage.local.set({ provider: sel.value });
  load(sel.value);
});

reloadbtn.addEventListener('click', function () {
  load(current);
});

window.addEventListener('message', function (e) {
  var data = e.data;
  if (!data || !data.action) return;

  var known = ['pseudo-gemini', 'pseudo-claude', 'pseudo-chatgpt', 'pseudo-gmode'];
  if (data.source && known.indexOf(data.source) === -1) return;

  if (data.action === 'AI_READY') {
    setstatus(current + ' ready');
    port.postMessage({ action: 'AI_READY', provider: current });
    return;
  }

  if (data.action === 'AI_ANSWER') {
    setstatus('answer sent');
    port.postMessage({ action: 'AI_ANSWER', answer: data.answer, reqid: data.reqid });
    return;
  }

  if (data.action === 'AI_ERROR') {
    setstatus('error: ' + data.error);
    port.postMessage({ action: 'AI_ERROR', error: data.error, reqid: data.reqid });
    return;
  }
});

port.onMessage.addListener(function (msg) {
  if (msg.action === 'ASK') {
    frame.contentWindow.postMessage({
      source: 'pseudo-api-panel',
      action: 'ASK',
      question: msg.question,
      reqid: msg.reqid
    }, '*');
    setstatus('answering...');
  }
});

chrome.storage.local.get('provider', function (d) {
  var p = d.provider || 'gemini';
  sel.value = p;
  load(p);
});
