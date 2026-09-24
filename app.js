import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm";

const MODEL = "onnx-community/SmolLM2-135M-Instruct-ONNX";
let engine = null;
let current = null;
const $ = id => document.getElementById(id);

function setStatus(t, err=false){$("status").textContent=t;$("status").classList.toggle("error",err)}
function setProgress(v){$("progress").style.width=v+"%";$("modelMeter").style.width=v+"%";$("modelText").textContent=Math.round(v)+"%"}
function saveProjects(){localStorage.setItem("zgta6_projects",JSON.stringify(projects))}
let projects = JSON.parse(localStorage.getItem("zgta6_projects")||"[]");

async function purgeOldServiceWorkers(){
  try{
    if("serviceWorker" in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const r of regs) await r.unregister();
    }
    // NO borramos Cache Storage: Transformers.js guarda aquí los modelos
    // y borrarlo en cada carga obligaría a descargarlos otra vez.
  }catch(e){ console.warn("No se pudo limpiar service workers antiguos",e); }
}

async function loadAI(){
  $("loadBtn").disabled=true;
  setStatus("Preparando IA CPU local…");
  try{
    await purgeOldServiceWorkers();
    $("deviceBadge").textContent="CPU";
    $("deviceStatus").textContent="CPU / WebAssembly — sin GPU";
    setProgress(5);

    let lastError=null;
    for(const dtype of ["q4","q8"]){
      try{
        setStatus("Cargando modelo CPU ("+dtype+")…");
        engine = await pipeline("text-generation", MODEL, {
          device:"wasm",
          dtype,
          progress_callback:(p)=>{
            if(p && typeof p.progress==="number"){
              const pct=Math.max(5,Math.min(100,p.progress*100));
              setProgress(pct);
              if(p.file) setStatus("Descargando modelo: "+p.file);
            }
          }
        });
        lastError=null;
        break;
      }catch(e){
        lastError=e;
        console.warn("Falló dtype",dtype,e);
      }
    }
    if(!engine) throw lastError || new Error("No se pudo inicializar el motor CPU.");
    setProgress(100);
    setStatus("✓ IA lista en CPU. No necesita GPU ni API.");
    $("loadBtn").textContent="✓ IA cargada (CPU)";
  }catch(e){
    console.error(e);
    setStatus("Error IA CPU: "+(e?.message||e)+" — pulsa Recargar página.",true);
    $("loadBtn").disabled=false;
  }
}

purgeOldServiceWorkers();

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
 $("generateBtn").disabled=true; setStatus("Creando contenido local…");
 const format=$("format").value,duration=$("duration").value,type=$("type").value,tone=$("tone").value,extra=$("extra").value;
 const prompt=`Eres el director editorial de ZonaGTA6TV, un canal hispanohablante especializado en GTA 6.
Crea una pieza lista para producción.
Tema: ${topic}
Formato: ${format}
Duración: ${duration}
Tipo: ${type}
Tono: ${tone}
Instrucciones: ${extra||"ninguna"}

REGLAS:
- No presentes rumores o teorías como hechos confirmados.
- Escribe en español natural.
- Hook inmediato.
- CTA breve.
- Devuelve SOLO un objeto JSON válido, sin markdown.
Claves: title, hook, script, description, hashtags, keywords, scenes.
scenes es un arreglo de objetos con time, visual, audio.`;

 try{
   const messages=[
     {role:"system",content:"Eres un guionista profesional de YouTube. Responde únicamente JSON válido."},
     {role:"user",content:prompt}
   ];
   const out=await engine(messages,{max_new_tokens:1400,temperature:.7,do_sample:true});
   let raw="";
   if(Array.isArray(out) && out[0]){
     const item=out[0];
     if(Array.isArray(item.generated_text)){
       raw=item.generated_text[item.generated_text.length-1]?.content || "";
     }else{
       raw=item.generated_text || "";
     }
   }
   raw=String(raw).trim().replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim();
   const first=raw.indexOf("{"), last=raw.lastIndexOf("}");
   if(first>=0 && last>first) raw=raw.slice(first,last+1);
   current=JSON.parse(raw);
   renderCurrent();
   setStatus("Contenido generado localmente en Android.");
 }catch(e){
   console.error(e);
   setStatus("El modelo local no pudo completar el JSON. En modo CPU puede ser necesario usar un tema más corto y volver a intentar.",true);
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

// Sin service worker: evita que una versión antigua de la app quede almacenada en caché.
let deferredInstall=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden")});
$("installBtn").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}};

const isAndroid=/Android/i.test(navigator.userAgent);
$("deviceBadge").textContent=isAndroid?"ANDROID":"WEB";
$("deviceStatus").textContent=("gpu" in navigator) ? "WebGPU detectado, pero esta versión usa CPU/WebAssembly para máxima compatibilidad." : "WebGPU no disponible — modo CPU/WebAssembly.";
$("deviceStatus").textContent=("gpu" in navigator)
 ? "WebGPU disponible. La app intentará usarlo y cambiará a CPU si falla."
 : "WebGPU no disponible. La app utilizará WebAssembly/CPU automáticamente.";
