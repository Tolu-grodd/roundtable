import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc,
         updateDoc, onSnapshot, writeBatch, serverTimestamp, query, orderBy, where }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { firebaseConfig, ADMIN_EMAIL } from './firebase-config.js';

/* Inline icon set (Lucide-style, inherits color + size) */
const _S='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const SVG={
  edit:_S+'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash:_S+'<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  check:_S+'<path d="M20 6 9 17l-5-5"/></svg>',
  checkCircle:_S+'<path d="M21.8 10A10 10 0 1 1 17 3.34"/><path d="m9 11 3 3L22 4"/></svg>',
  x:_S+'<path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>',
  clock:_S+'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  play:_S+'<polygon points="6 3 20 12 6 21 6 3"/></svg>',
  arrowRight:_S+'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  target:_S+'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  gamepad:_S+'<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>',
  vote:_S+'<path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5z"/><path d="M22 19H2"/></svg>',
  history:_S+'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
  volume:_S+'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  volumeOff:_S+'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M22 9l-6 6"/><path d="M16 9l6 6"/></svg>',
  eye:_S+'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  shield:_S+'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  user:_S+'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  mail:_S+'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  clipboard:_S+'<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>'
};
window.SVG=SVG;


const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

// ── State ──────────────────────────────────────────────────────────────────
let currentUser=null, topics=[], votes={}, myVotes=new Set();
let votingMode='single', editingId=null, chart=null;
let unsubTopics=null, unsubVotes=null, unsubSettings=null, unsubNudge=null, unsubMe=null, nudgeInit=false;
let chartTopics=[];
let openMenuId=null, lastVoteSnap=null, allMembers=[];

const PALETTE=[
  '#059669','#7C3AED','#D97706','#0891B2','#DC2626',
  '#65A30D','#9333EA','#0284C7','#EA580C','#047857',
  '#4F46E5','#BE185D','#0E7490','#B45309','#166534',
  '#C2410C','#1D4ED8','#4D7C0F','#6D28D9','#92400E',
  '#7E22CE','#0369A1','#BE123C','#1E40AF','#0F766E'
];
const color  = i => PALETTE[i % PALETTE.length];
const letter = i => String.fromCharCode(65+i);
const esc    = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── Auth ───────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const ref=doc(db,'allowed_emails',ADMIN_EMAIL);
  const s=await getDoc(ref);
  if(!s.exists()) await setDoc(ref,{name:'Admin',role:'admin',addedAt:serverTimestamp()});
}

async function login() {
  const emailEl=document.getElementById('login-email');
  const errorEl=document.getElementById('login-error');
  const btn=document.querySelector('.login-btn');
  const email=emailEl.value.trim().toLowerCase();
  if(!email.includes('@')){ emailEl.classList.add('shake'); setTimeout(()=>emailEl.classList.remove('shake'),400); return; }
  btn.textContent='Checking…'; btn.disabled=true; errorEl.textContent='';
  try {
    const snap=await getDoc(doc(db,'allowed_emails',email));
    if(!snap.exists()){ errorEl.textContent='Email not authorised. Contact your admin.'; btn.innerHTML='Continue '+SVG.arrowRight; btn.disabled=false; return; }
    const data=snap.data();
    currentUser={email,name:data.name||email.split('@')[0],role:data.role||'member'};
    localStorage.setItem('roundtable_user',JSON.stringify(currentUser));
    startApp();
  } catch(e){ errorEl.textContent='Connection error, try again.'; btn.innerHTML='Continue '+SVG.arrowRight; btn.disabled=false; }
}

function logout() {
  stopPresence(); stopPresenceWatch();
  if(unsubMe) unsubMe();
  if(unsubTopics) unsubTopics();
  if(unsubVotes)  unsubVotes();
  if(unsubSettings) unsubSettings();
  if(unsubNudge) unsubNudge();
  localStorage.removeItem('roundtable_user');
  currentUser=null; topics=[]; votes={}; myVotes=new Set(); lastVoteSnap=null; votingMode='single';
  // Reset all admin-only UI
  document.getElementById('admin-badge').style.display='none';
  document.getElementById('admin-controls').style.display='none';
  document.getElementById('voting-mode-bar').style.display='none';
  document.getElementById('tab-members').style.display='none';
  document.getElementById('header-user').textContent='';
  // Reset chart
  if(chart){ chart.destroy(); chart=null; }
  // Reset lists
  document.getElementById('topic-list').innerHTML=SKEL;
  document.getElementById('vote-list').innerHTML='';
  document.getElementById('history-list').innerHTML='';
  document.getElementById('member-list').innerHTML='';
  document.getElementById('stat-votes').textContent='0';
  document.getElementById('stat-leader').textContent='-';
  document.documentElement.setAttribute('data-theme','light');
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-email').value='';
  const btn=document.querySelector('.login-btn'); btn.innerHTML='Continue '+SVG.arrowRight; btn.disabled=false;
  switchTab('topics');
}

// ── App boot ───────────────────────────────────────────────────────────────
function startApp() {
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
  applyAdminUI();
  const hu=document.getElementById('header-user'); if(hu) hu.textContent=currentUser.name;
  applyTheme();

  unsubSettings=onSnapshot(doc(db,'settings','voting'),snap=>{
    const mode=snap.exists()?(snap.data().mode||'single'):'single';
    votingMode=mode;
    document.getElementById('mode-single')?.classList.toggle('active',mode==='single');
    document.getElementById('mode-multi')?.classList.toggle('active',mode==='multi');
    renderVote();
  },err=>console.error(err));

  unsubTopics=onSnapshot(query(collection(db,'topics'),orderBy('createdAt','asc')),snap=>{
    topics=snap.docs.map(d=>({id:d.id,...d.data()}));
    updateSessionCount(); renderTopics(); recomputeVotes(); renderHistory();
  },err=>console.error(err));

  unsubVotes=onSnapshot(collection(db,'votes'),snap=>{
    lastVoteSnap=snap; recomputeVotes();
  },err=>console.error(err));
  startPresence();
  loadAllMembers();
  if(unsubMe) unsubMe();
  unsubMe=onSnapshot(doc(db,'allowed_emails',currentUser.email),snap=>{
    if(!snap.exists()) return;
    const d=snap.data(); let changed=false;
    if(d.role && d.role!==currentUser.role){ currentUser.role=d.role; changed=true; }
    if(d.name && d.name!==currentUser.name){ currentUser.name=d.name; const hu=document.getElementById('header-user'); if(hu) hu.textContent=currentUser.name; changed=true; }
    if(changed){ try{ localStorage.setItem('roundtable_user',JSON.stringify(currentUser)); }catch(e){} applyAdminUI(); }
  },err=>{});

  nudgeInit=false;
  unsubNudge=onSnapshot(doc(db,'settings','nudge'),snap=>{
    if(!nudgeInit){ nudgeInit=true; return; }
    if(!snap.exists()) return;
    const voted=lastVoteSnap?.docs?.some(x=>x.id===currentUser?.email);
    if(!voted) showNudgePopup(snap.data().by||'');
  },err=>console.error(err));
}

// ── Vote computation ───────────────────────────────────────────────────────
function recomputeVotes() {
  const activeIds=new Set(topics.filter(t=>!t.discussed).map(t=>t.id));
  votes={}; myVotes=new Set();
  if(lastVoteSnap) {
    lastVoteSnap.docs.forEach(d=>{
      const data=d.data();
      const ids=data.topicIds||(data.topicId?[data.topicId]:[]);
      ids.forEach(tid=>{ if(activeIds.has(tid)) votes[tid]=(votes[tid]||0)+1; });
      if(d.id===currentUser?.email) ids.forEach(tid=>{ if(activeIds.has(tid)) myVotes.add(tid); });
    });
  }
  renderVote(); renderPending();
}

async function loadAllMembers(){
  try{ const s=await getDocs(collection(db,'allowed_emails')); allMembers=s.docs.map(d=>({email:d.id,...d.data()})); renderPending(); }catch(e){}
}
function renderPending(){
  const el=document.getElementById('pending-voters'); if(!el) return;
  const active=topics.filter(t=>!t.discussed);
  if(!allMembers.length || !active.length){ el.style.display='none'; return; }
  const activeIds=new Set(active.map(t=>t.id));
  const voted=new Set();
  if(lastVoteSnap){ lastVoteSnap.docs.forEach(d=>{ const data=d.data(); const ids=data.topicIds||(data.topicId?[data.topicId]:[]); if(ids.some(tid=>activeIds.has(tid))) voted.add(d.id); }); }
  const pending=allMembers.filter(m=>!voted.has(m.email));
  el.style.display='block';
  if(!pending.length){ el.innerHTML='<div class="pending-done">'+SVG.check+' Everyone has voted, thank you</div>'; return; }
  el.innerHTML='<div class="pending-head">Please, we need your vote</div><div class="pending-list">'+pending.map(m=>'<span class="pending-chip">'+esc(m.name||m.email)+'</span>').join('')+'</div>';
}

// ── Topics ─────────────────────────────────────────────────────────────────
async function addTopic() {
  const inp=document.getElementById('add-input'), ctx=document.getElementById('add-context');
  const text=inp.value.trim(); if(!text){ inp.focus(); return; }
  const id='topic_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  try {
    await setDoc(doc(db,'topics',id),{
      text,context:ctx.value.trim(),discussed:false,
      createdAt:serverTimestamp(),addedBy:currentUser.email,addedByName:currentUser.name
    });
    inp.value=''; ctx.value=''; autoGrow(ctx); inp.focus(); toast('Topic added ✓');
  } catch(e){ toast('Error adding topic'); }
}

async function deleteTopic(id) {
  if(currentUser.role!=='admin') return;
  try { await deleteDoc(doc(db,'topics',id)); toast('Topic removed'); } catch(e){ toast('Error'); }
}

async function markDiscussed(id) {
  if(currentUser.role!=='admin') return;
  const voteCount=votes[id]||0;
  const uniqueVoters=lastVoteSnap?lastVoteSnap.docs.length:0;
  const pct=uniqueVoters>0?Math.round(voteCount/uniqueVoters*100):0;
  try {
    await updateDoc(doc(db,'topics',id),{
      discussed:true,discussedAt:serverTimestamp(),
      finalVotes:voteCount,finalTotalVoters:uniqueVoters,finalPct:pct
    });
    toast('Marked as discussed ✓');
  } catch(e){ toast('Error'); }
}

function openEdit(id) {
  const t=topics.find(x=>x.id===id); if(!t) return;
  editingId=id;
  document.getElementById('edit-input').value=t.text;
  document.getElementById('edit-context').value=t.context||''; autoGrow(document.getElementById('edit-context'));
  const aRow=document.getElementById('edit-addedby-row');
  if(aRow){ aRow.style.display=currentUser?.role==='admin'?'block':'none'; document.getElementById('edit-addedby').value=t.addedByName||t.addedBy||''; }
  document.getElementById('edit-overlay').style.display='block';
  document.getElementById('edit-modal').style.display='block';
  document.getElementById('edit-input').focus();
}
function closeEdit() {
  editingId=null;
  document.getElementById('edit-overlay').style.display='none';
  document.getElementById('edit-modal').style.display='none';
}
async function saveEdit() {
  const text=document.getElementById('edit-input').value.trim();
  if(!text||!editingId) return;
  const updates={text,context:document.getElementById('edit-context').value.trim()};
  if(currentUser?.role==='admin'){ const ab=document.getElementById('edit-addedby').value.trim(); if(ab) updates.addedByName=ab; }
  try { await updateDoc(doc(db,'topics',editingId),updates); closeEdit(); toast('Updated ✓'); } catch(e){ toast('Error'); }
}

// ── Voting ─────────────────────────────────────────────────────────────────
async function castVote(topicId) {
  if(!currentUser) return;
  const ref=doc(db,'votes',currentUser.email);
  try {
    if(votingMode==='single') {
      if(myVotes.has(topicId)) { await deleteDoc(ref); }
      else { await setDoc(ref,{email:currentUser.email,name:currentUser.name,topicIds:[topicId],votedAt:serverTimestamp()}); }
    } else {
      const next=myVotes.has(topicId)?[...myVotes].filter(id=>id!==topicId):[...myVotes,topicId];
      if(next.length===0) { await deleteDoc(ref); }
      else { await setDoc(ref,{email:currentUser.email,name:currentUser.name,topicIds:next,votedAt:serverTimestamp()}); }
    }
  } catch(e){ toast('Error casting vote'); }
}

async function setVotingMode(mode) {
  if(currentUser.role!=='admin') return;
  try {
    await setDoc(doc(db,'settings','voting'),{mode,updatedAt:serverTimestamp(),updatedBy:currentUser.email});
    if(mode==='single'){
      const snap=await getDocs(collection(db,'votes'));
      const batch=writeBatch(db); let trimmed=0;
      snap.forEach(d=>{ const v=d.data(); const ids=v.topicIds||(v.topicId?[v.topicId]:[]); if(ids.length>1){ batch.update(d.ref,{topicIds:[ids[0]]}); trimmed++; } });
      if(trimmed) await batch.commit();
    }
    toast(mode==='single'?'Single-pick mode set ✓':'Multi-pick mode set ✓');
  } catch(e){ toast('Error'); }
}

function confirmClearVotes()  { document.getElementById('clear-confirm').style.display='flex'; }
function dismissClearVotes()  { document.getElementById('clear-confirm').style.display='none'; }
async function executeClearVotes() {
  if(currentUser.role!=='admin') return;
  try {
    const snap=await getDocs(collection(db,'votes'));
    const batch=writeBatch(db);
    snap.docs.forEach(d=>batch.delete(d.ref));
    await batch.commit(); dismissClearVotes(); toast('Votes cleared for new week ✓');
  } catch(e){ toast('Error clearing votes'); }
}

// ── Members ────────────────────────────────────────────────────────────────
async function nudgeNonVoters(){
  try{ await setDoc(doc(db,'settings','nudge'),{at:serverTimestamp(),by:currentUser?.name||''}); toast('Nudge sent to non-voters'); closeTurnout(); }
  catch(e){ console.error(e); toast('Could not send nudge'); }
}
function showNudgePopup(by){
  const o=document.getElementById('nudge-overlay'), m=document.getElementById('nudge-modal'), sub=document.getElementById('nudge-sub');
  if(sub) sub.textContent='We are waiting on your vote, it only takes a moment.';
  if(o) o.style.display='block'; if(m) m.style.display='block';
  try{ sfx('select'); }catch(e){}
}
function closeNudge(){ const o=document.getElementById('nudge-overlay'), m=document.getElementById('nudge-modal'); if(o)o.style.display='none'; if(m)m.style.display='none'; }
function goVoteFromNudge(){ closeNudge(); switchTab('vote'); }
window.nudgeNonVoters=nudgeNonVoters; window.closeNudge=closeNudge; window.goVoteFromNudge=goVoteFromNudge;
async function showTurnout(){
  const body=document.getElementById('turnout-body');
  document.getElementById('turnout-overlay').style.display='block';
  document.getElementById('turnout-modal').style.display='block';
  body.innerHTML='<div class="spinner"></div>';
  const _tn=document.getElementById('turnout-nudge'); if(_tn) _tn.style.display='none';
  try{
    const [memSnap,voteSnap]=await Promise.all([getDocs(collection(db,'allowed_emails')),getDocs(collection(db,'votes'))]);
    const members=memSnap.docs.map(d=>({email:d.id,...d.data()}));
    const activeIds=new Set((topics||[]).filter(t=>!t.discussed).map(t=>t.id));
    const voted=new Set();
    voteSnap.docs.forEach(d=>{ const data=d.data(); const ids=data.topicIds||(data.topicId?[data.topicId]:[]); if(ids.some(tid=>activeIds.has(tid))) voted.add(d.id); });
    const nonVoters=members.filter(m=>!voted.has(m.email));
    const votedCount=voted.size;
    const colorFor=e=>PALETTE[Math.abs([...e].reduce((hh,c)=>((hh<<5)-hh+c.charCodeAt(0))|0,0))%PALETTE.length];
    const initials=s=>String(s).split(/[ .@]/).filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase();
    if(!members.length){ body.innerHTML='<p style="color:var(--text-muted);text-align:center;padding:24px 0">No members added yet.</p>'; return; }
    if(!nonVoters.length){
      body.innerHTML=`<div style="text-align:center;padding:20px 0"><div style="font-size:48px">\ud83c\udf89</div><div style="font-size:18px;font-weight:800;color:var(--success);margin-top:8px">Everyone has voted!</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">All ${members.length} members are in.</div></div>`;
      return;
    }
    body.innerHTML=`<div class="turnout-stat"><div class="turnout-num">${nonVoters.length}</div><div class="turnout-stat-lbl">${nonVoters.length===1?"person hasn't":"people haven't"} voted \u00b7 ${votedCount}/${members.length} in</div></div><div class="turnout-list">`
      +nonVoters.map(m=>`<div class="turnout-row"><div class="turnout-av" style="background:${colorFor(m.email)}">${initials(m.name||m.email)}</div><div style="flex:1;min-width:0"><div class="turnout-name">${esc(m.name||m.email)}</div><div class="turnout-email">${esc(m.email)}</div></div><span class="turnout-tag">Not voted</span></div>`).join('')
      +`</div>`;
    if(_tn) _tn.style.display='block';
  }catch(e){ console.error(e); body.innerHTML='<p style="color:var(--danger);text-align:center;padding:24px 0">Could not load turnout.</p>'; }
}
function closeTurnout(){ document.getElementById('turnout-overlay').style.display='none'; document.getElementById('turnout-modal').style.display='none'; }
window.showTurnout=showTurnout; window.closeTurnout=closeTurnout;
let presenceBeat=null, presenceMap={}, unsubPresence=null, presenceTick=null;
function _beat(){ if(!currentUser) return; setDoc(doc(db,'presence',currentUser.email),{lastActive:serverTimestamp(),name:currentUser.name},{merge:true}).catch(()=>{}); }
function _presVis(){ if(document.visibilityState==='visible') _beat(); }
let _lastActive=Date.now(); function _markAct(){ _lastActive=Date.now(); }
function startPresence(){ _beat(); if(presenceBeat) clearInterval(presenceBeat); presenceBeat=setInterval(()=>{ if(document.visibilityState==='visible' && (Date.now()-_lastActive<180000)) _beat(); },30000); document.addEventListener('visibilitychange',_presVis); ['pointerdown','keydown','touchstart','scroll','mousemove'].forEach(ev=>window.addEventListener(ev,_markAct,{passive:true})); }
function stopPresence(){ if(presenceBeat){ clearInterval(presenceBeat); presenceBeat=null; } document.removeEventListener('visibilitychange',_presVis); ['pointerdown','keydown','touchstart','scroll','mousemove'].forEach(ev=>window.removeEventListener(ev,_markAct)); try{ if(currentUser) deleteDoc(doc(db,'presence',currentUser.email)); }catch(e){} }
function updatePresenceDots(){ const now=Date.now(); document.querySelectorAll('#member-list .pres-dot').forEach(el=>{ const last=presenceMap[el.getAttribute('data-email')]; const online=last&&(now-last<90000); el.classList.toggle('online',!!online); el.classList.toggle('offline',!online); el.title=online?'Online':'Offline'; }); const oc=document.getElementById('member-online'); if(oc){ const n=document.querySelectorAll('#member-list .pres-dot.online').length; oc.innerHTML='<span class="pres-dot online"></span>'+n+(n===1?' person online now':' people online now'); oc.style.display=document.querySelectorAll('#member-list .pres-dot').length?'flex':'none'; } }
function startPresenceWatch(){ if(unsubPresence) return; unsubPresence=onSnapshot(collection(db,'presence'),snap=>{ presenceMap={}; snap.forEach(d=>{ const t=d.data().lastActive; presenceMap[d.id]=(t&&t.toMillis)?t.toMillis():0; }); updatePresenceDots(); },err=>{}); presenceTick=setInterval(updatePresenceDots,15000); }
function stopPresenceWatch(){ if(unsubPresence){ unsubPresence(); unsubPresence=null; } if(presenceTick){ clearInterval(presenceTick); presenceTick=null; } }
function applyAdminUI(){
  const isAdmin=currentUser?.role==='admin';
  document.getElementById('admin-badge').style.display=isAdmin?'inline':'none';
  document.getElementById('admin-controls').style.display=isAdmin?'block':'none';
  document.getElementById('voting-mode-bar').style.display=isAdmin?'flex':'none';
  document.getElementById('tab-members').style.display=isAdmin?'':'none';
  const hint=document.getElementById('chart-admin-hint'); if(hint) hint.style.display=isAdmin?'block':'none';
  if(!isAdmin){ const active=document.querySelector('.tab-btn.active'); if(active&&active.dataset.tab==='members') switchTab('topics'); }
}
async function toggleMemberRole(email){
  if(currentUser.role!=='admin') return;
  try{
    const memSnap=await getDocs(collection(db,'allowed_emails'));
    const members=memSnap.docs.map(d=>({id:d.id,...d.data()}));
    const target=members.find(m=>m.id===email); if(!target) return;
    const newRole=target.role==='admin'?'member':'admin';
    if(newRole==='member'){
      const admins=members.filter(m=>m.role==='admin');
      if(admins.length<=1){ toast('There must be at least one admin'); return; }
      const isSelf=email===currentUser.email;
      if(isSelf){ if(!confirm('You will lose admin access. Continue?')) return; }
      else if(!confirm(`Revoke admin from ${target.name||email}?`)) return;
    } else {
      if(!confirm(`Make ${target.name||email} an admin?`)) return;
    }
    await updateDoc(doc(db,'allowed_emails',email),{role:newRole});
    toast(newRole==='admin'?'Now an admin':'Now a member'); loadMembers();
  }catch(e){ console.error(e); toast('Error'); }
}
let meditEmail='', meditField='name';
async function openMemberEdit(email,field){
  meditEmail=email; meditField=field;
  const title=document.getElementById('medit-title'), inp=document.getElementById('medit-input'), note=document.getElementById('medit-note');
  if(field==='email'){ title.textContent='Edit email'; inp.type='email'; inp.value=email; note.style.display='block'; note.textContent='Changing the email creates a fresh record \u2014 their existing votes won\u2019t carry over, and if they\u2019re signed in they\u2019ll need to sign in again with the new email.'; }
  else { title.textContent='Edit name'; inp.type='text'; note.style.display='none'; let cur=''; try{ const s=await getDoc(doc(db,'allowed_emails',email)); cur=s.exists()?(s.data().name||''):''; }catch(e){} inp.value=cur; }
  document.getElementById('medit-overlay').style.display='block';
  document.getElementById('medit-modal').style.display='block';
  inp.focus();
}
function closeMemberEdit(){ document.getElementById('medit-overlay').style.display='none'; document.getElementById('medit-modal').style.display='none'; }
async function saveMemberEdit(){
  const val=document.getElementById('medit-input').value.trim();
  if(!val){ toast('Enter a value'); return; }
  try{
    if(meditField==='name'){
      await updateDoc(doc(db,'allowed_emails',meditEmail),{name:val}); toast('Name updated');
    } else {
      const newEmail=val.toLowerCase();
      if(newEmail===meditEmail){ closeMemberEdit(); return; }
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)){ toast('Enter a valid email'); return; }
      const exists=await getDoc(doc(db,'allowed_emails',newEmail));
      if(exists.exists()){ toast('That email is already a member'); return; }
      const old=await getDoc(doc(db,'allowed_emails',meditEmail));
      const data=old.exists()?old.data():{};
      await setDoc(doc(db,'allowed_emails',newEmail),Object.assign({},data,{addedAt:data.addedAt||serverTimestamp()}));
      await deleteDoc(doc(db,'allowed_emails',meditEmail)); toast('Email updated');
    }
    closeMemberEdit(); loadMembers();
  }catch(e){ console.error(e); toast('Error'); }
}
window.toggleMemberRole=toggleMemberRole; window.openMemberEdit=openMemberEdit; window.saveMemberEdit=saveMemberEdit; window.closeMemberEdit=closeMemberEdit;
async function loadMembers() {
  document.getElementById('member-list').innerHTML=SKEL;
  try {
    const snap=await getDocs(collection(db,'allowed_emails'));
    const members=snap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    document.getElementById('member-count-label').textContent=`Team members (${members.length})`;
    if(!members.length){ document.getElementById('member-list').innerHTML='<div class="empty"><p>No members yet.</p></div>'; return; }
    const colorFor=email=>PALETTE[Math.abs([...email].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0))%PALETTE.length];
    document.getElementById('member-list').innerHTML=members.map(m=>{
      const initials=(m.name||m.id).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const isSelf=m.id===currentUser.email;
      return `<div class="member-card">
        <div class="member-avatar" style="background:${colorFor(m.id)}">${initials}</div>
        <div class="member-info">
          <div class="member-name">${esc(m.name||m.id)}</div>
          <div class="member-email">${esc(m.id)}</div>
        </div>
        <span class="pres-dot offline" data-email="${m.id}" title="Offline"></span>
        <span class="role-badge ${m.role==='admin'?'admin':'member'}">${m.role==='admin'?'ADMIN':'MEMBER'}</span>
        <button class="menu-trigger" onclick="window.toggleMenu('m-${m.id}')" aria-label="Options"><div class="dot"></div><div class="dot"></div><div class="dot"></div></button>
        <div class="dropdown" id="menu-m-${m.id}" style="display:none">
          <div class="dropdown-item" onclick="window.toggleMemberRole('${m.id}');window.closeMenu()">${m.role==='admin'?SVG.user+' Make member':SVG.shield+' Make admin'}</div>
          <div class="dropdown-item" onclick="window.openMemberEdit('${m.id}','name');window.closeMenu()">${SVG.edit} Edit name</div>
          <div class="dropdown-item" onclick="window.openMemberEdit('${m.id}','email');window.closeMenu()">${SVG.mail} Edit email</div>
          <div class="dropdown-item danger" onclick="window.removeMember('${m.id}');window.closeMenu()">${SVG.trash} Remove member</div>
        </div>
      </div>`;
    }).join('');
    updatePresenceDots();
  } catch(e){ toast('Error loading members'); }
}

async function addMember() {
  const email=document.getElementById('mem-email').value.trim().toLowerCase();
  const name=document.getElementById('mem-name').value.trim();
  const role=document.getElementById('mem-role').value;
  if(!email.includes('@')){ toast('Enter a valid email'); return; }
  if(!name){ toast('Enter a display name'); return; }
  try {
    await setDoc(doc(db,'allowed_emails',email),{name,role,addedAt:serverTimestamp(),addedBy:currentUser.email});
    document.getElementById('mem-email').value='';
    document.getElementById('mem-name').value='';
    toast(`${name} added ✓`);
    loadMembers();
  } catch(e){ toast('Error adding member'); }
}

async function removeMember(email) {
  if(email===currentUser.email){ toast("Can't remove yourself"); return; }
  if(!confirm(`Remove ${email} from RoundTable?`)) return;
  try { await deleteDoc(doc(db,'allowed_emails',email)); toast('Member removed'); loadMembers(); } catch(e){ toast('Error'); }
}

// ── Render: Topics ─────────────────────────────────────────────────────────
function renderTopics() {
  const list=document.getElementById('topic-list');
  const active=topics.filter(t=>!t.discussed);
  const isAdmin=currentUser?.role==='admin';
  if(!active.length){ list.innerHTML='<div class="empty"><div class="empty-icon">'+SVG.clipboard+'</div><p>No topics yet. Add the first one above.</p></div>'; return; }
  list.innerHTML=active.map((t,i)=>{
    const c=color(i);
    return `<div class="topic-card" style="border-left-color:${c}">
      <div class="topic-letter" style="background:${c}">${letter(i)}</div>
      <div class="topic-body">
        <div class="topic-text">${esc(t.text)}</div>
        ${t.context?`<div class="topic-meta">${esc(t.context)}</div>`:''}
        <div class="topic-meta">Added by ${esc(t.addedByName||t.addedBy||'unknown')}</div>
      </div>
      <button class="menu-trigger" onclick="window.toggleMenu('${t.id}')" aria-label="Options">
        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
      </button>
      <div class="dropdown" id="menu-${t.id}" style="display:none">
        <div class="dropdown-item" onclick="window.openEdit('${t.id}');window.closeMenu()">${SVG.edit} Edit</div>
        ${isAdmin?`<div class="dropdown-item" onclick="window.markDiscussed('${t.id}');window.closeMenu()">${SVG.checkCircle} Mark as discussed</div>`:''}
        ${isAdmin?`<div class="dropdown-item danger" onclick="window.deleteTopic('${t.id}');window.closeMenu()">${SVG.trash} Delete</div>`:''}
      </div>
    </div>`;
  }).join('');
}

// ── Render: Vote ───────────────────────────────────────────────────────────
function renderVote() {
  const active=topics.filter(t=>!t.discussed);
  const list=document.getElementById('vote-list'); if(!list) return;
  const totalVotes=Object.values(votes).reduce((a,b)=>a+b,0);
  countUp(document.getElementById('stat-votes'),totalVotes);
  let maxV=0; active.forEach(t=>{ const v=votes[t.id]||0; if(v>maxV) maxV=v; });
  const leaderEl=document.getElementById('stat-leader');
  const labelEl=document.getElementById('stat-leader-label');
  if(!maxV){ leaderEl.textContent='-'; leaderEl.style.fontSize=''; if(labelEl) labelEl.textContent='Leading'; }
  else {
    const leaders=active.filter(t=>(votes[t.id]||0)===maxV);
    if(leaders.length===1){ leaderEl.textContent=letter(active.indexOf(leaders[0])); leaderEl.style.fontSize=''; if(labelEl) labelEl.textContent='Leading'; }
    else {
      leaderEl.textContent='Tie'; leaderEl.style.fontSize='';
      const ls=leaders.map(t=>letter(active.indexOf(t)));
      if(labelEl) labelEl.textContent=ls.length<=1?ls.join(''):ls.slice(0,-1).join(', ')+' and '+ls[ls.length-1];
    }
  }
  if(!active.length){ list.innerHTML='<div class="empty"><div class="empty-icon">'+SVG.vote+'</div><p>No topics to vote on yet.</p></div>'; if(chart){chart.destroy();chart=null;} return; }
  list.innerHTML=active.map((t,i)=>{
    const c=color(i), cnt=votes[t.id]||0, sel=myVotes.has(t.id);
    return `<div class="vote-card${sel?' voted':''}" onclick="window.castVote('${t.id}')">
      <div class="vote-card-letter" style="background:${c}">${letter(i)}</div>
      <div class="vote-card-body">
        <div class="vote-card-text">${esc(t.text)}</div>
        ${t.context?`<div class="vote-card-context">${esc(t.context)}</div>`:''}
      </div>
      <div class="vote-count">${cnt} vote${cnt!==1?'s':''}</div>
    </div>`;
  }).join('');
  renderChart(active);
}

function showVoterPanel(topicId, idx) {
  if(currentUser?.role!=='admin') return;
  const topic=chartTopics.find(t=>t.id===topicId); if(!topic) return;
  const voters=[];
  if(lastVoteSnap) {
    lastVoteSnap.docs.forEach(d=>{
      const data=d.data();
      const ids=data.topicIds||(data.topicId?[data.topicId]:[]);
      if(ids.includes(topicId)) voters.push({name:data.name||d.id,email:d.id});
    });
  }
  const lEl=document.getElementById('vp-letter');
  lEl.textContent=letter(idx); lEl.style.background=color(idx);
  document.getElementById('vp-topic').textContent=topic.text;
  document.getElementById('vp-count').textContent=voters.length
    ?`${voters.length} vote${voters.length!==1?'s':''}`:'No votes yet';
  const colorFor=email=>PALETTE[Math.abs([...email].reduce((h,ch)=>((h<<5)-h+ch.charCodeAt(0))|0,0))%PALETTE.length];
  document.getElementById('vp-list').innerHTML=voters.length
    ?voters.map(v=>`<div class="vp-voter">
        <div class="vp-avatar" style="background:${colorFor(v.email)}">${(v.name||v.email).slice(0,2).toUpperCase()}</div>
        <div><div class="vp-voter-name">${esc(v.name)}</div><div class="vp-voter-email">${esc(v.email)}</div></div>
      </div>`).join('')
    :'<div class="vp-empty">No one has voted for this topic yet</div>';
  document.getElementById('vp-overlay').style.display='block';
  document.getElementById('vp-panel').classList.add('open');
}
function closeVoterPanel() {
  document.getElementById('vp-overlay').style.display='none';
  document.getElementById('vp-panel').classList.remove('open');
}

function renderChart(active) {
  const ctx=document.getElementById('vote-chart').getContext('2d');
  const labels=active.map((t,i)=>letter(i));
  const data=active.map(t=>votes[t.id]||0);
  const colors=active.map((_,i)=>color(i));
  chartTopics=active;
  if(chart){ chart.data.labels=labels; chart.data.datasets[0].data=data; chart.data.datasets[0].backgroundColor=colors.map(c=>c+'33'); chart.data.datasets[0].borderColor=colors; chart.update('active'); return; }
  chart=new Chart(ctx,{
    type:'bar',
    data:{labels,datasets:[{label:'Votes',data,backgroundColor:colors.map(c=>c+'33'),borderColor:colors,borderWidth:2.5,borderRadius:8,borderSkipped:false}]},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{title:items=>{const i=items[0]?.dataIndex??0;const t=chartTopics[i];return t?`${letter(i)}. ${t.text}`:'';},label:c=>` ${c.parsed.y} vote${c.parsed.y!==1?'s':''}`}}},
      scales:{
        y:{beginAtZero:true,ticks:{stepSize:1,precision:0,color:'#94a3b8'},grid:{color:'rgba(0,0,0,.06)'},border:{dash:[4,4]}},
        x:{ticks:{color:'#64748b',font:{weight:'700',size:14},maxRotation:0,minRotation:0},grid:{display:false}}
      },
      animation:{duration:350,easing:'easeOutQuart'},
      onClick:(e,elements)=>{
        if(currentUser?.role!=='admin'||!elements.length) return;
        const idx=elements[0].index;
        showVoterPanel(chartTopics[idx]?.id, idx);
      }
    }
  });
}

// ── Render: History ────────────────────────────────────────────────────────
function renderHistory() {
  const list=document.getElementById('history-list'); if(!list) return;
  const done=topics.filter(t=>t.discussed).sort((a,b)=>(b.discussedAt?.toMillis?.()??0)-(a.discussedAt?.toMillis?.()??0));
  if(!done.length){ list.innerHTML='<div class="empty"><div class="empty-icon">'+SVG.history+'</div><p>No topics discussed yet.</p></div>'; return; }
  const isAdmin=currentUser?.role==='admin';
  list.innerHTML=done.map((t,i)=>{
    const c=color(i);
    const pct=t.finalPct!=null?t.finalPct:null;
    const d=t.discussedAt?.toDate?.();
    const dateStr=d?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
    return `<div class="history-card">
      <div class="history-letter" style="background:${c}">${SVG.check}</div>
      <div class="history-body">
        <div class="history-text">${esc(t.text)}</div>
        <div class="history-meta">${dateStr?`Discussed ${dateStr}`:'Previously discussed'}${t.context?` · ${esc(t.context)}`:''}</div>
      </div>
      ${pct!=null?`<div class="history-pct">${pct}%<small>voted for</small></div>`:''}
      ${isAdmin?`<button class="menu-trigger" onclick="window.toggleMenu('h-${t.id}')" aria-label="Options"><div class="dot"></div><div class="dot"></div><div class="dot"></div></button>
      <div class="dropdown" id="menu-h-${t.id}" style="display:none">
        <div class="dropdown-item" onclick="window.restoreTopic('${t.id}');window.closeMenu()">${SVG.history} Restore to active</div>
        <div class="dropdown-item danger" onclick="window.deleteHistory('${t.id}');window.closeMenu()">${SVG.trash} Delete</div>
      </div>`:''}
    </div>`;
  }).join('');
}

// ── UI Helpers ─────────────────────────────────────────────────────────────
function updateSessionCount() {
  const n=topics.filter(t=>!t.discussed).length;
  document.getElementById('session-count').textContent=n===1?'1 topic':`${n} topics`;
}
function toast(msg) { const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600); }
function toggleMenu(id) {
  if(openMenuId&&openMenuId!==id) closeMenu();
  const el=document.getElementById('menu-'+id); if(!el) return;
  const open=el.style.display==='block'; el.style.display=open?'none':'block'; openMenuId=open?null:id;
  const card=el.closest('.topic-card,.history-card,.member-card'); if(card) card.classList.toggle('menu-open', !open);
}
function closeMenu() { if(openMenuId){ const el=document.getElementById('menu-'+openMenuId); if(el){ el.style.display='none'; const c=el.closest('.topic-card,.history-card,.member-card'); if(c) c.classList.remove('menu-open'); } openMenuId=null; } }
document.addEventListener('click',e=>{ if(!e.target.closest('.menu-trigger')&&!e.target.closest('.dropdown')) closeMenu(); });
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  ['topics','vote','history','members','quiz'].forEach(t=>{ const p=document.getElementById('panel-'+t); if(p) p.classList.toggle('active',t===tab); });
  closeMenu();
  if(tab==='vote'){ renderVote(); loadAllMembers(); }
  if(tab==='history') renderHistory();
  if(tab==='members'){ loadMembers(); startPresenceWatch(); } else { stopPresenceWatch(); }
  if(tab==='quiz') initQuizTab();
}
function toggleTheme() {
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const next=isDark?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  document.getElementById('theme-toggle').setAttribute('aria-label','Toggle theme');
  try{ localStorage.setItem('roundtable_theme',next); }catch(e){}
}
function applyTheme() {
  const saved=localStorage.getItem('roundtable_theme')||'dark';
  document.documentElement.setAttribute('data-theme',saved);
  const btn=document.getElementById('theme-toggle'); if(btn) btn.setAttribute('aria-label','Toggle theme');
}


// ════════════════════════════════════════════════════════════════════════════
// QUIZ FEATURE
// ════════════════════════════════════════════════════════════════════════════

// ── State ──────────────────────────────────────────────────────────────────
let myQuizzes=[], editingQuizId=null, editingQuestions=[];
let hostRoomCode=null, hostQuizData=null;
let hostPlayersSub=null, hostAutoAdvance=false;
let hostTimerInterval=null, hostCurrentQ=-1;
let playerRoomCode=null, playerRoomSub=null, playerPCountSub=null;
let playerAnswered=false, playerCurrentQ=-1, playerMyAnswers={};
let playerRoomCache=null;
let showingAllQuizzes=false, quizTabInited=false;

const Q_COLORS=['#E84D56','#1368CE','#D89E00','#26890C'];
const Q_LETTERS=['A','B','C','D'];
function autoGrow(el){ if(!el||el.tagName!=='TEXTAREA') return; el.style.height='auto'; el.style.height=Math.min(Math.max(el.scrollHeight,el.offsetHeight?0:0,parseInt(getComputedStyle(el).minHeight)||0),360)+'px'; }
document.addEventListener('input',e=>{ if(e.target&&e.target.tagName==='TEXTAREA') autoGrow(e.target); });
const SKEL='<div class="skel-list">'+Array(4).fill('<div class="skel"></div>').join('')+'</div>';
function countUp(el,to,opts){
  opts=opts||{}; if(!el) return;
  const from=opts.from!=null?opts.from:(parseInt(String(el.textContent).replace(/[^0-9-]/g,''))||0);
  to=Math.round(to); const dur=opts.dur||500; const fmt=opts.fmt||(v=>v.toLocaleString());
  const wrap=v=>(opts.prefix||'')+fmt(v)+(opts.suffix||'');
  if(from===to){ el.textContent=wrap(to); return; }
  const t0=performance.now();
  const step=(t)=>{ const k=Math.min(1,(t-t0)/dur); const e=1-Math.pow(1-k,3); const v=Math.round(from+(to-from)*e); el.textContent=wrap(v); if(k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function showNet(off){ const b=document.getElementById('net-banner'); if(b) b.style.display=off?'block':'none'; }
window.addEventListener('offline',()=>showNet(true));
window.addEventListener('online',()=>showNet(false));
const AVATARS=['🦊','🐼','🐯','🦁','🐶','🐱','🐵','🐨','🐰','🐸','🐷','🐮','🐔','🐧','🦄','🐝','🦋','🐢','🐙','🦀','🐬','🐳','🦈','🦓','🦒','🦔','🦦','🦥','🦘','🦩','🦚','🦜','🐲','🦉','🦇','🐺','🐗','🐴','🦌','🐏','🦙','🦛','🦏','🐊','🦕','🦖','🐡','🐠','🦡','🐻'];
function avatarFor(email){ let n=0; const s=String(email||''); for(let i=0;i<s.length;i++){ n=(n*31+s.charCodeAt(i))>>>0; } return AVATARS[n%AVATARS.length]; }
let pupInv={fifty:true,x2:true,crowd:true}, pupArmedX2=false, playerStreak=0;
let pupStoreKey='';
function loadPups(room,code){ pupStoreKey='rt_pups_'+code+'_'+((room&&room.gameId)?room.gameId:((room&&room.createdAt&&room.createdAt.seconds)?room.createdAt.seconds:'0')); try{ const s=localStorage.getItem(pupStoreKey); if(s){ const o=JSON.parse(s)||{}; return {fifty:o.fifty!==false,x2:o.x2!==false,crowd:o.crowd!==false}; } }catch(e){} return {fifty:true,x2:true,crowd:true}; }
function savePups(){ try{ if(pupStoreKey) localStorage.setItem(pupStoreKey,JSON.stringify(pupInv)); }catch(e){} }
let playerImages={};
function setQImg(id,src){ const el=document.getElementById(id); if(!el) return; if(src){ el.src=src; el.style.display='block'; } else { el.removeAttribute('src'); el.style.display='none'; } }

/* ── Sound (Tone.js) + confetti ──────────────────────────────── */
let _sfxReady=false, sfxOn=(localStorage.getItem('roundtable_sfx')!=='off');
let _sLead,_sBuzz,_sTick;
async function initSfx(){
  showSfxBtn();
  if(_sfxReady||!window.Tone) return;
  try{
    await Tone.start();
    _sLead=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.005,decay:.2,sustain:.1,release:.3}}).toDestination(); _sLead.volume.value=-9;
    _sBuzz=new Tone.Synth({oscillator:{type:'sawtooth'},envelope:{attack:.005,decay:.25,sustain:0,release:.1}}).toDestination(); _sBuzz.volume.value=-15;
    _sTick=new Tone.Synth({oscillator:{type:'square'},envelope:{attack:.001,decay:.05,sustain:0,release:.02}}).toDestination(); _sTick.volume.value=-20;
    _sfxReady=true;
  }catch(e){}
}
function sfx(name){
  if(!sfxOn||!_sfxReady||!window.Tone) return;
  try{ const t=Tone.now();
    if(name==='tick') _sTick.triggerAttackRelease('C6',.05,t);
    else if(name==='select') _sLead.triggerAttackRelease('E5',.08,t);
    else if(name==='correct') ['C5','E5','G5','C6'].forEach((n,i)=>_sLead.triggerAttackRelease(n,.18,t+i*.08));
    else if(name==='wrong') _sBuzz.triggerAttackRelease('A2',.3,t);
    else if(name==='fanfare') [['C5',0],['E5',.12],['G5',.24],['C6',.36],['G5',.5],['C6',.62]].forEach(a=>_sLead.triggerAttackRelease(a[0],.3,t+a[1]));
  }catch(e){}
}
function showSfxBtn(){ const b=document.getElementById('sfx-toggle'); if(b){ b.style.display='flex'; updateSfxBtn(); } }
function hideSfxBtn(){ const b=document.getElementById('sfx-toggle'); if(b) b.style.display='none'; }
function updateSfxBtn(){ const b=document.getElementById('sfx-toggle'); if(b) b.innerHTML=sfxOn?SVG.volume:SVG.volumeOff; }
function toggleSound(){ sfxOn=!sfxOn; try{ localStorage.setItem('roundtable_sfx',sfxOn?'on':'off'); }catch(e){} updateSfxBtn(); if(sfxOn) sfx('select'); }
window.toggleSound=toggleSound;
function confettiBurst(power){
  try{ if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
  const c=document.createElement('canvas'); c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9999';
  const ctx=c.getContext('2d'); const dpr=Math.min(window.devicePixelRatio||1,2);
  c.width=innerWidth*dpr; c.height=innerHeight*dpr; document.body.appendChild(c);
  const cols=['#1B5E20','#72C219','#E84D56','#1368CE','#D89E00','#ffffff'], N=power||140, ps=[];
  for(let i=0;i<N;i++) ps.push({x:c.width*(0.15+Math.random()*0.7),y:-20*dpr,vx:(Math.random()-0.5)*9*dpr,vy:(Math.random()*4+3)*dpr,g:0.18*dpr,r:(4+Math.random()*5)*dpr,rot:Math.random()*6,vr:(Math.random()-0.5)*0.4,col:cols[i%cols.length],life:0,ttl:160+Math.random()*60});
  (function frame(){ ctx.clearRect(0,0,c.width,c.height); let alive=false;
    for(const p of ps){ if(p.life>p.ttl) continue; alive=true; p.life++; p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.vx*=0.99; p.rot+=p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=Math.max(0,1-p.life/p.ttl); ctx.fillStyle=p.col; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*.62); ctx.restore(); }
    if(alive) requestAnimationFrame(frame); else c.remove();
  })();
}
window.confettiBurst=confettiBurst;


function genCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVXYZ23456789';
  let c='';
  for(let i=0;i<6;i++) c+=chars[Math.floor(Math.random()*chars.length)];
  return c;
}
function rankEmoji(r){return r===1?'🥇':r===2?'🥈':r===3?'🥉':`${r}.`;}

// ── Tab switch ─────────────────────────────────────────────────────────────
function switchQTab(tab){
  document.querySelectorAll('.q-subtab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.q-subtab')[tab==='mine'?0:1].classList.add('active');
  document.getElementById('qsub-mine').style.display=tab==='mine'?'':'none';
  document.getElementById('qsub-join').style.display=tab==='join'?'':'none';
  if(tab==='mine') loadMyQuizzes();
}

function initQuizTab(){
  if(quizTabInited) return;
  quizTabInited=true;
  if(currentUser?.role==='admin') document.getElementById('admin-all-btn').style.display='block';
  loadMyQuizzes();
}

// ── Load quizzes ───────────────────────────────────────────────────────────
async function loadMyQuizzes(){
  const listEl=document.getElementById('quiz-list');
  if(!listEl||!currentUser) return;
  listEl.innerHTML=SKEL;
  try{
    let snap;
    if(showingAllQuizzes && currentUser.role==='admin'){
      snap=await getDocs(collection(db,'quizzes'));
    } else {
      snap=await getDocs(query(collection(db,'quizzes'),where('createdBy','==',currentUser.email)));
    }
    myQuizzes=snap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>(b.createdAt?.toMillis?.()??0)-(a.createdAt?.toMillis?.()??0));
    const lbl=document.getElementById('quiz-list-label');
    if(lbl) lbl.textContent=`${showingAllQuizzes?'All':'Your'} quizzes (${myQuizzes.length})`;
    if(!myQuizzes.length){
      listEl.innerHTML='<div class="empty"><div class="empty-icon">'+SVG.target+'</div><p>No quizzes yet, create your first one!</p></div>';
      return;
    }
    listEl.innerHTML=myQuizzes.map(renderQuizCard).join('');
  } catch(e){ console.error(e); toast('Error loading quizzes'); }
}

function renderQuizCard(q){
  const isOwn=q.createdBy===currentUser.email;
  const isAdmin=currentUser?.role==='admin';
  const canDelete=isOwn||isAdmin;
  const qcount=q.questions?.length||0;
  return `<div class="quiz-card">
    <div class="quiz-card-icon">${SVG.gamepad}</div>
    <div class="quiz-card-body">
      <div class="quiz-card-title">${esc(q.title||'Untitled Quiz')}</div>
      <div class="quiz-card-meta">${qcount} question${qcount!==1?'s':''} · by ${esc(q.createdByName||q.createdBy)}</div>
      <span class="quiz-code-chip">${q.code||'------'}</span>
    </div>
    <div class="quiz-actions">
      ${isOwn?`<button class="quiz-action-btn" onclick="window.openQuizEditor('${q.id}')" title="Edit">${SVG.edit}</button>`:''}
      ${isOwn?`<button class="quiz-action-btn" onclick="window.previewQuiz('${q.id}')" title="Preview">${SVG.eye}</button>`:''}
      <button class="quiz-action-btn" onclick="window.runQuiz('${q.id}')" title="Run quiz">${SVG.play}</button>
      ${canDelete?`<button class="quiz-action-btn danger" onclick="window.confirmDeleteQuiz('${q.id}')" title="Delete">${SVG.trash}</button>`:''}
    </div>
  </div>`;
}

function toggleAllQuizzes(){
  showingAllQuizzes=!showingAllQuizzes;
  document.getElementById('all-q-toggle').textContent=showingAllQuizzes?'Show my quizzes':'Show all quizzes';
  loadMyQuizzes();
}

// ── Create quiz ────────────────────────────────────────────────────────────
function parseQuizText(text){
  const TIMES=[5,10,15,20,30,45,60], POINTS=[100,250,500,1000,2000];
  const snap=(v,arr)=>arr.reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a,arr[0]);
  const lines=String(text||'').split(/\r?\n/);
  const blocks=[]; let cur=null;
  const fin=()=>{ if(cur) blocks.push(cur); cur=null; };
  for(const raw of lines){
    const line=raw.trim(); if(!line) continue;
    const m=line.match(/^([*\-+•])\s*(.+)$/);
    if(m && cur){ cur.opts.push({text:m[2].trim(), correct:(m[1]==='*'||m[1]==='+')}); }
    else {
      fin(); let t=line.replace(/^\s*\d+[\.\)]\s*/,''); let type=null,timeLimit=20,points=1000;
      const tt=t.match(/\((tf|t\/f|true\/false|multi|multiselect|mcq)\)/i);
      if(tt){ const k=tt[1].toLowerCase(); type=k[0]==='t'?'tf':(k.slice(0,2)==='mu'?'multi':'mcq'); t=t.replace(tt[0],'').trim(); }
      const bk=t.match(/\[([^\]]+)\]/);
      if(bk){ const ins=bk[1]; const ts=ins.match(/(\d+)\s*s/i); if(ts) timeLimit=snap(parseInt(ts[1]),TIMES); const ps=ins.match(/(\d+)\s*p/i)||ins.match(/(\d{2,5})/); if(ps) points=snap(parseInt(ps[1]),POINTS); t=t.replace(bk[0],'').trim(); }
      cur={text:t.trim(),opts:[],type,timeLimit,points};
    }
  }
  fin();
  const out=[], errors=[];
  blocks.forEach((q,qi)=>{ const n=qi+1;
    if(!q.text) errors.push('Question '+n+': missing question text');
    let type=q.type; const correctCount=q.opts.filter(o=>o.correct).length;
    if(!type){ const isTF=q.opts.length===2 && q.opts.every(o=>/^(true|false)$/i.test(o.text)); type=isTF?'tf':(correctCount>1?'multi':'mcq'); }
    if(type==='tf'){
      let correct=0; const ci=q.opts.findIndex(o=>o.correct);
      if(ci>=0) correct=/^false$/i.test(q.opts[ci].text)?1:0; else errors.push('Question '+n+': mark the correct answer with *');
      out.push({text:q.text,type:'tf',options:['True','False'],correct,timeLimit:q.timeLimit,points:q.points});
    } else if(type==='multi'){
      const options=q.opts.slice(0,4).map(o=>o.text); const correctArr=q.opts.slice(0,4).map((o,i)=>o.correct?i:-1).filter(i=>i>=0);
      if(q.opts.length<2) errors.push('Question '+n+': needs at least 2 options');
      if(!correctArr.length) errors.push('Question '+n+': mark at least one correct answer with *');
      while(options.length<4) options.push('');
      out.push({text:q.text,type:'multi',options:options.slice(0,4),correctArr,timeLimit:q.timeLimit,points:q.points});
    } else {
      const options=q.opts.slice(0,4).map(o=>o.text); let correct=q.opts.slice(0,4).findIndex(o=>o.correct);
      if(q.opts.length<2) errors.push('Question '+n+': needs at least 2 options');
      if(correct<0){ errors.push('Question '+n+': mark the correct answer with *'); correct=0; }
      while(options.length<4) options.push('');
      out.push({text:q.text,type:'mcq',options:options.slice(0,4),correct,timeLimit:q.timeLimit,points:q.points});
    }
  });
  if(!out.length) errors.push('No questions found, check the format and try again');
  return {questions:out,errors};
}
const IMPORT_EXAMPLE=`1. What is the capital of France? [20s, 1000pts]
- London
* Paris
- Rome
- Madrid

2. The Earth is flat. (TF)
- True
* False

3. Which of these are primary colours? (MULTI)
* Red
* Blue
- Green
* Yellow`;
const AI_PROMPT=`Create a quiz with 10 questions about [YOUR TOPIC]. Output ONLY the quiz in this EXACT format, nothing else:

1. Question text here? [20s, 1000pts]
- a wrong option
* the correct option
- another wrong option
- another wrong option

Rules:
- Number each question and end the line with the question.
- Each option on its own line: "- " for a wrong option, "* " for the correct one.
- Multiple-choice questions should have 4 options.
- For True/False, add (TF) after the question and use only True and False.
- For multiple correct answers, add (MULTI) and mark every correct option with *.
- The [20s, 1000pts] part (time and points) is optional.`;
function openImport(){ document.getElementById('import-text').value=''; document.getElementById('import-title').value=''; document.getElementById('import-error').textContent=''; document.getElementById('quiz-import').style.display='flex'; }
function closeImport(){ document.getElementById('quiz-import').style.display='none'; }
function loadImportExample(){ document.getElementById('import-text').value=IMPORT_EXAMPLE; document.getElementById('import-error').textContent=''; }
function copyAIPrompt(){ try{ navigator.clipboard.writeText(AI_PROMPT).then(()=>toast('AI prompt copied'),()=>toast('Copy failed')); }catch(e){ toast('Copy failed'); } }
async function runImport(){
  const errEl=document.getElementById('import-error');
  const {questions,errors}=parseQuizText(document.getElementById('import-text').value);
  if(errors.length){ errEl.textContent='Please fix these and try again:\n• '+errors.join('\n• '); return; }
  errEl.textContent='';
  const title=document.getElementById('import-title').value.trim()||'Imported quiz';
  try{
    let code,exists=true,attempts=0;
    while(exists&&attempts<10){ code=genCode(); attempts++; const s=await getDoc(doc(db,'quiz_codes',code)); exists=s.exists(); }
    const id='qz_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
    const data={title,code,createdBy:currentUser.email,createdByName:currentUser.name,questions,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    await setDoc(doc(db,'quizzes',id),data);
    await setDoc(doc(db,'quiz_codes',code),{quizId:id,createdBy:currentUser.email});
    closeImport(); toast(questions.length+' questions imported, review and save'); openQuizEditor(id,Object.assign({},data,{id}));
  }catch(e){ console.error(e); toast('Error creating quiz'); }
}
window.openImport=openImport; window.closeImport=closeImport; window.loadImportExample=loadImportExample; window.copyAIPrompt=copyAIPrompt; window.runImport=runImport;
async function createQuiz(){
  let code,exists=true,attempts=0;
  while(exists&&attempts<10){
    code=genCode(); attempts++;
    const s=await getDoc(doc(db,'quiz_codes',code));
    exists=s.exists();
  }
  const id='qz_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
  const data={title:'',code,createdBy:currentUser.email,createdByName:currentUser.name,
    questions:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  await setDoc(doc(db,'quizzes',id),data);
  await setDoc(doc(db,'quiz_codes',code),{quizId:id,createdBy:currentUser.email});
  openQuizEditor(id,{...data,id});
}

// ── Editor ─────────────────────────────────────────────────────────────────
async function openQuizEditor(id,data){
  if(!data){
    const s=await getDoc(doc(db,'quizzes',id));
    if(!s.exists()){ toast('Quiz not found'); return; }
    data={id,...s.data()};
  }
  editingQuizId=id;
  editingQuestions=(data.questions||[]).map(q=>({...q}));
  document.getElementById('qe-title').value=data.title||'';
  document.getElementById('qe-header-title').textContent=data.title||'Edit Quiz';
  renderQEditor();
  document.getElementById('quiz-editor').style.display='flex';
}

function closeQuizEditor(){
  document.getElementById('quiz-editor').style.display='none';
}

async function saveAndCloseEditor(){
  collectEditorData();
  try{ if(JSON.stringify(editingQuestions).length>900000){ toast('Quiz too large, remove or shrink an image'); return; } }catch(e){}
  const title=document.getElementById('qe-title').value.trim()||'Untitled Quiz';
  try{
    await updateDoc(doc(db,'quizzes',editingQuizId),{title,questions:editingQuestions,updatedAt:serverTimestamp()});
    closeQuizEditor();
    loadMyQuizzes();
    toast('Quiz saved ✓');
  } catch(e){ console.error(e); toast('Error saving'); }
}

function pickQImage(i){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=()=>{ const img=new Image(); img.onload=()=>{
      const max=800; let w=img.width, hh=img.height;
      if(w>hh){ if(w>max){ hh=Math.round(hh*max/w); w=max; } } else { if(hh>max){ w=Math.round(w*max/hh); hh=max; } }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=hh;
      cv.getContext('2d').drawImage(img,0,0,w,hh);
      let qual=0.7, data=cv.toDataURL('image/jpeg',qual);
      while(data.length>90000 && qual>0.3){ qual-=0.12; data=cv.toDataURL('image/jpeg',qual); }
      if(!editingQuestions[i]) editingQuestions[i]={};
      editingQuestions[i].image=data;
      const row=document.getElementById('qe-img-row-'+i);
      if(row) row.innerHTML=`<img src="${data}" class="qe-img-thumb"><button class="qe-img-rm" onclick="window.removeQImage(${i})">Remove</button>`;
      toast('Image added \u00b7 '+Math.round(data.length/1024)+' KB');
    }; img.src=reader.result; };
    reader.readAsDataURL(f);
  };
  inp.click();
}
function removeQImage(i){ if(editingQuestions[i]) editingQuestions[i].image=null; const row=document.getElementById('qe-img-row-'+i); if(row) row.innerHTML=`<button class="qe-img-add" onclick="window.pickQImage(${i})">+ Add image</button>`; }
function collectEditorData(){
  editingQuestions=editingQuestions.map((_,i)=>{
    const card=document.getElementById('qe-q-'+i); if(!card) return editingQuestions[i];
    const typeEl=card.querySelector('.qe-type');
    const type=typeEl?typeEl.value:'mcq';
    const textEl=card.querySelector('.qe-qt');
    const text=textEl?textEl.value.trim():'';
    const tl=card.querySelector('.qe-tl'); const pts=card.querySelector('.qe-pts');
    const base={text,type,timeLimit:parseInt(tl?.value||'20'),points:parseInt(pts?.value||'1000'),image:editingQuestions[i]?.image||null};
    if(type==='tf'){
      const cr=card.querySelector(`input[name="qecr${i}"]:checked`);
      return {...base,options:['True','False'],correct:cr?parseInt(cr.value):0};
    } else if(type==='multi'){
      const opts=Q_LETTERS.map((_,j)=>{ const el=card.querySelector(`.qe-ot-${j}`); return el?el.value.trim():''; });
      const cbs=card.querySelectorAll('.qe-multi-cb:checked');
      const correctArr=Array.from(cbs).map(cb=>parseInt(cb.value));
      return {...base,options:opts,correctArr};
    } else {
      const opts=Q_LETTERS.map((_,j)=>{ const el=card.querySelector(`.qe-ot-${j}`); return el?el.value.trim():''; });
      const cr=card.querySelector(`input[name="qecr${i}"]:checked`);
      return {...base,options:opts,correct:cr?parseInt(cr.value):0};
    }
  });
}

function renderQEditor(){
  const c=document.getElementById('qe-questions');
  c.innerHTML=editingQuestions.length
    ? editingQuestions.map((q,i)=>qeCardHTML(q,i)).join('')
    : '<div style="text-align:center;color:var(--text-muted);padding:20px 0;font-size:13px">No questions yet</div>';
}

function qeCardHTML(q,i){
  const type=q.type||'mcq';
  const isTF=type==='tf'; const isMulti=type==='multi';
  const opts=isTF?['True','False']:(q.options||['','','','']).slice(0,4);
  const tl=q.timeLimit||20; const pts=q.points||1000;
  const correctArr=Array.isArray(q.correctArr)?q.correctArr:(q.correct!=null?[q.correct]:[0]);
  const typeBadge=isTF?'<span class="qe-type-badge qe-type-tf">T/F</span>':isMulti?'<span class="qe-type-badge qe-type-multi">Multi</span>':'<span class="qe-type-badge qe-type-mcq">MCQ</span>';

  let optsHTML='';
  if(isTF){
    optsHTML=`<div class="qe-opts">
      ${[0,1].map(j=>`<div class="qe-opt">
        <div class="qe-opt-letter" style="background:${j===0?'#1368CE':'#E84D56'}">${j===0?'T':'F'}</div>
        <span style="flex:1;font-size:13px;font-weight:600;color:var(--text-primary)">${j===0?'True':'False'}</span>
        <input type="radio" name="qecr${i}" value="${j}" ${(q.correct===j)?'checked':j===0&&q.correct==null?'checked':''}>
      </div>`).join('')}
    </div>`;
  } else {
    optsHTML=`<div class="qe-opts">
      ${[0,1,2,3].map(j=>`<div class="qe-opt">
        <div class="qe-opt-letter" style="background:${Q_COLORS[j]}">${Q_LETTERS[j]}</div>
        <input type="text" class="qe-ot-${j}" placeholder="Option ${Q_LETTERS[j]}" value="${esc(opts[j]||'')}">
        ${isMulti
          ?`<input type="checkbox" class="qe-multi-cb" value="${j}" ${correctArr.includes(j)?'checked':''}>`
          :`<input type="radio" name="qecr${i}" value="${j}" ${q.correct===j?'checked':j===0&&q.correct==null?'checked':''}>`}
      </div>`).join('')}
    </div>`;
  }

  return `<div class="qe-card" id="qe-q-${i}">
    <div class="qe-card-head" onclick="window.toggleQCard(${i})">
      <div class="qe-card-num" style="background:${Q_COLORS[i%4]}">${i+1}</div>
      <div class="qe-card-text">${esc(q.text)||'<em style="color:var(--text-muted)">Empty question</em>'} ${typeBadge}</div>
      <div class="qe-card-actions">
        ${i>0?`<button class="qe-btn" onclick="event.stopPropagation();window.moveQ(${i},-1)" title="Up">&#x2191;</button>`:''}
        ${i<editingQuestions.length-1?`<button class="qe-btn" onclick="event.stopPropagation();window.moveQ(${i},1)" title="Down">&#x2193;</button>`:''}
        <button class="qe-btn danger" onclick="event.stopPropagation();window.deleteQ(${i})" title="Delete">&#x2715;</button>
      </div>
    </div>
    <div class="qe-body" id="qe-body-${i}" style="display:none">
      <div class="qe-label">Question text</div>
      <textarea class="qe-input qe-qt" rows="2" placeholder="Type your question...">${esc(q.text||'')}</textarea>
      <div class="qe-label">Image (optional)</div>
      <div class="qe-img-row" id="qe-img-row-${i}">${q.image?`<img src="${q.image}" class="qe-img-thumb"><button class="qe-img-rm" onclick="window.removeQImage(${i})">Remove</button>`:`<button class="qe-img-add" onclick="window.pickQImage(${i})">+ Add image</button>`}</div>
      <div class="qe-label">${isMulti?'Options <span style="font-weight:400;text-transform:none;font-size:10px">(tick ALL correct answers)</span>':'Options <span style="font-weight:400;text-transform:none;font-size:10px">(select &#x25CF; for correct answer)</span>'}</div>
      ${optsHTML}
      <div class="qe-row">
        <div style="flex:1.2">
          <div class="qe-label">Question type</div>
          <select class="qe-select qe-type" onchange="window.onQTypeChange(${i},this.value)">
            <option value="mcq"${type==='mcq'?' selected':''}>Multiple Choice</option>
            <option value="tf"${type==='tf'?' selected':''}>True / False</option>
            <option value="multi"${type==='multi'?' selected':''}>Multi-Select</option>
          </select>
        </div>
        <div style="flex:1">
          <div class="qe-label">Time</div>
          <select class="qe-select qe-tl">
            ${[5,10,15,20,30,45,60].map(t=>`<option value="${t}"${tl===t?' selected':''}>${t}s</option>`).join('')}
          </select>
        </div>
        <div style="flex:1">
          <div class="qe-label">Points</div>
          <select class="qe-select qe-pts">
            ${[100,250,500,1000,2000].map(p=>`<option value="${p}"${pts===p?' selected':''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleQCard(i){
  const b=document.getElementById('qe-body-'+i); if(!b) return;
  b.style.display=b.style.display==='none'?'block':'none';
  if(b.style.display!=='none') autoGrow(b.querySelector('.qe-qt'));
}
function onQTypeChange(i,newType){
  collectEditorData();
  editingQuestions[i].type=newType;
  if(newType==='tf'){
    editingQuestions[i].options=['True','False'];
    editingQuestions[i].correct=0;
    delete editingQuestions[i].correctArr;
  } else if(newType==='mcq'){
    if(!editingQuestions[i].options||editingQuestions[i].options.length<4) editingQuestions[i].options=['','','',''];
    editingQuestions[i].correct=0;
    delete editingQuestions[i].correctArr;
  } else {
    if(!editingQuestions[i].options||editingQuestions[i].options.length<4) editingQuestions[i].options=['','','',''];
    editingQuestions[i].correctArr=editingQuestions[i].correct!=null?[editingQuestions[i].correct]:[];
    delete editingQuestions[i].correct;
  }
  renderQEditor();
  setTimeout(()=>{ const b=document.getElementById('qe-body-'+i); if(b) b.style.display='block'; },40);
}

function addQuestion(){
  collectEditorData();
  editingQuestions.push({text:'',options:['','','',''],correct:0,timeLimit:20,points:1000});
  renderQEditor();
  const newIdx=editingQuestions.length-1;
  setTimeout(()=>{
    toggleQCard(newIdx);
    document.querySelector(`#qe-q-${newIdx} .qe-qt`)?.focus();
    document.getElementById(`qe-body-${newIdx}`)?.scrollIntoView({behavior:'smooth',block:'nearest'});
  },60);
}

function deleteQ(i){
  collectEditorData();
  editingQuestions.splice(i,1);
  renderQEditor();
}

function moveQ(i,dir){
  collectEditorData();
  const j=i+dir;
  if(j<0||j>=editingQuestions.length) return;
  [editingQuestions[i],editingQuestions[j]]=[editingQuestions[j],editingQuestions[i]];
  renderQEditor();
  setTimeout(()=>{ const b=document.getElementById('qe-body-'+j); if(b) b.style.display='block'; },30);
}

async function confirmDeleteQuiz(id){
  const q=myQuizzes.find(x=>x.id===id);
  if(!confirm(`Delete "${q?.title||'this quiz'}"? This cannot be undone.`)) return;
  try{
    if(q?.code) await deleteDoc(doc(db,'quiz_codes',q.code));
    await deleteDoc(doc(db,'quizzes',id));
    toast('Quiz deleted');
    loadMyQuizzes();
  } catch(e){ console.error(e); toast('Error deleting quiz'); }
}

// ── Host session ───────────────────────────────────────────────────────────
async function runQuiz(id){
  let q=myQuizzes.find(x=>x.id===id);
  if(!q){ const s=await getDoc(doc(db,'quizzes',id)); if(!s.exists()){ toast('Quiz not found'); return; } q={id,...s.data()}; }
  if(!q.questions?.length){ toast('Add at least one question first'); return; }
  hostQuizData=q; hostRoomCode=q.code; hostCurrentQ=-1; hostAutoAdvance=false;

  // Clear any leftover players from a previous session
  try{
    const oldPlayers=await getDocs(collection(db,'quiz_rooms',hostRoomCode,'players'));
    if(!oldPlayers.empty){
      const batch=writeBatch(db);
      oldPlayers.docs.forEach(d=>batch.delete(d.ref));
      await batch.commit();
    }
  } catch(e){}

  await setDoc(doc(db,'quiz_rooms',hostRoomCode),{
    quizId:id, gameId:Math.random().toString(36).slice(2)+Date.now().toString(36), title:q.title, questions:q.questions.map(qq=>{const c={...qq}; delete c.image; return c;}),
    hostEmail:currentUser.email, hostName:currentUser.name,
    status:'lobby', currentQ:-1, questionStartedAt:null, autoAdvance:false, allowChanges:true,
    createdAt:serverTimestamp()
  });

  document.getElementById('qh-code').textContent=hostRoomCode;
  document.getElementById('qh-auto-advance').checked=false;
  document.getElementById('qh-allow-changes').checked=true; renderHowto(true);
  document.getElementById('qh-player-count').textContent='0';
  document.getElementById('qh-players-grid').innerHTML='';
  showHostPane('lobby');
  document.getElementById('quiz-host').style.display='flex';

  if(hostPlayersSub) hostPlayersSub();
  hostPlayersSub=onSnapshot(collection(db,'quiz_rooms',hostRoomCode,'players'),snap=>{
    const players=snap.docs.map(d=>({email:d.id,...d.data()}));
    document.getElementById('qh-player-count').textContent=players.length;
    document.getElementById('qh-players-grid').innerHTML=players.map(p=>`<div class="qs-player-chip"><span style="margin-right:5px;font-size:15px">${p.avatar||avatarFor(p.email)}</span>${esc(p.name||p.email)}</div>`).join('');
    if(hostCurrentQ>=0) updateRespBars(players);
  });
}

function showHostPane(name){
  ['lobby','question','reveal','leaderboard','end'].forEach(n=>{
    const el=document.getElementById('qh-'+n);
    if(el) el.style.display=n===name?'flex':'none';
  });
}

function setAutoAdvance(v){
  hostAutoAdvance=v;
  if(hostRoomCode) updateDoc(doc(db,'quiz_rooms',hostRoomCode),{autoAdvance:v}).catch(()=>{});
}
function setAllowChanges(v){
  if(hostRoomCode) updateDoc(doc(db,'quiz_rooms',hostRoomCode),{allowChanges:v}).catch(()=>{});
  renderHowto(v);
}
function renderHowto(allow){
  const txt = allow!==false
    ? "Changed your mind? Tap another answer until the clock runs out. Faster still means more points."
    : "Answers lock the instant you tap, so choose fast and choose wisely.";
  document.querySelectorAll('.howto-change-text').forEach(el=>el.textContent=txt);
}

async function startGame(){
  initSfx();
  hostCurrentQ=0;
  await updateDoc(doc(db,'quiz_rooms',hostRoomCode),{status:'question',currentQ:0,questionStartedAt:serverTimestamp()});
  const _r=await getDoc(doc(db,'quiz_rooms',hostRoomCode)); const _ms=_r.data()?.questionStartedAt?.toMillis?.()??Date.now();
  showHostQuestion(0,_ms);
}

function showHostQuestion(idx,startMs){
  const q=hostQuizData.questions[idx]; if(!q) return;
  document.getElementById('qh-qnum').textContent=`Q${idx+1} of ${hostQuizData.questions.length}`;
  document.getElementById('qh-q-text').textContent=q.text;
  setQImg('qh-q-image', q.image);
  document.getElementById('qh-pts-label').textContent=`${q.points||1000} pts · ${q.timeLimit||20}s`;
  const opts=q.options||[];
  document.getElementById('qh-resp-bars').innerHTML=opts.map((o,i)=>`
    <div class="qs-resp-row">
      <div class="qs-resp-letter" style="background:${Q_COLORS[i]}">${Q_LETTERS[i]}</div>
      <div class="qs-resp-track">
        <div class="qs-resp-fill" id="qh-bar-${i}" style="background:${Q_COLORS[i]};width:0%"></div>
      </div>
      <div id="qh-barcnt-${i}" class="qs-resp-cnt">0</div>
    </div>`).join('');
  document.getElementById('qh-resp-count').textContent='0';
  showHostPane('question');
  startHostTimer(q.timeLimit||20,startMs);
}

function startHostTimer(secs,startMs){
  if(hostTimerInterval) clearInterval(hostTimerInterval);
  const deadline=(startMs||Date.now())+secs*1000; let lastR=null;
  const tick=()=>{
    const r=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    const timerEl=document.getElementById('qh-timer'); const progEl=document.getElementById('qh-prog');
    if(timerEl) timerEl.textContent=r;
    if(r!==lastR){ if(r<=5&&r>0) sfx('tick'); lastR=r; }
    const pct=(r/secs)*100;
    if(progEl){ progEl.style.width=pct+'%'; progEl.style.background=pct>50?'#72C219':pct>20?'#D89E00':'#E84D56'; }
    if(r<=0){ clearInterval(hostTimerInterval); hostTimerInterval=null; if(hostAutoAdvance) hostReveal(); }
  };
  tick();
  hostTimerInterval=setInterval(tick,250);
}

function updateRespBars(players){
  const q=hostQuizData?.questions?.[hostCurrentQ]; if(!q) return;
  const type=q.type||'mcq';
  const optLen=q.options?.length||4;
  const counts=new Array(optLen).fill(0);
  let answered=0;
  players.forEach(p=>{
    const a=p.answers?.[hostCurrentQ]; if(!a) return;
    answered++;
    if(type==='multi'){(a.selectedIdxs||[]).forEach(ix=>{if(ix>=0&&ix<optLen)counts[ix]++;});}
    else if(a.answerIdx>=0&&a.answerIdx<optLen) counts[a.answerIdx]++;
  });
  const cntEl=document.getElementById('qh-resp-count'); if(cntEl) cntEl.textContent=answered;
  const maxCnt=Math.max(...counts,1);
  counts.forEach((cnt,i)=>{
    const bar=document.getElementById(`qh-bar-${i}`); const numEl=document.getElementById(`qh-barcnt-${i}`);
    if(!bar) return;
    bar.style.width=(cnt/maxCnt*100)+'%';
    if(numEl) numEl.textContent=cnt;
  });
}

async function hostReveal(){
  if(hostTimerInterval) clearInterval(hostTimerInterval);
  const q=hostQuizData.questions[hostCurrentQ];
  const type=q.type||'mcq';
  document.getElementById('qh-rev-q').textContent=q.text;
  const opts=q.options||[];
  const correctSet=type==='multi'?new Set(q.correctArr||[]):new Set([q.correct]);
  document.getElementById('qh-rev-opts').innerHTML=opts.map((o,i)=>`
    <div class="qs-ans-btn ${correctSet.has(i)?'qs-correct':'qs-wrong'}" style="pointer-events:none">
      <div class="qs-ans-letter">${Q_LETTERS[i]}</div>${esc(o)}
    </div>`).join('');
  const pSnap=await getDocs(collection(db,'quiz_rooms',hostRoomCode,'players'));
  const players=pSnap.docs.map(d=>d.data());
  const correctCount=players.filter(p=>p.answers?.[hostCurrentQ]?.correct).length;
  document.getElementById('qh-rev-stat').textContent=`${correctCount} of ${players.length} answered correctly`;
  await updateDoc(doc(db,'quiz_rooms',hostRoomCode),{status:'reveal'});
  showHostPane('reveal');
}

async function hostLeaderboard(){
  const pSnap=await getDocs(collection(db,'quiz_rooms',hostRoomCode,'players'));
  const players=pSnap.docs.map(d=>({email:d.id,...d.data()})).sort((a,b)=>(b.score||0)-(a.score||0));
  const isLast=hostCurrentQ>=hostQuizData.questions.length-1;
  document.getElementById('qh-lb-list').innerHTML=renderLB(players,null);
  document.getElementById('qh-next-btn').textContent=isLast?'End Quiz':'Next Question';
  await updateDoc(doc(db,'quiz_rooms',hostRoomCode),{status:'leaderboard'});
  showHostPane('leaderboard');
}

async function hostNextQuestion(){
  const isLast=hostCurrentQ>=hostQuizData.questions.length-1;
  if(isLast){
    await updateDoc(doc(db,'quiz_rooms',hostRoomCode),{status:'ended'});
    const pSnap=await getDocs(collection(db,'quiz_rooms',hostRoomCode,'players'));
    const players=pSnap.docs.map(d=>({email:d.id,...d.data()})).sort((a,b)=>(b.score||0)-(a.score||0));
    document.getElementById('qh-end-lb').innerHTML=renderPodium(players,null);
    showHostPane('end'); confettiBurst(220); sfx('fanfare');
    return;
  }
  hostCurrentQ++;
  await updateDoc(doc(db,'quiz_rooms',hostRoomCode),{status:'question',currentQ:hostCurrentQ,questionStartedAt:serverTimestamp()});
  const _r=await getDoc(doc(db,'quiz_rooms',hostRoomCode)); const _ms=_r.data()?.questionStartedAt?.toMillis?.()??Date.now();
  showHostQuestion(hostCurrentQ,_ms);
}

async function endHostSession(){
  if(hostTimerInterval) clearInterval(hostTimerInterval);
  if(hostPlayersSub){ hostPlayersSub(); hostPlayersSub=null; }
  try{ if(hostRoomCode) await updateDoc(doc(db,'quiz_rooms',hostRoomCode),{status:'ended'}); }catch(e){}
  document.getElementById('quiz-host').style.display='none'; hideSfxBtn();
  hostRoomCode=null; hostQuizData=null; hostCurrentQ=-1;
  loadMyQuizzes();
}

// ── Player session ─────────────────────────────────────────────────────────
async function joinByCode(){
  const code=document.getElementById('join-code').value.trim().toUpperCase();
  const errEl=document.getElementById('join-error');
  errEl.textContent='';
  if(code.length<4){ errEl.textContent='Enter a valid 6-character code'; return; }
  try{
    const roomSnap=await getDoc(doc(db,'quiz_rooms',code));
    if(!roomSnap.exists()){ errEl.textContent='No active session found. Ask the host to start the quiz first.'; return; }
    const room=roomSnap.data();
    if(room.status==='ended'){ errEl.textContent='This quiz session has already ended.'; return; }
    initSfx();
    pupInv=loadPups(room,code); pupArmedX2=false; playerStreak=0;
    playerImages={};
    try{ if(room.quizId){ const _qd=await getDoc(doc(db,'quizzes',room.quizId)); if(_qd.exists()){ (_qd.data().questions||[]).forEach((qq,_i)=>{ if(qq.image) playerImages[_i]=qq.image; }); } } }catch(e){}
    playerRoomCode=code; playerAnswered=false; playerCurrentQ=-1; playerMyAnswers={}; playerRoomCache=room;
    await setDoc(doc(db,'quiz_rooms',code,'players',currentUser.email),{
      name:currentUser.name, email:currentUser.email, score:0, answers:[], avatar:avatarFor(currentUser.email), joinedAt:serverTimestamp()
    },{merge:true});
    document.getElementById('qp-quiz-title').textContent=room.title||'Quiz';
    document.getElementById('qp-player-count').textContent='…';
    document.getElementById('quiz-player').style.display='flex';
    showPlayerPane('lobby');
    if(playerRoomSub){ playerRoomSub(); playerRoomSub=null; }
    if(playerPCountSub){ playerPCountSub(); playerPCountSub=null; }
    playerPCountSub=onSnapshot(collection(db,'quiz_rooms',code,'players'),snap=>{
      document.getElementById('qp-player-count').textContent=snap.size;
    });
    playerRoomSub=onSnapshot(doc(db,'quiz_rooms',code),snap=>{
      if(!snap.exists()) return;
      playerRoomCache=snap.data();
      handleRoomUpdate(playerRoomCache);
    });
  } catch(e){ console.error(e); errEl.textContent='Connection error, try again.'; }
}

function handleRoomUpdate(room){
  const status=room.status;
  renderHowto(room.allowChanges);
  if(status==='lobby'){ showPlayerPane('lobby'); }
  else if(status==='question'){
    if(room.currentQ!==playerCurrentQ){
      playerCurrentQ=room.currentQ; playerAnswered=false;
      showPlayerQuestion(room);
    } else if(playerAnswered){
      showPlayerPane('waiting');
    }
  }
  else if(status==='reveal'){ showPlayerReveal(room); }
  else if(status==='leaderboard'){ loadPlayerLeaderboard(); }
  else if(status==='ended'){ loadPlayerEnd(); }
}

function showPlayerPane(name){
  ['lobby','question','waiting','reveal','leaderboard','end'].forEach(n=>{
    const el=document.getElementById('qp-'+n);
    if(el) el.style.display=n===name?'flex':'none';
  });
}

let playerTimerInterval=null, playerSelectedMulti=new Set(), pendingSel=null, pendingSelTime=0;
function renderPups(){
  const el=document.getElementById('qp-pups'); if(!el) return;
  const q=playerRoomCache?.questions?.[playerCurrentQ]; const type=q?.type||'mcq';
  const b=(kind,label,enabled,armed)=>`<button class="qs-pup${armed?' armed':''}" ${enabled?'':'disabled'} onclick="window.usePup('${kind}')">${label}</button>`;
  el.innerHTML=b('fifty','50:50', pupInv.fifty&&type==='mcq'&&!playerAnswered, false)
    +b('x2','2\u00d7 Points', pupInv.x2&&!playerAnswered, pupArmedX2)
    +b('crowd','Ask Crowd', pupInv.crowd&&!playerAnswered, false);
}
function usePup(kind){
  if(playerAnswered) return;
  const q=playerRoomCache?.questions?.[playerCurrentQ]; const type=q?.type||'mcq';
  if(kind==='fifty'){
    if(!pupInv.fifty||type!=='mcq') return;
    pupInv.fifty=false; savePups();
    const opts=q.options||[], correct=q.correct;
    const wrongs=opts.map((_,i)=>i).filter(i=>i!==correct);
    const keep=wrongs[Math.floor(Math.random()*wrongs.length)];
    document.querySelectorAll('#qp-opts .qs-ans-btn').forEach((btn,i)=>{ if(i!==correct&&i!==keep){ btn.style.visibility='hidden'; btn.disabled=true; } });
    sfx('select');
  } else if(kind==='x2'){
    if(!pupInv.x2) return; pupArmedX2=!pupArmedX2;
  } else if(kind==='crowd'){
    if(!pupInv.crowd) return; pupInv.crowd=false; savePups(); showCrowd();
  }
  renderPups();
}
let crowdUnsub=null;
function stopCrowd(){ if(crowdUnsub){ crowdUnsub(); crowdUnsub=null; } }
function showCrowd(){
  const el=document.getElementById('qp-crowd'); if(!el) return;
  stopCrowd();
  el.style.display='flex'; el.innerHTML='<div style="flex:1;text-align:center;color:rgba(255,255,255,.5);font-size:12px">listening to the room\u2026</div>';
  crowdUnsub=onSnapshot(collection(db,'quiz_rooms',playerRoomCode,'players'),snap=>{
    const counts=[0,0,0,0]; let tot=0;
    snap.forEach(d=>{ const a=(d.data().answers||[])[playerCurrentQ]; if(!a) return;
      if(Array.isArray(a.selectedIdxs)){ a.selectedIdxs.forEach(i=>{ if(i>=0&&i<4) counts[i]++; }); tot++; }
      else if(typeof a.answerIdx==='number'&&a.answerIdx>=0){ counts[a.answerIdx]++; tot++; } });
    const q=playerRoomCache?.questions?.[playerCurrentQ]; const n=(q?.options||[]).length||4;
    el.innerHTML=Array.from({length:n},(_,i)=>{ const pct=tot?Math.round(counts[i]/tot*100):0;
      return `<div style="flex:1;text-align:center;min-width:40px"><div style="font-size:11px;color:rgba(255,255,255,.55);margin-bottom:2px">${Q_LETTERS[i]}</div><div style="font-size:16px;font-weight:800;color:#fff">${pct}%</div></div>`; }).join('')
      +`<div style="flex-basis:100%;text-align:center;font-size:10px;color:rgba(255,255,255,.4);margin-top:4px">${tot} answered so far</div>`;
  },err=>{});
}
function showPlayerQuestion(room){
  if(playerAnswered){ showPlayerPane('waiting'); return; }
  const q=room.questions?.[room.currentQ]; if(!q) return;
  const type=q.type||'mcq';
  document.getElementById('qp-qnum').textContent=`Q${room.currentQ+1} of ${room.questions.length}`;
  document.getElementById('qp-q-text').textContent=q.text;
  setQImg('qp-q-image', playerImages[room.currentQ]);
  const typeLabel=type==='tf'?'T/F':type==='multi'?'Multi-Select':'';
  document.getElementById('qp-pts-label').textContent=`${q.points||1000} pts${typeLabel?' · '+typeLabel:''}`;
  const opts=q.options||[];
  playerSelectedMulti=new Set(); pendingSel=null; pendingSelTime=0;
  const allow=room.allowChanges!==false;
  if(type==='tf'){
    document.getElementById('qp-opts').innerHTML=
      `<button class="qs-ans-btn" style="background:#1368CE;animation-delay:.05s;grid-column:1" onclick="window.playerPick(0)"><div class="qs-ans-letter">T</div>True</button>`+
      `<button class="qs-ans-btn" style="background:#E84D56;animation-delay:.1s;grid-column:2" onclick="window.playerPick(1)"><div class="qs-ans-letter">F</div>False</button>`+
      (allow?`<button class="qs-submit-btn" id="qp-lockin" onclick="window.playerLockIn()" disabled>Lock it in</button>`:'');
  } else if(type==='multi'){
    document.getElementById('qp-opts').innerHTML='<div class="multi-hint">Select all that apply</div>'+
      opts.map((o,i)=>`<button class="qs-ans-btn qs-multi-opt" id="qp-mopt-${i}" onclick="window.playerMultiToggle(${i})" style="animation-delay:${i*0.08}s"><div class="qs-ans-letter">${Q_LETTERS[i]}</div>${esc(o)}</button>`).join('')+
      `<button class="qs-submit-btn" id="qp-lockin" onclick="window.playerLockIn()" disabled>${allow?'Lock it in':'Submit answer'}</button>`;
  } else {
    document.getElementById('qp-opts').innerHTML=opts.map((o,i)=>`<button class="qs-ans-btn" onclick="window.playerPick(${i})" style="animation-delay:${i*0.08}s"><div class="qs-ans-letter">${Q_LETTERS[i]}</div>${esc(o)}</button>`).join('')+
      (allow?`<button class="qs-submit-btn" id="qp-lockin" onclick="window.playerLockIn()" disabled>Lock it in</button>`:'');
  }
  pupArmedX2=false; stopCrowd();
  const _cr=document.getElementById('qp-crowd'); if(_cr){ _cr.style.display='none'; _cr.innerHTML=''; }
  renderPups();
  showPlayerPane('question');
  const timeLimit=q.timeLimit||20;
  const startMs=room.questionStartedAt?.toMillis?.()??Date.now();
  const elapsed=(Date.now()-startMs)/1000;
  const remaining=Math.max(0,timeLimit-elapsed);
  startPlayerTimer(startMs,timeLimit);
}
function playerMultiToggle(idx){
  if(playerAnswered) return;
  const btn=document.getElementById('qp-mopt-'+idx); if(!btn) return;
  if(playerSelectedMulti.has(idx)){ playerSelectedMulti.delete(idx); btn.classList.remove('qs-selected'); }
  else { playerSelectedMulti.add(idx); btn.classList.add('qs-selected'); }
  pendingSelTime=Date.now();
  const sub=document.getElementById('qp-lockin');
  if(sub) sub.disabled=playerSelectedMulti.size===0;
}
function playerPick(i){
  if(playerAnswered) return;
  const room=playerRoomCache; const allow=room?.allowChanges!==false;
  if(!allow){ finalizeAnswer(i, Date.now()); return; }
  pendingSel=i; pendingSelTime=Date.now();
  document.querySelectorAll('#qp-opts .qs-ans-btn').forEach((b,idx)=>b.classList.toggle('qs-selected', idx===i));
  const lk=document.getElementById('qp-lockin'); if(lk) lk.disabled=false;
}
function playerLockIn(){
  if(playerAnswered) return;
  const room=playerRoomCache; const allow=room?.allowChanges!==false;
  const q=room?.questions?.[playerCurrentQ]; const type=q?.type||'mcq';
  const at=allow?(pendingSelTime||Date.now()):Date.now();
  if(type==='multi'){ if(playerSelectedMulti.size===0) return; finalizeAnswer(Array.from(playerSelectedMulti), at); }
  else { if(pendingSel==null) return; finalizeAnswer(pendingSel, at); }
}

function startPlayerTimer(startMs,total){
  if(playerTimerInterval) clearInterval(playerTimerInterval);
  const deadline=(startMs||Date.now())+total*1000; let lastR=null;
  const tick=()=>{
    const r=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    const tEl=document.getElementById('qp-timer'); const pEl=document.getElementById('qp-prog');
    if(tEl) tEl.textContent=r;
    if(r!==lastR){ if(r<=5&&r>0) sfx('tick'); lastR=r; }
    const pct=(r/total)*100;
    if(pEl){ pEl.style.width=pct+'%'; pEl.style.background=pct>50?'#72C219':pct>20?'#D89E00':'#E84D56'; }
    if(r<=0){ clearInterval(playerTimerInterval); playerTimerInterval=null; if(!playerAnswered) timeUp(); }
  };
  tick(); playerTimerInterval=setInterval(tick,250);
}

async function finalizeAnswer(selection, atTime){
  if(playerAnswered) return;
  playerAnswered=true;
  stopCrowd();
  sfx('select');
  if(playerTimerInterval) clearInterval(playerTimerInterval);
  const room=playerRoomCache;
  const q=room?.questions?.[playerCurrentQ];
  const type=q?.type||'mcq';
  const startMs=room?.questionStartedAt?.toMillis?.()??Date.now();
  const timeMs=Math.max(0,(atTime||Date.now())-startMs);
  const timeLimitMs=(q?.timeLimit||20)*1000;
  const timeLeft=Math.max(0,timeLimitMs-timeMs);
  const speedMult=0.5+0.5*(timeLeft/timeLimitMs);
  const basePoints=q?.points||1000;
  let answerData;
  if(type==='multi'){
    const selectedIdxs=(Array.isArray(selection)?selection:[selection]).slice().sort();
    const correctArr=(q?.correctArr||[]).slice().sort();
    const correctHit=selectedIdxs.filter(x=>correctArr.includes(x)).length;
    const wrongHit=selectedIdxs.filter(x=>!correctArr.includes(x)).length;
    const total=correctArr.length||1;
    const ratio=Math.max(0,(correctHit-wrongHit)/total);
    const pts=Math.round(ratio*basePoints*speedMult);
    const correct=ratio>=1;
    answerData={selectedIdxs,correct,points:pts,timeMs};
    document.querySelectorAll('#qp-opts .qs-multi-opt').forEach(b=>b.disabled=true);
  } else {
    const answerIdx=Array.isArray(selection)?selection[0]:selection;
    const correct=answerIdx===q?.correct;
    const pts=correct?Math.round(basePoints*speedMult):0;
    answerData={answerIdx,correct,points:pts,timeMs};
    document.querySelectorAll('#qp-opts .qs-ans-btn').forEach((btn,i)=>{
      btn.disabled=true;
      if(i===answerIdx) btn.classList.add('qs-selected');
      else btn.style.opacity='0.4';
    });
  }
  if(answerData.correct){ playerStreak++; } else { playerStreak=0; }
  const streakMult=answerData.correct?(1+Math.min(0.5,Math.max(0,(playerStreak-1)*0.1))):1;
  answerData.points=Math.round((answerData.points||0)*streakMult);
  if(pupArmedX2){ pupInv.x2=false; savePups(); answerData.x2=true; if(answerData.correct) answerData.points*=2; else answerData.points=-100; }
  answerData.streak=playerStreak;
  playerMyAnswers[playerCurrentQ]=answerData;
  try{
    const playerRef=doc(db,'quiz_rooms',playerRoomCode,'players',currentUser.email);
    const pSnap=await getDoc(playerRef);
    const existingAnswers=pSnap.data()?.answers||[];
    while(existingAnswers.length<=playerCurrentQ) existingAnswers.push(null);
    existingAnswers[playerCurrentQ]=answerData;
    const newScore=existingAnswers.reduce((s,a)=>s+(a?.points||0),0);
    await updateDoc(playerRef,{answers:existingAnswers,score:newScore});
  } catch(e){ console.error(e); }
  const icon=document.getElementById('qp-wait-icon');
  const msg=document.getElementById('qp-wait-msg');
  if(icon) icon.innerHTML=SVG.checkCircle;
  if(msg) msg.textContent='Answer locked in!';
  setTimeout(()=>showPlayerPane('waiting'),350);
}

function timeUp(){
  if(playerAnswered) return;
  const _r=playerRoomCache; const _allow=_r?.allowChanges!==false; const _q=_r?.questions?.[playerCurrentQ]; const _type=_q?.type||'mcq';
  if(_allow){
    if(_type==='multi' && playerSelectedMulti.size>0){ finalizeAnswer(Array.from(playerSelectedMulti), pendingSelTime||Date.now()); return; }
    if(_type!=='multi' && pendingSel!=null){ finalizeAnswer(pendingSel, pendingSelTime||Date.now()); return; }
  }
  playerAnswered=true;
  stopCrowd();
  if(pupArmedX2){ pupInv.x2=false; savePups(); }
  playerMyAnswers[playerCurrentQ]={answerIdx:-1,correct:false,points:0,timeMs:(playerRoomCache?.questions?.[playerCurrentQ]?.timeLimit||20)*1000};
  const icon=document.getElementById('qp-wait-icon');
  const msg=document.getElementById('qp-wait-msg');
  if(icon) icon.innerHTML=SVG.clock;
  if(msg) msg.textContent="Time's up!";
  showPlayerPane('waiting');
}

function showPlayerReveal(room){
  if(playerTimerInterval) clearInterval(playerTimerInterval);
  const qIdx=room.currentQ??playerCurrentQ;
  const q=room.questions?.[qIdx]; if(!q) return;
  const type=q.type||'mcq';
  const myAns=playerMyAnswers[qIdx]??{answerIdx:-1,correct:false,points:0};
  const correct=myAns.correct;
  const pts=myAns.points||0;
  const icon=document.getElementById('qp-rev-icon');
  if(icon){ icon.innerHTML=correct?SVG.check:SVG.x; icon.style.color=correct?'#72C219':'#ef4444'; }
  sfx(correct?'correct':'wrong'); if(correct) confettiBurst(70);
  const msgEl=document.getElementById('qp-rev-msg');
  if(msgEl){
    if(correct) msgEl.textContent='Correct!';
    else if(pts>0) msgEl.textContent='Partial credit!';
    else if(!myAns.selectedIdxs&&myAns.answerIdx===-1) msgEl.textContent="Time's up!";
    else msgEl.textContent='Wrong!';
  }
  const ptsEl=document.getElementById('qp-rev-pts');
  if(ptsEl){ let t=pts>0?`+${pts.toLocaleString()} pts`:(pts<0?`${pts.toLocaleString()} pts`:'No points this round'); ptsEl.innerHTML=(myAns.x2?'\u26a1 ':'')+t+(myAns.streak>=2?` \u00b7 <span style="color:#ff9a3d">\ud83d\udd25 ${myAns.streak} streak</span>`:''); }
  const opts=q.options||[];
  const correctSet=type==='multi'?new Set(q.correctArr||[]):new Set([q.correct]);
  const selectedSet=new Set(type==='multi'?(myAns.selectedIdxs||[]):[myAns.answerIdx]);
  const revOpts=document.getElementById('qp-rev-opts');
  if(revOpts) revOpts.innerHTML=opts.map((o,i)=>{
    const isCor=correctSet.has(i); const isSel=selectedSet.has(i);
    let cls='qs-wrong';
    if(isCor&&isSel) cls='qs-correct qs-selected';
    else if(isCor) cls='qs-correct';
    else if(isSel) cls='qs-selected qs-wrong';
    return `<div class="qs-ans-btn ${cls}" style="pointer-events:none"><div class="qs-ans-letter">${Q_LETTERS[i]}</div>${esc(o)}</div>`;
  }).join('');
  showPlayerPane('reveal');
}

async function loadPlayerLeaderboard(){
  try{
    const pSnap=await getDocs(collection(db,'quiz_rooms',playerRoomCode,'players'));
    const players=pSnap.docs.map(d=>({email:d.id,...d.data()})).sort((a,b)=>(b.score||0)-(a.score||0));
    const lbEl=document.getElementById('qp-lb-list');
    if(lbEl) lbEl.innerHTML=renderLB(players,currentUser.email);
    showPlayerPane('leaderboard');
  } catch(e){}
}

async function loadPlayerEnd(){
  try{
    const pSnap=await getDocs(collection(db,'quiz_rooms',playerRoomCode,'players'));
    const players=pSnap.docs.map(d=>({email:d.id,...d.data()})).sort((a,b)=>(b.score||0)-(a.score||0));
    const myRank=players.findIndex(p=>p.email===currentUser.email)+1;
    const me=players.find(p=>p.email===currentUser.email);
    const iconEl=document.getElementById('qp-end-icon');
    if(iconEl) iconEl.textContent=myRank===1?'🥇':myRank===2?'🥈':myRank===3?'🥉':'🎉';
    const msgEl=document.getElementById('qp-end-msg');
    if(msgEl) msgEl.textContent=myRank<=3?`You finished #${myRank}!`:'Quiz Complete!';
    const rankEl=document.getElementById('qp-end-rank');
    if(rankEl) rankEl.textContent=`Rank #${myRank} of ${players.length}`;
    const scoreEl=document.getElementById('qp-end-score');
    if(scoreEl) countUp(scoreEl,(me?.score||0),{from:0,dur:900,prefix:'Final score: ',suffix:' pts'});
    const lbEl=document.getElementById('qp-end-lb');
    if(lbEl) lbEl.innerHTML=renderLB(players,currentUser.email);
    showPlayerPane('end'); confettiBurst(200); sfx('fanfare');
  } catch(e){}
}

function leavePlayerSession(){
  stopCrowd();
  if(playerRoomSub){ playerRoomSub(); playerRoomSub=null; }
  if(playerPCountSub){ playerPCountSub(); playerPCountSub=null; }
  if(playerTimerInterval){ clearInterval(playerTimerInterval); playerTimerInterval=null; }
  playerRoomCode=null; playerCurrentQ=-1; playerAnswered=false; playerMyAnswers={}; playerRoomCache=null; playerSelectedMulti=new Set();
  document.getElementById('quiz-player').style.display='none'; hideSfxBtn();
  document.getElementById('join-code').value='';
  document.getElementById('join-error').textContent='';
}

// ── Leaderboard renderers ──────────────────────────────────────────────────
function renderLB(players,myEmail){
  return players.slice(0,10).map((p,i)=>`
    <div class="qs-lb-row ${p.email===myEmail?'qs-me':''}" style="animation-delay:${i*0.07}s">
      <div class="qs-lb-rank">${rankEmoji(i+1)}</div>
      <div class="qs-lb-av">${p.avatar||avatarFor(p.email)}</div><div class="qs-lb-name">${esc(p.name||p.email)}</div>
      <div class="qs-lb-score">${(p.score||0).toLocaleString()}</div>
    </div>`).join('');
}
function renderPodium(players,myEmail){
  if(!players.length) return '';
  // Visual order: 2nd left, 1st centre, 3rd right
  const order=[players[1]||null,players[0]||null,players[2]||null];
  const heights=['88px','118px','66px'];
  const delays=['.1s','0s','.2s'];
  const bgs=[
    'linear-gradient(to bottom,#b0b0b0,#787878)',
    'linear-gradient(to bottom,#FFD700,#D4A000)',
    'linear-gradient(to bottom,#CD7F32,#8B4513)'
  ];
  const medals=['🥈','🥇','🥉'];
  const ranks=[2,1,3];
  const podium=`<div class="podium-wrap">
    ${order.map((p,idx)=>!p?`<div class="podium-col"></div>`:
      `<div class="podium-col">
        <div class="podium-pname" style="${p.email===myEmail?'color:#72C219':''}">${medals[idx]} ${esc(p.name||p.email)}</div>
        <div class="podium-pscore">${(p.score||0).toLocaleString()} pts</div>
        <div class="podium-avatar" style="background:${bgs[idx]}">${p.avatar||avatarFor(p.email)}</div>
        <div class="podium-bar" style="background:${bgs[idx]};height:${heights[idx]};animation-delay:${delays[idx]}">
          <div class="podium-rank">#${ranks[idx]}</div>
        </div>
      </div>`
    ).join('')}
  </div>`;
  const rest=players.slice(3).map((p,i)=>`
    <div class="qs-lb-row ${p.email===myEmail?'qs-me':''}" style="animation-delay:${(i+0.4)*0.08}s">
      <div class="qs-lb-rank">${rankEmoji(i+4)}</div>
      <div class="qs-lb-av">${p.avatar||avatarFor(p.email)}</div><div class="qs-lb-name">${esc(p.name||p.email)}</div>
      <div class="qs-lb-score">${(p.score||0).toLocaleString()}</div>
    </div>`).join('');
  return podium+rest;
}


window.login=login; window.logout=logout;
window.addTopic=addTopic; window.deleteTopic=deleteTopic;
async function restoreTopic(id){ if(currentUser.role!=='admin') return; try{ await updateDoc(doc(db,'topics',id),{discussed:false}); toast('Restored to active'); }catch(e){ toast('Error'); } }
async function deleteHistory(id){ if(currentUser.role!=='admin') return; if(!confirm('Delete this topic from history? This cannot be undone.')) return; try{ await deleteDoc(doc(db,'topics',id)); toast('Deleted'); }catch(e){ toast('Error'); } }
window.restoreTopic=restoreTopic; window.deleteHistory=deleteHistory;
window.markDiscussed=markDiscussed; window.openEdit=openEdit;
window.closeEdit=closeEdit; window.saveEdit=saveEdit;
window.castVote=castVote; window.setVotingMode=setVotingMode;
window.confirmClearVotes=confirmClearVotes; window.dismissClearVotes=dismissClearVotes;
window.executeClearVotes=executeClearVotes;
window.addMember=addMember; window.removeMember=removeMember;
window.toggleMenu=toggleMenu; window.closeMenu=closeMenu;
window.toggleTheme=toggleTheme; window.switchTab=switchTab;
window.switchQTab=switchQTab; window.createQuiz=createQuiz;
window.openQuizEditor=openQuizEditor; window.closeQuizEditor=closeQuizEditor;
window.saveAndCloseEditor=saveAndCloseEditor; window.addQuestion=addQuestion;
window.deleteQ=deleteQ; window.moveQ=moveQ; window.toggleQCard=toggleQCard;
window.confirmDeleteQuiz=confirmDeleteQuiz; window.toggleAllQuizzes=toggleAllQuizzes;
window.runQuiz=runQuiz; window.setAutoAdvance=setAutoAdvance; window.setAllowChanges=setAllowChanges;
window.startGame=startGame; window.hostReveal=hostReveal;
let pvQ=null,pvIdx=0,pvScore=0,pvCorrect=0,pvSel=new Set(),pvDone=false;
let pvTimerInt=null,pvDeadline=0,pvStreak=0,pvPup={fifty:true,x2:true,crowd:true},pvX2=false,pvCrowdInt=null;
function previewQuiz(id){
  const q=myQuizzes.find(x=>x.id===id);
  if(!q||!(q.questions&&q.questions.length)){ toast('Add questions first'); return; }
  initSfx();
  pvQ=q; pvIdx=0; pvScore=0; pvCorrect=0; pvStreak=0; pvPup={fifty:true,x2:true,crowd:true};
  document.getElementById('quiz-preview').style.display='flex';
  pvRender();
}
function pvClose(){ if(pvTimerInt){clearInterval(pvTimerInt);pvTimerInt=null;} if(pvCrowdInt){clearInterval(pvCrowdInt);pvCrowdInt=null;} const el=document.getElementById('quiz-preview'); if(el) el.style.display='none'; pvQ=null; hideSfxBtn(); }
function pvCorrectSet(q){ return new Set(q.correctArr||(q.correct!=null?[q.correct]:[])); }
function pvRender(){
  pvDone=false; pvSel=new Set(); pvX2=false; if(pvCrowdInt){ clearInterval(pvCrowdInt); pvCrowdInt=null; }
  const q=pvQ.questions[pvIdx], n=pvQ.questions.length, opts=q.options||[], type=q.type||'mcq';
  document.getElementById('pv-qnum').textContent=`Q${pvIdx+1} of ${n}`;
  document.getElementById('pv-qtext').textContent=q.text||'(no question text)';
  setQImg('pv-qimage', q.image);
  const cr=document.getElementById('pv-crowd'); if(cr){ cr.style.display='none'; cr.innerHTML=''; }
  const grid=document.getElementById('pv-answers');
  if(type==='tf'){
    grid.innerHTML=`<button class="qs-ans-btn" id="pv-opt-0" style="background:#1368CE;grid-column:1" onclick="window.pvPick(0)"><div class="qs-ans-letter">T</div>True</button>`
      +`<button class="qs-ans-btn" id="pv-opt-1" style="background:#E84D56;grid-column:2" onclick="window.pvPick(1)"><div class="qs-ans-letter">F</div>False</button>`;
  } else if(type==='multi'){
    grid.innerHTML='<div class="multi-hint">Select all that apply, then Submit</div>'+opts.map((o,i)=>`<button class="qs-ans-btn qs-multi-opt" id="pv-opt-${i}" onclick="window.pvToggle(${i})"><div class="qs-ans-letter">${Q_LETTERS[i]}</div>${esc(o)}</button>`).join('')
      +`<button class="qs-submit-btn" id="pv-submit" onclick="window.pvSubmitMulti()" disabled>Submit answer</button>`;
  } else {
    grid.innerHTML=opts.map((o,i)=>`<button class="qs-ans-btn" id="pv-opt-${i}" onclick="window.pvPick(${i})"><div class="qs-ans-letter">${Q_LETTERS[i]}</div>${esc(o)}</button>`).join('');
  }
  document.getElementById('pv-footer').innerHTML='';
  pvRenderPups();
  pvStartTimer(q.timeLimit||20);
}
function pvRenderPups(){
  const el=document.getElementById('pv-pups'); if(!el) return;
  const q=pvQ.questions[pvIdx], type=q?.type||'mcq';
  const b=(kind,label,enabled,armed)=>`<button class="qs-pup${armed?' armed':''}" ${enabled?'':'disabled'} onclick="window.pvUsePup('${kind}')">${label}</button>`;
  el.innerHTML=b('fifty','50:50', pvPup.fifty&&type==='mcq'&&!pvDone, false)
    +b('x2','2\u00d7 Points', pvPup.x2&&!pvDone, pvX2)
    +b('crowd','Ask Crowd', pvPup.crowd&&!pvDone, false);
}
function pvUsePup(kind){
  if(pvDone) return;
  const q=pvQ.questions[pvIdx], type=q?.type||'mcq';
  if(kind==='fifty'){
    if(!pvPup.fifty||type!=='mcq') return; pvPup.fifty=false;
    const opts=q.options||[], correct=q.correct;
    const wrongs=opts.map((_,i)=>i).filter(i=>i!==correct);
    const keep=wrongs[Math.floor(Math.random()*wrongs.length)];
    opts.forEach((_,i)=>{ if(i!==correct&&i!==keep){ const bb=document.getElementById('pv-opt-'+i); if(bb){ bb.style.visibility='hidden'; bb.disabled=true; } } });
    sfx('select');
  } else if(kind==='x2'){ if(!pvPup.x2) return; pvX2=!pvX2; }
  else if(kind==='crowd'){ if(!pvPup.crowd) return; pvPup.crowd=false; pvShowCrowd(); }
  pvRenderPups();
}
function pvShowCrowd(){
  const el=document.getElementById('pv-crowd'); if(!el) return;
  if(pvCrowdInt){ clearInterval(pvCrowdInt); pvCrowdInt=null; }
  const q=pvQ.questions[pvIdx], opts=q.options||[], n=opts.length||4, cs=pvCorrectSet(q), multi=(q.type==='multi');
  const weight=opts.map((_,i)=>cs.has(i)?(3+Math.random()*2):(0.5+Math.random()*1.5));
  const counts=new Array(n).fill(0); let voters=0; const target=8+Math.floor(Math.random()*14);
  el.style.display='flex';
  const render=()=>{
    el.innerHTML=Array.from({length:n},(_,i)=>`<div style="flex:1;text-align:center;min-width:40px"><div style="font-size:11px;color:rgba(255,255,255,.55);margin-bottom:2px">${Q_LETTERS[i]}</div><div style="font-size:16px;font-weight:800;color:#fff">${voters?Math.round(counts[i]/voters*100):0}%</div></div>`).join('')
      +`<div style="flex-basis:100%;text-align:center;font-size:10px;color:rgba(255,255,255,.4);margin-top:4px">${voters} answered so far \u00b7 simulated</div>`; };
  render();
  pvCrowdInt=setInterval(()=>{
    if(pvDone || voters>=target){ clearInterval(pvCrowdInt); pvCrowdInt=null; return; }
    if(multi){
      const picks=new Set();
      cs.forEach(i=>{ if(i<n && Math.random()<0.8) picks.add(i); });
      for(let i=0;i<n;i++){ if(!cs.has(i) && Math.random()<0.18) picks.add(i); }
      if(!picks.size && cs.size){ const c=[...cs].filter(i=>i<n); if(c.length) picks.add(c[0]); }
      picks.forEach(i=>counts[i]++);
    } else {
      const wtot=weight.reduce((a,b)=>a+b,0); let r=Math.random()*wtot, idx=0;
      for(let i=0;i<n;i++){ r-=weight[i]; if(r<=0){ idx=i; break; } }
      counts[idx]++;
    }
    voters++; render();
  },450);
}
function pvToggle(i){
  if(pvDone) return;
  const b=document.getElementById('pv-opt-'+i); if(!b) return;
  if(pvSel.has(i)){ pvSel.delete(i); b.classList.remove('qs-selected'); } else { pvSel.add(i); b.classList.add('qs-selected'); }
  const sub=document.getElementById('pv-submit'); if(sub) sub.disabled=pvSel.size===0;
}
function pvStartTimer(total){
  if(pvTimerInt) clearInterval(pvTimerInt);
  pvDeadline=Date.now()+total*1000; let lastR=null;
  const tick=()=>{
    const r=Math.max(0,Math.ceil((pvDeadline-Date.now())/1000));
    const tEl=document.getElementById('pv-timer'); const pEl=document.getElementById('pv-prog');
    if(tEl) tEl.textContent=r;
    if(r!==lastR){ if(r<=5&&r>0) sfx('tick'); lastR=r; }
    const pct=(r/total)*100;
    if(pEl){ pEl.style.width=pct+'%'; pEl.style.background=pct>50?'#72C219':pct>20?'#D89E00':'#E84D56'; }
    if(r<=0){ clearInterval(pvTimerInt); pvTimerInt=null; if(!pvDone) pvTimeUp(); }
  };
  tick(); pvTimerInt=setInterval(tick,250);
}
function pvFinish(picked){
  if(pvDone) return; pvDone=true;
  if(pvTimerInt){ clearInterval(pvTimerInt); pvTimerInt=null; }
  if(pvCrowdInt){ clearInterval(pvCrowdInt); pvCrowdInt=null; }
  const q=pvQ.questions[pvIdx], type=q.type||'mcq', total=q.timeLimit||20, base=q.points||1000;
  const timeLeft=Math.max(0,(pvDeadline-Date.now())/1000); const speed=0.5+0.5*(timeLeft/total);
  const cs=pvCorrectSet(q);
  let correct,pts;
  if(type==='multi'){
    const cArr=[...cs]; const hit=[...picked].filter(i=>cs.has(i)).length; const wrong=[...picked].filter(i=>!cs.has(i)).length;
    const ratio=Math.max(0,(hit-wrong)/(cArr.length||1)); pts=Math.round(ratio*base*speed); correct=ratio>=1;
  } else {
    correct=picked.has(q.correct); pts=correct?Math.round(base*speed):0;
  }
  if(correct){ pvStreak++; } else { pvStreak=0; }
  const sMult=correct?(1+Math.min(0.5,Math.max(0,(pvStreak-1)*0.1))):1;
  pts=Math.round(pts*sMult);
  let x2used=false;
  if(pvX2){ x2used=true; pvPup.x2=false; if(correct) pts*=2; else pts=-100; }
  if(correct) pvCorrect++;
  pvScore+=pts;
  pvReveal(q,picked,correct,pts,x2used);
}
function pvReveal(q,picked,correct,pts,x2used){
  const cs=pvCorrectSet(q);
  (q.options||[]).forEach((_,i)=>{
    const b=document.getElementById('pv-opt-'+i); if(!b) return;
    b.disabled=true; b.classList.remove('qs-selected'); b.style.visibility='';
    if(cs.has(i)) b.classList.add('qs-correct');
    else if(picked.has(i)) b.classList.add('qs-selected','qs-wrong');
    else b.classList.add('qs-wrong');
  });
  const sb=document.getElementById('pv-submit'); if(sb) sb.style.display='none';
  pvRenderPups();
  sfx(correct?'correct':'wrong'); if(correct) confettiBurst(70);
  const last=pvIdx>=pvQ.questions.length-1;
  const ptsTxt=pts>0?`+${pts.toLocaleString()} pts`:(pts<0?`${pts.toLocaleString()} pts`:'No points');
  const badge=(x2used?'\u26a1 ':'')+ptsTxt+(pvStreak>=2?` \u00b7 <span style="color:#ff9a3d">\ud83d\udd25 ${pvStreak} streak</span>`:'');
  document.getElementById('pv-footer').innerHTML=
    `<div style="color:${correct?'#72C219':'#ef5564'};font-weight:800;font-size:17px;margin-bottom:3px">${correct?'Correct!':'Not quite'}</div>`
    +`<div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:12px">${badge}</div>`
    +`<button class="qs-next-btn" onclick="window.pvNext()">${last?'See results':'Next question'} ${SVG.arrowRight}</button>`;
}
function pvTimeUp(){ if(pvDone) return; pvFinish(new Set()); }
function pvPick(i){ if(pvDone) return; sfx('select'); pvFinish(new Set([i])); }
function pvSubmitMulti(){ if(pvDone||pvSel.size===0) return; sfx('select'); pvFinish(new Set(pvSel)); }
function pvNext(){ if(pvIdx>=pvQ.questions.length-1){ pvSummary(); return; } pvIdx++; pvRender(); }
function pvSummary(){
  if(pvTimerInt){ clearInterval(pvTimerInt); pvTimerInt=null; }
  const n=pvQ.questions.length, pct=Math.round(pvCorrect/n*100);
  document.getElementById('pv-qnum').textContent='Results';
  document.getElementById('pv-timer').textContent='';
  document.getElementById('pv-prog').style.width='100%';
  document.getElementById('pv-qtext').textContent='Preview complete';
  setQImg('pv-qimage',null);
  document.getElementById('pv-pups').innerHTML='';
  const cr=document.getElementById('pv-crowd'); if(cr) cr.style.display='none';
  document.getElementById('pv-answers').innerHTML=
    `<div style="grid-column:1/-1;text-align:center"><div style="font-size:64px;font-weight:900;color:#72C219;font-variant-numeric:tabular-nums">${pct}%</div><div style="color:rgba(255,255,255,.8);font-size:15px;margin-top:4px">${pvCorrect} of ${n} correct \u00b7 ${pvScore.toLocaleString()} pts</div></div>`;
  document.getElementById('pv-footer').innerHTML=`<button class="qs-next-btn" onclick="window.pvRestart()">Run again</button>`;
  if(pct>=50) confettiBurst(160);
}
function pvRestart(){ pvIdx=0; pvScore=0; pvCorrect=0; pvStreak=0; pvPup={fifty:true,x2:true,crowd:true}; pvRender(); }
window.usePup=usePup; window.pvUsePup=pvUsePup; window.pickQImage=pickQImage; window.removeQImage=removeQImage; window.previewQuiz=previewQuiz; window.pvClose=pvClose; window.pvPick=pvPick; window.pvToggle=pvToggle; window.pvSubmitMulti=pvSubmitMulti; window.pvNext=pvNext; window.pvRestart=pvRestart;
window.hostLeaderboard=hostLeaderboard; window.hostNextQuestion=hostNextQuestion;
window.endHostSession=endHostSession; window.joinByCode=joinByCode;
window.playerPick=playerPick; window.playerLockIn=playerLockIn; window.leavePlayerSession=leavePlayerSession;
window.playerMultiToggle=playerMultiToggle; window.onQTypeChange=onQTypeChange;

window.closeVoterPanel=closeVoterPanel;

document.documentElement.setAttribute('data-theme','light');
let _booted=false;
function _boot(){ if(_booted) return; _booted=true;
  seedAdmin().catch(console.error);
  const saved=localStorage.getItem('roundtable_user');
  if(saved){ try{ currentUser=JSON.parse(saved); startApp(); }catch(e){ localStorage.removeItem('roundtable_user'); } }
}
onAuthStateChanged(auth, u=>{ if(u) _boot(); });
signInAnonymously(auth).catch(e=>{ console.error('Anonymous auth unavailable, enable it in the Firebase console. Booting without it for now.',e); _boot(); });
