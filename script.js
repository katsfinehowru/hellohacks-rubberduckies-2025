// Storage key
const STORAGE_KEY = 'wardrobe_simple_v1';

// DOM
const gallery = document.getElementById('gallery');
const openUpload = document.getElementById('openUpload');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const fileInput = document.getElementById('fileInput');
const imgPreview = document.getElementById('imgPreview');
const itemName = document.getElementById('itemName');
const itemType = document.getElementById('itemType');
const itemSeason = document.getElementById('itemSeason');
const itemStyle = document.getElementById('itemStyle');
const itemColor = document.getElementById('itemColor');
const itemFav = document.getElementById('itemFav');
const saveItem = document.getElementById('saveItem');
const cancelItem = document.getElementById('cancelItem');
const deleteItemBtn = document.getElementById('deleteItem');

const categorySelect = document.getElementById('categorySelect');
const chipRow = document.getElementById('chipRow');
const favToggle = document.getElementById('favToggle');

// Data
let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let editingId = null;

// Filter state
const filters = { type:'', season:'', style:'', color:'', favoriteOnly:false };
let activeGroup = 'type';

// Options for chips
const OPTIONS = {
  type:   ['top','bottom','dress','outerwear','accessory'],
  season: ['spring','summer','fall','winter'],
  style:  ['casual','street','elegant','sporty'],
  color:  ['white','black','blue','beige','other']
};

const cap = s => s ? s[0].toUpperCase()+s.slice(1) : s;

/* ---------- Chip row ---------- */
function renderChipRow(){
  chipRow.innerHTML = '';
  OPTIONS[activeGroup].forEach(v=>{
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.value = v;
    b.textContent = cap(v);
    if(filters[activeGroup] === v) b.classList.add('active');
    b.addEventListener('click', ()=>{
      if(filters[activeGroup] === v){ filters[activeGroup] = ''; b.classList.remove('active'); }
      else { filters[activeGroup] = v; chipRow.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); b.classList.add('active'); }
      render();
    });
    chipRow.appendChild(b);
  });
}

/* ---------- Modal ---------- */
function openAdd(){
  editingId = null;
  modalTitle.textContent = 'Add Item';
  fileInput.value = '';
  imgPreview.src = '';
  itemName.value = '';
  itemType.value = '';
  itemSeason.value = '';
  itemStyle.value = '';
  itemColor.value = '';
  itemFav.checked = false;
  deleteItemBtn.style.display = 'none';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function openEdit(it){
  editingId = it.id;
  modalTitle.textContent = 'Edit Item';
  imgPreview.src = it.dataUrl || '';
  fileInput.value = '';
  itemName.value = it.name || '';
  itemType.value = it.type || '';
  itemSeason.value = it.season || '';
  itemStyle.value = it.style || '';
  itemColor.value = it.color || '';
  itemFav.checked = !!it.favorite;
  deleteItemBtn.style.display = 'inline-block';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  editingId = null;
}

/* ---------- Events ---------- */
openUpload.addEventListener('click', openAdd);
cancelItem.addEventListener('click', closeModal);
modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

fileInput.addEventListener('change', ()=>{
  const f=fileInput.files[0];
  if(!f) return;
  const r=new FileReader();
  r.onload = e => imgPreview.src = e.target.result;
  r.readAsDataURL(f);
});

saveItem.addEventListener('click', async ()=>{
  try{
    let dataUrl = imgPreview.src || '';
    if(fileInput.files && fileInput.files[0]){
      dataUrl = await readFileAsDataURL(fileInput.files[0]);
    }
    if(!dataUrl){ alert('Please choose an image.'); return; }

    const payload = {
      name: itemName.value.trim(),
      type: itemType.value,
      season: itemSeason.value,
      style: itemStyle.value,
      color: itemColor.value,
      favorite: itemFav.checked,
      dataUrl
    };

    if(editingId){
      const idx = items.findIndex(i=>i.id===editingId);
      if(idx>=0) items[idx] = { ...items[idx], ...payload, updated: Date.now() };
    }else{
      items.unshift({ id: uid(), ...payload, created: Date.now() });
    }
    save(); render(); closeModal();
  }catch(e){ console.error(e); alert('Could not save.'); }
});

deleteItemBtn.addEventListener('click', ()=>{
  if(!editingId) return;
  if(!confirm('Delete this item?')) return;
  items = items.filter(i=>i.id!==editingId);
  save(); render(); closeModal();
});

// Category select -> update chip row
categorySelect.addEventListener('change', ()=>{
  activeGroup = categorySelect.value;
  renderChipRow();
});

// Favorite toggle
favToggle.addEventListener('click', ()=>{
  const on = favToggle.classList.toggle('active');
  favToggle.textContent = on ? '♥' : '♡';
  favToggle.setAttribute('aria-pressed', String(on));
  filters.favoriteOnly = on;
  render();
});

/* ---------- Helpers ---------- */
function readFileAsDataURL(file){
  return new Promise((res, rej)=>{
    const r=new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

/* ---------- Filtering + Render ---------- */
function matches(it){
  if(filters.type && it.type !== filters.type) return false;
  if(filters.season && it.season !== filters.season) return false;
  if(filters.style && it.style !== filters.style) return false;
  if(filters.color && it.color !== filters.color) return false;
  if(filters.favoriteOnly && !it.favorite) return false;
  return true;
}

function render(){
  gallery.innerHTML = '';
  const list = items.filter(matches);

  if(list.length === 0){
    const msg = document.createElement('div');
    msg.style.color = '#666'; msg.style.padding = '8px';
    msg.textContent = items.length ? 'No items match your filters.' : 'No items yet — press + to add.';
    gallery.appendChild(msg);
    return;
  }

  list.forEach(it=>{
    const card = document.createElement('div'); card.className = 'card';

    if(it.favorite){
      const pin = document.createElement('div');
      pin.className = 'pin'; pin.textContent = '♥';
      card.appendChild(pin);
    }

    const img = document.createElement('img');
    img.src = it.dataUrl; img.alt = it.name || 'Wardrobe item';
    card.appendChild(img);

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = it.name || [it.type, it.style, it.color].filter(Boolean).map(cap).join(' • ') || 'Item';
    card.appendChild(name);

    const icons = document.createElement('div'); icons.className = 'icons';
    const edit = document.createElement('button'); edit.className = 'icon'; edit.title = 'Edit'; edit.textContent = '✎';
    const del = document.createElement('button'); del.className = 'icon'; del.title = 'Delete'; del.textContent = '🗑';
    icons.appendChild(edit); icons.appendChild(del); card.appendChild(icons);

    edit.addEventListener('click', (e)=>{ e.stopPropagation(); openEdit(it); });
    del.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(!confirm('Delete this item?')) return;
      items = items.filter(x=>x.id!==it.id); save(); render();
    });

    card.addEventListener('click', ()=>openEdit(it));
    gallery.appendChild(card);
  });
}

/* ---------- Init ---------- */
renderChipRow();
render();




