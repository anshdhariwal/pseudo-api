var btn = document.getElementById('send');
var out = document.getElementById('response');

btn.addEventListener('click', function () {
  var q = document.getElementById('question').value.trim();
  if (!q) return;

  out.textContent = 'waiting...';

  chrome.runtime.sendMessage({ action: 'ASK_AI', question: q }, function (res) {
    if (chrome.runtime.lastError) {
      out.textContent = 'error: ' + chrome.runtime.lastError.message;
      return;
    }
    if (res.error) {
      out.textContent = 'error: ' + res.error;
      return;
    }
    out.textContent = res.answer;
  });
});
