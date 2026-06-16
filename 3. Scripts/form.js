// form.js — Form overlay logic

const TOTAL_STEPS = 6;

let stepHistory    = [];
let currentStep    = 1;
let formData = {
  contactName:  '',
  contactEmail: '',
  businessType: '',
  timeDrain:    '',
  revenue:      '',
  contactPhone: '',
  submittedAt:  ''
};

const stepNames = {
  1: 'name',
  2: 'email',
  3: 'business_type',
  4: 'time_drain',
  5: 'revenue',
  6: 'phone',
  8: 'book_call'
};

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.open-form-btn').forEach(btn => {
    btn.addEventListener('click', openOverlay);
  });

  if (window.location.hash === '#open-form') {
    history.replaceState(null, '', window.location.pathname);
    openOverlay();
  }

  document.getElementById('overlayClose').addEventListener('click', confirmClose);
  document.getElementById('overlayBack').addEventListener('click', goBack);
  document.getElementById('confirmLeave').addEventListener('click', leaveForm);
  document.getElementById('confirmStay').addEventListener('click', dismissConfirm);

  document.addEventListener('keydown', handleKeydown);

  setupStep1();
  setupStep2();
  setupStep3();
  setupStep4();
  setupStep5();
  setupStep6();
});

// ─── Overlay open / close ──────────────────────────────────────────
function openOverlay() {
  resetForm();
  const overlay = document.getElementById('formOverlay');
  overlay.classList.add('open');
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  document.body.style.overflow = 'hidden';
  startSession();
  goToStep(1);
}

function closeOverlay() {
  const overlay = document.getElementById('formOverlay');
  gsap.to(overlay, {
    opacity: 0, duration: 0.3, ease: 'power2.in',
    onComplete: () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

function confirmClose() {
  if (currentStep <= 1 || currentStep === 8) { closeOverlay(); return; }
  document.getElementById('confirmOverlay').classList.add('open');
}

function leaveForm() {
  document.getElementById('confirmOverlay').classList.remove('open');
  closeOverlay();
}

function dismissConfirm() {
  document.getElementById('confirmOverlay').classList.remove('open');
}

// ─── Step navigation ───────────────────────────────────────────────
function goToStep(stepId) {
  if (currentStep !== stepId) stepHistory.push(currentStep);
  currentStep = stepId;
  showStep(stepId);
  updateBackButton();
  trackStep(stepId);
  updateSession(stepId);
}

function goBack() {
  if (stepHistory.length === 0) return;
  const prev = stepHistory.pop();
  currentStep = prev;
  showStep(prev);
  updateBackButton();
}

function showStep(stepId) {
  document.querySelectorAll('.form-step').forEach(s => {
    gsap.set(s, { display: 'none', opacity: 0 });
    s.classList.remove('active');
  });

  const target = document.querySelector(`[data-step="${stepId}"]`);
  if (!target) return;

  target.classList.add('active');
  gsap.set(target, { display: 'block' });
  gsap.fromTo(target,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
  );

  updateProgress(stepId);
}

function updateBackButton() {
  const btn  = document.getElementById('overlayBack');
  const show = stepHistory.length > 0 && currentStep !== 8;
  btn.classList.toggle('visible', show);
}

function updateProgress(stepId) {
  const pct = stepId === 8 ? 100 : (parseInt(stepId) / TOTAL_STEPS) * 100;
  document.getElementById('progressBar').style.width = pct + '%';
}

// ─── GA tracking ───────────────────────────────────────────────────
function trackStep(stepId) {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'form_step_view', {
    step_number: stepId,
    step_name:   stepNames[stepId] || 'unknown'
  });
}

// ─── Reset ─────────────────────────────────────────────────────────
function resetForm() {
  stepHistory    = [];
  currentStep    = 1;
  formData = {
    contactName: '', contactEmail: '', businessType: '', timeDrain: '',
    revenue: '', contactPhone: '', submittedAt: ''
  };
  document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.form-input, .form-textarea').forEach(el => { el.value = ''; });
  document.getElementById('progressBar').style.width = '0%';
}

// ─── Step 1: Name ──────────────────────────────────────────────────
function setupStep1() {
  const input = document.getElementById('contactName');
  document.getElementById('step1NextBtn').addEventListener('click', submitStep1);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submitStep1(); });
}

function submitStep1() {
  const val = document.getElementById('contactName').value.trim();
  if (!val) { shake('contactName'); return; }
  formData.contactName = val;
  goToStep(2);
}

// ─── Step 2: Email (saved to session immediately) ──────────────────
function setupStep2() {
  const input = document.getElementById('contactEmail');
  document.getElementById('step2NextBtn').addEventListener('click', submitStep2);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submitStep2(); });
}

function submitStep2() {
  const val = document.getElementById('contactEmail').value.trim();
  if (!val || !val.includes('@')) { shake('contactEmail'); return; }
  formData.contactEmail = val;
  updateSession(2, { contactName: formData.contactName, contactEmail: val });
  goToStep(3);
}

// ─── Step 3: Business type ─────────────────────────────────────────
function setupStep3() {
  const input = document.getElementById('businessType');
  document.getElementById('step3NextBtn').addEventListener('click', submitStep3);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submitStep3(); });
}

function submitStep3() {
  const val = document.getElementById('businessType').value.trim();
  if (!val) { shake('businessType'); return; }
  formData.businessType = val;
  updateSession(3, { businessType: val });
  goToStep(4);
}

// ─── Step 4: Time drain ────────────────────────────────────────────
function setupStep4() {
  document.getElementById('step4NextBtn').addEventListener('click', submitStep4);
}

function submitStep4() {
  const val = document.getElementById('timeDrain').value.trim();
  if (!val) { shake('timeDrain'); return; }
  formData.timeDrain = val;
  goToStep(5);
}

// ─── Step 5: Revenue ───────────────────────────────────────────────
function setupStep5() {
  document.querySelectorAll('[data-step="5"] .choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-step="5"] .choice-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      formData.revenue = btn.dataset.value;
      setTimeout(() => goToStep(6), 360);
    });
  });
}

// ─── Step 6: Phone + submit ────────────────────────────────────────
function setupStep6() {
  const input = document.getElementById('contactPhone');
  document.getElementById('submitBtn').addEventListener('click', submitForm);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submitForm(); });
}

async function submitForm() {
  const phone = document.getElementById('contactPhone').value.trim();

  formData.contactPhone = phone;
  formData.submittedAt  = new Date().toISOString();

  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    await saveSubmission(formData);
    completeSession();

    emailjs.send('service_lu1el6c', 'template_37u59ak', {
      contact_name:  formData.contactName,
      contact_email: formData.contactEmail,
      business_type: formData.businessType,
      time_drain:    formData.timeDrain,
      revenue:       formData.revenue,
      contact_phone: formData.contactPhone || 'Not provided'
    }).catch(err => console.warn('Email notification failed:', err));

    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submitted', { contact_email: formData.contactEmail });
    }

    stepHistory = [];
    goToStep(8);
  } catch (err) {
    console.error('Submission error:', err);
    btn.textContent = 'Submit application';
    btn.disabled = false;
    alert('Something went wrong. Please try again.');
  }
}

// ─── Keyboard ──────────────────────────────────────────────────────
function handleKeydown(e) {
  const overlay = document.getElementById('formOverlay');
  if (!overlay.classList.contains('open')) return;

  if (e.key === 'Escape') {
    if (document.getElementById('confirmOverlay').classList.contains('open')) {
      dismissConfirm(); return;
    }
    confirmClose();
    return;
  }

  if (e.key === 'Backspace') {
    const tag = document.activeElement.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      e.preventDefault();
      goBack();
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────
function shake(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  gsap.fromTo(el,
    { x: -8 },
    { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)',
      keyframes: { x: [-8, 8, -5, 5, -2, 2, 0] } }
  );
}
