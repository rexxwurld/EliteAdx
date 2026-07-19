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

    if (item.dataset.view === 'moderation') loadModeration();
    if (item.dataset.view === 'payments') loadPayments();
  });
});

// ---- Activity tab switching ----
function switchActivity(btn, id){
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.activity-table').forEach(t=>t.style.display='none');
  document.getElementById(id).style.display='block';
}

// ---- Chart defaults ----
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

// ---- Table / list rendering helpers ----
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

function setModCount(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value === null || value === undefined) {
    el.textContent = '—';
    el.classList.add('empty');
  } else {
    el.textContent = value;
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
function calcCTR(clicks, impressions) {
  if (!impressions) return '0.0';
  return ((clicks / impressions) * 100).toFixed(1);
}

// ---- Auth ----
const token = localStorage.getItem('eliteadx_token');
const storedUser = JSON.parse(localStorage.getItem('eliteadx_user') || 'null');

if (!token) window.location.href = '/login';

if (storedUser) {
  const initials = storedUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarEl = document.querySelector('.avatar');
  if (avatarEl) avatarEl.textContent = initials;
  if (storedUser.role !== 'admin') {
    const redirects = { advertiser: '/dashboard/advertiser', publisher: '/dashboard/publisher' };
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

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- Load overview from the API ----
async function loadOverview() {
  try {
    const res = await fetch('/api/analytics/overview', { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error('Failed to load overview');
    const data = await res.json();

    setKPI('kpi-total-users', data.totalUsers, v => v.toLocaleString());
    setKPI('kpi-active-campaigns', data.activeCampaigns, v => v.toLocaleString());
    setKPI('kpi-total-revenue', data.totalRevenue, fmtNaira);
    setKPI('kpi-total-impressions', data.totalImpressions, fmtCompact);
    setKPI('kpi-total-clicks', data.totalClicks, fmtCompact);
    setKPI('kpi-average-ctr', data.averageCTR, v => v + '%');

    renderOrEmptyChart('chartRevenue', data.charts?.revenue, (canvas, series) => {
      new Chart(canvas, { type:'line', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Revenue (₦)', data: series.map(p=>p.value), borderColor:'#C9A24A', backgroundColor:'rgba(201,162,74,0.12)', fill:true, tension:0.35, pointRadius:0, borderWidth:2 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartUsers', data.charts?.newUsers, (canvas, series) => {
      new Chart(canvas, { type:'bar', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'New Users', data: series.map(p=>p.value), backgroundColor:'#2DD4BF', borderRadius:4, maxBarThickness:16 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartImpressions', data.charts?.impressions, (canvas, series) => {
      new Chart(canvas, { type:'line', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Impressions', data: series.map(p=>p.value), borderColor:'#C9A24A', backgroundColor:'transparent', tension:0.35, pointRadius:0, borderWidth:2 }]}, options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });
    renderOrEmptyChart('chartClicks', data.charts?.clicks, (canvas, series) => {
      new Chart(canvas, { type:'bar', data:{ labels: series.map(p=>fmtDate(p.date)), datasets:[{ label:'Clicks', data: series.map(p=>p.value), backgroundColor:'#2DD4BF', borderRadius:4, maxBarThickness:14 }]}, options:{ plugins:{legend:{display:true, labels:{boxWidth:8, boxHeight:8}}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } } });
    });

    renderRows('act-users-body', data.recentUsers, 5, u =>
      `<tr><td class="cell-name">${u.name}</td><td class="cell-sub">${u.email}</td><td>${u.role}</td><td class="mono">${fmtDate(u.createdAt)}</td><td><span class="status-pill ${u.status === 'suspended' ? 'rejected' : 'active'}">${u.status === 'suspended' ? 'Suspended' : 'Active'}</span></td></tr>`);

    renderRows('act-campaigns-body', data.recentCampaigns, 5, c =>
      `<tr><td class="cell-name">${c.title}</td><td class="cell-sub">${c.advertiser?.name || '—'}</td><td>${c.vertical}</td><td class="mono">${fmtDate(c.createdAt)}</td><td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td></tr>`);

    renderRows('campaign-overview-body', data.recentCampaigns, 6, c =>
      `<tr><td class="cell-name">${c.title}</td><td class="cell-sub">${c.advertiser?.name || '—'}</td><td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td><td class="mono">${fmtNaira(c.budget)}</td><td class="mono">${(c.clicks||0).toLocaleString()}</td><td class="mono">${calcCTR(c.clicks, c.impressions)}%</td></tr>`);
    renderRows('campaigns-view-body', data.recentCampaigns, 7, c =>
      `<tr><td class="cell-name">${c.title}</td><td class="cell-sub">${c.advertiser?.name || '—'}</td><td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td><td class="mono">${fmtNaira(c.budget)}</td><td class="mono">${(c.clicks||0).toLocaleString()}</td><td class="mono">${(c.impressions||0).toLocaleString()}</td><td class="mono">${calcCTR(c.clicks, c.impressions)}%</td><td>—</td></tr>`);

    renderRanks('top-advertisers', data.topAdvertisers, (a, i) =>
      `<div class="rank-row"><div class="rank-num">${String(i).padStart(2,'0')}</div><div class="rank-info"><div class="rank-name">${a.name}</div><div class="rank-sub">${a.campaigns} campaigns</div></div><div class="rank-value">${fmtNaira(a.spend)}</div></div>`);
    renderRanks('top-publishers', data.topPublishers, (p, i) =>
      `<div class="rank-row"><div class="rank-num">${String(i).padStart(2,'0')}</div><div class="rank-info"><div class="rank-name">${p.siteName}</div><div class="rank-sub">${p.category} · ${fmtCompact(p.totalImpressions)} impressions</div></div><div class="rank-value">${fmtNaira(p.totalEarnings)}</div></div>`);

    const fin = data.financial;
    setKPI('fin-deposits', fin?.totalDeposits, fmtNaira);
    setKPI('fin-withdrawals', fin?.totalWithdrawals, fmtNaira);
    setKPI('fin-pending', fin?.pendingWithdrawals, fmtNaira);
    setKPI('fin-profit', fin?.platformProfit, fmtNaira);
    setKPI('fin-monthly', fin?.monthlyEarnings, fmtNaira);

    const mod = data.moderation || {};
    setModCount('mod-pending', mod.pendingApprovals);
    setModCount('mod-flagged', mod.flaggedAds);
    setModCount('mod-suspended', mod.suspendedUsers);
    setModCount('mod-tickets', mod.supportTickets);

  } catch (err) {
    console.warn('Could not load overview data.', err);
  }
}

// ---- Moderation view: pending campaigns / flagged ads / suspended users ----
let moderationLoaded = false;

async function loadModeration() {
  if (moderationLoaded) return; // fetch once per page load; re-fetch happens after approve/reject
  moderationLoaded = true;
  await refreshModeration();
}

async function refreshModeration() {
  try {
    const [pendingRes, flaggedRes, suspendedRes] = await Promise.all([
      fetch('/api/moderation/campaigns/pending', { headers: authHeaders() }),
      fetch('/api/moderation/ads/flagged', { headers: authHeaders() }),
      fetch('/api/moderation/users/suspended', { headers: authHeaders() }),
    ]);

    if ([pendingRes, flaggedRes, suspendedRes].some(r => r.status === 401)) { logout(); return; }

    const pending = pendingRes.ok ? await pendingRes.json() : [];
    const flagged = flaggedRes.ok ? await flaggedRes.json() : [];
    const suspended = suspendedRes.ok ? await suspendedRes.json() : [];

    renderRows('mod-pending-campaigns-body', pending, 4, c => `
      <tr>
        <td class="cell-name">${c.title}</td>
        <td class="cell-sub">${c.advertiser?.name || '—'}</td>
        <td class="mono">${fmtDate(c.createdAt)}</td>
        <td>
          <button class="tab-btn" style="color:#2DD4BF;" data-action="approve" data-id="${c._id}">Approve</button>
          <button class="tab-btn" style="color:#e5484d;" data-action="reject" data-id="${c._id}">Reject</button>
        </td>
      </tr>`);

    renderRows('mod-flagged-ads-body', flagged, 4, a => `
      <tr>
        <td class="cell-name">${a.headline || 'Untitled ad'}</td>
        <td class="cell-sub">${a.campaign?.title || '—'}</td>
        <td class="cell-sub">${a.publisher?.name || '—'}</td>
        <td>${a.flagReason || '—'}</td>
      </tr>`);

    renderRows('mod-suspended-users-body', suspended, 3, u => `
      <tr>
        <td class="cell-name">${u.name}</td>
        <td class="cell-sub">${u.email}</td>
        <td>${u.role}</td>
      </tr>`);

  } catch (err) {
    console.warn('Could not load moderation queue.', err);
  }
}

// Event delegation for approve/reject buttons (rows are re-rendered, so bind once on the container)
document.getElementById('mod-pending-campaigns-body')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  btn.disabled = true;

  try {
    if (action === 'approve') {
      const res = await fetch(`/api/moderation/campaigns/${id}/approve`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Approve failed');
    } else if (action === 'reject') {
      const reason = window.prompt('Reason for rejecting this campaign:');
      if (reason === null) { btn.disabled = false; return; } // cancelled
      const res = await fetch(`/api/moderation/campaigns/${id}/reject`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Reject failed');
    }
    await refreshModeration();
    await loadOverview(); // pending count on Overview should update too
  } catch (err) {
    console.warn(err);
    btn.disabled = false;
    alert('Something went wrong. Please try again.');
  }
});

loadOverview();

// ---- Payments view: real list + approve action for pending withdrawals ----
let paymentsLoaded = false;

async function loadPayments() {
  if (paymentsLoaded) return;
  paymentsLoaded = true;
  await refreshPayments();
}

async function refreshPayments() {
  try {
    const res = await fetch('/api/payments', { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error('Failed to load payments');
    const payments = await res.json();

    renderRows('payments-view-body', payments, 6, p => `
      <tr>
        <td class="cell-name">${p.user?.name || '—'}</td>
        <td>${p.type}</td>
        <td class="mono">${fmtNaira(p.amount)}</td>
        <td><span class="status-pill ${p.status === 'confirmed' ? 'active' : p.status === 'pending' ? 'pending' : 'rejected'}">${p.status}</span></td>
        <td class="mono">${fmtDate(p.createdAt)}</td>
        <td>${p.type === 'withdrawal' && p.status === 'pending'
              ? `<button class="tab-btn" style="color:#2DD4BF;" data-approve-id="${p._id}">Approve</button>`
              : '—'}</td>
      </tr>`);
  } catch (err) {
    console.warn('Could not load payments.', err);
  }
}

document.getElementById('payments-view-body')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-approve-id]');
  if (!btn) return;
  const id = btn.dataset.approveId;

  if (!confirm('Approve this withdrawal and initiate the payout?')) return;

  btn.disabled = true;
  btn.textContent = 'Approving…';

  try {
    const res = await fetch(`/api/payments/${id}/approve`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Approval failed');

    await refreshPayments();
    await loadOverview();
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = 'Approve';
  }
});

document.getElementById('qaApproveWithdrawal')?.addEventListener('click', () => {
  document.querySelector('.nav-item[data-view="payments"]')?.click();
});