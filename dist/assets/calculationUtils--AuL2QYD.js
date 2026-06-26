import{b as L}from"./index-DUW6wVZ8.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],g=L("LoaderCircle",M),m=({entryPrice:l,exitPrice:a,stopLoss:c,positionSize:p,direction:i,fee:u})=>{const t=parseFloat(l)||0,s=parseFloat(a)||0,r=parseFloat(c)||0,e=parseInt(p)||0,P=parseFloat(u)||0;if(t===0||e===0)return{pnl:0,pnlPercent:0,rMultiple:0};const n=(i==="long"?(s-t)*e:(t-s)*e)-P,d=t>0?n/(t*e)*100:0,o=(r>0?Math.abs(t-r):0)*e,F=o>0?n/o:0;return{pnl:n,pnlPercent:d,rMultiple:o>0?F.toFixed(2):null}};export{g as L,m as c};
