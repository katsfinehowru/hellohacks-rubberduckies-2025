// Local storage key
const STORAGE_KEY = 'wardrobe_items_v3';

// Elements
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
const favToggle = document.getElementById('favToggle');

// Filter state
const filters = { type: '', season: '', style: '', color: '', favoriteOnly: false };

// Storage
let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let editingId = null;

/* ---------- helpers ---------- */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function readFileAsDataURL(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=e=>resolve(e.target.result);
    r.onerror=reject;
    r.readAsDataURL(file);
  });
}

/* ---------- modal open/close ---------- */
function openModalAdd(){
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
function openModalEdit(item){
  editingId = item.id;
  modalTitle.textContent = 'Edit Item';
  imgPreview.src = item.dataUrl || '';
  fileInput.value = '';
  itemName.value = item.name || '';
  itemType.value = item.type || '';
  itemSeason.value = item.season || '';
  itemStyle.value = item.style || '';
  itemColor.value = item.color || '';
  itemFav.checked = !!item.favorite;
  deleteItemBtn.style.display = 'inline-block';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  editingId = null;
}

/* ---------- events ---------- */
// Open/close modal
openUpload.addEventListener('click', openModalAdd);
cancelItem.addEventListener('click', closeModal);
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); });

// Preview
fileInput.addEventListener('change', ()=>{
  const f=fileInput.files[0];
  if(!f) return;
  const r=new FileReader();
  r.onload=e=>{ imgPreview.src = e.target.result; };
  r.readAsDataURL(f);
});

// Save (add/edit)
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

    save();
    render();
    closeModal();
  }catch(err){
    console.error(err);
    alert('Could not save item.');
  }
});

// Delete
deleteItemBtn.addEventListener('click', ()=>{
  if(!editingId) return;
  if(!confirm('Delete this item?')) return;
  items = items.filter(i=>i.id!==editingId);
  save();
  render();
  closeModal();
});

/* ---------- filter UI wiring ---------- */
// Chip click: single-select per group, toggle off if clicking the active one
document.querySelectorAll('.chip-row').forEach(row=>{
  row.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chip');
    if(!btn) return;
    const group = row.dataset.group;           // 'type' | 'season' | 'style' | 'color'
    const value = btn.dataset.value;

    // toggle logic
    if(btn.classList.contains('active')){
      btn.classList.remove('active');
      filters[group] = '';
    }else{
      // clear others in this group
      row.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      filters[group] = value;
    }
    render();
  });
});

// Favorites-only toggle
favToggle.addEventListener('click', ()=>{
  favToggle.classList.toggle('active');
  filters.favoriteOnly = favToggle.classList.contains('active');
  favToggle.textContent = filters.favoriteOnly ? '♥' : '♡';
  render();
});

/* ---------- render ---------- */
function matchesFilters(item){
  if(filters.type && item.type !== filters.type) return false;
  if(filters.season && item.season !== filters.season) return false;
  if(filters.style && item.style !== filters.style) return false;
  if(filters.color && item.color !== filters.color) return false;
  if(filters.favoriteOnly && !item.favorite) return false;
  return true;
}

function badge(text){
  const b=document.createElement('span');
  b.className='badge';
  b.textContent=text;
  return b;
}

function render(){
  gallery.innerHTML = '';
  const filtered = items.filter(matchesFilters);

  if(filtered.length===0){
    const empty = document.createElement('div');
    empty.style.color='#666'; empty.style.padding='14px';
    empty.textContent = items.length ? 'No items match your filters.' : 'No items yet — tap the camera to add one.';
    gallery.appendChild(empty);
    return;
  }

  filtered.forEach(item=>{
    const card = document.createElement('div');
    card.className = 'card';

    // favorite pin
    if(item.favorite){
      const pin = document.createElement('div');
      pin.className = 'fav-pin';
      pin.textContent = '♥';
      card.appendChild(pin);
    }

    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = item.dataUrl;
    img.alt = item.name || 'Wardrobe item';
    card.appendChild(img);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'small-btn'; editBtn.title='Edit'; editBtn.textContent='✎';
    const delBtn = document.createElement('button');
    delBtn.className = 'small-btn'; delBtn.title='Delete'; delBtn.textContent='🗑';
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    card.appendChild(actions);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = item.name || item.type || 'Item';
    const badges = document.createElement('div');
    badges.className = 'badges';
    if(item.type) badges.appendChild(badge(item.type));
    if(item.season) badges.appendChild(badge(item.season));
    if(item.style) badges.appendChild(badge(item.style));
    if(item.color) badges.appendChild(badge(item.color));
    meta.appendChild(badges);
    card.appendChild(meta);

    // interactions
    editBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openModalEdit(item); });
    delBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(!confirm('Delete this item?')) return;
      items = items.filter(i=>i.id!==item.id); save(); render();
    });
    card.addEventListener('click', ()=>openModalEdit(item));

    gallery.appendChild(card);
  });
}

/* ---------- init ---------- */
render();




