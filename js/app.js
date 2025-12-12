/* ============================================================
   REDLINK APP.JS — FINAL MERGED VERSION
   Fully working + Mobile menu + iPhone nav fixes + Map fixes
   ============================================================ */

/* ---------------------------
   Shortcut DOM selector
--------------------------- */
const $ = sel => document.querySelector(sel);

/* ---------------------------
   STORAGE WRAPPER
--------------------------- */
const STORE = {
  load() {
    return JSON.parse(localStorage.getItem(window.RedLinkConfig.APP_KEY) || "{}");
  },
  save(obj) {
    localStorage.setItem(window.RedLinkConfig.APP_KEY, JSON.stringify(obj));
  }
};

/* ---------------------------
   ROUTER
--------------------------- */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const pg = $(id);
  if (pg) pg.style.display = "block";
}

function handleRoute() {
  const h = location.hash.replace("#", "");
  if (!h || h === "" || h === "home") return showPage("#page-home");
  if (h === "dashboard") return showPage("#page-dashboard");
  if (h === "find") return showPage("#page-find");
  if (h === "register") return showPage("#page-register");
  if (h === "map") return showPage("#page-map");
}

/* ---------------------------
   AUTH CHECK
--------------------------- */
function checkAuthThenLoad() {
  const u = window.Auth.me();
  if (!u) return $("#authModal").style.display = "flex";
  $("#authModal").style.display = "none";
  initDashboard();
  initFindDonor();
  initRegisterDonor();
  initMap();
}

/* ---------------------------
   DASHBOARD
--------------------------- */
function initDashboard() {
  const store = STORE.load();
  const inv = store.inventory || {};
  const grid = $("#stockGrid");
  if (!grid) return;

  grid.innerHTML = "";

  Object.keys(inv).forEach(b => {
    const card = document.createElement("div");
    card.className = "stock-card";
    card.innerHTML = `
      <div>${b}</div>
      <div class="badge">${inv[b]}</div>
    `;
    grid.appendChild(card);
  });
}

/* ---------------------------
   FIND DONOR
--------------------------- */
function initFindDonor() {
  const btn = $("#searchBtn");
  const results = $("#resultsList");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const bg = $("#searchBlood").value.trim();
    const city = $("#searchCity").value.trim().toLowerCase();
    const name = $("#searchName").value.trim().toLowerCase();
    const showHidden = $("#searchHidden").checked;

    const store = STORE.load();
    const donors = store.donors || [];

    results.innerHTML = "";

    donors.forEach(d => {
      if (!showHidden && d.visible === false) return;

      if (bg && d.blood !== bg) return;
      if (city && !d.city.toLowerCase().includes(city)) return;
      if (name && !d.name.toLowerCase().includes(name)) return;

      const item = document.createElement("div");
      item.className = "result-item";
      item.innerHTML = `
        <div class="result-left">
          <div class="result-name">${d.name}</div>
          <div class="result-sub">${d.city}</div>
          <div class="result-sub">${d.phone}</div>
        </div>
        <button class="btn primary">Request</button>
      `;

      results.appendChild(item);
    });
  });
}

/* ---------------------------
   REGISTER DONOR
--------------------------- */
function initRegisterDonor() {
  const formBtn = $("#registerDonorBtn");
  if (!formBtn) return;

  formBtn.addEventListener("click", () => {
    const name = $("#regName").value.trim();
    const bg = $("#regBlood").value.trim();
    const city = $("#regCity").value.trim();
    const phone = $("#regPhone").value.trim();

    if (!name || !bg || !city || !phone) {
      alert("Please fill all fields.");
      return;
    }

    const store = STORE.load();
    if (!store.donors) store.donors = [];

    store.donors.push({
      id: "d_" + Date.now(),
      name,
      blood: bg,
      city,
      phone,
      visible: true
    });

    STORE.save(store);
    alert("Donor registered successfully.");
  });
}

/* ---------------------------
   MAP (Leaflet)
--------------------------- */
let mapInitialized = false;
function initMap() {
  if (mapInitialized) {
    setTimeout(() => {
      try { if (window._redlinkMap) window._redlinkMap.invalidateSize(); } catch (e) {}
    }, 400);
    return;
  }

  const mapEl = $("#mapContainer");
  if (!mapEl) return;

  const map = L.map("mapContainer").setView([28.6139, 77.2090], 5);
  window._redlinkMap = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

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

  setTimeout(() => {
    try { map.invalidateSize(); } catch (e) {}
  }, 400);
}

/* ---------------------------
   ROUTE LISTENER
--------------------------- */
window.addEventListener("hashchange", () => {
  handleRoute();
  setTimeout(() => {
    try { if (window._redlinkMap) window._redlinkMap.invalidateSize(); } catch (e) {}
  }, 200);
});

/* ---------------------------
   APP INIT
--------------------------- */
window.addEventListener("load", () => {
  window.Auth.seedIfEmpty();
  checkAuthThenLoad();
  handleRoute();
});

/* ============================================================
   MOBILE NAV / MAP FIXES
============================================================ */
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
      try {
        if (window._redlinkMap) window._redlinkMap.invalidateSize();
      } catch (e) {}
    }

    window.addEventListener("orientationchange", () => {
      setTimeout(safeInvalidate, 400);
    });

    window.addEventListener("resize", () => {
      setTimeout(safeInvalidate, 300);
    });

    window.addEventListener("load", () => {
      setTimeout(safeInvalidate, 500);
      setTimeout(safeInvalidate, 1200);
    });

  } catch (e) {}
})();

/* ============================================================
   HAMBURGER MENU — FINAL STABLE VERSION
============================================================ */
(function () {
  try {
    if (!document.querySelector(".hamburger")) {
      const headerInner = document.querySelector(".header-inner");

      const ham = document.createElement("button");
      ham.className = "hamburger";
      ham.innerHTML = '<span class="bar"></span>';

      const right = headerInner.querySelector(".right");
      if (right) headerInner.insertBefore(ham, right);
      else headerInner.appendChild(ham);

      const overlay = document.createElement("div");
      overlay.className = "mobile-menu-overlay";
      overlay.innerHTML =
        '<div class="mobile-menu" role="menu"></div>';

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
          el.innerHTML = `<span>${it.label}</span><span style="opacity:.4">›</span>`;

          if (it.href) {
            el.addEventListener("click", () => {
              if (it.href.includes(".html"))
                location.href = it.href;
              else
                location.hash = it.href;
              closeMenu();
            });
          } else if (it.action === "logout") {
            el.addEventListener("click", () => {
              window.Auth.logout();
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
        document.body.style.overflow = "hidden";
      }

      function closeMenu() {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      }

      ham.addEventListener("click", () => {
        if (overlay.classList.contains("open")) closeMenu();
        else openMenu();
      });

      overlay.addEventListener("click", e => {
        if (e.target === overlay) closeMenu();
      });
    }
  } catch (e) {
    console.warn("Hamburger menu error", e);
  }
})();
