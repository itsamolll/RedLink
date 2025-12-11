/* js/auth.js — improved auth (auto-login after register, reliable token) */
(function(window){
  const C = window.RedLinkConfig || {};
  const APP_KEY = C.APP_KEY || 'redlink_demo_v3';
  const TOKEN_KEY = C.TOKEN_KEY || 'redlink_token_v3';

  function _load(){ try { return JSON.parse(localStorage.getItem(APP_KEY)) || {}; } catch(e){ return {}; } }
  function _save(state){ localStorage.setItem(APP_KEY, JSON.stringify(state)); }
  function _id(){ return 'u'+Math.random().toString(36).slice(2,9); }
  function _encode(obj){ return btoa(JSON.stringify(obj)); }
  function _decode(t){ try { return JSON.parse(atob(t)); } catch(e){ return null; } }

  function seedIfEmpty(){
    const s = _load();
    if(Array.isArray(s.users) && s.users.length) return;
    s.users = (C.DEMO_USERS || []).map(u => ({ id: _id(), name: u.name, email: (u.email||'').toLowerCase(), password: u.password, role: u.role }));
    s.donors = (C.SAMPLE_DONORS || []).map(d => ({ id: d.id || _id(), name: d.name, blood: d.blood, city: d.city, phone: d.phone, visible: d.visible !== false }));
    s.inventory = s.inventory || C.INITIAL_INVENTORY || {};
    s.requests = s.requests || [];
    s.ambulance = s.ambulance || [];
    s.audit = s.audit || [];
    _save(s);
  }

  function login(identifier, password){
    const id = (identifier||'').toString().toLowerCase();
    const s = _load();
    const user = (s.users || []).find(u => u.email.toLowerCase() === id && u.password === password);
    if(!user) return null;
    const payload = { email: user.email, name: user.name, role: user.role, iat: Date.now() };
    localStorage.setItem(TOKEN_KEY, _encode(payload));
    return payload;
  }

  function logout(){ localStorage.removeItem(TOKEN_KEY); }

  function me(){
    const t = localStorage.getItem(TOKEN_KEY); if(!t) return null;
    return _decode(t);
  }

  function register({ name, email, password }){
    if(!name || !email || !password) throw new Error('name,email,password required');
    const s = _load(); s.users = s.users || [];
    if(s.users.find(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email exists');
    const u = { id: _id(), name, email: email.toLowerCase(), password, role: 'user' };
    s.users.push(u); _save(s);
    // auto-login newly created user
    const payload = { email: u.email, name: u.name, role: u.role, iat: Date.now() };
    localStorage.setItem(TOKEN_KEY, _encode(payload));
    return u;
  }

  window.Auth = { seedIfEmpty, login, logout, me, register };

  if(C.AUTO_SEED_IF_EMPTY) seedIfEmpty();
})(window);
