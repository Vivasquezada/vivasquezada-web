/* ──────────────────────────────────────────────────────────────
   Constructora Quezada Vivas — Site behaviour
   - Sticky nav solid state
   - Scroll reveal
   - Mobile menu
   - Tweaks panel (theme / palette / hero / nav / footer / teaser / anim / lang)
   - i18n (es/en) via [data-i18n]
   ────────────────────────────────────────────────────────────── */

/* ─── EDIT MODE DEFAULTS (persisted to disk via host) ─── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "palette": "mono",
  "hero": "overlay",
  "teaser": "editorial",
  "nav": "pill",
  "footer": "editorial",
  "anim": "on",
  "lang": "es"
}/*EDITMODE-END*/;

const STORAGE_KEY = 'cqv.tweaks.v2';

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
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...TWEAK_DEFAULTS, ...saved };
  } catch { return { ...TWEAK_DEFAULTS }; }
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

function saveTweaks(t) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  // Persist via host if running in tweak edit mode
  try {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: t }, '*');
  } catch {}
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

  const tweaks = loadTweaks();
  applyTweaks(tweaks);

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

  /* Build tweaks panel */
  buildTweaksPanel(tweaks);
});

/* ─── TWEAKS PANEL UI ─── */
function buildTweaksPanel(state) {
  const fab = document.createElement('button');
  fab.className = 'tw-fab show';
  fab.setAttribute('aria-label', 'Tweaks');
  fab.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.className = 'tw-panel';
  panel.innerHTML = `
    <button class="tw-close" aria-label="Close">×</button>
    <p class="tw-title">Tweaks</p>
    <p class="tw-sub">Live customization — saved automatically.</p>

    <h4>Lang</h4>
    <div class="tw-row" data-tw-group="lang">
      <button class="tw-btn" data-v="es">Español</button>
      <button class="tw-btn" data-v="en">English</button>
    </div>

    <h4>Theme</h4>
    <div class="tw-row" data-tw-group="theme">
      <button class="tw-btn" data-v="light">Light</button>
      <button class="tw-btn" data-v="dark">Dark</button>
    </div>

    <h4>Palette</h4>
    <div class="tw-swatches" data-tw-group="palette">
      <div class="tw-swatch" data-v="earth" title="Earthy luxury">
        <span style="background:#2c3a2e"></span><span style="background:#a8895f"></span><span style="background:#f5f1ea"></span><span style="background:#d9d2c4"></span>
      </div>
      <div class="tw-swatch" data-v="navy" title="Navy & terracotta">
        <span style="background:#0f2b5c"></span><span style="background:#c9663b"></span><span style="background:#eef0f3"></span><span style="background:#d8dde6"></span>
      </div>
      <div class="tw-swatch" data-v="mono" title="Monochrome">
        <span style="background:#18181a"></span><span style="background:#6b6b6d"></span><span style="background:#f4f3ef"></span><span style="background:#d8d6d2"></span>
      </div>
    </div>

    <h4>Hero layout</h4>
    <div class="tw-row" data-tw-group="hero">
      <button class="tw-btn" data-v="split">Split</button>
      <button class="tw-btn" data-v="overlay">Overlay</button>
      <button class="tw-btn" data-v="stack">Editorial</button>
    </div>

    <h4>Project teaser</h4>
    <div class="tw-row" data-tw-group="teaser">
      <button class="tw-btn" data-v="editorial">Editorial</button>
      <button class="tw-btn" data-v="card">Card</button>
      <button class="tw-btn" data-v="fullbleed">Full-bleed</button>
    </div>

    <h4>Nav style</h4>
    <div class="tw-row" data-tw-group="nav">
      <button class="tw-btn" data-v="classic">Classic</button>
      <button class="tw-btn" data-v="pill">Pill</button>
    </div>

    <h4>Footer style</h4>
    <div class="tw-row" data-tw-group="footer">
      <button class="tw-btn" data-v="editorial">Editorial</button>
      <button class="tw-btn" data-v="minimal">Minimal</button>
      <button class="tw-btn" data-v="statement">Statement</button>
    </div>

    <h4>Animations</h4>
    <div class="tw-row" data-tw-group="anim">
      <button class="tw-btn" data-v="on">On</button>
      <button class="tw-btn" data-v="off">Off</button>
    </div>
  `;
  document.body.appendChild(panel);

  const refresh = () => {
    panel.querySelectorAll('[data-tw-group]').forEach(group => {
      const g = group.getAttribute('data-tw-group');
      group.querySelectorAll('[data-v]').forEach(btn => {
        btn.classList.toggle('on', btn.getAttribute('data-v') === state[g]);
      });
    });
  };
  refresh();

  // Toggle open/close
  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
  });
  panel.querySelector('.tw-close').addEventListener('click', () => {
    panel.classList.remove('open');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch {}
  });

  // Click handler — delegate
  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-v]');
    if (!btn) return;
    const group = btn.closest('[data-tw-group]') || btn.parentElement.closest('[data-tw-group]') || btn.parentElement;
    const g = group.getAttribute('data-tw-group');
    if (!g) return;
    state[g] = btn.getAttribute('data-v');
    refresh();
    applyTweaks(state);
    saveTweaks(state);
  });

  /* Edit-mode protocol — register listener FIRST then announce */
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === '__activate_edit_mode') panel.classList.add('open');
    if (d.type === '__deactivate_edit_mode') panel.classList.remove('open');
  });
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch {}
}
