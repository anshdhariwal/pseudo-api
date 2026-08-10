var btn = document.getElementById('send');
var out = document.getElementById('response');

// placeholder — wiring to background comes next
btn.addEventListener('click', function () {
  var q = document.getElementById('question').value.trim();
  if (!q) return;
  out.textContent = 'sending...';
});
