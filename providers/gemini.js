var ready = false;

function waitforprompt(callback) {
  var t = setInterval(function () {
    var box = document.querySelector('div.ql-editor[role="textbox"]');
    if (box) {
      clearInterval(t);
      callback(box);
    }
  }, 500);
}

function sendprompt(box, text) {
  box.focus();
  document.execCommand('insertText', false, text);
  box.dispatchEvent(new Event('input', { bubbles: true }));

  setTimeout(function () {
    var btn = document.querySelector('button[aria-label="Send message"]');
    if (btn) btn.click();
  }, 400);
}

function waitforanswer(callback) {
  var lasttext = '';
  var stable = 0;

  var t = setInterval(function () {
    var msgs = document.querySelectorAll('message-content .markdown');
    var last = msgs[msgs.length - 1];
    if (!last) return;

    var text = last.innerText.trim();
    if (last.getAttribute('aria-busy') === 'false' && text === lasttext && text.length > 0) {
      stable++;
      if (stable >= 2) {
        clearInterval(t);
        callback(text);
      }
    } else {
      lasttext = text;
      stable = 0;
    }
  }, 800);
}

function ask(question, reqid) {
  waitforprompt(function (box) {
    sendprompt(box, question);
    waitforanswer(function (answer) {
      chrome.runtime.sendMessage({ action: 'AI_ANSWER', answer: answer, reqid: reqid });
    });
  });
}

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.action === 'ASK') {
    ask(msg.question, msg.reqid);
  }
});

waitforprompt(function () {
  ready = true;
  chrome.runtime.sendMessage({ action: 'AI_READY', provider: 'gemini' });
});
