function openFileDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB not supported"));
    const request = indexedDB.open("lf_file_store", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("files")) {
        request.result.createObjectStore("files");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFile(id) {
  if (!id) return null;
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readonly");
      const req = tx.objectStore("files").get(id);
      req.onsuccess = () => {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch (e) {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const u = JSON.parse(localStorage.getItem("lf_currentUser") || "null");

  if (u) {
    const navLogin = document.querySelector(".nav-login");
    if (navLogin) {
      navLogin.textContent = "Dashboard";
      navLogin.href = "dashboard.html";
    }
    const getStarted = document.querySelector('a.btn.btn-primary.btn-sm[href="register.html"]');
    if (getStarted) {
      getStarted.textContent = "My reports";
      getStarted.href = "my-reports.html";
    }
  }

  document.querySelectorAll('a[href="report.html"], a[href^="report.html?"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      if (!u) {
        e.preventDefault();
        location.href = "login.html";
      }
    });
  });

  // Dynamically render real recent activity on landing page with uploaded photos
  const heroList = document.getElementById("heroActivityList");
  if (heroList) {
    let items = [];
    try {
      const raw = localStorage.getItem("lf_items");
      if (raw) {
        items = JSON.parse(raw);
        if (!Array.isArray(items)) items = [];
        items = items.filter((i) => i && !String(i.id).startsWith("item_seed_"));
      }
    } catch (e) {
      items = [];
    }

    const esc = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          }[m])
      );

    const activeLostItems = items.filter(
      (i) => i.type === "lost" && i.status !== "claimed" && i.status !== "recovered" && i.status !== "closed"
    );

    if (activeLostItems.length > 0) {
      const recent = activeLostItems.slice(0, 3);
      const rendered = await Promise.all(
        recent.map(async (i) => {
          let photoContent = "◎";
          if (i.fileId) {
            const file = await getFile(i.fileId);
            if (file && file.blob && (file.type || "").startsWith("image/")) {
              const url = URL.createObjectURL(file.blob);
              photoContent = `<img src="${url}" alt="${esc(i.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
            } else if (file) {
              photoContent = "📎";
            }
          } else if (i.image) {
            photoContent = `<img src="${i.image}" alt="${esc(i.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
          }

          return `<a href="item-details.html?id=${encodeURIComponent(i.id)}" class="mini-item" style="text-decoration:none; color:inherit;"><div class="mini-photo">${photoContent}</div><div><strong>${esc(i.name)}</strong><small>Lost · ${esc(i.place || "Unknown location")}</small></div><span class="pill lost">LOST</span></a>`;
        })
      );
      heroList.innerHTML = rendered.join("");
    } else {
      heroList.innerHTML = `<div class="mini-item"><div class="mini-photo">✓</div><div><strong>No active lost reports</strong><small>All reported lost items are currently resolved</small></div></div>`;
    }
  }
});