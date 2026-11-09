import * as THREE from 'three';
import {makeFish,animateFish,disposeFish,RC,RN,TIERC,colorOf} from './fish3d.js';
import {Rooms} from './rooms.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),C=c=>new THREE.Color(c),PZ=1.6;
const SKY=[['#a9d6e5','#5b7f4a'],['#b8c7cf','#6f7d52'],['#b9c79a','#3e4f2c'],['#8fd3dc','#d8c48a'],['#1d2a4a','#262e44']];
const WAT=['#2f7f9e','#4a7a86','#5a6b3c','#1f93a8','#14224a'],NAMES=['Willow Lake','Misty River','Mangrove Marsh','Coral Bay','Abyssal Trench'];
const H=V(0,1.4,PZ+.55),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),sst=(a,b,x)=>{const u=Math.max(0,Math.min(1,(x-a)/(b-a)));return u*u*(3-2*u)},ISL={x:9.5,z:2.4,r:3.3};
const spr=(o,k,tg,dt,w=14,z=.7)=>{const u=o.userData,v=u.v||(u.v={});let vv=v[k]||0;const x=o.rotation[k];vv+=((tg-x)*w*w-2*z*w*vv)*dt;v[k]=vv;o.rotation[k]=x+vv*dt};
export class World{
 constructor(cv){
  this.cv=cv;this.t=0;this.shake=0;this.low=false;this.fish=[];this.ix=0;this.cs=V(0,-1,0);
  this.r=new THREE.WebGLRenderer({canvas:cv,antialias:(devicePixelRatio||1)<1.75,powerPreference:'high-performance'});this.dprMax=Math.min(devicePixelRatio||1,1.75);this.dpr=this.dprMax;this.r.setPixelRatio(this.dpr);
  const s=this.s=new THREE.Scene();this.cam=new THREE.PerspectiveCamera(52,1,.1,160);
  this.hemi=new THREE.HemisphereLight('#ffffff','#445566',1);this.sun=new THREE.DirectionalLight('#ffffff',2);this.sun.position.set(-6,10,6);s.add(this.hemi,this.sun);
  const wg=new THREE.PlaneGeometry(140,140,52,52);wg.rotateX(-Math.PI/2);this.wp=wg.attributes.position;wg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(wg.attributes.position.count*3).fill(1),3));this.wc=wg.attributes.color;this.wb=Float32Array.from(this.wp.array);
  this.water=new THREE.Mesh(wg,new THREE.MeshStandardMaterial({color:'#2f7f9e',roughness:.2,metalness:.1,flatShading:true,vertexColors:true,transparent:true,opacity:.86}));s.add(this.water);
  this.dome=new THREE.Mesh(new THREE.SphereGeometry(112,24,16),new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));this.dome.position.set(0,-6,-10);this.dome.renderOrder=-10;this.dome.geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(this.dome.geometry.attributes.position.count*3),3));s.add(this.dome);
  const bed=new THREE.Mesh(new THREE.PlaneGeometry(140,140).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#1b3a4a',roughness:1}));bed.position.y=-16;this.bedM=bed;s.add(bed);
  this.moon=new THREE.Mesh(new THREE.SphereGeometry(3,16,12),new THREE.MeshBasicMaterial({color:'#f3f0dc',fog:false}));this.moon.position.set(-22,26,-70);s.add(this.moon);
  const mm=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,flatShading:true,...o}),wood=mm('#7a5a3a');
  const add=(g,m,x,y,z,p=s)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
  for(let i=0;i<9;i++)add(new THREE.BoxGeometry(6.6,.08,.48),mm(i%2?'#7a5a3a':'#86643f'),0,.52,.2+i*.5);
  for(const x of[-3.1,3.1])add(new THREE.BoxGeometry(.14,.14,4.6),mm('#4c3823'),x,.42,2.2);
  for(const x of[-3,0,3])for(const z of[.2,2.2,4.2])add(new THREE.CylinderGeometry(.12,.12,3,6),mm('#4c3823'),x,-.9,z);
  for(const x of[-3.1,3.1]){for(const z of[.4,1.4,3.4,4])add(new THREE.BoxGeometry(.08,.7,.08),mm('#5a3d24'),x,.9,z);add(new THREE.BoxGeometry(.06,.06,1.1),mm('#5a3d24'),x,1.25,.9);add(new THREE.BoxGeometry(.06,.06,.66),mm('#5a3d24'),x,1.25,3.72)}
  add(new THREE.CylinderGeometry(.05,.06,1.7,6),mm('#2a2018'),-3.1,1.45,.4);add(new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:'#ffd98a'}),-3.1,2.4,.4);
  this.lantern=new THREE.PointLight('#ffcf80',0,10);this.lantern.position.set(-3.1,2.4,.4);s.add(this.lantern);
  add(new THREE.CylinderGeometry(.2,.16,.3,8),mm('#b8543a'),-1.3,.8,1.2);add(new THREE.BoxGeometry(.5,.25,.3),mm('#2f6f7a'),1.2,.7,2.6);add(new THREE.TorusGeometry(.18,.05,5,10).rotateX(Math.PI/2),mm('#c9b27a'),1.3,.6,.9);
  const P=this.pl=new THREE.Group();P.position.set(0,.6,PZ);s.add(P);
  const jk=mm('#2f6f7a'),pn=mm('#3b4252'),sk=mm('#e0b48a'),bt=mm('#2a2018');
  this.legs=[];this.knees=[];for(const x of[-.12,.12]){const lg=new THREE.Group();lg.position.set(x,.55,0);P.add(lg);add(new THREE.CylinderGeometry(.1,.095,.26,7).translate(0,-.13,0),pn,0,0,0,lg);add(new THREE.SphereGeometry(.097,7,6),pn,0,-.26,0,lg);const kn=new THREE.Group();kn.position.set(0,-.26,0);lg.add(kn);add(new THREE.CylinderGeometry(.095,.085,.24,7).translate(0,-.12,0),pn,0,0,0,kn);add(new THREE.BoxGeometry(.18,.12,.3),bt,0,-.24,-.04,kn);this.legs.push(lg);this.knees.push(kn)}
  const TB=this.tb=new THREE.Group();TB.position.set(0,.55,0);P.add(TB);
  add(new THREE.CylinderGeometry(.27,.31,.75,8),jk,0,.37,0,TB);add(new THREE.BoxGeometry(.42,.55,.24),mm('#8a5a2a'),0,.4,.28,TB);add(new THREE.CylinderGeometry(.09,.09,.5,8).rotateZ(Math.PI/2),mm('#c2582f'),0,.75,.28,TB);
  const HD=this.head=new THREE.Group();HD.position.set(0,.88,0);TB.add(HD);
  add(new THREE.SphereGeometry(.2,12,10),sk,0,.02,0,HD);add(new THREE.CylinderGeometry(.34,.34,.04,12),mm('#e9a23b'),0,.13,0,HD);add(new THREE.CylinderGeometry(.2,.22,.17,12),mm('#e9a23b'),0,.22,0,HD);add(new THREE.CylinderGeometry(.225,.225,.05,12),mm('#2f4858'),0,.15,0,HD);
  for(const x of[-.07,.07])add(new THREE.SphereGeometry(.025,6,5),mm('#101a2b'),x,.02,-.18,HD);
  const shR=new THREE.Object3D(),shL=new THREE.Object3D();shR.position.set(.3,.65,0);shL.position.set(-.3,.65,0);TB.add(shR,shL);
  this.hands=[0,1].map(()=>{const o=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),sk);s.add(o);return o});
  const jl=()=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(.075,.065,1,7),jk);s.add(o);return o};
  this.arms=[{up:jl(),lo:jl(),sh:shR,sg:1},{up:jl(),lo:jl(),sh:shL,sg:-1}];
  this.rod=new THREE.Group();this.rod.position.set(.3,.37,-.3);TB.add(this.rod);this.ra=-1;this.bd=0;
  this.rm=mm('#8a6a44');let par=this.rod;this.segs=[];this.lan=[];
  add(new THREE.CylinderGeometry(.045,.045,.42,8).translate(0,-.21,0),mm('#d9b98a'),0,0,0,this.rod);
  for(let i=0;i<3;i++){const g=new THREE.CylinderGeometry(.014-i*.003,.03-i*.007,1,6);g.translate(0,.5,0);const m=new THREE.Mesh(g,this.rm);m.position.y=i?1:0;par.add(m);this.segs.push(m);par=m;add(new THREE.TorusGeometry(.035,.007,5,10).rotateX(Math.PI/2),mm('#c0c8d0'),0,.55,.04,m);const an=new THREE.Object3D();an.position.set(0,.55,.04);m.add(an);this.lan.push(an)}
  this.tipO=new THREE.Object3D();this.tipO.position.y=1;par.add(this.tipO);this.tp=V(0,2,0);
  const RLG=new THREE.Group();RLG.position.set(0,.3,-.03);this.segs[0].add(RLG);const sv=mm('#9aa5b1',{metalness:.6,roughness:.35}),dk=mm('#2f3a46',{metalness:.4});
  add(new THREE.BoxGeometry(.05,.14,.04),dk,0,0,0,RLG);add(new THREE.CylinderGeometry(.012,.012,.1,6).rotateX(Math.PI/2),sv,0,0,-.05,RLG);
  const BD=new THREE.Group();BD.position.set(0,.01,-.11);RLG.add(BD);
  add(new THREE.SphereGeometry(1,12,9),sv,0,0,0,BD).scale.set(.055,.08,.05);
  add(new THREE.CylinderGeometry(.045,.045,.012,12).rotateZ(Math.PI/2),dk,.05,0,0,BD);add(new THREE.CylinderGeometry(.045,.045,.012,12).rotateZ(Math.PI/2),dk,-.05,0,0,BD);
  const SP=new THREE.Group();SP.position.set(0,.075,0);BD.add(SP);
  add(new THREE.LatheGeometry([[0,0],[.068,0],[.068,.012],[.046,.022],[.046,.052],[.062,.062],[.062,.072],[0,.072]].map(p=>new THREE.Vector2(p[0],p[1])),18),mm('#e9a23b',{metalness:.5,roughness:.4}),0,0,0,SP);
  add(new THREE.CylinderGeometry(.049,.049,.03,14),mm('#eef2f7',{roughness:1}),0,.037,0,SP);add(new THREE.CylinderGeometry(.02,.02,.012,8),dk,0,.078,0,SP);
  this.sAn=new THREE.Object3D();this.sAn.position.set(.05,.04,0);SP.add(this.sAn);
  this.rotor=new THREE.Group();this.rotor.position.set(0,.008,0);BD.add(this.rotor);
  add(new THREE.CylinderGeometry(.075,.072,.02,16),dk,0,0,0,this.rotor);add(new THREE.TorusGeometry(.078,.005,4,14,Math.PI),sv,0,.01,0,this.rotor);add(new THREE.SphereGeometry(.009,6,5),sv,0,.088,0,this.rotor);
  this.rAn=new THREE.Object3D();this.rAn.position.set(0,.088,0);this.rotor.add(this.rAn);
  this.handle=new THREE.Group();this.handle.position.set(.066,0,0);BD.add(this.handle);
  add(new THREE.CylinderGeometry(.006,.006,.11,5).translate(0,.055,0),sv,0,0,0,this.handle);add(new THREE.SphereGeometry(.016,8,6),mm('#d1493f'),.012,.11,0,this.handle);
  this.hRo=new THREE.Object3D();this.hRo.position.set(0,.05,0);this.rod.add(this.hRo);this.hLo=new THREE.Object3D();this.hLo.position.set(0,.6,0);this.rod.add(this.hLo);
  const bob=this.bob=new THREE.Group();bob.add(new THREE.Mesh(new THREE.SphereGeometry(.13,10,6,0,6.283,0,1.5708),mm('#d1493f')),new THREE.Mesh(new THREE.SphereGeometry(.13,10,6,0,6.283,1.5708,1.5708),mm('#eef2f7')));
  const stick=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.3,5),mm('#d1493f'));stick.position.y=.2;bob.add(stick);s.add(bob);this.bp=V(0,0,0);
  const N=30;this.lg=new THREE.BufferGeometry();this.lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));this.lm=new THREE.LineBasicMaterial({color:'#ffffff'});this.line=new THREE.Line(this.lg,this.lm);this.line.frustumCulled=false;s.add(this.line);
  this.pt=[];const pg=new THREE.BoxGeometry(.07,.07,.07);for(let i=0;i<140;i++){const m=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:'#fff'}));m.visible=false;m.userData={v:V(0,0,0),l:0};s.add(m);this.pt.push(m)}
  this.rg=[];const rgeo=new THREE.RingGeometry(.92,1,40).rotateX(-Math.PI/2);for(let i=0;i<28;i++){const m=new THREE.Mesh(rgeo,new THREE.MeshBasicMaterial({color:'#fff',transparent:true,side:THREE.DoubleSide,depthWrite:false}));m.visible=false;m.userData={l:0,sp:1,mx:2};s.add(m);this.rg.push(m)}
  this.beam=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,16,16,1,true),new THREE.MeshBasicMaterial({color:'#e9c24b',transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}));this.beam.position.set(H.x,H.y+6,H.z);this.beam.visible=false;s.add(this.beam);
  this.vortex=new THREE.Group();[1,1.7,2.4].forEach((r,i)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,.06,6,32).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:i%2?'#2bb5c9':'#c2308a'}));this.vortex.add(t)});this.vortex.visible=false;s.add(this.vortex);
  this.inp={x:0,y:0,boost:false};this.cc=V(1.1,2.3,5.4);this.cl=V(0,.8,-6);this.initFx()}
 markTex(k){if(this.mkTex[k])return this.mkTex[k];const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d'),col=TIERC[k]||'#ffffff';
  g.font='900 190px system-ui,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.shadowColor=col;g.shadowBlur=k==='Secret'?46:26;g.lineWidth=26;g.strokeStyle='#101a2b';g.strokeText('!?',128,136);g.shadowBlur=0;g.fillStyle=col;g.fillText('!?',128,136);
  g.globalCompositeOperation='source-atop';const gr=g.createLinearGradient(0,40,0,220);gr.addColorStop(0,'rgba(255,255,255,.65)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(0,0,256,256);return this.mkTex[k]=new THREE.CanvasTexture(cv)}
 setLimb(o,a,b,th=1){const d=V(0,0,0).subVectors(b,a),l=d.length()||.001;o.position.copy(a).addScaledVector(d,.5);o.scale.set(th,l,th);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize())}
 initFx(){const s=this.s;this.wx='clear';this.om=0;this.omT=0;this._omA=0;
  {const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.4,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);this.softTex=new THREE.CanvasTexture(c)}
  {const sm=this.softTex;this.ocl=new THREE.Group();this.ocs=[];for(let i=0;i<18;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:sm,color:'#1b1522',transparent:true,opacity:0,depthWrite:false,fog:false}));m.renderOrder=2;const w=46+Math.random()*44;m.scale.set(w,w*(.34+Math.random()*.2),1);m.position.set((Math.random()-.5)*150,16+Math.random()*16,-22-Math.random()*58);m.userData={s:.6+Math.random()*1.1,o:.55+Math.random()*.45};this.ocl.add(m);this.ocs.push(m)}this.ocl.visible=false;s.add(this.ocl);
   this.mist=new THREE.Group();this.mss=[];for(let i=0;i<16;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:sm,color:'#2a1a28',transparent:true,opacity:0,depthWrite:false,fog:false}));m.renderOrder=2;const w=8+Math.random()*10;m.scale.set(w,w*.32,1);m.position.set((Math.random()-.5)*34,.5+Math.random()*1.4,1-Math.random()*30);m.userData={s:.2+Math.random()*.5,ph:Math.random()*6,o:.35+Math.random()*.4,x0:m.position.x};this.mist.add(m);this.mss.push(m)}this.mist.visible=false;s.add(this.mist);
   this.oLight=new THREE.Sprite(new THREE.SpriteMaterial({map:sm,color:'#ff4060',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,fog:false}));this.oLight.renderOrder=4;this.oLight.visible=false;s.add(this.oLight)}
  this.mkTex={};this.mkA=0;this.mkK=null;this.mkLast='Common';this.mkT=0;
  this.mark=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false,fog:false}));this.mark.renderOrder=7;this.mark.visible=false;s.add(this.mark);
  this.mkGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:this.softTex,transparent:true,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,fog:false}));this.mkGlow.renderOrder=6;this.mkGlow.visible=false;s.add(this.mkGlow);this.wamp=1;this.flash=0;this.lt=3;this.bt=0;this.mtT=0;this.rrT=0;
  this.sunD=new THREE.Mesh(new THREE.SphereGeometry(4,16,12),new THREE.MeshBasicMaterial({color:'#ffe9a8',fog:false}));this.sunD.position.set(30,30,-75);s.add(this.sunD);
  const sp=[];for(let i=0;i<240;i++){const th=Math.random()*6.283,ph=Math.acos(Math.random()*.85+.1);sp.push(90*Math.sin(ph)*Math.cos(th),90*Math.cos(ph),-90*Math.sin(ph)*Math.sin(th))}
  this.stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(sp,3)),new THREE.PointsMaterial({color:'#ffffff',size:2.2,sizeAttenuation:false,fog:false}));this.stars.visible=false;s.add(this.stars);
  const fp=[];for(let i=0;i<45;i++)fp.push((Math.random()<.5?-1:1)*(5+Math.random()*10),.4+Math.random()*2,1-Math.random()*14);this.ffb=Float32Array.from(fp);
  this.ff=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(fp.slice(),3)),new THREE.PointsMaterial({color:'#e9e27a',size:.12}));this.ff.visible=false;this.ff.frustumCulled=false;s.add(this.ff);
  this.rdp=Array.from({length:520},()=>({x:(Math.random()-.5)*26,y:Math.random()*14,z:3-Math.random()*36,s:12+Math.random()*8}));
  this.rain=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(520*6),3)),new THREE.LineBasicMaterial({color:'#bcd2e8',transparent:true,opacity:.5}));this.rain.frustumCulled=false;this.rain.visible=false;s.add(this.rain);
  this.bolts=[0,1,2].map(()=>{const g=new THREE.Group(),bg=new THREE.BufferGeometry(),pa=new THREE.BufferAttribute(new Float32Array(80*6),3);bg.setAttribute('position',pa);
   const ls=[-.1,0,.1].map((dx,i)=>{const l=new THREE.LineSegments(bg,new THREE.LineBasicMaterial({color:i===1?'#ffffff':'#bcd0ff',transparent:true}));l.position.x=dx;l.frustumCulled=false;g.add(l);return l});
   const gl=()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:this.softTex,color:'#cfdcff',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));sp.renderOrder=3;g.add(sp);return sp};
   g.visible=false;g.userData={l:0,q:pa,bg,ls,gt:gl(),gb:gl()};s.add(g);return g});this.bi=0;
  this.mt=[];for(let i=0;i<4;i++){const g=new THREE.Group(),core=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,0),new THREE.MeshStandardMaterial({color:'#5b4032',emissive:'#ff7a2a',emissiveIntensity:1,flatShading:true})),
   f1=new THREE.Mesh(new THREE.ConeGeometry(.5,2.4,6),new THREE.MeshBasicMaterial({color:'#ff7a2a',transparent:true,opacity:.85,depthWrite:false})),f2=new THREE.Mesh(new THREE.ConeGeometry(.28,1.6,6),new THREE.MeshBasicMaterial({color:'#ffd27a',transparent:true,opacity:.9,depthWrite:false})),tl=new THREE.Mesh(new THREE.ConeGeometry(.45,7,6),new THREE.MeshBasicMaterial({color:'#ff9a3a',transparent:true,opacity:.28,depthWrite:false}));
   f1.position.y=1.4;f2.position.y=1;tl.position.y=4.2;g.add(core,f1,f2,tl);g.visible=false;g.userData={l:0,a:V(0,0,0),b:V(0,0,0),d:2,core,f1,f2,tl};s.add(g);this.mt.push(g)}
  this.orb=new THREE.Group();for(let i=0;i<8;i++)this.orb.add(new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),new THREE.MeshBasicMaterial({color:'#ffffff'})));this.orb.visible=false;s.add(this.orb);this.spin=0;this.sm=[];const sg=new THREE.IcosahedronGeometry(1,0);for(let i=0;i<70;i++){const m=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.5,depthWrite:false}));m.visible=false;m.userData={l:0,d:1,v:V(0,0,0),s:.3};s.add(m);this.sm.push(m)}}
 animChar(dt,G,st,t){const P=this.pl,tb=this.tb,hd=this.head,tap=G.tapP||0,hold=st==='catch'||st==='result'||st==='flex'||!!this.rd,sw=G.swT>0&&st==='fight',br=Math.sin(t*1.8),sur=G.surge>0&&st==='fight',wk=this.walking?(this.wk||0):0,k=Math.min(1,dt*8);
  let lx=0,lz=0,ly=0,hy=Math.sin(t*.5)*.35,hx=Math.sin(t*.9)*.05,by=0,kb=.04;
  const fx=this.fm&&st==='fight'?cl((this.fm.position.x-P.position.x)*-.07,-.16,.16):0;
  if(st==='charge'){lx=.12+G.pw/100*.22;ly=-.15-G.pw/100*.3;hy=0;hx=.05;kb=.16}
  else if(st==='cast'){const p=Math.min(1,G.t/.7);lx=-.3+p*.3;ly=-.45+Math.sin(Math.min(1,p*1.4)*Math.PI*.5)*.85;hy=0;hx=-.1;kb=.12*(1-p)}
  else if(st==='wait'){hy=Math.sin(t*.4)*.12;hx=.12;lx=.02;lz=Math.sin(t*.5)*.02;kb=.05}
  else if(st==='bite'){lx=-.1;hx=-.08;hy=0;by=Math.abs(Math.sin(t*14))*.03;kb=.12}
  else if(st==='fight'){const d=G.swDir;lx=.06-tap*.2+(sur?.22:0)+(sw&&d==='U'?-.14:sw&&d==='D'?.16:0);lz=(sw?(d==='L'?-.22:d==='R'?.22:0):Math.sin(t*3)*.03)+fx;ly=sw?(d==='L'?.32:d==='R'?-.32:0):Math.sin(t*2.2)*.05;hy=fx*2;hx=.05;by=-tap*.03-(sur?.04:0);kb=.32+tap*.18+(sur?.26:0)}
  else if(hold){lx=-.1;hy=Math.sin(t*1.1)*.18;hx=-.12;by=Math.abs(Math.sin(t*2.2))*.025}
  spr(tb,'x',lx+br*.015,dt,15,.62);spr(tb,'z',lz+Math.sin(wk)*.05,dt,13,.7);spr(tb,'y',ly+Math.sin(wk)*.12,dt,13,.75);tb.scale.y=1+br*.012;
  spr(hd,'y',hy,dt,10,.8);spr(hd,'x',hx-(wk?Math.abs(Math.sin(wk))*.03:0),dt,12,.75);
  P.position.y=.6+by-kb*.08+br*.006;P.rotation.z=Math.sin(t*.6)*.025+(st==='fight'?fx*.4:0);
  const sp=st==='fight'?.2:.05;this.legs.forEach((l,i)=>{l.rotation.z+=((i?1:-1)*sp-l.rotation.z)*k;l.rotation.x+=((kb*.5*(i?.8:1)+Math.sin(t*.6+i)*.03)-l.rotation.x)*k});
  this.knees.forEach(kn=>{kn.rotation.x+=(-kb-kn.rotation.x)*Math.min(1,dt*10)});
  P.rotation.y+=((hold?Math.PI:0)-P.rotation.y)*Math.min(1,dt*6);
  this.spin+=(G.spinV||0)*dt;this.handle.rotation.x=this.spin;this.rotor.rotation.y=this.spin*1.8;
  this.rod.rotation.x=this.ra+tap*.08;this.rod.rotation.z=Math.sin(t*.7)*.01+(st==='fight'?Math.sin(t*28)*.012*tap:0);this.rod.visible=!hold}
 updArms(hold,dt=.016){const P=this.pl,ps=P.scale.x,sw=V(0,0,0),tg=V(0,0,0),q=new THREE.Quaternion();P.getWorldQuaternion(q);
  this.arms.forEach((a,i)=>{a.sh.getWorldPosition(sw);
   if(this.rideH)tg.copy(this.rideH[i]);else if(hold&&this.hp){const sd=sw.x>=P.position.x?1:-1;tg.set(this.hp.x+.42*sd,this.hp.y-.1,this.hp.z-.03)}else(i?this.hLo:this.hRo).getWorldPosition(tg);
   {const cu=a.cur||(a.cur=tg.clone());cu.lerp(tg,1-Math.exp(-dt*26));tg.copy(cu)}const d=V(0,0,0).subVectors(tg,sw),l=d.length(),mx=.95*ps;if(l>mx)tg.copy(sw).addScaledVector(d,mx/l);
   const el=sw.clone().add(tg).multiplyScalar(.5).add(V(1,0,0).applyQuaternion(q).multiplyScalar(a.sg*.13*ps)).add(V(0,-.1*ps,0));
   this.setLimb(a.up,sw,el,ps);this.setLimb(a.lo,el,tg,ps);this.hands[i].position.copy(tg);this.hands[i].scale.setScalar(ps)})}
 smoke(v,col='#ffffff',n=1,size=1){if(this.low&&Math.random()<.6)return;for(let i=0;i<n;i++){const m=this.sm.find(x=>!x.visible);if(!m)return;m.visible=true;m.position.copy(v).add(V((Math.random()-.5)*.12,0,(Math.random()-.5)*.12));m.material.color.set(col);const d=m.userData;d.l=0;d.d=1.3+Math.random()*.8;d.v.set((Math.random()-.5)*.12,.35+Math.random()*.3,(Math.random()-.5)*.12);d.s=size*(.05+Math.random()*.05);d.o=.3;m.scale.setScalar(d.s)}}
 updSmoke(dt){for(const m of this.sm)if(m.visible){const d=m.userData;d.l+=dt/d.d;if(d.l>=1){m.visible=false;continue}m.position.addScaledVector(d.v,dt);m.scale.setScalar(d.s*(1+d.l*2.2));m.material.opacity=d.o*(1-d.l)*Math.min(1,d.l*6);m.rotation.y+=dt*.6}}
 rodAura(dt,G,rod,hold){if(hold)return;const col={Rare:'#3b73c9',Epic:'#7b4fb8',Legendary:'#2bb5c9'}[rod.tier],fr=(G.en||0)>=66;if(!col&&!fr)return;this.auT=(this.auT||0)-dt;if(this.auT>0)return;this.auT=fr?.07:col?.22:.3;
  const c=fr?'#e9a23b':col,p=this.tp.clone().lerp(this.rod.getWorldPosition(V(0,0,0)),Math.random()*.9);this.smoke(p,c,1,.6);if(Math.random()<.4)this.burstAt(p,c,1,1.3,.15)}
 setMode(m){this.mode=m;if(m==='aqua')this.ensureTank();this.lightsFor(m);this.dome.visible=m!=='aqua'&&m!=='room';if(m==='aqua'){this.ensureTank();this.s.background=C('#0b1220');this.s.fog=null;this.hemi.intensity=.7;this.sun.intensity=.5;this.sun.color.set('#cfe4ff')}else this.applyEnv()}
 ensureTank(){if(this.tank)return;const s=this.s,T=this.tank=new THREE.Group();T.position.set(300,0,0);s.add(T);this.af=[];this.pls=[];this.bb=[];
  const W=this.TW=26,H=this.TH=10,D=this.TD=10,Y0=this.TY=1.2,TOP=Y0+H;this.azm=1;this.sel=-1;
  const mm=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,flatShading:true,...o}),add=(g,m,x,y,z,p=T)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o},Bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  add(Bx(90,.4,60),mm('#1d2330'),0,-.2,0);add(Bx(90,40,.4),mm('#141b2c'),0,20,-16);
  for(let k=-3;k<=3;k++)add(Bx(.5,24,.3),mm('#1c2540'),k*10,12,-15.8);
  add(Bx(W+1,1,D+1),mm('#3a2a1a'),0,.5,0);add(Bx(W+1.4,.2,D+1.4),mm('#1b2433'),0,1.1,0);
  add(Bx(W,.6,D),mm('#d8c48a'),0,Y0+.3,0);
  add(Bx(W,H,D),mm('#bfe8f2',{transparent:true,opacity:.07,depthWrite:false}),0,Y0+H/2,0);add(Bx(W-.1,H-.2,D-.1),mm('#2f8fb0',{transparent:true,opacity:.2,depthWrite:false}),0,Y0+H/2-.1,0);
  for(const x of[-W/2,W/2])for(const z of[-D/2,D/2])add(Bx(.25,H,.25),mm('#0f1520'),x,Y0+H/2,z);
  add(Bx(W+.4,.25,D+.4),mm('#0f1520'),0,TOP+.1,0);add(Bx(W-2,.1,.6),mm('#ffffff',{emissive:'#cfeaff',emissiveIntensity:1}),0,TOP-.05,0);
  this.tl=[];for(const x of[-8,0,8]){const pl=new THREE.PointLight('#cfeaff',1.3,22);pl.position.set(x,TOP-.8,1);T.add(pl);this.tl.push(pl)}
  const R=((sd)=>()=>(sd=sd*16807%2147483647)/2147483647)(77),ico=new THREE.IcosahedronGeometry(1,1),cone=new THREE.ConeGeometry(1,2.4,6),sph=new THREE.SphereGeometry(1,6,5);
  for(let k=0;k<26;k++){const x=-W/2+1+R()*(W-2),z=-D/2+.8+R()*(D*.55),g=new THREE.Group();g.position.set(x,Y0+.6,z);T.add(g);const n=4+Math.floor(R()*5);for(let j=0;j<n;j++)add(sph,mm(j%2?'#3f9e6e':'#4a7a3a'),0,j*.32,0,g).scale.set(.14,.22,.14);this.pls.push(g)}
  for(let k=0;k<14;k++){const o=add(ico,mm('#6b7078'),-W/2+1+R()*(W-2),Y0+.7,-D/2+1+R()*(D-2));o.scale.set(.4+R()*.8,.3+R()*.5,.4+R()*.8)}
  ['#e46a6a','#e9a23b','#c2308a','#2bb5c9'].forEach((c,k)=>{for(let j=0;j<2;j++)add(cone,mm(c),-W/2+3+k*6+j*1.8,Y0+1.2,-D/2+1.2+R()*2).scale.setScalar(.35+R()*.45)});
  add(Bx(1.6,.9,1.1),mm('#7a4a1a'),W/2-3,Y0+.9,D/2-2.4);add(Bx(1.7,.35,1.2),mm('#a4723a'),W/2-3,Y0+1.5,D/2-2.4);
  for(let k=0;k<60;k++){const b=add(new THREE.SphereGeometry(.05,6,5),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.5}),0,0,0);b.userData={s:Math.random(),bx:[-9,-2,6,10][k%4]+(Math.random()-.5)*.6,bz:-2+Math.random()*3,y:Y0+.8+Math.random()*H};this.bb.push(b)}
  // penggaris ukuran: 1 unit = 60 cm
  const lab=(txt,x,y,z,sc=1.1)=>{const c=document.createElement('canvas');c.width=128;c.height=48;const g=c.getContext('2d');g.font='bold 30px system-ui';g.fillStyle='#fff';g.textAlign='center';g.fillText(txt,64,34);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));sp.scale.set(sc*2.2,sc*.82,1);sp.position.set(x,y,z);T.add(sp)};
  const ms=100/60;add(Bx(W-1,.08,.08),mm('#ffffff',{emissive:'#ffffff',emissiveIntensity:.6}),0,Y0+.62,D/2+.05);
  for(let m=0;m*ms<=W-1;m++){const x=-W/2+.5+m*ms;add(Bx(.07,m%5?.28:.5,.07),mm('#ffffff',{emissive:'#ffffff',emissiveIntensity:.6}),x,Y0+.62+(m%5?.14:.25),D/2+.05);if(m%2===0||m<6)lab(m+' m',x,Y0+1.35,D/2+.1,.7)}
  add(Bx(.08,H-1,.08),mm('#ffffff',{emissive:'#ffffff',emissiveIntensity:.6}),-W/2-.2,Y0+H/2,D/2+.05);
  for(let m=0;m*ms<H-1.2;m++){add(Bx(.4,.07,.07),mm('#ffffff',{emissive:'#ffffff',emissiveIntensity:.6}),-W/2-.2,Y0+.6+m*ms,D/2+.05);lab(m+' m',-W/2-1.1,Y0+.6+m*ms,D/2+.1,.7)}
  this.selRing=new THREE.Mesh(new THREE.TorusGeometry(1,.035,6,36),new THREE.MeshBasicMaterial({color:'#ffe08a',transparent:true,opacity:.9,depthWrite:false}));this.selRing.visible=false;T.add(this.selRing)}
 aqLen(f){return cl((f.len||30)/60,.22,7.5)}
 aqFish(list){this.ensureTank();(this.af||[]).forEach(o=>{this.tank.remove(o.m);disposeFish(o.m)});this.sel=-1;this.selRing.visible=false;
  const W=this.TW,H=this.TH,D=this.TD,Y0=this.TY;
  this.af=list.map((f,i)=>{const m=makeFish(f,false,f.mut),L=this.aqLen(f);m.scale.setScalar(L);m.rotation.order='YZX';
   m.position.set((Math.random()-.5)*(W-3-L),Y0+1.6+L*.2+Math.random()*(H-3.4-L*.4),(Math.random()-.5)*(D-2.4-L*.4));this.tank.add(m);return{m,L,v:V(0,0,0),tg:V(0,3,0),tm:0,sp:.4,ph:Math.random()*6,glow:!!f.mut||RN.indexOf(f.rarity)>=3,mu:f.mut,f,i}})}
 aqPick(nx,ny){if(!this.af||!this.af.length)return -1;const rc=this.rc=this.rc||new THREE.Raycaster();rc.setFromCamera({x:nx,y:ny},this.cam);const hit=rc.intersectObjects(this.af.map(o=>o.m),true);if(!hit.length)return -1;let o=hit[0].object;while(o&&!this.af.some(a=>a.m===o))o=o.parent;return o?this.af.findIndex(a=>a.m===o):-1}
 aqSelect(i){this.sel=i}
 frameAqua(dt,t){const T=this.tank,por=this.cam.aspect<1,ang=this.ang,W=this.TW,H=this.TH,D=this.TD,Y0=this.TY,TOP=Y0+H,af=this.af;
  for(const o of af){const L=o.L,hx=W/2-.8-L*.55,hz=Math.max(.3,D/2-.8-L*.3),y0=Y0+1.1+L*.18,y1=TOP-.9-L*.18;o.tm-=dt;
   if(o.tm<=0){o.tm=2.5+Math.random()*4.5;o.tg.set((Math.random()*2-1)*Math.max(.5,hx),y0+Math.random()*Math.max(.2,y1-y0),(Math.random()*2-1)*hz);o.sp=(.28+Math.random()*.45)*(.7+Math.sqrt(L)*.45)}
   const d=V(0,0,0).subVectors(o.tg,o.m.position),dl=d.length();if(dl>.05)d.multiplyScalar(1/dl);
   for(const q of af){if(q===o)continue;const dx=o.m.position.x-q.m.position.x,dy=o.m.position.y-q.m.position.y,dz=o.m.position.z-q.m.position.z,r=(o.L+q.L)*.5,dd=dx*dx+dy*dy+dz*dz;if(dd<r*r&&dd>.0001){const k=(1-Math.sqrt(dd)/r)*1.4/Math.sqrt(dd);d.x+=dx*k;d.y+=dy*k*.6;d.z+=dz*k}}
   o.v.lerp(d.normalize().multiplyScalar(o.sp),Math.min(1,1.2*dt));o.m.position.addScaledVector(o.v,dt);
   const p=o.m.position;p.x=cl(p.x,-hx-.3,hx+.3);p.y=cl(p.y,y0,y1);p.z=cl(p.z,-hz,hz);
   const sp=o.v.length();if(sp>.03){o.m.rotation.y+=ang(o.m.rotation.y,Math.atan2(-o.v.z,o.v.x))*Math.min(1,3*dt);o.m.rotation.z+=(Math.asin(cl(o.v.y/sp,-1,1))*.8-o.m.rotation.z)*Math.min(1,3*dt)}
   animateFish(o.m,t+o.ph,.2+sp*1.2/Math.sqrt(L));if(o.glow)o.m.userData.mats.forEach(m=>{m.emissiveIntensity=m.userData.e0*(1+.5*Math.sin(t*3+o.ph))});
   if(o.mu&&Math.random()<dt*3)this.smoke(o.m.position.clone().add(T.position),o.mu.c,1,.5*Math.min(2,L))}
  this.pls.forEach((g,i)=>g.rotation.z=Math.sin(t*.8+i)*.1);
  this.bb.forEach(b=>{const u=b.userData;u.y+=dt*(.6+u.s);if(u.y>TOP-.2){u.y=Y0+.8;u.s=Math.random()}b.position.set(u.bx+Math.sin(t*3+u.s*9)*.08,u.y,u.bz)});
  const sel=this.sel>=0?af[this.sel]:null;this.selRing.visible=!!sel;if(sel){this.selRing.position.copy(sel.m.position);this.selRing.scale.setScalar(sel.L*.75+.4);this.selRing.rotation.set(Math.PI/2,0,0);this.selRing.material.opacity=.55+.35*Math.sin(t*5)}
  const tf=Math.tan(this.cam.fov*Math.PI/360),fitH=(H+2.2)/2/tf,fitW=(W+1.5)/2/(tf*this.cam.aspect),fit=por?Math.max(fitH,fitW*.5):Math.max(fitH,fitW),dist=(fit+D*.5)*(this.azm||1),azd=this.azd||0;
  const cx=por?azd*(W*.36):0,az=por?Math.sin(t*.15)*.12:Math.sin(t*.15)*.2+azd;
  this.cam.position.set(300+cx+Math.sin(az)*dist,Y0+H*.5+1.2+Math.sin(t*.3)*.1,Math.cos(az)*dist);this.cam.lookAt(300+cx,Y0+H*.45,0);
  if(this.onAqLabel){if(sel){const v=sel.m.position.clone().add(T.position);v.y+=sel.L*.35+.3;v.project(this.cam);this.onAqLabel(v.x*.5+.5,(1-v.y)*.5,v.z<1,sel.i)}else this.onAqLabel(0,0,false,-1)}
  this.updSmoke(dt);this.r.render(this.s,this.cam)}
 startFlex(f,ix){this.ix=ix;this.mu=f.mut;this.hiF=ix>=3||!!f.mut;this.hf=false;this.fyaw=0;this.shot=-1;this.cs.set(0,1.4,PZ+.55)}
 snap(){this.r.render(this.s,this.cam);return this.cv.toDataURL('image/png')}
 lightsFor(m){const rl=this.rooms?this.rooms.root.children.filter(c=>c.isLight):[];rl.forEach(l=>l.visible=m==='room');(this.tl||[]).forEach(l=>l.visible=m==='aqua')}
 warm(){try{this.rooms=this.rooms||new Rooms(this);this.ensureTank();this.ensureItems();this.ensureDive();const arr=[this.ocl,this.mist,this.mark,this.mkGlow,this.rain,this.vortex,this.beam,this.orb,this.oLight,this.itm,this.snow,this.o2t,this.o2m,...this.bolts,...this.mt,...this.pt,...this.rg,...this.sm].filter(Boolean),old=arr.map(o=>o.visible);arr.forEach(o=>o.visible=true);
   for(const m of['room','aqua','game']){this.lightsFor(m);this.r.compile(this.s,this.cam)}this.r.render(this.s,this.cam);arr.forEach((o,i)=>o.visible=old[i])}catch(e){console.error(e)}this.lightsFor(this.mode==='room'||this.mode==='aqua'?this.mode:'game')}
 setRoom(type,d){this.mode='room';this.dome.visible=false;this.s.background=new THREE.Color('#10192b');this.s.fog=null;this.hemi.intensity=.9;this.sun.intensity=.9;this.sun.color.set('#ffffff');(this.rooms=this.rooms||new Rooms(this)).show(type,d);this.lightsFor('room')}
 roomTab(tab){if(this.mode==='room'&&this.rooms&&this.rooms.type==='shop'){this.rooms.tab=tab;return true}return false}
 roomDex(f,dark){if(this.rooms)this.rooms.dexFish(f,dark)}
 setOmen(col,meteor){this.omenCol=col;this.omenMeteor=!!meteor;this.omT=1}
 clearOmen(){this.omT=0}
 zap(col){const b=this.bolts[this.bi=(this.bi+1)%this.bolts.length],ud=b.userData,q=ud.q,x0=(Math.random()-.5)*44,z0=-14-Math.random()*32;let n=0;
  const seg=(a,c)=>{if(n>=79)return;q.setXYZ(n*2,a.x,a.y,a.z);q.setXYZ(n*2+1,c.x,c.y,c.z);n++},
   bolt=(p0,p1,d,dp)=>{if(dp===0){seg(p0,p1);return}const m=V((p0.x+p1.x)/2+(Math.random()-.5)*d,(p0.y+p1.y)/2,(p0.z+p1.z)/2+(Math.random()-.5)*d*.35);bolt(p0,m,d*.55,dp-1);bolt(m,p1,d*.55,dp-1);if(dp===3&&Math.random()<.75)bolt(m,V(m.x+(Math.random()-.5)*14,m.y-7-Math.random()*9,m.z+(Math.random()-.5)*4),d*.5,2)};
  const top=V(x0+(Math.random()-.5)*8,36,z0),bot=V(x0,.1,z0);bolt(top,bot,9,5);for(let i=n;i<80;i++){q.setXYZ(i*2,0,0,0);q.setXYZ(i*2+1,0,0,0)}q.needsUpdate=true;ud.bg.setDrawRange(0,n*2);
  ud.ls.forEach((l,i)=>l.material.color.set(i===1?'#ffffff':col));ud.gt.material.color.set(col);ud.gb.material.color.set(col);ud.gt.position.set(top.x,top.y-6,z0);ud.gt.scale.set(26,26,1);ud.gb.position.set(bot.x,1.2,z0);ud.gb.scale.set(12,8,1);
  b.visible=true;ud.l=.34;this.flash=1;this.flashCol=col;this.burstAt(V(bot.x,.1,z0),col,14,5,1.5);this.ringAt(V(bot.x,.05,z0),col,5,1.4);this.onThunder&&this.onThunder()}
 zAt(cd){return Math.min(-.6,this.pl.position.z-cd-.2)}
 setTod(tod){this.tod=tod;this.applyEnv()}
 setWeather(w){this.wx=w;this.applyEnv()}
 paintSky(c,n,wx,k){const d=this.dome,pa=d.geometry.attributes.position,ca=d.geometry.attributes.color,dk=n||wx==='meteor',top=c.clone().lerp(C(dk?'#02040c':wx==='storm'?'#1a2230':wx==='rain'?'#44566e':'#2b66b5'),n?.65:.5).lerp(C('#05020a'),.7*k),hz=c.clone().lerp(C('#ffffff'),(n||wx==='storm')?0:.12*(1-k)).lerp(C(this.omenCol||'#7a1a2a'),.16*k),o=C('#000');for(let i=0;i<pa.count;i++){const y=pa.getY(i)/112,kk=Math.pow(Math.max(0,y),.55);o.copy(hz).lerp(top,kk);ca.setXYZ(i,o.r,o.g,o.b)}ca.needsUpdate=true;d.visible=true}
 applyEnv(){if(this.mode==='aqua'||this.mode==='room')return;const tod=this.tod||'siang',wx=this.wx||'clear',n=tod==='malam',L=this.loc||0,c=C(SKY[L][0]),k=this.om||0,om=k>.02;
  if(tod==='senja')c.lerp(C('#e8885a'),.45);if(n)c.lerp(C('#0b1530'),.78);
  if(wx==='rain')c.lerp(C('#6b7785'),.5);if(wx==='storm')c.lerp(C('#2c3440'),.78);if(wx==='meteor')c.lerp(C('#070d22'),.8);
  if(om){c.lerp(C('#150a14'),.92*k);if(this.omenCol)c.lerp(C(this.omenCol),.1*k)}
  const dark=n||wx==='meteor'||k>.45,sc=k>.45?(this.omenCol||'#b03a5a'):dark?'#7f9bdc':tod==='senja'?'#ffb36b':wx==='storm'?'#9aa8bc':'#ffffff';
  const hi0=dark?.6:wx==='storm'?.55:wx==='rain'?.8:1,si0=dark?.7:wx==='storm'?.6:wx==='rain'?1.2:tod==='senja'?1.7:2.2;
  this.base={hi:hi0+(.38-hi0)*k,si:si0+(.35-si0)*k,sc};
  this.paintSky(c,n,wx,k);this.s.background=c;const fn=wx==='storm'?12:wx==='rain'?20:28,ff=wx==='storm'?60:95;this.s.fog=new THREE.Fog(c,fn+(8-fn)*k,ff+(44-ff)*k);
  this.hemi.intensity=this.base.hi;this.sun.intensity=this.base.si;this.sun.color.set(sc);
  this.moon.visible=dark&&k<.7;this.moon.material.color.set(k>.45?(this.omenCol||'#c0392b'):'#f3f0dc');this.sunD.visible=!dark&&wx==='clear';this.stars.visible=dark&&k<.6;
  this.water.material.color.set(WAT[L]).multiplyScalar((dark?.6:wx==='storm'?.55:1)*(1-.25*k)).lerp(C('#4a1424'),.4*k);
  (this.cl3||[]).forEach(g=>g.visible=!dark&&L!==4);this.ff.visible=(tod!=='siang'||n)&&L<4&&wx!=='storm'&&!om;
  this.lantern.intensity=dark||tod==='senja'||wx==='storm'||k>.2?1.6:0;this.rain.visible=wx==='rain'||wx==='storm'||k>.25;this.wamp=(wx==='storm'?2.4:wx==='rain'?1.3:1)*(1+.9*k)}
 build(i){
  this.loc=i;if(this.env){this.s.remove(this.env);disposeFish(this.env)}const E=this.env=new THREE.Group();this.s.add(E);
  let sd=i*977+13;const Rn=()=>(sd=sd*16807%2147483647)/2147483647;
  const mm=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.9,flatShading:true,...o});
  const add=(g,m,x,y,z,sc=1,p=E)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.setScalar(sc);p.add(o);return o};
  const ico=new THREE.IcosahedronGeometry(1,1),cone=new THREE.ConeGeometry(1,2.4,6),trk=new THREE.CylinderGeometry(.12,.18,1,5),oct=new THREE.OctahedronGeometry(1,0);
  const bank=SKY[i][1],leaf=['#3f7d3a','#4a7a3a','#556b2f','#3f9e6e','#1d2a4a'][i];
  for(let k=0;k<16;k++){const s=5+Rn()*8,o=add(ico,mm(bank),-70+k*9+Rn()*4,-1+s*.2,-52-Rn()*10,s);o.scale.y=s*.55}
  if(i<4){for(const sx of[-1,1])add(new THREE.BoxGeometry(18,1.4,90),mm(bank),sx*24,-.1,-30);
   for(let k=0;k<26;k++){const x=(Rn()<.5?-1:1)*(15+Rn()*14),z=3-Rn()*60;
    if(i===3){add(trk,mm('#8a6a44'),x,2,z,3.5).rotation.z=(Rn()-.5)*.4;add(ico,mm('#3f9e6e'),x,3.9,z,1.2).scale.y=.45}
    else{add(trk,mm('#5a3d24'),x,1.4,z,2);add(cone,mm(leaf),x,3.5,z,1+Rn()*.7)}}}
  else{for(let k=0;k<22;k++){const o=add(oct,mm('#2bb5c9',{emissive:'#2bb5c9',emissiveIntensity:.8}),(Rn()-.5)*70,-2+Rn()*3,-6-Rn()*45,.6+Rn()*1.2);o.scale.y*=2+Rn()*3}}
  this.plk=null;if(i===4){const pos=[];for(let k=0;k<160;k++)pos.push((Rn()-.5)*50,-4+Rn()*5,1-Rn()*40);const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));this.plk=new THREE.Points(pg,new THREE.PointsMaterial({color:'#6ff0ff',size:.14}));E.add(this.plk)}
  const cc=['#e46a6a','#e9a23b','#c2308a','#2bb5c9'];
  const SB=this.sbG=new THREE.Group();E.add(SB);
  for(let k=0;k<46;k++){const x=(Rn()-.5)*46,z=-2-Rn()*38;if(i===3)add(cone,mm(cc[k%4]),x,-15.2,z,.7+Rn()*1.5,SB);else add(ico,mm(i===4?'#1f2a48':'#2a3a44'),x,-15.6,z,.6+Rn()*1.8,SB)}
  for(let k=0;k<30;k++){const x=(Rn()-.5)*46,z=-2-Rn()*38,hh=4+Rn()*9;add(new THREE.CylinderGeometry(.08,.16,hh,5),mm(i===3?cc[k%4]:i===4?'#2bb5c9':'#2f6b4a',i===4?{emissive:'#2bb5c9',emissiveIntensity:.6}:{}),x,-16+hh/2,z,1,SB)}
  for(let k=0;k<7;k++){const x=(Rn()-.5)*30,z=-6-Rn()*30,hh=2+Rn()*3.5;add(new THREE.CylinderGeometry(.5,.6,hh,8),mm('#5d6a74'),x,-16+hh/2,z,1,SB);add(new THREE.BoxGeometry(1.5,.3,1.5),mm('#707d88'),x,-16+hh+.15,z,1,SB)}
  this.cl3=[];for(let k=0;k<6;k++){const g=new THREE.Group();for(let j=0;j<3;j++)add(ico,mm('#ffffff',{roughness:1}),j*2.2-2.2,Rn(),0,2+Rn()*1.2,g);g.position.set(-50+k*20,28+Rn()*8,-50-Rn()*20);E.add(g);this.cl3.push(g)}
  if(i<4){const rc=mm(i===3?'#c9b27a':'#6f8f3a');
   for(let k=0;k<40;k++){const x=(Rn()<.5?-1:1)*(9+Rn()*5),z=2-Rn()*16;add(new THREE.ConeGeometry(.05,1.2+Rn()*.8,4),rc,x,.5,z).rotation.z=(Rn()-.5)*.3}
   for(let k=0;k<10;k++)add(ico,mm('#6b7078'),(Rn()<.5?-1:1)*(9+Rn()*6),.1,1-Rn()*14,.3+Rn()*.6).scale.y*=.6}
  if(i===0){for(let k=0;k<14;k++){const x=(Rn()-.5)*10,z=-1-Rn()*10;add(new THREE.CylinderGeometry(.35,.35,.03,10),mm('#3f8f4a'),x,.03,z);if(k%3===0)add(new THREE.SphereGeometry(.1,6,5),mm('#e68fb0'),x,.1,z)}
   add(new THREE.BoxGeometry(1.2,.35,3.2),mm('#8a5a2a'),-7.5,.05,-4).rotation.y=.5}
  {const wdm=mm('#7a5a3a'),wd2=mm('#86643f'),rl=mm('#5a3d24'),sandC=i===3?'#e3d29c':i===4?'#363f63':bank,grsC=['#4f8f45','#5d7f45','#46663a','#d8c48a','#2c3556'][i]||'#4f8f45';
   for(const sd of[-1,1]){const cx=sd*ISL.x,cz=ISL.z,r=ISL.r;
    add(new THREE.CylinderGeometry(r,r*1.2,1.7,18),mm(sandC),cx,-.29,cz);add(new THREE.CylinderGeometry(r*.93,r*.97,.07,18),mm(grsC),cx,.56,cz);
    for(let k=0;k<12;k++){const a=k/12*6.283+Rn()*.3,rr=r*(1.02+Rn()*.1);add(ico,mm(i===4?'#2a3354':'#6b7078'),cx+Math.cos(a)*rr,.05+Rn()*.2,cz+Math.sin(a)*rr,.3+Rn()*.5).scale.y*=.7}
    for(let k=0;k<4;k++){const px=cx+sd*(1.3+Rn()*1.2),pz=cz+(Rn()-.75)*r*.95;
     if(i<3){add(trk,mm('#5a3d24'),px,1.4,pz,2);add(cone,mm(leaf),px,3.6,pz,1+Rn()*.6)}
     else if(i===3){add(trk,mm('#8a6a44'),px,2,pz,3.2).rotation.z=(Rn()-.5)*.4;add(ico,mm('#3f9e6e'),px,3.8,pz,1.1).scale.y=.45}
     else add(oct,mm('#2bb5c9',{emissive:'#2bb5c9',emissiveIntensity:.8}),px,.9,pz,.5+Rn()*.5).scale.y*=2.2+Rn()*2}
    for(let k=0;k<5;k++)add(ico,mm(i===4?'#3a4a7a':'#3f7d3a'),cx+(Rn()-.5)*r*1.4,.7,cz+(.2+Rn()*.6)*r,.35+Rn()*.3).scale.y*=.7;
    for(let k=0;k<8;k++)add(new THREE.BoxGeometry(.52,.08,1.7),k%2?wdm:wd2,sd*(3.45+k*.5),.52,2.4);
    for(const zz of[1.6,3.2]){add(new THREE.BoxGeometry(3.9,.06,.06),rl,sd*5.2,1.05,zz);for(let k=0;k<4;k++)add(new THREE.BoxGeometry(.07,.55,.07),rl,sd*(3.5+k*1.1),.78,zz)}
    for(let k=0;k<3;k++)for(const zz of[1.75,3.05])add(new THREE.CylinderGeometry(.1,.1,3,6),rl,sd*(3.8+k*1.4),-.9,zz)}}
  this.amb=[];const pool=this.fish.filter(f=>f.hab.some(x=>x.n===NAMES[i]&&x.c!=='event'));
  for(let k=0;k<Math.min(5,pool.length*2);k++){const m=makeFish(pool[k%pool.length]);m.scale.setScalar(.45+Rn()*.4);E.add(m);this.amb.push({m,cx:(Rn()-.5)*14,cz:-5-Rn()*14,r:2+Rn()*4,sp:.25+Rn()*.3,y:-1.6-Rn()*2.4,ph:Rn()*6,d:Rn()<.5?1:-1})}
  this.setTod(this.tod||'siang')}
 wave(x,z,t){return(Math.sin(x*.45+t*1.3)*.07+Math.cos(z*.38+t*1.0)*.07+Math.sin((x+z)*.2+t*.6)*.05)*(this.wamp||1)}
 ang(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a))}
 moveStep(dt,G,t,st){const P=this.pl,i=this.inp||{x:0,y:0};
  if(this.rd){this.rideStep(dt,G,t);return}
  this.rideH=null;P.scale.setScalar(1);let ix=i.x,iy=i.y,m=Math.hypot(ix,iy),walking=false,auto=false;
  if(st!=='idle')this.aw=null;
  if(this.aw&&this.aw.length){if(m>.3)this.aw=null;else{const w=this.aw[0],dx=w[0]-P.position.x,dz=w[1]-P.position.z,dl=Math.hypot(dx,dz);if(dl<.2){this.aw.shift();if(!this.aw.length)this.aw=null}else{ix=dx/dl;iy=dz/dl;m=1;auto=true}}}
  if(st==='idle'&&m>.12){const k=Math.min(1,m),sp=(auto?3.7:3.1)*k,nx=P.position.x+ix/m*sp*dt,nz=P.position.z+iy/m*sp*dt;if(auto||this.walk(nx,nz)){P.position.x=nx;P.position.z=nz}else if(this.walk(nx,P.position.z))P.position.x=nx;else if(this.walk(P.position.x,nz))P.position.z=nz;this.hd=Math.atan2(-ix/m,-iy/m);this.wk=(this.wk||0)+dt*(6+sp*1.2);walking=true}
  else if(st!=='idle')this.hd=0;
  if(st==='idle'){this.hdc=(this.hdc||0)+this.ang(this.hdc||0,this.hd||0)*Math.min(1,dt*10);P.rotation.y=this.hdc}else this.hdc=P.rotation.y;
  if(walking){const w=this.wk;this.legs.forEach((l,k)=>{l.rotation.x=Math.sin(w+k*Math.PI)*.55});this.knees.forEach((kn,k)=>{kn.rotation.x=-Math.max(0,Math.sin(w+k*Math.PI+1.57))*.85});P.position.y+=Math.abs(Math.sin(w))*.05;this.tb.rotation.x-=.05}
  this.walking=walking;{const x=P.position.x;this.spot=x<-4.5?'kiri':x>4.5?'kanan':'dermaga'}}
 walk(x,z){if(x>-2.75&&x<2.75&&z>.85&&z<4.15)return 1;if(Math.abs(x)>2.6&&Math.abs(x)<6.8&&z>1.75&&z<3.05)return 2;for(const sd of[-1,1]){const dx=x-sd*ISL.x,dz=z-ISL.z;if(dx*dx+dz*dz<(ISL.r-.35)*(ISL.r-.35))return 3}return 0}
 goSpot(n){const R={kiri:[[-2.4,2.4],[-6.6,2.4],[-9.5,.7]],kanan:[[2.4,2.4],[6.6,2.4],[9.5,.7]]},cur=this.spot||'dermaga';let path=[];
  if(cur!=='dermaga')path=R[cur].slice(0,-1).reverse().concat([[0,2.4]]);
  if(n!=='dermaga')path=path.concat(R[n]);else if(!path.length)path=[[0,1.6]];this.aw=path}
 ensureItems(){if(this.itm)return;const g=this.itm=new THREE.Group();g.visible=false;this.s.add(g);this.items=[];
  const sg=new THREE.SphereGeometry(1,10,8),og=new THREE.OctahedronGeometry(1,0),bm=c=>new THREE.MeshBasicMaterial({color:c});
  for(let k=0;k<44;k++){const o=new THREE.Group(),core=new THREE.Mesh(sg,bm('#fff')),halo=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.22,depthWrite:false})),oc=new THREE.Mesh(og,bm('#7ff3ff')),st=new THREE.Mesh(og,bm('#ff7ad9')),ch=new THREE.Group();
   const bx=(w,h,d,c,x,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bm(c));m.position.set(x,y,0);ch.add(m)};bx(1.1,.6,.75,'#7a4a1a',0,0);bx(1.15,.22,.8,'#a4723a',0,.38);bx(.2,.85,.82,'#e9c24b',0,.1);bx(.28,.2,.86,'#fff2a8',0,.12);
   halo.scale.setScalar(1.9);o.add(core,halo,oc,st,ch);o.userData={core,halo,oc,st,ch,k:'p',ph:Math.random()*6,x:0,z:0};g.add(o);this.items.push(o);this.spawnItem(o,true)}
  const N=260,pp=new Float32Array(N*3);for(let i=0;i<N;i++){pp[i*3]=(Math.random()-.5)*26;pp[i*3+1]=(Math.random()-.5)*16;pp[i*3+2]=(Math.random()-.5)*26}
  this.snow=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(pp,3)),new THREE.PointsMaterial({color:'#cfefff',size:.07,transparent:true,opacity:.6,depthWrite:false}));this.snow.frustumCulled=false;this.snow.visible=false;this.s.add(this.snow)}
 spawnItem(o,far){const d=o.userData,R=this.rd,dy=Math.random()<.22?0:.6+Math.pow(Math.random(),1.2)*12.8,r=Math.random();let k;
  if(dy<1)k=r<.78?'p':r<.93?'g':'x';else if(dy<5)k=r<.46?'p':r<.7?'g':r<.88?'x':'c';else if(dy<9)k=r<.2?'p':r<.45?'g':r<.72?'x':'c';else k=r<.1?'g':r<.38?'x':r<.72?'c':'t';
  d.k=k;d.dy=dy;const col={p:'#f4f7ff',g:'#ffd24a',c:'#5ff0ff',x:'#ff7ad9',t:'#ffd24a'}[k],sz=({p:.22,g:.32,c:.3,x:.34,t:.5}[k])*(1+dy*.04);
  d.core.material.color.set(col);d.halo.material.color.set(col);d.core.visible=k==='p'||k==='g';d.oc.visible=k==='c';d.st.visible=k==='x';d.ch.visible=k==='t';d.sz=sz;d.core.scale.setScalar(sz);d.halo.scale.setScalar(sz*2.3);d.oc.scale.setScalar(sz*1.1);d.st.scale.set(sz*1.1,sz*1.7,sz*1.1);d.ch.scale.setScalar(sz*.9);
  let x,z,n=0;do{x=(Math.random()-.5)*25;z=-4-Math.random()*42;n++}while(R&&!far&&Math.hypot(x-R.x,z-R.z)<10&&n<8);d.x=x;d.z=z}
 startRide(f){if(this.rd)return null;const m=makeFish(f,false,f.mut);m.rotation.order='YZX';const L=cl(1.7+Math.cbrt(f.weight)*.45,1.9,6.4);m.scale.setScalar(L);this.s.add(m);
  const ix=RN.indexOf(f.rarity),P=this.pl,x0=cl(P.position.x,-2.4,2.4),z0=-1.7-L*.35,D1=m.userData.dy||.2;
  this.rd={m,L,f,x:x0,z:z0,vx:0,vz:0,yaw:Math.PI/2,roll:0,ph:'mount',t:0,from:P.position.clone(),to:null,stam:100,exh:false,boost:false,top:Math.max(.12,D1)*L,ps:.5,fx:0,fz:-1,
   spd:rideSpeed(f),dist:0,rt:0,sink:0,auto:null,spray:0,dep:0,dv:0,o2:100,pit:0,low:false,bt:0,dm:cl(14.8-L*.35,9,14),maxd:0};
  this.dur=.7+Math.hypot(x0-P.position.x,z0-P.position.z)*.08;this.ensureItems();this.ensureDive();this.o2t.visible=this.o2m.visible=true;this.itm.visible=true;this.rideH=[V(0,0,0),V(0,0,0)];this.fk=0;return this.rd}
 ensureDive(){if(this.o2t)return;const mm=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.5,metalness:.35,...o}),T=this.o2t=new THREE.Group(),yl=mm('#e9c24b'),dk=mm('#2a3340');T.visible=false;
  const add=(g,m,x,y,z,p=T)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
  for(const x of[-.1,.1]){add(new THREE.CylinderGeometry(.085,.085,.6,10),yl,x,0,0);add(new THREE.SphereGeometry(.085,10,6,0,6.283,0,1.5708),yl,x,.3,0);add(new THREE.CylinderGeometry(.03,.03,.1,6),dk,x,.39,0)}
  add(new THREE.BoxGeometry(.34,.06,.2),dk,0,.12,0);add(new THREE.BoxGeometry(.34,.06,.2),dk,0,-.14,0);add(new THREE.CylinderGeometry(.014,.014,.3,5).rotateZ(Math.PI/2),dk,0,.43,0);
  T.position.set(0,.42,.52);this.tb.add(T);
  const M=this.o2m=new THREE.Group();M.visible=false;add(new THREE.BoxGeometry(.36,.13,.08),dk,0,.03,-.2,M);add(new THREE.BoxGeometry(.28,.09,.02),mm('#7ff3ff',{emissive:'#2bb5c9',emissiveIntensity:.6,transparent:true,opacity:.85}),0,.03,-.245,M);add(new THREE.CylinderGeometry(.022,.022,.08,6).rotateX(Math.PI/2),dk,0,-.07,-.22,M);this.head.add(M)}
 bubbleAt(v,n=1){if(!this.bub){const g=new THREE.SphereGeometry(1,6,5),mt=new THREE.MeshBasicMaterial({color:'#cfefff',transparent:true,opacity:.7,depthWrite:false});this.bub=Array.from({length:40},()=>{const m=new THREE.Mesh(g,mt);m.visible=false;m.userData={s:.1,v:1};this.s.add(m);return m})}
  for(let i=0;i<n;i++){const m=this.bub.find(x=>!x.visible);if(!m)return;m.visible=true;m.position.set(v.x+(Math.random()-.5)*.2,v.y,v.z+(Math.random()-.5)*.2);m.userData.s=.05+Math.random()*.08;m.userData.v=.8+Math.random()*.7;m.scale.setScalar(m.userData.s)}}
 updBub(dt){if(!this.bub)return;for(const m of this.bub)if(m.visible){m.position.y+=m.userData.v*dt;m.position.x+=Math.sin(this.t*5+m.userData.v*9)*dt*.12;if(m.position.y>.02)m.visible=false}}
 uwEnv(dt=.016){const uw=!!this.rd&&this.cam.position.y<.1;if(!uw){this._dk=0;if(this.snow)this.snow.visible=false;if(this._uw){this._uw=false;this.applyEnv()}return}
  const dk=cl(-this.cam.position.y/16,0,1),L=this.loc||0;this._dk=dk;
  if(!this._uw||!this._uwc){this._uw=true;this._uwc=C('#000');this._uwb=C(WAT[L]).lerp(C('#3aa8c8'),.35).multiplyScalar(.85);this.s.background=this._uwc;this.s.fog=new THREE.Fog(this._uwc,1.5,26);this.dome.visible=false}
  if(this.s.background!==this._uwc){this.s.background=this._uwc;this.s.fog=new THREE.Fog(this._uwc,1.5,26);this.dome.visible=false}
  this._uwc.copy(this._uwb).multiplyScalar(1-dk*.78);this.s.fog.color.copy(this._uwc);this.s.fog.near=1.5;this.s.fog.far=26-dk*13;
  this.moon.visible=this.sunD.visible=this.stars.visible=false;
  if(this.snow){this.snow.visible=true;this.snow.position.copy(this.cam.position);const a=this.snow.geometry.attributes.position,pa=a.array;for(let i=1;i<pa.length;i+=3){pa[i]-=dt*(.25+(i%7)*.03);if(pa[i]<-8)pa[i]+=16}a.needsUpdate=true}}
 stopRide(){const R=this.rd;if(!R||R.ph==='dis'||R.ph==='mount')return;R.ph='dis';R.t=0;R.from=this.pl.position.clone();R.to=V(cl(R.x,-2.4,2.4),.6,1.3);R.auto=null}
 goHome(){const R=this.rd;if(R&&R.ph==='ride'){R.auto={x:cl(R.x,-2,2),z:-2.2};if(R.dep>.5)R.low=true}}
 rideStep(dt,G,t){const R=this.rd,P=this.pl,m=R.m,L=R.L,i=this.inp||{x:0,y:0,boost:false};R.t+=dt;
  {const DM=R.dm||14,dd=R.ph==='ride'?(R.low?-1.7:(i.dive||0)):-1;R.dv+=(dd*3.3-R.dv)*Math.min(1,dt*3.5);R.dep=cl(R.dep+R.dv*dt,0,DM);if((R.dep<=0&&R.dv<0)||(R.dep>=DM&&R.dv>0))R.dv=0;R.maxd=Math.max(R.maxd||0,R.dep);
   if(R.dep>.6){R.o2=Math.max(0,R.o2-(100/78)*(1+R.dep/11)*dt*(R.boost?1.5:1));if(R.o2<=0&&!R.low){R.low=true;this.onRide&&this.onRide('o2low')}}
   else{R.o2=Math.min(100,R.o2+30*dt);if(R.low&&R.dep<.3&&R.o2>=40)R.low=false}}
  const sf=1-Math.min(1,R.dep/.8),fy=(this.wave(R.x,R.z,t)+Math.sin(t*2.6)*.03)*sf-.06*L-R.dep;
  const seat=(o)=>{const fx=R.fx,fz=R.fz;o.set(R.x+fx*L*.05,fy+R.top-.27+.03,R.z+fz*L*.05)};
  if(R.ph==='ride'||R.ph==='dis'){
   let ix=i.x,iy=i.y,mg=Math.hypot(ix,iy);
   if(R.ph==='dis'){ix=iy=mg=0}
   else if(R.auto){if(mg>.25)R.auto=null;else{const dx=R.auto.x-R.x,dz=R.auto.z-R.z,dl=Math.hypot(dx,dz);if(dl<1.3){this.stopRide();ix=iy=mg=0}else{ix=dx/dl;iy=dz/dl;mg=1}}}
   const want=R.ph==='ride'&&i.boost&&!R.exh&&R.stam>0&&mg>.1;R.boost=want;
   if(want){R.stam=Math.max(0,R.stam-30*dt);if(R.stam<=0)R.exh=true}else{R.stam=Math.min(100,R.stam+(mg>.1?12:22)*dt);if(R.exh&&R.stam>=30)R.exh=false}
   const tv=mg>.05?Math.min(1,mg)*R.spd*(want?1.9:1):0,tx=mg>.05?ix/mg*tv:0,tz=mg>.05?iy/mg*tv:0,k=Math.min(1,dt*(2.4-L*.18));
   R.vx+=(tx-R.vx)*k;R.vz+=(tz-R.vz)*k;R.x+=R.vx*dt;R.z+=R.vz*dt;
   if(R.x>13.5){R.x=13.5;R.vx=Math.min(0,R.vx)}if(R.x<-13.5){R.x=-13.5;R.vx=Math.max(0,R.vx)}if(R.z<-47){R.z=-47;R.vz=Math.max(0,R.vz)}if(R.z>-1.2&&R.ph==='ride'){R.z=-1.2;R.vz=Math.min(0,R.vz)}
   const sp=Math.hypot(R.vx,R.vz);R.dist+=sp*dt;let ty=R.yaw;if(sp>.4)ty=Math.atan2(-R.vz,R.vx);const da=this.ang(R.yaw,ty);R.yaw+=da*Math.min(1,dt*(4.2-L*.35));
   R.roll+=(cl(-da*.7,-.45,.45)-R.roll)*Math.min(1,dt*5);R.fx=Math.cos(R.yaw);R.fz=-Math.sin(R.yaw);R.sp=sp;
   R.spray-=dt;if(sp>1.2&&R.spray<=0&&R.dep<.5){R.spray=want?.05:.16;const bx=R.x-R.fx*L*.45,bz=R.z-R.fz*L*.45;this.burstAt(V(bx,.05,bz),want?'#ffffff':'#dfeaf2',want?3:1,1.6+sp*.15,.5);if(Math.random()<.4)this.ringAt(V(bx,.04,bz),'#dfeaf2',1.2+L*.4,1.6)}
   // item pickup + magnet
   for(const o of this.items){const d=o.userData,dx=d.x-R.x,dz=d.z-R.z,dl=Math.hypot(dx,dz);if(dl<4&&R.ph==='ride'&&Math.abs((d.dy||0)-R.dep)<2.2){d.x-=dx/dl*dt*(4-dl)*2.2;d.z-=dz/dl*dt*(4-dl)*2.2}
    if(R.ph==='ride'&&Math.hypot(dl,(d.dy||0)-R.dep)<.9+L*.45){const col={p:'#f4f7ff',g:'#ffd24a',c:'#5ff0ff',x:'#ff7ad9',t:'#ffd24a'}[d.k];if(d.dy>.3)this.bubbleAt(V(d.x,-d.dy,d.z),10);else this.burstAt(V(d.x,.5,d.z),col,14,4,1.2);this.ringAt(V(d.x,.05,d.z),col,2.4,1.6);this.onItem&&this.onItem(d.k,d.dy||0);this.spawnItem(o)}}
  }
  if(R.ph==='mount'||R.ph==='dis'){const dur=R.ph==='mount'?this.dur:.9,p=Math.min(1,R.t/dur),e=p*p*(3-2*p),a=R.ph==='mount'?R.from:R.from,sp_=V(0,0,0);
   if(R.ph==='mount'){seat(sp_);P.position.lerpVectors(a,sp_,e);P.scale.setScalar(1+(R.ps-1)*e);const hh=Math.sin(p*Math.PI)*(1.2+L*.2);P.position.y+=hh;
    if(p>=1){R.ph='ride';R.t=0;this.burstAt(V(R.x,.1,R.z),'#dfeaf2',22,5,1.4);this.ringAt(V(R.x,.05,R.z),'#ffffff',4,1.4);this.onRide&&this.onRide('mounted')}}
   else{P.position.lerpVectors(a,R.to,e);P.scale.setScalar(R.ps+(1-R.ps)*e);P.position.y+=Math.sin(p*Math.PI)*1.4;R.sink+=dt;
    if(p>=1){P.position.copy(R.to);P.scale.setScalar(1);this.hdc=0;this.hd=0;this.endRide();return}}}
  else seat(P.position);
  if(R.ph==='dis'){R.x+=R.fx*dt*1.2;R.z+=R.fz*dt*1.2;m.scale.setScalar(Math.max(.01,L*(1-Math.min(1,R.sink/.95))))}
  m.position.set(R.x,fy-(R.ph==='ride'||R.ph==='mount'?0:R.sink*.6),R.z);m.rotation.y=R.yaw;m.rotation.x=R.roll;R.pit+=(-cl(R.dv/2.4,-1,1)*.5-R.pit)*Math.min(1,dt*5);m.rotation.z=(R.boost?.1:Math.sin(t*2)*.03)+R.pit;
  if(R.dep>.5){R.bt-=dt;if(R.bt<=0){R.bt=.2;this.head.getWorldPosition(this._hp=this._hp||V(0,0,0));this.bubbleAt(this._hp,1)}}
  animateFish(m,t,.25+Math.min(1,(R.sp||0)/10)*.9);
  if(m.userData.mats&&(R.f.mut||RN.indexOf(R.f.rarity)>=3))m.userData.mats.forEach(q=>{q.emissiveIntensity=q.userData.e0*(1+.5*Math.sin(t*4))});
  if(R.f.mut&&Math.random()<dt*10)this.smoke(V(R.x-R.fx*L*.4,fy+.2,R.z-R.fz*L*.4),R.f.mut.c,1,.6);
  // pose
  const ps=P.scale.x,sp1=Math.min(1,(R.sp||0)/10);P.rotation.y=Math.atan2(-R.fx,-R.fz);
  this.tb.rotation.x=-.1-sp1*.28-(R.boost?.12:0);this.tb.rotation.z=R.roll*.6;this.head.rotation.x=.1+sp1*.2;this.head.rotation.y=0;
  this.knees.forEach(kn=>kn.rotation.x=-1.0);this.legs.forEach((l,k)=>{l.rotation.x=1.1;l.rotation.z=(k?1:-1)*(.4+Math.sin(t*3+k)*.04)});
  const fx=R.fx,fz=R.fz,sx=-fz,sz=fx;this.rideH.forEach((h,k)=>{const sg=k?-1:1;h.set(R.x+fx*(L*.05+.32*ps/.5*.5)+sx*sg*.17*ps/.5*.5,fy+R.top+.08,R.z+fz*(L*.05+.32*ps/.5*.5)+sz*sg*.17*ps/.5*.5)});
  // items anim
  if(this.itm){for(const o of this.items){const d=o.userData;o.position.set(d.x,d.dy>.2?-d.dy+Math.sin(t*2+d.ph)*.15:.45+Math.sin(t*2+d.ph)*.15+this.wave(d.x,d.z,t),d.z);d.oc.rotation.y=t*2;d.st.rotation.y=t*2.4;d.ch.rotation.y=Math.sin(t*.7+d.ph)*.6;d.halo.material.opacity=.18+.1*Math.sin(t*4+d.ph)}}
  }
 endRide(){const R=this.rd;if(!R)return;this.s.remove(R.m);disposeFish(R.m);if(this.o2t)this.o2t.visible=this.o2m.visible=false;if(this.bub)this.bub.forEach(b=>b.visible=false);this.lastRide={maxd:R.maxd||0};this.rd=null;this.uwEnv();this.rideH=null;this.itm.visible=false;this.pl.scale.setScalar(1);this.cam.fov=this.cam.aspect<1?74:52;this.cam.updateProjectionMatrix();this.onRide&&this.onRide('end')}
 rideCam(base,look,dt){const R=this.rd;if(!R)return;const L=R.L,por=this.cam.aspect<1;
  const so=cl(R.dep/3,0,1),by=(3.4+L*.55+(por?1.6:0))*(1-so)+(2.0+L*.4+(por?1:0))*so-R.dep;base.set(R.x*.85,Math.max(-14.6,by),R.z+6.2+L*.9+(por?2.5:0));look.set(R.x,Math.max(-14.9,.3+L*.15-R.dep),R.z-3.2);
  const kk=((R.boost?9:0)-(this.fk||0))*Math.min(1,dt*4);this.fk=(this.fk||0)+kk;const fv=(por?74:52)+this.fk;if(Math.abs(this.cam.fov-fv)>.05){this.cam.fov=fv;this.cam.updateProjectionMatrix()}}
 ringAt(v,col='#fff',mx=2,sp=1.5){const m=this.rg.find(x=>!x.visible);if(!m)return;m.visible=true;m.material.color.set(col);m.position.copy(v);m.userData={l:1,sp,mx};m.scale.setScalar(.1)}
 ring(cd,col,mx=1.8){this.ringAt(V(this.pl.position.x,.05,this.zAt(cd)),col,mx)}
 burstAt(v,col,n,up=4,spread=1){if(this.low)n=Math.ceil(n/4);for(let i=0;i<n;i++){const m=this.pt.find(x=>!x.visible);if(!m)return;m.visible=true;m.position.copy(v);m.material.color.set(col);m.userData.v.set((Math.random()-.5)*spread*2,up*(.4+Math.random()),(Math.random()-.5)*spread*2);m.userData.l=.8+Math.random()*.8;m.scale.setScalar(.6+Math.random()*1.2)}}
 splash(cd,n=14){this.burstAt(V(this.pl.position.x,.1,this.zAt(cd)),'#dfeaf2',n,4,.9)}
 mkFish(f){if(this.fm){this.s.remove(this.fm);disposeFish(this.fm)}const m=makeFish(f,false,f.mut);m.userData.mut=f.mut;m.rotation.order='YZX';this.fL=cl(.35+Math.cbrt(f.weight)*.4,.4,6.2);m.scale.setScalar(this.fL);this.s.add(m);this.fm=m;this.fk=f.id+f.sc;this.mcol=f.mut?f.mut.c:colorOf(f);this.py0=undefined}
 catchFx(f,ix,big){this.hiF=ix>=3||!!f.mut||!!big;this.brd=false;this.trT=0;const w=this.fm?this.fm.position:V(0,-1,0),mu=f.mut,col=mu?mu.c:RC[f.rarity];this.cs.copy(w);this.fyaw=0;this.shot=-1;this.ix=ix;this.mu=mu;this.hf=false;
  this.burstAt(V(w.x,.1,w.z),ix||mu?col:'#dfeaf2',10+ix*10+(mu?20:0),5+ix,1.5);this.ringAt(V(w.x,.05,w.z),col,3+ix,1.5);if(ix>=3||mu)this.ringAt(V(w.x,.05,w.z),col,6+ix,1);
  this.orb.children.forEach(o=>o.material.color.set(col));this.smoke(V(w.x,.2,w.z),col,3,1);
  if(ix>=5||(mu&&mu.orb)){this.vortex.visible=true;this.vortex.position.set(w.x,.1,w.z)}}
 breach(x,z,col){const hi=this.ix>=4||!!this.mu;this.burstAt(V(x,.1,z),'#dfeaf2',44,9,1.6);this.burstAt(V(x,.2,z),col,26,10,1.2);[2.5,5,8].forEach((m,i)=>setTimeout(()=>this.ringAt(V(x,.05,z),i?col:'#ffffff',m+(this.fL||1)*.5,1.2-i*.2),i*90));this.smoke(V(x,.3,z),'#ffffff',6,2);this.flash=Math.max(this.flash||0,.7);this.flashCol=col;if(hi)setTimeout(()=>this.zap(col),120);if(this.sk)this.shake=.6}
 holdFx(){const ix=this.ix,mu=this.mu,col=mu?mu.c:RC[Object.keys(RC)[ix]];this.burstAt(H,col,14+ix*14+(mu?30:0),2.5,3);this.smoke(V(H.x,H.y,H.z),col,4,1);
  if(ix>=3||mu){this.ringAt(V(H.x,H.y-.4,H.z),col,2.5,1.3);this.ringAt(V(H.x,H.y,H.z),col,3.5,.9)}
  if(ix>=4||mu)this.beam.visible=true;this.beam.material.color.set(mu?mu.c:ix>=6?'#19f0d0':'#e9c24b');if(ix>=5||(mu&&mu.orb))this.burstAt(H,'#2bb5c9',50,3,3.5);if(ix>=6){this.burstAt(H,'#19f0d0',70,4,3.5);this.ringAt(V(H.x,H.y,H.z),'#19f0d0',5,.8);this.ringAt(V(H.x,H.y-.4,H.z),'#ffffff',7,.7);setTimeout(()=>this.zap('#19f0d0'),100)}}
 frame(dt,G,S,rod,tod){
  const cv=this.cv,w=cv.clientWidth||1,h=cv.clientHeight||1;
  if(w!==this.w||h!==this.h){this.w=w;this.h=h;this.r.setSize(w,h,false);this.cam.aspect=w/h;this.cam.fov=w/h<1?74:52;this.cam.updateProjectionMatrix()}
  const vo=this.mode==='aqua'||this.mode==='room';if(vo)this.cam.setViewOffset(w,h,0,Math.round(h*(this.mode==='aqua'?.12:.2)),w,h);else if(this._vo)this.cam.clearViewOffset();this._vo=vo;
  if(S.loc!==this.loc)this.build(S.loc);if(tod!==this.tod)this.setTod(tod);
  {const nw=performance.now(),rd=Math.min(100,nw-(this._pn||nw));this._pn=nw;this.fa=(this.fa||16.7)*.93+rd*.07;if(this.t>4){this._at=(this._at||0)+rd;
   if(this._at>1500){this._at=0;const set=()=>{this.r.setPixelRatio(this.dpr);this.r.setSize(this.w||1,this.h||1,false);this._ok=0};
    if(this.fa>23&&this.dpr>.76){this.dpr=Math.max(.75,this.dpr-.25);set()}else if(this.fa>30&&this.dpr<=.76)this.lowAuto=true;
    else if(this.fa<14.5){this._ok=(this._ok||0)+1;if(this._ok>4&&this.dpr<this.dprMax){this.dpr=Math.min(this.dprMax,this.dpr+.25);set()}}else this._ok=0}}}
  this.low=!S.opt.fx||!!this.lowAuto;this.sk=!!S.opt.shake;const t=(this.t+=dt),st=G.st,por=this.cam.aspect<1;if(this.mode==='aqua'){this.frameAqua(dt,t);return}if(this.mode==='room'){this.rooms.frame(dt,t);this.updSmoke(dt);this.r.render(this.s,this.cam);return}
  {this.om+=(this.omT-this.om)*Math.min(1,dt*(this.omT>this.om?1.5:1.6));if(Math.abs(this.omT-this.om)<.004)this.om=this.omT;if(Math.abs(this.om-this._omA)>.03||(this.om===this.omT&&this._omA!==this.om)){this._omA=this.om;this.applyEnv()}}
  if((this.wf=(this.wf||0)+1)%2===0||!this.wdone){this.wdone=1;const a=this.wp.array,b=this.wb;for(let i=0;i<a.length;i+=3){const x=b[i],z=b[i+2];a[i+1]=(Math.sin(x*.45+t*1.3)*.07+Math.cos(z*.38+t*1.0)*.07+Math.sin((x+z)*.2+t*.6)*.05)*(this.wamp||1);const cc=Math.min(1,.82+a[i+1]*1.7+Math.max(0,Math.sin(x*.9-t*1.7+z*.6))*.06),ci=(i/3)*3,ca=this.wc.array;ca[ci]=ca[ci+1]=cc;ca[ci+2]=Math.min(1,cc+.04)}this.wp.needsUpdate=true;this.wc.needsUpdate=true}
  this.rm.color.set({Starter:'#8a6a44',Common:'#5f9a4a',Rare:'#243a5c',Epic:'#2a6fa8',Legendary:'#14181f'}[rod.tier]||'#8a6a44');this.rm.emissive.set(rod.tier==='Legendary'?'#2bb5c9':'#000000');this.rm.emissiveIntensity=.6;
  let ta=-1;if(st==='charge')ta=.1+G.pw/100*.5;else if(st==='cast')ta=-1.35+Math.min(1,G.t/.7)*.35;else if(st==='fight')ta=-.95+G.pump*.45;
  this.rav=(this.rav||0)+((ta-this.ra)*150-(this.rav||0)*15)*dt;this.ra+=this.rav*dt;this.rod.rotation.x=this.ra;
  const tb=st==='fight'?G.ten*.0055:st==='bite'?.1:.03;this.bd+=(tb-this.bd)*Math.min(1,10*dt);this.segs.forEach((m,i)=>m.rotation.x=-this.bd*(.6+i*.3));
  H.set(this.pl.position.x,1.4,this.pl.position.z+.55);this.beam.position.set(H.x,H.y+6,H.z);this.animChar(dt,G,st,t);this.moveStep(dt,G,t,st);this.pl.updateMatrixWorld(true);this.tipO.getWorldPosition(this.tp);
  const tp=this.tp,bz=this.zAt(G.cd||6),bp=this.bp;
  if(st==='cast'){const k=Math.min(1,G.t/.7);bp.set(tp.x+(this.pl.position.x-tp.x)*k,tp.y*(1-k)+.1*k+Math.sin(k*Math.PI)*3.2,tp.z+(bz-tp.z)*k)}
  else if(st==='wait'||st==='bite')bp.set(this.pl.position.x+Math.sin(t*.7)*.05,.02+Math.sin(t*2.2)*.02-(st==='bite'?.14+Math.sin(t*30)*.03:0),bz);
  else bp.set(tp.x,tp.y-1,tp.z);
  const inF=st==='fight'||st==='catch'||st==='result'||st==='flex',holdMode=st==='catch'||st==='result'||st==='flex';this.bob.visible=!inF;this.bob.position.copy(bp);
  if(G.f&&(!this.fm||this.fk!==G.f.id+G.f.sc))this.mkFish(G.f);
  if(!G.f&&this.fm){this.s.remove(this.fm);disposeFish(this.fm);this.fm=null;this.fk=null}
  let end=bp;
  if(this.fm){const fm=this.fm,L=this.fL;let px=bp.x,py=-.8-L*.3,pz=bz,sp=.4,yaw=Math.PI/2+Math.sin(t*20)*.3,pitch=0;
   if(st==='fight'){const k=G.dist/100,sur=G.surge>0,pr=sur?1-G.surge/.8:0,sn=Math.sin(pr*Math.PI);
    px=this.pl.position.x+Math.sin(t*1.6)*1.3*k+Math.sin(t*2.9+1)*.35*k+(sur?sn*1.8*(Math.sin(this.fk.length*3+Math.floor(t))>0?1:-1)*k:0);pz=tp.z+(bz-tp.z)*k;
    py=-1-L*.35-(sur&&!G.jumper?sn*.8:0)+(sur&&G.jumper?sn*(1.2+L*.6):0)+Math.sin(t*2.3)*.12;
    if(G.swT>0&&G.swDir){px+=G.swDir==='L'?-1.8:G.swDir==='R'?1.8:0;py+=G.swDir==='U'?1.3:G.swDir==='D'?-1:0}
    sp=(.3+.7*G.sta/100)*(sur?1.5:1)+(G.swT>0?.7:0);yaw=Math.PI/2+Math.sin(t*2)*.5+(sur?Math.sin(t*14)*.4:0);
    const fp=this.fp||(this.fp=V(px,py,pz));if(this.fpK!==this.fk){fp.set(px,py,pz);this.fpK=this.fk;this.fyw=yaw}
    const kk=1-Math.exp(-dt*(sur?12:7.5));fp.x+=(px-fp.x)*kk;fp.y+=(py-fp.y)*kk;fp.z+=(pz-fp.z)*kk;px=fp.x;py=fp.y;pz=fp.z;
    this.fyw+=this.ang(this.fyw,yaw)*Math.min(1,dt*8);yaw=this.fyw;
    if(this.py0!==undefined)pitch=cl((py-this.py0)/Math.max(dt,.008)*.1,-.7,.7)}
   else if(inF){const p=Math.min(1,G.ct/G.cdur),e=1-Math.pow(1-p,3),c0=this.cs,ix=this.ix,F=this.F=this.F||V(0,0,0);F.set(this.pl.position.x,1.15+Math.min(.5,L*.1),this.pl.position.z+.55);
    px=c0.x+(F.x-c0.x)*e;pz=c0.z+(F.z-c0.z)*e;py=c0.y+(F.y-c0.y)*e+Math.sin(p*Math.PI)*(1.8+L*.3)+(p>=1?Math.sin(t*2)*.04:0);
    yaw=e*6.283*(ix>=3||this.mu?2:1)+(p>=1?Math.sin(t*1.2)*.12+(this.fyaw||0):0);pitch=(1-e)*.5+(p>=1?Math.sin(t*1.6)*.05:0);sp=.9;
    const hi=!!this.hiF,col=this.mu?this.mu.c:RC[RN[ix]];
    if(hi&&st==='catch'){const hh=2.6+L*.62,e1=sst(.2,.95,p),arc=Math.sin(Math.min(1,p/.64)*Math.PI);px=c0.x+(F.x-c0.x)*e1;pz=c0.z+(F.z-c0.z)*e1;py=c0.y+(F.y-c0.y)*sst(.05,.96,p)+arc*hh;yaw=sst(.04,.9,p)*6.283*3;pitch=Math.sin(p*Math.PI*3)*.5*(1-sst(.55,1,p))+(1-e1)*.45;sp=1.9*(1-sst(.5,1,p))+.7;
     this.trT=(this.trT||0)-dt;if(p>.02&&p<.86&&this.trT<=0){this.trT=.04;this.smoke(V(px,py,pz),col,1,1.2);this.burstAt(V(px,py,pz),col,2,.6,.6)}
     if(py>0&&!this.brd){this.brd=true;this.breach(px,pz,col)}}
    fm.scale.setScalar(L);if(p>=(hi?.64:.5)&&!this.hf){this.hf=true;this.holdFx()}
    if(p>=1&&this.hf){const hi=ix>=4||this.mu,col=this.mu?this.mu.c:RC[Object.keys(RC)[ix]];this.smk=(this.smk||0)-dt;if(this.smk<=0){this.smk=hi?.13:.28;if(ix>=2||this.mu)this.smoke(V(px+(Math.random()-.5)*L*.6,py-.05,pz+.1),col,1,hi?1:.7)}if(ix>=5&&Math.sin(t*2.2)>.985)this.ringAt(V(px,py-.5,pz),col,3,1)}}
   if(this.py0!==undefined&&(this.py0<0)!==(py<0))this.burstAt(V(px,.1,pz),'#dfeaf2',16,4.5,1);
   this.py0=py;fm.position.set(px,py,pz);(this.hp=this.hp||V(0,0,0)).set(px,py,pz);fm.rotation.y=yaw;fm.rotation.z=pitch;animateFish(fm,t,sp);if(inF&&this.hf&&fm.userData.mats)fm.userData.mats.forEach(m=>{m.emissiveIntensity=m.userData.e0*(1+.5*Math.sin(t*4))});
   if(inF){const q=fm.scale.x*.5;end=this.mo||(this.mo=V(0,0,0));end.set(px+Math.cos(yaw)*q,py,pz-Math.sin(yaw)*q)}}
  const la=this.lg.attributes.position,N=la.count,len=tp.distanceTo(end),taut=st==='fight'?Math.min(1,G.ten/100):0,sag=(1-taut)*(.15+len*.035),hot=st==='fight'&&G.ten>85,aw=V(0,0,0),anc=[this.sAn,this.rAn,...this.lan,this.tipO];
  this.lm.color.set(hot?'#ff6b5f':'#ffffff');
  anc.forEach((o,i)=>{o.getWorldPosition(aw);la.setXYZ(i,aw.x,aw.y,aw.z)});
  const K=anc.length;for(let i=K;i<N;i++){const u=(i-K+1)/(N-K),j=hot?Math.sin(t*80+i)*.03:0;la.setXYZ(i,tp.x+(end.x-tp.x)*u+j,tp.y+(end.y-tp.y)*u-Math.sin(u*Math.PI)*sag,tp.z+(end.z-tp.z)*u)}la.needsUpdate=true;this.line.visible=!holdMode;
  if(st==='idle'||st==='charge'){this.beam.visible=this.vortex.visible=false}
  this.vortex.children.forEach((m,i)=>m.rotation.y=t*(i+1)*1.5);this.vortex.rotation.y=t;
  const base=por?V(.9,2.2,4.3):V(.75,1.8,3.3),look=V(.1,1,-5);this.camK=0;this.fovC=0;this.rollC=0;
  if(st==='charge')look.z=-5-G.pw*.05;
  if(st==='fight'&&this.fm){look.set(this.fm.position.x*.4,.2,(this.pl.position.z+this.fm.position.z)/2-2);base.z+=Math.min(2.6,this.fL*.45);base.y+=Math.min(1.1,this.fL*.14);base.x+=Math.sin(t*.45)*.22}
  {const ox=this.pl.position.x,oz=this.pl.position.z-PZ;base.x+=ox*.85;base.z+=oz;if(st!=='fight'){look.x+=ox*.9;look.z+=oz}}
  if(this.rd){this.bob.visible=false;this.line.visible=false;this.rideCam(base,look,dt)}
  if(holdMode&&this.fm){const L=this.fL,tf=Math.tan((por?74:52)*Math.PI/360),d=Math.max(3.4,L*1.35*1.15/(2*tf*this.cam.aspect),Math.max(2.4,L*.6+1.7)/(2*tf)),p=st==='catch'?Math.min(1,G.ct/G.cdur):1,hi=!!this.hiF,th=hi?[.22,.45,.7]:[.4],si=p>=1?th.length:th.filter(x=>p>x).length,hp=this.hp||V(0,1,PZ);
   if(hi&&st==='catch'&&p<1){const F=this.F||V(0,1.2,PZ),c0=this.cs,cs=p<.14?0:p<.36?1:p<.64?2:3,pl=this.pl.position;
    if(cs===0){base.set(c0.x+2.2+L*.4,.5,c0.z+3.2+L*.5);look.set(hp.x,Math.max(.6,hp.y*.6),hp.z);this.fovC=36;this.rollC=-.05;this.camK=12}
    else if(cs===1){const q=(p-.14)/.22,a=-.8+q*2.6,r=3.4+L*1;base.set(hp.x+Math.sin(a)*r,hp.y+.4+q*.7,hp.z+Math.cos(a)*r);look.set(hp.x,hp.y,hp.z);this.fovC=46;this.rollC=Math.sin(q*Math.PI)*.12;this.camK=9}
    else if(cs===2){const dx=c0.x-F.x,dz=c0.z-F.z,dl=Math.hypot(dx,dz)||1;base.set(hp.x+dx/dl*(2.6+L*.5)+1.1,hp.y+1+L*.15,hp.z+dz/dl*(2.6+L*.5)+.4);look.set(F.x,F.y,F.z);this.fovC=60;this.rollC=-.06;this.camK=7}
    else{const u=sst(.64,1,p);base.set(pl.x-(1-u)*(1.8+L*.35),1.35+u*.15+L*.08*(1-u),pl.z+.55+d*(.6+.4*u));look.set(hp.x*(1-u)+pl.x*u,hp.y*(1-u)+1.25*u,hp.z*(1-u)+pl.z*u);this.fovC=56-4*u;this.rollC=(1-u)*.05;this.camK=5}
    if(cs!==this.shot&&cs<3){this.shot=cs;this.cc.copy(base);this.cl.copy(look)}else if(cs===3)this.shot=3}
   else if(si<th.length){const k=hi?si:0;base.set(...[[hp.x+2.6,Math.max(1.5,hp.y+.5),hp.z+2.6],[hp.x-2.8,Math.max(1.7,hp.y+.8),hp.z+2],[hp.x+1,Math.max(2.2,hp.y+1.5),hp.z+3.4]][k]);look.set(hp.x,hp.y+.1,hp.z);if(si!==this.shot){this.shot=si;this.cc.copy(base);this.cl.copy(look)}}
   else{base.set(this.pl.position.x,1.5+Math.min(.7,L*.12),this.pl.position.z+.55+d);look.set(this.pl.position.x,1.25,this.pl.position.z);this.shot=si}}
  const ck=this.rd?5.5:(this.camK||4);this.cc.lerp(base,Math.min(1,ck*dt));this.cl.lerp(look,Math.min(1,(this.rd?6:ck)*dt));this.cam.position.copy(this.cc);
  if(this.wx==='storm'||(this.om||0)>.3){const kk=this.wx==='storm'?1:this.om*1.2;this.cam.position.x+=Math.sin(t*1.3)*.04*kk;this.cam.position.y+=Math.sin(t*1.9)*.03*kk}
  if(!this.rd){const f0=por?74:52,tg=this.fovC?this.fovC*(por?1.42:1):f0+(st==='fight'?(G.surge>0?6:G.swT>0?-5:0):0);this.cf=this.cf||f0;this.cf+=(tg-this.cf)*Math.min(1,dt*(this.fovC?8:5));if(Math.abs(this.cam.fov-this.cf)>.04){this.cam.fov=this.cf;this.cam.updateProjectionMatrix()}}
  if(this.shake>0){this.shake-=dt;this.cam.position.x+=(Math.random()-.5)*.14*(this.shake/.5);this.cam.position.y+=(Math.random()-.5)*.14*(this.shake/.5)}
  this.cam.lookAt(this.cl);this.rv=(this.rv||0)+((this.rollC||0)-(this.rv||0))*Math.min(1,dt*6);if(Math.abs(this.rv)>.001)this.cam.rotateZ(this.rv);this.uwEnv(dt);
  for(const m of this.pt)if(m.visible){const d=m.userData;d.l-=dt;d.v.y-=9*dt;m.position.addScaledVector(d.v,dt);if(d.l<=0||m.position.y<-.3)m.visible=false}
  for(const m of this.rg)if(m.visible){const d=m.userData;d.l-=dt*d.sp*.5;m.scale.setScalar(.1+(1-d.l)*d.mx);m.material.opacity=Math.max(0,d.l);if(d.l<=0)m.visible=false}
  for(const o of this.amb||[]){const an=o.ph+t*o.sp*o.d;o.m.position.set(o.cx+Math.cos(an)*o.r,o.y,o.cz+Math.sin(an)*o.r*.6);o.m.rotation.y=Math.atan2(-Math.cos(an)*.6*o.d,-Math.sin(an)*o.d);animateFish(o.m,t+o.ph,.4);
   if(o.j>0){o.j-=dt;const p=1-o.j/1.2,y0=o.m.position.y;o.m.position.y=o.y+Math.sin(p*Math.PI)*(1.5-o.y);o.m.rotation.z=Math.cos(p*Math.PI)*.8;const up=o.m.position.y>0;if(up!==!!o.up){o.up=up;this.burstAt(V(o.m.position.x,.1,o.m.position.z),'#dfeaf2',12,4,1);this.ringAt(V(o.m.position.x,.05,o.m.position.z),'#ffffff',2.4,1.5)}}else{o.m.rotation.z=0;if(!this.rd&&Math.random()<dt*.05)o.j=1.2}}
  for(const g of this.cl3||[]){g.position.x+=dt*.6;if(g.position.x>70)g.position.x=-70}
  if(this.plk)this.plk.rotation.y=t*.03;
  this.flash=Math.max(0,(this.flash||0)-dt*5);if(this.base){this.hemi.intensity=(this.base.hi+this.flash*1.2)*(1-(this._dk||0)*.45);this.sun.intensity=(this.base.si+this.flash*3)*(1-(this._dk||0)*.6);this.sun.color.set(this.flash>.05&&this.flashCol?this.flashCol:this.base.sc)}
  this.heat=Math.max(0,(this.heat||0)-dt*.2);this.water.material.emissive.set(this.heatCol||'#ff7a2a');this.water.material.emissiveIntensity=this.heat*.4;
  const wx=this.wx||'clear';
  if(this.rain.visible){const p=this.rain.geometry.attributes.position.array,sm=wx==='storm'||(this.om||0)>.5,wd=sm?.35:.12;this.rrT-=dt;if(this.rrT<=0){this.rrT=.07;this.ringAt(V((Math.random()-.5)*18,.03,3-Math.random()*22),'#dfeaf2',.5,3)}
   this.rdp.forEach((d,i)=>{d.y-=d.s*dt*(sm?1.4:1);d.x+=wd*d.s*dt;if(d.y<0){d.y=14;d.x=(Math.random()-.5)*26-3;d.z=3-Math.random()*36}const o=i*6;p[o]=d.x;p[o+1]=d.y;p[o+2]=d.z;p[o+3]=d.x-wd*.6;p[o+4]=d.y+.8;p[o+5]=d.z});this.rain.geometry.attributes.position.needsUpdate=true}
  {const omk=this.om||0;if(wx==='storm'||omk>.5){this.lt-=dt;if(this.lt<=0){const om=omk>.5;this.lt=om?1.2+Math.random()*2.6:3+Math.random()*6;this.zap(om?(this.omenCol||'#ff5a7a'):'#eef4ff');if(om&&Math.random()<.45)setTimeout(()=>this.zap(this.omenCol||'#ff5a7a'),140+Math.random()*120)}}}
  for(const b of this.bolts)if(b.visible){const u=b.userData;u.l-=dt;const f=Math.max(0,u.l/.34),fl=f>.55?1:(Math.sin(u.l*120)>0?.9:.35)*f/.55;u.ls.forEach(l=>l.material.opacity=fl);u.gt.material.opacity=fl*.5;u.gb.material.opacity=fl*.8;if(u.l<=0)b.visible=false}
  
  if(wx==='meteor'||((this.om||0)>.5&&this.omenMeteor)){this.mtT-=dt;if(this.mtT<=0){this.mtT=.9+Math.random()*1.4;const m0=this.mt.find(x=>!x.visible);if(m0){const d=m0.userData,tf=this.fm&&G.f?this.fm.position:null,col=this.mcol||'#ff7a2a';
    d.b.set(tf?tf.x+(Math.random()-.5)*2.5:(Math.random()-.5)*26,0,tf?tf.z+(Math.random()-.5)*2.5:-6-Math.random()*22);d.a.set(d.b.x+(Math.random()-.5)*30,52,d.b.z-30-Math.random()*15);d.l=0;d.d=1.5+Math.random()*.7;d.col=col;
    d.core.material.emissive.set(col);d.f1.material.color.set(col);d.tl.material.color.set(col);m0.visible=true}}}
  for(const m1 of this.mt)if(m1.visible){const d=m1.userData;d.l+=dt/d.d;m1.position.lerpVectors(d.a,d.b,Math.min(1,d.l));m1.quaternion.setFromUnitVectors(V(0,1,0),V(0,0,0).subVectors(d.a,d.b).normalize());
   const fl=1+Math.sin(t*40+d.d*9)*.18;d.f1.scale.set(fl,1+Math.sin(t*33)*.2,fl);d.f2.scale.set(fl,1+Math.sin(t*47)*.25,fl);
   if(Math.random()<.5)this.burstAt(m1.position,d.col||'#ff7a2a',1,.6,.25);if(Math.random()<.3)this.smoke(m1.position,'#6b5a52',1,1.1);
   if(d.l>=1){m1.visible=false;const c=d.col||'#ff7a2a';this.burstAt(d.b,c,30,7,2.4);this.burstAt(d.b,'#ffd27a',14,8,1.1);this.ringAt(V(d.b.x,.05,d.b.z),c,8,.9);this.ringAt(V(d.b.x,.05,d.b.z),'#ffffff',4,1.4);this.smoke(V(d.b.x,.1,d.b.z),'#dfeaf2',4,1.4);this.heat=1;this.heatCol=c;this.flash=.5;this.flashCol=c;this.onMeteor&&this.onMeteor()}}
  if((this.heat||0)>.1&&Math.random()<dt*6){const tf=this.fm&&G.f?this.fm.position:V(0,0,-10);this.smoke(V(tf.x+(Math.random()-.5)*5,.05,tf.z+(Math.random()-.5)*5),'#dfeaf2',1,1.2)}
  if(this.ff.visible){const a2=this.ff.geometry.attributes.position.array;for(let i=0;i<a2.length;i+=3){a2[i]=this.ffb[i]+Math.cos(t*.6+i)*.5;a2[i+1]=this.ffb[i+1]+Math.sin(t*.8+i)*.4}this.ff.geometry.attributes.position.needsUpdate=true}
  const mu=this.fm&&this.fm.userData.mut,show=!!mu&&(st==='catch'||st==='result');this.orb.visible=show;
  if(show){const p=this.fm.position;this.orb.children.forEach((o,k)=>{const an=t*2+k*.785;o.position.set(p.x+Math.cos(an)*(.7+Math.sin(t*3+k)*.12),p.y+Math.sin(t*2+k)*.3,p.z+Math.sin(an)*.7)})}
  if(this.sbG){const sv=!!this.rd&&this.rd.dep>1.2;this.sbG.visible=sv;if(this.bedM)this.bedM.visible=sv}
   {const bt=(st==='bite'||(st==='fight'&&G.ft<1.6))&&G.f&&!this.rd?G.f.rarity:null;if(bt!==this.mkK){this.mkK=bt;if(bt){this.mkT=0;this.mkLast=bt;this.mark.material.map=this.markTex(bt);this.mark.material.needsUpdate=true;this.mkGlow.material.color.set(TIERC[bt])}}
   const on=!!this.mkK;this.mkA+=((on?1:0)-this.mkA)*Math.min(1,dt*(on?18:9));const vis=this.mkA>.02;this.mark.visible=this.mkGlow.visible=vis;
   if(vis){const ix=Math.max(0,RN.indexOf(this.mkLast));this.mkT+=dt;const q=Math.min(1,this.mkT/.5),el=1-Math.exp(-7*q)*Math.cos(q*13),w=(1.05+ix*.07)*Math.max(.01,el)*(.9+.1*this.mkA),px=this.pl.position.x+(Math.random()-.5)*.025*ix,py=this.pl.position.y+2.4+Math.sin(t*9)*.05+(1-Math.min(1,el))*-.5,pz=this.pl.position.z;
    this.mark.position.set(px,py,pz);this.mark.scale.set(w,w,1);this.mark.material.opacity=Math.min(1,this.mkA*1.3);this.mark.material.rotation=Math.sin(t*10)*(.06+ix*.012);
    this.mkGlow.position.set(px,py,pz-.05);const gs=w*(2.1+.35*Math.sin(t*8)+ix*.12);this.mkGlow.scale.set(gs,gs,1);this.mkGlow.material.opacity=this.mkA*(.45+.15*Math.sin(t*8))*(ix>=3?1.3:1);
    if(ix>=3&&on&&Math.random()<dt*(6+ix*3))this.burstAt(V(px,py,pz),TIERC[this.mkLast],1,1.4,.5)}}
  this.updArms(holdMode,dt);this.rodAura(dt,G,rod,holdMode);this.updSmoke(dt);this.updBub(dt);
  {const k=this.om||0;this.ocl.visible=this.mist.visible=k>.01;
   if(k>.01){const fl=this.flash||0,cB=this._ocB||(this._ocB=C('#1a1420')),cF=this._ocF||(this._ocF=C('#ffffff'));cF.set(this.flashCol||'#ffffff');
    for(const m of this.ocs){const u=m.userData;m.position.x+=dt*u.s;if(m.position.x>85)m.position.x=-85;m.material.opacity=k*.82*u.o;m.material.color.copy(cB).lerp(cF,Math.min(1,fl*.55))}
    for(const m of this.mss){const u=m.userData;m.position.x=u.x0+Math.sin(t*u.s*.4+u.ph)*3;m.material.opacity=k*.2*u.o;m.material.color.copy(cB).lerp(cF,Math.min(1,fl*.5))}
    this.oLight.material.color.set(this.omenCol||'#ff4060');const tf=this.fm&&G.f?this.fm.position:null;this.oLight.visible=!!tf;if(tf){this.oLight.position.set(tf.x,tf.y+.3,tf.z);const gs=(4+(this.fL||1)*1.6)*(1+.12*Math.sin(t*3.1));this.oLight.scale.set(gs,gs,1);this.oLight.material.opacity=k*.55*(.8+.2*Math.sin(t*3.1))}}else this.oLight.visible=false}
  this.r.render(this.s,this.cam)}
}

export const rideSpeed=f=>cl(4.2+RN.indexOf(f.rarity)*.6+(f.mut?1.6:0)-Math.min(1.4,Math.log10(1+f.weight)*.7),3,9.5);
export function setLocData(a){SKY.length=0;WAT.length=0;NAMES.length=0;a.forEach(l=>{SKY.push([l.sky,l.bank]);WAT.push(l.wat);NAMES.push(l.name)})}
