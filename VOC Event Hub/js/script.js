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
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const roleInput = document.getElementById('role');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const formMessage = document.getElementById('form-message');

  const storageKey = 'vocEventRegistrations';

  function clearError(input, errorElement) {
    errorElement.textContent = '';
    errorElement.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  function showError(input, errorElement, message) {
    errorElement.textContent = message;
    errorElement.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }

  function showMessage(message, success) {
    formMessage.textContent = message;
    formMessage.className = success
      ? 'form-message success'
      : 'form-message error';
    formMessage.hidden = false;
  }

  // Hide validation messages when the page first loads.
  clearError(nameInput, nameError);
  clearError(emailInput, emailError);
  formMessage.hidden = true;

  nameInput.addEventListener('input', () => {
    clearError(nameInput, nameError);
    formMessage.hidden = true;
  });

  emailInput.addEventListener('input', () => {
    clearError(emailInput, emailError);
    formMessage.hidden = true;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    clearError(nameInput, nameError);
    clearError(emailInput, emailError);
    formMessage.hidden = true;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const role = roleInput.value;

    let valid = true;
    // Require text before and after @, plus a dot and domain suffix.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      showError(nameInput, nameError, 'Please enter your full name.');
      valid = false;
    }

    if (!email) {
      showError(
        emailInput,
        emailError,
        'Please enter your email address.'
      );
      valid = false;
    } else if (!emailPattern.test(email)) {
      showError(
        emailInput,
        emailError,
        'Invalid email format. Please enter a valid email address.'
      );
      valid = false;
    }

    if (!valid) {
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      const registrations = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(registrations)) {
        throw new Error('Invalid registration data');
      }

      const duplicate = registrations.some(
        (registration) =>
          typeof registration.email === 'string' &&
          registration.email.toLowerCase() === email
      );

      if (duplicate) {
        showError(
          emailInput,
          emailError,
          'This email is already registered.'
        );
        showMessage('Please use a different email address.', false);
        return;
      }

      registrations.push({
        name,
        email,
        role,
        registeredAt: new Date().toISOString()
      });

      localStorage.setItem(
        storageKey,
        JSON.stringify(registrations)
      );

      showMessage(
        'Registration successful! Your details are saved in this browser.',
        true
      );

      form.reset();
    } catch (error) {
      showMessage(
        'Unable to save your registration. Please try again.',
        false
      );
    }
  });
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
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

const latestStats = document.querySelector('.faq-item .faq-answer');
if (latestStats) {
  latestStats.textContent = 'Seats are filling quickly for this year\'s workshop.';
}

// Interactive event schedule
const scheduleButtons = document.querySelectorAll('.schedule-toggle');

scheduleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const details = button.nextElementSibling;
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    button.setAttribute('aria-expanded', String(!isExpanded));
    details.hidden = isExpanded;
  });
});

// Click a schedule time to show or hide event details
const scheduleTimes = document.querySelectorAll('.schedule-time');

scheduleTimes.forEach((button) => {
  button.addEventListener('click', () => {
    const details = button.nextElementSibling;
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    button.setAttribute('aria-expanded', String(!isExpanded));
    details.hidden = isExpanded;
  });
});
