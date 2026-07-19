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

// ---- Nav switching ----
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

function statusClass(status) {
  if (status === 'active') return 'active';
  if (status === 'in_review') return 'pending';
  if (status === 'rejected') return 'rejected';
  return 'paused';
}
function statusLabel(status) {
  const map = { active: 'Active', in_review: 'In review', rejected: 'Rejected', paused: 'Paused', completed: 'Completed' };
  return map[status] || status;
}

// ---- Auth ----
const token = localStorage.getItem('eliteadx_token');
const storedUser = JSON.parse(localStorage.getItem('eliteadx_user') || 'null');

if (!token) window.location.href = '/login';

if (storedUser) {
  const initials = storedUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarEl = document.querySelector('.avatar');
  if (avatarEl) avatarEl.textContent = initials;
  if (storedUser.role !== 'advertiser') {
    const redirects = { admin: '/dashboard/admin', publisher: '/dashboard/publisher' };
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

    setKPI('kpi-active-campaigns', data.activeCampaigns, v => v.toLocaleString());
    setKPI('kpi-total-spend', data.totalSpend, fmtNaira);
    setKPI('kpi-total-impressions', data.totalImpressions, fmtCompact);
    setKPI('kpi-total-clicks', data.totalClicks, v => v.toLocaleString());
    setKPI('kpi-average-ctr', data.averageCTR, v => v + '%');
    setKPI('kpi-avg-cpc', data.averageCPC, fmtNaira);

    renderOrEmptyChart('chartSpend', data.charts?.spend, (canvas, series) => {
      new Chart(canvas, { type:'line', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Spend (₦)', data: series.map(p=>p.value), borderColor:'#C9A24A', backgroundColor:'rgba(201,162,74,0.12)', fill:true, tension:0.35, pointRadius:0, borderWidth:2 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartClicks', data.charts?.clicks, (canvas, series) => {
      new Chart(canvas, { type:'bar', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Clicks', data: series.map(p=>p.value), backgroundColor:'#2DD4BF', borderRadius:4, maxBarThickness:16 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartImpressions', data.charts?.impressions, (canvas, series) => {
      new Chart(canvas, { type:'line', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Impressions', data: series.map(p=>p.value), borderColor:'#C9A24A', backgroundColor:'transparent', tension:0.35, pointRadius:0, borderWidth:2 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartCTR', data.charts?.ctr, (canvas, series) => {
      new Chart(canvas, { type:'line', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'CTR %', data: series.map(p=>p.value), borderColor:'#2DD4BF', backgroundColor:'rgba(45,212,191,0.12)', fill:true, tension:0.35, pointRadius:0, borderWidth:2 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });

    renderRows('act-campaigns-body', data.campaigns?.slice(0, 10), 4, c =>
      `<tr><td class="cell-name">${c.title}</td><td>${c.vertical || '—'}</td><td class="mono">${fmtNaira(c.budget)}</td><td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td></tr>`);
    renderRows('act-approvals-body', data.recentApprovals, 4, a =>
      `<tr><td class="cell-name">${a.title}</td><td class="cell-sub">${a.reason || '—'}</td><td class="mono">${fmtDate(a.decidedAt)}</td><td><span class="status-pill rejected">Rejected</span></td></tr>`);

    renderRows('my-campaigns-body', data.campaigns, 6, c =>
      `<tr><td class="cell-name">${c.title}</td><td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td><td class="mono">${fmtNaira(c.budget)}</td><td class="mono">${fmtNaira(c.spent)}</td><td class="mono">${(c.clicks||0).toLocaleString()}</td><td class="mono">${c.ctr}%</td></tr>`);
    renderRows('campaigns-view-body', data.campaigns, 7, c =>
      `<tr><td class="cell-name">${c.title}</td><td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td><td class="mono">${fmtNaira(c.budget)}</td><td class="mono">${fmtNaira(c.spent)}</td><td class="mono">${(c.clicks||0).toLocaleString()}</td><td class="mono">${(c.impressions||0).toLocaleString()}</td><td class="mono">${c.ctr}%</td></tr>`);

    renderRanks('top-campaigns', data.topCampaigns, (c, i) =>
      `<div class="rank-row"><div class="rank-num">${String(i).padStart(2,'0')}</div><div class="rank-info"><div class="rank-name">${c.title}</div><div class="rank-sub">${c.vertical} · ${c.ctr}% CTR</div></div><div class="rank-value">${fmtNaira(c.spent)}</div></div>`);

    const wallet = data.wallet;
    setKPI('w-balance', wallet?.walletBalance, fmtNaira);
    setKPI('w-spent', wallet?.totalSpent, fmtNaira);
    setKPI('w-pending', wallet?.pendingCharges, fmtNaira);
    setKPI('w-month', wallet?.monthSpend, fmtNaira);
    setKPI('w-autoreload', wallet ? (wallet.autoReload ? 'On' : 'Off') : null, v => v);

  } catch (err) {
    console.warn('Could not load overview data.', err);
  }
}

// ---- Quick action buttons ----
function goToView(viewName) {
  document.querySelector(`.nav-item[data-view="${viewName}"]`)?.click();
}

document.getElementById('qaDuplicateCampaign')?.addEventListener('click', () => goToView('campaigns'));
document.getElementById('qaViewReports')?.addEventListener('click', () => goToView('reports'));

// ---- Add Funds modal ----
const depositModalOverlay = document.getElementById('depositModalOverlay');
const depositForm = document.getElementById('depositForm');
const depositFormError = document.getElementById('depositFormError');

function openDepositModal() {
  depositFormError.style.display = 'none';
  depositForm.reset();
  depositModalOverlay.style.display = 'flex';
}
function closeDepositModal() {
  depositModalOverlay.style.display = 'none';
}

document.getElementById('qaAddFunds')?.addEventListener('click', openDepositModal);
document.getElementById('walletAddFundsBtn')?.addEventListener('click', openDepositModal);
document.getElementById('depositModalClose')?.addEventListener('click', closeDepositModal);
depositModalOverlay?.addEventListener('click', (e) => {
  if (e.target === depositModalOverlay) closeDepositModal();
});

depositForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  depositFormError.style.display = 'none';

  const amount = Number(document.getElementById('df-amount').value);
  const submitBtn = depositForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Redirecting…';

  try {
    const res = await fetch('/api/payments/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ amount }),
    });

    if (res.status === 401) { logout(); return; }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not start deposit');

    // Send the browser to Flutterwave's hosted payment page
    window.location.href = data.paymentLink;
  } catch (err) {
    depositFormError.textContent = err.message;
    depositFormError.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Continue to Payment';
  }
});

// ---- Create Campaign modal ----
const campaignModalOverlay = document.getElementById('campaignModalOverlay');
const campaignForm = document.getElementById('campaignForm');
const campaignFormError = document.getElementById('campaignFormError');

function openCampaignModal() {
  campaignFormError.style.display = 'none';
  campaignForm.reset();
  campaignModalOverlay.style.display = 'flex';
}
function closeCampaignModal() {
  campaignModalOverlay.style.display = 'none';
}

document.getElementById('qaCreateCampaign')?.addEventListener('click', openCampaignModal);
document.getElementById('createCampaignBtn')?.addEventListener('click', openCampaignModal);
document.getElementById('campaignModalClose')?.addEventListener('click', closeCampaignModal);
campaignModalOverlay?.addEventListener('click', (e) => {
  if (e.target === campaignModalOverlay) closeCampaignModal();
});

campaignForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  campaignFormError.style.display = 'none';

  const body = {
    title: document.getElementById('cf-title').value.trim(),
    vertical: document.getElementById('cf-vertical').value.trim(),
    budget: Number(document.getElementById('cf-budget').value),
    startDate: document.getElementById('cf-start').value,
    endDate: document.getElementById('cf-end').value,
  };

  const submitBtn = campaignForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) { logout(); return; }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Could not create campaign');
    }

    closeCampaignModal();
    await loadOverview(); // refresh tables/KPIs so the new campaign shows up
  } catch (err) {
    campaignFormError.textContent = err.message;
    campaignFormError.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit for Review';
  }
});

loadOverview();

// ---- Handle redirect back from Flutterwave after a deposit ----
(async function verifyDepositOnReturn() {
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get('transaction_id');
  if (!transactionId) return;

  try {
    const res = await fetch(`/api/payments/verify?transaction_id=${encodeURIComponent(transactionId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (res.ok) {
      alert('Deposit confirmed — your wallet has been credited.');
      await loadOverview();
    } else {
      alert(data.message || 'We could not confirm this deposit. Contact support if you were charged.');
    }
  } catch (err) {
    console.warn('Deposit verification failed', err);
  } finally {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();