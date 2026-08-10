# provider-guide.md

How to add a new AI provider to pseudo-api.

---

## What a provider does

A provider is a content script injected into an AI website when it loads inside the sidebar iframe. It:

1. Detects when the page is ready (input box exists)
2. Sends `AI_READY` to the sidebar
3. Listens for `ASK` messages from the sidebar
4. Types the question into the page, submits it
5. Waits for the answer to finish generating
6. Sends `AI_ANSWER` back to the sidebar

---

## Template

Copy this into `providers/yourprovider.js`.

```js
var tag = 'pseudo-yourprovider';

function waitfor(sel, cb) {
  var t = setInterval(function () {
    var el = document.querySelector(sel);
    if (el) { clearInterval(t); cb(el); }
  }, 500);
}

function sendprompt(text) {
  var box = document.querySelector('YOUR_INPUT_SELECTOR');
  if (!box) return false;
  box.focus();
  document.execCommand('insertText', false, text);
  box.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(function () {
    var btn = document.querySelector('YOUR_SUBMIT_BUTTON_SELECTOR');
    if (btn) btn.click();
  }, 400);
  return true;
}

function waitforanswer(snapcount, cb) {
  var lasttext = '';
  var stable = 0;

  var t = setInterval(function () {
    var all = document.querySelectorAll('YOUR_ANSWER_CONTAINER_SELECTOR');
    if (all.length <= snapcount) return;

    var last = all[all.length - 1];
    var text = last.innerText.trim();
    var streaming = document.querySelector('YOUR_STREAMING_INDICATOR_SELECTOR');

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
    var snap = document.querySelectorAll('YOUR_ANSWER_CONTAINER_SELECTOR').length;
    var ok = sendprompt(data.question);

    if (!ok) {
      window.parent.postMessage({ source: tag, action: 'AI_ERROR', error: 'input not found', reqid: data.reqid }, '*');
      return;
    }

    waitforanswer(snap, function (answer) {
      window.parent.postMessage({ source: tag, action: 'AI_ANSWER', answer: answer, reqid: data.reqid }, '*');
    });
  }
});

waitfor('YOUR_INPUT_SELECTOR', function () {
  window.parent.postMessage({ source: tag, action: 'AI_READY', provider: 'yourprovider' }, '*');
});
```

---

## Register the provider

In `manifest.json`, add a content script entry:

```json
{
  "matches": ["https://yourprovider.com/*"],
  "js": ["providers/yourprovider.js"],
  "all_frames": true,
  "run_at": "document_idle"
}
```

Add a header stripping rule in `rules.json`:

```json
{
  "id": 5,
  "priority": 1,
  "action": {
    "type": "modifyHeaders",
    "responseHeaders": [
      { "header": "x-frame-options", "operation": "remove" },
      { "header": "content-security-policy", "operation": "remove" }
    ]
  },
  "condition": {
    "urlFilter": "yourprovider.com",
    "resourceTypes": ["sub_frame", "main_frame"]
  }
}
```

Add the URL in `sidepanel.js`:

```js
var urls = {
  ...
  yourprovider: 'https://yourprovider.com/chat'
};
```

Add an option in `sidepanel.html`:

```html
<option value="yourprovider">Your Provider</option>
```

---

## Finding the right selectors

Open the provider site in a normal tab. Use DevTools console:

```js
document.querySelector('textarea')
document.querySelector('[contenteditable]')
document.querySelectorAll('[class*="message"]')
```

Check what the streaming indicator looks like while the model is generating vs when it stops.
