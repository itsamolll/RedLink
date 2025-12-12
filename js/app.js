/* ============================================================
   REDLINK APP.JS — FINAL MERGED VERSION (stable release)
   Replace entire js/app.js with this content.
   Note: This file expects window.RedLinkConfig and window.Auth
         to be available (config.js and auth.js present).
   ============================================================ */

/* Tiny selector */
const $ = sel => document.querySelector(sel);

/* STORAGE HELPER */
const STORE = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(window.RedLinkConfig.APP_KEY) || "{}");
    } catch (e) {
      return {};
    }
  },
  save(obj) {
    localStorage.setItem(window.RedLinkConfig.APP_KEY, JSON.stringify(obj));
  }
};

/* ROUTER */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const pg = document.querySelector(id);
  if (pg) pg.style.display = "block";
}

function handleRoute() {
  const h = location.hash.replace("#", "");
  if (!h || h === "" || h === "home") return showPage("#page-home");
  if (h === "dashboard") return showPage("#page-dashboard");
  if (h === "find") return showPage("#page-find");
  if (h === "register") return showPage("#page-register");
  if (h === "map") return showPage("#page-map");
  // fallback
  return showPage("#page-home");
}

/* AUTH CHECK and BOOT */
function bootApp() {
  // seed data if empty
  if (window.Auth && typeof window.Auth.seedIfEmpty === "function") {
    window.Auth.seedIfEmpty();
  }
  // if auth exists, show modal or continue
  const user = window.Auth && window.Auth.me ? window.Auth.me() : null;
  if (!user) {
    const m = document.getElementById("authModal");
    if (m) m.style.display = "flex";
  } else {
    const m = document.getElementById("authModal");
    if (m) m.style.display = "none";
  }
  initAll();
}

/* INITIALIZERS */
function initAll() {
  initHeaderButtons();
  initDashboard();
  initFindDonor();
  initRegisterDonor();
  initMap();
  handleRoute();
}

/* HEADER */
function initHeaderButtons() {
  // logo click
  const logo = document.querySelector(".brand");
  if (logo) logo.addEventListener("click", () => { location.hash = "home"; });

  // profile button link
  const prof = document.querySelector(".profile-btn");
  if (prof) prof.addEventListener("click", () => {
    // go to profile.html
    window.location.href = "profile.html";
  });

  // demo quick-login buttons (if present)
  const q1 = document.querySelector("[data-quick='itsamol']");
  if (q1) q1.addEventListener("click", () => {
    try { window.Auth.login('itsamol','amolsgt'); location.reload(); } catch(e){ console.warn(e); }
  });
  const q2 = document.querySelector("[data-quick='ellinaig']");
  if (q2) q2.addEventListener("click", () => {
    try { window.Auth.login('ellinaig','ellinaig'); location.reload(); } catch(e){ console.warn(e); }
  });
}

/* DASHBOARD */
function initDashboard() {
  const grid = document.getElementById("stockGrid");
  if (!grid) return;
  const store = STORE.load();
  const inv = store.inventory || window.RedLinkConfig.INITIAL_INVENTORY || {};
  grid.innerHTML = "";
  Object.keys(inv).forEach(bg => {
    const c = document.createElement("div");
    c.className = "stock-card";
    c.innerHTML = `<div>${bg}</div><div class="badge">${inv[bg]}</div>`;
    grid.appendChild(c);
  });
}

/* FIND DONOR */
function initFindDonor() {
  const btn = document.getElementById("searchBtn");
  const results = document.getElementById("resultsList");
  if (!btn || !results) return;

  // instant default search: show visible donors
  const doSearch = () => {
    const bg = (document.getElementById("searchBlood") || {}).value || "";
    const city = ((document.getElementById("searchCity") || {}).value || "").toLowerCase();
    const name = ((document.getElementById("searchName") || {}).value || "").toLowerCase();
    const showHidden = !!(document.getElementById("searchHidden") && document.getElementById("searchHidden").checked);

    const store = STORE.load();
    const donors = store.donors || [];
    results.innerHTML = "";

    donors.forEach(d => {
      if (!showHidden && d.visible === false) return;
      if (bg && bg !== "any" && d.blood !== bg) return;
      if (city && !d.city.toLowerCase().includes(city)) return;
      if (name && !d.name.toLowerCase().includes(name)) return;

      const item = document.createElement("div");
      item.className = "result-item";
      item.innerHTML = `
        <div class="result-left">
          <div class="result-name">${d.name}</div>
          <div class="result-sub">${d.blood} • ${d.city}</div>
          <div class="result-sub">📞 ${d.phone}</div>
        </div>
        <div>
          <button class="btn primary" data-id="${d.id}">Request</button>
        </div>
      `;
      results.appendChild(item);
    });
  };

  // initial seed display
  doSearch();

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    doSearch();
  });

  // delegate request button clicks
  results.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const store = STORE.load();
    const donors = store.donors || [];
    const donor = donors.find(x => x.id === id);
    if (!donor) return alert("Donor not found.");
    // prefills request modal (simple)
    const fldBlood = document.getElementById("reqBlood");
    const fldCity = document.getElementById("reqCity");
    const fldPatient = document.getElementById("reqPatient");
    if (fldBlood) fldBlood.value = donor.blood;
    if (fldCity) fldCity.value = donor.city;
    if (fldPatient) fldPatient.value = donor.name;
    const modal = document.getElementById("requestModal");
    if (modal) modal.style.display = "flex";
  });
}

/* REGISTER DONOR */
function initRegisterDonor() {
  const btn = document.getElementById("registerDonorBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const name = (document.getElementById("regName") || {}).value || "";
    const bg = (document.getElementById("regBlood") || {}).value || "";
    const city = (document.getElementById("regCity") || {}).value || "";
    const phone = (document.getElementById("regPhone") || {}).value || "";

    if (!name || !bg || !city || !phone) {
      alert("Please fill all fields.");
      return;
    }

    const store = STORE.load();
    store.donors = store.donors || [];
    const newDonor = { id: "d_" + Date.now(), name, blood: bg, city, phone, visible: true };
    store.donors.push(newDonor);
    STORE.save(store);
    alert("Thanks for registering as a donor. We saved your info.");
    // clear form
    document.getElementById("regName").value = "";
    document.getElementById("regBlood").value = "any";
    document.getElementById("regCity").value = "";
    document.getElementById("regPhone").value = "";
  });
}

/* MAP (Leaflet) */
let mapInitialized = false;
function initMap() {
  const mapEl = document.getElementById("mapContainer");
  if (!mapEl) return;
  if (mapInitialized) {
    setTimeout(() => { try { if (window._redlinkMap) window._redlinkMap.invalidateSize(); } catch (e) {} }, 300);
    return;
  }

  const map = L.map("mapContainer").setView([20.5937, 78.9629], 5);
  window._redlinkMap = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

  const banks = [
    { name: "Delhi Blood Bank", coord: [28.6139, 77.2090] },
    { name: "Mumbai Blood Center", coord: [19.0760, 72.8777] },
    { name: "Kolkata Blood Bank", coord: [22.5726, 88.3639] },
    { name: "Chennai Blood Bank", coord: [13.0827, 80.2707] }
  ];

  banks.forEach(b => {
    L.marker(b.coord).addTo(map).bindPopup(b.name);
  });

  mapInitialized = true;
  setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 400);
}

/* REQUEST modal behavior (simple) */
function bindRequestModal() {
  const modal = document.getElementById("requestModal");
  if (!modal) return;
  const submit = modal.querySelector("[data-action='submit-request']");
  const cancel = modal.querySelector("[data-action='cancel-request']");
  submit && submit.addEventListener("click", () => {
    const blood = (document.getElementById("reqBlood") || {}).value || "";
    const city = (document.getElementById("reqCity") || {}).value || "";
    const patient = (document.getElementById("reqPatient") || {}).value || "";
    if (!blood || !city || !patient) return alert("Please fill required fields.");
    const store = STORE.load();
    store.requests = store.requests || [];
    store.requests.push({ id: "r_" + Date.now(), userEmail: (window.Auth && window.Auth.me && window.Auth.me().email) || "guest", blood, city, patientName: patient, status: "pending", created: new Date().toISOString() });
    STORE.save(store);
    alert("Request saved. Admin will review.");
    modal.style.display = "none";
  });
  cancel && cancel.addEventListener("click", () => { modal.style.display = "none"; });
}

/* ROUTE & LOAD handlers */
window.addEventListener("hashchange", () => {
  handleRoute();
  setTimeout(() => { try { if (window._redlinkMap) window._redlinkMap.invalidateSize(); } catch (e) {} }, 200);
});

window.addEventListener("load", () => {
  // ensure config + auth exist
  try {
    if (!window.RedLinkConfig) {
      console.warn("RedLinkConfig missing.");
    }
    if (window.Auth && typeof window.Auth.seedIfEmpty === "function") {
      window.Auth.seedIfEmpty();
    }
  } catch (e) { console.warn(e); }

  bootApp();
  bindRequestModal();
});

/* =========================
   MOBILE NAV / MAP HELPERS
   (keep these — help iPhone map + header)
   ========================= */
(function () {
  try {
    const nav = document.querySelector(".main-nav");
    if (nav) nav.style.display = "flex";

    const header = document.querySelector(".site-header");
    if (header) {
      header.style.zIndex = 1200;
      header.style.position = "sticky";
      header.style.top = "0";
    }

    function safeInvalidate() {
      try { if (window._redlinkMap && typeof window._redlinkMap.invalidateSize === "function") window._redlinkMap.invalidateSize(); } catch (e) { }
    }

    window.addEventListener("orientationchange", () => setTimeout(safeInvalidate, 400));
    window.addEventListener("resize", () => setTimeout(safeInvalidate, 300));
    window.addEventListener("load", () => { setTimeout(safeInvalidate, 500); setTimeout(safeInvalidate, 1200); });
  } catch (e) { console.warn('mobile helpers', e); }
})();

/* =========================
   HAMBURGER MENU (mobile) — append only
   ========================= */
(function () {
  try {
    if (!document.querySelector(".hamburger")) {
      const headerInner = document.querySelector(".header-inner") || document.querySelector(".site-header") || document.body;

      const ham = document.createElement("button");
      ham.className = "hamburger";
      ham.setAttribute("aria-label", "Open menu");
      ham.innerHTML = '<span class="bar" aria-hidden="true"></span>';

      const right = headerInner.querySelector(".right");
      if (right) headerInner.insertBefore(ham, right);
      else headerInner.appendChild(ham);

      const overlay = document.createElement("div");
      overlay.className = "mobile-menu-overlay";
      overlay.innerHTML = '<div class="mobile-menu" role="menu" aria-label="Mobile menu"></div>';
      document.body.appendChild(overlay);
      const menuContainer = overlay.querySelector(".mobile-menu");

      function buildMenu() {
        menuContainer.innerHTML = "";
        const items = [
          { label: "Home", href: "#home" },
          { label: "Dashboard", href: "#dashboard" },
          { label: "Find Donor", href: "#find" },
          { label: "Register as Donor", href: "#register" },
          { label: "Blood Banks", href: "#map" },
          { label: "Donate", href: "donate.html" },
          { label: "Profile", href: "profile.html" },
          { label: "Logout", action: "logout" }
        ];
        items.forEach(it => {
          const el = document.createElement("div");
          el.className = "menu-item";
          el.tabIndex = 0;
          el.innerHTML = `<span>${it.label}</span><span style="opacity:.4">›</span>`;
          if (it.href) {
            el.addEventListener("click", () => {
              if (it.href.includes(".html")) location.href = it.href;
              else location.hash = it.href;
              closeMenu();
            });
          } else if (it.action === "logout") {
            el.addEventListener("click", () => {
              try { window.Auth && window.Auth.logout && window.Auth.logout(); } catch (err) {}
              closeMenu();
              setTimeout(() => location.reload(), 200);
            });
          }
          menuContainer.appendChild(el);
        });
      }

      function openMenu() {
        buildMenu();
        overlay.classList.add("open");
        ham.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      }

      function closeMenu() {
        overlay.classList.remove("open");
        ham.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }

      ham.addEventListener("click", () => {
        if (overlay.classList.contains("open")) closeMenu(); else openMenu();
      });

      overlay.addEventListener("click", (e) => { if (e.target === overlay) closeMenu(); });
      window.addEventListener("keydown", (e) => { if (e.key === 'Escape') closeMenu(); });
      window.addEventListener("resize", () => { if (window.innerWidth > 720) closeMenu(); });
    }
  } catch (e) { console.warn('hamburger menu error', e); }
})();
