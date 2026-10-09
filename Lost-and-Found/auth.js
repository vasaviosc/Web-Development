const USERS_KEY = "lf_users";
const CURRENT_KEY = "lf_currentUser";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_KEY) || "null");
  } catch (e) {
    return null;
  }
}

function requireAuth() {
  if (!currentUser()) {
    location.href = "login.html";
    return false;
  }
  return true;
}

function showError(id, msg) {
  const e = document.getElementById(id);
  if (e) {
    e.textContent = msg;
    e.classList.add("show");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const lf = location.pathname.split("/").pop().split("?")[0];
  if (["dashboard.html", "report.html", "my-reports.html"].includes(lf)) {
    requireAuth();
  }

  // If already logged in and navigating to login/register, go to dashboard
  if (["login.html", "register.html"].includes(lf) && currentUser()) {
    location.href = "dashboard.html";
    return;
  }

  const login = document.getElementById("loginForm");
  if (login) {
    login.addEventListener("submit", (e) => {
      e.preventDefault();
      const errEl = document.getElementById("loginError");
      if (errEl) { errEl.textContent = ""; errEl.classList.remove("show"); }
      const emailEl = document.getElementById("loginEmail");
      const passEl = document.getElementById("loginPassword");
      if (!emailEl || !passEl) return;
      const email = emailEl.value.trim().toLowerCase();
      const pass = passEl.value;
      const u = getUsers().find((x) => x.email.toLowerCase() === email && x.password === pass);
      if (!u) return showError("loginError", "Email or password is incorrect.");
      localStorage.setItem(CURRENT_KEY, JSON.stringify(u));
      location.href = "dashboard.html";
    });
  }

  const reg = document.getElementById("registerForm");
  if (reg) {
    reg.addEventListener("submit", (e) => {
      e.preventDefault();
      const errEl = document.getElementById("registerError");
      if (errEl) { errEl.textContent = ""; errEl.classList.remove("show"); }
      const phoneEl = document.getElementById("registerPhone");
      const nameEl = document.getElementById("registerName");
      const emailEl = document.getElementById("registerEmail");
      const passEl = document.getElementById("registerPassword");
      const phone = phoneEl.value.trim();
      if (!/^[0-9]{10}$/.test(phone)) {
          return showError("registerError", "Phone number must contain exactly 10 digits.");
      }
      if (!nameEl || !emailEl || !passEl || !phone) return;
      const name = nameEl.value.trim();
      const email = emailEl.value.trim().toLowerCase();
      const password = passEl.value;
      if (!name || !email || !password) {
        return showError("registerError", "Please fill in all required fields.");
      }
      if (password.length < 6) {
        return showError("registerError", "Password must be at least 6 characters.");
      }
      if (getUsers().some((x) => x.email.toLowerCase() === email)) {
        return showError("registerError", "An account with this email already exists.");
      }
      const u = {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : ("u_" + Date.now() + "_" + Math.random().toString(36).slice(2)),
        name,
        email,
        phone,
        password,
      };
      const users = getUsers();
      users.push(u);
      saveUsers(users);
      localStorage.setItem(CURRENT_KEY, JSON.stringify(u));
      location.href = "dashboard.html";
    });
  }
});