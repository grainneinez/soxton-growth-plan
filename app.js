(function(){
'use strict';
const data=window.SOXT_DATA;
const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const menu=$('navigation');
$('menuToggle').addEventListener('click',()=>{const open=$('menuToggle').getAttribute('aria-expanded')==='true';$('menuToggle').setAttribute('aria-expanded',String(!open));menu.hidden=open;});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;$('menuToggle').setAttribute('aria-expanded','false');}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){menu.hidden=true;$('menuToggle').setAttribute('aria-expanded','false');$('menuToggle').focus();}});
function renderPhase(index){
 const p=data.phases[index];
 document.querySelectorAll('[data-phase]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});
 $('phasePanel').setAttribute('aria-labelledby','phase-'+index);
 $('phasePanel').innerHTML=`<div class="phase-layout"><div class="phase-overview"><p class="eyebrow">${esc(p.range)}</p><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="phase-deliverable"><span class="eyebrow">What I would deliver</span><p>${esc(p.deliverable)}</p></div></div><div class="phase-tasks">${p.tasks.map((t,i)=>`<article class="phase-task"><span>0${i+1}</span><div><h4>${esc(t[0])}</h4><p>${esc(t[1])}</p></div></article>`).join('')}</div></div><div class="phase-decision"><div><h4>MEASURE</h4><p>${esc(p.measure)}</p></div><div><h4>DECISION GATE</h4><p>${esc(p.gate)}</p></div></div><p class="phase-owners">${esc(p.owners)}</p>`;
}
const phaseButtons=Array.from(document.querySelectorAll('[data-phase]'));
phaseButtons.forEach((b,i)=>{b.addEventListener('click',()=>renderPhase(i));b.addEventListener('keydown',event=>{let n;if(event.key==='ArrowRight')n=(i+1)%3;if(event.key==='ArrowLeft')n=(i+2)%3;if(event.key==='Home')n=0;if(event.key==='End')n=2;if(n!==undefined){event.preventDefault();renderPhase(n);phaseButtons[n].focus();}});});
document.querySelectorAll('[data-jump-phase]').forEach(a=>a.addEventListener('click',()=>renderPhase(Number(a.dataset.jumpPhase))));
function renderChannels(filter){
 const channels=data.channels.map((c,i)=>({...c,index:i})).filter(c=>filter==='all'||c.kind===filter);
 $('channelCount').textContent=`Showing ${channels.length} distribution target${channels.length===1?'':'s'}`;
 $('channelList').innerHTML=channels.map(c=>`<details class="channel-item"><summary><span>${String(c.index+1).padStart(2,'0')}</span><div><h3>${esc(c.name)}</h3><p>${esc(c.status)}</p></div><span class="channel-audience">${esc(c.audience)}</span><span class="plus" aria-hidden="true">+</span></summary><div class="channel-body"><p><b>PUBLIC EVIDENCE</b>${esc(c.proof)}</p><p><b>WHO / HOW TO REACH</b>${esc(c.role)}</p><p><b>THE SPECIFIC OFFER</b>${esc(c.offer)}</p><p><b>FIRST NEXT STEP</b>${esc(c.next)}</p><p class="channel-caution"><b>CHECK BEFORE PURSUING</b>${esc(c.constraint)}</p><div class="channel-links">${c.sources.map(n=>`<a href="${esc(data.sources[n-1][1])}" target="_blank" rel="noopener noreferrer">Source ${n} ↗</a>`).join('')}</div></div></details>`).join('');
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));renderChannels(b.dataset.filter);}));
function renderDraft(){const d=data.drafts[$('draftSelect').value];$('draftSubject').textContent='Subject: '+d.subject;$('draftText').textContent=d.text;$('draftNote').textContent=d.note;$('copyStatus').textContent='';}
$('draftSelect').addEventListener('change',renderDraft);
$('copyDraft').addEventListener('click',async()=>{const d=data.drafts[$('draftSelect').value];try{await navigator.clipboard.writeText('Subject: '+d.subject+'\n\n'+d.text);$('copyStatus').textContent='Copied to clipboard';}catch{const range=document.createRange();range.selectNodeContents($('draftText'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('copyStatus').textContent='Text selected. Use your copy shortcut.';}});
$('sourceList').innerHTML=data.sources.map((s,i)=>`<li id="source-${i+1}"><a href="${esc(s[1])}" target="_blank" rel="noopener noreferrer">${esc(s[0])} ↗</a><p>${esc(s[2])}</p></li>`).join('');
function openSource(){if(/^#source-\d+$/.test(location.hash)){$('sourceDetails').open=true;const target=document.querySelector(location.hash);if(target)target.scrollIntoView({block:'center',behavior:'auto'});}}
document.querySelectorAll('a[href^="#source-"]').forEach(a=>a.addEventListener('click',()=>{$('sourceDetails').open=true;}));
window.addEventListener('hashchange',openSource);
function routeRequest(s){
 const priority=s.urgent?'Urgent · review still required':'Standard priority';
 if(s.type==='unclear'||!s.complete||(s.type==='review'&&!s.document))return {id:'clarify',priority,title:'Clarify before progressing',reason:s.type==='unclear'?'The intended legal task is not clear.':!s.complete?'Essential facts about the parties or business purpose are missing.':'The counterparty document is needed before a review can begin.',action:'Ask targeted follow-up questions and request any missing source document. Preserve known facts; do not fill gaps with assumptions.',gate:s.exception?'Flag the sensitive issue for an attorney while collecting the missing information.':'An attorney defines the legal scope once the intake is complete.'};
 if(s.exception)return {id:'escalate',priority,title:'Escalate the exception',reason:'A non-standard term or sensitive issue needs attorney judgment before routine processing.',action:'Prepare a concise brief with the business objective, relevant facts, source references and the flagged issue.',gate:'An attorney determines the treatment and approves the next step.'};
 if(s.type==='review')return {id:'review',priority,title:'Prepare a playbook-based review',reason:'The counterparty document and essential context are available.',action:'Organise the document against an attorney-approved playbook, preserve clause references and record proposed issues for review.',gate:'An attorney verifies the analysis and any proposed redlines before client delivery.'};
 return {id:'draft',priority,title:'Prepare an attorney-review draft',reason:'The request is clear and the essential intake facts are complete.',action:'An intake brief and draft from an attorney-approved template, with facts and assumptions separated.',gate:'An attorney reviews the draft and decides whether it is ready for the client.'};
}
const cases=[
 {name:'Complete new request',input:{type:'new',complete:true},expected:'draft'},
 {name:'Counterparty document present',input:{type:'review',complete:true,document:true},expected:'review'},
 {name:'Missing business context',input:{type:'new',complete:false},expected:'clarify'},
 {name:'Missing counterparty document',input:{type:'review',complete:true,document:false},expected:'clarify'},
 {name:'Unclear request with other fields complete',input:{type:'unclear',complete:true,document:true},expected:'clarify'},
 {name:'Exception in an otherwise complete request',input:{type:'new',complete:true,exception:true},expected:'escalate'},
 {name:'Urgency does not bypass missing information',input:{type:'review',complete:false,urgent:true},expected:'clarify'},
 {name:'Urgent exception still reaches attorney',input:{type:'review',complete:true,document:true,exception:true,urgent:true},expected:'escalate'}
];

function update(){const r=routeRequest({type:$('requestType').value,complete:$('factsComplete').checked,document:$('documentPresent').checked,exception:$('exceptionFlag').checked,urgent:$('urgentFlag').checked});$('priorityLabel').textContent=r.priority;$('routeTitle').textContent=r.title;$('routeReason').textContent=r.reason;$('routeAction').textContent=r.action;$('routeGate').textContent=r.gate;}
['requestType','factsComplete','documentPresent','exceptionFlag','urgentFlag'].forEach(id=>$(id).addEventListener('change',update));
document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{const sample=button.dataset.sample;$('requestType').value=sample==='new'?'new':'review';$('factsComplete').checked=sample!=='missing';$('documentPresent').checked=sample==='review';$('exceptionFlag').checked=false;$('urgentFlag').checked=sample==='missing';update();}));
$('runTests').addEventListener('click',()=>{const results=cases.map(c=>({...c,actual:routeRequest(c.input).id}));const passed=results.filter(c=>c.expected===c.actual).length;$('testResults').innerHTML='<p>'+passed+' / '+results.length+' routing checks passed in this prototype.</p><table><thead><tr><th scope="col">Scenario</th><th scope="col">Expected route</th><th scope="col">Result</th></tr></thead><tbody>'+results.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.expected)+'</td><td class="'+(c.actual===c.expected?'pass':'')+'">'+(c.actual===c.expected?'Pass':'Fail: '+esc(c.actual))+'</td></tr>').join('')+'</tbody></table><p class="fineprint">These checks evaluate routing logic only. They do not measure legal accuracy or AI-model quality.</p>';$('runTests').innerHTML='Run checks again <span>↗</span>';});
renderPhase(0);renderChannels('all');renderDraft();update();openSource();
})();
