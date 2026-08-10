# api-contract.md

Messages exchanged between pseudo-api's background and any consumer extension.

---

## From consumer to pseudo-api

### GET_STATUS

```js
chrome.runtime.sendMessage(PSEUDO_API_ID, { action: 'GET_STATUS' }, function (res) {
  // res.ready    - boolean
  // res.provider - string ('gemini' | 'claude' | 'chatgpt' | 'gmode')
});
```

### ASK_AI

```js
chrome.runtime.sendMessage(PSEUDO_API_ID, {
  action: 'ASK_AI',
  question: 'your question here'
}, function (res) {
  // success: res.answer - string
  // error:   res.error  - string
});
```

---

## From sidepanel to background (internal port)

These messages flow over the `pseudo-api-panel` port.

| Action | Direction | Fields |
|---|---|---|
| `AI_READY` | panel to bg | `provider` |
| `AI_ANSWER` | panel to bg | `answer`, `reqid` |
| `AI_ERROR` | panel to bg | `error`, `reqid` |
| `ASK` | bg to panel | `question`, `reqid` |

---

## From provider script to sidepanel

Provider content scripts use `window.parent.postMessage` with `source` set to their tag.

| Action | Fields |
|---|---|
| `AI_READY` | `source`, `provider` |
| `AI_ANSWER` | `source`, `answer`, `reqid` |
| `AI_ERROR` | `source`, `error`, `reqid` |

Sidepanel sends to provider via `frame.contentWindow.postMessage` with `source: 'pseudo-api-panel'`.
