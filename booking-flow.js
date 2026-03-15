// booking-flow.js
// Direct booking system using Cloudflare Pages Functions
// /api/availability — fetches iCal blocked dates server-side
// /api/pricing — fetches live base price from PriceLabs + applies peak multipliers
// /api/booking — sends booking request email via Resend

import { PROPERTIES } from './booking-config.js';

let selectedProperty = null;
let blockedDates = new Set();
let priceEstimate = null;
let appliedDiscount = null; // { code, type, amount, discountAmount, label }

// Calendar navigation state
const today = new Date();
today.setHours(0, 0, 0, 0);
let calYear = today.getFullYear();
let calMonth = today.getMonth();

document.addEventListener('DOMContentLoaded', () => {
    renderPropertySelector();
    setupEventListeners();
    setMinDates();
});

function renderPropertySelector() {
    const selector = document.getElementById('property-selector');
    Object.values(PROPERTIES).forEach(property => {
        const card = document.createElement('div');
        card.className = 'property-option';
        card.dataset.propertyId = property.id;
        card.innerHTML = `
            <h3>${property.name}</h3>
            <p>${property.location}</p>
            <p style="font-size:0.8rem;margin-top:0.5rem;">${property.bedrooms} bed &middot; ${property.maxGuests} guests</p>
            <p style="font-weight:600;color:var(--sage);margin-top:0.5rem;">from $${property.basePrice}/night</p>
        `;
        card.addEventListener('click', () => selectProperty(property.id));
        selector.appendChild(card);
    });
}

function selectProperty(propertyId) {
    document.querySelectorAll('.property-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`[data-property-id="${propertyId}"]`).classList.add('selected');
    selectedProperty = PROPERTIES[propertyId];

    const guestsInput = document.getElementById('guests');
    guestsInput.max = selectedProperty.maxGuests;
    if (parseInt(guestsInput.value) > selectedProperty.maxGuests) {
        guestsInput.value = selectedProperty.maxGuests;
    }

    document.getElementById('availability-calendar').style.display = 'block';
    loadAvailabilityCalendar();
    updatePrice();
}

async function loadAvailabilityCalendar() {
    // Reset to current month when switching property
    calYear = today.getFullYear();
    calMonth = today.getMonth();

    try {
        const res = await fetch(`/api/availability?property=${selectedProperty.id}`);
        const data = await res.json();
        blockedDates = new Set(data.blockedDates || []);
    } catch (e) {
        console.error('Availability load failed:', e);
        blockedDates = new Set();
    }

    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('calendar-month-label');
    grid.innerHTML = '';

    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    label.textContent = `${monthNames[calMonth]} ${calYear}`;

    const checkInVal  = document.getElementById('check-in').value;
    const checkOutVal = document.getElementById('check-out').value;

    // Day-of-week headers
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
        const h = document.createElement('div');
        h.className = 'cal-dow';
        h.textContent = d;
        grid.appendChild(h);
    });

    // First day offset
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'cal-day empty';
        grid.appendChild(blank);
    }

    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dateObj = new Date(calYear, calMonth, d);
        const isPast    = dateObj < today;
        const isBlocked = blockedDates.has(dateStr);
        const isSelStart = dateStr === checkInVal;
        const isSelEnd   = dateStr === checkOutVal;
        const inRange    = checkInVal && checkOutVal && dateStr > checkInVal && dateStr < checkOutVal;

        const cell = document.createElement('div');
        cell.textContent = d;

        let cls = 'cal-day';
        if (isPast)         cls += ' past';
        else if (isBlocked) cls += ' booked';
        else                cls += ' available';
        if (isSelStart)     cls += ' sel-start';
        if (isSelEnd)       cls += ' sel-end';
        if (inRange)        cls += ' in-range';
        cell.className = cls;

        if (!isPast && !isBlocked) {
            cell.addEventListener('click', () => {
                const checkIn  = document.getElementById('check-in');
                const checkOut = document.getElementById('check-out');

                if (!checkIn.value || (checkIn.value && checkOut.value)) {
                    checkIn.value  = dateStr;
                    checkOut.value = '';
                    const next = new Date(dateObj);
                    next.setDate(next.getDate() + 1);
                    checkOut.min = next.toISOString().split('T')[0];
                    updatePrice();
                } else if (dateStr > checkIn.value) {
                    checkOut.value = dateStr;
                    updatePrice();
                } else {
                    checkIn.value  = dateStr;
                    checkOut.value = '';
                    updatePrice();
                }
                renderCalendar(); // re-render to show selection
            });
        }

        grid.appendChild(cell);
    }
}

function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('check-in').min = today;
    document.getElementById('check-out').min = today;
}

function setupEventListeners() {
    const checkIn  = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');

    checkIn.addEventListener('change', () => {
        const next = new Date(checkIn.value + 'T00:00:00');
        next.setDate(next.getDate() + 1);
        checkOut.min = next.toISOString().split('T')[0];
        if (checkOut.value && checkOut.value <= checkIn.value) checkOut.value = '';
        updatePrice();
        renderCalendar();
    });

    checkOut.addEventListener('change', () => { updatePrice(); renderCalendar(); });
    document.getElementById('guests').addEventListener('input', updatePrice);
    document.getElementById('submit-btn').addEventListener('click', submitBookingRequest);
    document.getElementById('apply-promo').addEventListener('click', applyPromoCode);
    document.getElementById('promo-code').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); }
    });

    document.getElementById('cal-prev').addEventListener('click', () => {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        // Don't go before current month
        if (calYear < today.getFullYear() || (calYear === today.getFullYear() && calMonth < today.getMonth())) {
            calMonth = today.getMonth();
            calYear  = today.getFullYear();
        }
        renderCalendar();
    });

    document.getElementById('cal-next').addEventListener('click', () => {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCalendar();
    });
}

async function updatePrice() {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const priceContent = document.getElementById('price-content');
    const submitBtn = document.getElementById('submit-btn');

    if (!selectedProperty || !checkIn || !checkOut) {
        priceContent.innerHTML = '<div class="empty-state"><p>Select property and dates to see pricing</p></div>';
        submitBtn.disabled = true;
        priceEstimate = null;
        return;
    }

    // Check for blocked dates in range
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    const unavailable = [];
    const cur = new Date(start);
    while (cur < end) {
        const d = cur.toISOString().split('T')[0];
        if (blockedDates.has(d)) unavailable.push(d);
        cur.setDate(cur.getDate() + 1);
    }

    if (unavailable.length > 0) {
        priceContent.innerHTML = `
            <div class="empty-state" style="color:#f44336;">
                <p><strong>These dates are not available.</strong></p>
                <p style="font-size:0.85rem;margin-top:0.5rem;">Blocked: ${unavailable.join(', ')}</p>
            </div>`;
        submitBtn.disabled = true;
        priceEstimate = null;
        return;
    }

    priceContent.innerHTML = '<div class="empty-state"><p>Calculating price...</p></div>';
    submitBtn.disabled = true;
    priceEstimate = null;

    try {
        const res = await fetch(
            `/api/pricing?property=${selectedProperty.id}&checkIn=${checkIn}&checkOut=${checkOut}`
        );
        const data = await res.json();

        if (!data.success) {
            priceContent.innerHTML = `<div class="empty-state" style="color:#B67550;"><p>${data.error || 'Could not calculate price.'}</p></div>`;
            return;
        }

        priceEstimate = data.pricing;
        renderPriceSummary();
        submitBtn.disabled = false;

    } catch (err) {
        console.error('Pricing fetch failed:', err);
        priceContent.innerHTML = '<div class="empty-state" style="color:#f44336;"><p>Could not load pricing. Please try again.</p></div>';
    }
}

async function submitBookingRequest() {
    const submitBtn = document.getElementById('submit-btn');
    const name = document.getElementById('guest-name').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const guests = parseInt(document.getElementById('guests').value);
    const specialRequests = document.getElementById('special-requests').value.trim();

    if (!name || !email || !phone) {
        showMessage('Please fill in your name, email, and phone number.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const pricingPayload = appliedDiscount
            ? { ...priceEstimate, total: Math.max(0, priceEstimate.total - appliedDiscount.discountAmount) }
            : priceEstimate;

        const res = await fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                property: selectedProperty.name,
                checkIn,
                checkOut,
                guests,
                name,
                email,
                phone,
                specialRequests,
                pricing: pricingPayload,
                discountCode: appliedDiscount?.code || null,
            }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Submission failed');

        submitBtn.textContent = 'Request Sent!';
        showMessage(
            `Your request for ${selectedProperty.name} is confirmed. Check your inbox — we'll send a payment link within 24 hours.`,
            'success'
        );

        document.getElementById('check-in').value = '';
        document.getElementById('check-out').value = '';
        appliedDiscount = null;

    } catch (err) {
        console.error('Booking submission failed:', err);
        showMessage('Something went wrong. Please try again or email us at indigopalmco@gmail.com.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request to Book';
    }
}

function renderPriceSummary() {
    const priceContent = document.getElementById('price-content');
    if (!priceEstimate) return;

    const baseTotal = priceEstimate.total;
    const discountAmount = appliedDiscount ? Number(appliedDiscount.discountAmount) : 0;
    const finalTotal = Math.max(0, baseTotal - discountAmount);
    const allInNightly = (baseTotal / priceEstimate.nights).toFixed(2);

    const discountRow = appliedDiscount ? `
        <div class="price-row" style="color:#738561;">
            <span>Discount (${appliedDiscount.code})</span>
            <span>-$${discountAmount.toFixed(2)}</span>
        </div>` : '';

    priceContent.innerHTML = `
        <div class="price-breakdown">
            <div class="price-row">
                <span>${priceEstimate.nights} night${priceEstimate.nights !== 1 ? 's' : ''} &times; $${allInNightly}/night</span>
                <span>$${baseTotal.toFixed(2)}</span>
            </div>
            ${discountRow}
            <div class="price-row">
                <strong>Total</strong>
                <strong>$${finalTotal.toFixed(2)}</strong>
            </div>
        </div>
        <div style="margin-top:1rem;padding:0.85rem 1rem;background:#F5F3EE;border-radius:8px;font-size:0.82rem;line-height:1.6;color:#555;">
            <strong style="color:#2C2C2C;">Zelle (no fee):</strong> 214-606-1340 (MPT Industries)<br>
            <strong style="color:#2C2C2C;">Credit card:</strong> Square link sent after request (3% fee)
        </div>`;

    // Show promo code section
    document.getElementById('promo-section').style.display = 'block';
}

async function applyPromoCode() {
    const codeInput = document.getElementById('promo-code');
    const msg = document.getElementById('promo-message');
    const btn = document.getElementById('apply-promo');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) return;
    if (!priceEstimate) {
        msg.style.display = 'block';
        msg.style.color = '#f44336';
        msg.textContent = 'Select dates first to apply a promo code.';
        return;
    }

    // If already applied, allow removing
    if (appliedDiscount && appliedDiscount.code === code) {
        appliedDiscount = null;
        codeInput.value = '';
        btn.textContent = 'Apply';
        msg.style.display = 'none';
        renderPriceSummary();
        return;
    }

    btn.textContent = 'Checking...';
    btn.disabled = true;

    try {
        const res = await fetch(`/api/discount?code=${encodeURIComponent(code)}&total=${priceEstimate.total}`);
        const data = await res.json();

        if (data.success) {
            appliedDiscount = { code, ...data };
            msg.style.display = 'block';
            msg.style.color = '#738561';
            msg.textContent = `${data.label} applied!`;
            btn.textContent = 'Remove';
            btn.disabled = false;
            btn.onclick = () => {
                appliedDiscount = null;
                codeInput.value = '';
                btn.textContent = 'Apply';
                btn.onclick = null;
                btn.addEventListener('click', applyPromoCode);
                msg.style.display = 'none';
                renderPriceSummary();
            };
            renderPriceSummary();
        } else {
            msg.style.display = 'block';
            msg.style.color = '#f44336';
            msg.textContent = data.error || 'Invalid code.';
            btn.textContent = 'Apply';
            btn.disabled = false;
        }
    } catch (e) {
        msg.style.display = 'block';
        msg.style.color = '#f44336';
        msg.textContent = 'Could not verify code. Try again.';
        btn.textContent = 'Apply';
        btn.disabled = false;
    }
}

function showMessage(text, type) {
    const existing = document.getElementById('form-message');
    if (existing) existing.remove();

    const msg = document.createElement('p');
    msg.id = 'form-message';
    msg.style.cssText = `
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        line-height: 1.5;
        ${type === 'success'
            ? 'background:#e8f5e9;color:#2e7d32;border-left:4px solid #4caf50;'
            : 'background:#fdecea;color:#c62828;border-left:4px solid #f44336;'}
    `;
    msg.textContent = text;
    document.getElementById('submit-btn').insertAdjacentElement('afterend', msg);
}
