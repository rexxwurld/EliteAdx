// ---- Mobile drawer ----
const sidebarEl = document.querySelector('.sidebar');
const overlayEl = document.querySelector('.sidebar-overlay');
document.querySelector('.hamburger')?.addEventListener('click', () => {
  sidebarEl.classList.add('open');
  overlayEl.classList.add('open');
});
overlayEl?.addEventListener('click', () => {
  sidebarEl.classList.remove('open');
  overlayEl.classList.remove('open');
});

document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+item.dataset.view).classList.add('active');
    sidebarEl.classList.remove('open');
    overlayEl.classList.remove('open');
  });
});

function switchActivity(btn, id){
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.activity-table').forEach(t=>t.style.display='none');
  document.getElementById(id).style.display='block';
}

Chart.defaults.color = '#8B95A1';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
const gridColor = '#1A212B';

function renderOrEmptyChart(canvasId, series, chartConfigFn) {
  const canvas = document.getElementById(canvasId);
  const wrap = canvas.closest('.chart-wrap') || canvas.parentElement;
  if (!series || series.length === 0) {
    canvas.style.display = 'none';
    let note = wrap.querySelector('.empty-note');
    if (!note) {
      note = document.createElement('div');
      note.className = 'empty-note';
      note.innerHTML = '<span class="empty-icon">▲</span><span>No data yet</span>';
      wrap.appendChild(note);
    }
    return;
  }
  canvas.style.display = 'block';
  chartConfigFn(canvas, series);
}

function fmtNaira(n) { return '₦' + Number(n || 0).toLocaleString('en-NG'); }
function fmtCompact(n) { return Intl.NumberFormat('en', { notation: 'compact' }).format(Number(n || 0)); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'; }

function renderRows(tbodyId, items, colSpan, rowFn) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${colSpan}">No data yet</td></tr>`;
    return;
  }
  items.forEach(item => { tbody.insertAdjacentHTML('beforeend', rowFn(item)); });
}

function renderRanks(containerId, items, rowFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  if (!items || items.length === 0) {
    el.innerHTML = '<div class="empty-note"><span class="empty-icon">◆</span><span>No data yet</span></div>';
    return;
  }
  items.forEach((item, i) => { el.insertAdjacentHTML('beforeend', rowFn(item, i + 1)); });
}

function setKPI(id, value, formatter) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value === null || value === undefined) {
    el.textContent = '—';
    el.classList.add('empty');
  } else {
    el.textContent = formatter ? formatter(value) : value;
    el.classList.remove('empty');
  }
}

// ---- Auth ----
const token = localStorage.getItem('eliteadx_token');
const storedUser = JSON.parse(localStorage.getItem('eliteadx_user') || 'null');

if (!token) window.location.href = '/login.html';

if (storedUser) {
  const initials = storedUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarEl = document.querySelector('.avatar');
  if (avatarEl) avatarEl.textContent = initials;
  if (storedUser.role !== 'publisher') {
    const redirects = { admin: '/dashboard/admin', advertiser: '/dashboard/advertiser' };
    window.location.href = redirects[storedUser.role] || '/login';
  }
}

function logout() {
  localStorage.removeItem('eliteadx_token');
  localStorage.removeItem('eliteadx_user');
  window.location.href = '/login.html';
}
document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('logoutRow')?.addEventListener('click', logout);

async function loadOverview() {
  try {
    const res = await fetch('/api/analytics/overview', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error('Failed to load overview');
    const data = await res.json();

    setKPI('kpi-active-units', data.activeAdUnits, v => v.toLocaleString());
    setKPI('kpi-total-earnings', data.totalEarnings, fmtNaira);
    setKPI('kpi-impressions-served', data.impressionsServed, fmtCompact);
    setKPI('kpi-total-clicks', data.totalClicks, v => v.toLocaleString());
    setKPI('kpi-average-ctr', data.averageCTR, v => v + '%');
    setKPI('kpi-ecpm', data.averageECPM, fmtNaira);

    renderOrEmptyChart('chartEarnings', data.charts?.earnings, (canvas, series) => {
      new Chart(canvas, { type:'line', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Earnings (₦)', data: series.map(p=>p.value), borderColor:'#C9A24A', backgroundColor:'rgba(201,162,74,0.12)', fill:true, tension:0.35, pointRadius:0, borderWidth:2 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartFillRate', data.charts?.fillRate, (canvas, series) => {
      new Chart(canvas, { type:'bar', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Fill Rate %', data: series.map(p=>p.value), backgroundColor:'#2DD4BF', borderRadius:4, maxBarThickness:16 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartImpressions', data.charts?.impressions, (canvas, series) => {
      new Chart(canvas, { type:'line', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Impressions', data: series.map(p=>p.value), borderColor:'#C9A24A', backgroundColor:'transparent', tension:0.35, pointRadius:0, borderWidth:2 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartClicks', data.charts?.clicks, (canvas, series) => {
      new Chart(canvas, { type:'bar', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Clicks', data: series.map(p=>p.value), backgroundColor:'#2DD4BF', borderRadius:4, maxBarThickness:14 }]}, options:{ plugins:{legend:{display:true, labels:{boxWidth:8, boxHeight:8}}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });

    renderRows('act-units-body', data.adUnits?.slice(0, 10), 4, a =>
      `<tr><td class="cell-name">${a.headline || 'Untitled'}</td><td class="cell-sub">${a.campaignTitle || '—'}</td><td class="mono">—</td><td><span class="status-pill ${a.flagged ? 'rejected' : 'active'}">${a.flagged ? 'Flagged' : 'Serving'}</span></td></tr>`);

    renderRows('my-ad-units-body', data.adUnits, 6, a =>
      `<tr><td class="cell-name">${a.headline || 'Untitled'}</td><td class="cell-sub">${a.campaignTitle || '—'}</td><td><span class="status-pill ${a.flagged ? 'rejected' : 'active'}">${a.flagged ? 'Flagged' : 'Serving'}</span></td><td class="mono">${(a.impressions||0).toLocaleString()}</td><td class="mono">${(a.clicks||0).toLocaleString()}</td><td class="mono">—</td></tr>`);
    renderRows('sites-view-body', data.adUnits, 7, a =>
      `<tr><td class="cell-name">${a.headline || 'Untitled'}</td><td class="cell-sub">${a.campaignTitle || '—'}</td><td><span class="status-pill ${a.flagged ? 'rejected' : 'active'}">${a.flagged ? 'Flagged' : 'Serving'}</span></td><td class="mono">${(a.impressions||0).toLocaleString()}</td><td class="mono">${(a.clicks||0).toLocaleString()}</td><td class="mono">—</td><td class="mono">—</td></tr>`);

    renderRanks('top-sites', data.sites, (s, i) =>
      `<div class="rank-row"><div class="rank-num">${String(i).padStart(2,'0')}</div><div class="rank-info"><div class="rank-name">${s.siteName}</div><div class="rank-sub">${s.category} · ${fmtCompact(s.totalImpressions)} impressions</div></div><div class="rank-value">${fmtNaira(s.totalEarnings)}</div></div>`);
    renderRanks('top-ad-units', data.adUnits?.slice(0, 5), (a, i) =>
      `<div class="rank-row"><div class="rank-num">${String(i).padStart(2,'0')}</div><div class="rank-info"><div class="rank-name">${a.headline || 'Untitled'}</div><div class="rank-sub">${(a.impressions||0).toLocaleString()} impressions</div></div><div class="rank-value">${(a.clicks||0).toLocaleString()} clicks</div></div>`);

    const earn = data.earningsSummary;
    setKPI('e-total', earn?.totalEarned, fmtNaira);
    setKPI('e-available', earn?.availableBalance, fmtNaira);
    setKPI('e-pending', earn?.pendingEarnings, fmtNaira);
    setKPI('e-month', earn?.monthEarnings, fmtNaira);
    setKPI('e-next-payout', earn?.nextPayoutDate, v => new Date(v).toLocaleDateString('en-US', { month:'short', day:'numeric' }));

  } catch (err) {
    console.warn('Could not load overview data.', err);
  }
}

// ---- Request Payout modal ----
const payoutModalOverlay = document.getElementById('payoutModalOverlay');
const payoutForm = document.getElementById('payoutForm');
const payoutFormError = document.getElementById('payoutFormError');

function openPayoutModal() {
  payoutFormError.style.display = 'none';
  payoutForm.reset();
  payoutModalOverlay.style.display = 'flex';
}
function closePayoutModal() {
  payoutModalOverlay.style.display = 'none';
}

document.getElementById('qaRequestPayout')?.addEventListener('click', openPayoutModal);
document.getElementById('payoutsViewRequestBtn')?.addEventListener('click', openPayoutModal);
document.getElementById('payoutModalClose')?.addEventListener('click', closePayoutModal);
payoutModalOverlay?.addEventListener('click', (e) => {
  if (e.target === payoutModalOverlay) closePayoutModal();
});

payoutForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  payoutFormError.style.display = 'none';

  const body = {
    amount: Number(document.getElementById('pf-amount').value),
    accountBank: document.getElementById('pf-bank').value.trim(),
    accountNumber: document.getElementById('pf-account').value.trim(),
  };

  const submitBtn = payoutForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    const res = await fetch('/api/payments/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });

    if (res.status === 401) { logout(); return; }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not request payout');

    closePayoutModal();
    alert('Payout requested — pending admin approval.');
    await loadOverview();
  } catch (err) {
    payoutFormError.textContent = err.message;
    payoutFormError.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Request Payout';
  }
});

loadOverview();