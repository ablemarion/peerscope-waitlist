;(function () {
  var STORAGE_KEY = 'peerscope_urgency_banner_v1'
  var FOUNDING_CAP = 50
  var DEADLINE = new Date('2026-04-15T23:59:59+08:00')

  if (Date.now() > DEADLINE.getTime()) return

  try {
    var stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      var parsed = JSON.parse(stored)
      if (parsed.dismissed && Date.now() - parsed.ts < 24 * 60 * 60 * 1000) return
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (e) {}

  var banner = document.createElement('div')
  banner.setAttribute('role', 'banner')
  banner.setAttribute('id', 'ps-urgency-banner')
  banner.style.cssText = [
    'position:relative',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'min-height:40px',
    'background:#B8622A',
    'padding:8px 44px',
    'font-family:Inter,system-ui,sans-serif',
  ].join(';')

  var text = document.createElement('p')
  text.style.cssText = 'font-size:13px;color:#fff;text-align:center;line-height:1.4;margin:0'
  text.innerHTML = '⏰ Founding member pricing closes April 15 &middot; <a href="/#waitlist" style="color:#fff;font-weight:600;text-decoration:underline;text-underline-offset:2px">Sign up &rarr;</a>'

  var closeBtn = document.createElement('button')
  closeBtn.setAttribute('aria-label', 'Dismiss founding pricing banner')
  closeBtn.style.cssText = [
    'position:absolute',
    'right:4px',
    'top:50%',
    'transform:translateY(-50%)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'width:44px',
    'height:44px',
    'background:none',
    'border:none',
    'cursor:pointer',
    'opacity:0.6',
    'color:#fff',
    'padding:0',
  ].join(';')
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>'
  closeBtn.addEventListener('mouseover', function () { closeBtn.style.opacity = '1' })
  closeBtn.addEventListener('mouseout', function () { closeBtn.style.opacity = '0.6' })
  closeBtn.addEventListener('click', function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: true, ts: Date.now() }))
    } catch (e) {}
    banner.style.display = 'none'
  })

  banner.appendChild(text)
  banner.appendChild(closeBtn)

  var body = document.body
  body.insertBefore(banner, body.firstChild)

  // Fetch spot count
  fetch('/api/public/stats')
    .then(function (r) { return r.ok ? r.json() : null })
    .then(function (data) {
      if (data && data.show_count && typeof data.count === 'number') {
        var left = Math.max(0, FOUNDING_CAP - data.count)
        if (left > 0) {
          text.innerHTML = '⏰ Founding member pricing closes April 15 &mdash; ' + left + ' spot' + (left === 1 ? '' : 's') + ' remaining &middot; <a href="/#waitlist" style="color:#fff;font-weight:600;text-decoration:underline;text-underline-offset:2px">Sign up &rarr;</a>'
        }
      }
    })
    .catch(function () {})
})()
