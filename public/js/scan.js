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
  const leaveStatusPanel = document.getElementById('leaveStatusPanel');
  const studentIdInput = document.getElementById('studentId');
  const issueFruitBtn = document.getElementById('issueFruitBtn');
  const issueEquipBtn = document.getElementById('issueEquipBtn');
  const leaveRequestBtn = document.getElementById('leaveRequestBtn');
  const toast = document.getElementById('toast');
  const refreshEquipmentBtn = document.getElementById('refreshEquipmentBtn');
  const activeEquipmentList = document.getElementById('activeEquipmentList');
  const returnResultPanel = document.getElementById('returnResultPanel');
  const returnResultText = document.getElementById('returnResultText');
  const agreeReturnBtn = document.getElementById('agreeReturnBtn');
  const cancelReturnBtn = document.getElementById('cancelReturnBtn');
  const capturePanel = document.getElementById('capturePanel');
  const captureTitle = document.getElementById('captureTitle');
  const captureVideo = document.getElementById('captureVideo');
  const captureCanvas = document.getElementById('captureCanvas');
  const captureImageBtn = document.getElementById('captureImageBtn');
  const cancelCaptureBtn = document.getElementById('cancelCaptureBtn');
  let pendingReturn = null;
  let captureStream = null;
  let captureCallback = null;
  let currentStudent = null;

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ' + (isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800');
    toast.classList.remove('hidden');
    setTimeout(function () { toast.classList.add('hidden'); }, 3000);
  }

  function getDialNumber(phone) {
    return String(phone || '').replace(/[^\d+]/g, '');
  }

  function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : '-';
  }

  function showActionsForStudent(data) {
    var onLeave = Boolean(data.activeLeave);
    var hasPendingLeave = Boolean(data.pendingLeave);
    issueFruitBtn.classList.toggle('hidden', onLeave);
    issueEquipBtn.classList.toggle('hidden', onLeave);
    issueFruitBtn.disabled = Boolean(data.fruitIssuedToday);
    issueFruitBtn.textContent = data.fruitIssuedToday ? 'Done for today' : 'Issue Fruit';
    issueFruitBtn.className = data.fruitIssuedToday
      ? 'block w-full rounded bg-slate-300 py-2 text-slate-700'
      : 'block w-full bg-green-600 text-white py-2 rounded hover:bg-green-700';
    leaveRequestBtn.classList.toggle('hidden', !hasPendingLeave);
    leaveRequestBtn.href = '/admin/leaves?studentId=' + encodeURIComponent(data._id);

    leaveStatusPanel.classList.remove('hidden', 'border-amber-200', 'bg-amber-50', 'text-amber-900', 'border-indigo-200', 'bg-indigo-50', 'text-indigo-900');
    if (onLeave) {
      leaveStatusPanel.classList.add('border-amber-200', 'bg-amber-50', 'text-amber-900');
      leaveStatusPanel.innerHTML =
        '<p class="font-semibold">Student is currently on leave.</p>' +
        '<p class="mt-1">Leave: ' + formatDate(data.activeLeave.fromDate) + ' to ' + formatDate(data.activeLeave.toDate) + '</p>' +
        '<p class="mt-1">' + (data.activeLeave.reason || '') + '</p>' +
        '<button type="button" id="markPresentBtn" class="mt-3 rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700">Mark Student Present</button>';
      document.getElementById('markPresentBtn').addEventListener('click', markStudentPresent);
    } else if (hasPendingLeave) {
      leaveStatusPanel.classList.add('border-indigo-200', 'bg-indigo-50', 'text-indigo-900');
      leaveStatusPanel.innerHTML =
        '<p class="font-semibold">Pending leave request found.</p>' +
        '<p class="mt-1">Leave: ' + formatDate(data.pendingLeave.fromDate) + ' to ' + formatDate(data.pendingLeave.toDate) + '</p>' +
        '<p class="mt-1">' + (data.pendingLeave.reason || '') + '</p>';
    } else {
      leaveStatusPanel.classList.add('hidden');
      leaveStatusPanel.innerHTML = '';
    }
  }

  function showStudent(data) {
    sName.textContent = data.name;
    sEmail.textContent = data.email;
    sBranch.textContent = 'Branch: ' + (data.branch || '-');
    sYear.textContent = 'Year: ' + (data.year || '-');
    var dialNumber = getDialNumber(data.parentPhone);
    sParentLink.href = dialNumber ? 'tel:' + dialNumber : '#';
    sParentLink.textContent = data.parentPhone ? data.parentPhone : 'N/A';
    studentIdInput.value = data._id;
    currentStudent = data;
    studentCard.classList.remove('hidden');
    showActionsForStudent(data);
    loadActiveEquipment(data._id);
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

  function markStudentPresent() {
    if (!currentStudent) return;
    fetch('/admin/students/' + encodeURIComponent(currentStudent._id) + '/present', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) {
          showToast('Student marked present');
          fetchStudent(currentStudent._id);
        } else {
          showToast((data && data.error) || 'Failed to mark present', true);
        }
      })
      .catch(function () { showToast('Request failed', true); });
  }

  function stopQrScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
      return html5QrCode.stop().then(function () {
        stopBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
      }).catch(function () {});
    }
    return Promise.resolve();
  }

  function stopCaptureCamera() {
    if (captureStream) {
      captureStream.getTracks().forEach(function (track) { track.stop(); });
      captureStream = null;
    }
    captureVideo.srcObject = null;
    captureCallback = null;
    capturePanel.classList.add('hidden');
  }

  function frameToDataUrl() {
    var width = captureVideo.videoWidth || 640;
    var height = captureVideo.videoHeight || 480;
    var maxSize = 512;
    var scale = Math.min(1, maxSize / Math.max(width, height));
    captureCanvas.width = Math.max(1, Math.round(width * scale));
    captureCanvas.height = Math.max(1, Math.round(height * scale));
    var ctx = captureCanvas.getContext('2d');
    ctx.drawImage(captureVideo, 0, 0, captureCanvas.width, captureCanvas.height);
    return captureCanvas.toDataURL('image/jpeg', 0.76);
  }

  function openCaptureCamera(title, onCapture) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Camera capture is not supported in this browser', true);
      return;
    }

    stopQrScanner().then(function () {
      captureTitle.textContent = title;
      captureCallback = onCapture;
      capturePanel.classList.remove('hidden');
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
    }).then(function (stream) {
      captureStream = stream;
      captureVideo.srcObject = stream;
      return captureVideo.play();
    }).catch(function (err) {
      stopCaptureCamera();
      showToast('Camera error: ' + (err.message || 'Permission denied'), true);
    });
  }

  function resetReturnResult() {
    pendingReturn = null;
    returnResultPanel.classList.add('hidden');
    returnResultText.textContent = '';
  }

  function renderEquipmentList(items) {
    resetReturnResult();
    activeEquipmentList.innerHTML = '';
    if (!items || items.length === 0) {
      activeEquipmentList.textContent = 'No active equipment to return.';
      return;
    }

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'flex flex-col gap-3 rounded border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between';

      var details = document.createElement('div');
      details.className = 'flex items-center gap-3';
      if (item.issuePhoto) {
        var image = document.createElement('img');
        image.src = item.issuePhoto;
        image.alt = item.equipmentName;
        image.className = 'h-14 w-14 rounded border object-cover';
        details.appendChild(image);
      }

      var text = document.createElement('div');
      var name = document.createElement('p');
      name.className = 'font-medium text-gray-800';
      name.textContent = item.equipmentName;
      var date = document.createElement('p');
      date.className = 'text-xs text-gray-500';
      date.textContent = 'Issued: ' + new Date(item.issueDate).toLocaleDateString();
      text.appendChild(name);
      text.appendChild(date);
      details.appendChild(text);

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700';
      button.textContent = 'Return';
      button.addEventListener('click', function () {
        startReturnFlow(item);
      });

      row.appendChild(details);
      row.appendChild(button);
      activeEquipmentList.appendChild(row);
    });
  }

  function loadActiveEquipment(studentId) {
    if (!studentId) {
      activeEquipmentList.textContent = 'Scan a student to view active equipment.';
      return;
    }

    activeEquipmentList.textContent = 'Loading active equipment...';
    fetch('/admin/api/student-equipment?studentId=' + encodeURIComponent(studentId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          activeEquipmentList.textContent = data.error;
          return;
        }
        renderEquipmentList(data.equipment || []);
      })
      .catch(function () {
        activeEquipmentList.textContent = 'Failed to load equipment.';
      });
  }

  function startReturnFlow(item) {
    if (!item.issuePhoto) {
      showToast('Issue photo missing for this equipment', true);
      return;
    }

    openCaptureCamera('Capture Return Photo', function (returnPhoto) {
      pendingReturn = {
        equipmentId: item._id,
        equipmentName: item.equipmentName,
        returnPhoto: returnPhoto,
      };
      returnResultText.textContent = item.equipmentName + ': return photo captured. Agree to save the photo and close this return.';
      returnResultPanel.classList.remove('hidden');
    });
  }

  function startScanner() {
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
      startBtn.textContent = 'Retry Camera';
      startBtn.style.display = 'inline-block';
    });
  }

  startBtn.addEventListener('click', startScanner);

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
    if (currentStudent && currentStudent.activeLeave) { showToast('Student is on leave', true); return; }
    if (currentStudent && currentStudent.fruitIssuedToday) { showToast('Done for today', true); return; }
    fetch('/admin/fruit/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ studentId: id, quantity: 1 })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.redirectUrl) {
          if (currentStudent) currentStudent.fruitIssuedToday = true;
          showActionsForStudent(currentStudent || {});
          window.location.href = data.redirectUrl;
        }
        else if (data.success) {
          if (currentStudent) currentStudent.fruitIssuedToday = true;
          showActionsForStudent(currentStudent || {});
          showToast('Fruit issued');
        }
        else showToast(data.error || 'Failed', true);
      })
      .catch(function () { showToast('Request failed', true); });
  });

  issueEquipBtn.addEventListener('click', function () {
    var id = studentIdInput.value;
    if (!id) { showToast('No student selected', true); return; }
    if (currentStudent && currentStudent.activeLeave) { showToast('Student is on leave', true); return; }
    var name = window.prompt('Equipment name:');
    if (!name) return;
    openCaptureCamera('Capture Issue Photo', function (issuePhoto) {
      fetch('/admin/equipment/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, equipmentName: name, issuePhoto: issuePhoto })
      }).then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success) {
            showToast('Equipment issued');
            loadActiveEquipment(id);
          }
          else showToast((data && data.error) || 'Failed', true);
        })
        .catch(function () { showToast('Request failed', true); });
    });
  });

  refreshEquipmentBtn.addEventListener('click', function () {
    loadActiveEquipment(studentIdInput.value);
  });

  agreeReturnBtn.addEventListener('click', function () {
    if (!pendingReturn) return;

    fetch('/admin/equipment/' + encodeURIComponent(pendingReturn.equipmentId) + '/return/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        returnPhoto: pendingReturn.returnPhoto,
      })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) {
          showToast('Return saved');
          resetReturnResult();
          loadActiveEquipment(studentIdInput.value);
        } else {
          showToast((data && data.error) || 'Failed to save return', true);
        }
      })
      .catch(function () {
        showToast('Request failed', true);
      });
  });

  cancelReturnBtn.addEventListener('click', function () {
    resetReturnResult();
  });

  captureImageBtn.addEventListener('click', function () {
    var callback = captureCallback;
    var dataUrl = frameToDataUrl();
    stopCaptureCamera();
    if (callback) callback(dataUrl);
  });

  cancelCaptureBtn.addEventListener('click', function () {
    stopCaptureCamera();
  });

  function autoStartScanner() {
    startBtn.style.display = 'none';
    startScanner();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', autoStartScanner);
  } else {
    autoStartScanner();
  }
})();
