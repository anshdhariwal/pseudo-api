var frame = document.getElementById('aiframe');
var statusel = document.getElementById('status');
var sel = document.getElementById('provider');
var reloadbtn = document.getElementById('reload');
var testinput = document.getElementById('test-input');
var testsend = document.getElementById('test-send');
var testout = document.getElementById('test-output');
var activeTestReqId = null;

var urls = {
  gemini:  'https://gemini.google.com/app',
  claude:  'https://claude.ai/new',
  chatgpt: 'https://chatgpt.com/',
  gmode:   'https://www.google.com/search?udm=50&aep=11'
};

var port = null;
var current = 'gemini';
var aiready = false;

function connectport() {
  port = chrome.runtime.connect({ name: 'pseudo-api-panel' });

  port.onDisconnect.addListener(function () {
    port = null;
    setTimeout(function () {
      connectport();
      if (aiready) {
        port.postMessage({ action: 'AI_READY', provider: current });
      }
    }, 1500);
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
}

connectport();

function setstatus(text) {
  statusel.textContent = text;
}

function cleartestui() {
  testinput.value = '';
  testout.textContent = '';
  testout.style.display = 'none';
  activeTestReqId = null;
}

function load(provider) {
  current = provider;
  cleartestui();
  setstatus('loading ' + provider + '...');
  if (port) port.postMessage({ action: 'AI_READY', provider: provider, ready: false });
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

testinput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    testsend.click();
  }
});

testsend.addEventListener('click', function () {
  var q = testinput.value.trim();
  if (!q) return;

  testinput.value = '';

  activeTestReqId = 'test_' + Date.now();
  testout.style.display = 'block';
  testout.textContent = 'sending prompt to ' + current + '...';

  frame.contentWindow.postMessage({
    source: 'pseudo-api-panel',
    action: 'ASK',
    question: q,
    reqid: activeTestReqId
  }, '*');
  setstatus('answering test prompt...');
});

window.addEventListener('message', function (e) {
  var data = e.data;
  if (!data || !data.action) return;

  var known = ['pseudo-gemini', 'pseudo-claude', 'pseudo-chatgpt', 'pseudo-gmode'];
  if (data.source && known.indexOf(data.source) === -1) return;

  if (data.action === 'AI_READY') {
    aiready = true;
    setstatus(current + ' ready');
    if (port) port.postMessage({ action: 'AI_READY', provider: current });
    return;
  }

  if (data.action === 'AI_ANSWER') {
    setstatus('answer sent');
    if (activeTestReqId && data.reqid === activeTestReqId) {
      testout.textContent = data.answer;
      activeTestReqId = null;
    }
    if (port) port.postMessage({ action: 'AI_ANSWER', answer: data.answer, reqid: data.reqid });
    return;
  }

  if (data.action === 'AI_ERROR') {
    setstatus('error: ' + data.error);
    if (activeTestReqId && data.reqid === activeTestReqId) {
      testout.textContent = 'error: ' + data.error;
      activeTestReqId = null;
    }
    if (port) port.postMessage({ action: 'AI_ERROR', error: data.error, reqid: data.reqid });
    return;
  }
});

chrome.storage.local.get('provider', function (d) {
  var p = d.provider || 'gemini';
  sel.value = p;
  load(p);
});
