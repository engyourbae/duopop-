import * as THREE from 'three';
import {makeFish,animateFish,disposeFish,RC,RN} from './fish3d.js';
const BX=600,TC={Starter:'#8a6a44',Common:'#5f9a4a',Rare:'#243a5c',Epic:'#2a6fa8',Legendary:'#14181f'};
const mm=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.7,flatShading:true,...o});
const bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d),cy=(a,b,h,s=10)=>new THREE.CylinderGeometry(a,b,h,s);
const ad=(p,g,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
export class Rooms{
 constructor(w){this.w=w;this.cur=null;this.type=null;this.any={};this.root=new THREE.Group();this.root.position.set(BX,0,0);w.s.add(this.root);
  ad(this.root,bx(40,.3,24),mm('#2b3446'),0,-.15,0);ad(this.root,bx(40,14,.3),mm('#1d2740'),0,7,-7);
  [['#d1493f',-8],['#e9b52f',-4],['#3f9e6e',0],['#2f6fb0',4],['#7b4fb8',8]].forEach(([c,x])=>ad(this.root,bx(3.6,.5,.3),mm(c),x,6,-6.8));
  const l1=new THREE.PointLight('#fff3d6',1.6,34);l1.position.set(0,7,6);const l2=new THREE.PointLight('#7fb6ff',.9,26);l2.position.set(-7,3,3);this.root.add(l1,l2)}
 show(type,d){if(this.cur){this.root.remove(this.cur);disposeFish(this.cur)}const G=this.cur=new THREE.Group();this.root.add(G);this.type=type;this.d=d||{};this.any={};this['b_'+type](G,this.d)}
 frame(dt,t){const w=this.w,c=this.cfg;if(!c)return;if(this['a_'+this.type])this['a_'+this.type](t,dt);const p=w.cam.aspect<1?c.pp:c.p;
  w.cam.position.set(BX+p[0]+Math.sin(t*.3)*.3,p[1]+Math.sin(t*.4)*.06,p[2]);w.cam.lookAt(BX+c.l[0],c.l[1],c.l[2])}
 b_shop(G,d){const gr=d.gear||{},cat=this.any.cat={};this.tab=d.tab;this.cfg={p:[0,2.8,7.2],pp:[0,3.2,10.5],l:[0,2,0]};
  const grp=(n,x,y,z)=>{const o=new THREE.Group();o.position.set(x,y,z);o.userData.y0=y;G.add(o);cat[n]=o;return o};
  ad(G,bx(8.6,1.1,2.2),mm('#8a5a2a'),0,.55,0);ad(G,bx(9,.14,2.5),mm('#a4723a'),0,1.17,0);
  [2.3,3.6].forEach(y=>ad(G,bx(9.4,.12,.7),mm('#7a5a3a'),0,y,-2.4));[-4.6,4.6].forEach(x=>ad(G,bx(.15,4,.5),mm('#5a3d24'),x,2,-2.4));
  [['#d1493f',-3.6],['#e9b52f',-2.8],['#2f6fb0',-2]].forEach(([c,x])=>ad(G,bx(.7,.4,.5),mm(c),x,3.86,-2.4));
  const R=grp('rods',0,2.9,-2.95);(gr.rods||[]).forEach((r,i)=>{const o=new THREE.Group();o.position.set(-3.4+i*1.7,0,0);o.rotation.z=.07;R.add(o);
   ad(o,cy(.06,.06,.9),mm('#d9b98a'),0,-1.5,0);const em=r.tier==='Legendary'?{emissive:'#2bb5c9',emissiveIntensity:.5}:{};
   [0,1,2].forEach(k=>ad(o,cy(.03-k*.007,.045-k*.008,1),mm(TC[r.tier]||'#8a6a44',em),0,-.5+k,0));ad(o,cy(.12,.12,.12),mm('#9aa5b1',{metalness:.6}),.12,-.8,0)});
  const RE=grp('reels',-1.8,1.3,.3);(gr.reels||[]).forEach((r,i)=>{const o=new THREE.Group();o.position.set(i*1.05,0,0);RE.add(o);ad(o,new THREE.SphereGeometry(.28,10,8),mm('#9aa5b1',{metalness:.6}),0,.1,0);ad(o,cy(.34,.34,.12,14),mm(['#e9a23b','#d1493f','#2f6fb0','#3f9e6e'][i%4]),0,.38,0);ad(o,cy(.05,.05,.5,6),mm('#2f3a46'),.3,.1,0).rotation.z=Math.PI/2});
  const LN=grp('lines',-2.6,2.55,-2.4);(gr.lines||[]).forEach((r,i)=>{const o=ad(LN,cy(.3,.3,.35,14),mm(['#eef2f7','#9ad7e6','#e9b52f','#d1493f'][i%4]),i*1.05,0,0);ad(o,cy(.1,.1,.4,8),mm('#2f3a46'))});
  const HK=grp('hooks',2.2,3.95,-2.4);(gr.hooks||[]).forEach((r,i)=>ad(HK,new THREE.TorusGeometry(.2+i*.05,.035,6,12,Math.PI*1.5),mm('#c0c8d0',{metalness:.7}),i*.8-.8,0,0));
  const BA=grp('baits',1.4,2.6,-2.4);(gr.baits||[]).forEach((r,i)=>{ad(BA,cy(.22,.22,.6,10),mm('#bfe8f2',{transparent:true,opacity:.4,depthWrite:false}),i*.7,0,0);ad(BA,cy(.17,.17,.35,10),mm(['#c2582f','#e9a23b','#d1493f','#7b4fb8','#2bb5c9'][i%5]),i*.7,-.1,0)});
  const AU=grp('auto',3.3,1.25,.2);ad(AU,bx(.9,1,.7),mm('#e9b52f'),0,.5,0);ad(AU,bx(.6,.5,.5),mm('#d1493f'),0,1.25,0);[-.14,.14].forEach(x=>ad(AU,new THREE.SphereGeometry(.07,8,6),mm('#101a2b'),x,1.3,.26));
  ad(AU,cy(.03,.03,.4,5),mm('#9aa5b1'),0,1.7,0);ad(AU,new THREE.SphereGeometry(.08,8,6),mm('#2bb5c9',{emissive:'#2bb5c9',emissiveIntensity:1}),0,1.95,0);
  const arm=this.any.arm=new THREE.Group();arm.position.set(.55,.8,0);AU.add(arm);ad(arm,cy(.07,.07,.7,6),mm('#9aa5b1'),0,.35,0);ad(arm,cy(.015,.03,1.6,5),mm('#8a6a44'),.2,.9,0).rotation.z=-.7;
  const TU=grp('topup',-3.5,1.25,.3);ad(TU,bx(1.1,.6,.8),mm('#7a4a1a'),0,.3,0);ad(TU,bx(1.14,.22,.84),mm('#a4723a'),0,.7,0);
  this.any.gems=['#2bb5c9','#7b4fb8','#c2308a','#2bb5c9'].map((c,i)=>ad(TU,new THREE.OctahedronGeometry(.2,0),mm(c,{emissive:c,emissiveIntensity:.8}),-.4+i*.27,1.5,0))}
 a_shop(t){const cat=this.any.cat;for(const k in cat){const o=cat[k],f=k===this.tab;o.position.y=o.userData.y0+(f?.18+Math.sin(t*3)*.08:0);o.rotation.y=f?Math.sin(t*1.2)*.5:o.rotation.y*.9}
  this.any.arm.rotation.z=Math.sin(t*2.2)*.35;this.any.gems.forEach((g,i)=>{g.position.y=1.5+Math.sin(t*2+i)*.12;g.rotation.y=t+i})}
 b_bag(G,d){this.cfg={p:[0,3.6,6.6],pp:[0,4.4,9.6],l:[0,.9,0]};const w=mm('#a4723a');ad(G,bx(4.6,.2,2.8),w,0,.1,0);[-1.4,1.4].forEach(z=>ad(G,bx(4.6,.9,.16),w,0,.55,z));[-2.3,2.3].forEach(x=>ad(G,bx(.16,.9,2.8),w,x,.55,0));
  for(let i=0;i<16;i++)ad(G,bx(.4,.3,.4),mm('#dff2f7',{transparent:true,opacity:.85}),-1.9+(i%8)*.55,.35+(i%3)*.08,(i<8?-.7:.7)+(i%2)*.2).rotation.y=i;
  const fl=this.any.fl=[];(d.list||[]).slice(0,8).forEach((f,i)=>{const m=makeFish(f,false,f.mut),L=Math.max(.5,Math.min(1.2,.3+Math.cbrt(f.weight)*.28));m.scale.setScalar(L);m.position.set(-1.6+(i%4)*1.1,.85,i<4?-.55:.6);m.rotation.y=i%2?.3:-.3;m.rotation.z=.15;G.add(m);fl.push(m)});
  const sc=new THREE.Group();sc.position.set(3.6,0,.4);G.add(sc);ad(sc,bx(1.3,.25,.9),mm('#9aa5b1',{metalness:.5}),0,.12,0);ad(sc,cy(.12,.12,1.2,8),mm('#9aa5b1'),0,.8,0);ad(sc,cy(.5,.5,.12,18),mm('#eef2f7'),0,1.5,0).rotation.x=Math.PI/2;this.any.nd=ad(sc,bx(.05,.4,.03),mm('#d1493f'),0,1.6,.1)}
 a_bag(t){this.any.fl.forEach((m,i)=>animateFish(m,t+i,.25));this.any.nd.rotation.z=Math.sin(t*1.5)*.6}
 b_dex(G,d){this.cfg={p:[0,3.4,6.2],pp:[0,3.8,9],l:[0,2,0]};ad(G,cy(1.3,1.5,.9,18),mm('#d8d2c0'),0,.45,0);ad(G,bx(.6,6,.6),mm('#7a1f2b'),-5,3,-5);ad(G,bx(.6,6,.6),mm('#7a1f2b'),5,3,-5);
  this.any.rg=ad(G,new THREE.TorusGeometry(1.35,.06,6,36).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:'#555b66'}),0,.95,0);this.dexFish(d.fish,d.dark)}
 dexFish(f,dark){const G=this.cur;if(!G||this.type!=='dex'||!f)return;if(this.any.fm){G.remove(this.any.fm);disposeFish(this.any.fm)}const m=makeFish(f,dark,null);m.scale.setScalar(2.2);G.add(m);this.any.fm=m;this.any.glow=!dark&&RN.indexOf(f.rarity)>=3;this.any.rg.material.color.set(dark?'#555b66':RC[f.rarity])}
 a_dex(t){const m=this.any.fm;if(!m)return;m.rotation.y=t*.7;m.position.y=2.3+Math.sin(t*1.6)*.1;animateFish(m,t,.5);if(this.any.glow&&m.userData.mats)m.userData.mats.forEach(x=>{x.emissiveIntensity=x.userData.e0*(1+.5*Math.sin(t*4))})}
 b_locs(G,d){this.cfg={p:[0,4.6,6.4],pp:[0,5.8,9.8],l:[0,.6,0]};const L=d.locs||[];ad(G,bx(11,.5,4.6),mm('#6b4a2a'),0,.25,0);ad(G,bx(10.6,.06,4.3),mm('#d9c8a0'),0,.53,0);
  const isl=this.any.isl=[];L.forEach((l,i)=>{const lock=!d.unl&&d.lv<l.lv,g=new THREE.Group();g.position.set(-4+i*2,.56,0);G.add(g);isl.push(g);
   ad(g,cy(.9,1,.3,16),mm(lock?'#555b66':l.bank),0,.15,0);ad(g,cy(.78,.78,.08,16),mm(lock?'#444a55':l.wat),0,.32,0);
   for(let k=0;k<4;k++){const x=-.45+k*.3,z=k%2?.25:-.2;
    if(i===4)ad(g,new THREE.OctahedronGeometry(.18,0),mm(lock?'#555b66':'#2bb5c9',{emissive:lock?'#000000':'#2bb5c9',emissiveIntensity:.8}),x,.6+k%2*.15,z).scale.y=2.2;
    else if(i===3)ad(g,new THREE.ConeGeometry(.12,.5,5),mm(lock?'#666c78':['#e46a6a','#e9a23b','#c2308a','#2bb5c9'][k]),x,.55,z);
    else{ad(g,cy(.04,.05,.3,5),mm('#5a3d24'),x,.45,z);ad(g,new THREE.ConeGeometry(.2,.5,6),mm(lock?'#666c78':'#3f7d3a'),x,.8,z)}}
   if(i===d.sel){ad(g,cy(.02,.02,1.2,5),mm('#eef2f7'),.6,.9,0);ad(g,bx(.5,.3,.04),mm('#d1493f'),.85,1.35,0)}})}
 a_locs(t){(this.any.isl||[]).forEach((g,i)=>{const s=i===this.d.sel;g.position.y=.56+(s?.2+Math.sin(t*3)*.05:0);g.rotation.y=s?t*.6:g.rotation.y*.92;g.scale.setScalar(s?1.2:1)})}
 b_opts(G,d){this.cfg={p:[0,3.4,6.6],pp:[0,4.2,9.6],l:[0,1.3,0]};const o=d.opt||{};ad(G,bx(8,1,2.6),mm('#2f3a46'),0,.5,0);ad(G,bx(8,.12,2.6),mm('#3b4a5c'),0,1.06,0);
  const ks=this.any.knobs=[];['sound','music','fx'].forEach((k,i)=>{const on=o[k]!==false,g=new THREE.Group();g.position.set(-2.4+i*1.6,1.25,.5);G.add(g);ad(g,cy(.45,.5,.3,16),mm('#e9b52f'));ad(g,bx(.08,.06,.4),mm('#101a2b'),0,.18,-.2);
   ad(G,cy(.08,.08,.05,8),mm(on?'#3f9e6e':'#d1493f',{emissive:on?'#3f9e6e':'#d1493f',emissiveIntensity:.8}),-2.4+i*1.6,1.14,-.3);g.userData.on=on;ks.push(g)});
  const sp=this.any.sp=new THREE.Group();sp.position.set(2.6,2.2,-.6);G.add(sp);ad(sp,bx(1.6,2.2,.9),mm('#232b36'));ad(sp,cy(.5,.2,.2,16),mm('#101a2b'),0,.4,.5).rotation.x=Math.PI/2;ad(sp,cy(.3,.12,.16,16),mm('#101a2b'),0,-.5,.5).rotation.x=Math.PI/2;
  const orb=this.any.orb=new THREE.Group();orb.position.set(-2.6,2.5,-.4);G.add(orb);ad(orb,new THREE.SphereGeometry(.7,14,10),mm('#2bb5c9',{transparent:true,opacity:.7,emissive:'#2bb5c9',emissiveIntensity:.4}));this.any.rg=ad(orb,new THREE.TorusGeometry(1,.05,6,28),mm('#e9b52f'));this.any.rg.rotation.x=1.2}
 a_opts(t){this.any.knobs.forEach(g=>{g.rotation.y+=((g.userData.on?1.1:-1.1)-g.rotation.y)*.12});const s=1+Math.abs(Math.sin(t*6))*.03;this.any.sp.scale.set(s,s,s);this.any.rg.rotation.z=t;this.any.orb.position.y=2.5+Math.sin(t*1.5)*.1}
}
