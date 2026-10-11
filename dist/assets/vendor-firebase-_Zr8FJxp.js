const Ir=()=>{};var We={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vn=function(n){const t=[];let e=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?t[e++]=s:s<2048?(t[e++]=s>>6|192,t[e++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),t[e++]=s>>18|240,t[e++]=s>>12&63|128,t[e++]=s>>6&63|128,t[e++]=s&63|128):(t[e++]=s>>12|224,t[e++]=s>>6&63|128,t[e++]=s&63|128)}return t},Ar=function(n){const t=[];let e=0,r=0;for(;e<n.length;){const s=n[e++];if(s<128)t[r++]=String.fromCharCode(s);else if(s>191&&s<224){const i=n[e++];t[r++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=n[e++],o=n[e++],p=n[e++],m=((s&7)<<18|(i&63)<<12|(o&63)<<6|p&63)-65536;t[r++]=String.fromCharCode(55296+(m>>10)),t[r++]=String.fromCharCode(56320+(m&1023))}else{const i=n[e++],o=n[e++];t[r++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return t.join("")},Rn={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,t){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const e=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const i=n[s],o=s+1<n.length,p=o?n[s+1]:0,m=s+2<n.length,g=m?n[s+2]:0,y=i>>2,I=(i&3)<<4|p>>4;let A=(p&15)<<2|g>>6,v=g&63;m||(v=64,o||(A=64)),r.push(e[y],e[I],e[A],e[v])}return r.join("")},encodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(n):this.encodeByteArray(Vn(n),t)},decodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(n):Ar(this.decodeStringToByteArray(n,t))},decodeStringToByteArray(n,t){this.init_();const e=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const i=e[n.charAt(s++)],p=s<n.length?e[n.charAt(s)]:0;++s;const g=s<n.length?e[n.charAt(s)]:64;++s;const I=s<n.length?e[n.charAt(s)]:64;if(++s,i==null||p==null||g==null||I==null)throw new Tr;const A=i<<2|p>>4;if(r.push(A),g!==64){const v=p<<4&240|g>>2;if(r.push(v),I!==64){const w=g<<6&192|I;r.push(w)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Tr extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const wr=function(n){const t=Vn(n);return Rn.encodeByteArray(t,!0)},Bt=function(n){return wr(n).replace(/\./g,"")},br=function(n){try{return Rn.decodeString(n,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vr(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vr=()=>vr().__FIREBASE_DEFAULTS__,Rr=()=>{if(typeof process>"u"||typeof We>"u")return;const n=We.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Sr=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=n&&br(n[1]);return t&&JSON.parse(t)},Sn=()=>{try{return Ir()||Vr()||Rr()||Sr()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Nr=n=>{var t,e;return(e=(t=Sn())==null?void 0:t.emulatorHosts)==null?void 0:e[n]},Pr=n=>{const t=Nr(n);if(!t)return;const e=t.lastIndexOf(":");if(e<=0||e+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const r=parseInt(t.substring(e+1),10);return t[0]==="["?[t.substring(1,e-1),r]:[t.substring(0,e),r]},Nn=()=>{var n;return(n=Sn())==null?void 0:n.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dr{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,r)=>{e?this.reject(e):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(e):t(e,r))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cr(n,t){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const e={alg:"none",type:"JWT"},r=t||"demo-project",s=n.iat||0,i=n.sub||n.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Bt(JSON.stringify(e)),Bt(JSON.stringify(o)),""].join(".")}function Or(){try{return typeof indexedDB=="object"}catch{return!1}}function kr(){return new Promise((n,t)=>{try{let e=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),e||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{e=!1},s.onerror=()=>{var i;t(((i=s.error)==null?void 0:i.message)||"")}}catch(e){t(e)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fr="FirebaseError";class pt extends Error{constructor(t,e,r){super(e),this.code=t,this.customData=r,this.name=Fr,Object.setPrototypeOf(this,pt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Pn.prototype.create)}}class Pn{constructor(t,e,r){this.service=t,this.serviceName=e,this.errors=r}create(t,...e){const r=e[0]||{},s=`${this.service}/${t}`,i=this.errors[t],o=i?Mr(i,r):"Error",p=`${this.serviceName}: ${o} (${s}).`;return new pt(s,p,r)}}function Mr(n,t){return n.replace(Lr,(e,r)=>{const s=t[r];return s!=null?String(s):`<${r}?>`})}const Lr=/\{\$([^}]+)}/g;function jt(n,t){if(n===t)return!0;const e=Object.keys(n),r=Object.keys(t);for(const s of e){if(!r.includes(s))return!1;const i=n[s],o=t[s];if(Ke(i)&&Ke(o)){if(!jt(i,o))return!1}else if(i!==o)return!1}for(const s of r)if(!e.includes(s))return!1;return!0}function Ke(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function K(n){return n&&n._delegate?n._delegate:n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Dn(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Ur(n){return(await fetch(n,{credentials:"include"})).ok}class At{constructor(t,e,r){this.name=t,this.instanceFactory=e,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rt="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xr{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const r=new Dr;if(this.instancesDeferred.set(e,r),this.isInitialized(e)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:e});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(e).promise}getImmediate(t){const e=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(t==null?void 0:t.optional)??!1;if(this.isInitialized(e)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:e})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Br(t))try{this.getOrInitializeService({instanceIdentifier:rt})}catch{}for(const[e,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(e);try{const i=this.getOrInitializeService({instanceIdentifier:s});r.resolve(i)}catch{}}}}clearInstance(t=rt){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...t.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=rt){return this.instances.has(t)}getOptions(t=rt){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:e});for(const[i,o]of this.instancesDeferred.entries()){const p=this.normalizeInstanceIdentifier(i);r===p&&o.resolve(s)}return s}onInit(t,e){const r=this.normalizeInstanceIdentifier(e),s=this.onInitCallbacks.get(r)??new Set;s.add(t),this.onInitCallbacks.set(r,s);const i=this.instances.get(r);return i&&t(i,r),()=>{s.delete(t)}}invokeOnInitCallbacks(t,e){const r=this.onInitCallbacks.get(e);if(r)for(const s of r)try{s(t,e)}catch{}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:$r(t),options:e}),this.instances.set(t,r),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=rt){return this.component?this.component.multipleInstances?t:rt:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function $r(n){return n===rt?void 0:n}function Br(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jr{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new xr(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var b;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(b||(b={}));const qr={debug:b.DEBUG,verbose:b.VERBOSE,info:b.INFO,warn:b.WARN,error:b.ERROR,silent:b.SILENT},zr=b.INFO,Gr={[b.DEBUG]:"log",[b.VERBOSE]:"log",[b.INFO]:"info",[b.WARN]:"warn",[b.ERROR]:"error"},Hr=(n,t,...e)=>{if(t<n.logLevel)return;const r=new Date().toISOString(),s=Gr[t];if(s)console[s](`[${r}]  ${n.name}:`,...e);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class Cn{constructor(t){this.name=t,this._logLevel=zr,this._logHandler=Hr,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in b))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?qr[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,b.DEBUG,...t),this._logHandler(this,b.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,b.VERBOSE,...t),this._logHandler(this,b.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,b.INFO,...t),this._logHandler(this,b.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,b.WARN,...t),this._logHandler(this,b.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,b.ERROR,...t),this._logHandler(this,b.ERROR,...t)}}const Wr=(n,t)=>t.some(e=>n instanceof e);let Qe,Je;function Kr(){return Qe||(Qe=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Qr(){return Je||(Je=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const On=new WeakMap,_e=new WeakMap,kn=new WeakMap,ce=new WeakMap,Se=new WeakMap;function Jr(n){const t=new Promise((e,r)=>{const s=()=>{n.removeEventListener("success",i),n.removeEventListener("error",o)},i=()=>{e(Z(n.result)),s()},o=()=>{r(n.error),s()};n.addEventListener("success",i),n.addEventListener("error",o)});return t.then(e=>{e instanceof IDBCursor&&On.set(e,n)}).catch(()=>{}),Se.set(t,n),t}function Yr(n){if(_e.has(n))return;const t=new Promise((e,r)=>{const s=()=>{n.removeEventListener("complete",i),n.removeEventListener("error",o),n.removeEventListener("abort",o)},i=()=>{e(),s()},o=()=>{r(n.error||new DOMException("AbortError","AbortError")),s()};n.addEventListener("complete",i),n.addEventListener("error",o),n.addEventListener("abort",o)});_e.set(n,t)}let ye={get(n,t,e){if(n instanceof IDBTransaction){if(t==="done")return _e.get(n);if(t==="objectStoreNames")return n.objectStoreNames||kn.get(n);if(t==="store")return e.objectStoreNames[1]?void 0:e.objectStore(e.objectStoreNames[0])}return Z(n[t])},set(n,t,e){return n[t]=e,!0},has(n,t){return n instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in n}};function Xr(n){ye=n(ye)}function Zr(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...e){const r=n.call(he(this),t,...e);return kn.set(r,t.sort?t.sort():[t]),Z(r)}:Qr().includes(n)?function(...t){return n.apply(he(this),t),Z(On.get(this))}:function(...t){return Z(n.apply(he(this),t))}}function ts(n){return typeof n=="function"?Zr(n):(n instanceof IDBTransaction&&Yr(n),Wr(n,Kr())?new Proxy(n,ye):n)}function Z(n){if(n instanceof IDBRequest)return Jr(n);if(ce.has(n))return ce.get(n);const t=ts(n);return t!==n&&(ce.set(n,t),Se.set(t,n)),t}const he=n=>Se.get(n);function es(n,t,{blocked:e,upgrade:r,blocking:s,terminated:i}={}){const o=indexedDB.open(n,t),p=Z(o);return r&&o.addEventListener("upgradeneeded",m=>{r(Z(o.result),m.oldVersion,m.newVersion,Z(o.transaction),m)}),e&&o.addEventListener("blocked",m=>e(m.oldVersion,m.newVersion,m)),p.then(m=>{i&&m.addEventListener("close",()=>i()),s&&m.addEventListener("versionchange",g=>s(g.oldVersion,g.newVersion,g))}).catch(()=>{}),p}const ns=["get","getKey","getAll","getAllKeys","count"],rs=["put","add","delete","clear"],fe=new Map;function Ye(n,t){if(!(n instanceof IDBDatabase&&!(t in n)&&typeof t=="string"))return;if(fe.get(t))return fe.get(t);const e=t.replace(/FromIndex$/,""),r=t!==e,s=rs.includes(e);if(!(e in(r?IDBIndex:IDBObjectStore).prototype)||!(s||ns.includes(e)))return;const i=async function(o,...p){const m=this.transaction(o,s?"readwrite":"readonly");let g=m.store;return r&&(g=g.index(p.shift())),(await Promise.all([g[e](...p),s&&m.done]))[0]};return fe.set(t,i),i}Xr(n=>({...n,get:(t,e,r)=>Ye(t,e)||n.get(t,e,r),has:(t,e)=>!!Ye(t,e)||n.has(t,e)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ss{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(is(e)){const r=e.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(e=>e).join(" ")}}function is(n){const t=n.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Ee="@firebase/app",Xe="0.14.10";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const J=new Cn("@firebase/app"),os="@firebase/app-compat",as="@firebase/analytics-compat",us="@firebase/analytics",ls="@firebase/app-check-compat",cs="@firebase/app-check",hs="@firebase/auth",fs="@firebase/auth-compat",ds="@firebase/database",ps="@firebase/data-connect",ms="@firebase/database-compat",gs="@firebase/functions",_s="@firebase/functions-compat",ys="@firebase/installations",Es="@firebase/installations-compat",Is="@firebase/messaging",As="@firebase/messaging-compat",Ts="@firebase/performance",ws="@firebase/performance-compat",bs="@firebase/remote-config",vs="@firebase/remote-config-compat",Vs="@firebase/storage",Rs="@firebase/storage-compat",Ss="@firebase/firestore",Ns="@firebase/ai",Ps="@firebase/firestore-compat",Ds="firebase",Cs="12.11.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ie="[DEFAULT]",Os={[Ee]:"fire-core",[os]:"fire-core-compat",[us]:"fire-analytics",[as]:"fire-analytics-compat",[cs]:"fire-app-check",[ls]:"fire-app-check-compat",[hs]:"fire-auth",[fs]:"fire-auth-compat",[ds]:"fire-rtdb",[ps]:"fire-data-connect",[ms]:"fire-rtdb-compat",[gs]:"fire-fn",[_s]:"fire-fn-compat",[ys]:"fire-iid",[Es]:"fire-iid-compat",[Is]:"fire-fcm",[As]:"fire-fcm-compat",[Ts]:"fire-perf",[ws]:"fire-perf-compat",[bs]:"fire-rc",[vs]:"fire-rc-compat",[Vs]:"fire-gcs",[Rs]:"fire-gcs-compat",[Ss]:"fire-fst",[Ps]:"fire-fst-compat",[Ns]:"fire-vertex","fire-js":"fire-js",[Ds]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tt=new Map,ks=new Map,Ae=new Map;function Ze(n,t){try{n.container.addComponent(t)}catch(e){J.debug(`Component ${t.name} failed to register with FirebaseApp ${n.name}`,e)}}function qt(n){const t=n.name;if(Ae.has(t))return J.debug(`There were multiple attempts to register component ${t}.`),!1;Ae.set(t,n);for(const e of Tt.values())Ze(e,n);for(const e of ks.values())Ze(e,n);return!0}function Fs(n,t){const e=n.container.getProvider("heartbeat").getImmediate({optional:!0});return e&&e.triggerHeartbeat(),n.container.getProvider(t)}function Ms(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ls={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},tt=new Pn("app","Firebase",Ls);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Us{constructor(t,e,r){this._isDeleted=!1,this._options={...t},this._config={...e},this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new At("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw tt.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xs=Cs;function $s(n,t={}){let e=n;typeof t!="object"&&(t={name:t});const r={name:Ie,automaticDataCollectionEnabled:!0,...t},s=r.name;if(typeof s!="string"||!s)throw tt.create("bad-app-name",{appName:String(s)});if(e||(e=Nn()),!e)throw tt.create("no-options");const i=Tt.get(s);if(i){if(jt(e,i.options)&&jt(r,i.config))return i;throw tt.create("duplicate-app",{appName:s})}const o=new jr(s);for(const m of Ae.values())o.addComponent(m);const p=new Us(e,r,o);return Tt.set(s,p),p}function Bs(n=Ie){const t=Tt.get(n);if(!t&&n===Ie&&Nn())return $s();if(!t)throw tt.create("no-app",{appName:n});return t}function mo(){return Array.from(Tt.values())}function ht(n,t,e){let r=Os[n]??n;e&&(r+=`-${e}`);const s=r.match(/\s|\//),i=t.match(/\s|\//);if(s||i){const o=[`Unable to register library "${r}" with version "${t}":`];s&&o.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${t}" contains illegal characters (whitespace or "/")`),J.warn(o.join(" "));return}qt(new At(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const js="firebase-heartbeat-database",qs=1,wt="firebase-heartbeat-store";let de=null;function Fn(){return de||(de=es(js,qs,{upgrade:(n,t)=>{switch(t){case 0:try{n.createObjectStore(wt)}catch(e){console.warn(e)}}}}).catch(n=>{throw tt.create("idb-open",{originalErrorMessage:n.message})})),de}async function zs(n){try{const e=(await Fn()).transaction(wt),r=await e.objectStore(wt).get(Mn(n));return await e.done,r}catch(t){if(t instanceof pt)J.warn(t.message);else{const e=tt.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});J.warn(e.message)}}}async function tn(n,t){try{const r=(await Fn()).transaction(wt,"readwrite");await r.objectStore(wt).put(t,Mn(n)),await r.done}catch(e){if(e instanceof pt)J.warn(e.message);else{const r=tt.create("idb-set",{originalErrorMessage:e==null?void 0:e.message});J.warn(r.message)}}}function Mn(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gs=1024,Hs=30;class Ws{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Qs(e),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,e;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=en();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>Hs){const o=Js(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){J.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=en(),{heartbeatsToSend:r,unsentEntries:s}=Ks(this._heartbeatsCache.heartbeats),i=Bt(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=e,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(e){return J.warn(e),""}}}function en(){return new Date().toISOString().substring(0,10)}function Ks(n,t=Gs){const e=[];let r=n.slice();for(const s of n){const i=e.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),nn(e)>t){i.dates.pop();break}}else if(e.push({agent:s.agent,dates:[s.date]}),nn(e)>t){e.pop();break}r=r.slice(1)}return{heartbeatsToSend:e,unsentEntries:r}}class Qs{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Or()?kr().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const e=await zs(this.app);return e!=null&&e.heartbeats?e:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return tn(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return tn(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function nn(n){return Bt(JSON.stringify({version:2,heartbeats:n})).length}function Js(n){if(n.length===0)return-1;let t=0,e=n[0].date;for(let r=1;r<n.length;r++)n[r].date<e&&(e=n[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ys(n){qt(new At("platform-logger",t=>new ss(t),"PRIVATE")),qt(new At("heartbeat",t=>new Ws(t),"PRIVATE")),ht(Ee,Xe,n),ht(Ee,Xe,"esm2020"),ht("fire-js","")}Ys("");var Xs="firebase",Zs="12.11.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ht(Xs,Zs,"app");var rn=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ln;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(c,a){function l(){}l.prototype=a.prototype,c.F=a.prototype,c.prototype=new l,c.prototype.constructor=c,c.D=function(f,h,d){for(var u=Array(arguments.length-2),nt=2;nt<arguments.length;nt++)u[nt-2]=arguments[nt];return a.prototype[h].apply(f,u)}}function e(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}t(r,e),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(c,a,l){l||(l=0);const f=Array(16);if(typeof a=="string")for(var h=0;h<16;++h)f[h]=a.charCodeAt(l++)|a.charCodeAt(l++)<<8|a.charCodeAt(l++)<<16|a.charCodeAt(l++)<<24;else for(h=0;h<16;++h)f[h]=a[l++]|a[l++]<<8|a[l++]<<16|a[l++]<<24;a=c.g[0],l=c.g[1],h=c.g[2];let d=c.g[3],u;u=a+(d^l&(h^d))+f[0]+3614090360&4294967295,a=l+(u<<7&4294967295|u>>>25),u=d+(h^a&(l^h))+f[1]+3905402710&4294967295,d=a+(u<<12&4294967295|u>>>20),u=h+(l^d&(a^l))+f[2]+606105819&4294967295,h=d+(u<<17&4294967295|u>>>15),u=l+(a^h&(d^a))+f[3]+3250441966&4294967295,l=h+(u<<22&4294967295|u>>>10),u=a+(d^l&(h^d))+f[4]+4118548399&4294967295,a=l+(u<<7&4294967295|u>>>25),u=d+(h^a&(l^h))+f[5]+1200080426&4294967295,d=a+(u<<12&4294967295|u>>>20),u=h+(l^d&(a^l))+f[6]+2821735955&4294967295,h=d+(u<<17&4294967295|u>>>15),u=l+(a^h&(d^a))+f[7]+4249261313&4294967295,l=h+(u<<22&4294967295|u>>>10),u=a+(d^l&(h^d))+f[8]+1770035416&4294967295,a=l+(u<<7&4294967295|u>>>25),u=d+(h^a&(l^h))+f[9]+2336552879&4294967295,d=a+(u<<12&4294967295|u>>>20),u=h+(l^d&(a^l))+f[10]+4294925233&4294967295,h=d+(u<<17&4294967295|u>>>15),u=l+(a^h&(d^a))+f[11]+2304563134&4294967295,l=h+(u<<22&4294967295|u>>>10),u=a+(d^l&(h^d))+f[12]+1804603682&4294967295,a=l+(u<<7&4294967295|u>>>25),u=d+(h^a&(l^h))+f[13]+4254626195&4294967295,d=a+(u<<12&4294967295|u>>>20),u=h+(l^d&(a^l))+f[14]+2792965006&4294967295,h=d+(u<<17&4294967295|u>>>15),u=l+(a^h&(d^a))+f[15]+1236535329&4294967295,l=h+(u<<22&4294967295|u>>>10),u=a+(h^d&(l^h))+f[1]+4129170786&4294967295,a=l+(u<<5&4294967295|u>>>27),u=d+(l^h&(a^l))+f[6]+3225465664&4294967295,d=a+(u<<9&4294967295|u>>>23),u=h+(a^l&(d^a))+f[11]+643717713&4294967295,h=d+(u<<14&4294967295|u>>>18),u=l+(d^a&(h^d))+f[0]+3921069994&4294967295,l=h+(u<<20&4294967295|u>>>12),u=a+(h^d&(l^h))+f[5]+3593408605&4294967295,a=l+(u<<5&4294967295|u>>>27),u=d+(l^h&(a^l))+f[10]+38016083&4294967295,d=a+(u<<9&4294967295|u>>>23),u=h+(a^l&(d^a))+f[15]+3634488961&4294967295,h=d+(u<<14&4294967295|u>>>18),u=l+(d^a&(h^d))+f[4]+3889429448&4294967295,l=h+(u<<20&4294967295|u>>>12),u=a+(h^d&(l^h))+f[9]+568446438&4294967295,a=l+(u<<5&4294967295|u>>>27),u=d+(l^h&(a^l))+f[14]+3275163606&4294967295,d=a+(u<<9&4294967295|u>>>23),u=h+(a^l&(d^a))+f[3]+4107603335&4294967295,h=d+(u<<14&4294967295|u>>>18),u=l+(d^a&(h^d))+f[8]+1163531501&4294967295,l=h+(u<<20&4294967295|u>>>12),u=a+(h^d&(l^h))+f[13]+2850285829&4294967295,a=l+(u<<5&4294967295|u>>>27),u=d+(l^h&(a^l))+f[2]+4243563512&4294967295,d=a+(u<<9&4294967295|u>>>23),u=h+(a^l&(d^a))+f[7]+1735328473&4294967295,h=d+(u<<14&4294967295|u>>>18),u=l+(d^a&(h^d))+f[12]+2368359562&4294967295,l=h+(u<<20&4294967295|u>>>12),u=a+(l^h^d)+f[5]+4294588738&4294967295,a=l+(u<<4&4294967295|u>>>28),u=d+(a^l^h)+f[8]+2272392833&4294967295,d=a+(u<<11&4294967295|u>>>21),u=h+(d^a^l)+f[11]+1839030562&4294967295,h=d+(u<<16&4294967295|u>>>16),u=l+(h^d^a)+f[14]+4259657740&4294967295,l=h+(u<<23&4294967295|u>>>9),u=a+(l^h^d)+f[1]+2763975236&4294967295,a=l+(u<<4&4294967295|u>>>28),u=d+(a^l^h)+f[4]+1272893353&4294967295,d=a+(u<<11&4294967295|u>>>21),u=h+(d^a^l)+f[7]+4139469664&4294967295,h=d+(u<<16&4294967295|u>>>16),u=l+(h^d^a)+f[10]+3200236656&4294967295,l=h+(u<<23&4294967295|u>>>9),u=a+(l^h^d)+f[13]+681279174&4294967295,a=l+(u<<4&4294967295|u>>>28),u=d+(a^l^h)+f[0]+3936430074&4294967295,d=a+(u<<11&4294967295|u>>>21),u=h+(d^a^l)+f[3]+3572445317&4294967295,h=d+(u<<16&4294967295|u>>>16),u=l+(h^d^a)+f[6]+76029189&4294967295,l=h+(u<<23&4294967295|u>>>9),u=a+(l^h^d)+f[9]+3654602809&4294967295,a=l+(u<<4&4294967295|u>>>28),u=d+(a^l^h)+f[12]+3873151461&4294967295,d=a+(u<<11&4294967295|u>>>21),u=h+(d^a^l)+f[15]+530742520&4294967295,h=d+(u<<16&4294967295|u>>>16),u=l+(h^d^a)+f[2]+3299628645&4294967295,l=h+(u<<23&4294967295|u>>>9),u=a+(h^(l|~d))+f[0]+4096336452&4294967295,a=l+(u<<6&4294967295|u>>>26),u=d+(l^(a|~h))+f[7]+1126891415&4294967295,d=a+(u<<10&4294967295|u>>>22),u=h+(a^(d|~l))+f[14]+2878612391&4294967295,h=d+(u<<15&4294967295|u>>>17),u=l+(d^(h|~a))+f[5]+4237533241&4294967295,l=h+(u<<21&4294967295|u>>>11),u=a+(h^(l|~d))+f[12]+1700485571&4294967295,a=l+(u<<6&4294967295|u>>>26),u=d+(l^(a|~h))+f[3]+2399980690&4294967295,d=a+(u<<10&4294967295|u>>>22),u=h+(a^(d|~l))+f[10]+4293915773&4294967295,h=d+(u<<15&4294967295|u>>>17),u=l+(d^(h|~a))+f[1]+2240044497&4294967295,l=h+(u<<21&4294967295|u>>>11),u=a+(h^(l|~d))+f[8]+1873313359&4294967295,a=l+(u<<6&4294967295|u>>>26),u=d+(l^(a|~h))+f[15]+4264355552&4294967295,d=a+(u<<10&4294967295|u>>>22),u=h+(a^(d|~l))+f[6]+2734768916&4294967295,h=d+(u<<15&4294967295|u>>>17),u=l+(d^(h|~a))+f[13]+1309151649&4294967295,l=h+(u<<21&4294967295|u>>>11),u=a+(h^(l|~d))+f[4]+4149444226&4294967295,a=l+(u<<6&4294967295|u>>>26),u=d+(l^(a|~h))+f[11]+3174756917&4294967295,d=a+(u<<10&4294967295|u>>>22),u=h+(a^(d|~l))+f[2]+718787259&4294967295,h=d+(u<<15&4294967295|u>>>17),u=l+(d^(h|~a))+f[9]+3951481745&4294967295,c.g[0]=c.g[0]+a&4294967295,c.g[1]=c.g[1]+(h+(u<<21&4294967295|u>>>11))&4294967295,c.g[2]=c.g[2]+h&4294967295,c.g[3]=c.g[3]+d&4294967295}r.prototype.v=function(c,a){a===void 0&&(a=c.length);const l=a-this.blockSize,f=this.C;let h=this.h,d=0;for(;d<a;){if(h==0)for(;d<=l;)s(this,c,d),d+=this.blockSize;if(typeof c=="string"){for(;d<a;)if(f[h++]=c.charCodeAt(d++),h==this.blockSize){s(this,f),h=0;break}}else for(;d<a;)if(f[h++]=c[d++],h==this.blockSize){s(this,f),h=0;break}}this.h=h,this.o+=a},r.prototype.A=function(){var c=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);c[0]=128;for(var a=1;a<c.length-8;++a)c[a]=0;a=this.o*8;for(var l=c.length-8;l<c.length;++l)c[l]=a&255,a/=256;for(this.v(c),c=Array(16),a=0,l=0;l<4;++l)for(let f=0;f<32;f+=8)c[a++]=this.g[l]>>>f&255;return c};function i(c,a){var l=p;return Object.prototype.hasOwnProperty.call(l,c)?l[c]:l[c]=a(c)}function o(c,a){this.h=a;const l=[];let f=!0;for(let h=c.length-1;h>=0;h--){const d=c[h]|0;f&&d==a||(l[h]=d,f=!1)}this.g=l}var p={};function m(c){return-128<=c&&c<128?i(c,function(a){return new o([a|0],a<0?-1:0)}):new o([c|0],c<0?-1:0)}function g(c){if(isNaN(c)||!isFinite(c))return I;if(c<0)return R(g(-c));const a=[];let l=1;for(let f=0;c>=l;f++)a[f]=c/l|0,l*=4294967296;return new o(a,0)}function y(c,a){if(c.length==0)throw Error("number format error: empty string");if(a=a||10,a<2||36<a)throw Error("radix out of range: "+a);if(c.charAt(0)=="-")return R(y(c.substring(1),a));if(c.indexOf("-")>=0)throw Error('number format error: interior "-" character');const l=g(Math.pow(a,8));let f=I;for(let d=0;d<c.length;d+=8){var h=Math.min(8,c.length-d);const u=parseInt(c.substring(d,d+h),a);h<8?(h=g(Math.pow(a,h)),f=f.j(h).add(g(u))):(f=f.j(l),f=f.add(g(u)))}return f}var I=m(0),A=m(1),v=m(16777216);n=o.prototype,n.m=function(){if(V(this))return-R(this).m();let c=0,a=1;for(let l=0;l<this.g.length;l++){const f=this.i(l);c+=(f>=0?f:4294967296+f)*a,a*=4294967296}return c},n.toString=function(c){if(c=c||10,c<2||36<c)throw Error("radix out of range: "+c);if(w(this))return"0";if(V(this))return"-"+R(this).toString(c);const a=g(Math.pow(c,6));var l=this;let f="";for(;;){const h=Lt(l,a).g;l=ut(l,h.j(a));let d=((l.g.length>0?l.g[0]:l.h)>>>0).toString(c);if(l=h,w(l))return d+f;for(;d.length<6;)d="0"+d;f=d+f}},n.i=function(c){return c<0?0:c<this.g.length?this.g[c]:this.h};function w(c){if(c.h!=0)return!1;for(let a=0;a<c.g.length;a++)if(c.g[a]!=0)return!1;return!0}function V(c){return c.h==-1}n.l=function(c){return c=ut(this,c),V(c)?-1:w(c)?0:1};function R(c){const a=c.g.length,l=[];for(let f=0;f<a;f++)l[f]=~c.g[f];return new o(l,~c.h).add(A)}n.abs=function(){return V(this)?R(this):this},n.add=function(c){const a=Math.max(this.g.length,c.g.length),l=[];let f=0;for(let h=0;h<=a;h++){let d=f+(this.i(h)&65535)+(c.i(h)&65535),u=(d>>>16)+(this.i(h)>>>16)+(c.i(h)>>>16);f=u>>>16,d&=65535,u&=65535,l[h]=u<<16|d}return new o(l,l[l.length-1]&-2147483648?-1:0)};function ut(c,a){return c.add(R(a))}n.j=function(c){if(w(this)||w(c))return I;if(V(this))return V(c)?R(this).j(R(c)):R(R(this).j(c));if(V(c))return R(this.j(R(c)));if(this.l(v)<0&&c.l(v)<0)return g(this.m()*c.m());const a=this.g.length+c.g.length,l=[];for(var f=0;f<2*a;f++)l[f]=0;for(f=0;f<this.g.length;f++)for(let h=0;h<c.g.length;h++){const d=this.i(f)>>>16,u=this.i(f)&65535,nt=c.i(h)>>>16,He=c.i(h)&65535;l[2*f+2*h]+=u*He,Mt(l,2*f+2*h),l[2*f+2*h+1]+=d*He,Mt(l,2*f+2*h+1),l[2*f+2*h+1]+=u*nt,Mt(l,2*f+2*h+1),l[2*f+2*h+2]+=d*nt,Mt(l,2*f+2*h+2)}for(c=0;c<a;c++)l[c]=l[2*c+1]<<16|l[2*c];for(c=a;c<2*a;c++)l[c]=0;return new o(l,0)};function Mt(c,a){for(;(c[a]&65535)!=c[a];)c[a+1]+=c[a]>>>16,c[a]&=65535,a++}function _t(c,a){this.g=c,this.h=a}function Lt(c,a){if(w(a))throw Error("division by zero");if(w(c))return new _t(I,I);if(V(c))return a=Lt(R(c),a),new _t(R(a.g),R(a.h));if(V(a))return a=Lt(c,R(a)),new _t(R(a.g),a.h);if(c.g.length>30){if(V(c)||V(a))throw Error("slowDivide_ only works with positive integers.");for(var l=A,f=a;f.l(c)<=0;)l=Ge(l),f=Ge(f);var h=lt(l,1),d=lt(f,1);for(f=lt(f,2),l=lt(l,2);!w(f);){var u=d.add(f);u.l(c)<=0&&(h=h.add(l),d=u),f=lt(f,1),l=lt(l,1)}return a=ut(c,h.j(a)),new _t(h,a)}for(h=I;c.l(a)>=0;){for(l=Math.max(1,Math.floor(c.m()/a.m())),f=Math.ceil(Math.log(l)/Math.LN2),f=f<=48?1:Math.pow(2,f-48),d=g(l),u=d.j(a);V(u)||u.l(c)>0;)l-=f,d=g(l),u=d.j(a);w(d)&&(d=A),h=h.add(d),c=ut(c,u)}return new _t(h,c)}n.B=function(c){return Lt(this,c).h},n.and=function(c){const a=Math.max(this.g.length,c.g.length),l=[];for(let f=0;f<a;f++)l[f]=this.i(f)&c.i(f);return new o(l,this.h&c.h)},n.or=function(c){const a=Math.max(this.g.length,c.g.length),l=[];for(let f=0;f<a;f++)l[f]=this.i(f)|c.i(f);return new o(l,this.h|c.h)},n.xor=function(c){const a=Math.max(this.g.length,c.g.length),l=[];for(let f=0;f<a;f++)l[f]=this.i(f)^c.i(f);return new o(l,this.h^c.h)};function Ge(c){const a=c.g.length+1,l=[];for(let f=0;f<a;f++)l[f]=c.i(f)<<1|c.i(f-1)>>>31;return new o(l,c.h)}function lt(c,a){const l=a>>5;a%=32;const f=c.g.length-l,h=[];for(let d=0;d<f;d++)h[d]=a>0?c.i(d+l)>>>a|c.i(d+l+1)<<32-a:c.i(d+l);return new o(h,c.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=g,o.fromString=y,Ln=o}).apply(typeof rn<"u"?rn:typeof self<"u"?self:typeof window<"u"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class L{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}L.UNAUTHENTICATED=new L(null),L.GOOGLE_CREDENTIALS=new L("google-credentials-uid"),L.FIRST_PARTY=new L("first-party-uid"),L.MOCK_USER=new L("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let mt="12.11.0";function ti(n){mt=n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ft=new Cn("@firebase/firestore");function zt(n,...t){if(ft.logLevel<=b.DEBUG){const e=t.map(Pe);ft.debug(`Firestore (${mt}): ${n}`,...e)}}function Ne(n,...t){if(ft.logLevel<=b.ERROR){const e=t.map(Pe);ft.error(`Firestore (${mt}): ${n}`,...e)}}function Un(n,...t){if(ft.logLevel<=b.WARN){const e=t.map(Pe);ft.warn(`Firestore (${mt}): ${n}`,...e)}}function Pe(n){if(typeof n=="string")return n;try{return(function(e){return JSON.stringify(e)})(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function N(n,t,e){let r="Unexpected state";typeof t=="string"?r=t:e=t,xn(n,r,e)}function xn(n,t,e){let r=`FIRESTORE (${mt}) INTERNAL ASSERTION FAILED: ${t} (ID: ${n.toString(16)})`;if(e!==void 0)try{r+=" CONTEXT: "+JSON.stringify(e)}catch{r+=" CONTEXT: "+e}throw Ne(r),new Error(r)}function $(n,t,e,r){let s="Unexpected state";typeof e=="string"?s=e:r=e,n||xn(t,s,r)}function Nt(n,t){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable"};class E extends pt{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $n{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class ei{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable((()=>e(L.UNAUTHENTICATED)))}shutdown(){}}class ni{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable((()=>e(this.token.user)))}shutdown(){this.changeListener=null}}class ri{constructor(t){this.auth=null,t.onInit((e=>{this.auth=e}))}getToken(){return this.auth?this.auth.getToken().then((t=>t?($(typeof t.accessToken=="string",42297,{t}),new $n(t.accessToken,new L(this.auth.getUid()))):null)):Promise.resolve(null)}invalidateToken(){}start(t,e){}shutdown(){}}class si{constructor(t,e,r){this.i=t,this.o=e,this.u=r,this.type="FirstParty",this.user=L.FIRST_PARTY,this.l=new Map}h(){return this.u?this.u():null}get headers(){this.l.set("X-Goog-AuthUser",this.i);const t=this.h();return t&&this.l.set("Authorization",t),this.o&&this.l.set("X-Goog-Iam-Authorization-Token",this.o),this.l}}class ii{constructor(t,e,r){this.i=t,this.o=e,this.u=r}getToken(){return Promise.resolve(new si(this.i,this.o,this.u))}start(t,e){t.enqueueRetryable((()=>e(L.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class sn{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class oi{constructor(t,e){this.m=e,this.appCheck=null,this.P=null,Ms(t)&&t.settings.appCheckToken&&(this.P=t.settings.appCheckToken),e.onInit((r=>{this.appCheck=r}))}getToken(){return this.P?Promise.resolve(new sn(this.P)):this.appCheck?this.appCheck.getToken().then((t=>t?($(typeof t.token=="string",3470,{tokenResult:t}),new sn(t.token)):null)):Promise.resolve(null)}invalidateToken(){}start(t,e){}shutdown(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ai{constructor(t,e,r,s,i,o,p,m,g,y,I){this.databaseId=t,this.appId=e,this.persistenceKey=r,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=p,this.longPollingOptions=m,this.useFetchStreams=g,this.isUsingEmulator=y,this.apiKey=I}}const Te="(default)";class bt{constructor(t,e){this.projectId=t,this.database=e||Te}static empty(){return new bt("","")}get isDefaultDatabase(){return this.database===Te}isEqual(t){return t instanceof bt&&t.projectId===this.projectId&&t.database===this.database}}function ui(n,t){if(!Object.prototype.hasOwnProperty.apply(n.options,["projectId"]))throw new E(_.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new bt(n.options.projectId,t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function li(n){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(n);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let r=0;r<n;r++)e[r]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ci{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const s=li(40);for(let i=0;i<s.length;++i)r.length<20&&s[i]<e&&(r+=t.charAt(s[i]%62))}return r}}function D(n,t){return n<t?-1:n>t?1:0}function we(n,t){const e=Math.min(n.length,t.length);for(let r=0;r<e;r++){const s=n.charAt(r),i=t.charAt(r);if(s!==i)return pe(s)===pe(i)?D(s,i):pe(s)?1:-1}return D(n.length,t.length)}const hi=55296,fi=57343;function pe(n){const t=n.charCodeAt(0);return t>=hi&&t<=fi}function Bn(n,t,e){return n.length===t.length&&n.every(((r,s)=>e(r,t[s])))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const on="__name__";class G{constructor(t,e,r){e===void 0?e=0:e>t.length&&N(637,{offset:e,range:t.length}),r===void 0?r=t.length-e:r>t.length-e&&N(1746,{length:r,range:t.length-e}),this.segments=t,this.offset=e,this.len=r}get length(){return this.len}isEqual(t){return G.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof G?t.forEach((r=>{e.push(r)})):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,r=this.limit();e<r;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const r=Math.min(t.length,e.length);for(let s=0;s<r;s++){const i=G.compareSegments(t.get(s),e.get(s));if(i!==0)return i}return D(t.length,e.length)}static compareSegments(t,e){const r=G.isNumericId(t),s=G.isNumericId(e);return r&&!s?-1:!r&&s?1:r&&s?G.extractNumericId(t).compare(G.extractNumericId(e)):we(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return Ln.fromString(t.substring(4,t.length-2))}}class S extends G{construct(t,e,r){return new S(t,e,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const r of t){if(r.indexOf("//")>=0)throw new E(_.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);e.push(...r.split("/").filter((s=>s.length>0)))}return new S(e)}static emptyPath(){return new S([])}}const di=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class U extends G{construct(t,e,r){return new U(t,e,r)}static isValidIdentifier(t){return di.test(t)}canonicalString(){return this.toArray().map((t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),U.isValidIdentifier(t)||(t="`"+t+"`"),t))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===on}static keyField(){return new U([on])}static fromServerFormat(t){const e=[];let r="",s=0;const i=()=>{if(r.length===0)throw new E(_.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(r),r=""};let o=!1;for(;s<t.length;){const p=t[s];if(p==="\\"){if(s+1===t.length)throw new E(_.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const m=t[s+1];if(m!=="\\"&&m!=="."&&m!=="`")throw new E(_.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);r+=m,s+=2}else p==="`"?(o=!o,s++):p!=="."||o?(r+=p,s++):(i(),s++)}if(i(),o)throw new E(_.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new U(e)}static emptyPath(){return new U([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class O{constructor(t){this.path=t}static fromPath(t){return new O(S.fromString(t))}static fromName(t){return new O(S.fromString(t).popFirst(5))}static empty(){return new O(S.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&S.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return S.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new O(new S(t.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jn(n,t,e){if(!e)throw new E(_.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${t}.`)}function an(n){if(!O.isDocumentKey(n))throw new E(_.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function un(n){if(O.isDocumentKey(n))throw new E(_.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function qn(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function ee(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const t=(function(r){return r.constructor?r.constructor.name:null})(n);return t?`a custom ${t} object`:"an object"}}return typeof n=="function"?"a function":N(12329,{type:typeof n})}function at(n,t){if("_delegate"in n&&(n=n._delegate),!(n instanceof t)){if(t.name===n.constructor.name)throw new E(_.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=ee(n);throw new E(_.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return n}function pi(n,t){if(t<=0)throw new E(_.INVALID_ARGUMENT,`Function ${n}() requires a positive number, but it was: ${t}.`)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zn(n){const t={};return n.timeoutSeconds!==void 0&&(t.timeoutSeconds=n.timeoutSeconds),t}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ut=null;function mi(){return Ut===null?Ut=(function(){return 268435456+Math.round(2147483648*Math.random())})():Ut++,"0x"+Ut.toString(16)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gi(n){return n==null}function Gt(n){return n===0&&1/n==-1/0}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const me="RestConnection",_i={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class yi{get T(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.R=e+"://"+t.host,this.V=`projects/${r}/databases/${s}`,this.A=this.databaseId.database===Te?`project_id=${r}`:`project_id=${r}&database_id=${s}`}I(t,e,r,s,i){const o=mi(),p=this.p(t,e.toUriEncodedString());zt(me,`Sending RPC '${t}' ${o}:`,p,r);const m={"google-cloud-resource-prefix":this.V,"x-goog-request-params":this.A};this.F(m,s,i);const{host:g}=new URL(p),y=Dn(g);return this.v(t,p,m,r,y).then((I=>(zt(me,`Received RPC '${t}' ${o}: `,I),I)),(I=>{throw Un(me,`RPC '${t}' ${o} failed with error: `,I,"url: ",p,"request:",r),I}))}D(t,e,r,s,i,o){return this.I(t,e,r,s,i)}F(t,e,r){t["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+mt})(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach(((s,i)=>t[i]=s)),r&&r.headers.forEach(((s,i)=>t[i]=s))}p(t,e){const r=_i[t];let s=`${this.R}/v1/${e}:${r}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ln,T;function cn(n){if(n===void 0)return Ne("RPC_ERROR","HTTP error has no status"),_.UNKNOWN;switch(n){case 200:return _.OK;case 400:return _.FAILED_PRECONDITION;case 401:return _.UNAUTHENTICATED;case 403:return _.PERMISSION_DENIED;case 404:return _.NOT_FOUND;case 409:return _.ABORTED;case 416:return _.OUT_OF_RANGE;case 429:return _.RESOURCE_EXHAUSTED;case 499:return _.CANCELLED;case 500:return _.UNKNOWN;case 501:return _.UNIMPLEMENTED;case 503:return _.UNAVAILABLE;case 504:return _.DEADLINE_EXCEEDED;default:return n>=200&&n<300?_.OK:n>=400&&n<500?_.FAILED_PRECONDITION:n>=500&&n<600?_.INTERNAL:_.UNKNOWN}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(T=ln||(ln={}))[T.OK=0]="OK",T[T.CANCELLED=1]="CANCELLED",T[T.UNKNOWN=2]="UNKNOWN",T[T.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",T[T.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",T[T.NOT_FOUND=5]="NOT_FOUND",T[T.ALREADY_EXISTS=6]="ALREADY_EXISTS",T[T.PERMISSION_DENIED=7]="PERMISSION_DENIED",T[T.UNAUTHENTICATED=16]="UNAUTHENTICATED",T[T.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",T[T.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",T[T.ABORTED=10]="ABORTED",T[T.OUT_OF_RANGE=11]="OUT_OF_RANGE",T[T.UNIMPLEMENTED=12]="UNIMPLEMENTED",T[T.INTERNAL=13]="INTERNAL",T[T.UNAVAILABLE=14]="UNAVAILABLE",T[T.DATA_LOSS=15]="DATA_LOSS";class Ei extends yi{S(t,e){throw new Error("Not supported by FetchConnection")}async v(t,e,r,s,i){var m;const o=JSON.stringify(s);let p;try{const g={method:"POST",headers:r,body:o};i&&(g.credentials="include"),p=await fetch(e,g)}catch(g){const y=g;throw new E(cn(y.status),"Request failed with error: "+y.statusText)}if(!p.ok){let g=await p.json();Array.isArray(g)&&(g=g[0]);const y=(m=g==null?void 0:g.error)==null?void 0:m.message;throw new E(cn(p.status),`Request failed with error: ${y??p.statusText}`)}return p.json()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hn(n){let t=0;for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t++;return t}function Pt(n,t){for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t(e,n[e])}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ii extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Y{constructor(t){this.binaryString=t}static fromBase64String(t){const e=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Ii("Invalid base64 string: "+i):i}})(t);return new Y(e)}static fromUint8Array(t){const e=(function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i})(t);return new Y(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(e){return btoa(e)})(this.binaryString)}toUint8Array(){return(function(e){const r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return D(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}Y.EMPTY_BYTE_STRING=new Y("");const Ai=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function st(n){if($(!!n,39018),typeof n=="string"){let t=0;const e=Ai.exec(n);if($(!!e,46558,{timestamp:n}),e[1]){let s=e[1];s=(s+"000000000").substr(0,9),t=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:t}}return{seconds:C(n.seconds),nanos:C(n.nanos)}}function C(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function vt(n){return typeof n=="string"?Y.fromBase64String(n):Y.fromUint8Array(n)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function j(n,t){const e={typeString:n};return t&&(e.value=t),e}function Dt(n,t){if(!qn(n))throw new E(_.INVALID_ARGUMENT,"JSON must be an object");let e;for(const r in t)if(t[r]){const s=t[r].typeString,i="value"in t[r]?{value:t[r].value}:void 0;if(!(r in n)){e=`JSON missing required field: '${r}'`;break}const o=n[r];if(s&&typeof o!==s){e=`JSON field '${r}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){e=`Expected '${r}' field to equal '${i.value}'`;break}}if(e)throw new E(_.INVALID_ARGUMENT,e);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fn=-62135596800,dn=1e6;class k{static now(){return k.fromMillis(Date.now())}static fromDate(t){return k.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),r=Math.floor((t-1e3*e)*dn);return new k(e,r)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new E(_.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new E(_.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<fn)throw new E(_.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new E(_.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/dn}_compareTo(t){return this.seconds===t.seconds?D(this.nanoseconds,t.nanoseconds):D(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:k._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(Dt(t,k._jsonSchema))return new k(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-fn;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}k._jsonSchemaVersion="firestore/timestamp/1.0",k._jsonSchema={type:j("string",k._jsonSchemaVersion),seconds:j("number"),nanoseconds:j("number")};function De(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{}).__type__)==null?void 0:r.stringValue)==="server_timestamp"}function Gn(n){const t=n.mapValue.fields.__previous_value__;return De(t)?Gn(t):t}function Vt(n){const t=st(n.mapValue.fields.__local_write_time__.timestampValue);return new k(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hn="__type__",Ti="__max__",xt={},Wn="__vector__",Ht="value";function it(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?De(n)?4:(function(e){return(((e.mapValue||{}).fields||{}).__type__||{}).stringValue===Ti})(n)?9007199254740991:(function(e){var s,i;return((i=(((s=e==null?void 0:e.mapValue)==null?void 0:s.fields)||{})[Hn])==null?void 0:i.stringValue)===Wn})(n)?10:11:N(28295,{value:n})}function Wt(n,t){if(n===t)return!0;const e=it(n);if(e!==it(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===t.booleanValue;case 4:return Vt(n).isEqual(Vt(t));case 3:return(function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const o=st(s.timestampValue),p=st(i.timestampValue);return o.seconds===p.seconds&&o.nanos===p.nanos})(n,t);case 5:return n.stringValue===t.stringValue;case 6:return(function(s,i){return vt(s.bytesValue).isEqual(vt(i.bytesValue))})(n,t);case 7:return n.referenceValue===t.referenceValue;case 8:return(function(s,i){return C(s.geoPointValue.latitude)===C(i.geoPointValue.latitude)&&C(s.geoPointValue.longitude)===C(i.geoPointValue.longitude)})(n,t);case 2:return(function(s,i){if("integerValue"in s&&"integerValue"in i)return C(s.integerValue)===C(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const o=C(s.doubleValue),p=C(i.doubleValue);return o===p?Gt(o)===Gt(p):isNaN(o)&&isNaN(p)}return!1})(n,t);case 9:return Bn(n.arrayValue.values||[],t.arrayValue.values||[],Wt);case 10:case 11:return(function(s,i){const o=s.mapValue.fields||{},p=i.mapValue.fields||{};if(hn(o)!==hn(p))return!1;for(const m in o)if(o.hasOwnProperty(m)&&(p[m]===void 0||!Wt(o[m],p[m])))return!1;return!0})(n,t);default:return N(52216,{left:n})}}function Rt(n,t){return(n.values||[]).find((e=>Wt(e,t)))!==void 0}function Kt(n,t){if(n===t)return 0;const e=it(n),r=it(t);if(e!==r)return D(e,r);switch(e){case 0:case 9007199254740991:return 0;case 1:return D(n.booleanValue,t.booleanValue);case 2:return(function(i,o){const p=C(i.integerValue||i.doubleValue),m=C(o.integerValue||o.doubleValue);return p<m?-1:p>m?1:p===m?0:isNaN(p)?isNaN(m)?0:-1:1})(n,t);case 3:return pn(n.timestampValue,t.timestampValue);case 4:return pn(Vt(n),Vt(t));case 5:return we(n.stringValue,t.stringValue);case 6:return(function(i,o){const p=vt(i),m=vt(o);return p.compareTo(m)})(n.bytesValue,t.bytesValue);case 7:return(function(i,o){const p=i.split("/"),m=o.split("/");for(let g=0;g<p.length&&g<m.length;g++){const y=D(p[g],m[g]);if(y!==0)return y}return D(p.length,m.length)})(n.referenceValue,t.referenceValue);case 8:return(function(i,o){const p=D(C(i.latitude),C(o.latitude));return p!==0?p:D(C(i.longitude),C(o.longitude))})(n.geoPointValue,t.geoPointValue);case 9:return mn(n.arrayValue,t.arrayValue);case 10:return(function(i,o){var A,v,w,V;const p=i.fields||{},m=o.fields||{},g=(A=p[Ht])==null?void 0:A.arrayValue,y=(v=m[Ht])==null?void 0:v.arrayValue,I=D(((w=g==null?void 0:g.values)==null?void 0:w.length)||0,((V=y==null?void 0:y.values)==null?void 0:V.length)||0);return I!==0?I:mn(g,y)})(n.mapValue,t.mapValue);case 11:return(function(i,o){if(i===xt&&o===xt)return 0;if(i===xt)return 1;if(o===xt)return-1;const p=i.fields||{},m=Object.keys(p),g=o.fields||{},y=Object.keys(g);m.sort(),y.sort();for(let I=0;I<m.length&&I<y.length;++I){const A=we(m[I],y[I]);if(A!==0)return A;const v=Kt(p[m[I]],g[y[I]]);if(v!==0)return v}return D(m.length,y.length)})(n.mapValue,t.mapValue);default:throw N(23264,{C:e})}}function pn(n,t){if(typeof n=="string"&&typeof t=="string"&&n.length===t.length)return D(n,t);const e=st(n),r=st(t),s=D(e.seconds,r.seconds);return s!==0?s:D(e.nanos,r.nanos)}function mn(n,t){const e=n.values||[],r=t.values||[];for(let s=0;s<e.length&&s<r.length;++s){const i=Kt(e[s],r[s]);if(i)return i}return D(e.length,r.length)}function Qt(n,t){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${t.path.canonicalString()}`}}function Kn(n){return!!n&&"arrayValue"in n}function gn(n){return!!n&&"nullValue"in n}function _n(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function ge(n){return!!n&&"mapValue"in n}function yt(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const t={mapValue:{fields:{}}};return Pt(n.mapValue.fields,((e,r)=>t.mapValue.fields[e]=yt(r))),t}if(n.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(n.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=yt(n.arrayValue.values[e]);return t}return{...n}}class Jt{constructor(t,e){this.position=t,this.inclusive=e}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qn{}class z extends Qn{constructor(t,e,r){super(),this.field=t,this.op=e,this.value=r}static create(t,e,r){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,r):new wi(t,e,r):e==="array-contains"?new Vi(t,r):e==="in"?new Ri(t,r):e==="not-in"?new Si(t,r):e==="array-contains-any"?new Ni(t,r):new z(t,e,r)}static createKeyFieldInFilter(t,e,r){return e==="in"?new bi(t,r):new vi(t,r)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison(Kt(e,this.value)):e!==null&&it(this.value)===it(e)&&this.matchesComparison(Kt(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return N(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Ct extends Qn{constructor(t,e){super(),this.filters=t,this.op=e,this.N=null}static create(t,e){return new Ct(t,e)}matches(t){return(function(r){return r.op==="and"})(this)?this.filters.find((e=>!e.matches(t)))===void 0:this.filters.find((e=>e.matches(t)))!==void 0}getFlattenedFilters(){return this.N!==null||(this.N=this.filters.reduce(((t,e)=>t.concat(e.getFlattenedFilters())),[])),this.N}getFilters(){return Object.assign([],this.filters)}}class wi extends z{constructor(t,e,r){super(t,e,r),this.key=O.fromName(r.referenceValue)}matches(t){const e=O.comparator(t.key,this.key);return this.matchesComparison(e)}}class bi extends z{constructor(t,e){super(t,"in",e),this.keys=Jn("in",e)}matches(t){return this.keys.some((e=>e.isEqual(t.key)))}}class vi extends z{constructor(t,e){super(t,"not-in",e),this.keys=Jn("not-in",e)}matches(t){return!this.keys.some((e=>e.isEqual(t.key)))}}function Jn(n,t){var e;return(((e=t.arrayValue)==null?void 0:e.values)||[]).map((r=>O.fromName(r.referenceValue)))}class Vi extends z{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return Kn(e)&&Rt(e.arrayValue,this.value)}}class Ri extends z{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&Rt(this.value.arrayValue,e)}}class Si extends z{constructor(t,e){super(t,"not-in",e)}matches(t){if(Rt(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!Rt(this.value.arrayValue,e)}}class Ni extends z{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!Kn(e)||!e.arrayValue.values)&&e.arrayValue.values.some((r=>Rt(this.value.arrayValue,r)))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yt{constructor(t,e="asc"){this.field=t,this.dir=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class F{static fromTimestamp(t){return new F(t)}static min(){return new F(new k(0,0))}static max(){return new F(new k(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xt{constructor(t,e){this.comparator=t,this.root=e||M.EMPTY}insert(t,e){return new Xt(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,M.BLACK,null,null))}remove(t){return new Xt(this.comparator,this.root.remove(t,this.comparator).copy(null,null,M.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const r=this.comparator(t,e.key);if(r===0)return e.value;r<0?e=e.left:r>0&&(e=e.right)}return null}indexOf(t){let e=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(t,r.key);if(s===0)return e+r.left.size;s<0?r=r.left:(e+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal(((e,r)=>(t(e,r),!1)))}toString(){const t=[];return this.inorderTraversal(((e,r)=>(t.push(`${e}:${r}`),!1))),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new $t(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new $t(this.root,t,this.comparator,!1)}getReverseIterator(){return new $t(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new $t(this.root,t,this.comparator,!0)}}class $t{constructor(t,e,r,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!t.isEmpty();)if(i=e?r(t.key,e):1,e&&s&&(i*=-1),i<0)t=this.isReverse?t.left:t.right;else{if(i===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class M{constructor(t,e,r,s,i){this.key=t,this.value=e,this.color=r??M.RED,this.left=s??M.EMPTY,this.right=i??M.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,r,s,i){return new M(t??this.key,e??this.value,r??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,r){let s=this;const i=r(t,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(t,e,r),null):i===0?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return M.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let r,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),e(t,s.key)===0){if(s.right.isEmpty())return M.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(t,e))}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,M.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,M.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw N(43730,{key:this.key,value:this.value});if(this.right.isRed())throw N(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw N(27949);return t+(this.isRed()?0:1)}}M.EMPTY=null,M.RED=!0,M.BLACK=!1;M.EMPTY=new class{constructor(){this.size=0}get key(){throw N(57766)}get value(){throw N(16141)}get color(){throw N(16727)}get left(){throw N(29726)}get right(){throw N(36894)}copy(t,e,r,s,i){return this}insert(t,e,r){return new M(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class St{constructor(t){this.comparator=t,this.data=new Xt(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal(((e,r)=>(t(e),!1)))}forEachInRange(t,e){const r=this.data.getIteratorFrom(t[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key)}}forEachWhile(t,e){let r;for(r=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();r.hasNext();)if(!t(r.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new yn(this.data.getIterator())}getIteratorFrom(t){return new yn(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach((r=>{e=e.add(r)})),e}isEqual(t){if(!(t instanceof St)||this.size!==t.size)return!1;const e=this.data.getIterator(),r=t.data.getIterator();for(;e.hasNext();){const s=e.getNext().key,i=r.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const t=[];return this.forEach((e=>{t.push(e)})),t}toString(){const t=[];return this.forEach((e=>t.push(e))),"SortedSet("+t.toString()+")"}copy(t){const e=new St(this.comparator);return e.data=t,e}}class yn{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(t){this.fields=t,t.sort(U.comparator)}static empty(){return new ot([])}unionWith(t){let e=new St(U.comparator);for(const r of this.fields)e=e.add(r);for(const r of t)e=e.add(r);return new ot(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return Bn(this.fields,t.fields,((e,r)=>e.isEqual(r)))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class x{constructor(t){this.value=t}static empty(){return new x({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let r=0;r<t.length-1;++r)if(e=(e.mapValue.fields||{})[t.get(r)],!ge(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=yt(e)}setAll(t){let e=U.emptyPath(),r={},s=[];t.forEach(((o,p)=>{if(!e.isImmediateParentOf(p)){const m=this.getFieldsMap(e);this.applyChanges(m,r,s),r={},s=[],e=p.popLast()}o?r[p.lastSegment()]=yt(o):s.push(p.lastSegment())}));const i=this.getFieldsMap(e);this.applyChanges(i,r,s)}delete(t){const e=this.field(t.popLast());ge(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return Wt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let r=0;r<t.length;++r){let s=e.mapValue.fields[t.get(r)];ge(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(r)]=s),e=s}return e.mapValue.fields}applyChanges(t,e,r){Pt(e,((s,i)=>t[s]=i));for(const s of r)delete t[s]}clone(){return new x(yt(this.value))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class H{constructor(t,e,r,s,i,o,p){this.key=t,this.documentType=e,this.version=r,this.readTime=s,this.createTime=i,this.data=o,this.documentState=p}static newInvalidDocument(t){return new H(t,0,F.min(),F.min(),F.min(),x.empty(),0)}static newFoundDocument(t,e,r,s){return new H(t,1,e,F.min(),r,s,0)}static newNoDocument(t,e){return new H(t,2,e,F.min(),F.min(),x.empty(),0)}static newUnknownDocument(t,e){return new H(t,3,e,F.min(),F.min(),x.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(F.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=x.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=x.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=F.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof H&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new H(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pi{constructor(t,e=null,r=[],s=[],i=null,o=null,p=null){this.path=t,this.collectionGroup=e,this.orderBy=r,this.filters=s,this.limit=i,this.startAt=o,this.endAt=p,this.O=null}}function En(n,t=null,e=[],r=[],s=null,i=null,o=null){return new Pi(n,t,e,r,s,i,o)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ot{constructor(t,e=null,r=[],s=[],i=null,o="F",p=null,m=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=r,this.filters=s,this.limit=i,this.limitType=o,this.startAt=p,this.endAt=m,this.q=null,this.L=null,this.B=null,this.startAt,this.endAt}}function Yn(n){return n.collectionGroup!==null}function Xn(n){const t=Nt(n);if(t.q===null){t.q=[];const e=new Set;for(const i of t.explicitOrderBy)t.q.push(i),e.add(i.field.canonicalString());const r=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(o){let p=new St(U.comparator);return o.filters.forEach((m=>{m.getFlattenedFilters().forEach((g=>{g.isInequality()&&(p=p.add(g.field))}))})),p})(t).forEach((i=>{e.has(i.canonicalString())||i.isKeyField()||t.q.push(new Yt(i,r))})),e.has(U.keyField().canonicalString())||t.q.push(new Yt(U.keyField(),r))}return t.q}function Di(n){const t=Nt(n);return t.L||(t.L=Ci(t,Xn(n))),t.L}function Ci(n,t){if(n.limitType==="F")return En(n.path,n.collectionGroup,t,n.filters,n.limit,n.startAt,n.endAt);{t=t.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new Yt(s.field,i)}));const e=n.endAt?new Jt(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Jt(n.startAt.position,n.startAt.inclusive):null;return En(n.path,n.collectionGroup,t,n.filters,n.limit,e,r)}}function be(n,t){const e=n.filters.concat([t]);return new Ot(n.path,n.collectionGroup,n.explicitOrderBy.slice(),e,n.limit,n.limitType,n.startAt,n.endAt)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zn(n,t){if(n.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Gt(t)?"-0":t}}function Oi(n,t){return(function(r){return typeof r=="number"&&Number.isInteger(r)&&!Gt(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER})(t)?(function(r){return{integerValue:""+r}})(t):Zn(n,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ne{constructor(){this._=void 0}}class tr extends ne{}class ki extends ne{constructor(t){super(),this.elements=t}}class Fi extends ne{constructor(t){super(),this.elements=t}}class Mi extends ne{constructor(t,e){super(),this.serializer=t,this.$=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Li{constructor(t,e){this.field=t,this.transform=e}}class et{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new et}static exists(t){return new et(void 0,t)}static updateTime(t){return new et(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}class re{}class er extends re{constructor(t,e,r,s=[]){super(),this.key=t,this.value=e,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class Ce extends re{constructor(t,e,r,s,i=[]){super(),this.key=t,this.data=e,this.fieldMask=r,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}class nr extends re{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Ui extends re{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xi={asc:"ASCENDING",desc:"DESCENDING"},$i={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Bi={and:"AND",or:"OR"};class ji{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function ve(n,t){return n.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function qi(n,t){return n.useProto3Json?t.toBase64():t.toUint8Array()}function zi(n,t){return ve(n,t.toTimestamp())}function Et(n){return $(!!n,49232),F.fromTimestamp((function(e){const r=st(e);return new k(r.seconds,r.nanos)})(n))}function Oe(n,t){return Ve(n,t).canonicalString()}function Ve(n,t){const e=(function(s){return new S(["projects",s.projectId,"databases",s.database])})(n).child("documents");return t===void 0?e:e.child(t)}function Zt(n,t){return Oe(n.databaseId,t.path)}function Re(n,t){const e=(function(s){const i=S.fromString(s);return $(sr(i),10190,{key:i.toString()}),i})(t);if(e.get(1)!==n.databaseId.projectId)throw new E(_.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+n.databaseId.projectId);if(e.get(3)!==n.databaseId.database)throw new E(_.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+n.databaseId.database);return new O((function(s){return $(s.length>4&&s.get(4)==="documents",29091,{key:s.toString()}),s.popFirst(5)})(e))}function In(n,t,e){return{name:Zt(n,t),fields:e.value.mapValue.fields}}function Gi(n,t){return"found"in t?(function(r,s){$(!!s.found,43571),s.found.name,s.found.updateTime;const i=Re(r,s.found.name),o=Et(s.found.updateTime),p=s.found.createTime?Et(s.found.createTime):F.min(),m=new x({mapValue:{fields:s.found.fields}});return H.newFoundDocument(i,o,p,m)})(n,t):"missing"in t?(function(r,s){$(!!s.missing,3894),$(!!s.readTime,22933);const i=Re(r,s.missing),o=Et(s.readTime);return H.newNoDocument(i,o)})(n,t):N(7234,{result:t})}function Hi(n,t){let e;if(t instanceof er)e={update:In(n,t.key,t.value)};else if(t instanceof nr)e={delete:Zt(n,t.key)};else if(t instanceof Ce)e={update:In(n,t.key,t.data),updateMask:Yi(t.fieldMask)};else{if(!(t instanceof Ui))return N(16599,{U:t.type});e={verify:Zt(n,t.key)}}return t.fieldTransforms.length>0&&(e.updateTransforms=t.fieldTransforms.map((r=>(function(i,o){const p=o.transform;if(p instanceof tr)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(p instanceof ki)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:p.elements}};if(p instanceof Fi)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:p.elements}};if(p instanceof Mi)return{fieldPath:o.field.canonicalString(),increment:p.$};throw N(20930,{transform:o.transform})})(0,r)))),t.precondition.isNone||(e.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:zi(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:N(27497)})(n,t.precondition)),e}function Wi(n,t){const e={structuredQuery:{}},r=t.path;let s;t.collectionGroup!==null?(s=r,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=r.popLast(),e.structuredQuery.from=[{collectionId:r.lastSegment()}]),e.parent=(function(g,y){return Oe(g.databaseId,y)})(n,s);const i=(function(g){if(g.length!==0)return rr(Ct.create(g,"and"))})(t.filters);i&&(e.structuredQuery.where=i);const o=(function(g){if(g.length!==0)return g.map((y=>(function(A){return{field:ct(A.field),direction:Ki(A.dir)}})(y)))})(t.orderBy);o&&(e.structuredQuery.orderBy=o);const p=(function(g,y){return g.useProto3Json||gi(y)?y:{value:y}})(n,t.limit);return p!==null&&(e.structuredQuery.limit=p),t.startAt&&(e.structuredQuery.startAt=(function(g){return{before:g.inclusive,values:g.position}})(t.startAt)),t.endAt&&(e.structuredQuery.endAt=(function(g){return{before:!g.inclusive,values:g.position}})(t.endAt)),{M:e,parent:s}}function Ki(n){return xi[n]}function Qi(n){return $i[n]}function Ji(n){return Bi[n]}function ct(n){return{fieldPath:n.canonicalString()}}function rr(n){return n instanceof z?(function(e){if(e.op==="=="){if(_n(e.value))return{unaryFilter:{field:ct(e.field),op:"IS_NAN"}};if(gn(e.value))return{unaryFilter:{field:ct(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(_n(e.value))return{unaryFilter:{field:ct(e.field),op:"IS_NOT_NAN"}};if(gn(e.value))return{unaryFilter:{field:ct(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:ct(e.field),op:Qi(e.op),value:e.value}}})(n):n instanceof Ct?(function(e){const r=e.getFilters().map((s=>rr(s)));return r.length===1?r[0]:{compositeFilter:{op:Ji(e.op),filters:r}}})(n):N(54877,{filter:n})}function Yi(n){const t=[];return n.fields.forEach((e=>t.push(e.canonicalString()))),{fieldPaths:t}}function sr(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}function ir(n){return!!n&&typeof n._toProto=="function"&&n._protoValueType==="ProtoValue"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ke(n){return new ji(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xi{}class Zi extends Xi{constructor(t,e,r,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=r,this.serializer=s,this.k=!1}j(){if(this.k)throw new E(_.FAILED_PRECONDITION,"The client has already been terminated.")}I(t,e,r,s){return this.j(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.I(t,Ve(e,r),s,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===_.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new E(_.UNKNOWN,i.toString())}))}D(t,e,r,s,i){return this.j(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,p])=>this.connection.D(t,Ve(e,r),s,o,p,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===_.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new E(_.UNKNOWN,o.toString())}))}terminate(){this.k=!0,this.connection.terminate()}}async function se(n,t){const e=Nt(n),r={writes:t.map((s=>Hi(e.serializer,s)))};await e.I("Commit",e.serializer.databaseId,S.emptyPath(),r)}async function to(n,t){const e=Nt(n),r={documents:t.map((p=>Zt(e.serializer,p)))},s=await e.D("BatchGetDocuments",e.serializer.databaseId,S.emptyPath(),r,t.length),i=new Map;s.forEach((p=>{const m=Gi(e.serializer,p);i.set(m.key.toString(),m)}));const o=[];return t.forEach((p=>{const m=i.get(p.toString());$(!!m,55234,{key:p}),o.push(m)})),o}async function eo(n,t){const e=Nt(n),{M:r,parent:s}=Wi(e.serializer,Di(t));return(await e.D("RunQuery",e.serializer.databaseId,s,{structuredQuery:r.structuredQuery})).filter((i=>!!i.document)).map((i=>(function(p,m,g){const y=Re(p,m.name),I=Et(m.updateTime),A=m.createTime?Et(m.createTime):F.min(),v=new x({mapValue:{fields:m.fields}}),w=H.newFoundDocument(y,I,A,v);return g?w.setHasCommittedMutations():w})(e.serializer,i.document,void 0)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const or="ComponentProvider",It=new Map;function gt(n){if(n._terminated)throw new E(_.FAILED_PRECONDITION,"The client has already been terminated.");if(!It.has(n)){zt(or,"Initializing Datastore");const t=(function(i){return new Ei(i)})((function(i,o,p,m,g){return new ai(i,o,p,g.host,g.ssl,g.experimentalForceLongPolling,g.experimentalAutoDetectLongPolling,zn(g.experimentalLongPollingOptions),g.useFetchStreams,g.isUsingEmulator,m)})(n._databaseId,n.app.options.appId||"",n._persistenceKey,n.app.options.apiKey,n._freezeSettings())),e=ke(n._databaseId),r=(function(i,o,p,m){return new Zi(i,o,p,m)})(n._authCredentials,n._appCheckCredentials,t,e);It.set(n,r)}return It.get(n)}const no=1048576,ar="firestore.googleapis.com",An=!0;class Tn{constructor(t){if(t.host===void 0){if(t.ssl!==void 0)throw new E(_.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=ar,this.ssl=An}else this.host=t.host,this.ssl=t.ssl??An;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=41943040;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<no)throw new E(_.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}(function(r,s,i,o){if(s===!0&&o===!0)throw new E(_.INVALID_ARGUMENT,`${r} and ${i} cannot be used together.`)})("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=zn(t.experimentalLongPollingOptions??{}),(function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new E(_.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new E(_.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new E(_.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&(function(r,s){return r.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class ie{constructor(t,e,r,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Tn({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new E(_.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new E(_.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Tn(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=(function(r){if(!r)return new ei;switch(r.type){case"firstParty":return new ii(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new E(_.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(e){const r=It.get(e);r&&(zt(or,"Removing Datastore"),It.delete(e),r.terminate())})(this),Promise.resolve()}}function _o(n,t){const e=typeof n=="object"?n:Bs(),r=typeof n=="string"?n:"(default)",s=Fs(e,"firestore/lite").getImmediate({identifier:r});if(!s._initialized){const i=Pr("firestore");i&&ro(s,...i)}return s}function ro(n,t,e,r={}){var g;n=at(n,ie);const s=Dn(t),i=n._getSettings(),o={...i,emulatorOptions:n._getEmulatorOptions()},p=`${t}:${e}`;s&&Ur(`https://${p}`),i.host!==ar&&i.host!==p&&Un("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const m={...i,host:p,ssl:s,emulatorOptions:r};if(!jt(m,o)&&(n._setSettings(m),r.mockUserToken)){let y,I;if(typeof r.mockUserToken=="string")y=r.mockUserToken,I=L.MOCK_USER;else{y=Cr(r.mockUserToken,(g=n._app)==null?void 0:g.options.projectId);const A=r.mockUserToken.sub||r.mockUserToken.user_id;if(!A)throw new E(_.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");I=new L(A)}n._authCredentials=new ni(new $n(y,I))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class X{constructor(t,e,r){this.converter=e,this._query=r,this.type="query",this.firestore=t}withConverter(t){return new X(this.firestore,t,this._query)}}class P{constructor(t,e,r){this.converter=e,this._key=r,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Q(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new P(this.firestore,t,this._key)}toJSON(){return{type:P._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,r){if(Dt(e,P._jsonSchema))return new P(t,r||null,new O(S.fromString(e.referencePath)))}}P._jsonSchemaVersion="firestore/documentReference/1.0",P._jsonSchema={type:j("string",P._jsonSchemaVersion),referencePath:j("string")};class Q extends X{constructor(t,e,r){super(t,e,(function(i){return new Ot(i)})(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new P(this.firestore,null,new O(t))}withConverter(t){return new Q(this.firestore,t,this._path)}}function yo(n,t,...e){if(n=K(n),jn("collection","path",t),n instanceof ie){const r=S.fromString(t,...e);return un(r),new Q(n,null,r)}{if(!(n instanceof P||n instanceof Q))throw new E(_.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(S.fromString(t,...e));return un(r),new Q(n.firestore,null,r)}}function so(n,t,...e){if(n=K(n),arguments.length===1&&(t=ci.newId()),jn("doc","path",t),n instanceof ie){const r=S.fromString(t,...e);return an(r),new P(n,null,new O(r))}{if(!(n instanceof P||n instanceof Q))throw new E(_.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(S.fromString(t,...e));return an(r),new P(n.firestore,n instanceof Q?n.converter:null,new O(r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class B{constructor(t){this._byteString=t}static fromBase64String(t){try{return new B(Y.fromBase64String(t))}catch(e){throw new E(_.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new B(Y.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:B._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(Dt(t,B._jsonSchema))return B.fromBase64String(t.bytes)}}B._jsonSchemaVersion="firestore/bytes/1.0",B._jsonSchema={type:j("string",B._jsonSchemaVersion),bytes:j("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new E(_.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new U(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oe{constructor(t){this._methodName=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class W{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new E(_.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new E(_.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return D(this._lat,t._lat)||D(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:W._jsonSchemaVersion}}static fromJSON(t){if(Dt(t,W._jsonSchema))return new W(t.latitude,t.longitude)}}W._jsonSchemaVersion="firestore/geoPoint/1.0",W._jsonSchema={type:j("string",W._jsonSchemaVersion),latitude:j("number"),longitude:j("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q{constructor(t){this._values=(t||[]).map((e=>e))}toArray(){return this._values.map((t=>t))}isEqual(t){/**
* @license
* Copyright 2017 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return(function(r,s){if(r.length!==s.length)return!1;for(let i=0;i<r.length;++i)if(r[i]!==s[i])return!1;return!0})(this._values,t._values)}toJSON(){return{type:q._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(Dt(t,q._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every((e=>typeof e=="number")))return new q(t.vectorValues);throw new E(_.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}q._jsonSchemaVersion="firestore/vectorValue/1.0",q._jsonSchema={type:j("string",q._jsonSchemaVersion),vectorValues:j("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const io=/^__.*__$/;class oo{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return this.fieldMask!==null?new Ce(t,this.data,this.fieldMask,e,this.fieldTransforms):new er(t,this.data,e,this.fieldTransforms)}}class ur{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return new Ce(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function lr(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw N(40011,{dataSource:n})}}class Me{constructor(t,e,r,s,i,o){this.settings=t,this.databaseId=e,this.serializer=r,this.ignoreUndefinedProperties=s,i===void 0&&this.G(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}te(t){return new Me({...this.settings,...t},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}J(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.te({path:e,arrayElement:!1});return r.H(t),r}Y(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.te({path:e,arrayElement:!1});return r.G(),r}X(t){return this.te({path:void 0,arrayElement:!0})}Z(t){return te(t,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(t){return this.fieldMask.find((e=>t.isPrefixOf(e)))!==void 0||this.fieldTransforms.find((e=>t.isPrefixOf(e.field)))!==void 0}G(){if(this.path)for(let t=0;t<this.path.length;t++)this.H(this.path.get(t))}H(t){if(t.length===0)throw this.Z("Document fields must not be empty");if(lr(this.dataSource)&&io.test(t))throw this.Z('Document fields cannot begin and end with "__"')}}class ao{constructor(t,e,r){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=r||ke(t)}ue(t,e,r,s=!1){return new Me({dataSource:t,methodName:e,targetDoc:r,path:U.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function kt(n){const t=n._freezeSettings(),e=ke(n._databaseId);return new ao(n._databaseId,!!t.ignoreUndefinedProperties,e)}function cr(n,t,e,r,s,i={}){const o=n.ue(i.merge||i.mergeFields?2:0,t,e,s);Ue("Data must be an object, but it was:",o,r);const p=fr(r,o);let m,g;if(i.merge)m=new ot(o.fieldMask),g=o.fieldTransforms;else if(i.mergeFields){const y=[];for(const I of i.mergeFields){const A=dt(t,I,e);if(!o.contains(A))throw new E(_.INVALID_ARGUMENT,`Field '${A}' is specified in your field mask but missing from your input data.`);mr(y,A)||y.push(A)}m=new ot(y),g=o.fieldTransforms.filter((I=>m.covers(I.field)))}else m=null,g=o.fieldTransforms;return new oo(new x(p),m,g)}class ae extends oe{_toFieldTransform(t){if(t.dataSource!==2)throw t.dataSource===1?t.Z(`${this._methodName}() can only appear at the top level of your update data`):t.Z(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof ae}}class Le extends oe{_toFieldTransform(t){return new Li(t.path,new tr)}isEqual(t){return t instanceof Le}}function uo(n,t,e,r){const s=n.ue(1,t,e);Ue("Data must be an object, but it was:",s,r);const i=[],o=x.empty();Pt(r,((m,g)=>{const y=pr(t,m,e);g=K(g);const I=s.Y(y);if(g instanceof ae)i.push(y);else{const A=Ft(g,I);A!=null&&(i.push(y),o.set(y,A))}}));const p=new ot(i);return new ur(o,p,s.fieldTransforms)}function lo(n,t,e,r,s,i){const o=n.ue(1,t,e),p=[dt(t,r,e)],m=[s];if(i.length%2!=0)throw new E(_.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let A=0;A<i.length;A+=2)p.push(dt(t,i[A])),m.push(i[A+1]);const g=[],y=x.empty();for(let A=p.length-1;A>=0;--A)if(!mr(g,p[A])){const v=p[A];let w=m[A];w=K(w);const V=o.Y(v);if(w instanceof ae)g.push(v);else{const R=Ft(w,V);R!=null&&(g.push(v),y.set(v,R))}}const I=new ot(g);return new ur(y,I,o.fieldTransforms)}function hr(n,t,e,r=!1){return Ft(e,n.ue(r?4:3,t))}function Ft(n,t){if(dr(n=K(n)))return Ue("Unsupported field value:",t,n),fr(n,t);if(n instanceof oe)return(function(r,s){if(!lr(s.dataSource))throw s.Z(`${r._methodName}() can only be used with update() and set()`);if(!s.path)throw s.Z(`${r._methodName}() is not currently supported inside arrays`);const i=r._toFieldTransform(s);i&&s.fieldTransforms.push(i)})(n,t),null;if(n===void 0&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),n instanceof Array){if(t.settings.arrayElement&&t.dataSource!==4)throw t.Z("Nested arrays are not supported");return(function(r,s){const i=[];let o=0;for(const p of r){let m=Ft(p,s.X(o));m==null&&(m={nullValue:"NULL_VALUE"}),i.push(m),o++}return{arrayValue:{values:i}}})(n,t)}return(function(r,s){if((r=K(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return Oi(s.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const i=k.fromDate(r);return{timestampValue:ve(s.serializer,i)}}if(r instanceof k){const i=new k(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:ve(s.serializer,i)}}if(r instanceof W)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof B)return{bytesValue:qi(s.serializer,r._byteString)};if(r instanceof P){const i=s.databaseId,o=r.firestore._databaseId;if(!o.isEqual(i))throw s.Z(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:Oe(r.firestore._databaseId||s.databaseId,r._key.path)}}if(r instanceof q)return(function(o,p){const m=o instanceof q?o.toArray():o;return{mapValue:{fields:{[Hn]:{stringValue:Wn},[Ht]:{arrayValue:{values:m.map((y=>{if(typeof y!="number")throw p.Z("VectorValues must only contain numeric values.");return Zn(p.serializer,y)}))}}}}}})(r,s);if(ir(r))return r._toProto(s.serializer);throw s.Z(`Unsupported field value: ${ee(r)}`)})(n,t)}function fr(n,t){const e={};return(function(s){for(const i in s)if(Object.prototype.hasOwnProperty.call(s,i))return!1;return!0})(n)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):Pt(n,((r,s)=>{const i=Ft(s,t.J(r));i!=null&&(e[r]=i)})),{mapValue:{fields:e}}}function dr(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof k||n instanceof W||n instanceof B||n instanceof P||n instanceof oe||n instanceof q||ir(n))}function Ue(n,t,e){if(!dr(e)||!qn(e)){const r=ee(e);throw r==="an object"?t.Z(n+" a custom object"):t.Z(n+" "+r)}}function dt(n,t,e){if((t=K(t))instanceof Fe)return t._internalPath;if(typeof t=="string")return pr(n,t);throw te("Field path arguments must be of type string or ",n,!1,void 0,e)}const co=new RegExp("[~\\*/\\[\\]]");function pr(n,t,e){if(t.search(co)>=0)throw te(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,e);try{return new Fe(...t.split("."))._internalPath}catch{throw te(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,e)}}function te(n,t,e,r,s){const i=r&&!r.isEmpty(),o=s!==void 0;let p=`Function ${t}() called with invalid data`;e&&(p+=" (via `toFirestore()`)"),p+=". ";let m="";return(i||o)&&(m+=" (found",i&&(m+=` in field ${r}`),o&&(m+=` in document ${s}`),m+=")"),new E(_.INVALID_ARGUMENT,p+n+m)}function mr(n,t){return n.some((e=>e.isEqual(t)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xe{constructor(t,e,r,s,i){this._firestore=t,this._userDataWriter=e,this._key=r,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new P(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new gr(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var t;return((t=this._document)==null?void 0:t.data.clone().value.mapValue.fields)??void 0}get(t){if(this._document){const e=this._document.data.field(dt("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class gr extends xe{data(){return super.data()}}class ho{constructor(t,e){this._docs=e,this.query=t}get docs(){return[...this._docs]}get size(){return this.docs.length}get empty(){return this.docs.length===0}forEach(t,e){this._docs.forEach(t,e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $e{}class ue extends $e{}function Eo(n,t,...e){let r=[];t instanceof $e&&r.push(t),r=r.concat(e),(function(i){const o=i.filter((m=>m instanceof Be)).length,p=i.filter((m=>m instanceof le)).length;if(o>1||o>0&&p>0)throw new E(_.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(r);for(const s of r)n=s._apply(n);return n}class le extends ue{constructor(t,e,r){super(),this._field=t,this._op=e,this._value=r,this.type="where"}static _create(t,e,r){return new le(t,e,r)}_apply(t){const e=this._parse(t);return _r(t._query,e),new X(t.firestore,t.converter,be(t._query,e))}_parse(t){const e=kt(t.firestore);return(function(i,o,p,m,g,y,I){let A;if(g.isKeyField()){if(y==="array-contains"||y==="array-contains-any")throw new E(_.INVALID_ARGUMENT,`Invalid Query. You can't perform '${y}' queries on documentId().`);if(y==="in"||y==="not-in"){bn(I,y);const w=[];for(const V of I)w.push(wn(m,i,V));A={arrayValue:{values:w}}}else A=wn(m,i,I)}else y!=="in"&&y!=="not-in"&&y!=="array-contains-any"||bn(I,y),A=hr(p,o,I,y==="in"||y==="not-in");return z.create(g,y,A)})(t._query,"where",e,t.firestore._databaseId,this._field,this._op,this._value)}}function Io(n,t,e){const r=t,s=dt("where",n);return le._create(s,r,e)}class Be extends $e{constructor(t,e){super(),this.type=t,this._queryConstraints=e}static _create(t,e){return new Be(t,e)}_parse(t){const e=this._queryConstraints.map((r=>r._parse(t))).filter((r=>r.getFilters().length>0));return e.length===1?e[0]:Ct.create(e,this._getOperator())}_apply(t){const e=this._parse(t);return e.getFilters().length===0?t:((function(s,i){let o=s;const p=i.getFlattenedFilters();for(const m of p)_r(o,m),o=be(o,m)})(t._query,e),new X(t.firestore,t.converter,be(t._query,e)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class je extends ue{constructor(t,e){super(),this._field=t,this._direction=e,this.type="orderBy"}static _create(t,e){return new je(t,e)}_apply(t){const e=(function(s,i,o){if(s.startAt!==null)throw new E(_.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new E(_.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new Yt(i,o)})(t._query,this._field,this._direction);return new X(t.firestore,t.converter,(function(s,i){const o=s.explicitOrderBy.concat([i]);return new Ot(s.path,s.collectionGroup,o,s.filters.slice(),s.limit,s.limitType,s.startAt,s.endAt)})(t._query,e))}}function Ao(n,t="asc"){const e=t,r=dt("orderBy",n);return je._create(r,e)}class qe extends ue{constructor(t,e,r){super(),this.type=t,this._limit=e,this._limitType=r}static _create(t,e,r){return new qe(t,e,r)}_apply(t){return new X(t.firestore,t.converter,(function(r,s,i){return new Ot(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),s,i,r.startAt,r.endAt)})(t._query,this._limit,this._limitType))}}function To(n){return pi("limit",n),qe._create("limit",n,"F")}class ze extends ue{constructor(t,e,r){super(),this.type=t,this._docOrFields=e,this._inclusive=r}static _create(t,e,r){return new ze(t,e,r)}_apply(t){const e=fo(t,this.type,this._docOrFields,this._inclusive);return new X(t.firestore,t.converter,(function(s,i){return new Ot(s.path,s.collectionGroup,s.explicitOrderBy.slice(),s.filters.slice(),s.limit,s.limitType,i,s.endAt)})(t._query,e))}}function wo(...n){return ze._create("startAfter",n,!1)}function fo(n,t,e,r){if(e[0]=K(e[0]),e[0]instanceof xe)return(function(i,o,p,m,g){if(!m)throw new E(_.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${p}().`);const y=[];for(const I of Xn(i))if(I.field.isKeyField())y.push(Qt(o,m.key));else{const A=m.data.field(I.field);if(De(A))throw new E(_.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+I.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(A===null){const v=I.field.canonicalString();throw new E(_.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${v}' (used as the orderBy) does not exist.`)}y.push(A)}return new Jt(y,g)})(n._query,n.firestore._databaseId,t,e[0]._document,r);{const s=kt(n.firestore);return(function(o,p,m,g,y,I){const A=o.explicitOrderBy;if(y.length>A.length)throw new E(_.INVALID_ARGUMENT,`Too many arguments provided to ${g}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const v=[];for(let w=0;w<y.length;w++){const V=y[w];if(A[w].field.isKeyField()){if(typeof V!="string")throw new E(_.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${g}(), but got a ${typeof V}`);if(!Yn(o)&&V.indexOf("/")!==-1)throw new E(_.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${g}() must be a plain document ID, but '${V}' contains a slash.`);const R=o.path.child(S.fromString(V));if(!O.isDocumentKey(R))throw new E(_.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${g}() must result in a valid document path, but '${R}' is not because it contains an odd number of segments.`);const ut=new O(R);v.push(Qt(p,ut))}else{const R=hr(m,g,V);v.push(R)}}return new Jt(v,I)})(n._query,n.firestore._databaseId,s,t,e,r)}}function wn(n,t,e){if(typeof(e=K(e))=="string"){if(e==="")throw new E(_.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Yn(t)&&e.indexOf("/")!==-1)throw new E(_.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${e}' contains a '/' character.`);const r=t.path.child(S.fromString(e));if(!O.isDocumentKey(r))throw new E(_.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Qt(n,new O(r))}if(e instanceof P)return Qt(n,e._key);throw new E(_.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${ee(e)}.`)}function bn(n,t){if(!Array.isArray(n)||n.length===0)throw new E(_.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function _r(n,t){const e=(function(s,i){for(const o of s)for(const p of o.getFlattenedFilters())if(i.indexOf(p.op)>=0)return p.op;return null})(n.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(t.op));if(e!==null)throw e===t.op?new E(_.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new E(_.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${e.toString()}' filters.`)}class po{convertValue(t,e="none"){switch(it(t)){case 0:return null;case 1:return t.booleanValue;case 2:return C(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(vt(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw N(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const r={};return Pt(t,((s,i)=>{r[s]=this.convertValue(i,e)})),r}convertVectorValue(t){var r,s,i;const e=(i=(s=(r=t.fields)==null?void 0:r[Ht].arrayValue)==null?void 0:s.values)==null?void 0:i.map((o=>C(o.doubleValue)));return new q(e)}convertGeoPoint(t){return new W(C(t.latitude),C(t.longitude))}convertArray(t,e){return(t.values||[]).map((r=>this.convertValue(r,e)))}convertServerTimestamp(t,e){switch(e){case"previous":const r=Gn(t);return r==null?null:this.convertValue(r,e);case"estimate":return this.convertTimestamp(Vt(t));default:return null}}convertTimestamp(t){const e=st(t);return new k(e.seconds,e.nanos)}convertDocumentKey(t,e){const r=S.fromString(t);$(sr(r),9688,{name:t});const s=new bt(r.get(1),r.get(3)),i=new O(r.popFirst(5));return s.isEqual(e)||Ne(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function yr(n,t,e){let r;return r=n?e&&(e.merge||e.mergeFields)?n.toFirestore(t,e):n.toFirestore(t):t,r}class Er extends po{constructor(t){super(),this.firestore=t}convertBytes(t){return new B(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new P(this.firestore,null,e)}}function bo(n){const t=gt((n=at(n,P)).firestore),e=new Er(n.firestore);return to(t,[n._key]).then((r=>{$(r.length===1,15618);const s=r[0];return new xe(n.firestore,e,n._key,s.isFoundDocument()?s:null,n.converter)}))}function vo(n){(function(s){if(s.limitType==="L"&&s.explicitOrderBy.length===0)throw new E(_.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")})((n=at(n,X))._query);const t=gt(n.firestore),e=new Er(n.firestore);return eo(t,n._query).then((r=>{const s=r.map((i=>new gr(n.firestore,e,i.key,i,n.converter)));return n._query.limitType==="L"&&s.reverse(),new ho(n,s)}))}function Vo(n,t,e){const r=yr((n=at(n,P)).converter,t,e),s=cr(kt(n.firestore),"setDoc",n._key,r,n.converter!==null,e);return se(gt(n.firestore),[s.toMutation(n._key,et.none())])}function Ro(n,t,e,...r){const s=kt((n=at(n,P)).firestore);let i;return i=typeof(t=K(t))=="string"||t instanceof Fe?lo(s,"updateDoc",n._key,t,e,r):uo(s,"updateDoc",n._key,t),se(gt(n.firestore),[i.toMutation(n._key,et.exists(!0))])}function So(n){return se(gt((n=at(n,P)).firestore),[new nr(n._key,et.none())])}function No(n,t){const e=so(n=at(n,Q)),r=yr(n.converter,t),s=cr(kt(n.firestore),"addDoc",e._key,r,e.converter!==null,{});return se(gt(n.firestore),[s.toMutation(e._key,et.exists(!1))]).then((()=>e))}function Po(){return new Le("serverTimestamp")}const vn="4.13.0";(function(){ti(`${xs}_lite`),qt(new At("firestore/lite",((t,{instanceIdentifier:e,options:r})=>{const s=t.getProvider("app").getImmediate(),i=new ie(new ri(t.getProvider("auth-internal")),new oi(s,t.getProvider("app-check-internal")),ui(s,e),s);return r&&i._setSettings(r),i}),"PUBLIC").setMultipleInstances(!0)),ht("firestore-lite",vn,""),ht("firestore-lite",vn,"esm2020")})();export{So as a,No as b,yo as c,so as d,vo as e,wo as f,bo as g,Vo as h,mo as i,$s as j,_o as k,To as l,Ao as o,Eo as q,Po as s,Ro as u,Io as w};
