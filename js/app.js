/* js/app.js — fixes: register, logout, profile link, cancel request, search logic and maps */
(function(){
  const C = window.RedLinkConfig || {};
  const APP_KEY = C.APP_KEY || 'redlink_demo_v3';

  function _load(){ try { return JSON.parse(localStorage.getItem(APP_KEY)) || {}; } catch(e){ return {}; } }
  function _save(s){ localStorage.setItem(APP_KEY, JSON.stringify(s)); }
  function uid(){ return 'r'+Math.random().toString(36).slice(2,9); }

  // rotate quotes
  const quotes = (C.QUOTES || []); let qi=0;
  function rotate(){ const q = document.getElementById('quoteBox'); if(q) q.innerText = quotes[qi%quotes.length]||''; qi++; }
  rotate(); setInterval(rotate,60000);

  // ensure seeded
  if(window.Auth && window.Auth.seedIfEmpty) window.Auth.seedIfEmpty();

  // utility: safe query
  function $(s){ return document.querySelector(s); }
  function $all(s){ return Array.from(document.querySelectorAll(s)); }

  // show/hide site depending on auth
  function showSite(authenticated){
    const site = document.getElementById('siteRoot');
    const modal = document.getElementById('authModal');
    const logoutBtn = document.getElementById('logoutHeader');
    const profileBtn = document.getElementById('profileBtn');
    if(authenticated){
      if(site) { site.setAttribute('aria-hidden','false'); site.style.filter='none'; }
      if(modal) modal.style.display='none';
      if(logoutBtn) logoutBtn.style.display='inline-block';
      const u = window.Auth.me();
      if(profileBtn) profileBtn.innerText = u ? u.name : 'Profile';
      initAfterAuth();
    } else {
      if(site) { site.setAttribute('aria-hidden','true'); site.style.filter='blur(2px) grayscale(0.02)'; }
      if(modal) modal.style.display='flex';
      if(logoutBtn) logoutBtn.style.display='none';
      if(profileBtn) profileBtn.innerText = 'Sign In';
    }
  }

  const currentUser = window.Auth && window.Auth.me && window.Auth.me();
  showSite(!!currentUser);

  // login/register UI wiring
  function setupAuthUI(){
    $('#loginBtn').addEventListener('click', function(){
      const id = $('#loginUser').value.trim();
      const pw = $('#loginPass').value.trim();
      if(!id||!pw){ $('#loginMsg').innerText = 'Enter credentials'; return; }
      const res = window.Auth.login(id.toLowerCase(), pw);
      if(!res){ $('#loginMsg').innerText = 'Invalid credentials'; return; }
      $('#loginMsg').innerText = '';
      showSite(true);
    });

    $('#showRegister').addEventListener('click', function(){ $('#registerForm').style.display='block'; });
    $('#showLogin').addEventListener('click', function(){ $('#registerForm').style.display='none'; });

    $('#regBtn').addEventListener('click', function(){
      const name = $('#regName').value.trim();
      const email = $('#regEmail').value.trim().toLowerCase();
      const pass = $('#regPass').value.trim();
      if(!name||!email||!pass){ $('#regMsg').innerText='Fill all fields'; return; }
      try{
        window.Auth.register({ name, email, password: pass });
        $('#regMsg').innerText = 'Account created and logged in.';
        $('#registerForm').style.display='none';
        showSite(true);
      }catch(e){ $('#regMsg').innerText = e.message; }
    });

    // header logout
    $('#logoutHeader').addEventListener('click', function(){
      window.Auth.logout();
      location.reload();
    });
  }

  // after auth initialization
  function initAfterAuth(){
    if(initAfterAuth._done) return; initAfterAuth._done = true;

    // attach UI behavior
    $all('[data-route]').forEach(btn => btn.addEventListener('click', function(){
      $all('.nav-pill').forEach(p=>p.classList.remove('active'));
      this.classList.add('active');
      const route = this.getAttribute('data-route');
      $all('.page').forEach(p => p.style.display = 'none');
      if(route === '#dashboard'){ $('#page-dashboard').style.display='block'; renderStock(); }
      else if(route === '#find'){ $('#page-find').style.display='block'; }
      else if(route === '#register'){ $('#page-register').style.display='block'; }
      else if(route === '#map'){ $('#page-map').style.display='block'; initMap(); }
      else { $('#page-home').style.display='block'; }
    }));

    $('#logo').addEventListener('click', ()=> { $all('.page').forEach(p=>p.style.display='none'); $('#page-home').style.display='block'; $all('.nav-pill').forEach(p=>p.classList.remove('active')); document.querySelector('[data-route="#home"]').classList.add('active'); });

    $('#heroRequest').addEventListener('click', ()=> openRequestModal());
    $('#reqQuick') && $('#reqQuick').addEventListener('click', ()=> openRequestModal());
    $('#openFind') && $('#openFind').addEventListener('click', ()=> { $all('.page').forEach(p=>p.style.display='none'); $('#page-find').style.display='block'; });

    // request modal: create & cancel
    $('#createRequest').addEventListener('click', function(e){
      e.preventDefault();
      const blood = $('#reqBlood').value;
      const city = $('#reqCity').value.trim();
      const patient = $('#reqPatient').value.trim();
      if(!blood || !city){ $('#reqMsg').innerText = 'Blood and city required'; return; }
      const store = _load(); store.requests = store.requests || [];
      const user = (window.Auth && window.Auth.me && window.Auth.me()) || { email:'guest' };
      store.requests.push({ id: uid(), userEmail: user.email, blood, city, patientName: patient||null, status:'pending', created: new Date().toISOString() });
      _save(store);
      $('#reqMsg').innerText = 'Request created (pending)';
      setTimeout(()=>{ $('#requestModal').style.display='none'; $('#reqMsg').innerText=''; updateStats(); },700);
    });
    $('#closeRequest').addEventListener('click', ()=> { $('#requestModal').style.display='none'; $('#reqMsg').innerText=''; });

    // donor register
    $('#donorSubmit').addEventListener('click', function(e){
      e.preventDefault();
      const name = $('#donorName').value.trim();
      const blood = $('#donorBlood').value;
      const phone = $('#donorPhone').value.trim();
      const city = $('#donorCity').value.trim();
      const last = $('#donorLast').value || null;
      if(!name || !blood){ $('#donorMsg').innerText = 'Name and blood are required'; return; }
      if(last){
        const days = (Date.now() - new Date(last).getTime())/(1000*60*60*24);
        if(days < 90){ $('#donorMsg').innerText = 'You must wait at least 90 days after last donation'; return; }
      }
      const s = _load(); s.donors = s.donors || [];
      s.donors.push({ id: uid(), name, blood, phone, city, visible:true, lastDonationDate: last });
      _save(s); $('#donorMsg').innerText = 'Registered as donor'; $('#donorForm').reset(); updateStats();
    });

    $('#donorBack').addEventListener('click', ()=> { $('#page-register').style.display='none'; $('#page-home').style.display='block'; $all('.nav-pill').forEach(p=>p.classList.remove('active')); document.querySelector('[data-route="#home"]').classList.add('active'); });

    // search handler (fixed logic)
    $('#doFind').addEventListener('click', function(e){
      e.preventDefault();
      const blood = $('#findBlood').value.trim().toLowerCase();
      const city = $('#findCity').value.trim().toLowerCase();
      const name = $('#findName').value.trim().toLowerCase();
      const showHidden = $('#showHidden').checked;
      let donors = (_load().donors || []).slice();
      if(!showHidden) donors = donors.filter(d=>d.visible !== false);
      if(blood) donors = donors.filter(d=> (d.blood||'').toLowerCase() === blood);
      if(city) donors = donors.filter(d=> (d.city||'').toLowerCase().includes(city));
      if(name) donors = donors.filter(d=> (d.name||'').toLowerCase().includes(name));
      renderResultsList(donors);
    });

    // allow pressing Enter in find inputs
    ['#findCity','#findName'].forEach(id => { const el = document.querySelector(id); if(el) el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); $('#doFind').click(); } }); });

    // profile button: open profile section or profile.html
    $('#profileBtn').addEventListener('click', function(){
      const u = window.Auth.me();
      if(!u){
        // open modal if not logged in
        $('#authModal').style.display = 'flex';
      } else {
        // navigate to profile area
        $all('.page').forEach(p=>p.style.display='none'); $('#page-profile').style.display='block'; $all('.nav-pill').forEach(p=>p.classList.remove('active'));
        renderProfileSummary();
      }
    });

    // header logout button
    $('#logoutHeader').addEventListener('click', function(){ window.Auth.logout(); location.reload(); });

    // create working profile link on header and profile area
    renderProfileSummary();

    // initial map & stats
    initMiniMap();
    updateStats();
  }

  // helpers: rendering lists/stats
  function renderInventoryPreview(){
    const store = _load(); const inv = store.inventory || C.INITIAL_INVENTORY || {};
    const out = document.getElementById('inventoryPreview'); if(!out) return;
    out.innerHTML = '';
    ['A+','A-','B+','B-','O+','O-','AB+','AB-'].forEach(k=>{
      const c = document.createElement('div'); c.style.display='flex'; c.style.justifyContent='space-between'; c.style.alignItems='center'; c.style.padding='8px'; c.style.borderRadius='8px'; c.style.border='1px solid #f1f3f5'; c.style.background='#fff'; c.innerHTML = `<div>${k}</div><div style="font-weight:800">${inv[k]||0}</div>`;
      out.appendChild(c);
    });
  }

  function renderStock(){
    const store = _load(); const inv = store.inventory || C.INITIAL_INVENTORY || {};
    const grid = document.getElementById('stockGrid'); if(!grid) return;
    grid.innerHTML = '';
    ['A+','A-','B+','B-','O+','O-','AB+','AB-'].forEach(k=>{
      const units = Number(inv[k] || 0);
      const el = document.createElement('div'); el.className='stock-card';
      el.innerHTML = `<div><strong>${k}</strong><div class="muted">Units available</div></div><div class="badge">${units}</div>`;
      grid.appendChild(el);
    });
  }

  function renderDefaultDonors(){
    const store = _load();
    const donors = (store.donors || []).slice();
    renderResultsList(donors.filter(d=>d.visible !== false));
  }

  function renderResultsList(list){
    const out = document.getElementById('findResults'); if(!out) return;
    out.innerHTML = '';
    if(!list.length){ out.innerHTML = '<div class="muted">No donors found</div>'; return; }
    list.forEach(d=>{
      const div = document.createElement('div'); div.className='result-item';
      div.innerHTML = `<div class="result-left"><div class="result-name">${escapeHtml(d.name)} <span class="badge">${escapeHtml(d.blood)}</span></div><div class="result-sub">${escapeHtml(d.city)}</div><div class="result-sub">📱 ${escapeHtml(d.phone)}</div></div><div><button class="btn outline" data-id="${d.id}">Request</button></div>`;
      out.appendChild(div);
      div.querySelector('button').addEventListener('click', ()=> prefillRequest(d));
    });
  }

  function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function prefillRequest(donor){
    openRequestModal();
    $('#reqBlood').value = donor.blood || '';
    $('#reqCity').value = donor.city || '';
    $('#reqPatient').value = donor.name || '';
  }

  function openRequestModal(){ $('#requestModal').style.display='flex'; $('#reqMsg').innerText=''; }

  function updateStats(){ renderInventoryPreview(); renderStock(); const store=_load(); $('#statDonors').innerText = (store.donors||[]).filter(d=>d.visible!==false).length; $('#statPending').innerText = (store.requests||[]).filter(r=>r.status==='pending').length; }

  // mini map on home
  let miniMapInited = false;
  function initMiniMap(){
    try{
      if(miniMapInited) return;
      const el = document.getElementById('miniMap'); if(!el) return;
      const map = L.map(el, { attributionControl:false, zoomControl:false }).setView([22.5937,78.9629],4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      const banks = [
        { name:'AIIMS Blood Bank', loc:[28.5672,77.2100], city:'New Delhi' },
        { name:'KEM Blood Bank', loc:[18.9388,72.8350], city:'Mumbai' },
        { name:'IPGMER Blood Bank', loc:[22.5726,88.3639], city:'Kolkata' },
        { name:'Rajiv Gandhi Blood Bank', loc:[13.0827,80.2707], city:'Chennai' }
      ];
      banks.forEach(b=>{ L.circleMarker(b.loc,{radius:6,fillColor:'#e53935',color:'#fff',weight:0.5}).addTo(map).bindPopup(`<strong>${b.name}</strong><div class="muted">${b.city}</div>`); });
      miniMapInited = true;
    }catch(e){ console.warn('Mini map init failed',e); }
  }

  // full map
  let mapInited=false;
  function initMap(){
    if(mapInited) return;
    const el = document.getElementById('mapContainer'); if(!el) return;
    const map = L.map(el).setView([22.5937,78.9629],5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap contributors' }).addTo(map);
    const banks = [
      { name:'AIIMS Blood Bank', loc:[28.5672,77.2100], city:'New Delhi' },
      { name:'KEM Blood Bank', loc:[18.9388,72.8350], city:'Mumbai' },
      { name:'IPGMER Blood Bank', loc:[22.5726,88.3639], city:'Kolkata' },
      { name:'Rajiv Gandhi Blood Bank', loc:[13.0827,80.2707], city:'Chennai' },
      { name:'PGIMER Blood Bank', loc:[30.7333,76.7794], city:'Chandigarh' }
    ];
    banks.forEach(b=>{ const m = L.marker(b.loc).addTo(map); m.bindPopup(`<strong>${b.name}</strong><div class="muted">${b.city}</div>`); });
    mapInited = true;
  }

  // profile rendering and header state
  function renderProfileSummary(){
    const u = (window.Auth && window.Auth.me && window.Auth.me()) || null;
    const box = document.getElementById('profileBox');
    if(!box) return;
    if(!u){ box.innerHTML = '<div class="muted">Not logged in</div>'; $('#profileBtn').innerText = 'Sign In'; $('#logoutHeader').style.display='none'; }
    else{ box.innerHTML = `<div><strong>${u.name}</strong></div><div class="muted">${u.email}</div><div class="muted">Role: ${u.role}</div>`; $('#profileBtn').innerText = u.name; $('#logoutHeader').style.display='inline-block'; }
  }

  // initial display logic
  (function boot(){
    setupAuthUI();
    const u = window.Auth && window.Auth.me && window.Auth.me();
    if(u){ showSite(true); } else { showSite(false); }
  })();

  // expose refresh
  window.RedLinkApp = { refresh: updateStats };

})();

// == MOBILE NAV / HEADER STABILITY HELPERS ==
// Add this at the end of js/app.js inside the IIFE or globally if file ends in IIFE
(function(){
  try{
    // ensure main nav shown (in case some CSS/JS hid it)
    const nav = document.querySelector('.main-nav');
    if(nav) nav.style.display = 'flex';

    // When orientation changes or viewport resizes, force header/nav layout recalculation
    const ensureHeader = () => {
      const h = document.querySelector('.site-header');
      if(h){
        // small nudge to force reflow
        h.style.transform = 'translateZ(0)';
        setTimeout(()=> { h.style.transform = ''; }, 300);
      }
      if(window._redlinkMap){ // if map exists, invalidate size so it doesn't cover UI
        try { window._redlinkMap.invalidateSize(); } catch(e) {}
      }
    };

    window.addEventListener('orientationchange', () => setTimeout(ensureHeader, 350));
    window.addEventListener('resize', () => setTimeout(ensureHeader, 200));

    // If auth modal is covering header on mobile, make it slightly lower so header remains clickable
    const authModal = document.getElementById('authModal');
    if(authModal){
      authModal.style.paddingTop = '70px'; // pushes modal content down on small screens
      authModal.style.boxSizing = 'border-box';
    }
  }catch(e){ console.warn('Mobile nav helper error', e); }
})();
