// VOSC Event Hub - Interactive Engine & Registration System

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initFaqAccordion();
  initScheduleFilters();
  initCountdownTimer();
  initRegistrationForm();
  initScrollSpy();
});

// ----------------------------------------------------
// Toast Notifications
// ----------------------------------------------------
function showVocToast(message) {
  const toast = document.getElementById("vocToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// ----------------------------------------------------
// Mobile Navigation
// ----------------------------------------------------
function initMobileNav() {
  const navToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("nav-links");
  const navBackdrop = document.getElementById("navBackdrop");

  if (!navToggle || !navLinks) return;

  const toggleMenu = (open) => {
    const isCurrentlyOpen = navLinks.classList.contains("is-open");
    const shouldOpen = open !== undefined ? open : !isCurrentlyOpen;

    navLinks.classList.toggle("is-open", shouldOpen);
    navToggle.setAttribute("aria-expanded", String(shouldOpen));
    if (navBackdrop) {
      navBackdrop.classList.toggle("is-open", shouldOpen);
    }
  };

  navToggle.addEventListener("click", () => toggleMenu());

  if (navBackdrop) {
    navBackdrop.addEventListener("click", () => toggleMenu(false));
  }

  // Auto-close drawer when clicking on any navigation link
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });
}

// ----------------------------------------------------
// FAQ Accordion (Accessible & Animated)
// ----------------------------------------------------
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const button = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!button || !answer) return;

    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      // Close all other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
          const otherBtn = otherItem.querySelector(".faq-question");
          const otherAns = otherItem.querySelector(".faq-answer");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          if (otherAns) otherAns.hidden = true;
        }
      });

      // Toggle current item
      if (isExpanded) {
        item.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
        answer.hidden = true;
      } else {
        item.classList.add("active");
        button.setAttribute("aria-expanded", "true");
        answer.hidden = false;
      }
    });
  });
}

// ----------------------------------------------------
// Schedule Track Filtering
// ----------------------------------------------------
function initScheduleFilters() {
  const filterTabs = document.querySelectorAll(".filter-tab");
  const scheduleCards = document.querySelectorAll(".schedule-card");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const track = tab.dataset.track;

      scheduleCards.forEach((card) => {
        if (track === "all" || card.dataset.track === track) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// ----------------------------------------------------
// Live Countdown Timer
// ----------------------------------------------------
function initCountdownTimer() {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minsEl = document.getElementById("minutes");
  const secsEl = document.getElementById("seconds");

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  // Event Date: November 14, 2026, 09:00:00 PST
  const targetDate = new Date("2026-11-14T09:00:00-08:00").getTime();

  function update() {
    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(d).padStart(2, "0");
    hoursEl.textContent = String(h).padStart(2, "0");
    minsEl.textContent = String(m).padStart(2, "0");
    secsEl.textContent = String(s).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

// ----------------------------------------------------
// Registration System & Ticket Generation
// ----------------------------------------------------
function initRegistrationForm() {
  const form = document.getElementById("register-form");
  const ticketConfirmation = document.getElementById("ticketConfirmation");
  const errorBox = document.getElementById("registerError");
  const printBtn = document.getElementById("printTicketBtn");
  const newRegBtn = document.getElementById("newRegBtn");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (errorBox) {
      errorBox.textContent = "";
      errorBox.classList.remove("show");
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const roleSelect = document.getElementById("role");
    const role = roleSelect ? roleSelect.value : "";
    const roleText = roleSelect && roleSelect.selectedIndex >= 0 ? roleSelect.options[roleSelect.selectedIndex].text : role;
    const attendanceSelect = document.getElementById("attendance");
    const attendance = attendanceSelect ? attendanceSelect.value : "in-person";
    const goal = document.getElementById("goal") ? document.getElementById("goal").value.trim() : "";

    if (!name) {
      showError("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError("Please enter a valid work or school email address.");
      return;
    }

    if (!role) {
      showError("Please select your primary role.");
      return;
    }

    // Generate unique pass ID
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const passId = `#VOSC-2026-${randomHex}`;

    const regData = {
      id: passId,
      name,
      email,
      role: roleText,
      attendance: attendance === "in-person" ? "In-Person (San Francisco)" : "Virtual Livestream",
      goal,
      timestamp: Date.now()
    };

    // Save in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("voc_registrations") || "[]");
      stored.push(regData);
      localStorage.setItem("voc_registrations", JSON.stringify(stored));
    } catch (err) {
      console.warn("Local storage write error:", err);
    }

    // Populate and show ticket
    document.getElementById("ticketIdDisplay").textContent = passId;
    document.getElementById("ticketNameDisplay").textContent = name;
    document.getElementById("ticketEmailDisplay").textContent = email;
    document.getElementById("ticketRoleDisplay").textContent = roleText;
    document.getElementById("ticketModeDisplay").textContent = attendance === "in-person" ? "In-Person" : "Virtual";

    form.hidden = true;
    if (ticketConfirmation) ticketConfirmation.hidden = false;

    showVocToast(`Registration confirmed! Welcome aboard, ${name.split(" ")[0]}.`);
  });

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.add("show");
    }
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if (newRegBtn) {
    newRegBtn.addEventListener("click", () => {
      form.reset();
      form.hidden = false;
      if (ticketConfirmation) ticketConfirmation.hidden = true;
    });
  }
}

// ----------------------------------------------------
// ScrollSpy for Navigation Highlighting
// ----------------------------------------------------
function initScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a.nav-link");

  if (!sections.length || !navLinks.length) return;

  const onScroll = () => {
    const scrollPos = window.scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute("id");

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}
