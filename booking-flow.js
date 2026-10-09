// booking-flow.js
// Direct booking system using Cloudflare Pages Functions
// /api/availability — fetches iCal blocked dates server-side
// /api/pricing — fetches live base price from PriceLabs + applies peak multipliers
// /api/booking — sends booking request email via Resend

import { PROPERTIES } from '/booking-config.js?v=3';

let selectedProperty = null;
let blockedDates = new Set();
let priceEstimate = null;
let appliedDiscount = null; // { code, type, amount, discountAmount, label }
let poolHeatSelected = false;

function calcPoolHeatCost(nights) {
    if (!nights || nights < 2) return 0;
    if (nights >= 7) return 400;
    return nights * 75;
}

function getPoolHeatNights() {
    const input = document.getElementById('pool-heat-nights');
    return input ? parseInt(input.value) || 0 : 0;
}

function syncPoolHeatNightsMax() {
    if (!priceEstimate) return;
    const input = document.getElementById('pool-heat-nights');
    if (!input) return;
    input.max = priceEstimate.nights;
    if (!input.value || parseInt(input.value) > priceEstimate.nights) {
        input.value = priceEstimate.nights;
    }
    if (parseInt(input.value) < 2) input.value = 2;
    validatePoolHeatNights();
}

function validatePoolHeatNights() {
    const nights = getPoolHeatNights();
    const err = document.getElementById('pool-heat-nights-error');
    if (err) err.style.display = nights < 2 ? 'block' : 'none';
    return nights >= 2;
}

// Calendar navigation state
const today = new Date();
today.setHours(0, 0, 0, 0);
let calYear = today.getFullYear();
let calMonth = today.getMonth();

document.addEventListener('DOMContentLoaded', () => {
    renderPropertySelector();
    setupEventListeners();
    setMinDates();
    readUrlParams();
});

// The Well is long-term only, so it is not offered in the booking form.
const BOOKABLE = Object.values(PROPERTIES).filter(p => p.id !== 'the-well');
const SLUG_ALIASES = { 'the-sundune': 'ps-retreat' };

const PROPERTY_IMAGES = {
    'cozy-cactus': '/cozy-cactus/photos/CozyCactus2026-0004.webp',
    'terra-luz':   '/blog/images/terra-luz-pool-backyard.webp',
    'ps-retreat':  '/the-sundune/photos/Sundune2026-0120.webp',
    'the-well':    '/email-images/the-well.jpg',
};

function renderPropertySelector() {
    const trigger = document.getElementById('property-trigger');
    const optionsEl = document.getElementById('property-options');
    const container = document.getElementById('property-selector');
    const setOpen = open => {
        container.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', open);
    };
    const items = () => [...optionsEl.children];
    const highlight = i => items().forEach((el, n) => el.classList.toggle('active', n === i));

    BOOKABLE.forEach(property => {
        const item = document.createElement('div');
        item.className = 'custom-option';
        item.dataset.value = property.id;
        item.setAttribute('role', 'option');
        const img = PROPERTY_IMAGES[property.id] ? `<img src="${PROPERTY_IMAGES[property.id]}" alt="" loading="lazy">` : '';
        item.innerHTML = `${img}<div class="custom-option-text"><span class="custom-option-name">${property.name}</span><span class="custom-option-meta">${property.bedrooms}BR/${property.bathrooms}BA &middot; ${property.minNights} night min</span></div>`;
        item.addEventListener('click', () => {
            selectProperty(property.id);
            setOpen(false);
            trigger.focus();
        });
        optionsEl.appendChild(item);
    });

    trigger.addEventListener('click', () => setOpen(!container.classList.contains('open')));
    trigger.addEventListener('keydown', e => {
        const open = container.classList.contains('open');
        const cur = items().findIndex(el => el.classList.contains('active'));
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open) { setOpen(true); highlight(Math.max(items().findIndex(el => el.classList.contains('selected')), 0)); return; }
            highlight((cur + (e.key === 'ArrowDown' ? 1 : -1) + items().length) % items().length);
        } else if (e.key === 'Enter' && open && cur >= 0) {
            e.preventDefault();
            items()[cur].click();
        } else if (e.key === 'Escape' || e.key === 'Tab') {
            setOpen(false);
        }
    });
    document.addEventListener('click', e => { if (!container.contains(e.target)) setOpen(false); });
}

function readUrlParams() {
    // Check pathname: /booking-flow/terra-luz/ → terra-luz
    const pathParts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const bfIdx = pathParts.indexOf('booking-flow');
    const pathSlug = bfIdx !== -1 ? pathParts[bfIdx + 1] : null;

    const params = new URLSearchParams(window.location.search);
    const raw = pathSlug || params.get('property');
    const prop = SLUG_ALIASES[raw] || raw;
    const checkIn = params.get('checkIn');
    const checkOut = params.get('checkOut');

    if (prop && PROPERTIES[prop] && prop !== 'the-well') {
        selectProperty(prop);
    }
    if (checkIn) {
        document.getElementById('check-in').value = checkIn;
    }
    if (checkOut) {
        document.getElementById('check-out').value = checkOut;
        updatePrice();
    }
}

const PROPERTY_HEROES = {
    'cozy-cactus': {
        img: '/cozy-cactus/video/cozy-cactus-hero-poster.webp?v=7',
        title: 'The Cozy Cactus',
        video: '/cozy-cactus/video/cozy-cactus-hero',
        sub: '3BR · Indio · Private hot tub · Game room · Sleeps 8',
    },
    'terra-luz': {
        img: '/terra-luz/photos/pool-patio/TerraLuz2026-0168.webp',
        title: 'Terra Luz',
        video: '/terra-luz/video/terra-luz-hero',
        sub: '3BR · Indio · Saltwater pool · Dog-friendly · Sleeps 8',
    },
    'ps-retreat': {
        img: '/the-sundune/photos/Sundune2026-0120.webp',
        title: 'The Sundune',
        video: '/the-sundune/video/sundune-hero',
        sub: '2BR · Palm Springs · Private pool · Three king beds',
    },
};

function selectProperty(propertyId) {
    selectedProperty = PROPERTIES[propertyId];
    document.documentElement.dataset.property = propertyId;

    // Update URL to pretty path
    history.replaceState(null, '', '/booking-flow/' + propertyId + '/');

    // Update hero banner
    const hero = PROPERTY_HEROES[propertyId];
    if (hero) {
        const heroEl = document.getElementById('booking-hero');
        if (heroEl) {
            heroEl.style.backgroundImage = `url('${hero.img}')`;
            heroEl.style.opacity = '1';
            const titleEl = document.getElementById('booking-hero-title');
            const subEl = document.getElementById('booking-hero-sub');
            if (titleEl) titleEl.textContent = hero.title;
            if (subEl) subEl.textContent = hero.sub;
            const vid = document.getElementById('booking-hero-video');
            const conn = navigator.connection || {};
            vid.classList.remove('is-ready');
            if (hero.video && !matchMedia('(prefers-reduced-motion: reduce)').matches && !conn.saveData && !/^(slow-2g|2g|3g)$/.test(conn.effectiveType || '')) {
                vid.src = hero.video + (matchMedia('(max-width: 800px)').matches ? '-720.mp4' : '.mp4');
                vid.defaultPlaybackRate = vid.playbackRate = 0.75;
                vid.play().catch(() => {});
            } else {
                vid.pause();
                vid.removeAttribute('src');
            }
        }
    }

    // Update trigger to show selected property
    const trigger = document.getElementById('property-trigger');
    if (trigger) {
        const img = PROPERTY_IMAGES[propertyId] ? `<img src="${PROPERTY_IMAGES[propertyId]}" alt="">` : '';
        trigger.innerHTML = `${img}<span>${selectedProperty.name}</span>`;
    }
    // Mark selected option
    document.querySelectorAll('.custom-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.value === propertyId);
    });

    const guestsInput = document.getElementById('guests');
    guestsInput.max = selectedProperty.maxGuests;
    if (parseInt(guestsInput.value) > selectedProperty.maxGuests) {
        guestsInput.value = selectedProperty.maxGuests;
    }

    document.getElementById('availability-calendar').style.display = 'block';

    // Pool heat: show only for terra-luz
    const poolSection = document.getElementById('pool-heat-section');
    if (propertyId === 'terra-luz') {
        poolSection.style.display = 'block';
    } else {
        poolSection.style.display = 'none';
        poolHeatSelected = false;
        document.getElementById('pool-heat-no').checked = true;
    }

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
        if (isSelStart && !checkOutVal) cls += ' sel-single';
        if (inRange)        cls += ' in-range';
        cell.className = cls;
        cell.dataset.date = dateStr;
        const minN = selectedProperty?.minNights || 1;
        if (!isPast && !isBlocked && minN > 1) cell.dataset.min = `${minN}-night minimum`;

        if (!isPast && !isBlocked) {
            cell.addEventListener('click', () => {
                const checkIn  = document.getElementById('check-in');
                const checkOut = document.getElementById('check-out');

                if (!checkIn.value || (checkIn.value && checkOut.value)) {
                    checkIn.value  = dateStr;
                    checkOut.value = '';
                    const earliest = new Date(dateObj);
                    earliest.setDate(earliest.getDate() + (selectedProperty?.minNights || 1));
                    checkOut.min = earliest.toISOString().split('T')[0];
                    updatePrice();
                } else if (dateStr > checkIn.value && dateStr >= checkOut.min) {
                    checkOut.value = dateStr;
                    updatePrice();
                } else if (dateStr > checkIn.value) {
                    // Below this property's minimum stay — restart the range from here
                    // instead of silently accepting a too-short stay.
                    checkIn.value  = dateStr;
                    checkOut.value = '';
                    const earliest = new Date(dateObj);
                    earliest.setDate(earliest.getDate() + (selectedProperty?.minNights || 1));
                    checkOut.min = earliest.toISOString().split('T')[0];
                    updatePrice();
                } else {
                    checkIn.value  = dateStr;
                    checkOut.value = '';
                    updatePrice();
                }
                syncUrlDates();
                renderCalendar(); // re-render to show selection
            });
        }

        grid.appendChild(cell);
    }
    wireRangePreview(grid);
}

// Airbnb-style hover preview: after a check-in is picked, hovering later dates draws the pill up to that date
let previewed = [];
function clearRangePreview() {
    previewed.forEach(([el, cls]) => { el.className = cls; });
    previewed = [];
}
function wireRangePreview(grid) {
    if (grid.dataset.preview) return;
    grid.dataset.preview = '1';
    grid.addEventListener('mouseleave', clearRangePreview);
    grid.addEventListener('mouseover', e => {
        const hov = e.target.closest('.cal-day[data-date]');
        clearRangePreview();
        const checkIn = document.getElementById('check-in').value;
        const checkOut = document.getElementById('check-out');
        if (!hov || !checkIn || checkOut.value || !hov.classList.contains('available')) return;
        const end = hov.dataset.date;
        if (end <= checkIn || (checkOut.min && end < checkOut.min)) return;
        const cells = [...grid.querySelectorAll('.cal-day[data-date]')];
        if (cells.some(c => c.dataset.date > checkIn && c.dataset.date < end && c.classList.contains('booked'))) return;
        cells.forEach(c => {
            const d = c.dataset.date;
            let add = '';
            if (d === checkIn) add = ' sel-start';
            else if (d > checkIn && d < end) add = ' in-range';
            else if (d === end) add = ' sel-end';
            if (!add) return;
            previewed.push([c, c.className]);
            c.className += add;
            if (add === ' sel-start') c.classList.remove('sel-single');
        });
    });
}

function syncUrlDates() {
    if (!selectedProperty) return;
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    const query = params.toString();
    const url = `/booking-flow/${selectedProperty.id}/${query ? '?' + query : ''}`;
    history.replaceState(null, '', url);
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
        const earliest = new Date(checkIn.value + 'T00:00:00');
        earliest.setDate(earliest.getDate() + (selectedProperty?.minNights || 1));
        checkOut.min = earliest.toISOString().split('T')[0];
        if (checkOut.value && checkOut.value < checkOut.min) checkOut.value = '';
        updatePrice();
        syncUrlDates();
        renderCalendar();
    });

    checkOut.addEventListener('change', () => { updatePrice(); syncUrlDates(); renderCalendar(); });
    document.getElementById('guests').addEventListener('input', updatePrice);
    document.getElementById('submit-btn').addEventListener('click', submitBookingRequest);
    document.getElementById('apply-promo').addEventListener('click', applyPromoCode);

    // Agreement toggle expand/collapse
    document.getElementById('agreement-toggle').addEventListener('click', () => {
        const body = document.getElementById('agreement-body');
        const arrow = document.getElementById('agreement-arrow');
        const open = body.style.display === 'block';
        body.style.display = open ? 'none' : 'block';
        arrow.textContent = open ? '▼' : '▲';
    });

    // Checkbox enables/disables submit
    document.getElementById('agree-checkbox').addEventListener('change', (e) => {
        document.getElementById('submit-btn').disabled = !e.target.checked;
    });
    document.getElementById('promo-code').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); }
    });

    // Pool heat radios
    document.querySelectorAll('input[name="pool-heat"]').forEach(radio => {
        radio.addEventListener('change', () => {
            poolHeatSelected = document.getElementById('pool-heat-yes').checked;
            const nightsRow = document.getElementById('pool-heat-nights-row');
            nightsRow.style.display = poolHeatSelected ? 'block' : 'none';
            if (poolHeatSelected) syncPoolHeatNightsMax();
            updatePrice();
        });
    });

    document.getElementById('pool-heat-nights').addEventListener('input', () => {
        validatePoolHeatNights();
        updatePrice();
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
            priceContent.innerHTML = `<div class="empty-state" style="color:var(--accent-link);"><p>${data.error || 'Could not calculate price.'}</p></div>`;
            return;
        }

        priceEstimate = data.pricing;
        renderPriceSummary();
        document.getElementById('agreement-section').style.display = 'block';
        // Submit stays disabled until checkbox is checked
        const agreed = document.getElementById('agree-checkbox')?.checked;
        submitBtn.disabled = !agreed;

    } catch (err) {
        console.error('Pricing fetch failed:', err);
        priceContent.innerHTML = '<div class="empty-state" style="color:#f44336;"><p>Could not load pricing. Please try again.</p></div>';
    }
}

function getAttribution() {
    try {
        const raw = localStorage.getItem('ip_attribution');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
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

    const agreeCheckbox = document.getElementById('agree-checkbox');
    if (agreeCheckbox && !agreeCheckbox.checked) {
        showMessage('Please read and agree to the rental agreement before submitting.', 'error');
        return;
    }

    if (!priceEstimate) {
        showMessage('Please select valid dates before submitting.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const pricingPayload = appliedDiscount
            ? { ...priceEstimate, total: Math.max(0, priceEstimate.total - appliedDiscount.discountAmount) }
            : priceEstimate;

        const poolHeatNights = poolHeatSelected ? getPoolHeatNights() : 0;
        const poolHeatCost = (poolHeatSelected && poolHeatNights >= 2) ? calcPoolHeatCost(poolHeatNights) : 0;

        if (poolHeatSelected && !validatePoolHeatNights()) {
            showMessage('Pool heating requires a minimum of 2 nights.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Request to Book';
            return;
        }

        const res = await fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                property: selectedProperty.name,
                propertyId: selectedProperty.id,
                checkIn,
                checkOut,
                guests,
                name,
                email,
                phone,
                specialRequests,
                pricing: pricingPayload,
                discountCode: appliedDiscount?.code || null,
                poolHeat: poolHeatSelected,
                poolHeatNights: poolHeatSelected ? poolHeatNights : 0,
                poolHeatCost,
                attribution: getAttribution(),
            }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Submission failed');

        submitBtn.textContent = 'Request Sent!';
        showMessage(
            `Got it. We'll review your request for ${selectedProperty.name} and send a payment link within 24 hours. The desert's not going anywhere.`,
            'success',
            [
                { linkText: 'While you wait: how to prep for your desert stay \u2192', linkHref: '/blog/desert-vacation-prep/' },
                { linkText: 'Follow us on Instagram @indigopalmco \u2192', linkHref: 'https://www.instagram.com/indigopalmco/', external: true },
            ]
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

    const nights = priceEstimate.nights;
    const accomTotal = priceEstimate.total;
    const poolHeatNights = poolHeatSelected ? getPoolHeatNights() : 0;
    const poolHeatCost = (poolHeatSelected && poolHeatNights >= 2) ? calcPoolHeatCost(poolHeatNights) : 0;
    const discountAmount = appliedDiscount ? Number(appliedDiscount.discountAmount) : 0;
    const finalTotal = Math.max(0, accomTotal + poolHeatCost - discountAmount);
    const allInNightly = (accomTotal / nights).toFixed(2);

    // Update pool heat price label
    if (selectedProperty?.id === 'casa-moto') {
        const label = document.getElementById('pool-heat-price');
        if (label) {
            if (!poolHeatSelected) {
                label.textContent = '';
            } else if (poolHeatNights >= 7) {
                label.textContent = '$400 flat';
            } else if (poolHeatNights >= 2) {
                label.textContent = `$${calcPoolHeatCost(poolHeatNights)}`;
            } else {
                label.textContent = 'Minimum 2 nights';
            }
        }
        // Sync max when dates change
        if (poolHeatSelected) syncPoolHeatNightsMax();
    }

    const poolHeatLabel = poolHeatNights >= 7
        ? `Pool heating (7+ nights flat rate)`
        : `Pool heating (${poolHeatNights} &times; $75)`;
    const poolHeatRow = poolHeatSelected && poolHeatCost > 0 ? `
        <div class="price-row">
            <span>${poolHeatLabel}</span>
            <span>$${poolHeatCost.toFixed(2)}</span>
        </div>` : '';

    const discountRow = appliedDiscount ? `
        <div class="price-row" style="color:var(--accent-sage);">
            <span>Discount (${appliedDiscount.code})</span>
            <span>-$${discountAmount.toFixed(2)}</span>
        </div>` : '';

    const checkIn  = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const airbnbLink = selectedProperty?.airbnbListingId && checkIn && checkOut
        ? `<a href="https://www.airbnb.com/rooms/${selectedProperty.airbnbListingId}?check_in=${checkIn}&check_out=${checkOut}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.82rem;color:#888;text-decoration:none;margin-top:0.6rem;">
               Compare on Airbnb
               <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
           </a>`
        : '';

    priceContent.innerHTML = `
        <div class="price-breakdown">
            <div class="price-row">
                <span>${nights} night${nights !== 1 ? 's' : ''} &times; $${allInNightly}/night</span>
                <span>$${accomTotal.toFixed(2)}</span>
            </div>
            ${poolHeatRow}
            ${discountRow}
            <div class="price-row">
                <strong>Total</strong>
                <strong>$${finalTotal.toFixed(2)}</strong>
            </div>
            ${airbnbLink}
        </div>
        <div style="margin-top:1rem;padding:0.85rem 1rem;background:#F5F3EE;border-radius:8px;font-size:0.82rem;line-height:1.6;color:#555;">
            <strong style="color:#2C2C2C;">Zelle (no fee):</strong> 214-606-1340 (MPT Industries)<br>
            <strong style="color:#2C2C2C;">Credit card:</strong> Square link sent after approval (3% fee)
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
            msg.style.color = 'var(--accent-sage-dark)';
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

function showMessage(text, type, links = null) {
    const existing = document.getElementById('form-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
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
    const p = document.createElement('p');
    p.style.margin = '0';
    p.textContent = text;
    msg.appendChild(p);
    if (links) {
        (Array.isArray(links) ? links : [links]).forEach(link => {
            const a = document.createElement('a');
            a.href = link.linkHref;
            a.textContent = link.linkText;
            if (link.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            a.style.cssText = 'display:block;margin-top:0.5rem;font-size:0.85rem;color:inherit;text-decoration:underline;opacity:0.85;';
            msg.appendChild(a);
        });
    }
    document.getElementById('submit-btn').insertAdjacentElement('afterend', msg);
}
