
import { applyTranslations, getLang, setLang } from './i18n.js';
import { db, auth, isConfigured, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, collection, getDocs, doc, setDoc } from './firebase.js';

applyTranslations();

// Language switch in navbar
const langMenu = document.getElementById('langMenu');
if(langMenu){
  langMenu.querySelectorAll('a[data-lang]').forEach(a=>{
    a.addEventListener('click', (e)=>{ e.preventDefault(); setLang(a.dataset.lang); });
  });
}

function currency(v){
  return new Intl.NumberFormat(getLang()==='cs'?'cs-CZ':'en-EU', {style:'currency', currency: 'EUR', maximumFractionDigits: 0}).format(v);
}

async function fetchListings(){
  if(isConfigured && db){
    try{
      const snap = await getDocs(collection(db, 'listings'));
      return snap.docs.map(d=>({ id:d.id, ...d.data() }));
    }catch(e){ console.warn('Firestore error, falling back to local JSON', e); }
  }
  const resp = await fetch('/data/listings.json');
  return await resp.json();
}

function listingCard(item){
  return `
  <div class="col-md-6 col-xl-4">
    <a class="text-decoration-none text-reset" href="/property.html?id=${item.id}">
      <div class="card h-100 property-card shadow-soft">
        <img src="${item.images?.[0]||''}" class="card-img-top" alt="${item.title}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h3 class="h6 m-0">${item.title}</h3>
            <span class="badge bg-light text-dark">${item.type}</span>
          </div>
          <div class="text-muted small">${item.city} • ${item.deal}</div>
          <div class="fw-semibold mt-2">${currency(item.price)}</div>
        </div>
      </div>
    </a>
  </div>`
}

function qsParams(form){ const fd = new FormData(form); return Object.fromEntries(fd.entries()); }

// Home page
(async function(){
  const featuredGrid = document.getElementById('featuredGrid');
  const searchForm = document.getElementById('searchForm');
  if(featuredGrid){
    const items = await fetchListings();
    const featured = items.filter(i=>i.featured);
    featuredGrid.innerHTML = featured.map(listingCard).join('');
  }
  if(searchForm){
    searchForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const p = new URLSearchParams(qsParams(searchForm));
      p.set('lang', getLang());
      window.location.href = '/listings.html?'+p.toString();
    });
  }
})();

// Listings page
(async function(){
  const listGrid = document.getElementById('listGrid');
  const resultCount = document.getElementById('resultCount');
  const form = document.getElementById('filterForm');
  if(listGrid && form){
    const all = await fetchListings();
    const url = new URL(window.location.href);
    for(const [k,v] of url.searchParams.entries()){
      if(form.elements[k]) form.elements[k].value = v;
    }
    function applyFilters(items, params){
      return items.filter(it => {
        if(params.q && !( (it.title||'')+" "+(it.city||'')+" "+(it.address||'') ).toLowerCase().includes(params.q.toLowerCase())) return false;
        if(params.type && it.type !== params.type) return false;
        if(params.deal && it.deal !== params.deal) return false;
        const min = parseFloat(params.min||'');
        const max = parseFloat(params.max||'');
        if(!isNaN(min) && it.price < min) return false;
        if(!isNaN(max) && it.price > max) return false;
        return true;
      });
    }
    function render(){
      const filtered = applyFilters(all, qsParams(form));
      listGrid.innerHTML = filtered.map(listingCard).join('') || `<div class="text-muted" data-i18n="no_results"></div>`;
      resultCount.textContent = `${filtered.length} results`;
      applyTranslations();
    }
    form.addEventListener('submit', (e)=>{ e.preventDefault(); render(); });
    render();
  }
})();

// Property page
(async function(){
  if(document.getElementById('propertyPage')){
    const items = await fetchListings();
    const url = new URL(window.location.href);
    const id = url.searchParams.get('id') || items[0]?.id;
    const item = items.find(i=>i.id===id) || items[0];
    if(!item) return;
    document.getElementById('propTitle').textContent = item.title;
    document.getElementById('propMeta').textContent = `${item.city} • ${item.address} • ${item.area} m² • ${item.beds} bd`;
    document.getElementById('propDesc').textContent = item.description;
    document.getElementById('propPrice').textContent = currency(item.price);
    document.getElementById('propDeal').textContent = item.deal;
    document.getElementById('propType').textContent = item.type;
    document.getElementById('gallery').innerHTML = (item.images||[]).map(src=>`<div class='col-6'><img class='img-fluid rounded' src='${src}' alt='${item.title}'></div>`).join('');
    if(window.L){
      const map = L.map('map').setView([item.lat, item.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
      L.marker([item.lat, item.lng]).addTo(map);
    }
    // Favorites demo (if signed in)
    const saveBtn = document.getElementById('saveBtn');
    if(saveBtn && isConfigured && auth && db){
      onAuthStateChanged(auth, async (u)=>{
        if(u){
          saveBtn.disabled = false;
          saveBtn.addEventListener('click', async ()=>{
            await setDoc(doc(db, 'users', u.uid, 'favorites', item.id), { savedAt: Date.now(), item });
            saveBtn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i> Saved';
          }, { once: true });
        } else {
          saveBtn.addEventListener('click', ()=>{ window.location.href = '/login.html?lang='+getLang(); }, { once: true });
        }
      });
    }
  }
})();

// Auth UI wiring for login page
(async function(){
  const loginForm = document.getElementById('loginForm');
  const googleBtn = document.getElementById('googleBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userBadge = document.getElementById('userBadge');

  if(userBadge && auth){
    onAuthStateChanged(auth, (u)=>{
      if(u){ userBadge.textContent = u.email || 'Account'; userBadge.classList.remove('d-none'); }
    });
  }

  if(loginForm && auth){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = loginForm.querySelector('input[type=email]').value;
      const pass = loginForm.querySelector('input[type=password]').value;
      try { await signInWithEmailAndPassword(auth, email, pass); window.location.href = '/?lang='+getLang(); }
      catch(err){
        // try create
        try { await createUserWithEmailAndPassword(auth, email, pass); window.location.href = '/?lang='+getLang(); }
        catch(e2){ alert('Login failed: '+(err.message||'Unknown')); }
      }
    });
  }
  if(googleBtn && auth){
    googleBtn.addEventListener('click', async ()=>{
      try { await signInWithPopup(auth, new GoogleAuthProvider()); window.location.href='/?lang='+getLang(); }
      catch(err){ alert('Google sign-in failed'); }
    });
  }
  if(logoutBtn && auth){
    logoutBtn.addEventListener('click', async ()=>{ await signOut(auth); window.location.reload(); });
  }
})();
