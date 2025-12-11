/* js/admin.js — admin helpers for static demo (shared store) */
(function(window){
  const C = window.RedLinkConfig || {};
  const APP_KEY = C.APP_KEY || 'redlink_demo_v3';

  function _load(){ try { return JSON.parse(localStorage.getItem(APP_KEY)) || {}; } catch(e){ return {}; } }
  function _save(state){ localStorage.setItem(APP_KEY, JSON.stringify(state)); }

  function getInventory(){ const s=_load(); return s.inventory || {}; }
  function updateInventory(group, delta, who, reason){
    const s=_load(); s.inventory = s.inventory || {}; s.inventory[group] = Math.max(0, (s.inventory[group] || 0) + Number(delta));
    s.audit = s.audit || []; s.audit.push({ id: 'a'+Math.random().toString(36).slice(2,8), who: who || 'admin', group, delta: Number(delta), reason: reason || 'manual', when: new Date().toISOString() });
    _save(s);
  }

  function getPendingRequests(){ const s=_load(); return (s.requests || []).filter(r => r.status === 'pending'); }

  function setRequestStatus(id, status){
    const s=_load(); s.requests = s.requests || []; const idx = s.requests.findIndex(r => r.id === id); if(idx === -1) return false;
    const req = s.requests[idx];
    if(status === 'approved'){
      const grp = req.blood;
      if((s.inventory || {})[grp] > 0){
        s.inventory[grp] = Math.max(0, s.inventory[grp] - 1);
        req.status = 'approved'; req.processedAt = new Date().toISOString(); req.processedBy = (window.Auth && window.Auth.me && window.Auth.me().email) || 'admin';
        s.audit = s.audit || []; s.audit.push({ id: 'a'+Math.random().toString(36).slice(2,8), who: 'admin', group: grp, delta: -1, reason: 'approved_request', when: new Date().toISOString() });
        _save(s); return true;
      } else {
        return false;
      }
    } else {
      req.status = 'rejected'; req.processedAt = new Date().toISOString(); req.processedBy = (window.Auth && window.Auth.me && window.Auth.me().email) || 'admin';
      _save(s); return true;
    }
  }

  function getAmbulance(){ const s=_load(); return s.ambulance || []; }

  window.AdminModule = { getInventory, updateInventory, getPendingRequests, setRequestStatus, getAmbulance };
})(window);
