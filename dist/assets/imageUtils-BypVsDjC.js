import{b as u}from"./index-DUW6wVZ8.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],I=u("Image",w);async function U(o,{maxWidth:c=1200,quality:d=.82}={}){return new Promise((a,m)=>{const e=new FileReader;e.onerror=()=>m(e.error),e.onload=h=>{const n=h.target.result;if(!o.type.startsWith("image/")){a(n);return}const t=new Image;t.onerror=()=>a(n),t.onload=()=>{try{const i=t.width>c?c/t.width:1,s=Math.round(t.width*i),g=Math.round(t.height*i),r=document.createElement("canvas");r.width=s,r.height=g,r.getContext("2d").drawImage(t,0,0,s,g);const y=o.type==="image/png"?"image/png":"image/jpeg",p=r.toDataURL(y,d);a(p)}catch{a(n)}},t.src=n},e.readAsDataURL(o)})}export{I,U as i};
