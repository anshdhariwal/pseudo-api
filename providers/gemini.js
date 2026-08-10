var tag = 'pseudo-gemini';
var ready = false;

var urls = {
  prompt: 'div.ql-editor[role="textbox"]',
  send: 'button[aria-label="Send message"]',
  msgs: 'message-content .markdown'
};

function waitfor(sel, cb) {
  var t = setInterval(function () {
    var el = document.querySelector(sel);
    if (el) { clearInterval(t); cb(el); }
  }, 500);
}

function sendprompt(text) {
  var box = document.querySelector(urls.prompt);
  if (!box) return false;
  box.focus();
  document.execCommand('insertText', false, text);
  box.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(function () {
    var btn = document.querySelector(urls.send);
    if (btn) btn.click();
  }, 400);
  return true;
}

function waitforanswer(snapshot, cb) {
  var lasttext = '';
  var stable = 0;
  var snapcount = document.querySelectorAll(urls.msgs).length;

  var t = setInterval(function () {
    var all = document.querySelectorAll(urls.msgs);
    if (all.length <= snapcount) return;

    var last = all[all.length - 1];
    var text = last.innerText.trim();

    if (last.getAttribute('aria-busy') === 'false' && text === lasttext && text.length > 0) {
      stable++;
      if (stable >= 2) {
        clearInterval(t);
        cb(text);
      }
    } else {
      lasttext = text;
      stable = 0;
    }
  }, 800);
}

window.addEventListener('message', function (e) {
  var data = e.data;
  if (!data || data.source !== 'pseudo-api-panel') return;

  if (data.action === 'ASK') {
    var snap = document.querySelectorAll(urls.msgs).length;
    var ok = sendprompt(data.question);

    if (!ok) {
      window.parent.postMessage({ source: tag, action: 'AI_ERROR', error: 'prompt box not found', reqid: data.reqid }, '*');
      return;
    }

    waitforanswer(snap, function (answer) {
      window.parent.postMessage({ source: tag, action: 'AI_ANSWER', answer: answer, reqid: data.reqid }, '*');
    });
  }
});

waitfor(urls.prompt, function () {
  ready = true;
  window.parent.postMessage({ source: tag, action: 'AI_READY', provider: 'gemini' }, '*');
});
