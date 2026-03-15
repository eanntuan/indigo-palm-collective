// booking-flow.js
// Direct booking system using Cloudflare Pages Functions
// /api/availability — fetches iCal blocked dates server-side
// /api/pricing — fetches live base price from PriceLabs + applies peak multipliers
// /api/booking — sends booking request email via Resend

import { PROPERTIES } from './booking-config.js';

let selectedProperty = null;
let blockedDates = new Set();
let priceEstimate = null;

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
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;padding:1rem;">Loading availability...</p>';

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
    grid.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 90);

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const h = document.createElement('div');
        h.className = 'calendar-day header';
        h.textContent = day;
        grid.appendChild(h);
    });

    for (let i = 0; i < today.getDay(); i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day empty';
        grid.appendChild(blank);
    }

    const current = new Date(today);
    while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        const isBlocked = blockedDates.has(dateStr);

        const cell = document.createElement('div');
        cell.className = `calendar-day ${isBlocked ? 'booked' : 'available'}`;
        cell.textContent = current.getDate();
        cell.title = `${dateStr} — ${isBlocked ? 'Booked' : 'Available'}`;

        if (!isBlocked) {
            const d = dateStr;
            cell.addEventListener('click', () => {
                const checkIn = document.getElementById('check-in');
                const checkOut = document.getElementById('check-out');

                if (!checkIn.value || (checkIn.value && checkOut.value)) {
                    checkIn.value = d;
                    checkOut.value = '';
                    const next = new Date(d + 'T00:00:00');
                    next.setDate(next.getDate() + 1);
                    checkOut.min = next.toISOString().split('T')[0];
                    updatePrice();
                } else if (d > checkIn.value) {
                    checkOut.value = d;
                    updatePrice();
                } else {
                    checkIn.value = d;
                    checkOut.value = '';
                    updatePrice();
                }
            });
        }

        grid.appendChild(cell);
        current.setDate(current.getDate() + 1);
    }
}

function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('check-in').min = today;
    document.getElementById('check-out').min = today;
}

function setupEventListeners() {
    const checkIn = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');

    checkIn.addEventListener('change', () => {
        const next = new Date(checkIn.value + 'T00:00:00');
        next.setDate(next.getDate() + 1);
        checkOut.min = next.toISOString().split('T')[0];
        if (checkOut.value && checkOut.value <= checkIn.value) checkOut.value = '';
        updatePrice();
    });

    checkOut.addEventListener('change', updatePrice);
    document.getElementById('guests').addEventListener('input', updatePrice);
    document.getElementById('submit-btn').addEventListener('click', submitBookingRequest);
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

        // Group consecutive nights at same rate
        const grouped = [];
        let i = 0;
        while (i < priceEstimate.nightly.length) {
            const cur = priceEstimate.nightly[i];
            let count = 1;
            while (i + count < priceEstimate.nightly.length && priceEstimate.nightly[i + count].rate === cur.rate) count++;
            grouped.push({ rate: cur.rate, count, peakLabel: cur.peakLabel });
            i += count;
        }

        const rows = grouped.map(g => `
            <div class="price-row">
                <span>$${g.rate}/night &times; ${g.count}${g.peakLabel ? ` <span style="font-size:0.75em;color:#B67550;">(${g.peakLabel})</span>` : ''}</span>
                <span>$${(g.rate * g.count).toFixed(2)}</span>
            </div>`).join('');

        priceContent.innerHTML = `
            <div class="price-breakdown">
                ${rows}
                <div class="price-row">
                    <span>Cleaning fee</span>
                    <span>$${priceEstimate.cleaningFee.toFixed(2)}</span>
                </div>
                <div class="price-row">
                    <span>Taxes (${(priceEstimate.taxRate * 100).toFixed(1)}%)</span>
                    <span>$${priceEstimate.taxAmount.toFixed(2)}</span>
                </div>
                <div class="price-row">
                    <strong>Total</strong>
                    <strong>$${priceEstimate.total.toFixed(2)}</strong>
                </div>
            </div>`;

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
                pricing: priceEstimate,
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

    } catch (err) {
        console.error('Booking submission failed:', err);
        showMessage('Something went wrong. Please try again or email us at indigopalmco@gmail.com.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request to Book';
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
