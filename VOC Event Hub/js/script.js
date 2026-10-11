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
  const status = document.createElement("p");
  status.id = "registration-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  form.appendChild(status);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const role = document.getElementById("role").value || null;
    const button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = "Registering...";

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/event_registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            full_name: name,
            email: email,
            role: role
          })
        }
      );

      if (response.ok) {
        status.textContent = "Registration successful!";
        status.style.color = "green";
        form.reset();
        return;
      }

      let error = {};
      try {
        error = await response.json();
      } catch {
        // The server did not return a JSON error.
      }

      if (error.code === "23505") {
        status.textContent = "This email is already registered.";
      } else {
        console.error("Registration failed:", error);
        status.textContent =
          "Registration failed. Please try again later.";
      }

      status.style.color = "red";
    } catch (error) {
      console.error("Registration request failed:", error);
      status.textContent =
        "Unable to connect. Check your internet and try again.";
      status.style.color = "red";
    } finally {
      button.disabled = false;
      button.textContent = "Register now";
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
