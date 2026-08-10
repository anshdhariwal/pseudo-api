var frame = document.getElementById('aiframe');
var status = document.getElementById('status');
var sel = document.getElementById('provider');
var reloadbtn = document.getElementById('reload');

var urls = {
  gemini:  'https://gemini.google.com/app',
  claude:  'https://claude.ai/new',
  chatgpt: 'https://chatgpt.com/',
  gmode:   'https://www.google.com/search?udm=50'
};

function load(provider) {
  status.textContent = 'loading ' + provider + '...';
  frame.src = urls[provider];
}

frame.addEventListener('load', function () {
  status.textContent = 'loaded, waiting for ai...';
});

sel.addEventListener('change', function () {
  load(sel.value);
});

reloadbtn.addEventListener('click', function () {
  load(sel.value);
});

chrome.storage.local.get('provider', function (d) {
  var p = d.provider || 'gemini';
  sel.value = p;
  load(p);
});

window.addEventListener('message', function (e) {
  var data = e.data;
  if (!data || !data.action) return;

  if (data.action === 'AI_READY') {
    status.textContent = sel.value + ' ready';
  }
});
