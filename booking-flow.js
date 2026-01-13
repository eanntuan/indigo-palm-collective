import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { PROPERTIES } from './booking-config.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDEcB5KW_t3ysKKf7RtJfPJdGnH9vZ_234",
    authDomain: "the-desert-edit.firebaseapp.com",
    projectId: "the-desert-edit",
    storageBucket: "the-desert-edit.firebasestorage.app",
    messagingSenderId: "101326981347",
    appId: "1:101326981347:web:8f0df8b1cf0c3e4e8c7b89"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State
let selectedProperty = null;
let priceEstimate = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderPropertySelector();
    setupEventListeners();
    setMinDates();
});

// Render property selection cards
function renderPropertySelector() {
    const selector = document.getElementById('property-selector');

    Object.values(PROPERTIES).forEach(property => {
        const card = document.createElement('div');
        card.className = 'property-option';
        card.dataset.propertyId = property.id;
        card.innerHTML = `
            <h3>${property.name}</h3>
            <p>${property.location}</p>
            <p style="font-size: 0.8rem; margin-top: 0.5rem;">${property.bedrooms} bed • ${property.maxGuests} guests</p>
            <p style="font-weight: 600; color: var(--sage); margin-top: 0.5rem;">$${property.basePrice}/night</p>
        `;

        card.addEventListener('click', () => selectProperty(property.id));
        selector.appendChild(card);
    });
}

// Select property
function selectProperty(propertyId) {
    // Remove previous selection
    document.querySelectorAll('.property-option').forEach(el => {
        el.classList.remove('selected');
    });

    // Select new property
    const card = document.querySelector(`[data-property-id="${propertyId}"]`);
    card.classList.add('selected');

    selectedProperty = PROPERTIES[propertyId];

    // Update max guests
    const guestsInput = document.getElementById('guests');
    guestsInput.max = selectedProperty.maxGuests;
    if (parseInt(guestsInput.value) > selectedProperty.maxGuests) {
        guestsInput.value = selectedProperty.maxGuests;
    }

    // Show availability calendar
    document.getElementById('availability-calendar').style.display = 'block';

    // Recalculate price
    updatePrice();
}

// Set minimum dates (today for check-in, tomorrow for check-out)
function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('check-in').min = today;
    document.getElementById('check-out').min = today;
}

// Setup event listeners
function setupEventListeners() {
    const checkIn = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');
    const guests = document.getElementById('guests');
    const submitBtn = document.getElementById('submit-btn');

    // Update price when inputs change
    checkIn.addEventListener('change', () => {
        // Set check-out min to day after check-in
        const checkInDate = new Date(checkIn.value);
        checkInDate.setDate(checkInDate.getDate() + 1);
        checkOut.min = checkInDate.toISOString().split('T')[0];
        updatePrice();
    });

    checkOut.addEventListener('change', updatePrice);
    guests.addEventListener('input', updatePrice);

    // Submit form
    submitBtn.addEventListener('click', submitBookingInquiry);
}

// Update price display
async function updatePrice() {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const guests = parseInt(document.getElementById('guests').value);

    // Check if all required fields are filled
    if (!selectedProperty || !checkIn || !checkOut || !guests) {
        document.getElementById('price-content').innerHTML = `
            <div class="empty-state">
                <p>Select property and dates to see pricing</p>
            </div>
        `;
        document.getElementById('submit-btn').disabled = true;
        return;
    }

    // Show loading state
    document.getElementById('price-content').innerHTML = `
        <div class="empty-state">
            <p>Loading pricing...</p>
        </div>
    `;
    document.getElementById('submit-btn').disabled = true;

    try {
        // Fetch dynamic pricing from Cloud Function
        const response = await fetch('/get-pricing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                propertyId: selectedProperty.id,
                checkIn,
                checkOut,
                guests
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch pricing');
        }

        priceEstimate = data.pricing;

        // Check if dates are available
        if (!priceEstimate.isAvailable) {
            document.getElementById('price-content').innerHTML = `
                <div class="empty-state" style="color: #f44336;">
                    <p><strong>❌ Selected dates are not available</strong></p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                        Unavailable dates: ${priceEstimate.unavailableDates.join(', ')}
                    </p>
                </div>
            `;
            document.getElementById('submit-btn').disabled = true;
            return;
        }

        // Display price breakdown with nightly rates
        let nightlyBreakdown = '';
        if (priceEstimate.nightly && priceEstimate.nightly.length > 0) {
            const avgNightly = (priceEstimate.subtotal / priceEstimate.nights).toFixed(2);
            nightlyBreakdown = `$${avgNightly} avg × ${priceEstimate.nights} night${priceEstimate.nights > 1 ? 's' : ''}`;
        } else {
            nightlyBreakdown = `${priceEstimate.nights} night${priceEstimate.nights > 1 ? 's' : ''}`;
        }

        document.getElementById('price-content').innerHTML = `
            <div class="price-breakdown">
                <div class="price-row">
                    <span>${nightlyBreakdown}</span>
                    <span>$${priceEstimate.subtotal.toFixed(2)}</span>
                </div>
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
            </div>
        `;

        // Enable submit button
        document.getElementById('submit-btn').disabled = false;

    } catch (error) {
        console.error('Error fetching pricing:', error);
        document.getElementById('price-content').innerHTML = `
            <div class="empty-state" style="color: #f44336;">
                <p>Error loading pricing</p>
                <p style="font-size: 0.85rem;">${error.message}</p>
            </div>
        `;
        document.getElementById('submit-btn').disabled = true;
    }
}

// Submit booking inquiry
async function submitBookingInquiry() {
    const submitBtn = document.getElementById('submit-btn');

    // Validate form
    const name = document.getElementById('guest-name').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();

    if (!name || !email || !phone || !selectedProperty || !priceEstimate) {
        alert('Please fill in all required fields');
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Create booking inquiry
        const inquiry = {
            propertyId: selectedProperty.id,
            propertyName: selectedProperty.name,
            checkIn: Timestamp.fromDate(new Date(document.getElementById('check-in').value)),
            checkOut: Timestamp.fromDate(new Date(document.getElementById('check-out').value)),
            guests: parseInt(document.getElementById('guests').value),
            guestName: name,
            guestEmail: email,
            guestPhone: phone,
            specialRequests: document.getElementById('special-requests').value.trim(),
            priceEstimate: {
                nights: priceEstimate.nights,
                subtotal: priceEstimate.subtotal,
                cleaningFee: priceEstimate.cleaningFee,
                taxAmount: priceEstimate.taxAmount,
                total: priceEstimate.total
            },
            status: 'pending', // pending, approved, paid, cancelled
            createdAt: Timestamp.now()
        };

        // Save to Firestore
        await addDoc(collection(db, 'bookingInquiries'), inquiry);

        // Success!
        alert(`🎉 Booking request submitted!\n\nWe'll review your request for ${selectedProperty.name} and send you a payment link within 24 hours.\n\nCheck your email (${email}) for confirmation.`);

        // Reset form
        window.location.reload();

    } catch (error) {
        console.error('Error submitting inquiry:', error);
        alert('Sorry, there was an error submitting your request. Please try again or email us directly at thecozycactusindio@gmail.com');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request to Book';
    }
}
