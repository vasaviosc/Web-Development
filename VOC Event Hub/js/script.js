const faqItems = document.querySelectorAll('.faq-item');
const form = document.getElementById('register-form');
const navToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

faqItems.forEach((item) => {
  const trigger = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('active');

    faqItems.forEach((faqItem) => {
      faqItem.classList.remove('active');
      faqItem.querySelector('.faq-answer').hidden = true;
    });

    if (!isOpen) {
      item.classList.add('active');
      answer.hidden = false;
    }
  });
});

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const roleInput = document.getElementById('role');
    const confirmationBox = document.getElementById('registration-confirmation');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const role = roleInput ? roleInput.value : '';

    // Check that name is provided
    if (!name) {
      alert('Please enter your full name.');
      nameInput.focus();
      return;
    }

    // Check that email is provided
    if (!email) {
      alert('Please enter your work email.');
      emailInput.focus();
      return;
    }

    // Email validation: checks format like name@domain.com
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address (e.g. name@company.com).');
      emailInput.focus();
      return;
    }

    // Check that phone number is provided
    if (!phone) {
      alert('Please enter your phone number.');
      if (phoneInput) phoneInput.focus();
      return;
    }

    // Indian mobile number validation:
    // 10 digits starting with 6, 7, 8, or 9; optionally preceded by +91 (with optional hyphen or space)
    const phoneRegex = /^(?:\+91[\-\s]?)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      alert('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210 or +91 9876543210).');
      if (phoneInput) phoneInput.focus();
      return;
    }

    // Generate a simple registration ID
    const regId = 'VOSC-' + Math.floor(1000 + Math.random() * 9000);

    // Save registration to localStorage including phone number
    const newRegistration = {
      id: regId,
      name: name,
      email: email,
      phone: phone,
      role: role || 'Attendee',
      registeredAt: new Date().toISOString()
    };

    const savedRegistrations = JSON.parse(localStorage.getItem('vosc_registrations') || '[]');
    savedRegistrations.push(newRegistration);
    localStorage.setItem('vosc_registrations', JSON.stringify(savedRegistrations));

    // Display confirmation message to the user with masked phone number
    if (confirmationBox) {
      // Helper to prevent HTML injection in displayed name
      const safeName = name.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

      // Mask phone number for privacy (e.g. ******1234)
      const digitsOnly = phone.replace(/\D/g, '');
      const maskedPhone = '******' + digitsOnly.slice(-4);

      confirmationBox.hidden = false;
      confirmationBox.innerHTML = `
        <h3>Registration Confirmed! 🎉</h3>
        <p>Thank you, <strong>${safeName}</strong>! Your seat has been reserved.</p>
        <div>Registration ID: <span class="reg-id-badge">${regId}</span></div>
        <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Mobile: <strong>${maskedPhone}</strong></p>
        <p style="margin: 0.5rem 0 0; font-size: 0.85rem;">Your registration has been saved. We look forward to seeing you at the workshop!</p>
      `;
      confirmationBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.reset();
  });
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
  });

  // Automatically close mobile menu when a navigation link is clicked
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 720) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

const registerButton = document.querySelector('.primary-btn');
if (registerButton) {
  registerButton.addEventListener('click', () => {
    const activeButton = document.querySelector('.primary-btn.active');
    if (activeButton) {
      activeButton.classList.remove('active');
    }
    registerButton.classList.add('active');
  });
}

// Event Countdown Timer
function initCountdown() {
  // Workshop date: November 15, 2026 at 09:00 AM
  const eventDate = new Date('2026-11-15T09:00:00').getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

initCountdown();
