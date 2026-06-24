(function () {
  const form = document.getElementById('reportForm');
  const status = document.getElementById('reportStatus');
  const button = document.getElementById('generateReportBtn');

  function setStatus(message, isError) {
    status.textContent = message;
    status.className = 'mt-3 text-sm ' + (isError ? 'text-red-700' : 'text-green-700');
    status.classList.remove('hidden');
  }

  function getReportUrl(from, to) {
    return '/admin/report/generate?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to);
  }

  async function shareReport(url, filename) {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Report could not be generated');
    const blob = await response.blob();
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({
        title: 'Hostel Report',
        text: 'Hostel report PDF',
        files: [file],
      });
      return true;
    }

    if (window.HostelAdminApp && typeof window.HostelAdminApp.shareReportUrl === 'function') {
      window.HostelAdminApp.shareReportUrl(new URL(url, window.location.origin).href);
      return true;
    }

    return false;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const from = form.from.value;
    const to = form.to.value;
    if (!from || !to || from > to) {
      setStatus('Please select a valid date range.', true);
      return;
    }

    const url = getReportUrl(from, to);
    const filename = 'hostel-report-' + from + '-to-' + to + '.pdf';
    button.disabled = true;
    button.textContent = 'Generating...';
    setStatus('Preparing report...', false);

    try {
      const shared = await shareReport(url, filename);
      if (shared) {
        setStatus('Share window opened.', false);
      } else {
        setStatus('Sharing is not supported here. Opening PDF instead.', false);
        window.open(url, '_blank');
      }
    } catch (error) {
      setStatus(error.message || 'Failed to generate report.', true);
    } finally {
      button.disabled = false;
      button.textContent = 'Generate Report';
    }
  });
})();
