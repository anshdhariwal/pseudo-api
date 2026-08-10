var tag = 'pseudo-gmode';

function waitfor(sel, cb) {
  var t = setInterval(function () {
    var el = document.querySelector(sel);
    if (el) { clearInterval(t); cb(el); }
  }, 500);
}

function findinput() {
  var all = document.querySelectorAll('textarea.ITIRGe, textarea[aria-label="Ask anything"], textarea[name="q"], textarea');
  for (var i = 0; i < all.length; i++) {
    if (all[i].offsetParent !== null) return all[i];
  }
  return document.querySelector('textarea');
}

function findsendbtn() {
  var btns = document.querySelectorAll('button[data-xid="input-plate-send-button"], button[aria-label="Send"], button[aria-label="Search"]');
  for (var i = 0; i < btns.length; i++) {
    if (btns[i].offsetParent !== null) return btns[i];
  }
  return null;
}

function sendprompt(text) {
  var box = findinput();
  if (!box) return false;

  box.focus();
  box.value = text;
  box.dispatchEvent(new Event('input', { bubbles: true }));
  box.dispatchEvent(new Event('change', { bubbles: true }));

  setTimeout(function () {
    var btn = findsendbtn();
    if (btn) {
      btn.click();
    } else if (box.form) {
      box.form.submit();
    } else {
      box.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
    }
  }, 300);

  return true;
}

function getanswer(question) {
  var bodyText = document.body.innerText || '';

  if (question && bodyText.indexOf(question) !== -1) {
    var parts = bodyText.split(question);
    var afterQuestion = parts[parts.length - 1].trim();

    var cleanText = afterQuestion
      .replace('AI Mode response is ready', '')
      .replace('Ask anything', '')
      .trim();

    if (cleanText.length > 2) {
      return cleanText;
    }
  }

  var list = document.querySelector('ul.BqVL3e');
  if (list) {
    var items = list.querySelectorAll('li');
    for (var i = items.length - 1; i >= 0; i--) {
      if (!items[i].classList.contains('j8c53')) {
        var t = items[i].innerText ? items[i].innerText.trim() : '';
        if (t.length > 2) return t;
      }
    }
  }

  return '';
}

function waitforanswer(question, cb) {
  var lasttext = '';
  var stable = 0;
  var tried = 0;

  var t = setInterval(function () {
    tried++;
    var currentAnswer = getanswer(question);

    if (currentAnswer && currentAnswer.length > 2) {
      if (currentAnswer === lasttext) {
        stable++;
        if (stable >= 2) {
          clearInterval(t);
          cb(currentAnswer);
          return;
        }
      } else {
        lasttext = currentAnswer;
        stable = 0;
      }
    }

    if (tried > 25) {
      clearInterval(t);
      var final = getanswer(question);
      cb(final || 'no response found');
    }
  }, 800);
}

window.addEventListener('message', function (e) {
  var data = e.data;
  if (!data || data.source !== 'pseudo-api-panel') return;

  if (data.action === 'ASK') {
    var ok = sendprompt(data.question);

    if (!ok) {
      window.parent.postMessage({ source: tag, action: 'AI_ERROR', error: 'search box not found', reqid: data.reqid }, '*');
      return;
    }

    waitforanswer(data.question, function (answer) {
      if (!answer) {
        window.parent.postMessage({ source: tag, action: 'AI_ERROR', error: 'no response found', reqid: data.reqid }, '*');
        return;
      }
      window.parent.postMessage({ source: tag, action: 'AI_ANSWER', answer: answer, reqid: data.reqid }, '*');
    });
  }
});

setTimeout(function () {
  window.parent.postMessage({ source: tag, action: 'AI_READY', provider: 'gmode' }, '*');
}, 1000);
