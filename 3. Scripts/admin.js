// admin.js — Admin dashboard logic

const ADMIN_PASSWORD = 'fab-admin-2026';

const stepLabels = {
  1: 'Step 1 — Name',
  2: 'Step 2 — Email',
  3: 'Step 3 — Business type',
  4: 'Step 4 — Time drain',
  5: 'Step 5 — Revenue',
  6: 'Step 6 — Phone',
  8: 'Step 8 — Book call'
};

const revenueLabels = {
  'no-revenue': 'No revenue yet',
  'under-10k':  'Under £10k',
  '10k-50k':    '£10k – £50k',
  '50k-200k':   '£50k – £200k',
  '200k-plus':  '£200k+'
};

const crmStatusLabels = {
  'to-contact':  'To contact',
  'contacted':   'Contacted',
  'in-progress': 'In progress'
};

let newLeads        = [];
let qualifiedLeads  = [];
let archivedLeads   = [];
let partialLeads    = [];
let adEntries       = [];
let isDemo          = false;

// ─── Login ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('passwordInput');
  const btn   = document.getElementById('loginBtn');
  const error = document.getElementById('loginError');

  btn.addEventListener('click', tryLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

  function tryLogin() {
    if (input.value === ADMIN_PASSWORD) {
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('adminPanel').classList.add('visible');
      loadDashboard();
    } else {
      error.style.display = 'block';
      input.value = '';
      input.focus();
    }
  }

  document.getElementById('refreshBtn').addEventListener('click', () => {
    isDemo = false;
    loadDashboard();
  });
  document.getElementById('demoBtn').addEventListener('click', () => {
    isDemo = true;
    loadDemoData();
  });
  document.getElementById('clearBtn').addEventListener('click', clearAllData);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Filters — new leads
  document.getElementById('filterSearch').addEventListener('input', applyFiltersNew);
  document.getElementById('filterRevenue').addEventListener('change', applyFiltersNew);

  // Filters — qualified
  document.getElementById('filterSearchQ').addEventListener('input', applyFiltersQualified);

  // Filters — archived
  document.getElementById('filterSearchA').addEventListener('input', applyFiltersArchived);

  // Filters — partial
  document.getElementById('filterSearchP').addEventListener('input', applyFiltersPartial);

  // Ads entry
  document.getElementById('adsSaveBtn').addEventListener('click', handleAdsSave);
});

// ─── Load all data ─────────────────────────────────────────────────
async function loadDashboard() {
  if (isDemo) return;
  document.getElementById('lastUpdated').textContent = 'Loading...';

  const [sessions, leads, ads] = await Promise.all([
    db.collection('ai-business-sessions').get(),
    db.collection('ai-business-leads').get(),
    db.collection('ai-business-ads').get()
  ]);

  const sessionDocs = sessions.docs.map(d => ({ id: d.id, ...d.data() }));
  const leadDocs    = leads.docs.map(d => ({ id: d.id, ...d.data() }));

  newLeads       = leadDocs.filter(l => !l.status || l.status === 'new');
  qualifiedLeads = leadDocs.filter(l => l.status === 'qualified');
  archivedLeads  = leadDocs.filter(l => l.status === 'archived');
  partialLeads   = sessionDocs
    .filter(s => !s.completed && s.contactEmail)
    .sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  adEntries      = ads.docs.map(d => ({ id: d.id, ...d.data() }));

  updateBadges();
  renderStats(sessionDocs.map(d => d), leadDocs);
  renderFunnel(sessionDocs.map(d => d));
  renderRevenueBreakdown(leadDocs);
  renderAdsTab();
  applyFiltersNew();
  applyFiltersQualified();
  applyFiltersArchived();
  applyFiltersPartial();

  document.getElementById('lastUpdated').textContent =
    'Last updated: ' + new Date().toLocaleTimeString();
}

function updateBadges() {
  document.getElementById('badge-leads').textContent     = newLeads.length;
  document.getElementById('badge-qualified').textContent = qualifiedLeads.length;
  document.getElementById('badge-archived').textContent  = archivedLeads.length;
  document.getElementById('badge-partial').textContent   = partialLeads.filter(s => !s.followedUp).length;
}

// ─── Stats cards ──────────────────────────────────────────────────
function renderStats(sessions, leads) {
  const total     = sessions.length;
  const completed = leads.length;
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('statSessions').textContent  = total;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statRate').textContent      = rate + '%';

  const stepCounts = {};
  sessions.forEach(s => {
    const step = s.lastStep || 1;
    if (!s.completed) stepCounts[step] = (stepCounts[step] || 0) + 1;
  });

  let worstStep = null, worstCount = 0;
  Object.entries(stepCounts).forEach(([step, count]) => {
    if (count > worstCount) { worstCount = count; worstStep = step; }
  });

  if (worstStep) {
    document.getElementById('statDropStep').textContent = 'Step ' + worstStep;
    document.getElementById('statDropSub').textContent  = worstCount + ' people left here';
  } else {
    document.getElementById('statDropStep').textContent = 'N/A';
  }
}

// ─── Funnel ───────────────────────────────────────────────────────
function renderFunnel(sessions) {
  const card  = document.getElementById('funnelCard');
  const total = sessions.length;

  if (total === 0) {
    card.innerHTML = '<div class="empty">No sessions yet.</div>';
    return;
  }

  const reached = {};
  for (let i = 1; i <= 8; i++) reached[i] = 0;

  sessions.forEach(s => {
    const last = s.completed ? 8 : (s.lastStep || 1);
    for (let i = 1; i <= last; i++) reached[i]++;
  });

  let html = `
    <div class="funnel-header">
      <span>Step</span>
      <span></span>
      <span>Count</span>
      <span>Of total</span>
      <span>From prev</span>
    </div>`;

  const funnelSteps = [1, 2, 3, 4, 5, 6, 8];

  funnelSteps.forEach((i, idx) => {
    const count    = reached[i];
    const pct      = Math.round((count / total) * 100);
    const prevStep = idx === 0 ? null : funnelSteps[idx - 1];
    const prev     = prevStep === null ? total : reached[prevStep];
    const fromPrev = prev > 0 ? Math.round((count / prev) * 100) : 100;
    const dropPct  = 100 - fromPrev;
    const rowClass = i === 8 ? 'completed' : (dropPct > 40 ? 'drop' : '');

    const fromPrevColor = idx === 0 ? 'var(--text-muted)'
      : fromPrev >= 80 ? 'var(--green)'
      : fromPrev >= 60 ? 'var(--yellow)'
      : 'var(--red)';

    html += `
      <div class="funnel-row ${rowClass}">
        <div class="funnel-label">${stepLabels[i] || 'Step ' + i}</div>
        <div class="funnel-bar-track">
          <div class="funnel-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="funnel-count">${count}</div>
        <div class="funnel-pct">${pct}%</div>
        <div class="funnel-pct" style="color:${fromPrevColor};font-weight:600;">
          ${idx === 0 ? '—' : fromPrev + '%'}
        </div>
      </div>`;
  });

  card.innerHTML = html;
}

// ─── Revenue breakdown ────────────────────────────────────────────
function renderRevenueBreakdown(leads) {
  const container = document.getElementById('revenueBreakdown');
  if (leads.length === 0) { container.innerHTML = '<div class="empty">No data yet.</div>'; return; }

  const counts = {};
  leads.forEach(l => { const v = l.revenue || 'unknown'; counts[v] = (counts[v] || 0) + 1; });

  const max = Math.max(...Object.values(counts));
  let html  = '';

  Object.entries(revenueLabels).forEach(([key, label]) => {
    const count = counts[key] || 0;
    const pct   = max > 0 ? Math.round((count / max) * 100) : 0;
    html += `
      <div class="breakdown-item">
        <div class="breakdown-item-label">${label}</div>
        <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${pct}%"></div></div>
        <div class="breakdown-item-count">${count}</div>
      </div>`;
  });

  container.innerHTML = html;
}

// ─── New leads tab ────────────────────────────────────────────────
function applyFiltersNew() {
  const search  = document.getElementById('filterSearch').value.toLowerCase().trim();
  const revenue = document.getElementById('filterRevenue').value;

  const filtered = newLeads.filter(l => {
    const matchSearch  = !search || [l.contactName, l.contactEmail, l.businessType].some(v => (v || '').toLowerCase().includes(search));
    const matchRevenue = !revenue || l.revenue === revenue;
    return matchSearch && matchRevenue;
  });

  document.getElementById('filterCount').textContent = filtered.length + ' of ' + newLeads.length;
  renderLeadsTable(filtered, 'leadsContainer', 'new');
}

// ─── Qualified tab ────────────────────────────────────────────────
function applyFiltersQualified() {
  const search = document.getElementById('filterSearchQ').value.toLowerCase().trim();

  const filtered = qualifiedLeads.filter(l =>
    !search || [l.contactName, l.contactEmail, l.businessType].some(v => (v || '').toLowerCase().includes(search))
  );

  document.getElementById('filterCountQ').textContent = filtered.length + ' of ' + qualifiedLeads.length;
  renderLeadsTable(filtered, 'qualifiedContainer', 'qualified');
}

// ─── Archived tab ─────────────────────────────────────────────────
function applyFiltersArchived() {
  const search = document.getElementById('filterSearchA').value.toLowerCase().trim();

  const filtered = archivedLeads.filter(l =>
    !search || [l.contactName, l.contactEmail, l.businessType].some(v => (v || '').toLowerCase().includes(search))
  );

  document.getElementById('filterCountA').textContent = filtered.length + ' of ' + archivedLeads.length;
  renderLeadsTable(filtered, 'archivedContainer', 'archived');
}

// ─── Shared table renderer ────────────────────────────────────────
function renderLeadsTable(leads, containerId, mode) {
  const container = document.getElementById(containerId);
  const sourceArr = mode === 'new' ? newLeads : mode === 'qualified' ? qualifiedLeads : archivedLeads;

  if (sourceArr.length === 0) {
    const msg = mode === 'new' ? 'No new leads yet.' : mode === 'qualified' ? 'No qualified leads yet. Qualify leads from the New leads tab.' : 'No archived leads.';
    container.innerHTML = `<div class="empty">${msg}</div>`;
    return;
  }

  if (leads.length === 0) {
    container.innerHTML = '<div class="empty">No leads match your search.</div>';
    return;
  }

  const rows = leads.map((l, i) => {
    const uid   = containerId + '-' + i;
    const date  = l.submittedAt ? new Date(l.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const rev   = revenueLabels[l.revenue] || l.revenue || '—';
    const badge = revenueBadge(l.revenue);
    const drain = l.timeDrain || '—';
    const isLong = drain.length > 80;

    let actionCell = '';

    if (mode === 'new') {
      actionCell = `
        <div class="actions">
          <button class="action-btn action-qualify" onclick="qualifyLead('${l.id}')">Qualify</button>
          <button class="action-btn action-archive" onclick="archiveLead('${l.id}')">Archive</button>
        </div>`;
    } else if (mode === 'qualified') {
      const crmStatus = l.crmStatus || 'to-contact';
      const cls = crmStatus === 'contacted' ? 'status-contacted' : crmStatus === 'in-progress' ? 'status-inprogress' : 'status-contact';
      actionCell = `
        <div class="actions" style="flex-direction:column; align-items:flex-start; gap:6px;">
          <select class="crm-select ${cls}" onchange="updateCrmStatus('${l.id}', this)">
            <option value="to-contact"  ${crmStatus === 'to-contact'  ? 'selected' : ''}>To contact</option>
            <option value="contacted"   ${crmStatus === 'contacted'   ? 'selected' : ''}>Contacted</option>
            <option value="in-progress" ${crmStatus === 'in-progress' ? 'selected' : ''}>In progress</option>
          </select>
          <button class="action-btn action-archive" onclick="archiveLead('${l.id}')">Archive</button>
        </div>`;
    } else {
      actionCell = `
        <div class="actions">
          <button class="action-btn action-restore" onclick="restoreLead('${l.id}')">Restore</button>
        </div>`;
    }

    const booked = l.bookedCall;
    const bookedCell = `
      <button onclick="toggleBooked('${l.id}', this)" style="
        background:${booked ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)'};
        border:1px solid ${booked ? 'rgba(52,211,153,0.3)' : 'var(--border)'};
        color:${booked ? 'var(--green)' : 'var(--text-dim)'};
        font-family:Inter,sans-serif; font-size:11px; font-weight:500;
        padding:4px 10px; border-radius:6px; cursor:pointer; white-space:nowrap;
        transition:all 0.2s;">
        ${booked ? '✓ Booked' : '— Not booked'}
      </button>`;

    return `
      <tr>
        <td>${date}</td>
        <td>
          <div class="cell-name">${l.contactName || '—'}</div>
          <div class="cell-muted">${l.contactEmail || ''}</div>
        </td>
        <td>${l.businessType || '—'}</td>
        <td class="cell-clamp">
          <div class="clamp-text" id="drain-${uid}">${drain}</div>
          ${isLong ? `<button class="expand-btn" onclick="toggleExpand('drain-${uid}', this)">Read more</button>` : ''}
        </td>
        <td><span class="badge ${badge}">${rev}</span></td>
        <td>${l.contactPhone || '—'}</td>
        <td>${bookedCell}</td>
        <td>${actionCell}</td>
      </tr>`;
  }).join('');

  const extraTh = mode === 'new' ? '<th>Actions</th>' : mode === 'qualified' ? '<th>Status</th>' : '<th></th>';


  container.innerHTML = `
    <table class="leads-table">
      <colgroup>
        <col class="col-date"/>
        <col class="col-contact"/>
        <col class="col-business"/>
        <col class="col-drain"/>
        <col class="col-revenue"/>
        <col class="col-phone"/>
        <col class="col-booked"/>
        <col class="col-actions"/>
      </colgroup>
      <thead>
        <tr>
          <th>Date</th>
          <th>Contact</th>
          <th>Business</th>
          <th>Biggest time drain</th>
          <th>Revenue</th>
          <th>Phone</th>
          <th>Call booked</th>
          ${extraTh}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── CRM actions ──────────────────────────────────────────────────
async function qualifyLead(id) {
  await db.collection('ai-business-leads').doc(id).update({ status: 'qualified', crmStatus: 'to-contact' });
  await loadDashboard();
}

async function archiveLead(id) {
  await db.collection('ai-business-leads').doc(id).update({ status: 'archived' });
  await loadDashboard();
}

async function restoreLead(id) {
  await db.collection('ai-business-leads').doc(id).update({ status: 'new' });
  await loadDashboard();
}

async function toggleBooked(id, btn) {
  const isNowBooked = !btn.textContent.includes('✓');
  await db.collection('ai-business-leads').doc(id).update({ bookedCall: isNowBooked });
  btn.style.background    = isNowBooked ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)';
  btn.style.border        = `1px solid ${isNowBooked ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`;
  btn.style.color         = isNowBooked ? 'var(--green)' : 'var(--text-dim)';
  btn.textContent         = isNowBooked ? '✓ Booked' : '— Not booked';
}

async function updateCrmStatus(id, select) {
  const val = select.value;
  select.className = 'crm-select ' + (val === 'contacted' ? 'status-contacted' : val === 'in-progress' ? 'status-inprogress' : 'status-contact');
  await db.collection('ai-business-leads').doc(id).update({ crmStatus: val });
}

// ─── Demo data ────────────────────────────────────────────────────
function loadDemoData() {
  document.getElementById('lastUpdated').textContent = 'Demo mode — not real data';

  const demoSessions = [
    ...Array(50).fill(null).map((_, i) => {
      const stepDist = [50, 42, 35, 28, 22, 18, 15, 12];
      let lastStep = 1;
      for (let s = stepDist.length - 1; s >= 0; s--) {
        if (i < stepDist[s]) { lastStep = s + 1; break; }
      }
      return { lastStep, completed: i < 12 };
    })
  ];

  const demoLeads = [
    { id: 'd1', contactName: 'James Mitchell',  contactEmail: 'james@mitchellplumbing.co.uk', businessType: 'Plumbing & Heating',   timeDrain: "Chasing invoices and following up with clients who haven't paid. I spend hours every week on this and it never seems to get better.", revenue: '50k-200k',  contactPhone: '+44 7911 123456', submittedAt: '2026-04-18T09:23:00Z', status: 'new',       bookedCall: true },
    { id: 'd2', contactName: 'Sarah Chen',       contactEmail: 'sarah@chendesign.co.uk',       businessType: 'Graphic Design',       timeDrain: "Writing client proposals. Each one takes me 2–3 hours and half of them don't convert.",                                         revenue: '10k-50k',   contactPhone: '+44 7922 234567', submittedAt: '2026-04-17T14:05:00Z', status: 'qualified', crmStatus: 'contacted', bookedCall: true },
    { id: 'd3', contactName: 'Marcus Williams',  contactEmail: 'marcus@mwfitness.com',         businessType: 'Personal Training',    timeDrain: "Scheduling sessions and sending reminders manually. My clients forget and I'm constantly texting to confirm.",                   revenue: '10k-50k',   contactPhone: '+44 7933 345678', submittedAt: '2026-04-16T11:30:00Z', status: 'new',       bookedCall: false },
    { id: 'd4', contactName: 'Priya Patel',      contactEmail: 'priya@curryhouse.co.uk',       businessType: 'Restaurant',           timeDrain: "Replying to the same questions on WhatsApp and Instagram about our menu and opening hours. It's all day, every day.",          revenue: '50k-200k',  contactPhone: '+44 7944 456789', submittedAt: '2026-04-15T18:20:00Z', status: 'qualified', crmStatus: 'in-progress', bookedCall: true },
    { id: 'd5', contactName: 'Tom Brady',        contactEmail: 'tom@bradylegal.co.uk',         businessType: 'Law Firm',             timeDrain: "Summarising documents and drafting initial client letters. Takes ages and I have to do it from scratch every single time.",     revenue: '200k-plus', contactPhone: '+44 7955 567890', submittedAt: '2026-04-14T10:15:00Z', status: 'qualified', crmStatus: 'to-contact', bookedCall: false },
    { id: 'd6', contactName: 'Emma Thompson',    contactEmail: 'emma@etcreative.co.uk',        businessType: 'Marketing Agency',     timeDrain: "Writing social media captions and blog posts for 8 clients. We produce content daily and it takes up most of our team's time.", revenue: '50k-200k',  contactPhone: '+44 7966 678901', submittedAt: '2026-04-13T15:45:00Z', status: 'new',       bookedCall: false },
    { id: 'd7', contactName: 'David Kim',        contactEmail: 'david@kimaccounting.co.uk',    businessType: 'Accounting',           timeDrain: "Explaining the same tax concepts to new clients over and over again in meetings.",                                              revenue: '50k-200k',  contactPhone: '+44 7977 789012', submittedAt: '2026-04-12T09:00:00Z', status: 'archived',  bookedCall: false },
    { id: 'd8', contactName: 'Lisa Johnson',     contactEmail: 'lisa@ljvirtual.co.uk',         businessType: 'Virtual Assistant',    timeDrain: "Email management for clients. Sorting, responding to routine emails, scheduling. It's hours every day.",                       revenue: 'under-10k', contactPhone: '+44 7988 890123', submittedAt: '2026-04-11T13:30:00Z', status: 'new',       bookedCall: false },
    { id: 'd9', contactName: "Ryan O'Brien",     contactEmail: 'ryan@obrienconst.ie',          businessType: 'Construction',         timeDrain: "Creating quotes and estimates for every job. Each one is different and takes a long time to put together accurately.",          revenue: '200k-plus', contactPhone: '+44 7999 901234', submittedAt: '2026-04-10T11:00:00Z', status: 'new',       bookedCall: true },
    { id: 'd10', contactName: 'Amara Okafor',   contactEmail: 'amara@beautybyamara.co.uk',    businessType: 'Beauty Salon',         timeDrain: "Booking appointments through Instagram DMs. People message at midnight and I miss them by morning.",                            revenue: '10k-50k',   contactPhone: '+44 7900 012345', submittedAt: '2026-04-09T16:00:00Z', status: 'qualified', crmStatus: 'to-contact', bookedCall: true },
    { id: 'd11', contactName: 'Chris Foster',   contactEmail: 'chris@fosterphoto.co.uk',      businessType: 'Photography',          timeDrain: "Culling and editing hundreds of photos after every shoot. I spend more time editing than I do shooting.",                        revenue: '10k-50k',   contactPhone: '+44 7911 111222', submittedAt: '2026-04-08T10:30:00Z', status: 'new',       bookedCall: false },
    { id: 'd12', contactName: 'Sophie Walsh',   contactEmail: 'sophie@walshrealestate.co.uk', businessType: 'Estate Agent',         timeDrain: "Writing property descriptions for listings. I have 20+ properties at any time and they all need unique, compelling copy.",      revenue: '50k-200k',  contactPhone: '+44 7922 222333', submittedAt: '2026-04-07T14:00:00Z', status: 'new',       bookedCall: false },
  ];

  newLeads       = demoLeads.filter(l => !l.status || l.status === 'new');
  qualifiedLeads = demoLeads.filter(l => l.status === 'qualified');
  archivedLeads  = demoLeads.filter(l => l.status === 'archived');

  adEntries = [
    { id: 'da1', platform: 'google', period: 'Apr 2026', spend: 120,  clicks: 340,  impressions: 8500,  leads: 4, createdAt: '2026-04-18T10:00:00Z' },
    { id: 'da2', platform: 'meta',   period: 'Apr 2026', spend: 80,   clicks: 210,  impressions: 12000, leads: 2, createdAt: '2026-04-15T10:00:00Z' },
    { id: 'da3', platform: 'google', period: 'Mar 2026', spend: 95,   clicks: 280,  impressions: 7200,  leads: 3, createdAt: '2026-03-25T10:00:00Z' },
  ];

  updateBadges();
  renderStats(demoSessions, demoLeads);
  renderFunnel(demoSessions);
  renderRevenueBreakdown(demoLeads);
  renderAdsTab();
  applyFiltersNew();
  applyFiltersQualified();
  applyFiltersArchived();
}

// ─── Helpers ──────────────────────────────────────────────────────
function toggleExpand(id, btn) {
  const el      = document.getElementById(id);
  const expanded = el.classList.toggle('expanded');
  btn.textContent = expanded ? 'Show less' : 'Read more';
}

function revenueBadge(revenue) {
  if (revenue === 'no-revenue' || revenue === 'under-10k') return 'badge-red';
  if (revenue === '10k-50k') return 'badge-yellow';
  return 'badge-green';
}

// ─── Ads tab ──────────────────────────────────────────────────────
async function handleAdsSave() {
  const platform    = document.getElementById('adsPlatform').value;
  const period      = document.getElementById('adsPeriod').value.trim();
  const spend       = parseFloat(document.getElementById('adsSpend').value) || 0;
  const clicks      = parseInt(document.getElementById('adsClicks').value)  || 0;
  const impressions = parseInt(document.getElementById('adsImpressions').value) || 0;
  const leads       = parseInt(document.getElementById('adsLeads').value)   || 0;

  if (!period || spend === 0) {
    const field = !period ? 'adsPeriod' : 'adsSpend';
    const el    = document.getElementById(field);
    el.style.borderColor = 'var(--red)';
    setTimeout(() => { el.style.borderColor = ''; }, 1500);
    return;
  }

  const btn = document.getElementById('adsSaveBtn');
  btn.textContent = 'Saving...';
  btn.disabled    = true;

  const entry = { platform, period, spend, clicks, impressions, leads, createdAt: new Date().toISOString() };

  if (!isDemo) {
    const docRef = await db.collection('ai-business-ads').add(entry);
    adEntries.push({ id: docRef.id, ...entry });
  } else {
    adEntries.push({ id: 'demo-' + Date.now(), ...entry });
  }

  document.getElementById('adsPeriod').value      = '';
  document.getElementById('adsSpend').value        = '';
  document.getElementById('adsClicks').value       = '';
  document.getElementById('adsImpressions').value  = '';
  document.getElementById('adsLeads').value        = '';

  btn.textContent = 'Add entry';
  btn.disabled    = false;

  renderAdsTab();
}

function renderAdsTab() {
  const totalSpend  = adEntries.reduce((s, e) => s + (e.spend  || 0), 0);
  const totalClicks = adEntries.reduce((s, e) => s + (e.clicks || 0), 0);
  const totalLeads  = adEntries.reduce((s, e) => s + (e.leads  || 0), 0);
  const avgCPL      = totalLeads > 0 ? totalSpend / totalLeads : 0;

  document.getElementById('adsStatSpend').textContent  = totalSpend  > 0 ? '£' + totalSpend.toFixed(2)  : '—';
  document.getElementById('adsStatClicks').textContent = totalClicks > 0 ? totalClicks.toLocaleString()  : '—';
  document.getElementById('adsStatLeads').textContent  = totalLeads  > 0 ? totalLeads                   : '—';
  document.getElementById('adsStatCPL').textContent    = avgCPL      > 0 ? '£' + avgCPL.toFixed(2)      : '—';

  const container = document.getElementById('adsContainer');

  if (adEntries.length === 0) {
    container.innerHTML = '<div class="empty">No ad entries yet. Log your first campaign above.</div>';
    return;
  }

  const platLabels = { google: 'Google', meta: 'Meta', tiktok: 'TikTok', other: 'Other' };

  const sorted = [...adEntries].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const rows = sorted.map(e => {
    const cpl       = e.leads > 0 ? '£' + (e.spend / e.leads).toFixed(2) : '—';
    const platClass = 'platform-' + (e.platform || 'other');
    const platLabel = platLabels[e.platform] || e.platform || '—';
    return `
      <tr>
        <td>${e.period || '—'}</td>
        <td><span class="platform-badge ${platClass}">${platLabel}</span></td>
        <td>£${(e.spend || 0).toFixed(2)}</td>
        <td>${(e.clicks || 0).toLocaleString()}</td>
        <td>${(e.impressions || 0).toLocaleString()}</td>
        <td>${e.leads || 0}</td>
        <td>${cpl}</td>
        <td><button class="action-delete" onclick="deleteAdEntry('${e.id}')">Delete</button></td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="ads-table">
      <colgroup>
        <col class="col-ads-period"/>
        <col class="col-ads-platform"/>
        <col class="col-ads-spend"/>
        <col class="col-ads-clicks"/>
        <col class="col-ads-impr"/>
        <col class="col-ads-leads"/>
        <col class="col-ads-cpl"/>
        <col class="col-ads-del"/>
      </colgroup>
      <thead>
        <tr>
          <th>Period</th>
          <th>Platform</th>
          <th>Spend</th>
          <th>Clicks</th>
          <th>Impressions</th>
          <th>Leads</th>
          <th>CPL</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Partial tab ──────────────────────────────────────────────────
function applyFiltersPartial() {
  const search = document.getElementById('filterSearchP').value.toLowerCase().trim();
  const filtered = partialLeads.filter(s =>
    !search || [s.contactName, s.contactEmail, s.businessType].some(v => (v || '').toLowerCase().includes(search))
  );
  document.getElementById('filterCountP').textContent = filtered.length + ' of ' + partialLeads.length;
  renderPartialTable(filtered);
}

function renderPartialTable(sessions) {
  const container = document.getElementById('partialContainer');

  if (partialLeads.length === 0) {
    container.innerHTML = '<div class="empty">No partial submissions yet.</div>';
    return;
  }
  if (sessions.length === 0) {
    container.innerHTML = '<div class="empty">No results match your search.</div>';
    return;
  }

  const stepDropLabels = {
    1: 'Before email',
    2: 'After email',
    3: 'After business type',
    4: 'After time drain',
    5: 'After revenue',
    6: 'After phone',
  };

  const rows = sessions.map(s => {
    const date     = s.startedAt ? new Date(s.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const stoppedAt = stepDropLabels[s.lastStep] || ('Step ' + s.lastStep);
    const followedUp = s.followedUp || false;

    return `
      <tr style="${followedUp ? 'opacity:0.45;' : ''}">
        <td>${date}</td>
        <td>
          <div class="cell-name">${s.contactName || '—'}</div>
          <div class="cell-muted">${s.contactEmail || ''}</div>
        </td>
        <td>${s.businessType || '<span style="color:var(--text-dim)">Not given</span>'}</td>
        <td><span style="font-size:12px;color:var(--text-muted);">${stoppedAt}</span></td>
        <td>
          <button onclick="togglePartialFollowedUp('${s.id}', this)" style="
            background:${followedUp ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)'};
            border:1px solid ${followedUp ? 'rgba(52,211,153,0.3)' : 'var(--border)'};
            color:${followedUp ? 'var(--green)' : 'var(--text-dim)'};
            font-family:Inter,sans-serif; font-size:11px; font-weight:500;
            padding:4px 10px; border-radius:6px; cursor:pointer; white-space:nowrap;
            transition:all 0.2s;">
            ${followedUp ? '✓ Followed up' : '— Not yet'}
          </button>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="leads-table">
      <colgroup>
        <col style="width:110px"/>
        <col style="width:200px"/>
        <col/>
        <col style="width:160px"/>
        <col style="width:130px"/>
      </colgroup>
      <thead>
        <tr>
          <th>Date</th>
          <th>Contact</th>
          <th>Business</th>
          <th>Dropped off</th>
          <th>Follow-up</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function togglePartialFollowedUp(id, btn) {
  const isNow = !btn.textContent.includes('✓');
  await db.collection('ai-business-sessions').doc(id).update({ followedUp: isNow });
  const session = partialLeads.find(s => s.id === id);
  if (session) session.followedUp = isNow;
  btn.style.background = isNow ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)';
  btn.style.border     = `1px solid ${isNow ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`;
  btn.style.color      = isNow ? 'var(--green)' : 'var(--text-dim)';
  btn.textContent      = isNow ? '✓ Followed up' : '— Not yet';
  btn.closest('tr').style.opacity = isNow ? '0.45' : '1';
  updateBadges();
}

async function clearAllData() {
  const confirmed = window.confirm('Delete ALL leads, sessions, and ads? This cannot be undone.');
  if (!confirmed) return;

  const btn = document.getElementById('clearBtn');
  btn.textContent = 'Clearing...';
  btn.disabled = true;

  const [leads, sessions, ads] = await Promise.all([
    db.collection('ai-business-leads').get(),
    db.collection('ai-business-sessions').get(),
    db.collection('ai-business-ads').get(),
  ]);

  const deletes = [
    ...leads.docs.map(d => d.ref.delete()),
    ...sessions.docs.map(d => d.ref.delete()),
    ...ads.docs.map(d => d.ref.delete()),
  ];

  await Promise.all(deletes);

  btn.textContent = 'Clear all data';
  btn.disabled = false;

  isDemo = false;
  loadDashboard();
}

async function deleteAdEntry(id) {
  if (!isDemo) {
    await db.collection('ai-business-ads').doc(id).delete();
  }
  adEntries = adEntries.filter(e => e.id !== id);
  renderAdsTab();
}
