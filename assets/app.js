(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menu = $('.menu-toggle');
  const nav = $('#main-nav');
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('open');
  };
  menu.addEventListener('click', () => {
    const opening = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(opening));
    menu.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', opening);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  const from = $('#from-suburb');
  const to = $('#to-suburb');
  const service = $('#move-service');
  const moveToPlan = () => $('#plan').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  const showForm = () => { $('#moving-form').hidden = false; $('#brief-result').hidden = true; };
  $('#quick-plan').addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    showForm();
    from.value = String(data.get('from') || '').trim();
    to.value = String(data.get('to') || '').trim();
    moveToPlan();
    service.focus({ preventScroll: true });
  });
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    showForm(); service.value = a.dataset.service;
  }));
  $$('[data-suburb]').forEach(button => button.addEventListener('click', () => {
    showForm(); from.value = button.dataset.suburb; moveToPlan(); to.focus({ preventScroll: true });
  }));

  const tabs = $$('.cost-tabs [role=tab]');
  const panels = $$('.cost-panels [role=tabpanel]');
  function selectCostTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCostTab(index));
    tab.addEventListener('keydown', e => {
      let next = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault(); selectCostTab(next, true);
    });
  });

  const checklist = $$('[data-check]');
  const checklistKey = 'tideway-checklist-v1';
  try {
    const saved = JSON.parse(localStorage.getItem(checklistKey) || '[]');
    if (Array.isArray(saved)) checklist.forEach((input, i) => input.checked = saved[i] === true);
  } catch (_) { /* Checklist remains usable if storage is unavailable. */ }
  function updateChecklist(save = true) {
    const count = checklist.filter(input => input.checked).length;
    $('#check-count').textContent = `${count} of ${checklist.length} things taken care of`;
    $('#check-progress').value = count;
    if (save) { try { localStorage.setItem(checklistKey, JSON.stringify(checklist.map(input => input.checked))); } catch (_) {} }
  }
  checklist.forEach(input => input.addEventListener('change', () => updateChecklist()));
  $('#reset-checklist').addEventListener('click', () => {
    checklist.forEach(input => input.checked = false);
    try { localStorage.removeItem(checklistKey); } catch (_) {}
    updateChecklist(false);
  });
  updateChecklist(false);
  $('#print-checklist').addEventListener('click', () => window.print());

  const localDate = new Date();
  $('#year').textContent = String(localDate.getFullYear());
  const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
  $('#move-date').min = today;
  let briefText = '';
  $('#moving-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!String(data.get('from') || '').trim() || !String(data.get('to') || '').trim()) {
      (String(data.get('from') || '').trim() ? to : from).setCustomValidity('Please enter a suburb or postcode.');
      e.currentTarget.reportValidity(); return;
    }
    const chosenDate = String(data.get('date') || '');
    let dateLabel = 'Not decided yet';
    if (chosenDate) {
      const [y, m, d] = chosenDate.split('-').map(Number);
      dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const extras = data.getAll('extras').map(String);
    briefText = [
      'MY MOVING BRIEF', 'Tideway Removals — website concept', '',
      `Name: ${String(data.get('name') || '').trim() || 'Not provided'}`,
      `Moving from: ${String(data.get('from')).trim()}`,
      `Moving to: ${String(data.get('to')).trim()}`,
      `Main service: ${data.get('service')}`,
      `Approximate size: ${data.get('size')}`,
      `Preferred date: ${dateLabel}`,
      `Flexibility: ${data.get('flexibility')}`,
      `Extra help: ${extras.length ? extras.join(', ') : 'None selected'}`, '',
      'DETAILS & QUESTIONS', String(data.get('notes') || '').trim() || 'No additional notes.', '',
      'TO CONFIRM WITH YOUR PROVIDER',
      '• Inventory, vehicle, crew and access at both ends',
      '• Charging basis, inclusions, travel, minimum time and GST',
      '• Packing, specialist items and protection arrangements',
      '• Accepted date, payment, changes and cancellation terms', '',
      'This brief has not been sent. It is not a quote or a confirmed booking.'
    ].join('\n');
    $('#brief-preview').textContent = briefText;
    e.currentTarget.hidden = true;
    $('#brief-result').hidden = false;
    $('#brief-result').focus({ preventScroll: true });
    $('#brief-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  [from, to].forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
  $('#edit-brief').addEventListener('click', () => { showForm(); from.focus({ preventScroll: true }); });
  $('#download-brief').addEventListener('click', () => {
    if (!briefText) return;
    const url = URL.createObjectURL(new Blob([briefText], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'Tideway_Moving_Brief.txt'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const dialog = $('#concept-dialog');
  $('#about-concept').addEventListener('click', () => dialog.showModal());
  $('#close-concept').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
})();
