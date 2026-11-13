(function(){
'use strict';
var PHONE='+61423031003';
var TZ='Australia/Adelaide';
var SERVICES=[
 {g:'Standard acupuncture',n:'Initial Standard Acupuncture',p:130,d:60,acu:true},
 {g:'Standard acupuncture',n:'Follow-up Standard Acupuncture',p:100,d:50,acu:true},
 {g:'Electroacupuncture',n:'Initial Electroacupuncture',p:150,d:70,acu:true},
 {g:'Electroacupuncture',n:'Follow-up Electroacupuncture',p:120,d:60,acu:true},
 {g:'Cosmetic acupuncture',n:'Initial Cosmetic Acupuncture',p:130,d:70,acu:true},
 {g:'Cosmetic acupuncture',n:'Follow-up Cosmetic Acupuncture',p:100,d:60,acu:true},
 {g:'Other treatments',n:'Moxibustion',p:100,d:45,acu:false},
 {g:'Other treatments',n:'Chinese Massage',p:100,d:60,acu:false}
];
// Opening hours in minutes from midnight, index 0 = Sunday
var HOURS=[[750,1050],[570,1170],[540,1170],[540,1170],[540,1170],[540,1170],[630,1170]];
var STEP=30, LEAD=60, DAYS_FIRST=21, DAYS_MAX=90;
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var $=function(id){return document.getElementById(id)};
var state={svc:null,date:null,time:null,shown:DAYS_FIRST};

function nowAdl(){
  var parts={};
  new Intl.DateTimeFormat('en-AU',{timeZone:TZ,year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'})
    .formatToParts(new Date()).forEach(function(p){parts[p.type]=p.value});
  return {y:+parts.year,m:+parts.month,d:+parts.day,min:(+parts.hour)*60+(+parts.minute)};
}
function addDays(y,m,d,n){var t=new Date(Date.UTC(y,m-1,d+n));return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate(),dow:t.getUTCDay()}}
function key(o){return o.y+'-'+String(o.m).padStart(2,'0')+'-'+String(o.d).padStart(2,'0')}
function fmtTime(min){var h=Math.floor(min/60),m=min%60,ap=h>=12?'pm':'am',h12=h%12||12;return h12+':'+String(m).padStart(2,'0')+ap}
function fmtDur(min){var h=Math.floor(min/60),m=min%60;return (h?h+' hr'+(m?' ':''):'')+(m?m+' mins':'')}
function fmtDate(o){return DOW[o.dow]+' '+o.d+' '+MON[o.m-1]+' '+o.y}
function duration(){if(!state.svc)return 0;return state.svc.d+(state.svc.acu&&$('cupping').checked?30:0)}

function slotsFor(day){
  var h=HOURS[day.dow],out=[],dur=duration()||STEP,now=nowAdl(),today=key(day)===key(now);
  for(var t=h[0];t+dur<=h[1];t+=STEP){ if(today&&t<now.min+LEAD)continue; out.push(t); }
  return out;
}

function renderServices(){
  var box=$('services'),last='';
  SERVICES.forEach(function(s,i){
    if(s.g!==last){var g=document.createElement('p');g.className='bk-group';g.textContent=s.g;box.appendChild(g);last=s.g}
    var l=document.createElement('label');l.className='bk-opt';
    l.innerHTML='<input type="radio" name="svc" value="'+i+'"><span class="n"></span><span class="m"></span>';
    l.querySelector('.n').textContent=s.n;
    l.querySelector('.m').innerHTML='$'+s.p+'<br>'+fmtDur(s.d);
    l.querySelector('input').addEventListener('change',function(){state.svc=s;syncCupping();renderTimes();summary()});
    box.appendChild(l);
  });
}
function syncCupping(){
  var c=$('cupping'),ok=state.svc&&state.svc.acu;
  c.disabled=!ok; if(!ok)c.checked=false;
  c.parentNode.classList.toggle('off',!ok);
}
function renderDates(){
  var box=$('dates'),n=nowAdl();box.innerHTML='';
  for(var i=0;i<state.shown;i++){
    var day=addDays(n.y,n.m,n.d,i);
    if(i===0&&!slotsFor(day).length)continue;
    var b=document.createElement('button');b.type='button';b.className='bk-chip';b.setAttribute('role','radio');
    b.dataset.k=key(day);b.setAttribute('aria-checked',state.date&&key(state.date)===key(day)?'true':'false');
    b.setAttribute('aria-label',fmtDate(day));
    b.innerHTML='<small>'+(i===0?'Today':i===1?'Tmrw':DOW[day.dow])+'</small><b>'+day.d+'</b><small>'+MON[day.m-1]+'</small>';
    (function(day){b.addEventListener('click',function(){state.date=day;state.time=null;
      Array.prototype.forEach.call(box.children,function(c){c.setAttribute('aria-checked',c.dataset.k===key(day)?'true':'false')});
      renderTimes();summary()})})(day);
    box.appendChild(b);
  }
  $('moreDates').hidden=state.shown>=DAYS_MAX;
}
function renderTimes(){
  var box=$('times');box.innerHTML='';
  if(!state.date){$('timeHint').textContent='Choose a date first.';return}
  var s=slotsFor(state.date),h=HOURS[state.date.dow];
  if(state.time!==null&&s.indexOf(state.time)<0)state.time=null;
  $('timeHint').textContent=s.length?('Open '+fmtTime(h[0])+' to '+fmtTime(h[1])+' on '+DOW[state.date.dow]+'. Start times'+(state.svc?' fit a '+fmtDur(duration())+' appointment':'')+'.'):'No times left on this day. Please choose another date.';
  s.forEach(function(t){
    var b=document.createElement('button');b.type='button';b.className='bk-chip';b.setAttribute('role','radio');
    b.setAttribute('aria-checked',state.time===t?'true':'false');b.textContent=fmtTime(t);
    b.addEventListener('click',function(){state.time=t;Array.prototype.forEach.call(box.children,function(c){c.setAttribute('aria-checked',c===b?'true':'false')});summary()});
    box.appendChild(b);
  });
}
function message(){
  var s=state.svc,cup=s.acu&&$('cupping').checked,notes=$('notes').value.trim();
  var lines=['BOOKING REQUEST - Lotus Acupuncture',
    'Treatment: '+s.n+' ('+fmtDur(s.d)+', $'+s.p+')'];
  if(cup)lines.push('Add-on: Fire Cupping (30 mins, $50)');
  lines.push('Date: '+fmtDate(state.date),
    'Time: '+fmtTime(state.time)+' - '+fmtTime(state.time+duration()),
    'Name: '+$('name').value.trim(),
    'Mobile: '+$('phone').value.trim());
  if(notes)lines.push('Notes: '+notes);
  lines.push('','Please text me back to confirm. Thank you!');
  return lines.join('\n');
}
function isIOS(){var u=navigator.userAgent;return /iPad|iPhone|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)}
function smsHref(body){return 'sms:'+PHONE+(isIOS()?'&':'?')+'body='+encodeURIComponent(body)}
function summary(){
  var el=$('summary');
  if(!(state.svc&&state.date&&state.time!==null)){el.hidden=true;return}
  var cup=state.svc.acu&&$('cupping').checked;
  el.hidden=false;
  el.textContent='Your request: '+state.svc.n+(cup?' + Fire Cupping':'')+'\n'+fmtDate(state.date)+', '+fmtTime(state.time)+' to '+fmtTime(state.time+duration())+'\nTotal $'+(state.svc.p+(cup?50:0));
}
function validate(){
  if(!state.svc)return['Please choose a treatment.','services'];
  if(!state.date)return['Please choose a date.','dates'];
  if(state.time===null)return['Please choose a time.','times'];
  if(!$('name').value.trim())return['Please enter your name.','name'];
  var p=$('phone').value.replace(/[^\d+]/g,'');
  if(!/^(\+?61|0)4\d{8}$/.test(p)&&!/^\+?\d{8,15}$/.test(p))return['Please enter a mobile number Liping can text back.','phone'];
  return null;
}
function init(){
  renderServices();syncCupping();renderDates();
  $('cupping').addEventListener('change',function(){renderTimes();summary()});
  function recheck(){if($('error').textContent){var e=validate();$('error').textContent=e?e[0]:''}}
  $('bk').addEventListener('click',function(){setTimeout(recheck,0)});$('bk').addEventListener('input',recheck);
  $('moreDates').addEventListener('click',function(){state.shown=Math.min(DAYS_MAX,state.shown+21);renderDates()});
  $('bk').addEventListener('submit',function(e){
    e.preventDefault();
    var err=validate();$('error').textContent=err?err[0]:'';
    if(err){var t=$(err[1]);t.scrollIntoView({behavior:'smooth',block:'center'});if(t.focus&&t.tagName==='INPUT')t.focus();return}
    var href=smsHref(message());
    $('smsAgain').href=href;
    $('bk').hidden=true;$('done').hidden=false;window.scrollTo(0,0);$('done').focus({preventScroll:true});
    window.location.href=href;
  });
  $('startOver').addEventListener('click',function(){$('done').hidden=true;$('bk').hidden=false;window.scrollTo(0,0)});
  window.__lotusBooking={message:message,smsHref:smsHref,state:state};
}
init();
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/book'}).catch(function(){})})}
})();
