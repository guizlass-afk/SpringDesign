(() => {
'use strict';
const $=id=>document.getElementById(id),esc=SpringDrawing.escape;
const languages={'pt-BR':['Português','br'],'en-US':['English','us'],'es-ES':['Español','es'],'zh-CN':['中文','cn'],'hi-IN':['हिन्दी','in'],'ar-SA':['العربية','sa'],'fr-FR':['Français','fr'],'bn-BD':['বাংলা','bd'],'ru-RU':['Русский','ru'],'de-DE':['Deutsch','de'],'it-IT':['Italiano','it'],'ja-JP':['日本語','jp']};
let language='pt-BR';try{const saved=localStorage.getItem('springdesign-language')||localStorage.getItem('factorytoolbox-language');if(languages[saved])language=saved;}catch{}
const t=key=>SpringTranslations[language][key]||key;
const fmt=(v,digits=3)=>new Intl.NumberFormat(language,{maximumFractionDigits:digits}).format(v);
const defaults={type:'compression',d:2,D:20,n:8,L:45,travel:10,initial:5,G:79289.708971432,E:206842.71879505,allowable:null};
let p={...defaults},result,unitSystem='metric',material='music';
function units(){return unitSystem==='metric'?{length:1,lengthName:'mm',force:1,forceName:'N',stress:1,stressName:'MPa',torque:1,torqueName:'N·mm',energy:1,energyName:'J'}:{length:25.4,lengthName:'in',force:4.4482216152605,forceName:'lbf',stress:6.894757293168,stressName:'ksi',torque:112.984829027617,torqueName:'lbf·in',energy:.112984829027617,energyName:'lbf·in'};}
function fieldUnit(key){const u=units();if(['d','D','L'].includes(key)||(key==='travel'&&p.type!=='torsion'))return [u.length,u.lengthName];if(key==='travel')return [1,'°'];if(key==='initial')return [u.force,u.forceName];if(['G','E','allowable'].includes(key))return [u.stress,u.stressName];return [1,''];}
function field(key){const [scale,label]=fieldUnit(key),title=t(key==='travel'&&p.type==='torsion'?'angle':key)+(key==='allowable'?' · '+(p.type==='torsion'?'σ':'τ'):'');const val=p[key]===null?'':String(Number((p[key]/scale).toPrecision(10)));
 return `<label for="input-${key}"><span>${esc(title)}${label?' ('+label+')':''}</span><input id="input-${key}" data-key="${key}" type="number" step="any" ${key==='allowable'?'':'required'} min="0" value="${val}" ${key==='n'?'max="100"':''}></label>`;
}
function renderFields(){
 $('fields').innerHTML=['d','D','n',...(p.type==='compression'?['L']:[]),'travel',...(p.type==='extension'?['initial']:[])].map(field).join('');
 $('materialFields').innerHTML=[p.type==='torsion'?'E':'G','allowable'].map(field).join('');
 $('types').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===p.type)));
 $('parameters').querySelectorAll('input[data-key]').forEach(input=>input.addEventListener('input',()=>{
  const key=input.dataset.key;p[key]=input.value===''?(key==='allowable'?null:NaN):Number(input.value)*fieldUnit(key)[0];
  if(['G','E'].includes(key)){material='custom';$('material').value=material;}
  update();
 }));
}
function tableRows(){const u=units(),rows=[['outside',result.Do/u.length,u.lengthName],['inside',result.Di/u.length,u.lengthName],['index',result.C,''],[p.type==='torsion'?'nominalBody':'length',result.length/u.length,u.lengthName],['factor',result.factor,''],['margin',result.margin,'']];if(p.type==='compression')rows.splice(3,0,['solid',result.solid/u.length,u.lengthName],['available',result.available/u.length,u.lengthName],['pitch',result.pitch/u.length,u.lengthName]);return rows;}
function update(){
 result=SpringMechanics.calculate(p);const invalid=result.errors.length>0;
 $('error').hidden=!invalid;$('validContent').hidden=invalid;
 document.querySelectorAll('.actions button').forEach(b=>b.disabled=invalid);
 document.querySelectorAll('[data-key]').forEach(e=>e.setAttribute('aria-invalid',String(result.errors.includes(e.dataset.key)||result.errors.includes('solid')&&['L','travel'].includes(e.dataset.key))));
 $('error').textContent=result.errors.includes('solid')?t('solidError'):t('invalid')+' '+result.errors.map(k=>t(k)).join(', ');
 $('modelTitle').textContent=t(p.type);if(invalid)return;
 const u=units(),torsion=p.type==='torsion',rateUnit=torsion?u.torque:u.force/u.length;
 const metrics=[['rate',result.rate/rateUnit,torsion?u.torqueName+'/°':u.forceName+'/'+u.lengthName],[torsion?'torque':'force',result.load/(torsion?u.torque:u.force),torsion?u.torqueName:u.forceName],['stress',result.stress/u.stress,u.stressName],['energy',result.energy/u.energy,u.energyName]];
 $('metrics').innerHTML=metrics.map(([key,v,label])=>`<div class="metric"><small>${esc(t(key))}</small><strong>${fmt(v,3)}</strong><span>${label}</span></div>`).join('');
 $('results').innerHTML=tableRows().map(([key,v,label])=>`<div><dt>${esc(t(key))}</dt><dd>${v===null?t('noLimit'):fmt(v,3)+' '+label}</dd></div>`).join('');
 $('warnings').innerHTML=result.warnings.map(w=>`<li>${esc(t(w))}</li>`).join('');$('warnings').hidden=!result.warnings.length;
 $('scope').textContent=t(p.type+'Scope');
 $('formula').innerHTML=(torsion?['kθ = E d⁴ / (10.8 D Na × 360)','T = kθ θ','Ki = (4C² − C − 1) / (4C(C − 1))','σ = Ki 32 T / (π d³)']:['k = G d⁴ / (8 D³ Na)',p.type==='extension'?'F = F₀ + k x':'F = k x','Kw = (4C − 1) / (4C − 4) + 0.615 / C','τ = Kw 8 F D / (π d³)']).map(f=>'<code dir="ltr">'+f+'</code>').join('');
 $('drawingMeta').textContent='d '+fmt(p.d/u.length,2)+' · D '+fmt(p.D/u.length,2)+' '+u.lengthName;
 renderSimulation();
}
function renderSimulation(){if(!result||result.errors.length)return;const u=units(),fraction=Number($('simulation').value)/100;
 $('drawing').innerHTML=SpringDrawing.drawing(p,result,t,fmt,u,fraction);$('chart').innerHTML=SpringDrawing.chart(p,result,t,fmt,u,fraction);
 const load=(p.type==='extension'?p.initial:0)+result.rate*p.travel*fraction;
 $('simLabel').textContent=fmt(p.travel*fraction/(p.type==='torsion'?1:u.length),2)+(p.type==='torsion'?'°':' '+u.lengthName)+' · '+fmt(load/(p.type==='torsion'?u.torque:u.force),2)+' '+(p.type==='torsion'?u.torqueName:u.forceName);
}
function setLanguage(code){language=code;document.documentElement.lang=code;document.documentElement.dir=code==='ar-SA'?'rtl':'ltr';document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));$('currentFlag').src='flags/'+languages[code][1]+'.svg';$('currentLanguage').textContent=languages[code][0];$('languageButton').setAttribute('aria-label',t('language'));document.querySelectorAll('[data-language]').forEach(e=>e.setAttribute('aria-current',String(e.dataset.language===code)));try{localStorage.setItem('springdesign-language',code);}catch{}renderFields();update();}
for(const [code,[name,flag]]of Object.entries(languages)){const b=document.createElement('button');b.dataset.language=code;b.innerHTML=`<img src="flags/${flag}.svg" alt="">${name}`;b.addEventListener('click',()=>{setLanguage(code);closeMenu();$('languageButton').focus();});$('languageMenu').append(b);}
function closeMenu(){$('languageMenu').hidden=true;$('languageButton').setAttribute('aria-expanded','false');}
$('languageButton').addEventListener('click',()=>{const open=$('languageMenu').hidden;$('languageMenu').hidden=!open;$('languageButton').setAttribute('aria-expanded',String(open));if(open)$('languageMenu').querySelector('button').focus();});
document.addEventListener('click',e=>{if(!e.target.closest('#languagePicker'))closeMenu();});
$('languagePicker').addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();$('languageButton').focus();}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const list=[...$('languageMenu').children],i=list.indexOf(document.activeElement);list[(i+(e.key==='ArrowDown'?1:-1)+list.length)%list.length].focus();}});
$('types').addEventListener('click',e=>{if(!e.target.dataset.type)return;p.type=e.target.dataset.type;p.allowable=null;p.travel=p.type==='torsion'?45:10;$('simulation').value=0;renderFields();update();});
$('units').addEventListener('change',()=>{unitSystem=$('units').value;renderFields();update();});
$('material').addEventListener('change',()=>{material=$('material').value;if(material==='music'){p.G=defaults.G;p.E=defaults.E;}if(material==='stainless'){p.G=77221.2816834816;p.E=193053.204208704;}renderFields();update();});
$('reset').addEventListener('click',()=>{p={...defaults};material='music';$('material').value=material;$('simulation').value=0;renderFields();update();});
$('parameters').addEventListener('submit',e=>e.preventDefault());$('simulation').addEventListener('input',renderSimulation);
function download(name,text,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('svgExport').addEventListener('click',()=>{if(result.errors.length)return;download('spring-design-'+p.type+'.svg',$('drawing').innerHTML,'image/svg+xml;charset=utf-8');});
$('csvExport').addEventListener('click',()=>{if(result.errors.length)return;const u=units(),rows=[['Spring Design',t(p.type),''],[t('schematic'),t(p.type+'Scope'),''],[t('scopeNote'),'','']];
 for(const key of ['d','D','n',...(p.type==='compression'?['L']:[]),'travel',...(p.type==='extension'?['initial']:[]),p.type==='torsion'?'E':'G','allowable']){const [scale,label]=fieldUnit(key);rows.push([t(key==='travel'&&p.type==='torsion'?'angle':key),p[key]===null?'':p[key]/scale,label]);}
 rows.push(...tableRows().map(([key,value,label])=>[t(key),value===null?t('noLimit'):value,label]),[t('stress'),result.stress/u.stress,u.stressName]);
 rows.push([t('rate'),result.rate/(p.type==='torsion'?u.torque:u.force/u.length),p.type==='torsion'?u.torqueName+'/°':u.forceName+'/'+u.lengthName],[t(p.type==='torsion'?'torque':'force'),result.load/(p.type==='torsion'?u.torque:u.force),p.type==='torsion'?u.torqueName:u.forceName],[t('energy'),result.energy/u.energy,u.energyName]);
 rows.push([t(p.type==='torsion'?'angle':'travel')+' ('+(p.type==='torsion'?'°':u.lengthName)+')',t(p.type==='torsion'?'torque':'force')+' ('+(p.type==='torsion'?u.torqueName:u.forceName)+')','']);for(let i=0;i<=20;i++){const x=p.travel*i/20;rows.push([x/(p.type==='torsion'?1:u.length),result.loadAt(x)/(p.type==='torsion'?u.torque:u.force),'']);}
 const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');download('spring-design-'+p.type+'.csv','\uFEFF'+csv,'text/csv;charset=utf-8');
});
$('print').addEventListener('click',()=>window.print());
window.SpringApp={get parameters(){return {...p};},get result(){return result;},setLanguage};setLanguage(language);
})();
