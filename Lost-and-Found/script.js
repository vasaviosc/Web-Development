
document.addEventListener("DOMContentLoaded", () => {
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("lf_currentUser") || "null");
    } catch {
      return null;
    }
  };

  const user = getUser();

  // Redirect unauthenticated users away from report creation.
  document
    .querySelectorAll('a[href="report.html"], a[href^="report.html"]')
    .forEach(link => {
      link.addEventListener("click", event => {
        if (!user) {
          event.preventDefault();
          location.href = "login.html";
        }
      });
    });

  // Handle logout.
  const logoutButton = document.getElementById("logoutBtn");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("lf_currentUser");
      location.href = "index.html";
    });
  }
});
