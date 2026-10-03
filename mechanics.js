/* Units: mm, N, MPa, degrees. Round-wire cylindrical spring body models. */
(function(root){
'use strict';
function calculate(p){
 const errors=[];
 for(const key of ['d','D','n','G','E'])if(!Number.isFinite(p[key])||p[key]<=0)errors.push(key);
 for(const key of ['travel','initial'])if(!Number.isFinite(p[key])||p[key]<0)errors.push(key);
 if(!['compression','extension','torsion'].includes(p.type))errors.push('type');
 if(!(p.D>p.d))errors.push('D');
 if(p.n>100||p.n<1)errors.push('n');
 if(p.type==='compression'&&(!(p.L>0)||!Number.isFinite(p.L)))errors.push('L');
 if(p.allowable!==null&&(!Number.isFinite(p.allowable)||p.allowable<=0))errors.push('allowable');
 if(errors.length)return {errors:[...new Set(errors)]};
 const C=p.D/p.d,Do=p.D+p.d,Di=p.D-p.d;
 const torsion=p.type==='torsion',extension=p.type==='extension';
 const factor=torsion?(4*C*C-C-1)/(4*C*(C-1)):(4*C-1)/(4*C-4)+.615/C;
 const rate=torsion?p.E*p.d**4/(10.8*p.D*p.n*360):p.G*p.d**4/(8*p.D**3*p.n);
 const initial=extension?p.initial:0,load=initial+rate*p.travel;
 const stress=torsion?factor*32*load/(Math.PI*p.d**3):factor*8*load*p.D/(Math.PI*p.d**3);
 const total=p.n+(p.type==='compression'?2:0),solid=total*p.d;
 const available=p.type==='compression'?p.L-solid:null;
 if(available!==null&&(available<=0||p.travel>=available))return {errors:['solid'],available,solid};
 const energy=torsion?.5*load*p.travel*Math.PI/180/1000:(initial*p.travel+.5*rate*p.travel**2)/1000;
 if(![rate,load,stress,energy,C,Do,Di].every(Number.isFinite))return {errors:['invalid']};
 const warnings=[];
 if(C<4||C>12)warnings.push('indexNote');
 if(p.type==='compression'&&p.L/p.D>4)warnings.push('bucklingNote');
 if(available!==null&&p.travel>.8*available)warnings.push('clashNote');
 if(p.allowable!==null&&stress>p.allowable)warnings.push('stressNote');
 if(p.type==='torsion'&&p.travel>180)warnings.push('angleNote');
 return {errors:[],warnings,C,Do,Di,factor,rate,load,stress,total,solid,available,energy,margin:p.allowable===null||stress===0?null:p.allowable/stress,
 length:p.type==='compression'?p.L-p.travel:extension?(p.n+1)*p.d+p.travel:(p.n+1)*p.d,
 pitch:p.type==='compression'?(p.L-2*p.d)/p.n:p.d,
 loadAt:x=>initial+rate*x};
}
const api={calculate};if(typeof module!=='undefined')module.exports=api;root.SpringMechanics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
