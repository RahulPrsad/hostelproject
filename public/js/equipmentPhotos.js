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

  function bindPhotoViewer(scope) {
    const overlay = document.getElementById('photoViewerOverlay');
    const viewerImage = document.getElementById('photoViewerImage');
    const closeBtn = document.getElementById('photoViewerClose');
    const zoomInBtn = document.getElementById('photoViewerZoomIn');
    const zoomOutBtn = document.getElementById('photoViewerZoomOut');
    if (!overlay || !viewerImage || !closeBtn || !zoomInBtn || !zoomOutBtn) return;

    let zoom = 1;

    function renderZoom() {
      viewerImage.style.transform = 'scale(' + zoom + ')';
    }

    function openViewer(src, alt) {
      zoom = 1;
      viewerImage.src = src;
      viewerImage.alt = alt || 'Equipment photo';
      renderZoom();
      overlay.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    function closeViewer() {
      overlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      viewerImage.src = '';
    }

    scope.querySelectorAll('[data-photo-viewer]').forEach(function (photo) {
      if (photo.dataset.photoViewerBound === '1') return;
      photo.dataset.photoViewerBound = '1';
      photo.addEventListener('click', function () {
        openViewer(photo.src, photo.alt);
      });
    });

    if (overlay.dataset.photoViewerControlsBound === '1') return;
    overlay.dataset.photoViewerControlsBound = '1';

    closeBtn.addEventListener('click', closeViewer);
    zoomInBtn.addEventListener('click', function () {
      zoom = Math.min(4, Math.round((zoom + 0.25) * 100) / 100);
      renderZoom();
    });
    zoomOutBtn.addEventListener('click', function () {
      zoom = Math.max(0.5, Math.round((zoom - 0.25) * 100) / 100);
      renderZoom();
    });
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeViewer();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !overlay.classList.contains('hidden')) {
        closeViewer();
      }
    });
  }

  window.EquipmentPhotos = {
    compressImage: compressImage,
    bind: function (scope) {
      bindIssueCapture(scope || document);
      bindReturnCapture(scope || document);
      bindPhotoViewer(scope || document);
    },
  };

  window.addEventListener('DOMContentLoaded', function () {
    window.EquipmentPhotos.bind(document);
  });
})();
