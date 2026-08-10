# pseudo-api

iFrame based AI bridge that acts as an API for web apps.

This framework loads AI chat websites (like Claude) inside a Chrome extension sidebar, then exposes a simple message interface so any other extension can send a question and get an answer back as plain text. This framework has no API key or backend service dependency. This framework is also free to use and for educational purposes only. 

---

## How it works

```
your extension
    |
    | chrome.runtime.sendMessage(PSEUDO_API_ID, { action: 'ASK_AI', question: '...' })
    v
pseudo-api background (service worker)
    |
    | port.postMessage({ action: 'ASK', ... })
    v
sidepanel.js (sidebar controller)
    |
    | frame.contentWindow.postMessage({ action: 'ASK', ... })
    v
provider script (injected into ai site iframe)
    |
    | types question, waits for answer
    |
    | window.parent.postMessage({ action: 'AI_ANSWER', answer: '...' })
    v
sidepanel.js -> port -> background -> your extension callback
```

---

## Setup

### 1. Load pseudo-api

Go to `chrome://extensions`, enable Developer mode, click Load unpacked, select the `pseudo-api` folder.

Copy the extension ID shown on the card.

### 2. Open the sidebar

Click the pseudo-api icon in your toolbar. The sidebar opens. Select a provider from the dropdown and wait for it to show "ready".

You need to be logged into whichever AI website you choose.

### 3. Use from your extension

```js
var PSEUDO_API_ID = 'paste-your-extension-id-here';

chrome.runtime.sendMessage(PSEUDO_API_ID, {
  action: 'ASK_AI',
  question: 'What is the capital of France?'
}, function (res) {
  if (res.error) {
    console.error(res.error);
    return;
  }
  console.log(res.answer);
});
```

---

## Testing pseudo-api

There are three ways to test pseudo-api:

### Option A: Built-in Sidebar Console (Instant)
Type your prompt directly into the **"Test API prompt..."** bar at the top of the sidebar panel and click **Send**. The response appears immediately in the green output area above the status bar.

### Option B: Browser DevTools Console
Open DevTools (`F12`) on any tab and run:

```js
var PSEUDO_API_ID = 'your-extension-id-here';
chrome.runtime.sendMessage(PSEUDO_API_ID, { action: 'ASK_AI', question: 'Hello!' }, console.log);
```

### Option C: Demo Extension (`demo/` folder)
1. Open `demo/popup.js` and replace `YOUR_PSEUDO_API_EXTENSION_ID` with your extension ID
2. Go to `chrome://extensions` and click **Load unpacked** -> select `demo/`
3. Click the demo extension icon in your toolbar to open its popup UI, type a question, and click Send

---

## Providers

| Provider | URL loaded |
|---|---|
| Gemini | gemini.google.com/app |
| Claude | claude.ai/new |
| ChatGPT | chatgpt.com |
| Google AI Mode | google.com/search?udm=50 |

To add a new provider of your choice, see [provider-guide.md](provider-guide.md).

---

## API reference

See [api-contract.md](api-contract.md) for all message types.

---

## How the iframe works (Core Logic)

Most of the AI sites that we use, send `X-Frame-Options: DENY` headers, which blocks them from loading in iframes. My pseudo-api uses the `declarativeNetRequest` API to strip those headers before the browser processes them, which allows the sites to load inside the sidebar iframe. Hence, my provider scripts are injected into the iframe via `all_frames: true` in the manifest.

---

## License

MIT - see [LICENSE](LICENSE). You can use, modify, and distribute this freely. Keep the copyright notice.

---

⭐ Developed by [Ansh Dhariwal](https://github.com/anshdhariwal)