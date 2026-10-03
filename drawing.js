(() => {
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function drawing(p,r,t,fmt,unit,fraction=0){
 const load=SpringMechanics.calculate({...p,travel:p.travel*fraction}),ink='#244450',accent='#087f76',guide='#8ca7b0';
 let content='';
 const line=(x1,y1,x2,y2,color=guide,dash='')=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="1" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;
 const text=(x,y,s,size=12,color=ink)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="${size}">${esc(s)}</text>`;
 const dim=(x1,y1,x2,y2,label)=>line(x1,y1,x2,y2)+line(x1-4,y1-4,x1+4,y1+4)+line(x2-4,y2-4,x2+4,y2+4)+text((x1+x2)/2+(x1===x2?37:0),(y1+y2)/2-(y1===y2?9:0),label,11);
 const f=v=>fmt(v/unit.length,2)+' '+unit.lengthName;
 content+=text(210,34,t('free'),13)+text(610,34,t('working')+' · '+Math.round(fraction*100)+'%',13);
 content+=line(400,25,400,310,'#d7e3e7','4 5');
 if(p.type==='torsion'){
  const radius=62;
  for(const [cx,angle] of [[210,0],[610,p.travel*fraction]]){
   const a=(-70+angle)*Math.PI/180,ax=cx+radius*Math.cos(a),ay=170+radius*Math.sin(a);
   content+=`<circle cx="${cx}" cy="170" r="${radius}" fill="none" stroke="${accent}" stroke-width="9"/><circle cx="${cx}" cy="170" r="${radius-11}" fill="none" stroke="${guide}" stroke-width="2"/>`;
   content+=`<path d="M${cx-radius} 170v95M${ax} ${ay}L${ax+65*Math.sin(a)} ${ay-65*Math.cos(a)}" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
   content+=line(cx-90,170,cx+90,170,guide,'5 4')+line(cx,85,cx,250,guide,'5 4');
   content+=dim(cx-radius,290,cx+radius,290,'D = '+f(p.D));
  }
  content+=text(610,67,'θ = '+fmt(p.travel*fraction,1)+'° · T = '+fmt(load.load/unit.torque,2)+' '+unit.torqueName);
 }else{
  const freeLength=p.type==='compression'?p.L:(p.n+1)*p.d;
  const maxLength=Math.max(freeLength,freeLength+p.travel*(p.type==='extension'?1:0));
  const scale=Math.min(210/maxLength,155/r.Do),amp=p.D*scale/2,wire=Math.max(1.8,p.d*scale);
  for(const [cx,len]of [[210,freeLength],[610,load.length]]){
   const top=72,height=len*scale,bodyHeight=Math.max(0,height-wire),steps=Math.ceil(p.n*60),points=[];
   for(let i=0;i<=steps;i++){const v=i/steps;points.push([cx+amp*Math.cos(v*p.n*Math.PI*2),top+wire/2+v*bodyHeight]);}
   content+=line(cx,top-14,cx,top+height+16,guide,'5 4');
   content+=`<path d="M${points.map(q=>q.join(' ')).join('L')}" fill="none" stroke="${accent}" stroke-width="${wire}" stroke-linecap="round" stroke-linejoin="round"/>`;
   if(p.type==='compression')content+=`<path d="M${cx-amp} ${top+wire/2}h${amp*2}M${cx-amp} ${top+height-wire/2}h${amp*2}" stroke="${accent}" stroke-width="${wire}"/>`;
   else content+=`<path d="M${cx} ${top}v-10a12 12 0 1 1 10-14M${cx} ${top+height}v10a12 12 0 1 0 10 14" fill="none" stroke="${accent}" stroke-width="${Math.min(wire,5)}"/>`;
   content+=dim(cx+amp+24,top,cx+amp+24,top+height,f(len));
   content+=dim(cx-amp-wire/2,top+height+43,cx+amp+wire/2,top+height+43,'De = '+f(r.Do));
  }
  content+=text(610,54,'F = '+fmt(load.load/unit.force,2)+' '+unit.forceName,11);
 }
 content+=text(400,350,'d = '+f(p.d)+'     D = '+f(p.D)+'     Na = '+fmt(p.n,2),12);
 content+=text(400,374,t(p.type+'Scope'),11,'#617983');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" role="img" aria-label="${esc(t('drawing'))}" direction="ltr"><rect width="800" height="400" rx="8" fill="#f8fcfc"/>${content}</svg>`;
}
function chart(p,r,t,fmt,u,fraction){
 const torsion=p.type==='torsion',xf=torsion?1:u.length,yf=torsion?u.torque:u.force;
 const xmax=p.travel||1,ymax=Math.max(r.load,1)*1.15,initial=p.type==='extension'?p.initial:0;
 const x=v=>55+v/xmax*330,y=v=>185-v/ymax*140;
 let s='';for(let i=0;i<=4;i++){const v=ymax*i/4;s+=`<path d="M55 ${y(v)}H385" stroke="#cddce0"/><text x="47" y="${y(v)+4}" text-anchor="end">${esc(fmt(v/yf,1))}</text>`;}
 s+=`<path d="M55 40V185H390" stroke="#607985" fill="none"/><path d="M55 ${y(initial)}L${x(p.travel)} ${y(r.load)}" stroke="#087f76" stroke-width="3" fill="none"/><circle cx="${x(p.travel*fraction)}" cy="${y(initial+r.rate*p.travel*fraction)}" r="5" fill="#e88650"/>`;
 s+=`<text x="55" y="205">0</text><text x="385" y="205" text-anchor="end">${esc(fmt(p.travel/xf,2))}</text><text x="220" y="230" text-anchor="middle">${esc(t(torsion?'angle':'travel'))} (${torsion?'°':u.lengthName})</text><text x="55" y="22">${esc(t(torsion?'torque':'force'))} (${torsion?u.torqueName:u.forceName})</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 245" role="img" aria-label="${esc(t('curve'))}" direction="ltr" font-family="Arial, sans-serif" font-size="10" fill="#48646f"><rect width="420" height="245" fill="#f8fcfc" rx="8"/>${s}</svg>`;
}
window.SpringDrawing={drawing,chart,escape:esc};
})();
