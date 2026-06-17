(function () {
  let html5QrCode = null;
  const reader = document.getElementById('reader');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const studentCard = document.getElementById('studentCard');
  const sName = document.getElementById('sName');
  const sEmail = document.getElementById('sEmail');
  const sBranch = document.getElementById('sBranch');
  const sYear = document.getElementById('sYear');
  const sParentLink = document.getElementById('sParentLink');
  const studentIdInput = document.getElementById('studentId');
  const issueFruitBtn = document.getElementById('issueFruitBtn');
  const issueEquipBtn = document.getElementById('issueEquipBtn');
  const toast = document.getElementById('toast');

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ' + (isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800');
    toast.classList.remove('hidden');
    setTimeout(function () { toast.classList.add('hidden'); }, 3000);
  }

  function showStudent(data) {
    sName.textContent = data.name;
    sEmail.textContent = data.email;
    sBranch.textContent = 'Branch: ' + (data.branch || '-');
    sYear.textContent = 'Year: ' + (data.year || '-');
    sParentLink.href = data.parentPhone ? 'tel:' + data.parentPhone : '#';
    sParentLink.textContent = data.parentPhone ? data.parentPhone : 'N/A';
    studentIdInput.value = data._id;
    studentCard.classList.remove('hidden');
  }

  function fetchStudent(id) {
    fetch('/admin/api/student-by-qr?data=' + encodeURIComponent(id))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          showToast(data.error, true);
          return;
        }
        showStudent(data);
      })
      .catch(function () { showToast('Failed to fetch student', true); });
  }

  startBtn.addEventListener('click', function () {
    if (html5QrCode && html5QrCode.isScanning) return;
    html5QrCode = new Html5Qrcode('reader');
    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      function (decodedText) {
        html5QrCode.stop().then(function () {
          stopBtn.style.display = 'none';
          startBtn.style.display = 'inline-block';
        }).catch(function () {});
        fetchStudent(decodedText.trim());
      },
      function () {}
    ).then(function () {
      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
    }).catch(function (err) {
      showToast('Camera error: ' + (err.message || 'Permission denied'), true);
    });
  });

  stopBtn.addEventListener('click', function () {
    if (html5QrCode) {
      html5QrCode.stop().then(function () {
        stopBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
      }).catch(function () {});
    }
  });

  issueFruitBtn.addEventListener('click', function () {
    var id = studentIdInput.value;
    if (!id) { showToast('No student selected', true); return; }
    fetch('/admin/fruit/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ studentId: id, quantity: 1 })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) showToast('Fruit issued');
        else showToast(data.error || 'Failed', true);
      })
      .catch(function () { showToast('Request failed', true); });
  });

  issueEquipBtn.addEventListener('click', function () {
    var id = studentIdInput.value;
    if (!id) { showToast('No student selected', true); return; }
    var name = window.prompt('Equipment name:');
    if (!name) return;
    fetch('/admin/equipment/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: id, equipmentName: name })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) showToast('Equipment issued');
        else showToast((data && data.error) || 'Failed', true);
      })
      .catch(function () { showToast('Request failed', true); });
  });
})();
