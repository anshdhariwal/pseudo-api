var tag = 'pseudo-chatgpt';

function waitfor(sel, cb) {
  var t = setInterval(function () {
    var el = document.querySelector(sel);
    if (el) { clearInterval(t); cb(el); }
  }, 500);
}

function sendprompt(text) {
  var box = document.querySelector('#prompt-textarea');
  if (!box) return false;
  box.focus();
  document.execCommand('insertText', false, text);
  box.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(function () {
    var btn = document.querySelector('button[data-testid="send-button"]');
    if (btn) btn.click();
  }, 400);
  return true;
}

function waitforanswer(snapcount, cb) {
  var lasttext = '';
  var stable = 0;

  var t = setInterval(function () {
    var all = document.querySelectorAll('div[data-message-author-role="assistant"]');
    if (all.length <= snapcount) return;

    var last = all[all.length - 1];
    var text = last.innerText.trim();
    var thinking = document.querySelector('button[data-testid="stop-button"]');

    if (!thinking && text === lasttext && text.length > 0) {
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
    var snap = document.querySelectorAll('div[data-message-author-role="assistant"]').length;
    var ok = sendprompt(data.question);

    if (!ok) {
      window.parent.postMessage({ source: tag, action: 'AI_ERROR', error: 'textarea not found', reqid: data.reqid }, '*');
      return;
    }

    waitforanswer(snap, function (answer) {
      window.parent.postMessage({ source: tag, action: 'AI_ANSWER', answer: answer, reqid: data.reqid }, '*');
    });
  }
});

waitfor('#prompt-textarea', function () {
  window.parent.postMessage({ source: tag, action: 'AI_READY', provider: 'chatgpt' }, '*');
});
