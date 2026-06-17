(function () {
  const MAX_SIZE = 512;
  const SAMPLE_SIZE = 96;

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

  async function getPixels(dataUrl) {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  }

  async function predictDamage(issuePhoto, returnPhoto) {
    if (!issuePhoto || !returnPhoto) return null;
    const before = await getPixels(issuePhoto);
    const after = await getPixels(returnPhoto);
    let changed = 0;
    let totalDiff = 0;
    const pixels = before.length / 4;

    for (let i = 0; i < before.length; i += 4) {
      const diff = (
        Math.abs(before[i] - after[i]) +
        Math.abs(before[i + 1] - after[i + 1]) +
        Math.abs(before[i + 2] - after[i + 2])
      ) / 3;
      totalDiff += diff;
      if (diff > 38) changed += 1;
    }

    const changedRatio = changed / pixels;
    const averageDiff = totalDiff / pixels / 255;
    const score = Math.round(Math.min(100, Math.max(0, (changedRatio * 82) + (averageDiff * 45))));
    return score;
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
        const issuePhoto = form.querySelector('[data-existing-issue-photo]').value;
        const returnPhotoInput = form.querySelector('[data-equipment-return-photo]');
        const damageInput = form.querySelector('[data-equipment-damage-percent]');
        const result = form.querySelector('[data-equipment-damage-result]');
        const preview = form.querySelector('[data-equipment-return-preview]');
        const returnPhoto = await compressImage(file);
        const prediction = await predictDamage(issuePhoto, returnPhoto);
        returnPhotoInput.value = returnPhoto;
        damageInput.value = prediction === null ? '' : prediction;
        setPreview(preview, returnPhoto);
        if (result) {
          result.textContent = prediction === null
            ? 'Add issue photo to predict damage.'
            : prediction + '% predicted damage';
          result.classList.remove('hidden');
        }
      });
    });
  }

  window.EquipmentDamageModel = {
    compressImage: compressImage,
    predictDamage: predictDamage,
    bind: function (scope) {
      bindIssueCapture(scope || document);
      bindReturnCapture(scope || document);
    },
  };

  window.addEventListener('DOMContentLoaded', function () {
    window.EquipmentDamageModel.bind(document);
  });
})();
