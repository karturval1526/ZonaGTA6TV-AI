import * as webllm from "https://esm.run/@mlc-ai/web-llm@0.2.85";

const MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
let engine = null;
let current = null;
const $ = id => document.getElementById(id);

function setStatus(t, err=false){$("status").textContent=t;$("status").classList.toggle("error",err)}
function setProgress(v){$("progress").style.width=v+"%";$("modelMeter").style.width=v+"%";$("modelText").textContent=Math.round(v)+"%"}
function saveProjects(){localStorage.setItem("zgta6_projects",JSON.stringify(projects))}
let projects = JSON.parse(localStorage.getItem("zgta6_projects")||"[]");

async function loadAI(){
  if(!("gpu" in navigator)){setStatus("Este navegador no ofrece WebGPU. Prueba Chrome actualizado en un dispositivo compatible.",true);return}
  $("loadBtn").disabled=true;
  setStatus("Preparando Qwen2.5 1.5B… la primera vez puede tardar.");
  try{
    engine=await webllm.CreateMLCEngine(MODEL,{initProgressCallback:p=>{
      const pct=Math.max(0,Math.min(100,(p.progress||0)*100));
      setProgress(pct);
      if(p.text) setStatus(p.text);
    }});
    setProgress(100); setStatus("IA lista. Todo el procesamiento del modelo ocurre en este navegador.");
    $("loadBtn").textContent="✓ IA cargada";
  }catch(e){
    console.error(e); setStatus("No se pudo cargar la IA: "+(e.message||e),true); $("loadBtn").disabled=false;
  }
}

function demo(){
  current=makeDemo();
  renderCurrent();
  setStatus("Modo demo activo. Para IA real pulsa Cargar IA.");
}
function makeDemo(){
 return {
  title:"GTA 6: el detalle de Vice City que casi nadie está mirando",
  hook:"Hay un detalle de GTA 6 que podría cambiar por completo cómo vivimos Vice City.",
  script:"HOOK\nHay un detalle de GTA 6 que casi nadie está mirando… y podría cambiar cómo exploramos Vice City.\n\nDESARROLLO\nRockstar ha mostrado una ciudad mucho más dinámica, con tráfico, actividades y personajes que reaccionan al entorno. Eso abre una posibilidad enorme: que algunas zonas cambien dependiendo de la hora, el clima o nuestras decisiones.\n\nCTA\n¿Tú qué crees? Déjalo en los comentarios y sigue a ZonaGTA6TV para más GTA 6.",
  description:"GTA 6 sigue revelando detalles que alimentan nuevas teorías sobre Vice City. En este video analizamos un detalle y lo que podría significar para la experiencia.",
  hashtags:"#GTA6 #GTAVI #RockstarGames #ViceCity #ZonaGTA6TV",
  keywords:"GTA 6, GTA VI, Vice City, Rockstar Games, detalles GTA 6, teorías GTA 6",
  scenes:[
   ["0:00-0:05","Hook visual de Vice City + texto gigante","Música intensa / golpe"],
   ["0:05-0:18","Gameplay/tráiler relacionado con ciudad","Ambiente urbano"],
   ["0:18-0:32","Zoom a detalle y texto explicativo","Whoosh"],
   ["0:32-0:40","Cierre con pregunta + logo","Golpe final"]
  ]
 }
}

async function generate(){
 const topic=$("topic").value.trim();
 if(!topic){setStatus("Escribe primero un tema.",true);return}
 if(!engine){setStatus("Carga la IA gratuita primero.",true);return}
 $("generateBtn").disabled=true; setStatus("Creando contenido…");
 const format=$("format").value,duration=$("duration").value,type=$("type").value,tone=$("tone").value,extra=$("extra").value;
 const prompt=`Eres el director editorial de ZonaGTA6TV, un canal hispanohablante especializado en GTA 6.
Crea una pieza lista para producción.
Tema: ${topic}
Formato: ${format}
Duración: ${duration}
Tipo: ${type}
Tono: ${tone}
Instrucciones: ${extra||"ninguna"}

IMPORTANTE:
- No inventes hechos actuales como si fueran confirmados.
- Si algo es teoría, rumor o especulación, etiquétalo claramente.
- Escribe en español natural.
- Para un Short: hook inmediato, ritmo alto y CTA breve.
- Para video largo: estructura por bloques.
- Devuelve SOLO JSON válido con estas claves:
title, hook, script, description, hashtags, keywords, scenes.
scenes debe ser un arreglo de objetos con time, visual, audio.
`;
 try{
   const r=await engine.chat.completions.create({messages:[
     {role:"system",content:"Eres un guionista profesional de YouTube. Responde únicamente JSON válido."},
     {role:"user",content:prompt}
   ],temperature:.8,max_tokens:2600});
   let raw=r.choices[0].message.content.trim();
   raw=raw.replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
   current=JSON.parse(raw);
   renderCurrent();
   setStatus("Contenido generado localmente.");
 }catch(e){
   console.error(e); setStatus("La IA devolvió una respuesta que no pude convertir a contenido. Intenta otra vez.",true);
 }finally{$("generateBtn").disabled=false}
}

function renderCurrent(){
 if(!current)return;
 $("resultPanel").classList.remove("hidden");
 $("resultMeta").textContent=current.title||"Contenido";
 $("scriptOut").value=current.script||"";
 $("metaOut").textContent=`TÍTULO\n${current.title||""}\n\nHOOK\n${current.hook||""}\n\nDESCRIPCIÓN\n${current.description||""}\n\nHASHTAGS\n${current.hashtags||""}\n\nPALABRAS CLAVE\n${current.keywords||""}`;
 $("srtOut").textContent=makeSrt(current);
 $("storyOut").innerHTML=(current.scenes||[]).map((s,i)=>{
   if(Array.isArray(s)) return `<div class="scene"><b>Escena ${i+1}</b><br>${esc(s[0])}<br><strong>Visual:</strong> ${esc(s[1])}<br><strong>Audio:</strong> ${esc(s[2])}</div>`;
   return `<div class="scene"><b>Escena ${i+1}</b><br>${esc(s.time||"")}<br><strong>Visual:</strong> ${esc(s.visual||"")}<br><strong>Audio:</strong> ${esc(s.audio||"")}</div>`;
 }).join("");
 const p={...current,id:Date.now(),created:new Date().toLocaleString("es-CO")};
 projects.unshift(p); projects=projects.slice(0,20); saveProjects(); renderLibrary();
}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function makeSrt(c){
 const scenes=c.scenes||[];
 if(!scenes.length)return "1\n00:00:00,000 --> 00:00:05,000\n"+(c.hook||c.title||"ZonaGTA6TV");
 return scenes.map((s,i)=>{
   const t=Array.isArray(s)?s[0]:s.time;
   const text=Array.isArray(s)?(s[1]||""):(s.visual||"");
   let start="00:00:00,000",end="00:00:05,000";
   if(typeof t==="string" && t.includes("-")){
     const [a,b]=t.split("-").map(x=>x.trim());
     start=toSrt(a);end=toSrt(b);
   }
   return `${i+1}\n${start} --> ${end}\n${text}\n`;
 }).join("\n");
}
function toSrt(x){
 const p=String(x).split(":").map(Number);
 let h=0,m=0,s=0;
 if(p.length===3)[h,m,s]=p; else if(p.length===2)[m,s]=p; else s=p[0]||0;
 return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(Math.floor(s)).padStart(2,"0")},000`;
}

async function exportZip(){
 if(!current)return;
 try{
   if(!window.JSZip){
     await new Promise((resolve,reject)=>{
       const s=document.createElement("script");
       s.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
       s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
     });
   }
   const zip=new JSZip();
   zip.file("guion.txt",current.script||"");
   zip.file("seo.txt",`TÍTULO\n${current.title||""}\n\nHOOK\n${current.hook||""}\n\nDESCRIPCIÓN\n${current.description||""}\n\nHASHTAGS\n${current.hashtags||""}\n\nKEYWORDS\n${current.keywords||""}`);
   zip.file("subtitulos.srt",makeSrt(current));
   zip.file("storyboard.json",JSON.stringify(current.scenes||[],null,2));
   zip.file("README.txt","Paquete de producción de ZonaGTA6TV AI Factory. IA local y gratuita.\n");
   const html=`<!doctype html><meta charset="utf-8"><title>${esc(current.title||"Storyboard")}</title><style>body{font-family:system-ui;background:#080a0f;color:#eee;padding:30px}h1{color:#ff496b}section{padding:18px;border:1px solid #333;margin:12px 0;border-radius:12px}</style><h1>${esc(current.title||"")}</h1><section><b>HOOK</b><p>${esc(current.hook||"")}</p></section><section><b>GUION</b><pre style="white-space:pre-wrap">${esc(current.script||"")}</pre></section>`;
   zip.file("storyboard.html",html);
   const blob=await zip.generateAsync({type:"blob"});
   const a=document.createElement("a");
   a.href=URL.createObjectURL(blob);
   a.download=(slug(current.title)||"zonagta6-contenido")+".zip";
   a.click();
   setStatus("ZIP de producción descargado.");
 }catch(e){console.error(e);setStatus("No se pudo crear el ZIP. Comprueba la conexión y vuelve a intentarlo.",true)}
}
function slug(s){return String(s||"contenido").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)}

function renderLibrary(){
 const el=$("library");
 if(!projects.length){el.innerHTML='<div class="empty">Todavía no hay proyectos guardados.</div>';return}
 el.innerHTML=projects.map((p,i)=>`<div class="project"><h3>${esc(p.title||"Sin título")}</h3><p>${esc(p.created||"")} </p><button data-load="${i}">Abrir</button></div>`).join("");
 el.querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>{current=projects[+b.dataset.load];renderCurrent();window.scrollTo({top:$("resultPanel").offsetTop-10,behavior:"smooth"})});
}
$("loadBtn").onclick=loadAI;$("demoBtn").onclick=demo;$("generateBtn").onclick=generate;$("exportBtn").onclick=exportZip;
$("copyBtn").onclick=async()=>{await navigator.clipboard.writeText($("scriptOut").value);setStatus("Guion copiado.");};
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tabContent").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active")});
renderLibrary();

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
let deferredInstall=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden")});
$("installBtn").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}};

const isAndroid=/Android/i.test(navigator.userAgent);
$("deviceBadge").textContent=isAndroid?"ANDROID":"WEB";
$("gpuStatus").textContent=("gpu" in navigator)?"Disponible":"No disponible";
if(!("gpu" in navigator)) $("deviceStatus").textContent="WebGPU no está disponible en este navegador/dispositivo. Prueba Chrome actualizado.";
else $("deviceStatus").textContent="WebGPU disponible. El modelo puede ejecutarse localmente.";
