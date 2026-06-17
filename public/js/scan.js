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
  const equipmentPhotoInput = document.getElementById('equipmentPhotoInput');
  const returnEquipmentPhotoInput = document.getElementById('returnEquipmentPhotoInput');
  const refreshEquipmentBtn = document.getElementById('refreshEquipmentBtn');
  const activeEquipmentList = document.getElementById('activeEquipmentList');
  const returnResultPanel = document.getElementById('returnResultPanel');
  const returnResultText = document.getElementById('returnResultText');
  const agreeReturnBtn = document.getElementById('agreeReturnBtn');
  const cancelReturnBtn = document.getElementById('cancelReturnBtn');
  let pendingReturn = null;

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

    returnEquipmentPhotoInput.value = '';
    returnEquipmentPhotoInput.onchange = function () {
      var file = returnEquipmentPhotoInput.files && returnEquipmentPhotoInput.files[0];
      if (!file) return;

      window.EquipmentDamageModel.compressImage(file)
        .then(function (returnPhoto) {
          return window.EquipmentDamageModel.predictDamage(item.issuePhoto, returnPhoto)
            .then(function (damagePercentage) {
              pendingReturn = {
                equipmentId: item._id,
                equipmentName: item.equipmentName,
                returnPhoto: returnPhoto,
                damagePercentage: damagePercentage,
              };
              returnResultText.textContent = damagePercentage === null
                ? 'Could not predict damage. You can still agree and mark it returned.'
                : item.equipmentName + ': ' + damagePercentage + '% predicted damage. Agree to save and close this return.';
              returnResultPanel.classList.remove('hidden');
            });
        })
        .catch(function () {
          showToast('Could not read return image', true);
        });
    };
    returnEquipmentPhotoInput.click();
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
        if (data.success && data.redirectUrl) window.location.href = data.redirectUrl;
        else if (data.success) showToast('Fruit issued');
        else showToast(data.error || 'Failed', true);
      })
      .catch(function () { showToast('Request failed', true); });
  });

  issueEquipBtn.addEventListener('click', function () {
    var id = studentIdInput.value;
    if (!id) { showToast('No student selected', true); return; }
    var name = window.prompt('Equipment name:');
    if (!name) return;
    equipmentPhotoInput.value = '';
    equipmentPhotoInput.onchange = function () {
      var file = equipmentPhotoInput.files && equipmentPhotoInput.files[0];
      var photoPromise = file && window.EquipmentDamageModel ? window.EquipmentDamageModel.compressImage(file) : Promise.resolve('');
      photoPromise.then(function (issuePhoto) {
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
      }).catch(function () {
        showToast('Could not read equipment image', true);
      });
    };
    equipmentPhotoInput.click();
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
        damagePercentage: pendingReturn.damagePercentage,
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
})();
