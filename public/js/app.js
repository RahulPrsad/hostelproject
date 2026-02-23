(function () {
  // Toast from query string (e.g. after redirect)
  var params = new URLSearchParams(window.location.search);
  var success = params.get('success');
  var error = params.get('error');
  if (success || error) {
    var div = document.createElement('div');
    div.className = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ' + (success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
    div.textContent = success || error;
    document.body.appendChild(div);
    setTimeout(function () { div.remove(); }, 4000);
  }
})();
