for(let y=2026;y>=1940;y--)document.write(`<option>${y}</option>`)

// ── ADDON TOGGLE ──
function toggleAddon(el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.addon.open').forEach(a => a.classList.remove('open'));
  if (!wasOpen) el.classList.add('open');
}

// ── REVIEWS ──
const REVIEWS = [
  {rating:5.0},{rating:4.5},{rating:5.0},{rating:4.2},{rating:5.0},{rating:4.8}
];
function renderStars(rating, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += '<span class="star full">★</span>';
    else if (rating >= i - 0.5) html += '<span class="star half">★</span>';
    else html += '<span class="star empty">★</span>';
  }
  html += `<span class="star-num">${rating.toFixed(1)}</span>`;
  el.innerHTML = html;
}
REVIEWS.forEach((r, i) => renderStars(r.rating, `stars-${i}`));

// ── NAV ──
window.addEventListener('scroll', () => document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50));
window.addEventListener('load', () => { document.getElementById('hero').classList.add('loaded'); });
function toggleMenu() { document.getElementById('mob-menu').classList.toggle('open'); }
function closeMob() { document.getElementById('mob-menu').classList.remove('open'); }

// Keyboard support for role="button" package cards
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.pkg[role="button"],.nano-pkg[role="button"]')) {
    e.preventDefault();
    e.target.click();
  }
});

// ── SCROLL REVEAL ──
const ro = new IntersectionObserver(entries => entries.forEach((e, i) => {
  if (e.isIntersecting) setTimeout(() => e.target.classList.add('vis'), i * 80);
}), { threshold: .08 });
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => ro.observe(el));

// ── DATA ──
let bookings = JSON.parse(localStorage.getItem('dba_bookings') || '[]');
let leads = JSON.parse(localStorage.getItem('dba_leads') || '[]');
let settings = JSON.parse(localStorage.getItem('dba_settings') || '{"code":"FIRST10","disc":10,"delay":4,"popup":true,"pass":"admin123","phone":"(XXX) XXX-XXXX","email":"hello@detailedbyaustin.com","loc":"Your City, Province/State","openTime":"8:00 AM","closeTime":"6:00 PM","days":{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":true,"sun":false},"social":{"ig":"","tk":"","fb":"","yt":"","tw":""}}');
function persist() { localStorage.setItem('dba_bookings', JSON.stringify(bookings)); localStorage.setItem('dba_leads', JSON.stringify(leads)); localStorage.setItem('dba_settings', JSON.stringify(settings)); }

// ── APPLY SETTINGS TO SITE ──
function applySettings() {
  document.getElementById('contact-phone').textContent = settings.phone || '(XXX) XXX-XXXX';
  document.getElementById('contact-email').textContent = settings.email || 'hello@detailedbyaustin.com';
  document.getElementById('contact-loc').textContent = settings.loc || 'Your City';
  // hours
  const days = settings.days || {};
  const dayNames = {mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun'};
  const open = Object.entries(dayNames).filter(([k]) => days[k]).map(([,v]) => v);
  const closed = Object.entries(dayNames).filter(([k]) => !days[k]).map(([,v]) => v);
  document.getElementById('contact-hours').textContent = open.length ? `${open[0]}–${open[open.length-1]}: ${settings.openTime||'8AM'} – ${settings.closeTime||'6PM'}` : 'By Appointment';
  document.getElementById('contact-closed').textContent = closed.length ? `${closed.join(', ')}: Closed` : '';
  // social
  const soc = settings.social || {};
  const socMap = [['ig','soc-ig','soc-ig-url'],['tk','soc-tk','soc-tk-url'],['fb','soc-fb','soc-fb-url'],['yt','soc-yt','soc-yt-url'],['tw','soc-tw','soc-tw-url']];
  socMap.forEach(([key, elId, inputId]) => {
    const url = soc[key] || '';
    const el = document.getElementById(elId);
    if (el) { if (url) { el.href = url; el.style.display = 'flex'; } else { el.style.display = 'none'; } }
    const inp = document.getElementById(inputId);
    if (inp) inp.value = url;
  });
  // promo float
  const pf = document.getElementById('promo-float');
  pf.style.display = settings.popup !== false ? 'block' : 'none';
}
applySettings();

// ── PROMO POPUP ──
if (!sessionStorage.getItem('promo_closed') && settings.popup !== false) {
  setTimeout(() => document.getElementById('promo-overlay').classList.add('show'), (settings.delay || 4) * 1000);
}
function reopenPromo() {
  document.getElementById('promo-form-wrap').style.display = 'block';
  document.getElementById('promo-success-wrap').style.display = 'none';
  document.getElementById('promo-overlay').classList.add('show');
}
function closePromo() {
  document.getElementById('promo-overlay').classList.remove('show');
  sessionStorage.setItem('promo_closed', '1');
}
function submitPromo() {
  const em = document.getElementById('promo-email').value.trim();
  const ph = document.getElementById('promo-phone').value.trim();
  if (!em || !ph) { alert('Please enter your email and phone number.'); return; }
  leads.push({ id: leads.length + 1, email: em, phone: ph, code: settings.code || 'FIRST10', date: new Date().toLocaleDateString(), used: false });
  persist();
  document.getElementById('promo-form-wrap').style.display = 'none';
  document.getElementById('promo-success-wrap').style.display = 'block';
  document.getElementById('promo-code-display').textContent = settings.code || 'FIRST10';
}
function copyCode() {
  navigator.clipboard.writeText(document.getElementById('promo-code-display').textContent).then(() => {
    const b = document.querySelector('.p-copy-btn'); b.textContent = 'Copied!'; setTimeout(() => b.textContent = 'Copy', 2000);
  });
}

// ── BOOKING ──
let bkStep = 0, bk = { items: [], addons: [], date: null, dateStr: '', time: null };
let calY, calMo;
function openBooking(id) {
  // Always dismiss promo so the booking modal is clickable
  const promo = document.getElementById('promo-overlay');
  if (promo) promo.classList.remove('show');
  sessionStorage.setItem('promo_closed', '1');
  bkStep = 0;
  // If launching from a package button, reset selections and auto-select that one
  if (id) {
    bk.items = [];
    bk.addons = [];
    document.querySelectorAll('.svc-opt').forEach(x => x.classList.remove('sel'));
  }
  updateSteps();
  updateTotal();
  document.getElementById('booking-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id) {
    const b = document.querySelector(`.svc-opt[data-id="${id}"]`);
    if (b) { pickSvc(b); }
  }
}
function closeBooking() {
  document.getElementById('booking-overlay').classList.remove('open');
  document.body.style.overflow = '';
  bkStep = 0;
  updateSteps();
}
function bkOvClick(e) { if (e.target === document.getElementById('booking-overlay')) closeBooking(); }
function closeSuccess() { document.getElementById('success-overlay').classList.remove('open'); }
function updateSteps() {
  for (let i = 0; i < 4; i++) {
    document.getElementById(`sp${i}`).classList.toggle('active', i === bkStep);
    document.getElementById(`si${i}`).classList.toggle('active', i <= bkStep);
    if (i < 3) document.getElementById(`sl${i}`).classList.toggle('done', i < bkStep);
  }
  document.getElementById('bk-prev').style.visibility = bkStep > 0 ? 'visible' : 'hidden';
  const nx = document.getElementById('bk-next');
  nx.textContent = bkStep === 3 ? 'Confirm & Pay →' : 'Next →';
  chkNx();
}
function chkNx() {
  const nx = document.getElementById('bk-next');
  if (bkStep === 0) nx.disabled = bk.items.length === 0;
  else if (bkStep === 1) nx.disabled = !bk.date || !bk.time;
  else if (bkStep === 2) nx.disabled = !validStep2();
  else nx.disabled = false;
}
function nextBk() { if (bkStep === 3) { doSubmit(); return; } bkStep++; updateSteps(); if (bkStep === 1) initCal(); if (bkStep === 3) fillConfirm(); }
function prevBk() { if (bkStep > 0) { bkStep--; updateSteps(); } }
function computeSubtotal() {
  return bk.items.reduce((s, x) => s + x.price, 0) + bk.addons.reduce((s, x) => s + x.price, 0);
}
function updateTotal() {
  const subtotal = computeSubtotal();
  const tv = document.getElementById('bk-total-val');
  const tc = document.getElementById('bk-total-count');
  if (tv) tv.textContent = `$${subtotal.toLocaleString()}`;
  const n = bk.items.length + bk.addons.length;
  if (tc) tc.textContent = n === 0 ? 'No items selected' : `${bk.items.length} service${bk.items.length===1?'':'s'}${bk.addons.length?` • ${bk.addons.length} add-on${bk.addons.length===1?'':'s'}`:''}`;
}
function pickSvc(b) {
  const id = b.dataset.id;
  const i = bk.items.findIndex(x => x.id === id);
  if (i >= 0) { bk.items.splice(i, 1); b.classList.remove('sel'); }
  else { bk.items.push({ id, name: b.dataset.name, price: parseInt(b.dataset.price) }); b.classList.add('sel'); }
  updateTotal(); chkNx();
}
function pickAddon(b) {
  const id = b.dataset.id;
  const i = bk.addons.findIndex(x => x.id === id);
  if (i >= 0) { bk.addons.splice(i, 1); b.classList.remove('sel'); }
  else { bk.addons.push({ id, name: b.dataset.name, price: parseInt(b.dataset.price) }); b.classList.add('sel'); }
  updateTotal(); chkNx();
}

// calendar
const TIMES = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM'];
const DNS = ['Su','Mo','Tu','We','Th','Fr','Sa'], MNS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function initCal() { const n = new Date(); calY = calY || n.getFullYear(); calMo = calMo != null ? calMo : n.getMonth(); renderCal(); }
function renderCal() {
  document.getElementById('cal-lbl').textContent = `${MNS[calMo]} ${calY}`;
  const g = document.getElementById('cal-grid');
  g.innerHTML = DNS.map(d => `<div class="cal-dn">${d}</div>`).join('');
  const first = new Date(calY, calMo, 1).getDay(), days = new Date(calY, calMo + 1, 0).getDate(), tod = new Date();
  const closedDays = settings.days || {};
  const dayKeys = ['sun','mon','tue','wed','thu','fri','sat'];
  for (let i = 0; i < first; i++) g.innerHTML += `<button class="cal-d emp" disabled></button>`;
  for (let d = 1; d <= days; d++) {
    const dt = new Date(calY, calMo, d);
    const dayKey = dayKeys[dt.getDay()];
    const closed = closedDays[dayKey] === false;
    const past = dt < new Date(tod.getFullYear(), tod.getMonth(), tod.getDate());
    const sel = bk.date && bk.date.getDate() === d && bk.date.getMonth() === calMo && bk.date.getFullYear() === calY;
    g.innerHTML += `<button class="cal-d${closed || past ? ' dis' : ''}${sel ? ' sel' : ''}" ${closed || past ? 'disabled' : ''} onclick="pickDate(${calY},${calMo},${d})">${d}</button>`;
  }
}
function prevMo() { calMo === 0 ? (calMo = 11, calY--) : calMo--; renderCal(); }
function nextMo() { calMo === 11 ? (calMo = 0, calY++) : calMo++; renderCal(); }
function pickDate(y, m, d) { bk.date = new Date(y, m, d); bk.dateStr = bk.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); renderCal(); showSlots(); }
function showSlots() {
  document.getElementById('slots-hint').style.display = 'none';
  const g = document.getElementById('slots-grid'); g.style.display = 'grid';
  g.innerHTML = TIMES.map(t => `<button class="slot-btn${bk.time === t ? ' sel' : ''}" onclick="pickTime('${t}')">${t}</button>`).join('');
  chkNx();
}
function pickTime(t) { bk.time = t; document.querySelectorAll('.slot-btn').forEach(b => b.classList.toggle('sel', b.textContent === t)); chkNx(); }
function validStep2() { return ['fn','fe','fp'].every(id => document.getElementById(id).value.trim()) && document.getElementById('fm').value && document.getElementById('fmo').value.trim() && document.getElementById('fy').value; }
function fillConfirm() {
  const code = document.getElementById('fc').value.trim().toUpperCase();
  const vc = (settings.code || 'FIRST10').toUpperCase();
  const alreadyUsed = leads.find(l => l.code === code && l.used);
  const promoOk = code && code === vc && !alreadyUsed;
  const subtotal = computeSubtotal();
  const disc = promoOk ? Math.round(subtotal * ((settings.disc || 10) / 100)) : 0;
  const fp = subtotal - disc;
  // Items list
  const list = document.getElementById('cf-items-list');
  let html = '';
  bk.items.forEach(it => {
    html += `<div class="cf-item-row"><div class="cf-item-name"><span class="cf-item-tag">Service</span>${it.name}</div><div class="cf-item-price">$${it.price}</div></div>`;
  });
  bk.addons.forEach(it => {
    html += `<div class="cf-item-row"><div class="cf-item-name"><span class="cf-item-tag">Add-on</span>${it.name}</div><div class="cf-item-price">$${it.price}</div></div>`;
  });
  if (promoOk) html += `<div class="cf-item-row"><div class="cf-item-name" style="color:var(--red)"><span class="cf-item-tag">Promo</span>${code} (-${settings.disc || 10}%)</div><div class="cf-item-price" style="color:var(--red)">−$${disc}</div></div>`;
  list.innerHTML = html;
  document.getElementById('cf-total').textContent = `$${fp.toLocaleString()}`;
  document.getElementById('cf-date').textContent = bk.dateStr;
  document.getElementById('cf-time').textContent = bk.time;
  document.getElementById('cf-cust').innerHTML = `${document.getElementById('fn').value}<br><span style="color:var(--mut);font-size:12px">${document.getElementById('fe').value}</span>`;
  document.getElementById('cf-veh').textContent = `${document.getElementById('fy').value} ${document.getElementById('fm').value} ${document.getElementById('fmo').value}`;
  const pr = document.getElementById('cf-promo-row');
  if (promoOk) { pr.style.display = 'block'; document.getElementById('cf-promo-code').textContent = code; } else pr.style.display = 'none';
  const note = document.getElementById('cf-note');
  const stripe = settings.stripe || {};
  if (stripe.enabled && stripe.paymentLink) {
    note.innerHTML = `You'll be redirected to <strong style="color:#fff">Stripe</strong> to complete payment securely.`;
    document.getElementById('bk-next').textContent = 'Confirm & Pay with Stripe →';
  } else {
    note.textContent = "You'll receive a confirmation after we review your booking.";
    document.getElementById('bk-next').textContent = 'Confirm Booking →';
  }
  document.getElementById('bk-next').disabled = false;
}
function doSubmit() {
  const code = document.getElementById('fc').value.trim().toUpperCase();
  const vc = (settings.code || 'FIRST10').toUpperCase();
  const lead = leads.find(l => l.code === code && !l.used);
  const subtotal = computeSubtotal();
  let fp = subtotal;
  if (code === vc && lead) { fp = subtotal - Math.round(subtotal * ((settings.disc || 10) / 100)); lead.used = true; }
  const svcName = [...bk.items.map(i => i.name), ...bk.addons.map(i => `+ ${i.name}`)].join(', ') || 'Booking';
  const booking = {
    id: bookings.length + 1,
    name: document.getElementById('fn').value,
    email: document.getElementById('fe').value,
    phone: document.getElementById('fp').value,
    make: document.getElementById('fm').value,
    model: document.getElementById('fmo').value,
    year: document.getElementById('fy').value,
    notes: document.getElementById('fno').value,
    svc: svcName,
    items: bk.items.slice(),
    addons: bk.addons.slice(),
    date: bk.dateStr,
    time: bk.time,
    price: fp,
    promo: code === vc ? code : '',
    status: 'pending',
    created: new Date().toLocaleDateString()
  };
  bookings.push(booking);
  persist();
  // Stripe redirect if configured
  const stripe = settings.stripe || {};
  if (stripe.enabled && stripe.paymentLink) {
    try {
      const u = new URL(stripe.paymentLink);
      u.searchParams.set('prefilled_email', booking.email);
      u.searchParams.set('client_reference_id', `BK${booking.id}`);
      closeBooking();
      resetBooking();
      window.location.href = u.toString();
      return;
    } catch (e) { console.warn('Invalid Stripe payment link', e); }
  }
  closeBooking();
  document.getElementById('success-overlay').classList.add('open');
  resetBooking();
}
function resetBooking() {
  bkStep = 0; bk = { items: [], addons: [], date: null, dateStr: '', time: null }; calY = undefined; calMo = undefined;
  ['fn','fe','fp','fc','fmo','fno'].forEach(id => document.getElementById(id).value = '');
  ['fm','fy'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('slots-grid').style.display = 'none'; document.getElementById('slots-hint').style.display = 'block';
  document.querySelectorAll('.svc-opt').forEach(b => b.classList.remove('sel'));
  updateTotal();
  updateSteps();
}

// ── ADMIN ──
let admIn = false;
function openAdmin() { document.getElementById('admin-overlay').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeAdmin() { document.getElementById('admin-overlay').classList.remove('open'); document.body.style.overflow = ''; }
function admLogin() {
  if (document.getElementById('adm-pass').value === (settings.pass || 'admin123')) {
    admIn = true; document.getElementById('adm-login').style.display = 'none'; document.getElementById('adm-dash').style.display = 'block'; renderAdmin(); loadSettingsUI();
  } else { document.getElementById('adm-err').style.display = 'block'; }
}
function admTab(btn, id) { document.querySelectorAll('.adm-tab').forEach(t => t.classList.remove('active')); document.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('active')); btn.classList.add('active'); document.getElementById(id).classList.add('active'); }
function renderAdmin() {
  const rev = bookings.reduce((a, b) => a + (b.price || 0), 0);
  const pend = bookings.filter(b => b.status === 'pending').length;
  document.getElementById('stat-rev').textContent = `$${rev.toLocaleString()}`;
  document.getElementById('stat-total').textContent = bookings.length;
  document.getElementById('stat-leads').textContent = leads.length;
  document.getElementById('stat-pend').textContent = pend;
  renderBkTable('ov-tbody', [...bookings].reverse().slice(0, 6), false);
  renderBkTable('bk-tbody', [...bookings].reverse(), true);
  renderLeads();
}
function sbBadge(s) { const m = { pending: 'sb-pend', confirmed: 'sb-conf', completed: 'sb-comp', cancelled: 'sb-canc' }; return `<span class="sb ${m[s] || 'sb-pend'}">${s}</span>`; }
function renderBkTable(id, data, full) {
  const tb = document.getElementById(id); tb.innerHTML = '';
  if (!data.length) { tb.innerHTML = `<tr><td colspan="12" style="text-align:center;color:#52525B;padding:28px">No bookings yet.</td></tr>`; return; }
  data.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = full
      ? `<td>#${b.id}</td><td><strong>${b.name}</strong></td><td style="color:var(--mut)">${b.email}</td><td style="color:var(--mut)">${b.phone}</td><td style="color:var(--mut)">${b.year} ${b.make} ${b.model}</td><td>${b.svc}</td><td>${b.date}</td><td>${b.time}</td><td style="color:var(--red);font-family:'Bebas Neue';font-size:17px">$${b.price}</td><td>${b.promo ? `<span style="color:var(--red);font-weight:700">${b.promo}</span>` : '—'}</td><td>${sbBadge(b.status)}</td><td><button class="adm-act g" onclick="setSt(${b.id},'confirmed')">Confirm</button><button class="adm-act g" onclick="setSt(${b.id},'completed')">Done</button><button class="adm-act" onclick="setSt(${b.id},'cancelled')">Cancel</button></td>`
      : `<td>#${b.id}</td><td><strong>${b.name}</strong></td><td>${b.svc}</td><td>${b.date}</td><td>${b.time}</td><td style="color:var(--red);font-family:'Bebas Neue';font-size:17px">$${b.price}</td><td>${sbBadge(b.status)}</td><td><button class="adm-act g" onclick="setSt(${b.id},'confirmed')">Confirm</button></td>`;
    tb.appendChild(tr);
  });
}
function renderLeads() {
  const tb = document.getElementById('leads-tbody'); tb.innerHTML = '';
  if (!leads.length) { tb.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#52525B;padding:28px">No promo leads yet.</td></tr>`; return; }
  leads.forEach((l, i) => {
    const tr = document.createElement('tr'); tr.innerHTML = `<td>#${i+1}</td><td>${l.email}</td><td style="color:var(--mut)">${l.phone}</td><td style="color:var(--red);font-family:'Bebas Neue';font-size:17px;letter-spacing:2px">${l.code}</td><td style="color:var(--mut)">${l.date}</td><td><span class="sb ${l.used ? 'sb-comp' : 'sb-pend'}">${l.used ? 'Used' : 'Unused'}</span></td>`;
    tb.appendChild(tr);
  });
}
function setSt(id, s) { const b = bookings.find(b => b.id === id); if (b) { b.status = s; persist(); renderAdmin(); } }
function loadSettingsUI() {
  document.getElementById('s-name').value = settings.name || 'DetailedByAustin';
  document.getElementById('s-phone').value = settings.phone || '(XXX) XXX-XXXX';
  document.getElementById('s-email').value = settings.email || 'hello@detailedbyaustin.com';
  document.getElementById('s-loc').value = settings.loc || 'Your City';
  document.getElementById('s-code').value = settings.code || 'FIRST10';
  document.getElementById('s-disc').value = settings.disc || 10;
  document.getElementById('s-delay').value = settings.delay || 4;
  document.getElementById('s-popup').value = settings.popup !== false ? '1' : '0';
  const days = settings.days || { mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:false };
  Object.entries(days).forEach(([k, v]) => { const el = document.getElementById(`day-${k}`); if (el) el.checked = v; });
  document.getElementById('s-open').value = settings.openTime || '8:00 AM';
  document.getElementById('s-close').value = settings.closeTime || '6:00 PM';
  const soc = settings.social || {};
  ['ig','tk','fb','yt','tw'].forEach(k => { const el = document.getElementById(`soc-${k}-url`); if (el) el.value = soc[k] || ''; });
  const st = settings.stripe || {};
  const onEl = document.getElementById('s-stripe-on'); if (onEl) onEl.value = st.enabled ? '1' : '0';
  const pkEl = document.getElementById('s-stripe-pk'); if (pkEl) pkEl.value = st.publishableKey || '';
  const lnEl = document.getElementById('s-stripe-link'); if (lnEl) lnEl.value = st.paymentLink || '';
}
function saveSettings() {
  settings.name = document.getElementById('s-name').value.trim();
  settings.phone = document.getElementById('s-phone').value.trim();
  settings.email = document.getElementById('s-email').value.trim();
  settings.loc = document.getElementById('s-loc').value.trim();
  settings.code = document.getElementById('s-code').value.trim() || 'FIRST10';
  settings.disc = parseInt(document.getElementById('s-disc').value) || 10;
  settings.delay = parseInt(document.getElementById('s-delay').value) || 4;
  settings.popup = document.getElementById('s-popup').value === '1';
  settings.openTime = document.getElementById('s-open').value;
  settings.closeTime = document.getElementById('s-close').value;
  settings.days = {};
  ['mon','tue','wed','thu','fri','sat','sun'].forEach(k => { settings.days[k] = document.getElementById(`day-${k}`)?.checked ?? false; });
  settings.social = { ig: document.getElementById('soc-ig-url').value.trim(), tk: document.getElementById('soc-tk-url').value.trim(), fb: document.getElementById('soc-fb-url').value.trim(), yt: document.getElementById('soc-yt-url').value.trim(), tw: document.getElementById('soc-tw-url').value.trim() };
  const onEl = document.getElementById('s-stripe-on');
  if (onEl) {
    settings.stripe = {
      enabled: onEl.value === '1',
      publishableKey: (document.getElementById('s-stripe-pk')?.value || '').trim(),
      paymentLink: (document.getElementById('s-stripe-link')?.value || '').trim()
    };
  }
  persist(); applySettings();
  const btn = event.target; btn.textContent = '✓ Saved!'; btn.style.background = '#22C55E'; setTimeout(() => { btn.textContent = 'Save Changes'; btn.style.background = ''; }, 2000);
}
function changePw() {
  const old = document.getElementById('s-old').value, np = document.getElementById('s-new').value, cp = document.getElementById('s-conf').value;
  const msg = document.getElementById('pw-msg'); msg.style.display = 'block';
  if (old !== (settings.pass || 'admin123')) { msg.style.color = 'var(--red)'; msg.textContent = 'Current password incorrect.'; return; }
  if (np.length < 6) { msg.style.color = 'var(--red)'; msg.textContent = 'Password must be at least 6 characters.'; return; }
  if (np !== cp) { msg.style.color = 'var(--red)'; msg.textContent = "Passwords don't match."; return; }
  settings.pass = np; persist(); msg.style.color = '#22C55E'; msg.textContent = 'Password updated successfully.';
  ['s-old','s-new','s-conf'].forEach(id => document.getElementById(id).value = '');
}
function exportCSV() {
  if (!bookings.length) { alert('No bookings to export.'); return; }
  const h = ['ID','Name','Email','Phone','Vehicle','Service','Date','Time','Price','Promo','Status'];
  const rows = bookings.map(b => [b.id, b.name, b.email, b.phone, `${b.year} ${b.make} ${b.model}`, b.svc, b.date, b.time, `$${b.price}`, b.promo || '', b.status]);
  const csv = [h, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'bookings.csv'; a.click();
}
function exportLeads() {
  if (!leads.length) { alert('No leads to export.'); return; }
  const h = ['Email','Phone','Code','Date','Used'];
  const rows = leads.map(l => [l.email, l.phone, l.code, l.date, l.used ? 'Yes' : 'No']);
  const csv = [h, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'promo-leads.csv'; a.click();
}
function getOrCreateApiKey() {
  if (!settings.apiKey) {
    settings.apiKey = 'dba_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2,'0')).join('');
    persist();
  }
  return settings.apiKey;
}
function regenerateApiKey() {
  if (!confirm('Regenerate API key? Any existing integrations using the old key will break.')) return;
  settings.apiKey = 'dba_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2,'0')).join('');
  persist();
  renderApiPanel();
  const el = document.getElementById('api-key-display');
  el.style.color = '#22C55E';
  setTimeout(() => el.style.color = 'var(--red)', 1200);
}
function copyApiKey() {
  const key = getOrCreateApiKey();
  navigator.clipboard.writeText(key).then(() => {
    const btn = event.target; btn.textContent = 'Copied!'; btn.style.color = '#22C55E';
    setTimeout(() => { btn.textContent = 'Copy Key'; btn.style.color = ''; }, 1800);
  });
}
function copyApiResponse(id) {
  const el = document.getElementById(id);
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = event.target; btn.textContent = 'Copied!'; btn.style.color = '#22C55E';
    setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 1800);
  });
}
function renderApiPanel() {
  const key = getOrCreateApiKey();
  document.getElementById('api-key-display').textContent = key;
  const bkResp = { success: true, count: bookings.length, data: bookings };
  document.getElementById('api-bookings-preview').textContent = JSON.stringify(bkResp, null, 2);
  const ldResp = { success: true, count: leads.length, data: leads };
  document.getElementById('api-leads-preview').textContent = JSON.stringify(ldResp, null, 2);
}
updateSteps();
