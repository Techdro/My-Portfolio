// Change this to your real email address
const EMAIL = "toribioandro7@gmail.com";

// Opens a Gmail compose window addressed to you (works in any browser where the visitor is signed in to Gmail)
function gmailLink(subject = '', body = '') {
  return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(EMAIL) +
    '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}

// 1. Dark / light toggle (remembers your choice)
const root = document.documentElement;
const themeBtn = document.getElementById('theme');

function currentTheme() {
  return root.dataset.theme ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}

try {
  const saved = localStorage.getItem('theme');
  if (saved) applyTheme(saved);
} catch (e) { /* storage unavailable, ignore */ }

themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// 2. Mobile menu
const header = document.querySelector('.top');
const menuBtn = document.getElementById('menu');

function setMenu(open) {
  header.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('open')));
document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// 3. Highlight the nav link for the section on screen
const links = [...document.querySelectorAll('#nav a')];
const sections = links
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// 4. Project filter
const chips = document.querySelectorAll('.chip');
const rows = document.querySelectorAll('#project-list .row');
const emptyMsg = document.getElementById('empty');

chips.forEach(chip => chip.addEventListener('click', () => {
  const f = chip.dataset.filter;
  chips.forEach(c => {
    const on = c === chip;
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  let shown = 0;
  rows.forEach(r => {
    const show = f === 'all' || r.dataset.cat === f;
    r.hidden = !show;
    if (show) shown++;
  });
  emptyMsg.hidden = shown > 0;
}));

// 5. Contact form: checks the fields, then opens your email app with the message filled in
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  [form.name, form.email, form.message].forEach(f => f.removeAttribute('aria-invalid'));
  if (!name) { form.name.setAttribute('aria-invalid', 'true'); status.textContent = 'Enter your name.'; form.name.focus(); return; }
  if (!ok) { form.email.setAttribute('aria-invalid', 'true'); status.textContent = 'Enter a valid email address.'; form.email.focus(); return; }
  if (!message) { form.message.setAttribute('aria-invalid', 'true'); status.textContent = 'Write a short message.'; form.message.focus(); return; }

  const subject = `${form.service.value} enquiry from ${name}`;
  const body = `${message}\n\nFrom: ${name} (${email})`;
  const url = gmailLink(subject, body);
  const win = window.open(url, '_blank');
  if (win) win.opener = null;
  else window.location.href = url;   // popup blocked: open in this tab instead
  status.textContent = 'Opening Gmail with your message. Press Send there to finish. If nothing opens, use the Copy my email button.';
});

// 6. Copy email button
document.getElementById('copy-email').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    status.textContent = `Copied ${EMAIL}`;
  } catch (err) {
    status.textContent = `My email is ${EMAIL}`;
  }
});

// 7. Make every email link open Gmail
document.querySelectorAll('a[href^="mailto:"]').forEach(a => { a.href = gmailLink(); a.target = '_blank'; a.rel = 'noopener'; });

// 8. Particle background in the hero: dots drift, link up, and are drawn toward your cursor
(() => {
  const hero = document.getElementById('home');
  const canvas = document.getElementById('particles');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: -999, y: -999 };
  let w = 0, h = 0, dots = [], ink = '#141418', running = true, frame = 0;

  function resize() {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(70, Math.round((w * h) / 14000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
      r: 1.2 + Math.random() * 1.8
    }));
    if (still) draw();
  }

  function draw() {
    if (frame++ % 30 === 0) ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || ink;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ink; ctx.strokeStyle = ink;
    for (let i = 0; i < dots.length; i++) {
      const p = dots[i];
      if (!still) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
        if (d < 180 && d > 1) { p.vx += (dx / d) * .02; p.vy += (dy / d) * .02; }
        p.vx *= .99; p.vy *= .99;
        const s = Math.hypot(p.vx, p.vy);
        if (s > 1.2) { p.vx = p.vx / s * 1.2; p.vy = p.vy / s * 1.2; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }
      ctx.globalAlpha = .45;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      for (let k = i + 1; k < dots.length; k++) {
        const q = dots[k], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 110) {
          ctx.globalAlpha = (1 - d / 110) * .22;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      const md = Math.hypot(mouse.x - p.x, mouse.y - p.y);
      if (md < 150) {
        ctx.globalAlpha = (1 - md / 150) * .5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() { if (running) draw(); requestAnimationFrame(loop); }

  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([en]) => { running = en.isIntersecting; }).observe(hero);
  resize();
  if (!still) loop();
})();