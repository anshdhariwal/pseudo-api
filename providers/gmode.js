var tag = 'pseudo-gmode';

function waitfor(sel, cb) {
  var t = setInterval(function () {
    var el = document.querySelector(sel);
    if (el) { clearInterval(t); cb(el); }
  }, 500);
}

function sendprompt(text) {
  var box = document.querySelector('textarea[aria-label="Search"]') ||
            document.querySelector('textarea[name="q"]');
  if (!box) return false;
  box.focus();
  box.value = text;
  box.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(function () {
    box.form && box.form.submit();
  }, 400);
  return true;
}

function waitforanswer(cb) {
  var tried = 0;
  var t = setInterval(function () {
    tried++;
    var block = document.querySelector('[data-attrid="SGE"] .VwiC3b') ||
                document.querySelector('.Rk5F3b') ||
                document.querySelector('[jsname="yEVEwb"]');

    if (block && block.innerText.trim().length > 20) {
      clearInterval(t);
      cb(block.innerText.trim());
      return;
    }
    if (tried > 30) {
      clearInterval(t);
      cb('');
    }
  }, 1000);
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

    waitforanswer(function (answer) {
      if (!answer) {
        window.parent.postMessage({ source: tag, action: 'AI_ERROR', error: 'no response found', reqid: data.reqid }, '*');
        return;
      }
      window.parent.postMessage({ source: tag, action: 'AI_ANSWER', answer: answer, reqid: data.reqid }, '*');
    });
  }
});

waitfor('textarea[aria-label="Search"], textarea[name="q"]', function () {
  window.parent.postMessage({ source: tag, action: 'AI_READY', provider: 'gmode' }, '*');
});
