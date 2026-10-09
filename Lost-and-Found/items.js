const ITEMS_KEY = "lf_items";
const FILE_DB = "lf_file_store";
const FILE_STORE = "files";
const CLAIMS_KEY = "lf_claims";
const MESSAGES_KEY = "lf_messages";
const NOTIFICATIONS_KEY = "lf_notifications";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
let objectUrls = [];

/* ==========================================================================
   SMART CATEGORY INFERENCE & NORMALIZATION ENGINE
   ========================================================================== */

function inferCategory(name = "", desc = "") {
  const text = (name + " " + desc).toLowerCase();
  if (/\b(phone|iphone|samsung|pixel|mobile|laptop|macbook|dell|hp|airpods|earbuds|headphones|charger|powerbank|ipad|tablet|kindle|smartwatch|watch|camera|mouse|keyboard|usb|drive|pendrive|calculator|airtag|gadget)\b/.test(text)) {
    return "Electronics";
  }
  if (/\b(id|student id|identity|passport|license|driving license|aadhar|pan|certificate|book|textbook|notebook|folder|binder|diary|paper|file|documents?)\b/.test(text)) {
    return "Documents & IDs";
  }
  if (/\b(wallet|purse|cardholder|debit card|credit card|metro card|money|cash|billfold|currency|coin|pouch)\b/.test(text)) {
    return "Wallets & Cards";
  }
  if (/\b(key|keys|keychain|car key|fob|bike key|room key|dorm key)\b/.test(text)) {
    return "Keys";
  }
  if (/\b(bag|backpack|rucksack|tote|handbag|briefcase|suitcase|duffel|duffle|gym bag|luggage|pouch)\b/.test(text)) {
    return "Bags & Backpacks";
  }
  if (/\b(ring|necklace|bracelet|earring|chain|gold|silver|diamond|glasses|sunglasses|spectacles|frames|jewel|pendant)\b/.test(text)) {
    return "Jewelry & Accessories";
  }
  if (/\b(jacket|coat|hoodie|sweater|shirt|t-shirt|pants|jeans|shoes|sneakers|boots|cap|hat|beanie|gloves|scarf|umbrella|belt|water bottle|bottle|flask)\b/.test(text)) {
    return "Clothing";
  }
  if (/\b(dog|cat|puppy|kitten|bird|parrot|rabbit|pet)\b/.test(text)) {
    return "Pets";
  }
  return "Other";
}

function normalizeCategory(raw) {
  if (!raw) return "Other";
  const s = String(raw).toLowerCase().trim();
  if (s.includes("electr") || s.includes("phone") || s.includes("laptop") || s.includes("headphone") || s.includes("charger") || s.includes("airpod")) return "Electronics";
  if (s.includes("doc") || s.includes("student id") || s.includes("identity") || s.includes("passport") || s.includes("license") || s.includes("book") || s.includes("paper") || s.includes("certificate") || s.includes("id card") || s.includes("ids") || s.includes("documents")) return "Documents & IDs";
  if (s.includes("wallet") || s.includes("purse") || s.includes("cardholder") || s.includes("debit") || s.includes("credit") || s.includes("cash") || s.includes("money") || s.includes("billfold") || s.includes("wallets")) return "Wallets & Cards";
  if (/\bkeys?\b/.test(s) || s.includes("keychain") || s.includes("car key") || s.includes("fob")) return "Keys";
  if (s.includes("bag") || s.includes("backpack") || s.includes("luggage") || s.includes("suitcase") || s.includes("duffel")) return "Bags & Backpacks";
  if (s.includes("jewel") || s.includes("accessor") || s.includes("ring") || s.includes("necklace") || s.includes("watch") || s.includes("glass")) return "Jewelry & Accessories";
  if (s.includes("cloth") || s.includes("footwear") || s.includes("shoe") || s.includes("jacket") || s.includes("bottle") || s.includes("umbrella")) return "Clothing";
  if (s.includes("pet") || s.includes("dog") || s.includes("cat") || s.includes("puppy")) return "Pets";
  return "Other";
}

function getItemCategory(item) {
  if (!item) return "Other";
  if (item.category && item.category !== "Other") {
    return normalizeCategory(item.category);
  }
  return inferCategory(item.name, item.description);
}

/* ==========================================================================
   DATA STORE & HELPER FUNCTIONS
   ========================================================================== */

function getItems() {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const realItems = parsed.filter(
      (item) => item && !String(item.id).startsWith("item_seed_")
    );
    realItems.forEach((item) => {
      if (!item.category || item.category === "Other") {
        const autoCat = inferCategory(item.name, item.description);
        if (autoCat && autoCat !== "Other") {
          item.category = autoCat;
        }
      }
    });
    if (realItems.length !== parsed.length) {
      saveItems(realItems);
    }
    return realItems;
  } catch (e) {
    return [];
  }
}

function saveItems(x) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(x));
}

function user() {
  try {
    return JSON.parse(localStorage.getItem("lf_currentUser") || "null");
  } catch (e) {
    return null;
  }
}

function requireUser() {
  if (!user()) {
    location.href = "login.html";
    return false;
  }
  return true;
}

function getClaims() {
  try {
    return JSON.parse(localStorage.getItem(CLAIMS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveClaims(c) {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(c));
}

function getMessages(itemId) {
  try {
    const all = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
    return itemId ? all.filter((m) => m.itemId === itemId) : all;
  } catch (e) {
    return [];
  }
}

function saveMessage(msg) {
  try {
    const all = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
    all.push(msg);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Could not save message", e);
  }
}

function getNotifications(userEmail) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    if (!userEmail) return all;
    return all.filter((n) => (n.userEmail || "").toLowerCase() === userEmail.toLowerCase());
  } catch (e) {
    return [];
  }
}

function saveNotification(notif) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const n = {
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      read: false,
      createdAt: Date.now(),
      ...notif,
    };
    all.unshift(n);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    showToast(n.title + ": " + n.message, "info");
    updateNavNotificationBadge();
    return n;
  } catch (e) {
    console.warn("Could not save notification", e);
  }
}

function markNotificationRead(id) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const item = all.find((n) => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
      updateNavNotificationBadge();
    }
  } catch (e) {}
}

function markAllNotificationsRead(userEmail) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    all.forEach((n) => {
      if (!userEmail || (n.userEmail || "").toLowerCase() === userEmail.toLowerCase()) {
        n.read = true;
      }
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    updateNavNotificationBadge();
  } catch (e) {}
}

function clearAllNotifications(userEmail) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const remaining = userEmail
      ? all.filter((n) => (n.userEmail || "").toLowerCase() !== userEmail.toLowerCase())
      : [];
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(remaining));
    updateNavNotificationBadge();
  } catch (e) {}
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

const fmt = (d) => {
  if (!d) return "—";
  try {
    const s = String(d);
    const date = s.includes("T") ? new Date(s) : new Date(s + "T00:00:00");
    return isNaN(date.getTime())
      ? s
      : date.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  } catch (e) {
    return String(d);
  }
};

const formatBytes = (n) =>
  n < 1024 * 1024
    ? `${Math.round(n / 1024)} KB`
    : `${(n / 1024 / 1024).toFixed(1)} MB`;

function showToast(text, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === "success" ? "✓" : "🔔"}</span><div>${esc(text)}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================================================
   INDEXEDDB FILE STORAGE
   ========================================================================== */

function openFileDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB)
      return reject(new Error("IndexedDB is not supported in this browser."));
    const request = indexedDB.open(FILE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(FILE_STORE)) {
        request.result.createObjectStore(FILE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Could not open file storage."));
  });
}

async function saveFile(id, file) {
  const db = await openFileDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).put(
      { blob: file, name: file.name, type: file.type, size: file.size },
      id
    );
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Could not save file."));
    };
  });
}

async function getFile(id) {
  if (!id) return null;
  const db = await openFileDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const req = tx.objectStore(FILE_STORE).get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result || null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error || new Error("Could not read file."));
    };
  });
}

async function deleteFile(id) {
  if (!id) return;
  try {
    const db = await openFileDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readwrite");
      tx.objectStore(FILE_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn("File cleanup failed", e);
  }
}

function clearObjectUrls() {
  objectUrls.forEach((u) => URL.revokeObjectURL(u));
  objectUrls = [];
}

async function fileMarkup(i, className = "item-image") {
  let file = null;
  if (i.fileId) {
    try {
      file = await getFile(i.fileId);
    } catch (e) {
      console.warn("Could not load file", e);
    }
  }
  const isRecovered = i.status === "recovered" || i.status === "claimed" || i.status === "closed";
  const pillClass = isRecovered ? "recovered" : (i.type || "lost");
  const pillText = isRecovered ? "CLAIMED" : (i.type || "lost").toUpperCase();

  if (file && file.blob) {
    const url = URL.createObjectURL(file.blob);
    objectUrls.push(url);
    if ((file.type || "").startsWith("image/")) {
      return `<div class="${className}"><img src="${url}" alt="${esc(i.name)}"><span class="pill ${pillClass}">${pillText}</span></div>`;
    }
    return `<div class="${className} file-placeholder"><div>📎</div><strong>${esc(file.name || i.fileName || "Attachment")}</strong><small>${esc(formatBytes(file.size || i.fileSize || 0))}</small><span class="pill ${pillClass}">${pillText}</span></div>`;
  }
  if (i.image) {
    return `<div class="${className}"><img src="${i.image}" alt="${esc(i.name)}"><span class="pill ${pillClass}">${pillText}</span></div>`;
  }
  const placeholderIcon = i.type === "lost" ? "◎" : "✓";
  return `<div class="${className}"><span>${placeholderIcon}</span><span class="pill ${pillClass}">${pillText}</span></div>`;
}


/* ==========================================================================
   CARD RENDERING & LIST
   ========================================================================== */

async function card(i, manage = false) {
  const media = await fileMarkup(i);
  const isRecovered = i.status === "recovered" || i.status === "claimed" || i.status === "closed";
  const statusClass = isRecovered ? "recovered" : "active";
  const statusLabel = isRecovered ? (i.status === "claimed" ? "Claimed" : "Recovered") : "Active";
  const recoverBtnText = isRecovered ? "Mark active" : "Mark claimed / recovered";
  
  let claimBadge = "";
  if (manage) {
    const itemClaims = getClaims().filter((c) => c.itemId === i.id);
    if (itemClaims.length > 0) {
      const claimDetails = itemClaims
        .map((c) => `${esc(c.userEmail)} [${c.status || "pending"}]${c.note ? ` ("${esc(c.note)}")` : ""}`)
        .join("; ");
      claimBadge = `<div class="card-claim-info" style="font-size: 11px; color: var(--blue); font-weight: 700; margin-top: 8px;">Claims (${itemClaims.length}): ${claimDetails}</div>`;
    }
  }

  const itemCat = getItemCategory(i);
  const categoryTag = itemCat && itemCat !== "Other" ? `<span>•</span><span>${esc(itemCat)}</span>` : "";

  return `
    <article class="item-card">
      ${media}
      <div class="item-body">
        <div class="item-meta">
          <span>${esc(fmt(i.date))}</span>
          <span>•</span>
          <span>${esc(i.place)}</span>
          ${categoryTag}
        </div>
        <h3>${esc(i.name)}</h3>
        <p>${esc(i.description)}</p>
        ${claimBadge}
        <div class="card-bottom">
          <span class="status ${statusClass}">${statusLabel}</span>
          <div style="display:flex; gap:10px; align-items:center;">
            <a href="item-details.html?id=${encodeURIComponent(i.id)}#chat" style="color:var(--blue); font-size:11px; font-weight:750;">💬 Chat</a>
            <a href="item-details.html?id=${encodeURIComponent(i.id)}">View details →</a>
          </div>
        </div>
        ${
          manage
            ? `<div class="manage-actions">
                <button data-action="edit" data-id="${esc(i.id)}">Edit</button>
                <button data-action="delete" data-id="${esc(i.id)}">Delete</button>
                <button data-action="recover" data-id="${esc(i.id)}">${recoverBtnText}</button>
              </div>`
            : ""
        }
      </div>
    </article>
  `;
}

async function renderList(list, el) {
  clearObjectUrls();
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div>⌕</div><h3>No reports found</h3><p>Try adjusting your search filters or report an item yourself.</p></div>`;
    return;
  }
  const cards = await Promise.all(list.map((i) => card(i, false)));
  el.innerHTML = cards.join("");
}

/* ==========================================================================
   BROWSE PAGE CONTROLLER
   ========================================================================== */

function initItems() {
  const grid = document.getElementById("itemsGrid");
  if (!grid) return;
  const search = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const statusFilter = document.getElementById("statusFilter");
  const count = document.getElementById("itemsCount");
  const clearBtn = document.getElementById("clearFilters");

  const params = new URLSearchParams(location.search);
  if (params.get("type") && ["lost", "found", "all"].includes(params.get("type"))) {
    if (typeFilter) typeFilter.value = params.get("type");
  }
  if (params.get("q") && search) {
    search.value = params.get("q");
  }
  if (params.get("category") && categoryFilter) {
    categoryFilter.value = params.get("category");
  }

  const run = async () => {
    const q = (search ? search.value : "").toLowerCase().trim();
    const t = typeFilter ? typeFilter.value : "all";
    const cat = categoryFilter ? categoryFilter.value : "all";
    const stat = statusFilter ? statusFilter.value : "all";
    const keywords = q ? q.split(/\s+/).filter(Boolean) : [];

    const allItems = getItems();
    const seen = new Set();
    const uniqueItems = allItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    let list = uniqueItems.filter((i) => {
      // Type filter
      if (t !== "all" && i.type !== t) return false;
      
      // Category filter
      if (cat !== "all" && getItemCategory(i) !== normalizeCategory(cat)) return false;

      // Status filter
      if (stat === "active" && (i.status === "recovered" || i.status === "claimed" || i.status === "closed")) return false;
      if (stat === "claimed" && !(i.status === "recovered" || i.status === "claimed" || i.status === "closed")) return false;

      // Keyword search
      if (keywords.length > 0) {
        const searchable = `${i.name || ""} ${i.description || ""} ${i.place || ""} ${i.category || ""} ${i.reporterName || ""}`.toLowerCase();
        if (!keywords.every((kw) => searchable.includes(kw))) return false;
      }

      return true;
    });

    if (count) {
      count.textContent = `${list.length} report${list.length !== 1 ? "s" : ""}`;
    }
    await renderList(list, grid);
  };

  if (search) search.addEventListener("input", run);
  if (typeFilter) typeFilter.addEventListener("change", run);
  if (categoryFilter) categoryFilter.addEventListener("change", run);
  if (statusFilter) statusFilter.addEventListener("change", run);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (search) search.value = "";
      if (typeFilter) typeFilter.value = "all";
      if (categoryFilter) categoryFilter.value = "all";
      if (statusFilter) statusFilter.value = "all";
      run();
    });
  }
  run();
}

/* ==========================================================================
   REPORT FORM CONTROLLER
   ========================================================================== */

function initReport() {
  const form = document.getElementById("reportForm");
  if (!form) return;
  if (!requireUser()) return;
  const u = user();
  if (!u) return;

  const params = new URLSearchParams(location.search);
  const editId = params.get("edit");
  const existing = editId
    ? getItems().find((x) => x.id === editId && (x.reportedBy || "").toLowerCase() === (u.email || "").toLowerCase())
    : null;

  if (editId && !existing) {
    location.href = "my-reports.html";
    return;
  }

  const type = existing
    ? existing.type
    : params.get("type") === "found"
    ? "found"
    : "lost";

  const titleEl = document.getElementById("reportTitle");
  const eyebrowEl = document.getElementById("reportEyebrow");
  if (titleEl) {
    titleEl.textContent = existing
      ? `Edit your ${type} report`
      : `Report a ${type} item`;
  }
  if (eyebrowEl) {
    eyebrowEl.textContent = existing
      ? "EDIT REPORT"
      : type === "lost"
      ? "REPORT LOST ITEM"
      : "REPORT FOUND ITEM";
  }

  const nameInput = document.getElementById("itemName");
  const categoryInput = document.getElementById("itemCategory");
  const dateInput = document.getElementById("itemDate");
  const placeInput = document.getElementById("itemPlace");
  const descInput = document.getElementById("itemDescription");
  const contactInput = document.getElementById("itemContact");
  const phoneInput = document.getElementById("itemPhone");
  const previewEl = document.getElementById("imagePreview");
  const fileInput = document.getElementById("itemImage");
  const msgEl = document.getElementById("reportMessage");

  if (existing) {
    if (nameInput) nameInput.value = existing.name || "";
    if (categoryInput) categoryInput.value = existing.category || inferCategory(existing.name, existing.description);
    if (dateInput) dateInput.value = existing.date || "";
    if (placeInput) placeInput.value = existing.place || "";
    if (descInput) descInput.value = existing.description || "";
    if (contactInput) contactInput.value = existing.contact || "";
    if (phoneInput) phoneInput.value = existing.phone || "";

    if (existing.fileId) {
      getFile(existing.fileId)
        .then((file) => {
          if (file && previewEl) {
            const url = URL.createObjectURL(file.blob);
            objectUrls.push(url);
            if ((file.type || "").startsWith("image/")) {
              previewEl.innerHTML = `<img src="${url}" alt="Current image"><small>${esc(file.name)} · choose a new file to replace it</small>`;
            } else {
              previewEl.innerHTML = `<span class="upload-icon">📎</span><strong>${esc(file.name)}</strong><small>${esc(formatBytes(file.size))} · choose a new file to replace it</small>`;
            }
          }
        })
        .catch(() => {});
    } else if (existing.image && previewEl) {
      previewEl.innerHTML = `<img src="${existing.image}" alt="Current image">`;
    }
  } else {
    if (contactInput && !contactInput.value && u.email) {
      contactInput.value = u.email;
    }
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }
  }

  // Real-time automatic category inference as user types
  if (nameInput && categoryInput) {
    nameInput.addEventListener("input", () => {
      if (!existing || categoryInput.value === "Other") {
        const autoCat = inferCategory(nameInput.value, descInput ? descInput.value : "");
        if (autoCat && autoCat !== "Other") {
          categoryInput.value = autoCat;
        }
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (msgEl) msgEl.textContent = "";
      if (!f) return;
      if (f.size > MAX_FILE_SIZE) {
        e.target.value = "";
        if (msgEl)
          msgEl.textContent = "File is too large. Please choose a file up to 10 MB.";
        return;
      }
      if (!previewEl) return;
      previewEl.innerHTML = `<span class="upload-icon">${f.type.startsWith("image/") ? "🖼" : "📎"}</span><strong>${esc(f.name)}</strong><small>${esc(f.type || "File")} · ${esc(formatBytes(f.size))}</small>`;
      if (f.type.startsWith("image/")) {
        const r = new FileReader();
        r.onload = () => {
          previewEl.innerHTML = `<img src="${r.result}" alt="Preview"><small>${esc(f.name)} · ${esc(formatBytes(f.size))}</small>`;
        };
        r.readAsDataURL(f);
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msgEl) msgEl.textContent = "";
    const button = form.querySelector('button[type="submit"]');

    if (
      !nameInput.value.trim() ||
      !descInput.value.trim() ||
      !dateInput.value ||
      !placeInput.value.trim() ||
      !contactInput.value.trim()
    ) {
      if (msgEl) msgEl.textContent = "Please complete all required fields.";
      return;
    }

    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    if (file && file.size > MAX_FILE_SIZE) {
      if (msgEl) msgEl.textContent = "File is too large. Maximum size is 10 MB.";
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Publishing…";
    }

    try {
      const id = existing
        ? existing.id
        : typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "item_" + Date.now() + "_" + Math.random().toString(36).slice(2);

      let fileId = existing?.fileId || "";
      let fileName = existing?.fileName || "";
      let fileType = existing?.fileType || "";
      let fileSize = existing?.fileSize || 0;

      if (file) {
        fileId = `file_${id}`;
        try {
          await saveFile(fileId, file);
          fileName = file.name;
          fileType = file.type;
          fileSize = file.size;
        } catch (fileErr) {
          console.warn("File storage in IndexedDB failed:", fileErr);
        }
      }

      const assignedCategory = categoryInput && categoryInput.value !== "Other"
        ? categoryInput.value
        : inferCategory(nameInput.value, descInput.value);

      const item = {
        id,
        type,
        name: nameInput.value.trim(),
        category: assignedCategory,
        description: descInput.value.trim(),
        date: dateInput.value,
        place: placeInput.value.trim(),
        contact: contactInput.value.trim(),
        phone: phoneInput ? phoneInput.value.trim() : (existing?.phone || ""),
        fileId,
        fileName,
        fileType,
        fileSize,
        image: existing?.image || "",
        reportedBy: u.email,
        reporterName: u.name,
        status: existing?.status || "active",
        createdAt: existing?.createdAt || Date.now(),
      };

      const items = getItems();
      if (existing) {
        const idx = items.findIndex((x) => x.id === existing.id);
        if (idx >= 0) items[idx] = item;
        else items.unshift(item);
      } else {
        items.unshift(item);
      }
      saveItems(items);

      location.href = existing ? "my-reports.html" : "items.html";
    } catch (err) {
      console.error(err);
      if (msgEl)
        msgEl.textContent =
          "Could not publish this report. Please try again with a smaller file or another browser.";
      if (button) {
        button.disabled = false;
        button.textContent = existing ? "Save changes →" : "Publish report →";
      }
    }
  });
}

/* ==========================================================================
   MISSING / FOUND POSTER GENERATOR (CANVAS & HIGH-RES FLYER)
   ========================================================================== */

async function generatePosterCanvas(item, targetCanvas) {
  const canvas = targetCanvas || document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1200, 1600);

  // Outer Border & Card
  ctx.lineWidth = 14;
  ctx.strokeStyle = item.type === "lost" ? "#D84A4A" : "#0F8B68";
  ctx.strokeRect(20, 20, 1160, 1560);

  // Header Banner
  const bannerColor = item.type === "lost" ? "#D84A4A" : "#0F8B68";
  ctx.fillStyle = bannerColor;
  ctx.fillRect(20, 20, 1160, 210);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 82px Inter, sans-serif";
  const mainHeader = item.type === "lost" ? "MISSING / LOST" : "FOUND ITEM";
  ctx.fillText(mainHeader, 600, 125);

  ctx.font = "bold 26px Inter, sans-serif";
  ctx.letterSpacing = "2px";
  const subHeader = item.type === "lost"
    ? "PLEASE HELP US LOCATE AND RETURN THIS BELONGING"
    : "HELP US REUNITE THIS ITEM WITH ITS RIGHTFUL OWNER";
  ctx.fillText(subHeader, 600, 185);

  // Load Image if available
  let imgObj = null;
  if (item.fileId) {
    const f = await getFile(item.fileId).catch(() => null);
    if (f && f.blob && (f.type || "").startsWith("image/")) {
      imgObj = await new Promise((res) => {
        const img = new Image();
        const blobUrl = URL.createObjectURL(f.blob);
        img.onload = () => { URL.revokeObjectURL(blobUrl); res(img); };
        img.onerror = () => { URL.revokeObjectURL(blobUrl); res(null); };
        img.src = blobUrl;
      });
    }
  }

  // Draw Photo Box
  const photoX = 150, photoY = 270, photoW = 900, photoH = 560;
  ctx.fillStyle = "#f0f4f8";
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#dfe5ec";
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  if (imgObj) {
    const hRatio = photoW / imgObj.width;
    const vRatio = photoH / imgObj.height;
    const ratio = Math.min(hRatio, vRatio);
    const centerShiftX = (photoW - imgObj.width * ratio) / 2;
    const centerShiftY = (photoH - imgObj.height * ratio) / 2;
    ctx.drawImage(
      imgObj,
      0, 0, imgObj.width, imgObj.height,
      photoX + centerShiftX, photoY + centerShiftY,
      imgObj.width * ratio, imgObj.height * ratio
    );
  } else {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 120px Inter, sans-serif";
    ctx.fillText(item.type === "lost" ? "◎" : "✓", 600, 580);
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillText("No Photo Attached", 600, 640);
  }

  // Item Title
  ctx.fillStyle = "#17212B";
  ctx.font = "bold 56px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(item.name || "Unnamed Item", 600, 900);

  // Metadata Grid
  ctx.font = "bold 28px Inter, sans-serif";
  ctx.fillStyle = "#475569";
  const metaLine1 = `Date: ${fmt(item.date)}   |   Place: ${item.place}   |   Category: ${item.category || "General"}`;
  ctx.fillText(metaLine1, 600, 955);

  // Description / Details Box
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(100, 990, 1000, 210);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e2e8f0";
  ctx.strokeRect(100, 990, 1000, 210);

  ctx.fillStyle = "#64748b";
  ctx.font = "bold 20px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("DESCRIPTION & IDENTIFYING MARKS:", 130, 1030);

  ctx.fillStyle = "#1e293b";
  ctx.font = "24px Inter, sans-serif";
  const desc = item.description || "No specific details provided.";
  const words = desc.split(" ");
  let line = "";
  let y = 1070;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 920 && n > 0) {
      ctx.fillText(line, 130, y);
      line = words[n] + " ";
      y += 36;
      if (y > 1170) {
        line += "...";
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 130, y);

  // Contact Footer Box
  ctx.fillStyle = bannerColor;
  ctx.fillRect(80, 1230, 1040, 280);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  ctx.font = "bold 34px Inter, sans-serif";
  ctx.fillText("IF FOUND OR TO CLAIM, PLEASE CONTACT:", 600, 1290);

  ctx.font = "bold 46px Inter, sans-serif";
  const contactStr = item.phone ? `${item.contact}  ·  ${item.phone}` : item.contact;
  ctx.fillText(contactStr, 600, 1360);

  ctx.font = "24px Inter, sans-serif";
  ctx.fillText(`Reported by: ${item.reporterName || item.reportedBy}  |  Report ID: #${String(item.id).slice(0, 8)}`, 600, 1420);

  ctx.font = "18px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Lost & Found+ Community Platform · Please share or print to help reunite items!", 600, 1475);

  return canvas;
}

function openPosterModal(item) {
  let modalOverlay = document.getElementById("posterModal");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "posterModal";
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3>Missing / Found Poster Generator</h3>
          <button class="modal-close" id="closePosterModal">×</button>
        </div>
        <div class="modal-body">
          <p class="muted" style="font-size: 13px; margin: 0 0 16px;">
            High-resolution printable poster ready for sharing or printing.
          </p>
          <div class="poster-canvas-wrapper">
            <canvas id="posterCanvas" class="poster-canvas"></canvas>
          </div>
        </div>
        <div class="modal-footer">
          <button id="downloadPosterPng" class="btn btn-primary">⬇ Download Poster (PNG)</button>
          <button id="closePosterBtn" class="btn btn-secondary">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  const canvas = document.getElementById("posterCanvas");
  generatePosterCanvas(item, canvas);

  modalOverlay.classList.add("show");

  document.getElementById("closePosterModal").onclick = () => modalOverlay.classList.remove("show");
  document.getElementById("closePosterBtn").onclick = () => modalOverlay.classList.remove("show");
  
  document.getElementById("downloadPosterPng").onclick = () => {
    const link = document.createElement("a");
    link.download = `Poster-${item.type}-${(item.name || "Item").replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("Poster downloaded successfully!", "success");
  };
}

/* ==========================================================================
   LIVE ITEM CHAT SYSTEM
   ========================================================================== */

function renderChat(item, containerEl) {
  if (!containerEl) return;
  const u = user();

  const messages = getMessages(item.id);
  const msgListHtml = messages.length
    ? messages
        .map((m) => {
          const isMine = u && (m.senderEmail || "").toLowerCase() === (u.email || "").toLowerCase();
          const isOwner = (m.senderEmail || "").toLowerCase() === (item.reportedBy || "").toLowerCase();
          const bubbleClass = `chat-bubble ${isMine ? "mine" : ""} ${isOwner ? "reporter" : ""}`;
          return `
            <div class="${bubbleClass}">
              <div class="chat-meta">
                <span>${esc(m.senderName || m.senderEmail)}</span>
                ${isOwner ? '<span class="reporter-badge">Author</span>' : ""}
                <span class="chat-time">${esc(fmt(new Date(m.createdAt).toISOString()))}</span>
              </div>
              <div class="chat-text">${esc(m.text)}</div>
            </div>
          `;
        })
        .join("")
    : `<div class="empty-state" style="padding: 24px; font-size: 13px;">No messages yet. Ask a question or share details with the reporter.</div>`;

  containerEl.innerHTML = `
    <div class="chat-header">
      <div>
        <span class="eyebrow" style="margin-bottom: 4px;">COMMUNICATION</span>
        <h3>Chat & Inquiries</h3>
      </div>
      <small class="muted">${messages.length} message${messages.length !== 1 ? "s" : ""}</small>
    </div>
    <div class="chat-messages" id="chatMessagesScroll">${msgListHtml}</div>
    ${
      u
        ? `
      <form id="chatForm" class="chat-input-bar">
        <input id="chatInput" placeholder="Write a message to the reporter..." required />
        <button type="submit" class="btn btn-primary btn-sm">Send</button>
      </form>
    `
        : `
      <div style="text-align: center; padding: 14px; background: #f8fafc; border-radius: 12px; margin-top: 14px; font-size: 12px;">
        <a href="login.html" class="text-link">Log in</a> to participate in the conversation.
      </div>
    `
    }
  `;

  const scrollBox = document.getElementById("chatMessagesScroll");
  if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;

  const chatForm = document.getElementById("chatForm");
  if (chatForm && u) {
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      const input = document.getElementById("chatInput");
      const text = input ? input.value.trim() : "";
      if (!text) return;

      const newMsg = {
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        itemId: item.id,
        senderEmail: u.email,
        senderName: u.name,
        text,
        createdAt: Date.now(),
      };
      saveMessage(newMsg);

      // Notify recipient
      const isOwner = (u.email || "").toLowerCase() === (item.reportedBy || "").toLowerCase();
      if (!isOwner) {
        saveNotification({
          userEmail: item.reportedBy,
          title: `💬 New message on '${item.name}'`,
          message: `${u.name}: "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`,
          link: `item-details.html?id=${encodeURIComponent(item.id)}#chat`,
        });
      } else {
        const otherEmails = [...new Set(messages.map((m) => m.senderEmail).filter((em) => em && em.toLowerCase() !== u.email.toLowerCase()))];
        otherEmails.forEach((recipientEmail) => {
          saveNotification({
            userEmail: recipientEmail,
            title: `💬 Reporter replied on '${item.name}'`,
            message: `${u.name}: "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`,
            link: `item-details.html?id=${encodeURIComponent(item.id)}#chat`,
          });
        });
      }

      input.value = "";
      renderChat(item, containerEl);
    };
  }
}

/* ==========================================================================
   ITEM DETAILS CONTROLLER
   ========================================================================== */

async function initDetails() {
  const box = document.getElementById("detailContent");
  if (!box) return;
  const id = new URLSearchParams(location.search).get("id");
  const items = getItems();
  const i = items.find((x) => x.id === id);
  if (!i) {
    box.innerHTML =
      '<div class="empty-state"><h3>Report not found</h3><a href="items.html" class="btn btn-secondary">Back to reports</a></div>';
    return;
  }
  clearObjectUrls();
  const file = i.fileId ? await getFile(i.fileId).catch(() => null) : null;
  let photo = `<span>${i.type === "lost" ? "◎" : "✓"}</span>`;
  if (file && file.blob) {
    const url = URL.createObjectURL(file.blob);
    objectUrls.push(url);
    photo = (file.type || "").startsWith("image/")
      ? `<img src="${url}" alt="${esc(i.name)}">`
      : `<div class="file-detail"><div>📎</div><strong>${esc(file.name || i.fileName || "Attachment")}</strong><small>${esc(formatBytes(file.size || i.fileSize || 0))}</small><a class="btn btn-secondary" href="${url}" download="${esc(file.name || "attachment")}">Download file</a></div>`;
  } else if (i.image) {
    photo = `<img src="${i.image}" alt="${esc(i.name)}">`;
  }

  const u = user();
  const isOwner = u && (i.reportedBy || "").toLowerCase() === (u.email || "").toLowerCase();
  const isRecovered = i.status === "recovered" || i.status === "claimed" || i.status === "closed";
  const statusClass = isRecovered ? "recovered" : "active";
  const statusLabel = isRecovered ? (i.status === "claimed" ? "Claimed" : "Recovered") : "Active";

  // Claim state check
  const allClaims = getClaims();
  const itemClaims = allClaims.filter((c) => c.itemId === i.id);
  const myClaim = u ? itemClaims.find((c) => (c.userEmail || "").toLowerCase() === (u.email || "").toLowerCase()) : null;

  let statusBannerHtml = "";
  if (isRecovered) {
    statusBannerHtml = `
      <div class="status-banner">
        <span>✓</span>
        <div>This item is <strong>CLAIMED</strong>! The report is now closed and the item has been reunited.</div>
      </div>
    `;
  }

  // Claims UI for reporter
  let reporterClaimsSection = "";
  if (isOwner && itemClaims.length > 0) {
    const claimsListHtml = itemClaims
      .map((c) => {
        const isApproved = c.status === "approved" || (i.claimedBy && (i.claimedBy || "").toLowerCase() === (c.userEmail || "").toLowerCase());
        const isRejected = c.status === "rejected";
        const entryStyle = isApproved
          ? "border: 2px solid var(--green); background: #f0fdf4;"
          : isRejected
          ? "opacity: 0.6; background: #fafafa;"
          : "";

        return `
        <div class="claim-entry" style="${entryStyle}">
          <div class="claim-entry-top">
            <strong>${esc(c.userName || c.userEmail)} (${esc(c.userEmail)})</strong>
            <small>${esc(fmt(new Date(c.createdAt || Date.now()).toISOString()))}</small>
          </div>
          ${c.contactPhone ? `<div style="font-size:11px; color:var(--ink); margin-bottom:4px;"><strong>Phone:</strong> ${esc(c.contactPhone)}</div>` : ""}
          <p>${esc(c.note || "No specific note provided.")}</p>
          <div class="claim-actions">
            ${
              isApproved
                ? `<div style="display:inline-flex; align-items:center; gap:6px; background:var(--green); color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:6px;">✓ CLAIM ACCEPTED & VERIFIED</div>`
                : isRejected
                ? `<span style="color:var(--muted); font-size:11px; font-weight:700;">Decline</span>`
                : isRecovered
                ? `<span style="color:var(--muted); font-size:11px;">Report closed</span>`
                : `
              <button class="btn-accept-claim" data-claim-id="${esc(c.id)}" data-claim-email="${esc(c.userEmail)}">Accept Claim & Close Report</button>
              <button class="btn-reject-claim" data-claim-id="${esc(c.id)}">Decline</button>
            `
            }
          </div>
        </div>
      `;
      })
      .join("");

    reporterClaimsSection = `
      <div class="claims-card">
        <h3>
          <span>Claims on this report (${itemClaims.length})</span>
          ${isRecovered ? '<span style="color:var(--green); font-size:12px; font-weight:800;">✓ Item Claimed</span>' : ''}
        </h3>
        <div>${claimsListHtml}</div>
      </div>
    `;
  }

  // Claim Button / Status for Non-Owner
  let claimantActionHtml = "";
  if (!isOwner) {
    if (myClaim) {
      const claimStateLabel = myClaim.status === "approved"
        ? "Your claim was accepted! 🎉 Please coordinate the return with the reporter."
        : isRecovered
        ? "This item has already been claimed."
        : "Your claim is pending review by reporter";
      const bgColor = myClaim.status === "approved" ? "#e9f8f2" : "#f0f7ff";
      const borderColor = myClaim.status === "approved" ? "#b3e8d0" : "#cce3ff";
      const textColor = myClaim.status === "approved" ? "var(--green)" : "var(--blue)";
      claimantActionHtml = `
        <div style="background:${bgColor}; border:1px solid ${borderColor}; border-radius:12px; padding:14px; margin-top:12px; font-size:12px; color:${textColor}; font-weight:700;">
          ✓ ${claimStateLabel}
        </div>
      `;
    } else if (!isRecovered) {
      claimantActionHtml = `
        <div id="claimContainer" style="margin-top:12px;">
          <button id="claimBtn" class="btn btn-secondary full">Claim this item</button>
        </div>
      `;
    }
  }

  box.innerHTML = `
    <div class="detail-grid">
      <div class="detail-photo">${photo}</div>
      <div class="detail-info">
        <div class="detail-top">
          <span class="pill ${isRecovered ? "recovered" : (i.type || "lost")}">${isRecovered ? (i.status === "claimed" ? "CLAIMED" : "RECOVERED") : (i.type || "lost").toUpperCase()}</span>
          ${!isRecovered ? `<span class="status ${statusClass}">${statusLabel}</span>` : ""}
        </div>
        ${statusBannerHtml}
        <h1>${esc(i.name)}</h1>
        <p class="detail-description">${esc(i.description)}</p>
        <div class="detail-facts">
          <div><small>DATE</small><strong>${esc(fmt(i.date))}</strong></div>
          <div><small>PLACE</small><strong>${esc(i.place)}</strong></div>
          <div><small>CATEGORY</small><strong>${esc(i.category || "General")}</strong></div>
        </div>
        <div class="contact-box">
          <div>
            <small>CONTACT REPORTER</small>
            <strong>${esc(i.contact)}${i.phone ? ` · ${esc(i.phone)}` : ""}</strong>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <a class="btn btn-secondary" href="#chat" id="jumpToChatBtn" style="font-size: 11px;">💬 Live Chat</a>
            <a class="btn btn-primary" href="mailto:${encodeURIComponent(i.contact)}?subject=${encodeURIComponent("Regarding your " + i.name + " report")}">Email →</a>
          </div>
        </div>
        ${claimantActionHtml}
        ${reporterClaimsSection}
        <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
          <button id="generatePosterBtn" class="btn btn-primary full" style="font-size: 12px;">🎨 Generate Missing / Found Poster</button>
          <button id="shareLinkBtn" class="btn btn-secondary full" style="font-size: 11px;">Copy report link</button>
        </div>
        <p id="claimMessage" class="form-message"></p>
      </div>
    </div>
    
      <!-- Item Live Chat / Direct Messages -->
      <div class="chat-section" id="chat">
        <div id="chatBoxContainer"></div>
      </div>
    `;

  // Render Live Chat
  renderChat(i, document.getElementById("chatBoxContainer"));

  const jumpChat = document.getElementById("jumpToChatBtn");
  if (jumpChat) {
    jumpChat.onclick = (e) => {
      e.preventDefault();
      const chatEl = document.getElementById("chat");
      if (chatEl) {
        chatEl.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          document.getElementById("chatInput")?.focus();
        }, 300);
      }
    };
  }

  if (location.hash === "#chat") {
    setTimeout(() => {
      const chatEl = document.getElementById("chat");
      if (chatEl) {
        chatEl.scrollIntoView({ behavior: "smooth" });
        document.getElementById("chatInput")?.focus();
      }
    }, 400);
  }

  // Event Handlers
  const posterBtn = document.getElementById("generatePosterBtn");
  if (posterBtn) {
    posterBtn.onclick = () => openPosterModal(i);
  }

  const shareBtn = document.getElementById("shareLinkBtn");
  if (shareBtn) {
    shareBtn.onclick = () => {
      navigator.clipboard.writeText(location.href).then(() => {
        shareBtn.textContent = "Link copied!";
        showToast("Report link copied to clipboard", "success");
        setTimeout(() => { shareBtn.textContent = "Copy report link"; }, 2500);
      }).catch(() => {
        shareBtn.textContent = "Link: " + location.href;
      });
    };
  }

  // Claim Button Handler
  const cb = document.getElementById("claimBtn");
  if (cb) {
    cb.onclick = () => {
      const currentUser = user();
      if (!currentUser) {
        location.href = "login.html";
        return;
      }
      const note = prompt("Please provide proof of ownership (e.g. distinguishing marks, serial number, or detailed contents):");
      if (note === null) return;

      const phone = prompt("Optional: Provide your phone number for quick contact:") || "";

      let claims = getClaims();
      const newClaim = {
        id: "claim_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        itemId: i.id,
        userEmail: currentUser.email,
        userName: currentUser.name || "Community Member",
        contactPhone: phone.trim(),
        note: (note || "").trim(),
        status: "pending",
        createdAt: Date.now(),
      };
      claims.push(newClaim);
      saveClaims(claims);

      // Notify reporter
      saveNotification({
        userEmail: i.reportedBy,
        title: `🎁 New claim on '${i.name}'`,
        message: `${currentUser.name} has submitted a claim with proof of ownership.`,
        link: `item-details.html?id=${encodeURIComponent(i.id)}`,
      });

      showToast("Claim submitted to reporter!", "success");
      initDetails();
    };
  }

  // Accept / Reject Claim Handlers for Owner
  box.querySelectorAll(".btn-accept-claim").forEach((btn) => {
    btn.onclick = () => {
      const claimId = btn.dataset.claimId;
      const claimEmail = btn.dataset.claimEmail;
      if (confirm(`Accept claim and mark this item as CLAIMED / RECOVERED?`)) {
        // Update item status
        const allItems = getItems();
        const itemIdx = allItems.findIndex((x) => x.id === i.id);
        if (itemIdx >= 0) {
          allItems[itemIdx].status = "claimed";
          allItems[itemIdx].claimedBy = claimEmail;
          allItems[itemIdx].claimedAt = Date.now();
          saveItems(allItems);
        }

        // Update claim status
        const claims = getClaims();
        claims.forEach((c) => {
          if (c.itemId === i.id) {
            c.status = c.id === claimId ? "approved" : "rejected";
          }
        });
        saveClaims(claims);

        // Notify claimant
        saveNotification({
          userEmail: claimEmail,
          title: `🎉 Claim Accepted for '${i.name}'`,
          message: `The reporter accepted your claim! Please coordinate the return.`,
          link: `item-details.html?id=${encodeURIComponent(i.id)}`,
        });

        showToast("Claim accepted! Report is now closed.", "success");
        initDetails();
      }
    };
  });

  box.querySelectorAll(".btn-reject-claim").forEach((btn) => {
    btn.onclick = () => {
      const claimId = btn.dataset.claimId;
      if (confirm("Decline this claim?")) {
        const claims = getClaims();
        const targetClaim = claims.find((c) => c.id === claimId);
        if (targetClaim) {
          targetClaim.status = "rejected";
          saveClaims(claims);
          saveNotification({
            userEmail: targetClaim.userEmail,
            title: `Claim Update for '${i.name}'`,
            message: `Your claim could not be verified by the reporter.`,
            link: `item-details.html?id=${encodeURIComponent(i.id)}`,
          });
        }
        showToast("Claim declined.", "info");
        initDetails();
      }
    };
  });
}

/* ==========================================================================
   MY REPORTS CONTROLLER
   ========================================================================== */

async function initMine() {
  const grid = document.getElementById("myReportsGrid");
  if (!grid || !requireUser()) return;
  const u = user();
  if (!u) return;

  const mine = getItems().filter((i) => (i.reportedBy || "").toLowerCase() === (u.email || "").toLowerCase());
  clearObjectUrls();
  grid.innerHTML = mine.length
    ? (await Promise.all(mine.map((i) => card(i, true)))).join("")
    : `<div class="empty-state"><div>+</div><h3>No reports yet</h3><p>Create your first lost or found report.</p><a href="report.html?type=lost" class="btn btn-primary">Create report</a></div>`;

  grid.onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const id = b.dataset.id;
    const action = b.dataset.action;
    const items = getItems();
    const idx = items.findIndex((x) => x.id === id && (x.reportedBy || "").toLowerCase() === (u.email || "").toLowerCase());
    if (idx < 0) return;

    if (action === "delete") {
      if (confirm("Delete this report?")) {
        if (items[idx].fileId) await deleteFile(items[idx].fileId);
        items.splice(idx, 1);
        saveItems(items);
        showToast("Report deleted", "info");
        initMine();
      }
    } else if (action === "recover") {
      const isRecovered = items[idx].status === "recovered" || items[idx].status === "claimed" || items[idx].status === "closed";
      items[idx].status = isRecovered ? "active" : "recovered";
      saveItems(items);
      showToast(`Report marked as ${items[idx].status}`, "success");
      initMine();
    } else if (action === "edit") {
      location.href = `report.html?type=${encodeURIComponent(
        items[idx].type
      )}&edit=${encodeURIComponent(id)}`;
    }
  };
}

/* ==========================================================================
   DASHBOARD CONTROLLER
   ========================================================================== */

async function initDashboard() {
  const total = document.getElementById("totalCount");
  if (!total) return;
  if (!requireUser()) return;
  const u = user();
  const x = getItems();
  total.textContent = x.length;
  const lostEl = document.getElementById("lostCount");
  const foundEl = document.getElementById("foundCount");
  const mineEl = document.getElementById("mineCount");
  if (lostEl) lostEl.textContent = x.filter((i) => i.type === "lost").length;
  if (foundEl) foundEl.textContent = x.filter((i) => i.type === "found").length;
  if (mineEl) mineEl.textContent = u ? x.filter((i) => (i.reportedBy || "").toLowerCase() === (u.email || "").toLowerCase()).length : 0;

  const recent = document.getElementById("recentItems");
  if (recent) {
    clearObjectUrls();
    recent.innerHTML = x.length
      ? (await Promise.all(x.slice(0, 3).map((i) => card(i)))).join("")
      : '<div class="empty-state"><h3>No reports yet</h3><p>Be the first to add one.</p></div>';
  }
}

/* ==========================================================================
   NOTIFICATION CENTER & GLOBAL NAV ENHANCEMENTS
   ========================================================================== */

function updateNavNotificationBadge() {
  const u = user();
  const notifBadge = document.getElementById("notifBadge");
  if (!notifBadge || !u) return;
  const unread = getNotifications(u.email).filter((n) => !n.read);
  if (unread.length > 0) {
    notifBadge.textContent = unread.length > 9 ? "9+" : unread.length;
    notifBadge.style.display = "grid";
  } else {
    notifBadge.style.display = "none";
  }
}

function setupGlobalNav() {
  const u = user();
  const navEl = document.querySelector(".nav nav");
  if (!navEl) return;

  // Insert notification center if logged in
  if (u && !document.getElementById("notifNavWrapper")) {
    const notifWrapper = document.createElement("div");
    notifWrapper.id = "notifNavWrapper";
    notifWrapper.className = "nav-notif-wrapper";
    notifWrapper.innerHTML = `
      <button class="notif-btn" id="notifBtn" title="Notifications">
        <span>🔔</span>
        <span class="notif-badge" id="notifBadge" style="display:none;">0</span>
      </button>
      <div class="notif-dropdown" id="notifDropdown">
        <div class="notif-header">
          <h4>Notifications</h4>
          <div>
            <button id="markAllReadBtn">Mark all read</button>
            <span style="color:#cbd5e1; margin:0 4px;">·</span>
            <button id="clearNotifBtn">Clear</button>
          </div>
        </div>
        <div class="notif-list" id="notifList"></div>
      </div>
    `;

    // Insert before the last button or append
    let logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      navEl.insertBefore(notifWrapper, logoutBtn);
    } else {
      navEl.appendChild(notifWrapper);
      logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.className = "btn btn-secondary btn-sm";
      logoutBtn.textContent = "Log out";
      logoutBtn.onclick = () => {
        localStorage.removeItem("lf_currentUser");
        location.href = "index.html";
      };
      navEl.appendChild(logoutBtn);
    }

    const notifBtn = document.getElementById("notifBtn");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifList = document.getElementById("notifList");

    const renderNotifs = () => {
      const userNotifs = getNotifications(u.email);
      if (!userNotifs.length) {
        notifList.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
        return;
      }
      notifList.innerHTML = userNotifs
        .map((n) => `
          <a class="notif-item ${n.read ? "" : "unread"}" href="${esc(n.link || "dashboard.html")}" data-notif-id="${esc(n.id)}">
            <span class="notif-icon">🔔</span>
            <div class="notif-item-body">
              <strong>${esc(n.title)}</strong>
              <p>${esc(n.message)}</p>
              <small>${esc(fmt(new Date(n.createdAt).toISOString()))}</small>
            </div>
          </a>
        `)
        .join("");

      notifList.querySelectorAll(".notif-item").forEach((item) => {
        item.onclick = () => {
          markNotificationRead(item.dataset.notifId);
        };
      });
    };

    if (notifBtn && notifDropdown) {
      notifBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = notifDropdown.classList.contains("show");
        if (!isOpen) {
          renderNotifs();
          notifDropdown.classList.add("show");
        } else {
          notifDropdown.classList.remove("show");
        }
      };

      document.addEventListener("click", (e) => {
        if (!notifWrapper.contains(e.target)) {
          notifDropdown.classList.remove("show");
        }
      });
    }

    document.getElementById("markAllReadBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      markAllNotificationsRead(u.email);
      renderNotifs();
    });

    document.getElementById("clearNotifBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      clearAllNotifications(u.email);
      renderNotifs();
    });

    updateNavNotificationBadge();
  }
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    setupGlobalNav();
    await Promise.all([
      initReport(),
      initItems(),
      initDetails(),
      initMine(),
      initDashboard(),
    ]);
  } catch (err) {
    console.error("Initialization error", err);
  }

  const u = user();
  const name = document.getElementById("userName");
  const av = document.getElementById("avatar");
  if (name && u) {
    name.textContent = (u.name || "there").split(" ")[0];
    if (av) av.textContent = (u.name || "U")[0].toUpperCase();
  }
  const logout = document.getElementById("logoutBtn");
  if (logout) {
    logout.onclick = () => {
      localStorage.removeItem("lf_currentUser");
      location.href = "index.html";
    };
  }
});
