const faqItems = document.querySelectorAll('.faq-item');
const form = document.getElementById('register-form');
const navToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

faqItems.forEach((item) => {
  const trigger = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  trigger.addEventListener('click', () => {
    const shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';

    faqItems.forEach((faqItem) => {
      const faqButton = faqItem.querySelector('.faq-question');
      const faqAnswer = faqItem.querySelector('.faq-answer');

      faqItem.classList.remove('active');
      faqButton.setAttribute('aria-expanded', 'false');
      faqAnswer.hidden = true;
    });

    if (shouldOpen) {
      item.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
    }
  });
});

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('registration-message');

    message.textContent = `Thanks, ${name}! Your registration details have been received.`;
    form.reset();
  });
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';

    navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
  });
}