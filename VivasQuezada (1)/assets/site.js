/* ──────────────────────────────────────────────────────────────
   Constructora Quezada Vivas — Site behaviour
   - Sticky nav solid state
   - Scroll reveal
   - Mobile menu
   - Fixed design settings (theme / palette / hero / nav / footer / teaser / anim / lang)
   - i18n (es/en) via [data-i18n]
   ────────────────────────────────────────────────────────────── */

/* ─── FIXED DESIGN SETTINGS ─── */
const TWEAK_DEFAULTS = {
  "theme": "light",
  "palette": "mono",
  "hero": "overlay",
  "teaser": "editorial",
  "nav": "pill",
  "footer": "editorial",
  "anim": "on",
  "lang": "es"
};

/* ─── LEAD CAPTURE ───
   Cada envío se manda a LEAD_ENDPOINT y se guarda además en el navegador
   (localStorage 'cqv.leads') como respaldo. Si LEAD_ENDPOINT queda vacío,
   el formulario sigue funcionando (se desbloquea la descarga) pero los datos
   solo se guardan localmente — NO en una base de datos central.

   CÓMO CONECTAR LA BASE DE DATOS (recomendado — Formspree, sin servidor):
     1. Cree un formulario gratis en https://formspree.io
     2. Copie la URL del formulario, ej. https://formspree.io/f/abcdwxyz
     3. Péguela abajo en LEAD_ENDPOINT (entre las comillas).
   Los envíos llegan por correo y aparecen en el panel de Formspree,
   exportables a CSV / Google Sheets.

   Alternativas: Google Forms/Sheets (Apps Script) o una función serverless
   de Vercel escribiendo a una base de datos. */
const LEAD_ENDPOINT = ''; // ← pegue aquí su URL de Formspree

async function sendLead(data) {
  // Respaldo local (solo en este navegador)
  try {
    const key = 'cqv.leads';
    const leads = JSON.parse(localStorage.getItem(key) || '[]');
    leads.push({ ...data, ts: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(leads));
  } catch (_) {}

  // Envío al servicio de formularios (si está configurado)
  if (LEAD_ENDPOINT) {
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (_) { return false; }
  }
  return true;
}

function loadTweaks() {
  return { ...TWEAK_DEFAULTS };
}

function applyTweaks(t) {
  const root = document.documentElement;
  root.setAttribute('data-theme', t.theme);
  root.setAttribute('data-palette', t.palette);
  root.setAttribute('data-hero', t.hero);
  root.setAttribute('data-nav', t.nav);
  root.setAttribute('data-footer', t.footer);
  root.setAttribute('data-teaser', t.teaser);
  root.setAttribute('data-anim', t.anim);
  root.setAttribute('lang', t.lang);
  applyI18n(t.lang);
}

/* Apply IMMEDIATELY (before DOMContentLoaded) to avoid flash */
const __initial = loadTweaks();
applyTweaks(__initial);

/* ─── i18n ─── */
function applyI18n(lang) {
  document.querySelectorAll('[data-i18n-es]').forEach(el => {
    const txt = el.getAttribute('data-i18n-' + lang);
    if (txt != null) el.textContent = txt;
  });
  document.querySelectorAll('[data-i18n-placeholder-es]').forEach(el => {
    const ph = el.getAttribute('data-i18n-placeholder-' + lang);
    if (ph != null) el.setAttribute('placeholder', ph);
  });
}

/* ─── Initialise once DOM is ready ─── */
document.addEventListener('DOMContentLoaded', () => {

  /* Sticky nav */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('solid', window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile menu toggle */
  document.querySelectorAll('[data-mobile-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = document.querySelector('[data-mobile-menu]');
      if (m) m.classList.toggle('hidden');
    });
  });
  document.querySelectorAll('[data-mobile-menu] a').forEach(a => {
    a.addEventListener('click', () => {
      document.querySelector('[data-mobile-menu]').classList.add('hidden');
    });
  });

  /* Reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('on');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ─── Scrollspy: highlight the section currently in view ─── */
  const spySections = ['inicio', 'nosotros', 'proyectos', 'equipo', 'contacto']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  function setActiveNav() {
    const pos = window.scrollY + 160;
    let currentId = null;
    spySections.forEach(sec => { if (sec.offsetTop <= pos) currentId = sec.id; });
    // Snap to the last section when scrolled to the very bottom
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      currentId = spySections[spySections.length - 1] ? spySections[spySections.length - 1].id : currentId;
    }
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }
  setActiveNav();
  window.addEventListener('scroll', setActiveNav, { passive: true });

  /* ─── Lead capture: gate document downloads behind the form ─── */
  const leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(leadForm).entries());
      const errEl = document.getElementById('lead-error');
      const required = ['nombre', 'apellido', 'correo', 'telefono'];
      const missing = required.some(k => !((data[k] || '').trim()));
      const emailOk = /.+@.+\..+/.test((data.correo || '').trim());
      if (missing || !emailOk) {
        if (errEl) errEl.style.display = 'block';
        const firstBad = required.find(k => !((data[k] || '').trim())) ||
          (!emailOk ? 'correo' : null);
        const el = firstBad && leadForm.querySelector('[name="' + firstBad + '"]');
        if (el) el.focus();
        return;
      }
      if (errEl) errEl.style.display = 'none';
      const btn = leadForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      data.origen = 'Landing — material descargable';
      await sendLead(data);
      const nameEl = document.getElementById('lead-name');
      if (nameEl) nameEl.textContent = (data.nombre || '').trim();
      leadForm.style.display = 'none';
      const success = document.getElementById('lead-success');
      if (success) success.style.display = 'block';
    });
  }

  /* ─── Inquiry form (Viva Tower II) — same lead database, simple thank-you ─── */
  const inquiry = document.getElementById('inquiry-form');
  if (inquiry) {
    inquiry.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(inquiry).entries());
      const errEl = document.getElementById('inquiry-error');
      const required = ['nombre', 'apellido', 'telefono'];
      const missing = required.some(k => !((data[k] || '').trim()));
      const emailOk = /.+@.+\..+/.test((data.correo || '').trim());
      if (missing || !emailOk) {
        if (errEl) errEl.style.display = 'block';
        return;
      }
      if (errEl) errEl.style.display = 'none';
      const btn = inquiry.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      data.origen = 'Viva Tower II — solicitud';
      await sendLead(data);
      const nameEl = document.getElementById('inquiry-name');
      if (nameEl) nameEl.textContent = (data.nombre || '').trim();
      inquiry.style.display = 'none';
      const ok = document.getElementById('inquiry-success');
      if (ok) ok.style.display = 'block';
    });
  }

});
