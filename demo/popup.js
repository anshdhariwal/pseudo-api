var PSEUDO_API_ID = 'YOUR_PSEUDO_API_EXTENSION_ID';

var btn = document.getElementById('send');
var out = document.getElementById('response');
var status = document.getElementById('status');

function checkstatus() {
  chrome.runtime.sendMessage(PSEUDO_API_ID, { action: 'GET_STATUS' }, function (res) {
    if (chrome.runtime.lastError) {
      status.textContent = 'pseudo-api not found - load it first';
      return;
    }
    status.textContent = res && res.ready ? 'ready - ' + res.provider : 'not ready';
  });
}

checkstatus();

btn.addEventListener('click', function () {
  var q = document.getElementById('question').value.trim();
  if (!q) return;

  out.textContent = 'waiting...';
  btn.disabled = true;

  chrome.runtime.sendMessage(PSEUDO_API_ID, { action: 'ASK_AI', question: q }, function (res) {
    btn.disabled = false;
    if (chrome.runtime.lastError) {
      out.textContent = 'error: ' + chrome.runtime.lastError.message;
      return;
    }
    if (!res || res.error) {
      out.textContent = 'error: ' + (res ? res.error : 'no response');
      return;
    }
    out.textContent = res.answer;
  });
});
