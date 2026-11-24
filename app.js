{
const C=window.CONTENT, $=s=>document.querySelector(s);
const el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e};
// motion follows the visitor's system setting until they press the Motion button
let calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
try{const m=localStorage.getItem('motion');if(m)calm=m==='off'}catch(e){}
const showMotion=()=>{document.documentElement.classList.toggle('calm',calm);$('#motion').textContent=calm?'Motion off':'Motion on';$('#motion').setAttribute('aria-pressed',!calm)};
$('#motion').onclick=()=>{calm=!calm;try{localStorage.setItem('motion',calm?'off':'on')}catch(e){}showMotion()};
showMotion();
const wait=ms=>new Promise(r=>setTimeout(r,calm?0:ms));
const run=(e,k,o)=>calm?Promise.resolve():e.animate(k,o).finished.catch(()=>{});

// box = where the item sits in the 896 by 1200 picture; tray = its size in the tray
const ITEMS=[
 {id:'journal',name:'Journal',box:[412,391,115,124],tray:.62},
 {id:'mp3',name:'MP3',box:[529,390,121,151],tray:.5},
 {id:'id',name:'ID card',box:[417,516,84,103],tray:.72},
 {id:'keys',name:'Keys',box:[564,546,68,71],tray:.9}];
const by=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const stage=$('#stage');
let sel='journal',busy=false,open=null,near=false,cam={s:1,x:0,y:0};

/* camera */
function fit(ease){
 const W=innerWidth,H=innerHeight,h=H-(W<1100?62:0);
 const r=near?{x:368,y:282,w:364,h:704}:{x:187,y:0,w:540,h:1200};
 const s=Math.min(W/r.w,h/r.h);
 cam={s,x:W/2-(r.x+r.w/2)*s,y:(h-r.h*s)/2-r.y*s};
 stage.classList.toggle('ease',!!ease);
 stage.style.transform=`translate(${cam.x}px,${cam.y}px) scale(${s})`;
}
addEventListener('resize',()=>fit(false));
$('#zoom').onclick=()=>{near=!near;$('#zoom').textContent=near?'Step back':'Step closer';fit(true)};

/* machine sounds */
let ac=null,sfxOn=true;
const audio=()=>{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac};
function tone(f,d,type='square',v=.05,f2=f,at=0){
 if(!sfxOn)return;
 try{const a=audio(),t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d)}catch(e){}
}
function noise(d,f,v){
 if(!sfxOn)return;
 try{const a=audio(),b=a.createBuffer(1,a.sampleRate*d,a.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=a.createBufferSource(),q=a.createBiquadFilter(),g=a.createGain();s.buffer=b;q.type='lowpass';q.frequency.value=f;g.gain.value=v;s.connect(q).connect(g).connect(a.destination);s.start()}catch(e){}
}
const sfx={
 key:()=>tone(880,.07),
 bad:()=>{tone(180,.14);tone(140,.2,'square',.05,120,.14)},
 whirr:()=>{tone(70,.5,'sawtooth',.05,110);tone(46,.5,'square',.03,60)},
 thunk:()=>{noise(.2,420,.6);tone(95,.18,'sine',.3,42)},
 page:()=>noise(.25,2400,.12),
 click:()=>tone(1500,.02,'square',.03)};
$('#sound').onclick=e=>{sfxOn=!sfxOn;e.target.textContent=sfxOn?'Sound on':'Sound off';e.target.setAttribute('aria-pressed',sfxOn)};

/* shelf, screen, keypad */
const btn={},row={};
ITEMS.forEach(it=>{
 const [x,y,w,h]=it.box,b=el('button','item');
 b.type='button';b.setAttribute('aria-label','Get the '+it.name);
 b.style.cssText=`left:${x-383}px;top:${y-292}px;width:${w}px;height:${h}px`;
 const im=el('img');im.src=`assets/${it.id}.png`;im.alt='';b.append(im);
 b.onmouseenter=()=>pick(it.id);
 b.onfocus=()=>{if(b.matches(':focus-visible'))pick(it.id)};
 b.onclick=()=>vend(it.id);
 $('#window').append(b);btn[it.id]=b;
 const r=el('button','',it.name);r.type='button';r.tabIndex=-1;
 r.onmouseenter=()=>pick(it.id);r.onclick=()=>vend(it.id);
 $('#rows').append(r);row[it.id]=r;
});
let note=0;
function foot(t,hold){
 $('#foot').textContent=t||(M.playing?'♪ '+M.list[M.i].title:'Ready');
 clearTimeout(note);if(hold)note=setTimeout(()=>foot(),hold);
}
const unlit=()=>ITEMS.forEach(i=>btn[i.id].classList.remove('sel'));
function pick(id,quiet){
 if(busy)return;sel=id;
 ITEMS.forEach(i=>{btn[i.id].classList.toggle('sel',!quiet&&i.id===id);row[i.id].classList.toggle('sel',i.id===id)});
}
$('#window').onmouseleave=$('#rows').onmouseleave=unlit;
'123456789C0E'.split('').forEach(k=>{
 const b=el('button');b.type='button';b.tabIndex=-1;b.dataset.k=k;
 b.setAttribute('aria-label',k==='C'?'Cancel':k==='E'?'Enter':k);
 b.onclick=()=>press(k);$('#pad').append(b);
});
function press(k){
 if(busy||open)return;
 const b=$(`#pad [data-k="${k}"]`);b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),130);
 if(k==='C'){sfx.key();foot();return unlit()}
 if(k==='E'){sfx.key();return vend(sel)}
 const it=ITEMS[+k-1];
 if(it){sfx.key();vend(it.id)}else{sfx.bad();foot(`Slot ${k} empty`,1800)}
}

/* dispensing */
async function vend(id){
 if(busy||open)return;
 pick(id);busy=true;
 const it=by[id],b=btn[id],[,y,w,h]=it.box;
 unlit();foot('Vending...');sfx.whirr();
 await run(b,[{transform:'rotate(0)'},{transform:'rotate(-3deg)'},{transform:'rotate(3deg)'},{transform:'rotate(-2deg)'},{transform:'rotate(4deg)'}],{duration:520});
 await run(b,[{transform:'rotate(4deg)'},{transform:`translateY(${630-y}px) rotate(${id==='keys'?40:14}deg)`}],{duration:430,easing:'cubic-bezier(.6,0,.95,.6)',fill:'forwards'});
 b.style.visibility='hidden';b.getAnimations().forEach(a=>a.cancel());
 await wait(160);
 const t=el('img'),tw=w*it.tray,th=h*it.tray;
 t.src=`assets/${id}.png`;t.alt='';t.style.cssText=`width:${tw}px;height:${th}px;margin-left:${-tw/2}px`;
 $('#tray').prepend(t);sfx.thunk();
 run($('#tray'),[{translate:'0 0'},{translate:'0 2px'},{translate:'0 0'}],{duration:140});
 await run(t,[{transform:'translateY(-100px) rotate(-20deg)'},{transform:'translateY(0) rotate(6deg)',offset:.6},{transform:'translateY(-9px) rotate(3deg)',offset:.8},{transform:'none'}],{duration:420,easing:'ease-in'});
 foot('Take item');await wait(420);
 const f=$('#fly'),sx=cam.x+(524.5-tw/2)*cam.s,sy=cam.y+(934-th)*cam.s,S=Math.min(innerWidth*.6/w,innerHeight*.6/h);
 f.src=t.src;f.width=w;f.height=h;f.hidden=false;t.remove();
 const end=`translate(${innerWidth/2-w*S/2}px,${innerHeight/2-h*S/2}px) scale(${S})`;
 await run(f,[{transform:`translate(${sx}px,${sy}px) scale(${it.tray*cam.s})`,opacity:1},{transform:end,opacity:1,offset:.75},{transform:end,opacity:0}],{duration:820,easing:'cubic-bezier(.3,0,.2,1)'});
 f.hidden=true;busy=false;show(id);
}
function show(id){
 if(open)return;
 open=id;btn[id].style.visibility='hidden';
 $('#veil').hidden=false;$('#veil').scrollTop=0;
 document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!=='p-'+id);
 $('#room').inert=$('#bar').inert=true;$('#samplenote').hidden=!C.sample;
 if(id==='journal'){spread=0;page()}else if(id==='mp3')drawM();else if(id==='id'){side=0;card()}
 run($('#veil'),[{opacity:0},{opacity:1}],{duration:260});
 if(id==='id')run($('.hang'),[{transform:'translateY(-60px) rotate(7deg)'},{transform:'rotate(-4deg)'},{transform:'rotate(2deg)'},{transform:'none'}],{duration:1300,easing:'ease-out'});
 if(id==='keys'){
  tone(2600,.12,'triangle',.06);tone(3300,.1,'triangle',.05,3000,.08);
  run($('.hook img'),[{transform:'rotate(16deg)'},{transform:'rotate(-10deg)'},{transform:'rotate(4deg)'},{transform:'none'}],{duration:1100,easing:'ease-out'});
 }
 foot('Thank you');$('#back').focus({preventScroll:true});
 if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
}
async function shut(){
 if(!open)return;
 if(!$('#zoomed').hidden){$('#zoomed').hidden=true;return}
 const id=open,b=btn[id];
 await run($('#veil'),[{opacity:1},{opacity:0}],{duration:200});
 if(open!==id)return;
 open=null;$('#veil').hidden=true;$('#room').inert=$('#bar').inert=false;
 history.replaceState(null,'','#');
 b.style.visibility='';run(b,[{opacity:0,transform:'translateY(-14px)'},{opacity:1,transform:'none'}],{duration:350});
 b.focus({preventScroll:true});unlit();foot();
}
$('#back').onclick=shut;
$('#veil').onclick=e=>{if(e.target===$('#veil'))shut()};
addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(open){
  if(e.key==='Escape')shut();
  else if(e.key==='Tab'){
   const f=[...$('#veil').querySelectorAll('button,a')].filter(n=>n.offsetParent&&!n.disabled),a=f.indexOf(document.activeElement);
   if(e.shiftKey?a<=0:a===f.length-1){e.preventDefault();f.at(e.shiftKey?-1:0).focus()}
  }
  else if(open==='journal'&&e.key==='ArrowRight')turn(1);
  else if(open==='journal'&&e.key==='ArrowLeft')turn(-1);
  else if(open==='mp3'){
   if(e.key==='ArrowRight')M.go(1);else if(e.key==='ArrowLeft')M.go(-1);
   else if(e.key==='ArrowDown')spin(1);else if(e.key==='ArrowUp')spin(-1);else return;
   e.preventDefault();
  }
  return;
 }
 if(/^[0-9]$/.test(e.key))press(e.key);
 else if(e.key==='ArrowDown'||e.key==='ArrowUp'){
  const i=ITEMS.findIndex(x=>x.id===sel);pick(ITEMS[(i+(e.key==='ArrowDown'?1:3))%4].id);sfx.click();e.preventDefault();
 }
 else if(e.key==='Enter'&&document.activeElement===document.body)press('E');
});

/* sample drawings, 96 by 72 */
function scene(n){
 const c=el('canvas');c.width=96;c.height=72;const g=c.getContext('2d');let s=n*7919+13;
 const R=(k=1)=>(s=s*16807%2147483647)/2147483647*k;
 const P=(x,y,w,h,f)=>{g.fillStyle=f;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const sky=(a,h=72)=>a.forEach((f,i)=>{const b=h/a.length;P(0,i*b,96,b+1,f);if(i)for(let x=0;x<96;x+=2){P(x+(i%2),i*b-1,1,1,f);P(x,i*b-3,1,1,x%4?f:a[i-1])}});
 const disc=(x,y,r,f)=>{for(let j=-r;j<=r;j++){const w=Math.floor(Math.sqrt(r*r-j*j));P(x-w,y+j,w*2+1,1,f)}};
 [()=>{
   sky(['#0f1b33','#16294a','#21406a','#315f86'],46);
   for(let i=0;i<34;i++)P(R(96),R(34),1,1,R()>.6?'#ddffff':'#6f8fb5');
   disc(66,18,9,'#f4ecc8');disc(63,16,2,'#d9cfa5');disc(69,22,1,'#d9cfa5');
   for(let x=0;x<96;x+=3)P(x,42-R(8),3,12,'#12202f');
   P(0,46,96,26,'#1b3a57');
   for(let y=47;y<72;y+=2){const w=4+(y-46)*.6;P(66-w+R(4)-2,y,w*2*R(),1,'#e9e0b8');P(R(96),y,R(14),1,'#2d5f80')}
   P(18,56,20,3,'#0b1420');P(21,59,14,2,'#0b1420');P(27,40,1,16,'#0b1420');P(28,41,7,9,'#c96f55');
  },()=>{
   sky(['#9a4f74','#e0716b','#f2a071','#f7cb8c'],44);
   for(let x=0;x<96;x+=6)P(x,44-R(20)-4,6,30,'#35284f');
   for(let i=0;i<30;i++)P(R(96),28+R(16),1,1,'#ffd98a');
   P(0,44,96,28,'#2a2430');P(0,0,96,7,'#2a2430');P(0,0,7,72,'#2a2430');P(89,0,7,72,'#2a2430');P(46,0,4,46,'#2a2430');P(7,43,82,2,'#54485c');
   [10,54].forEach(x=>{P(x,52,32,20,'#5a8a78');P(x,52,32,3,'#78ab95');P(x+15,55,1,17,'#4a7464')});
   [24,70].forEach(x=>{P(x,7,1,8,'#887c90');disc(x,17,3,'#b7abbc');disc(x,17,1,'#3c3347')});
  },()=>{
   sky(['#0c1116','#111a20','#17262c'],58);P(0,0,26,60,'#1c2529');P(70,0,26,60,'#1c2529');
   for(let y=3;y<58;y+=6)for(let x=y%4;x<96;x+=9)if(x<20||x>70)P(x,y,6,1,'#253237');
   P(0,58,96,14,'#131b1f');
   for(let i=0;i<9;i++)P(30+i,58+i*1.5,38-i*2+R(4),1,'rgba(120,235,190,.3)');
   P(36,16,26,44,'#3f6b64');P(36,16,26,6,'#ff9f88');P(38,18,22,2,'#ffd9c8');P(39,25,14,22,'#a8f5d6');
   for(let y=0;y<3;y++)for(let x=0;x<4;x++)P(40+x*3,27+y*7,2,4,['#c96f55','#e8c872','#5a6fb0'][(x+y)%3]);
   P(55,27,5,8,'#1c2c2c');P(56,28,3,3,'#7dffb0');P(40,50,13,6,'#1c2c2c');
   for(let i=0;i<40;i++)P(32+R(6),20+R(40),2,2,R()>.5?'#2f6b45':'#1e4a33');
   for(let i=0;i<26;i++)P(59+R(8),34+R(26),2,2,R()>.5?'#2f6b45':'#1e4a33');
  },()=>{
   sky(['#3f6fae','#5c93c4','#8fbcd6','#d5dfd8','#f2d9b8']);
   for(let k=0;k<9;k++){const x=R(96),y=46+R(24);for(let i=0;i<7;i++)disc(Math.round(x+i*3-9),Math.round(y+R(3)),2+(R(3)|0),'#f7efe0')}
   for(let x=0;x<52;x++){const t=x/52,h=Math.sin(Math.PI*Math.min(1,t*.9+.1))*11*(1-t*.45);P(18+x,28-h*.6+t*4,1,h*1.3+2,'#2c4566');P(18+x,29+h*.25+t*4,1,Math.max(1,h*.45),'#c5d3d6');if(x%3===0&&x<30)P(18+x,31+h*.3,1,h*.3,'#8ea5b5')}
   P(68,30,8,3,'#2c4566');P(73,24,4,8,'#2c4566');P(76,21,6,4,'#2c4566');P(75,32,9,3,'#2c4566');
   P(26,28,2,2,'#f7efe0');P(26,29,1,1,'#101820');P(38,37,7,3,'#22374f');P(41,39,7,3,'#22374f');
  },()=>{
   sky(['#10211f','#15302b','#1c4238']);
   for(let i=0;i<11;i++)P(i*9+R(4),0,3+R(3),62,i%2?'#0c1a19':'#122823');
   P(0,58,96,14,'#0e1c18');
   for(let i=0;i<120;i++)P(R(96),56+R(6),1,3,R()>.5?'#2f6b45':'#1d4a35');
   [[24,34,13],[56,24,18],[80,42,9]].forEach(([x,y,r])=>{
    P(x-2,y,5,64-y,'#d9cfb4');P(x+1,y,2,64-y,'#a89a7c');
    for(let j=0;j<r*.7;j++){const w=r*Math.sqrt(j/(r*.7));P(x-w,y-r*.7+j,w*2+1,1,j<r*.25?'#ef8f78':'#c9573f')}
    for(let k=0;k<5;k++)P(x-r*.6+R(r*1.2),y-2-R(r*.25),2,2,'#ffe3cf');
    P(x-r*.9,y,r*1.8,1,'#8fe3bf');
    for(let k=0;k<26;k++)P(x-r+R(r*2),y+2+R(18),1,1,'rgba(143,227,191,.6)');
   });
  },()=>{
   P(0,0,96,72,'#7a5a4a');for(let x=0;x<96;x+=8)P(x,0,1,72,'#6d4f41');
   P(22,6,52,44,'#4a3128');P(25,9,46,38,'#f6d58a');P(25,30,46,17,'#e8a865');
   for(let i=0;i<12;i++)disc(Math.round(28+R(40)),Math.round(38+R(5)),3,'#8f9a56');
   P(47,9,2,38,'#4a3128');P(25,27,46,2,'#4a3128');P(18,48,60,5,'#5d4034');
   for(let k=0;k<8;k++)P(10+k,55+k*2,30,1,'#b07f54');
   P(0,66,96,6,'#4a3128');P(29,41,7,7,'#b7593f');
   for(let i=0;i<20;i++)P(27+R(10),32+R(9),2,2,R()>.5?'#4f7a45':'#39603a');
   P(58,42,8,6,'#e9e2cf');P(66,43,2,3,'#e9e2cf');for(let i=0;i<4;i++)P(60+i%2,39-i*3,1,2,'#fff3cf');
   for(let x=0;x<20;x++){const h=54-x*.8+Math.sin(x)*3,f=x%4<2?'#c98f78':'#b57d68';P(x,0,1,h,f);P(95-x,0,1,h,f)}
  }][n%6]();
 return c.toDataURL();
}
const art=C.journal.map((a,i)=>({...a,px:!a.src,img:a.src||scene(i)}));

/* journal */
let spread=0,turning=false;
function pic(a,click){const b=el('button','pic'),i=el('img',a.px?'px':'');b.type='button';i.src=a.img;i.alt=a.title;b.append(i);b.onclick=click;return b}
function page(){
 const L=$('.pg.left'),R=$('.pg.right');L.replaceChildren();R.replaceChildren();
 if(!spread){
  L.append(el('h2','','Journal'),el('p','','Drawings by '+C.card.name+'.'),el('p','meta',art.length+(art.length===1?' drawing inside.':' drawings inside. Pick one, or turn the page.')));
  const g=el('div','thumbs');
  art.forEach((a,i)=>{const b=pic(a,()=>turn(i+1));b.setAttribute('aria-label','Open '+a.title);g.append(b)});
  R.append(g);
 }else{
  const a=art[spread-1],b=pic(a,()=>{const z=$('#zoomed'),i=el('img',a.px?'px':'');i.src=a.img;i.alt=a.title;z.replaceChildren(i);z.hidden=false});
  b.setAttribute('aria-label','Enlarge '+a.title);
  L.append(b);R.append(el('h2','',a.title),el('p','meta',[a.medium,a.when].filter(Boolean).join(', ')),el('p','',a.note));
 }
 $('#count').textContent=spread?`${spread} of ${art.length}`:'Contents';
 $('#prev').disabled=!spread;$('#next').disabled=spread===art.length;
}
async function turn(d){
 const n=Math.max(0,Math.min(art.length,spread+d));
 if(turning||n===spread)return;
 turning=true;sfx.page();
 const f=$('.leaf'),fwd=n>spread;f.hidden=calm;
 if(innerWidth<=700){
  await run(f,[{opacity:0},{opacity:1}],{duration:130});spread=n;page();
  await run(f,[{opacity:1},{opacity:0}],{duration:160});
 }else{
  const k=[{transform:'rotateY(0)'},{transform:'rotateY(-180deg)'}],p=run(f,fwd?k:k.reverse(),{duration:560,easing:'ease-in-out'});
  await wait(260);spread=n;page();await p;
 }
 f.hidden=true;turning=false;
}
$('#prev').onclick=()=>turn(-1);$('#next').onclick=()=>turn(1);
$('#zoomed').onclick=()=>$('#zoomed').hidden=true;

/* id card */
let side=0;
function card(){
 const k=C.card,c=$('#card');c.replaceChildren();
 if(!side){
  const h=el('div','head'),d=el('div');let p;
  if(k.photo){p=el('img','photo');p.src=k.photo;p.alt=k.name;p.style.imageRendering='auto'}
  else{
   p=el('canvas','photo');p.width=32;p.height=38;
   const g=p.getContext('2d'),F=(f,...r)=>{g.fillStyle=f;g.fillRect(...r)};
   F('#5d7580',0,0,32,38);F('#6c8791',0,0,32,10);F('#273239',10,7,12,16);F('#273239',8,9,16,11);F('#273239',8,25,16,4);F('#273239',5,28,22,10);F('#273239',12,22,8,4);F('#333f47',12,11,8,7);
  }
  d.append(el('h2','',k.name),el('p','',k.role),el('p','no','No. '+k.number));h.append(p,d);
  const dl=el('dl');k.facts.forEach(([a,b])=>dl.append(el('dt','',a),el('dd','',b)));
  c.append(h,dl,el('div','barcode'));
 }else{
  const u=el('ul');k.likes.forEach(l=>u.append(el('li','',l)));
  c.append(el('h2','','About me'),el('p','about',k.about),el('p','no','Likes'),u,el('div','barcode'));
 }
 $('#turn').textContent=side?'Turn back':'Turn over';
}
$('#turn').onclick=async()=>{
 sfx.page();await run($('#card'),[{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:150});
 side^=1;card();run($('#card'),[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:150});
};

/* keys */
C.keys.forEach((k,i)=>{
 const li=el('li'),a=el(k.url?'a':'div');
 if(k.url){a.href=k.url;if(/^https?:/.test(k.url)){a.target='_blank';a.rel='noopener'}}
 a.style.setProperty('--t',['#c2925a','#8f9a95','#a08a6c','#7f9c86'][i%4]);
 a.append(el('strong','',k.label),el('span','',k.url?k.hint:'Not cut yet'));
 li.append(a);$('#tags').append(li);
});

/* mp3: files play through Audio, sample tunes are synthesised */
const TUNES=[
 {bpm:78,ch:[[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,65]],w:'triangle',seed:11},
 {bpm:66,ch:[[50,53,57,60],[55,59,62,65],[48,52,55,59],[57,60,64,67]],w:'sine',seed:29},
 {bpm:96,ch:[[52,55,59,62],[48,52,55,59],[50,54,57,60],[47,50,54,57]],w:'square',seed:47}];
const STEPS=512,stepOf=i=>60/TUNES[i%3].bpm/4;
const M={list:C.music,i:0,hi:0,view:'list',vol:.7,playing:false,step:0,timer:0,bus:null,an:null,cur:null,tag:new Audio(),
 isFile(){return !!this.list[this.i].src},
 len(){return this.isFile()?(this.tag.duration||0):STEPS*stepOf(this.i)},
 pos(){return this.isFile()?this.tag.currentTime:this.step*stepOf(this.i)},
 init(){
  const a=audio();if(this.bus)return;
  this.bus=a.createGain();this.an=a.createAnalyser();this.an.fftSize=64;
  this.inp=a.createBiquadFilter();this.inp.type='lowpass';this.inp.frequency.value=2600;
  this.inp.connect(this.bus).connect(this.an).connect(a.destination);this.setVol(this.vol);
 },
 setVol(v){this.vol=Math.max(0,Math.min(1,v));this.tag.volume=this.vol;if(this.bus)this.bus.gain.value=this.vol*.8},
 note(m,t,d,v,w){const o=ac.createOscillator(),g=ac.createGain();o.type=w;o.frequency.value=440*2**((m-69)/12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g).connect(this.inp);o.start(t);o.stop(t+d+.05)},
 hit(t,d,f,v){const b=ac.createBuffer(1,ac.sampleRate*d,ac.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length)**2;const s=ac.createBufferSource(),q=ac.createBiquadFilter(),g=ac.createGain();q.type='bandpass';q.frequency.value=f;g.gain.value=v;s.buffer=b;s.connect(q).connect(g).connect(this.inp);s.start(t)},
 kick(t){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(40,t+.14);g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g).connect(this.inp);o.start(t);o.stop(t+.22)},
 tick(){
  const T=TUNES[this.i%3],dt=stepOf(this.i);
  if(this.next<ac.currentTime)this.next=ac.currentTime+.02;
  while(this.next<ac.currentTime+.15){
   const s=this.step,b=s%16,ch=T.ch[Math.floor(s/16)%4],t=this.next+(s%2?dt*.16:0),bar=Math.floor(s/64);
   let r=T.seed*(s%128+3)*16807%2147483647;r=r*16807%2147483647/2147483647;
   if(b===0)ch.forEach((m,k)=>this.note(m,t+k*.025,dt*15,.07,'triangle'));
   if(b===0||b===6||b===10)this.note(ch[0]-12-(b===10?5:0),t,dt*4,.2,'sine');
   if(s%2===0&&r<(bar%2?.62:.4))this.note(ch[Math.floor(r*97)%4]+12,t,dt*5,T.w==='square'?.03:.07,T.w);
   if(bar>0){if(b===0||b===10)this.kick(t);if(b===4||b===12)this.hit(t,.16,1500,.16);if(s%2===0)this.hit(t,.04,5200,.06)}
   this.next+=dt;
   if(++this.step>=STEPS){this.go(1);return}
  }
 },
 play(){
  if(!this.list.length)return;
  this.playing=true;
  if(this.isFile()){
   const src=this.list[this.i].src;if(this.cur!==src){this.tag.src=src;this.cur=src}
   this.tag.play().catch(e=>{if(e.name!=='AbortError'){this.stop();foot('No signal',2000)}});
  }else{this.init();this.next=ac.currentTime+.06;clearInterval(this.timer);this.timer=setInterval(()=>this.tick(),40)}
  drawM();if(!open)foot();
 },
 stop(){this.playing=false;clearInterval(this.timer);this.tag.pause();drawM()},
 toggle(){this.playing?this.stop():this.play()},
 load(i){clearInterval(this.timer);this.tag.pause();this.i=this.hi=(i+this.list.length)%this.list.length;this.step=0;this.cur=null;this.play()},
 go(d){if(this.list.length)this.load(this.i+d)}};
M.tag.onended=()=>M.go(1);
const mmss=t=>{t=Math.floor(t||0);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
let bars=null;
function drawM(){
 if(open!=='mp3')return;
 const B=$('#m-body');
 $('#m-state').textContent=M.playing?'Playing':M.view==='now'?'Paused':'Songs';
 $('#m-vol').textContent='Vol '+Math.round(M.vol*10);
 if(M.view==='list'){
  bars=null;const top=B.scrollTop;B.replaceChildren();
  M.list.forEach((t,i)=>{
   const b=el('button','song'+(i===M.hi?' sel':''));b.type='button';
   b.append(el('span','',t.title),el('span','',i===M.i&&M.playing?'♪':t.src?'':mmss(STEPS*stepOf(i))));
   b.onclick=()=>{M.hi=i;choose()};B.append(b);
  });
  B.scrollTop=top;const s=B.querySelector('.sel');if(s)s.scrollIntoView({block:'nearest'});
 }else{
  const t=M.list[M.i];B.replaceChildren();
  const c=el('canvas');c.width=64;c.height=20;
  const sk=el('button');sk.id='seek';sk.type='button';sk.setAttribute('aria-label','Seek');sk.append(el('i'));
  sk.onclick=e=>{
   const r=sk.getBoundingClientRect(),p=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
   if(M.isFile()){if(M.tag.duration)M.tag.currentTime=p*M.tag.duration}else M.step=Math.floor(p*(STEPS-1));
  };
  const tm=el('div','times');tm.append(el('span'),el('span'));
  B.append(el('p','now',t.title),el('span','',t.artist),c,sk,tm);
  bars={g:c.getContext('2d'),sk,tm};
 }
}
function choose(){
 sfx.click();if(!M.list.length)return;
 if(M.view==='list'){M.view='now';if(M.hi!==M.i)M.load(M.hi);else if(M.playing)drawM();else M.play()}
 else M.toggle();
}
function spin(d){
 sfx.click();
 if(M.view==='list'){M.hi=Math.max(0,Math.min(M.list.length-1,M.hi+d));drawM()}
 else{M.setVol(Math.round((M.vol+d*.1)*10)/10);$('#m-vol').textContent='Vol '+Math.round(M.vol*10)}
}
let ang=null,acc=0,dragged=false;
const W=$('#wheel'),at=e=>{const r=W.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
document.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{
 if(dragged){dragged=false;return}
 const m=b.dataset.m;
 if(m==='ok')return choose();
 sfx.click();
 if(m==='menu'){M.view=M.view==='list'?'now':'list';M.hi=M.i;drawM()}
 else if(m==='play')M.toggle();
 else M.go(m==='next'?1:-1);
}));
W.addEventListener('pointerdown',e=>{dragged=false;if(e.target.closest('.w-mid'))return;ang=at(e);acc=0});
addEventListener('pointermove',e=>{
 if(ang===null)return;
 const n=at(e);let d=n-ang;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;
 ang=n;acc+=d;if(Math.abs(acc)>.38){dragged=true;spin(Math.sign(acc));acc=0}
});
addEventListener('pointerup',()=>ang=null);addEventListener('pointercancel',()=>ang=null);
W.addEventListener('wheel',e=>{e.preventDefault();spin(Math.sign(e.deltaY))},{passive:false});

/* night air: a few drifting lights, plus the player's meter */
const mc=$('#motes'),mg=mc.getContext('2d'),motes=Array.from({length:16},(_,i)=>({x:(i*.618)%1,y:(i*.37+.1)%1,p:i*1.7,v:.5+(i%5)*.2}));
let last=0;
function frame(t){
 requestAnimationFrame(frame);if(t-last<50)return;last=t;
 if(calm&&!open)mc.width=1;
 if(!open&&!calm){
  const w=mc.width=Math.ceil(innerWidth/3),h=mc.height=Math.ceil(innerHeight/3);
  motes.forEach(m=>{
   const x=((m.x*w+Math.sin(t/2600*m.v+m.p)*16)%w+w)%w,y=h-((m.y*h+t/190*m.v)%h),a=.1+.5*Math.max(0,Math.sin(t/900*m.v+m.p));
   mg.fillStyle=`rgba(170,240,160,${a})`;mg.fillRect(x|0,y|0,1,1);
  });
 }
 if(open==='mp3'&&M.view==='now'&&bars){
  const{g,sk,tm}=bars,d=new Uint8Array(32);g.clearRect(0,0,64,20);g.fillStyle='#10352c';
  if(M.an&&!M.isFile())M.an.getByteFrequencyData(d);
  for(let i=0;i<16;i++){const v=!M.playing?0:M.isFile()?.5+.5*Math.sin(t/170+i*1.9)*Math.sin(t/410+i):d[i]/255;g.fillRect(i*4,19-Math.round(v*18),3,1+Math.round(v*18))}
  const L=M.len(),p=M.pos();sk.style.setProperty('--p',(L?p/L*100:0)+'%');
  tm.children[0].textContent=mmss(p);tm.children[1].textContent=mmss(L);
 }
}
fit(false);pick('journal',true);foot();requestAnimationFrame(frame);
const route=()=>{const h=location.hash.slice(1);if(by[h]&&!open&&!busy)show(h)};
addEventListener('hashchange',route);route();
}
