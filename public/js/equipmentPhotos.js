(function () {
  const MAX_SIZE = 512;

  function loadImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function imageToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressImage(file) {
    const dataUrl = await imageToDataUrl(file);
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.76);
  }

  function setPreview(preview, dataUrl) {
    if (!preview) return;
    preview.src = dataUrl;
    preview.classList.remove('hidden');
  }

  function bindIssueCapture(scope) {
    scope.querySelectorAll('[data-equipment-issue-input]').forEach(function (input) {
      input.addEventListener('change', async function () {
        const file = input.files && input.files[0];
        if (!file) return;
        const form = input.closest('form');
        const target = form.querySelector('[data-equipment-issue-photo]');
        const preview = form.querySelector('[data-equipment-issue-preview]');
        const dataUrl = await compressImage(file);
        target.value = dataUrl;
        setPreview(preview, dataUrl);
      });
    });
  }

  function bindReturnCapture(scope) {
    scope.querySelectorAll('[data-equipment-return-input]').forEach(function (input) {
      input.addEventListener('change', async function () {
        const file = input.files && input.files[0];
        if (!file) return;
        const form = input.closest('form');
        const returnPhotoInput = form.querySelector('[data-equipment-return-photo]');
        const result = form.querySelector('[data-equipment-return-result]');
        const preview = form.querySelector('[data-equipment-return-preview]');
        const returnPhoto = await compressImage(file);
        returnPhotoInput.value = returnPhoto;
        setPreview(preview, returnPhoto);
        if (result) {
          result.textContent = 'Return photo ready to save.';
          result.classList.remove('hidden');
        }
      });
    });
  }

  window.EquipmentPhotos = {
    compressImage: compressImage,
    bind: function (scope) {
      bindIssueCapture(scope || document);
      bindReturnCapture(scope || document);
    },
  };

  window.addEventListener('DOMContentLoaded', function () {
    window.EquipmentPhotos.bind(document);
  });
})();
