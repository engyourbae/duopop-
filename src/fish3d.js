import * as THREE from 'three';
export const RN=['Common','Uncommon','Rare','Epic','Legendary','Mythic','Secret'];
export const TIERC={Common:'#ffffff',Uncommon:'#5be37d',Rare:'#4aa3ff',Epic:'#b06cff',Legendary:'#ffc02e',Mythic:'#ff3b3b',Secret:'#19f0d0'};
export const RC={Common:'#7d8996',Uncommon:'#3f9e6e',Rare:'#3b73c9',Epic:'#7b4fb8',Legendary:'#c99512',Mythic:'#c2308a',Secret:'#19e6c4'};
const COLS=[['ungu','#6552c9'],['toska','#19e0c0'],['merah','#c0392b'],['oranye','#e07b39'],['emas','#d9a521'],['safir','#2a4fa8'],['biru','#3b73c9'],['hijau','#4a9a6a'],['cokelat','#7a5230'],['abu','#7b8794'],['perak','#b8c2cc'],['putih','#e8e4d8'],['cyan','#2bb5c9'],['kristal','#9ad7e6'],['zaitun','#7a8a3a'],['transparan','#a7c9d9'],['indigo','#3a3f7a'],['navy','#1f3a6e'],['galaksi','#2d2a6e']];
const ACC=['#eef2f7','#1b2433','#e9a23b','#2bb5c9'];
const hash=s=>[...s].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7);
export const colorOf=f=>{const s=f.visual_brief.toLowerCase();return(COLS.find(c=>s.includes(c[0]))||[0,'#6b7b8c'])[1]};

export const MUT={albino:{n:'Albino',col:'#f1ece0',em:'#ffffff',ei:.15,eye:'#d1493f',m:1.6,c:'#c9c2ae'},emas:{n:'Emas',col:'#e0b020',em:'#e0b020',ei:.55,m:2.2,c:'#e0b020'},neon:{n:'Neon',col:'#2fd9b5',em:'#2fd9b5',ei:.9,m:2.8,c:'#1fb894'},bayangan:{n:'Bayangan',col:'#1c1c2a',em:'#7b4fb8',ei:.5,eye:'#ff4fb0',m:3.2,c:'#7b4fb8'},kosmik:{n:'Kosmik',col:'#33258a',em:'#c2308a',ei:.7,m:6,c:'#c2308a',orb:true}};
const prof=t=>t<0?.25+.75*Math.pow(Math.max(0,1+t),.8):1-.3*t*t;
const shp=(pts,rx=false)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();const g=new THREE.ShapeGeometry(s);if(rx)g.rotateX(Math.PI/2);return g};
const bodyGeo=seg=>{const g=new THREE.SphereGeometry(1,seg[0],seg[1]),p=g.attributes.position;for(let i=0;i<p.count;i++){const k=prof(p.getX(i));p.setY(i,p.getY(i)*k);p.setZ(i,p.getZ(i)*k)}return g};
export function makeFish(f,dark=false,mut=null){
 const root=new THREE.Group(),g=new THREE.Group(),sh=hash(f.id),n=f.name.toLowerCase(),br=f.visual_brief.toLowerCase(),rar=RN.indexOf(f.rarity),glow=!dark&&(rar>=3||!!mut),tr=/kaca|kristal/.test(n);
 const col=dark?'#1b2433':mut?mut.col:colorOf(f),acc=dark?'#1b2433':ACC[sh%4],fin=dark?'#1b2433':new THREE.Color(col).multiplyScalar(.82);
 const mt=(c,e=0)=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:.5,metalness:.1,flatShading:true,side:THREE.DoubleSide,transparent:tr&&!dark,opacity:tr&&!dark?.7:1,emissive:mut?mut.em:glow?RC[f.rarity]:'#000000',emissiveIntensity:mut?(e?mut.ei:0):glow?e:0});m.userData.e0=m.emissiveIntensity;u.mats.push(m);return m};
 const gm=(c,em,ei)=>{const m=new THREE.MeshStandardMaterial({color:c,emissive:dark?'#000000':em,emissiveIntensity:dark?0:ei,roughness:.4,flatShading:true,side:THREE.DoubleSide});m.userData.e0=m.emissiveIntensity;u.mats.push(m);return m},cc=c=>dark?'#1b2433':c;
 const sk=f.rarity==='Secret'&&!/behemoth/.test(n)?(/kameleon/.test(n)?'prisma':/hantu/.test(n)?'ghost':/petir/.test(n)?'storm':'nebula'):'';
 const kind=/behemoth/.test(n)?'behemoth':/buntal/.test(n)?'puffer':/kuda laut/.test(n)?'horse':/ubur/.test(n)?'jelly':/mola/.test(n)?'mola':/penyu/.test(n)?'turtle':/manta/.test(n)?'ray':/gurita/.test(n)?'octo':/belut|sidat|naga|leviathan/.test(n)?'eel':/paus/.test(n)?'whale':/hiu/.test(n)?'shark':/marlin|barracuda|tuna|toman|belida|arwana/.test(n)?'torp':/lele|patin|gabus/.test(n)?'cat':'fish';
 const D={fish:[.5,.21,.1],torp:[.5,.13,.09],eel:[.5,.05,.05],ray:[.32,.04,.3],octo:[.22,.22,.22],whale:[.5,.2,.17],shark:[.5,.14,.12],cat:[.5,.13,.14],behemoth:[.5,.2,.15],puffer:[.3,.27,.27],horse:[.13,.3,.1],jelly:[.22,.17,.22],mola:[.3,.33,.07],turtle:[.3,.1,.27]}[kind];
 const sp=(w=10,hh=7)=>new THREE.SphereGeometry(1,w,hh),seg=/kristal/.test(n)?[5,4]:kind==='behemoth'?[7,5]:[12,9];
 const add=(geo,m,x,y,z,sx=1,sy=1,sz=1,p=g)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o};
 const u=root.userData={tails:[],fins:[],fr:.7,fa:.25,mats:[],kind,dy:D[1],ph:Math.random()*6},sy=kind==='fish'||kind==='cat'?D[1]/.2:Math.max(.35,D[1]/.13*.9),sc=pts=>pts.map(p=>[p[0],p[1]*sy]);
 const pv=new THREE.Group();pv.position.x=D[0]*.42;root.add(pv);g.position.x=-D[0]*.42;pv.add(g);u.body=pv;
 const NS=['puffer','horse','jelly','mola','turtle'].includes(kind),bm=add(kind==='jelly'?new THREE.SphereGeometry(1,12,8,0,6.283,0,1.7):kind==='octo'||kind==='ray'||NS?sp(...seg):bodyGeo(seg),mt(col,.3),0,0,0,...D);u.bm=bm;u.D=D;
 const T=(pts,ax='y',rx=false)=>{const p=new THREE.Group();p.position.set(-D[0]*.9,0,0);g.add(p);add(shp(pts,rx),mt(sh%3?fin:acc,.3),0,0,0,1,1,1,p);u.tails.push({p,ph:0,ax})};
 const dors=(pts,x=0)=>add(shp(pts),mt(fin,.3),x,D[1]*.8,0);
 const pect=(pts,pf=1)=>{for(const s of[1,-1]){const q=new THREE.Group();q.position.set(D[0]*.28,-D[1]*.35,s*D[2]*.8);g.add(q);add(shp(pts,true),mt(fin,.3),0,0,0,pf,1,s*pf,q);u.fins.push(q)}};
 if(!dark&&kind!=='octo'&&kind!=='ray'&&!NS&&kind!=='behemoth'){
  add(sp(10,6),mt('#e6ebf0'),.04,-D[1]*.55,0,D[0]*.7,D[1]*.5,D[2]*.85);
  add(new THREE.BoxGeometry(.015,.012,D[2]*1.1),mt('#1b2433'),D[0]*.93,-D[1]*.25,0);
  const band=(xs,c)=>xs.forEach(x=>{const k=prof(x/D[0]);add(new THREE.TorusGeometry(1,.07,5,16).rotateY(Math.PI/2),mt(c),x,0,0,1,D[1]*k*1.02,D[2]*k*1.02)});
  if(/pita/.test(br))band([-.18,.05,.27],'#eef2f7');if(/loreng/.test(br))band([-.25,-.08,.1,.28],'#2a2018');
  if(/pola|awan|bekas/.test(br))for(let k=0;k<4;k++){const x=-.28+k*.17;add(sp(6,5),mt(acc,.2),x,D[1]*prof(x/D[0])*.8,(k%2?1:-1)*D[2]*.35,.09,.03,.06)}}
 if(kind!=='ray'&&!['jelly','behemoth','turtle','horse'].includes(kind)){const eyeP=sk?(u.eg=new THREE.Group()):g;if(sk)g.add(eyeP);const er=Math.min(.05,D[2]*.5);for(const z of[1,-1]){add(sp(6,5),mt(dark?col:'#ffffff'),D[0]*.64,D[1]*.28,z*D[2]*.74,er,er,er,eyeP);if(!dark)add(sp(6,5),mt(mut&&mut.eye?mut.eye:'#101a2b'),D[0]*.68,D[1]*.28,z*D[2]*.84,er*.55,er*.55,er*.55,eyeP)}}
 if(kind==='behemoth'){const V1=cc('#5b49c8'),V2=cc('#8b78f0'),PK=cc('#c98af0'),CY=cc('#2bf2ff'),BL=cc('#2f9bff');bm.material.color.set(V1);
  add(new THREE.BoxGeometry(.34,.07,.2),mt(V2,.25),D[0]*.86,D[1]*.2,0).rotation.z=.18;add(new THREE.BoxGeometry(.22,.14,.17),gm(cc('#1d0f45'),'#000000',0),D[0]*.84,-D[1]*.1,0);
  const jw=new THREE.Group();jw.position.set(D[0]*.55,-D[1]*.35,0);g.add(jw);add(new THREE.BoxGeometry(.4,.07,.19),mt(PK,.25),.2,-.03,0,1,1,1,jw);for(let k=0;k<4;k++)add(new THREE.ConeGeometry(.018,.07,4),gm(cc('#ffffff'),'#ffffff',.2),.1+k*.07,.04,k%2?.05:-.05,1,1,1,jw);u.jaw=jw;
  for(const z of[1,-1])add(new THREE.OctahedronGeometry(1,0),gm(CY,CY,1.4),D[0]*.5,D[1]*.45,z*D[2]*.82,.05,.08,.05);
  for(let k=0;k<4;k++)for(const z of[1,-1]){const x=-.2+k*.12,m=add(new THREE.BoxGeometry(.2,.014,.014),gm(CY,CY,1.2),x,D[1]*(.1-k*.12),z*D[2]*.97*prof(x/D[0]));m.rotation.z=k%2?.5:-.5;m.rotation.y=z*.25}
  u.spk=[];for(let k=0;k<7;k++){const x=.18-k*.095,h=.2-k*.018,c=add(new THREE.ConeGeometry(.035,h,4),mt(BL,.5),x,D[1]*prof(x/D[0])*.95+h*.4,0);c.rotation.z=.3;u.spk.push(c)}
  T([[0,0],[-.3,.36],[-.2,0],[-.3,-.36]]);pect([[0,0],[-.32,0],[-.2,.28]],1.2);for(const y of[.36,-.36])add(new THREE.ConeGeometry(.03,.14,4).rotateZ(Math.PI/2),mt(BL,.5),-D[0]*.9-.3,y*.8,0);
  u.xf=(tt,t)=>{u.jaw.rotation.z=-(.12+.32*(.5+.5*Math.sin(t*1.7+u.ph)));u.spk.forEach((c,i)=>c.rotation.z=.3+Math.sin(t*3+i*.6)*.12)}}
 else if(kind==='puffer'){bm.material.color.set(cc(col));for(let k=0;k<28;k++){const th=Math.acos(1-2*(k+.5)/28),ph=k*2.399,nx=Math.sin(th)*Math.cos(ph),ny=Math.cos(th),nz=Math.sin(th)*Math.sin(ph),c=add(new THREE.ConeGeometry(.018,.09,4),mt(cc('#e9dfc0')),nx*D[0]*1.02,ny*D[1]*1.02,nz*D[2]*1.02);c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(nx,ny,nz))}
  T([[0,0],[-.14,.12],[-.1,0],[-.14,-.12]]);pect([[0,0],[-.12,0],[-.07,.1]]);add(sp(6,5),mt(cc('#f6efd8')),D[0]*.2,-D[1]*.55,0,D[0]*.7,D[1]*.45,D[2]*.8)}
 else if(kind==='horse'){const hc=k=>cc('#'+new THREE.Color().setHSL(k/7,.7,.6).getHexString());
  add(sp(8,6),mt(hc(0),.2),.1,.28,0,.1,.09,.08);add(new THREE.ConeGeometry(.03,.2,5).rotateZ(-Math.PI/2),mt(hc(1)),.27,.27,0);for(const z of[1,-1])add(sp(6,5),gm(cc('#101a2b'),'#000',0),.14,.31,z*.07,.02,.02,.02);
  for(let k=0;k<6;k++){const a=k*.55,x=-.06-Math.sin(a)*.12*(k/5+.4),y=-.28-k*.065+Math.cos(a)*.03;add(sp(6,5),mt(hc(k+1),.2),x,y,0,.07-k*.008,.06-k*.006,.06-k*.006)}
  const fg=new THREE.Group();fg.position.set(-.1,.0,0);g.add(fg);add(shp([[0,.1],[-.13,.0],[0,-.1]]),mt(cc('#ffd8f0'),.3),0,0,0,1,1,1,fg);u.tails.push({p:fg,ph:0,ax:'y'});for(let k=0;k<4;k++)add(new THREE.ConeGeometry(.02,.07,4),mt(hc(k+3)),-.05,.2-k*.1,0).rotation.z=Math.PI/2+.2;
  u.xf=(tt)=>{u.bm.rotation.z=Math.sin(tt*.35)*.12}}
 else if(kind==='jelly'){const bmt=bm.material;bmt.transparent=true;bmt.opacity=.72;bmt.emissive.set(dark?'#000000':col);bmt.emissiveIntensity=dark?0:.4;bmt.userData.e0=bmt.emissiveIntensity;
  for(let k=0;k<8;k++){const a=k/8*6.283,gp=new THREE.Group();gp.position.set(Math.cos(a)*.13,0,Math.sin(a)*.13);g.add(gp);add(new THREE.ConeGeometry(.022,.55,5).rotateX(Math.PI).translate(0,-.28,0),gm(cc('#e8b8ff'),'#c58cff',.6),0,0,0,1,1,1,gp);u.tails.push({p:gp,ph:k*.7,ax:'z'})}
  for(let k=0;k<4;k++){const a=k/4*6.283+.4,gp=new THREE.Group();gp.position.set(Math.cos(a)*.06,0,Math.sin(a)*.06);g.add(gp);add(new THREE.ConeGeometry(.012,.85,4).rotateX(Math.PI).translate(0,-.43,0),gm(cc('#ffffff'),'#bfe8ff',.5),0,0,0,1,1,1,gp);u.tails.push({p:gp,ph:k,ax:'x'})}
  u.xf=(tt)=>{const q=Math.sin(tt*.9);u.bm.scale.set(D[0]*(1+.1*q),D[1]*(1-.16*q),D[2]*(1+.1*q))}}
 else if(kind==='mola'){bm.material.color.set(cc(col));add(shp([[-.05,0],[-.3,.5],[-.36,.22],[-.2,0]]),mt(fin,.3),0,D[1]*.7,0);add(shp([[-.05,0],[-.3,-.5],[-.36,-.22],[-.2,0]]),mt(fin,.3),0,-D[1]*.7,0);T([[0,0],[-.06,.22],[-.1,0],[-.06,-.22]]);pect([[0,0],[-.12,0],[-.08,.1]])}
 else if(kind==='turtle'){const SH=cc('#3f8f5a'),SK=cc('#b8cf8a');bm.material.color.set(SH);add(sp(8,6),mt(SK),D[0]*1.02,0,0,.1,.08,.08);add(new THREE.ConeGeometry(.025,.08,4).rotateZ(Math.PI/2),mt(SK),D[0]*1.2,-.01,0);for(const z of[1,-1])add(sp(6,5),gm(cc('#101a2b'),'#000',0),D[0]*1.12,.03,z*.06,.016,.016,.016);
  for(let k=0;k<7;k++){const a=k?(k-1)/6*6.283:0,r=k?.17:0;add(sp(6,5),mt(cc('#a0d6a8'),.2),Math.cos(a)*r*1.1,D[1]*.9,Math.sin(a)*r*.95,.08,.025,.08)}
  for(const s_ of[1,-1]){const q=new THREE.Group();q.position.set(D[0]*.4,-.02,s_*D[2]*.8);g.add(q);add(sp(8,5),mt(SK),0,0,s_*.15,.07,.015,.17,q);u.fins.push(q);const r=new THREE.Group();r.position.set(-D[0]*.55,-.02,s_*D[2]*.55);g.add(r);add(sp(8,5),mt(SK),0,0,s_*.06,.05,.015,.07,r)}
  add(new THREE.ConeGeometry(.02,.1,4).rotateZ(Math.PI/2),mt(SK),-D[0]*1.05,-.02,0).rotation.z=Math.PI/2*3}
 else if(kind==='octo'){for(let k=0;k<6;k++){const p=new THREE.Group();p.position.set(-D[0]*.5,-D[1]*.4,(k-2.5)*.07);g.add(p);add(new THREE.ConeGeometry(.04,.5,5).rotateZ(Math.PI/2),mt(col,.2),-.25,0,0,1,1,1,p);u.tails.push({p,ph:k,ax:'y'})}}
 else if(kind==='ray'){add(new THREE.ConeGeometry(.03,.7,4).rotateZ(Math.PI/2),mt(col),-.55,0,0);for(const s of[1,-1]){const p=new THREE.Group();p.position.set(0,0,s*.12);g.add(p);add(sp(),mt(col,.3),0,0,s*.2,.3,.025,.28,p);add(sp(6,5),mt(acc,.9),0,0,s*.46,.04,.04,.04,p);u.fins.push(p)}u.fr=0;u.fa=.5}
 else if(kind==='eel'){T([[0,0],[-.22,.06],[-.34,0],[-.22,-.06]]);const w=/naga|leviathan/.test(n)?2.2:1;dors([[-.42,0],[-.36,.07*w],[.3,.07*w],[.4,0]])}
 else if(kind==='whale'){T([[0,0],[-.18,.3],[-.3,.22],[-.2,0],[-.3,-.22],[-.18,-.3]],'z',true);dors([[-.1,0],[-.02,.12],[.08,0]]);pect([[0,0],[-.3,0],[-.2,.3]])}
 else if(kind==='shark'){T(sc([[0,0],[-.22,.3],[-.17,0],[-.2,-.14]]));dors([[-.14,0],[0,.32],[.12,0]]);pect([[0,0],[-.24,0],[-.14,.26]])}
 else if(kind==='torp'){T(sc([[0,0],[-.24,.24],[-.16,0],[-.24,-.24]]));
  dors(/marlin/.test(n)?[[-.3,0],[-.2,.3],[.1,.26],[.15,0]]:/arwana/.test(n)?[[-.35,0],[-.3,.08],[.1,.08],[.15,0]]:[[-.12,0],[-.02,.2],[.08,.17],[.14,0]]);pect([[0,0],[-.16,0],[-.1,.14]]);
  if(/marlin/.test(n))add(new THREE.ConeGeometry(.025,.55,5).rotateZ(-Math.PI/2).translate(.27,0,0),mt('#2a3040'),D[0]*.95,0,0);
  if(/arwana|belida/.test(n))for(const z of[1,-1])add(new THREE.ConeGeometry(.01,.2,4).rotateZ(-Math.PI/2).translate(.1,0,0),mt('#1b2433'),D[0]*.9,-D[1]*.3,z*.03)}
 else if(kind==='cat'){T(sc([[0,0],[-.1,.17],[-.24,.12],[-.24,-.12],[-.1,-.17]]));dors([[-.1,0],[-.02,.12],[.08,0]],.1);pect([[0,0],[-.16,0],[-.1,.12]]);
  for(const s of[1,-1])for(const k of[0,1]){const w=add(new THREE.ConeGeometry(.01,.34,4).rotateZ(-Math.PI/2).translate(.17,0,0),mt('#1b2433'),D[0]*.9,-D[1]*.2,s*.06*(k+1));w.rotation.y=s*(.35+.25*k)}}
 else{T(sc(sh%2?[[0,0],[-.22,.2],[-.15,0],[-.22,-.2]]:[[0,0],[-.1,.17],[-.23,.12],[-.23,-.12],[-.1,-.17]]));
  dors([[-.18,0],[-.08,.2],[.02,.18],[.1,0]]);pect([[0,0],[-.16,0],[-.1,.14]],/lion/.test(n)?2:1);add(shp(sc([[-.18,0],[-.1,-.12],[-.02,0]])),mt(fin,.3),-.05,-D[1]*.8,0);
  if(/lion/.test(n))for(let k=-4;k<=4;k++){const s=add(new THREE.ConeGeometry(.012,.4,4).translate(0,.2,0),mt(k%2?'#eef2f7':'#2a2018'),-.05+k*.025,D[1]*.8,0);s.rotation.z=k*.2}
  if(/parrot/.test(n))add(new THREE.BoxGeometry(.06,.05,.1),mt('#eef2f7'),D[0]*.97,-D[1]*.1,0)}
 if(sk){const CY=cc('#19f0d0'),forms={prisma:[[1,1,1],[.85,.25,2.4],[1.6,.5,.5]],ghost:[[1,1,1],[1.5,.6,.7],[2.1,.38,.42]],storm:[[1,1,1],[.8,2.2,2.2],[1.2,.8,.8]],nebula:[[1,1,1],[.7,.3,2.6],[.8,1.5,1.5]]}[sk],wl=[],rg=[],ob=[];
  if(sk==='prisma'||sk==='nebula')for(const s_ of[1,-1]){const w=new THREE.Group();w.position.set(0,0,s_*D[2]*.6);g.add(w);add(sp(),mt(fin,.4),0,0,s_*.25,.34,.02,.3,w);add(sp(6,5),gm(CY,CY,1.4),0,0,s_*.52,.04,.04,.04,w);w.scale.set(.001,.001,.001);wl.push(w)}
  if(sk==='ghost'||sk==='nebula')for(let k=0;k<2;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(1,.018,6,30),gm(CY,CY,1.3));r.scale.setScalar(.34+k*.1);g.add(r);rg.push(r)}
  if(sk!=='storm')for(let k=0;k<(sk==='nebula'?8:5);k++){ob.push(add(new THREE.OctahedronGeometry(1,0),gm(CY,CY,1.6),0,0,0,.035,.035,.035))}
  let wh=null;if(sk==='ghost'){wh=new THREE.Group();g.add(wh);for(const z of[1,-1]){const q=add(new THREE.ConeGeometry(.008,.5,4).rotateZ(-Math.PI/2).translate(.25,0,0),gm(cc('#d8fff6'),CY,.8),D[0]*.95,-.01,z*.04,1,1,1,wh);q.rotation.y=z*.3}for(let k=0;k<6;k++)add(new THREE.ConeGeometry(.03,.14,4),gm(cc('#9ff0e6'),CY,1),.2-k*.08,D[1]*.95+.05,0,1,1,1,wh);wh.scale.setScalar(.001)}
  let arc=null;if(sk==='storm'){const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.BufferAttribute(new Float32Array(26*6),3));arc=new THREE.LineSegments(ag,new THREE.LineBasicMaterial({color:'#c8fbff'}));arc.frustumCulled=false;if(!dark)g.add(arc)}
  if(sk==='nebula')for(let k=0;k<14;k++){const th=Math.random()*6.283,x=(Math.random()-.5)*.7;add(new THREE.OctahedronGeometry(1,0),gm('#ffffff',CY,1.5),x,Math.sin(th)*D[1]*.8*prof(x/.5),Math.cos(th)*D[2]*.8*prof(x/.5),.014,.014,.014)}
  const tri=(m,c)=>sm_(.75,.25,Math.abs(((m-c+1.5)%3+3)%3-1.5));
  u.xf=(tt,t,sp_,dt)=>{u.mp=(u.mp||0)+dt*(.1+sp_*.12);const m=(((u.mp+u.ph*.1)%3)+3)%3;let w0=tri(m,0),w1=tri(m,1),w2=tri(m,2);const sm=w0+w1+w2||1;w0/=sm;w1/=sm;w2/=sm;
   const X=forms[0][0]*w0+forms[1][0]*w1+forms[2][0]*w2,Y=forms[0][1]*w0+forms[1][1]*w1+forms[2][1]*w2,Z=forms[0][2]*w0+forms[1][2]*w1+forms[2][2]*w2;
   u.bm.scale.set(D[0]*X,D[1]*Y,D[2]*Z);if(u.eg)u.eg.scale.set(X,Y,Z);wl.forEach(w=>w.scale.set(.001+w1,.001+w1,.001+w1));
   rg.forEach((r,i)=>{r.rotation.x=t*(1+i*.6)+i;r.rotation.y=t*.7*(i?-1:1);r.scale.setScalar((.34+i*.1)*(1+.15*Math.sin(t*2+i)))});
   ob.forEach((o,i)=>{const a=t*(1.2+i*.07)+i*6.283/ob.length,r=.3+.08*Math.sin(t+i);o.position.set(Math.cos(a)*r*1.2,Math.sin(a*1.3+i)*.1,Math.sin(a)*r)});
   if(wh)wh.scale.setScalar(.001+w2*.9+w1*.4);
   if(sk==='prisma'){const h=(t*.07+u.ph)%1;u.mats.forEach(q=>{q.color.setHSL(h,.75,.52);q.emissive.setHSL(h,.9,.5)})}
   if(sk==='ghost'){const o=.5+.28*Math.sin(t*1.7);u.mats.forEach(q=>{q.transparent=true;q.opacity=o+.2})}
   if(arc){const a=arc.geometry.attributes.position;let j=0;for(let b=0;b<2;b++){let px=-.5,py=0,pz=0;for(let k=0;k<13;k++){const nx=-.5+(k+1)/13,ny=(Math.random()-.5)*.17,nz=(Math.random()-.5)*.17;a.setXYZ(j++,px,py,pz);a.setXYZ(j++,nx,ny,nz);px=nx;py=ny;pz=nz}}a.needsUpdate=true;arc.visible=Math.random()<.85}}}
 if(/angler/.test(n)){add(new THREE.ConeGeometry(.01,.3,4),mt('#222a3a'),D[0]*.4,D[1]+.12,0).rotation.z=-.5;add(sp(8,6),new THREE.MeshBasicMaterial({color:'#6ff0ff'}),D[0]*.4+.12,D[1]+.27,0,.05,.05,.05)}
 return root}
const sm_=(a,b,x)=>{const u=Math.max(0,Math.min(1,(x-a)/(b-a)));return u*u*(3-2*u)};
export function animateFish(g,t,sp=.5){const u=g.userData,ph=u.ph||0,tt=t*(3.4+sp*7.5)+ph,k=u.kind,dt=Math.min(.1,Math.max(0,t-(u.lt===undefined?t:u.lt)));u.lt=t;
 if(u.body){const w=k==='eel'?2.1:k==='ray'?.12:k==='whale'?.5:k==='octo'?.15:1,am=(.07+sp*.15)*w;
  u.body.rotation.y=Math.sin(tt)*am;u.body.rotation.z=Math.sin(tt*.5+1.3)*.03*(.4+sp)*w;u.body.position.y=Math.sin(tt*.5)*.012*w}
 u.tails.forEach(o=>{const a=Math.sin(tt-1.15-(o.ph||0)*.38)*(.22+sp*.34);o.p.rotation[o.ax||'y']=a});
 u.fins.forEach((p,i)=>p.rotation.x=(i?-1:1)*(u.fr+Math.sin(t*(k==='ray'?2.4+sp*2.2:2.6+sp*3)+(k==='ray'?0:i*.9+ph))*u.fa*(1+sp*.5)));if(u.xf)u.xf(tt,t,sp,dt)}

export function disposeFish(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose();const m=c.material;if(m)(Array.isArray(m)?m:[m]).forEach(x=>x.dispose())})}
let tr_,ts,tc;const cache={};
export function thumb(f,dark=false,mut=null){
 const k=f.id+dark+(mut?mut.k:'');if(cache[k])return cache[k];
 if(!tr_){tr_=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tr_.setSize(240,120);ts=new THREE.Scene();ts.add(new THREE.HemisphereLight('#ffffff','#667788',1.6));const d=new THREE.DirectionalLight('#ffffff',2);d.position.set(1,2,3);ts.add(d);tc=new THREE.PerspectiveCamera(30,2,.1,20);tc.position.set(.1,.25,2.5);tc.lookAt(0,0,0)}
 const m=makeFish(f,dark,mut);m.rotation.y=-.45;ts.add(m);tr_.render(ts,tc);const url=tr_.domElement.toDataURL();ts.remove(m);disposeFish(m);return cache[k]=url}

let vr,vs,vc,vm,vraf=0;
export function startViewer(f){stopViewer();
 if(!vr){vr=new THREE.WebGLRenderer({antialias:true,alpha:true});vr.setPixelRatio(Math.min(devicePixelRatio||1,2));vr.setSize(300,150);vs=new THREE.Scene();vs.add(new THREE.HemisphereLight('#ffffff','#667788',1.6));const d=new THREE.DirectionalLight('#ffffff',2);d.position.set(1,2,3);vs.add(d);vc=new THREE.PerspectiveCamera(30,2,.1,20);vc.position.set(0,.2,2.6);vc.lookAt(0,0,0);vr.domElement.style.cssText='width:100%;height:auto;display:block'}
 vm=makeFish(f,false,f.mut);vs.add(vm);const t0=performance.now();
 const tick=()=>{const t=(performance.now()-t0)/1000;vm.rotation.y=Math.sin(t*.8)*.7-.3;vm.position.y=Math.sin(t*1.6)*.04;vm.rotation.z=Math.sin(t*1.1)*.05;animateFish(vm,t,.45);vm.userData.mats.forEach(m=>{m.emissiveIntensity=m.userData.e0*(1+.5*Math.sin(t*4))});vr.render(vs,vc);vraf=requestAnimationFrame(tick)};tick();return vr.domElement}
export function stopViewer(){cancelAnimationFrame(vraf);if(vm&&vs){vs.remove(vm);disposeFish(vm);vm=null}}
