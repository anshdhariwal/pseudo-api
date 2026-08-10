var tag = 'pseudo-claude';

function waitfor(sel, cb) {
  var t = setInterval(function () {
    var el = document.querySelector(sel);
    if (el) { clearInterval(t); cb(el); }
  }, 500);
}

function findinput() {
  return document.querySelector('div.ProseMirror[contenteditable="true"]') ||
         document.querySelector('div[contenteditable="true"]');
}

function findsendbtn() {
  var btn = document.querySelector('button[aria-label="Send Message"]') ||
            document.querySelector('button[aria-label="Send message"]') ||
            document.querySelector('button[aria-label*="Send"]') ||
            document.querySelector('button[data-testid*="send"]');
  if (btn && !btn.disabled) return btn;
  return null;
}

function sendprompt(text) {
  var box = findinput();
  if (!box) return false;

  box.focus();

  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);

  var ok = document.execCommand('insertText', false, text);
  if (!ok) {
    box.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    }));
  }

  box.dispatchEvent(new Event('compositionend', { bubbles: true }));
  box.dispatchEvent(new Event('change', { bubbles: true }));

  var attempts = 0;
  var timer = setInterval(function () {
    attempts++;
    var btn = findsendbtn();
    if (btn) {
      clearInterval(timer);
      btn.click();
      return;
    }
    if (attempts >= 10) {
      clearInterval(timer);
      box.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
    }
  }, 200);

  return true;
}

function waitforanswer(snapcount, cb) {
  var lasttext = '';
  var stable = 0;

  var t = setInterval(function () {
    var all = document.querySelectorAll('div[data-testid="assistant-message"] .prose, .font-claude-response, div.font-claude-message, .prose');
    if (all.length <= snapcount) return;

    var last = all[all.length - 1];
    var text = last.innerText.trim();

    var streaming = document.querySelector('span[data-testid="streaming-indicator"], [data-is-streaming="true"]');
    if (!streaming && text === lasttext && text.length > 0) {
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
    var snap = document.querySelectorAll('div[data-testid="assistant-message"] .prose, .font-claude-response, div.font-claude-message, .prose').length;
    var ok = sendprompt(data.question);

    if (!ok) {
      window.parent.postMessage({ source: tag, action: 'AI_ERROR', error: 'editor not found', reqid: data.reqid }, '*');
      return;
    }

    waitforanswer(snap, function (answer) {
      window.parent.postMessage({ source: tag, action: 'AI_ANSWER', answer: answer, reqid: data.reqid }, '*');
    });
  }
});

waitfor('div[contenteditable="true"]', function () {
  window.parent.postMessage({ source: tag, action: 'AI_READY', provider: 'claude' }, '*');
});
