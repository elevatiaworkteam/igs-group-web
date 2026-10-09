(function () {
  const S = window.SITE || {};
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  // Menú móvil
  const tg = document.querySelector('.nav-toggle'), nav = document.querySelector('.nav');
  if (tg && nav) { tg.addEventListener('click', () => nav.classList.toggle('open')); nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open'))); }
  // Enlaces de WhatsApp: si no hay número, se ocultan
  const waMsg = encodeURIComponent(lang === 'en' ? 'Hello, I would like information about IGS Group USA.' : 'Hola, quisiera información sobre IGS Group USA.');
  document.querySelectorAll('[data-wa]').forEach(el => {
    if (S.whatsapp) { el.href = `https://wa.me/${S.whatsapp}?text=${waMsg}`; el.target = '_blank'; el.rel = 'noopener'; }
    else el.classList.add('is-hidden'), (el.style.display = 'none');
  });
  document.querySelectorAll('[data-email]').forEach(el => { el.href = 'mailto:' + S.email; if (!el.textContent.trim()) el.textContent = S.email; });
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  // Formularios simples (suministros / contacto) → /api/solicitud
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]'); const msg = form.querySelector('[data-msg]');
      const data = Object.fromEntries(new FormData(form).entries()); data.tipo = form.dataset.form; data.idioma = lang;
      btn.disabled = true; const label = btn.textContent; btn.textContent = lang === 'en' ? 'Sending…' : 'Enviando…';
      try {
        const r = await fetch('/api/solicitud', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || 'error');
        form.querySelectorAll('input,textarea,select').forEach(i => { if (i.type !== 'hidden') i.value = ''; });
        msg.className = 'alert'; msg.textContent = (lang === 'en' ? `Request received (ref. ${j.ref}). IGS Group USA will contact you shortly.` : `Solicitud recibida (ref. ${j.ref}). IGS Group USA le contactará en breve.`);
        if (window.fbq) fbq('track', 'Lead');
      } catch (err) {
        msg.className = 'alert'; msg.textContent = (lang === 'en' ? 'We could not send your request. Please write to ' : 'No pudimos enviar su solicitud. Escríbanos a ') + S.email + '.';
      } finally { btn.disabled = false; btn.textContent = label; }
    });
  });
  // Métricas opcionales
  if (S.metaPixel && !window.fbq) { !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', S.metaPixel); fbq('track', 'PageView'); }
  if (S.gaId) { const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + S.gaId; document.head.appendChild(s); window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', S.gaId); }
})();
