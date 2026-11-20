const { links, downloads } = window.COVE

document.querySelectorAll('[data-link]').forEach(a => {
  a.href = links[a.dataset.link]
})

fetch('/api/status')
  .then(r => r.json())
  .then(({ released }) => {
    if (!released) return
    document.getElementById('dlLead').textContent = 'Download Cove for your system.'
    document.querySelectorAll('[data-download]').forEach(a => {
      const url = downloads[a.dataset.download]
      if (!url) return
      a.href = url
      a.classList.remove('off')
    })
  })
  .catch(() => {})
