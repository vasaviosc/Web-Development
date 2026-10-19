
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const faqButtons = document.querySelectorAll(".faq-question");
  const form = document.getElementById("register-form");
  const formMessage = document.getElementById("form-message");
  const currentYear = document.getElementById("current-year");

  // Keep the footer year current.
  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }

  // Accessible mobile navigation.
  if (navToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", () => {
      const isExpanded =
        navToggle.getAttribute("aria-expanded") === "true";

      navToggle.setAttribute("aria-expanded", String(!isExpanded));
      navLinks.classList.toggle("is-open", !isExpanded);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        navToggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        window.innerWidth <= 720 &&
        navLinks.classList.contains("is-open") &&
        !navLinks.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) {
        closeMenu();
      }
    });
  }

  // Accessible single-open FAQ accordion.
  faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const answerId = button.getAttribute("aria-controls");
      const answer = document.getElementById(answerId);

      if (!answer) return;

      const shouldOpen =
        button.getAttribute("aria-expanded") !== "true";

      faqButtons.forEach((otherButton) => {
        const otherAnswer = document.getElementById(
          otherButton.getAttribute("aria-controls")
        );

        otherButton.setAttribute("aria-expanded", "false");

        const icon = otherButton.querySelector(".faq-plus");
        if (icon) icon.textContent = "+";

        if (otherAnswer) otherAnswer.hidden = true;
      });

      if (shouldOpen) {
        button.setAttribute("aria-expanded", "true");
        answer.hidden = false;

        const icon = button.querySelector(".faq-plus");
        if (icon) icon.textContent = "−";
      }
    });
  });

  // Validate registration details without pretending to submit them.
  if (form && formMessage) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      formMessage.textContent = "";
      formMessage.className = "form-message";

      if (!form.checkValidity()) {
        form.reportValidity();

        formMessage.textContent =
          "Please check the required fields and enter a valid email address.";
        formMessage.classList.add("error");
        return;
      }

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();

      if (name.length < 2 || !email) {
        formMessage.textContent =
          "Please enter your full name and a valid email address.";
        formMessage.classList.add("error");
        return;
      }

      formMessage.textContent =
        "Your details passed validation. This demo does not submit or save registrations yet.";
      formMessage.classList.add("success");
    });
  }
});
