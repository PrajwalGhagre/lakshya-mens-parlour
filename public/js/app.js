// ============================================================
// LAKSHYA MENS PARLOUR - LUXURY WEBSITE CONTROLLER
// Rajendra Nagar, Nagpur (2 Master Barbers, 1 Common Calendar)
// ============================================================

let publicServicesList = [];
let activeMenuCategory = 'All';
let publicSelectedDate = '';
let publicSelectedSlot = '';

// Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600/90 border-emerald-400 text-white' : 
             type === 'error' ? 'bg-red-600/90 border-red-400 text-white' : 
             'bg-[#121826]/95 border-amber-500/50 text-amber-300';

  toast.className = `toast-msg px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2.5 backdrop-blur-md ${bg}`;
  toast.innerHTML = `
    <span class="text-sm">${type === 'success' ? '✓' : type === 'error' ? '✕' : '💈'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Synthesize Luxury Audio Chime via Web Audio API
function playBarberChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.35); // D6

    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.65);
  } catch(e) {}
}

// -------------------------------------------------------------
// 1. INITIALIZATION & DATA LOADING
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) window.lucide.createIcons();

  await loadPublicWebsiteData();
});

// Load Services & Salon Info from API
async function loadPublicWebsiteData() {
  try {
    const res = await fetch('/api/public/info');
    if (!res.ok) return;
    const data = await res.json();
    publicServicesList = data.services || [];

    renderPublicServicesGrid();
    renderPublicServicesCheckboxes();
    initPublicDateSelector();

  } catch(err) {
    console.error('Error loading salon website data:', err);
  }
}

// -------------------------------------------------------------
// 2. CATEGORY FILTERING & SERVICES GRID
// -------------------------------------------------------------
function filterMenuCategory(category) {
  activeMenuCategory = category;

  // Update filter tab buttons
  document.querySelectorAll('.service-filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const activeBtn = document.getElementById(`filter-btn-${category}`);
  if (activeBtn) activeBtn.classList.add('active');

  renderPublicServicesGrid();
}

function renderPublicServicesGrid() {
  const container = document.getElementById('public-services-grid');
  if (!container) return;

  const filtered = activeMenuCategory === 'All'
    ? publicServicesList
    : publicServicesList.filter(s => s.category === activeMenuCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500 text-xs">No services listed under this category.</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(s => {
    const card = document.createElement('div');
    card.className = 'glass-luxe-card overflow-hidden flex flex-col justify-between group';

    const imgUrl = s.image_url || '/images/haircut.jpg';

    card.innerHTML = `
      <div>
        <div class="h-48 sm:h-52 w-full relative overflow-hidden bg-slate-900">
          <img src="${imgUrl}" alt="${s.name}" class="w-full h-full object-cover group-hover:scale-108 transition duration-500">
          
          <div class="absolute inset-0 bg-gradient-to-t from-[#0C1017] via-transparent to-black/30"></div>
          
          <!-- Price Badge -->
          <div class="absolute top-3.5 right-3.5 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 text-amber-300 font-black text-sm shadow-xl">
            ₹${s.price}
          </div>

          <!-- Duration Pill -->
          <div class="absolute bottom-3 left-3 bg-[#0C1017]/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-slate-300 font-semibold border border-slate-700/80 flex items-center gap-1">
            <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i>
            <span>${s.duration_mins || 25} Mins</span>
          </div>
        </div>

        <div class="p-5">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-base font-bold text-white group-hover:text-amber-300 transition font-display">${s.name}</h3>
          </div>
          <div class="text-xs text-amber-400 font-medium mt-0.5">${s.name_hi || ''}</div>
          <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            ${s.description || 'Precision grooming craft tailored by our master stylists.'}
          </p>
        </div>
      </div>

      <div class="p-5 pt-0">
        <div class="pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
          <div class="text-[11px] text-slate-400">
            Price: <strong class="text-amber-400 text-sm font-black">₹${s.price}</strong>
          </div>
          <button onclick="bookThisService('${s.name}')" class="px-4 py-2 rounded-xl btn-gold-luxe text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-105 transition">
            <span>Select & Book</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

// -------------------------------------------------------------
// 3. APPOINTMENT CONCIERGE (CHECKBOXES & TOTALS)
// -------------------------------------------------------------
function renderPublicServicesCheckboxes() {
  const container = document.getElementById('public-services-checkboxes');
  if (!container) return;

  container.innerHTML = '';
  publicServicesList.forEach((s, idx) => {
    const isFirst = idx === 0;
    const label = document.createElement('label');
    label.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition select-none group';
    label.innerHTML = `
      <div class="flex items-center gap-3 truncate">
        <input type="checkbox" name="public-booking-svc" value="${s.name}" data-price="${s.price}" ${isFirst ? 'checked' : ''} onchange="updatePublicBookingTotal()" class="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-400 transition cursor-pointer">
        <div class="truncate">
          <div class="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">${s.name}</div>
          <div class="text-[10px] text-slate-400">${s.name_hi ? s.name_hi + ' • ' : ''}${s.duration_mins || 25} min</div>
        </div>
      </div>
      <span class="text-xs font-black text-amber-400 shrink-0 ml-2">₹${s.price}</span>
    `;
    container.appendChild(label);
  });

  updatePublicBookingTotal();
}

function bookThisService(serviceName) {
  const checkboxes = document.querySelectorAll('input[name="public-booking-svc"]');
  checkboxes.forEach(cb => {
    if (cb.value === serviceName) {
      cb.checked = true;
    }
  });

  updatePublicBookingTotal();

  const bookingSec = document.getElementById('booking');
  if (bookingSec) {
    bookingSec.scrollIntoView({ behavior: 'smooth' });
  }

  showToast(`"${serviceName}" selected. Please choose your preferred time slot.`, 'info');
}

function updatePublicBookingTotal() {
  const checkboxes = document.querySelectorAll('input[name="public-booking-svc"]:checked');
  let total = 0;
  checkboxes.forEach(cb => {
    total += parseInt(cb.dataset.price || '0', 10);
  });

  const totalEl = document.getElementById('public-total-price');
  if (totalEl) totalEl.textContent = `₹${total}`;
}

// -------------------------------------------------------------
// 4. 7-DAY DATE SELECTOR
// -------------------------------------------------------------
function initPublicDateSelector() {
  const container = document.getElementById('public-date-selector');
  if (!container) return;

  container.innerHTML = '';
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isToday = (i === 0);
    const dayLabel = isToday ? 'Today' : (i === 1 ? 'Tomorrow' : dayNames[d.getDay()]);
    const dateLabel = `${d.getDate()} ${monthNames[d.getMonth()]}`;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.id = `public-date-pill-${dateStr}`;
    pill.className = `flex-1 min-w-[80px] py-2.5 px-2.5 rounded-xl text-center border transition shrink-0 ${
      i === 0 
        ? 'border-amber-400 bg-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20' 
        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 font-semibold'
    }`;
    pill.innerHTML = `
      <div class="text-[10px] uppercase font-bold tracking-wider">${dayLabel}</div>
      <div class="text-xs font-black mt-0.5">${dateLabel}</div>
    `;

    pill.onclick = () => selectPublicDate(dateStr);
    container.appendChild(pill);

    if (i === 0) {
      publicSelectedDate = dateStr;
    }
  }

  loadPublicSlots(publicSelectedDate);
}

function selectPublicDate(dateStr) {
  publicSelectedDate = dateStr;
  publicSelectedSlot = '';
  const hiddenInput = document.getElementById('public-selected-slot');
  if (hiddenInput) hiddenInput.value = '';

  document.querySelectorAll('#public-date-selector button').forEach(b => {
    b.className = 'flex-1 min-w-[80px] py-2.5 px-2.5 rounded-xl text-center border transition shrink-0 border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 font-semibold';
  });

  const activePill = document.getElementById(`public-date-pill-${dateStr}`);
  if (activePill) {
    activePill.className = 'flex-1 min-w-[80px] py-2.5 px-2.5 rounded-xl text-center border transition shrink-0 border-amber-400 bg-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20';
  }

  loadPublicSlots(dateStr);
}

// -------------------------------------------------------------
// 5. 30-MIN SLOT SELECTOR (2 BARBERS CAPACITY ENFORCED)
// -------------------------------------------------------------
async function loadPublicSlots(dateStr) {
  const container = document.getElementById('public-slots-grid');
  if (!container) return;

  container.innerHTML = '<div class="col-span-full text-center py-6 text-slate-500 text-xs">Checking real-time chair availability...</div>';

  try {
    const res = await fetch(`/api/public/slots?date=${dateStr}`);
    if (!res.ok) throw new Error('Failed to load slots');
    const data = await res.json();

    if (data.isClosed) {
      container.innerHTML = `
        <div class="col-span-full text-center py-6 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-bold">
          ⚠️ ${data.dayName}: Weekly salon maintenance / closed. Please choose another date.
        </div>
      `;
      return;
    }

    renderPublicSlotsGrid(data.slots || [], data.capacity || 2);

  } catch(err) {
    console.error('Error loading slots:', err);
    container.innerHTML = '<div class="col-span-full text-center py-6 text-red-400 text-xs">Unable to load slots. Please refresh.</div>';
  }
}

function renderPublicSlotsGrid(slots, capacity) {
  const container = document.getElementById('public-slots-grid');
  if (!container) return;

  if (slots.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-6 text-slate-500 text-xs">No slots available for this date.</div>';
    return;
  }

  container.innerHTML = '';
  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `public-slot-${slot.time.replace(':', '-')}`;

    const isAvailable = slot.isAvailable;
    const isFull = slot.status === 'full';
    const isPast = slot.status === 'past';

    let statusText = `${slot.availableSpots} Free`;
    if (slot.availableSpots === 1) statusText = '1 Left';
    if (isFull) statusText = 'Reserved';
    if (isPast) statusText = 'Past';

    let extraClass = 'border-slate-800 bg-slate-900/90 text-slate-200';
    if (!isAvailable) {
      extraClass = 'slot-full opacity-35 bg-slate-950 border-slate-900 text-slate-500 cursor-not-allowed';
    }

    btn.className = `slot-pill-luxe p-2.5 rounded-xl text-center transition flex flex-col items-center justify-center ${extraClass}`;
    btn.innerHTML = `
      <span class="text-xs font-bold font-display">${slot.displayTime}</span>
      <span class="text-[9px] font-semibold mt-0.5 ${isFull ? 'text-red-400' : (isAvailable ? 'text-amber-400' : 'text-slate-500')}">${statusText}</span>
    `;

    if (isAvailable) {
      btn.onclick = () => selectPublicSlot(slot.time, slot.displayTime);
    } else {
      btn.disabled = true;
    }

    container.appendChild(btn);
  });
}

function selectPublicSlot(timeStr, displayTime) {
  publicSelectedSlot = timeStr;
  const hiddenInput = document.getElementById('public-selected-slot');
  if (hiddenInput) hiddenInput.value = timeStr;

  document.querySelectorAll('#public-slots-grid .slot-pill-luxe').forEach(b => {
    if (!b.disabled) {
      b.classList.remove('slot-selected');
    }
  });

  const selectedBtn = document.getElementById(`public-slot-${timeStr.replace(':', '-')}`);
  if (selectedBtn) {
    selectedBtn.classList.add('slot-selected');
  }

  showToast(`Time slot reserved: ${displayTime}`, 'info');
}

// -------------------------------------------------------------
// 6. APPOINTMENT RESERVATION SUBMISSION
// -------------------------------------------------------------
async function handlePublicBookingSubmit(e) {
  e.preventDefault();

  if (!publicSelectedSlot) {
    showToast('Please select an available 30-min time slot!', 'error');
    const slotSec = document.getElementById('public-slots-grid');
    if (slotSec) slotSec.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const checkedServices = [];
  document.querySelectorAll('input[name="public-booking-svc"]:checked').forEach(cb => {
    checkedServices.push(cb.value);
  });

  if (checkedServices.length === 0) {
    showToast('Please select at least one grooming service!', 'error');
    return;
  }

  const name = document.getElementById('public-cust-name').value.trim();
  const phone = document.getElementById('public-cust-phone').value.trim();
  const notes = document.getElementById('public-cust-notes').value.trim();

  if (!name) {
    showToast('Please enter your full name.', 'error');
    return;
  }

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.slice(2);
  if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);

  if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-public-book');
  btn.disabled = true;
  btn.innerHTML = '<span>Confirming Reservation...</span>';

  try {
    const res = await fetch('/api/public/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone: cleanPhone,
        date: publicSelectedDate,
        slot_time: publicSelectedSlot,
        services: checkedServices,
        notes
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'This slot just filled up! Please choose another time.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> <span>Confirm Appointment Reservation (Free Booking)</span>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Confetti celebration & audio chime
    if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
    playBarberChime();

    // Populate Voucher Modal
    document.getElementById('ticket-booking-code').textContent = data.bookingCode || 'LAK-SUCCESS';
    document.getElementById('ticket-cust-name').textContent = data.customerName || name;
    document.getElementById('ticket-date').textContent = data.date;
    document.getElementById('ticket-time').textContent = formatTime12h(data.slot_time);
    document.getElementById('ticket-services').textContent = (data.services || []).join(', ');
    document.getElementById('ticket-amount').textContent = `₹${data.estimatedAmount || 0}`;

    const linkEl = document.getElementById('ticket-personal-link');
    if (linkEl && data.personalLink) {
      linkEl.href = data.personalLink;
      linkEl.textContent = 'View My Personal VIP Pass Link';
    }

    const modal = document.getElementById('modal-ticket');
    if (modal) modal.classList.remove('hidden');

    // Reset inputs
    document.getElementById('public-cust-notes').value = '';
    publicSelectedSlot = '';
    const hiddenInput = document.getElementById('public-selected-slot');
    if (hiddenInput) hiddenInput.value = '';

    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> <span>Confirm Appointment Reservation (Free Booking)</span>';
    if (window.lucide) window.lucide.createIcons();

    await loadPublicSlots(publicSelectedDate);

  } catch(err) {
    console.error('Reservation error:', err);
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> <span>Confirm Appointment Reservation (Free Booking)</span>';
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeTicketModal() {
  const modal = document.getElementById('modal-ticket');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// 7. VIP LOYALTY STAMPS LOOKUP
// -------------------------------------------------------------
async function handleCustomerLoyaltyLookup(e) {
  e.preventDefault();
  const input = document.getElementById('lookup-phone-input');
  const resultBox = document.getElementById('lookup-result-box');
  if (!input || !resultBox) return;

  const phone = input.value.trim();
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.slice(2);
  if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);

  if (cleanPhone.length !== 10) {
    showToast('Please enter your 10-digit mobile number.', 'error');
    return;
  }

  resultBox.classList.remove('hidden');
  resultBox.innerHTML = '<div class="text-xs text-slate-400 text-center py-2">Accessing membership directory...</div>';

  try {
    const res = await fetch('/api/public/lookup-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone })
    });

    const data = await res.json();
    if (!res.ok || !data.found) {
      resultBox.innerHTML = `
        <div class="text-xs text-slate-300">
          <div class="font-bold text-amber-400">Mobile number not yet registered in VIP directory.</div>
          <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">No worries! Simply reserve your first appointment below — your digital membership and loyalty stamps begin automatically on your first visit!</p>
          <a href="#booking" class="inline-block mt-2 text-xs font-bold text-amber-300 underline">Reserve Your First Slot Below →</a>
        </div>
      `;
      return;
    }

    const c = data.customer;
    const loyalty = data.loyalty;

    let rewardBadge = '';
    if (loyalty.isRewardDue) {
      if (loyalty.reward === 'FREE_CUT') {
        rewardBadge = '<div class="mt-2.5 p-2.5 rounded-xl bg-pink-950/80 border border-pink-500 text-pink-300 text-xs font-black animate-pulse">🎉 Congratulations! Your next haircut is 100% COMPLIMENTARY!</div>';
      } else if (loyalty.reward === 'HALF_PRICE') {
        rewardBadge = '<div class="mt-2.5 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-black animate-pulse">🔥 Congratulations! Your next visit enjoys a 50% HALF PRICE PRIVILEGE!</div>';
      }
    } else {
      rewardBadge = `<div class="mt-2 text-[11px] text-slate-400">${loyalty.visitsUntilNextReward} visit(s) remaining until your next complimentary privilege.</div>`;
    }

    resultBox.innerHTML = `
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="text-sm font-bold text-white font-display">Welcome Back, ${c.name}!</div>
          <span class="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40">VIP Member</span>
        </div>
        <div class="text-xs text-slate-300">
          Total Visits: <strong>${c.total_visits}</strong> • Loyalty Progress: <strong>${loyalty.progressText}</strong>
        </div>
        ${rewardBadge}
        <div class="pt-2.5 border-t border-slate-800 flex items-center justify-between">
          <a href="${data.personalLink}" class="text-xs font-bold text-amber-400 underline hover:text-amber-300 flex items-center gap-1">
            <span>Open Your Personal VIP Pass</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </a>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

  } catch(err) {
    console.error('Loyalty lookup error:', err);
    resultBox.innerHTML = '<div class="text-xs text-red-400">Connection error. Please try again.</div>';
  }
}

// Helper: 24h to 12h time formatter
function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}
