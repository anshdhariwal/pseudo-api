var btn = document.getElementById('send');
var out = document.getElementById('response');
var status = document.createElement('p');
status.style.cssText = 'font-size:11px;color:#888;margin:4px 0 8px';
document.body.insertBefore(status, btn.parentNode || btn);

function checkstatus() {
  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, function (res) {
    if (chrome.runtime.lastError) { status.textContent = 'extension not found'; return; }
    status.textContent = res && res.ready ? 'ai ready - ' + res.provider : 'ai not ready';
  });
}

checkstatus();

btn.addEventListener('click', function () {
  var q = document.getElementById('question').value.trim();
  if (!q) return;

  out.textContent = 'waiting...';
  btn.disabled = true;

  chrome.runtime.sendMessage({ action: 'ASK_AI', question: q }, function (res) {
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
