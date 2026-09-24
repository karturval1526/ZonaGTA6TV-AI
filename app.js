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
- Escribe en español latino natural y fácil de narrar.
- Diseña el primer segundo para detener el scroll.
- Usa un open loop y micro-recompensas cada 5-8 segundos.
- Evita introducciones largas y relleno.
- Incluye cambios visuales frecuentes y frases cortas para subtítulos grandes.
- Título y hook deben despertar curiosidad sin mentir ni prometer algo que el video no demuestra.
- CTA breve al final.
- El objetivo es maximizar retención y compartidos, pero no prometas viralidad.
- Devuelve SOLO un objeto JSON válido, sin markdown.
Claves: title, hook, script, description, hashtags, keywords, scenes.
scenes es un arreglo de objetos con time, visual, audio. Cada visual debe describir una imagen IA vertical 9:16, cinematográfica y específica.`;

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
 // Keep AI images aligned with the current project.
if(typeof clearAIImages==="function" && aiImages.length){ clearAIImages(); }
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





/* =========================
   LATAM TTS — KOKORO v1.0 SPANISH
   Commercial-friendly open model/voice packs (Apache-2.0)
========================= */
let latamTTS=null, latamTTSLoading=false;
const LATAM_MODEL="onnx-community/Kokoro-82M-v1.0-ONNX";

async function loadLatamTTS(){
  if(latamTTS)return latamTTS;
  if(latamTTSLoading){
    while(latamTTSLoading) await new Promise(r=>setTimeout(r,120));
    return latamTTS;
  }
  latamTTSLoading=true;
  try{
    const mod=await import("https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm");
    const device=navigator.gpu?"webgpu":"wasm";
    setVoiceStatus(`Cargando Kokoro español latino (${device.toUpperCase()})…`);
    latamTTS=await mod.KokoroTTS.from_pretrained(LATAM_MODEL,{
      dtype: device==="webgpu" ? "fp32" : "q8",
      device
    });
    return latamTTS;
  }finally{
    latamTTSLoading=false;
  }
}
function setVoiceStatus(t,err=false){
  const e=$("voiceStatus");if(!e)return;e.textContent=t;e.classList.toggle("error",err);
}
function setVoiceProgress(v){const e=$("voiceProgress");if(e)e.style.width=Math.max(0,Math.min(100,v))+"%"}
function audioToWavBlob(data,sampleRate=24000){
  const samples=data instanceof Float32Array?data:new Float32Array(data);
  const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
  const ws=(o,s)=>{for(let i=0;i<s.length;i++)view.setUint8(o+i,s.charCodeAt(i))};
  ws(0,"RIFF");view.setUint32(4,36+samples.length*2,true);ws(8,"WAVE");ws(12,"fmt ");
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
  view.setUint16(32,2,true);view.setUint16(34,16,true);ws(36,"data");view.setUint32(40,samples.length*2,true);
  let p=44;for(let i=0;i<samples.length;i++,p+=2){let x=Math.max(-1,Math.min(1,samples[i]));view.setInt16(p,x<0?x*0x8000:x*0x7fff,true)}
  return new Blob([buffer],{type:"audio/wav"});
}
function buildSubtitleSegments(text,total){
  const words=String(text||"").replace(/\s+/g," ").trim().split(" ").filter(Boolean);
  const chunks=[];let chunk=[];
  for(const w of words){
    chunk.push(w);
    if(chunk.join(" ").length>=42 || /[.!?,;:]$/.test(w)){chunks.push(chunk.join(" "));chunk=[]}
  }
  if(chunk.length)chunks.push(chunk.join(" "));
  const n=Math.max(1,chunks.length),dur=total/n;
  return chunks.map((text,i)=>({start:i*dur,end:(i+1)*dur,text}));
}
async function generateVoice(){
  if(voiceGenerating)return;
  const text=String(current?.script||current?.hook||"").trim();
  if(!text){setVoiceStatus("Genera primero el guion.",true);return null}
  voiceGenerating=true;
  $("generateVoiceBtn").disabled=true;
  $("playVoiceBtn").disabled=true;$("downloadVoiceBtn").disabled=true;
  setVoiceProgress(5);setVoiceStatus("Cargando voz latina dedicada…");
  try{
    const tts=await loadLatamTTS();
    setVoiceProgress(35);setVoiceStatus("Generando voz latina viral…");
    const voiceId=$("ttsVoice")?.value||"em_alex";
    const speed=Number($("ttsStyle")?.value||1.06);
    const output=await tts.generate(text,{voice:voiceId,speed});
    const audio={
      data: output.audio instanceof Float32Array ? output.audio : new Float32Array(output.audio),
      sample_rate: output.sampling_rate || 16000
    };
    voiceAudio=audio;
    voiceWavBlob=audioToWavBlob(audio.data,audio.sample_rate);
    if(voiceObjectURL)URL.revokeObjectURL(voiceObjectURL);
    voiceObjectURL=URL.createObjectURL(voiceWavBlob);
    $("voicePreview").src=voiceObjectURL;
    $("playVoiceBtn").disabled=false;$("downloadVoiceBtn").disabled=false;
    const total=audio.data.length/audio.sample_rate;
    subtitleSegments=buildSubtitleSegments(text,total);
    factorySrt=subtitleSegments.map((s,i)=>`${i+1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s.text}\n`).join("\n");
    setVoiceProgress(100);setVoiceStatus(`✓ Voz latina lista: ${total.toFixed(1)} s`);
    return audio;
  }catch(e){
    console.error(e);
    setVoiceStatus("No se pudo generar la voz IA: "+(e?.message||e),true);
    return null;
  }finally{voiceGenerating=false;$("generateVoiceBtn").disabled=false}
}
function srtTime(s){
  const ms=Math.floor((s%1)*1000),sec=Math.floor(s)%60,min=Math.floor(s/60)%60,hr=Math.floor(s/3600);
  return `${String(hr).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")},${String(ms).padStart(3,"0")}`;
}
function playVoice(){try{$("voicePreview").play()}catch{}}
function downloadVoice(){
  if(!voiceWavBlob)return;
  const a=document.createElement("a");a.href=URL.createObjectURL(voiceWavBlob);a.download=(slug(current?.title)||"zonagta6tv-voz")+".wav";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
}

/* =========================
   SHORTS FACTORY — v6
========================= */
let factoryRunning=false, factoryAbort=false, factoryVoiceBlob=null, factorySrt="";
let kokoroTTS=null, voiceAudio=null, voiceObjectURL=null, voiceWavBlob=null, voiceGenerating=false;
let subtitleSegments=[];
function f$(id){return document.getElementById(id)}
function factoryStatus(t,err=false){
  const e=f$("factoryStatus"); if(!e)return;
  e.textContent=t;e.classList.toggle("error",err);
}
function factoryProgress(v){const e=f$("factoryProgress");if(e)e.style.width=Math.max(0,Math.min(100,v))+"%"}
function factoryStep(n,state="active"){
  const ids=["stepScript","stepImages","stepVoice","stepVideo","stepZip"];
  ids.forEach((id,i)=>{const e=f$(id);if(!e)return;e.classList.remove("active","done");if(i<n-1)e.classList.add("done");if(i===n-1)e.classList.add(state)});
}
function factoryWait(ms){return new Promise(r=>setTimeout(r,ms))}
function factoryScenes(){
  return Array.isArray(current?.scenes)?current.scenes:[];
}
function sceneText(s){
  if(Array.isArray(s))return String(s[1]||"");
  return String(s?.visual||s?.audio||"");
}
function buildSRT(text,total){
  const words=String(text||"").replace(/\s+/g," ").trim().split(" ").filter(Boolean);
  const chunks=[]; const per=Math.max(2,Math.min(5,Math.ceil(words.length/Math.max(1,total/3))));
  for(let i=0;i<words.length;i+=per)chunks.push(words.slice(i,i+per).join(" "));
  let out="",t=0;
  const dur=total/Math.max(1,chunks.length);
  const ts=s=>{let ms=Math.floor((s%1)*1000), sec=Math.floor(s)%60, min=Math.floor(s/60)%60, hr=Math.floor(s/3600);return `${String(hr).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")},${String(ms).padStart(3,"0")}`};
  chunks.forEach((c,i)=>{out+=`${i+1}\n${ts(t)} --> ${ts(Math.min(total,t+dur-.05))}\n${c}\n\n`;t+=dur});
  return out;
}
async function factoryMakeScript(topic,duration){
  // Reuse the installed local model; request a tighter Shorts-specific structure.
  const prompt=`Crea un Short de GTA 6 en español latinoamericano/neutro de ${duration} segundos sobre: ${topic}.
Debe ser entretenido y factual. Si algo no está confirmado, etiquétalo como rumor/teoría.
Estructura: hook de 0-2s, desarrollo con micro-recompensas, giro o dato final, CTA breve.
Usa vocabulario natural de Latinoamérica, frases cortas para narración y evita modismos exclusivos de España. Genera exactamente ${Math.max(4,Math.min(8,Number(f$("factoryImages")?.value||6)))} escenas visuales.
Cada escena debe incluir visual y audio. Devuelve JSON con title,hook,script,description,hashtags,keywords,scenes.`;
  if(typeof generate==="function"){
    // Temporarily use the normal generator context by changing topic field if present.
    const topicEl=f$("topic");
    const old=topicEl?.value;
    if(topicEl)topicEl.value=topic;
    try{await generate();}finally{if(topicEl)topicEl.value=old||""}
    return current;
  }
  throw new Error("Motor de IA no disponible");
}
async function factoryGenerateImages(){
  if(typeof generateAIImages!=="function")throw new Error("Generador de imágenes no disponible");
  const sel=f$("imageCount"); const old=sel?.value;
  if(sel)sel.value=f$("factoryImages")?.value||"6";
  try{await generateAIImages();}finally{if(sel)sel.value=old||"4"}
  if(!aiImages?.length)throw new Error("No se generaron imágenes");
}

/* =========================
   LATAM VOICE PROFILE — v8
   Spanish Latin American / neutral, energetic but subtle.
========================= */
const LATAM_VOICE_PROFILES = {
  male: {
    label: "Latino masculino — energético sutil",
    preferred: ["es_419_male", "es-la-male", "em_alex"],
    rate: 1.06,
    pitch: 0.98
  },
  female: {
    label: "Latina femenina — energética sutil",
    preferred: ["es_419_female", "es-la-female", "ef_dora"],
    rate: 1.05,
    pitch: 1.02
  }
};
function latamVoiceInstruction(){
  return "Pronunciación en español latinoamericano/neutro. Evita acento castellano de España, ceceo y expresiones peninsulares. Ritmo natural, juvenil, energético pero sutil, claro para Shorts.";
}
function chooseLatamVoice(available, profile="male"){
  const p=LATAM_VOICE_PROFILES[profile]||LATAM_VOICE_PROFILES.male;
  const lower=available.map(v=>({v,n:(v.name||"").toLowerCase(),lang:(v.lang||"").toLowerCase()}));
  const latin=lower.filter(x=>x.lang.includes("419")||x.lang.includes("mx")||x.lang.includes("us")||x.lang.includes("latam")||x.lang.includes("latino"));
  for(const id of p.preferred){
    const hit=lower.find(x=>x.n.includes(id.toLowerCase()));
    if(hit)return hit.v;
  }
  return latin.find(x=>x.lang.startsWith("es"))?.v ||
         latin.find(x=>x.lang.includes("es"))?.v ||
         lower.find(x=>x.lang.startsWith("es"))?.v ||
         null;
}

async function factoryMakeVoice(){
  factoryVoiceBlob=null;
  // Browser-native speech synthesis is playback only, not a portable audio export.
  // We provide a clean SRT and let the video remain compatible with mobile browsers.
  factoryStatus("Voz: preparando narración…");
  if("speechSynthesis" in window){
    // Warm up the voice list so Android loads available voices.
    try{speechSynthesis.getVoices();}catch{}
  }
  // Avoid claiming a WAV/MP3 exists when the browser cannot export it.
  await factoryWait(250);
  return null;
}
async function factoryRender(){
  if(typeof renderVideo!=="function")throw new Error("Renderizador no disponible");
  // Use the existing renderer; duration is read from the duration control.
  const d=f$("duration"), old=d?.value;
  if(d){
    const sec=Number(f$("factoryDuration")?.value||45);
    d.value=`${sec} segundos`;
  }
  try{await renderVideo();}finally{if(d)d.value=old||"30 segundos"}
  if(!videoBlob)throw new Error("El video no pudo renderizarse");
}
async function factoryDownloadPackage(){
  const files=[];
  const enc=new TextEncoder();
  files.push({name:"guion.txt",data:enc.encode(String(current?.script||""))});
  files.push({name:"metadata.json",data:enc.encode(JSON.stringify({
    title:current?.title,hook:current?.hook,description:current?.description,
    hashtags:current?.hashtags,keywords:current?.keywords,scenes:current?.scenes,
    generatedAt:new Date().toISOString()
  },null,2))});
  files.push({name:"subtitulos.srt",data:enc.encode(factorySrt)});
  if(videoBlob)files.push({name:"video."+($("downloadVideoBtn")?.dataset.ext||"webm"),data:new Uint8Array(await videoBlob.arrayBuffer())});
  if(voiceWavBlob)files.push({name:"narracion-espanol-latino.wav",data:new Uint8Array(await voiceWavBlob.arrayBuffer())});
  if(typeof JSZip==="undefined")throw new Error("JSZip no está disponible");
  const zip=new JSZip();
  for(const f of files)zip.file(f.name,f.data);
  for(let i=0;i<(aiImages||[]).length;i++){
    try{
      const r=await fetch(aiImages[i].url); const b=await r.blob();
      zip.file(`imagenes/escena-${String(i+1).padStart(2,"0")}.${b.type.includes("png")?"png":"jpg"}`,b);
    }catch{}
  }
  const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:3}});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=(typeof slug==="function"?slug(current?.title):"zonagta6tv-short")+"-factory.zip";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
  return blob;
}
async function createFullShort(){
  if(factoryRunning)return;
  const topic=String(f$("factoryTopic")?.value||"").trim();
  if(!topic){factoryStatus("Escribe primero una idea o tema.",true);return}
  factoryRunning=true;factoryAbort=false;
  f$("factoryStartBtn").disabled=true;f$("factoryStopBtn").disabled=false;
  factoryProgress(0);factoryStep(1);
  try{
    factoryStatus("1/5 — Generando guion y storyboard…");
    await factoryMakeScript(topic,Number(f$("factoryDuration")?.value||45));
    if(factoryAbort)throw new Error("Producción detenida.");
    factoryProgress(20);factoryStep(2);
    factoryStatus("2/5 — Generando imágenes IA…");
    await factoryGenerateImages();
    if(factoryAbort)throw new Error("Producción detenida.");
    factoryProgress(45);factoryStep(3);
    factoryStatus("3/5 — Generando voz IA en español latino y subtítulos sincronizados…");
    const voice=await generateVoice();
    if(!voice)throw new Error("No se pudo generar la narración.");
    factorySrt=subtitleSegments.map((s,i)=>`${i+1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s.text}\n`).join("\n");
    if(factoryAbort)throw new Error("Producción detenida.");
    factoryProgress(58);factoryStep(4);
    factoryStatus("4/5 — Renderizando video vertical…");
    await factoryRender();
    if(factoryAbort)throw new Error("Producción detenida.");
    factoryProgress(88);factoryStep(5);
    factoryStatus("5/5 — Creando paquete descargable…");
    await factoryDownloadPackage();
    factoryProgress(100);
    factoryStep(5,"done");
    const result=f$("factoryResult");
    if(result)result.innerHTML=`<strong>✅ SHORT COMPLETO LISTO</strong><br><span>${esc(current?.title||"Video")}</span><br><small>Video + guion + subtítulos + imágenes + metadata incluidos en el ZIP.</small>`;
    factoryStatus("✓ Producción terminada. El ZIP se descargó en tu teléfono.");
  }catch(e){
    console.error(e);
    factoryStatus("Producción detenida: "+(e?.message||e),true);
  }finally{
    factoryRunning=false;f$("factoryStartBtn").disabled=false;f$("factoryStopBtn").disabled=true;
  }
}
function stopFullShort(){factoryAbort=true;try{stopVideo?.()}catch{}factoryStatus("Deteniendo producción…");}

/* =========================
   AI IMAGE FACTORY — v5
   Uses Pollinations public image endpoint; no key in the browser.
   Images are fetched as blobs so they can be safely drawn into Canvas.
========================= */
let aiImages = [];
const IMAGE_BASE = "https://image.pollinations.ai/prompt/";

function setImageStatus(t, err=false){
  const el=$("imageStatus");
  if(!el)return;
  el.textContent=t;
  el.classList.toggle("error",err);
}
function setImageProgress(v){
  const el=$("imageProgress");
  if(el)el.style.width=Math.max(0,Math.min(100,v))+"%";
}
function stylePrompt(){
  const s=$("imageStyle")?.value||"cinematic";
  const map={
    cinematic:"cinematic AAA video game key art, photorealistic, extremely detailed, dramatic volumetric lighting, realistic materials, dynamic camera composition, depth of field",
    trailer:"premium AAA game trailer frame, ultra detailed, photorealistic, dramatic composition, high contrast, volumetric light, realistic textures, motion energy",
    neon:"nighttime Vice City-inspired coastal metropolis, neon pink and cyan reflections, wet streets, tropical palms, cinematic rain, photorealistic, dramatic lighting",
    day:"sunny Miami-inspired tropical city, palm trees, ocean atmosphere, realistic cars, cinematic AAA game frame, natural skin and material detail"
  };
  return map[s]||map.cinematic;
}
function sceneVisual(s){
  if(Array.isArray(s)) return s[1]||"";
  return s?.visual||"";
}
function cleanPromptText(x){
  return String(x||"").replace(/\s+/g," ").trim().slice(0,850);
}
function buildImagePrompt(s,i){
  const visual=cleanPromptText(sceneVisual(s));
  const topic=cleanPromptText($("topic")?.value||current?.title||"GTA 6");
  return `${visual}. Subject/theme: ${topic}. ${stylePrompt()}. Vertical 9:16 composition, strong focal point in upper and center area, room for large captions, no written words, no subtitles, no watermark, no logo, no UI, safe for a gaming short.`;
}
async function fetchGeneratedImage(prompt, model){
  const params=new URLSearchParams({
    model:model==="flux"?"flux":"zimage",
    width:"1024",height:"1792",
    enhance:"true",nologo:"true",private:"true",
    safe:"true"
  });
  const url=IMAGE_BASE+encodeURIComponent(prompt)+"?"+params.toString();
  const response=await fetch(url,{mode:"cors",cache:"no-store"});
  if(!response.ok)throw new Error(`Servidor de imágenes respondió ${response.status}`);
  const blob=await response.blob();
  if(!blob.type.startsWith("image/"))throw new Error("La respuesta no fue una imagen");
  return URL.createObjectURL(blob);
}
function renderAIGallery(){
  const el=$("aiGallery");
  if(!el)return;
  el.innerHTML=aiImages.map((x,i)=>`
    <div class="aiCard">
      <div class="aiBadge">ESCENA ${i+1}</div>
      <img src="${x.url}" alt="Imagen IA escena ${i+1}" loading="lazy">
      <div class="aiCaption">${esc(x.prompt.slice(0,170))}</div>
    </div>`).join("");
}
async function generateAIImages(){
  if(!current){
    setImageStatus("Genera primero un contenido.",true);return;
  }
  const scenes=current.scenes||[];
  if(!scenes.length){
    setImageStatus("El contenido no tiene escenas visuales.",true);return;
  }
  const count=Math.min(Number($("imageCount")?.value||4),scenes.length);
  const model=$("imageModel")?.value||"zimage";
  $("generateImagesBtn").disabled=true;
  $("clearImagesBtn").disabled=true;
  aiImages=[];
  renderAIGallery();
  setImageProgress(0);
  setImageStatus("Preparando generación de imágenes…");

  try{
    for(let i=0;i<count;i++){
      const prompt=buildImagePrompt(scenes[i],i);
      setImageStatus(`Generando imagen ${i+1} de ${count}…`);
      const url=await fetchGeneratedImage(prompt,model);
      aiImages.push({url,prompt,scene:i});
      videoImages.push(await loadImageObject(url));
      renderAIGallery();
      setImageProgress((i+1)/count*100);
      // Anonymous public endpoints can rate-limit. A short pause avoids hammering the service.
      if(i<count-1)await new Promise(r=>setTimeout(r,1800));
    }
    setImageStatus(`✓ ${aiImages.length} imágenes creadas. Ya están listas para el generador de video.`);
  }catch(e){
    console.error(e);
    setImageStatus("No se pudo generar una imagen. El servicio externo puede estar temporalmente ocupado o limitar solicitudes anónimas. Puedes volver a intentar o usar imágenes del teléfono.",true);
  }finally{
    $("generateImagesBtn").disabled=false;
    $("clearImagesBtn").disabled=false;
  }
}
function loadImageObject(url){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error("No se pudo cargar la imagen generada"));
    img.src=url;
  });
}
function clearAIImages(){
  aiImages.forEach(x=>{try{URL.revokeObjectURL(x.url)}catch{}});
  aiImages=[];
  videoImages=[];
  renderAIGallery();
  setImageProgress(0);
  setImageStatus("Galería limpiada.");
}

/* =========================
   VIDEO RENDERER — v4
   Browser-only Canvas + MediaRecorder.
   No GPU/API required.
========================= */
let videoImages = [];
let videoBlob = null;
let videoRecording = false;
let videoRecorder = null;
let videoAnimation = 0;

function setVideoStatus(t, err=false){
  const el=$("videoStatus");
  if(!el) return;
  el.textContent=t;
  el.classList.toggle("error",err);
}
function setVideoProgress(v){
  const el=$("videoProgress");
  if(el) el.style.width=Math.max(0,Math.min(100,v))+"%";
}
function formatTime(sec){
  sec=Math.max(0,Math.floor(sec));
  const m=Math.floor(sec/60), s=sec%60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function selectedSeconds(){
  const d=$("duration")?.value||"30 segundos";
  const m=d.match(/(\d+(?:\.\d+)?)/);
  let n=m?Number(m[1]):30;
  if(d.includes("minuto")) n*=60;
  return Math.max(5, Math.min(n, 300));
}
function wrapCanvasText(ctx,text,maxWidth,fontSize,maxLines=4){
  const words=String(text||"").replace(/\s+/g," ").trim().split(" ");
  const lines=[]; let line="";
  for(const word of words){
    const test=line?line+" "+word:word;
    if(ctx.measureText(test).width<=maxWidth || !line) line=test;
    else { lines.push(line); line=word; if(lines.length>=maxLines-1) break; }
  }
  if(line && lines.length<maxLines) lines.push(line);
  return lines;
}
function drawRoundRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
function loadVideoImages(files){
  videoImages=[];
  const list=[...files].slice(0,6);
  return Promise.all(list.map(file=>new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{videoImages.push(img);resolve();};
    img.onerror=()=>resolve();
    img.src=URL.createObjectURL(file);
  })));
}
function drawCover(ctx,img,w,h,zoom=1){
  if(!img)return;
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
  if(!iw||!ih)return;
  const scale=Math.max(w/iw,h/ih)*zoom;
  const dw=iw*scale, dh=ih*scale;
  const x=(w-dw)/2,y=(h-dh)/2;
  ctx.drawImage(img,x,y,dw,dh);
}
function drawVideoFrame(ctx,w,h,sec,total,sceneIndex,title,hook){
  // Animated cinematic background
  const t=sec;
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,`hsl(${330+(t*9)%30},65%,10%)`);
  g.addColorStop(.5,`hsl(${255+(t*13)%40},60%,8%)`);
  g.addColorStop(1,`hsl(${190+(t*17)%45},70%,9%)`);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

  // Optional uploaded image
  if(videoImages.length){
    const img=videoImages[sceneIndex%videoImages.length];
    ctx.save();ctx.globalAlpha=.72;
    drawCover(ctx,img,w,h,1.06+0.025*Math.sin(t*1.4));
    ctx.restore();
    const ov=ctx.createLinearGradient(0,0,0,h);
    ov.addColorStop(0,"rgba(0,0,0,.20)");
    ov.addColorStop(.45,"rgba(0,0,0,.42)");
    ov.addColorStop(1,"rgba(0,0,0,.88)");
    ctx.fillStyle=ov;ctx.fillRect(0,0,w,h);
  }else{
    // Abstract motion when no images are supplied
    ctx.save();
    for(let i=0;i<18;i++){
      const x=((i*83+t*45)% (w+500))-250;
      const y=(i*137)%h;
      const r=60+((i*31)%140);
      ctx.globalAlpha=.045;
      ctx.fillStyle=`hsl(${190+i*17},80%,65%)`;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // Texture ligera: evita dibujar cientos de líneas en cada frame (muy costoso en Android).
  ctx.fillStyle="rgba(255,255,255,.018)";
  ctx.fillRect(0,0,w,h);

  const pad=w*.075;
  ctx.fillStyle="rgba(0,0,0,.48)";
  drawRoundRect(ctx,pad,h*.08,w-pad*2,h*.82,28);ctx.fill();

  ctx.fillStyle="#fff";
  ctx.textAlign="left";
  ctx.font=`800 ${Math.round(w*.075)}px system-ui, sans-serif`;
  const titleLines=wrapCanvasText(ctx,title||"ZonaGTA6TV",w-pad*2-40,Math.round(w*.075),3);
  let y=h*.16;
  for(const line of titleLines){ctx.fillText(line,pad+20,y);y+=w*.09;}

  ctx.fillStyle="rgba(255,255,255,.88)";
  ctx.font=`600 ${Math.round(w*.045)}px system-ui, sans-serif`;
  const hookLines=wrapCanvasText(ctx,hook||"GTA 6",w-pad*2-40,Math.round(w*.045),5);
  y=Math.max(y+h*.07,h*.40);
  for(const line of hookLines){ctx.fillText(line,pad+20,y);y+=w*.058;}

  // Progress bar
  const barY=h*.82, barW=w-pad*2;
  ctx.fillStyle="rgba(255,255,255,.16)";drawRoundRect(ctx,pad,barY,barW,10,5);ctx.fill();
  ctx.fillStyle="#fff";drawRoundRect(ctx,pad,barY,barW*Math.min(1,sec/total),10,5);ctx.fill();

  ctx.fillStyle="rgba(255,255,255,.82)";
  ctx.font=`700 ${Math.round(w*.032)}px system-ui, sans-serif`;
  ctx.fillText("ZONAGTA6TV",pad,h*.88);
  ctx.textAlign="right";
  ctx.fillText(formatTime(sec)+" / "+formatTime(total),w-pad,h*.88);

  // Synced captions: large, high-contrast, safe-area centered.
  const cap=(typeof subtitleSegments!=="undefined"?subtitleSegments.find(s=>sec>=s.start && sec<s.end):null);
  if(cap){
    ctx.textAlign="center";
    const capFont=Math.round(w*.052);
    ctx.font=`900 ${capFont}px system-ui, sans-serif`;
    const capLines=wrapCanvasText(ctx,cap.text,w*.82,capFont,3);
    const lineH=capFont*1.18, boxH=capLines.length*lineH+28;
    const boxY=h*.68-boxH/2;
    ctx.fillStyle="rgba(0,0,0,.72)";drawRoundRect(ctx,w*.09,boxY,w*.82,boxH,18);ctx.fill();
    ctx.fillStyle="#fff";
    let cy=boxY+lineH;
    for(const line of capLines){ctx.fillText(line,w/2,cy);cy+=lineH;}
  }

  ctx.textAlign="center";
  ctx.font=`800 ${Math.round(w*.04)}px system-ui, sans-serif`;
  ctx.fillStyle="#fff";
  ctx.fillText("SÍGUEME PARA MÁS GTA 6",w/2,h*.94);
}
async function renderVideo(){
  videoBlob=null;
  videoRecorder=null;
  if(!current){setVideoStatus("Genera primero un contenido.",true);return}
  if(videoRecording){setVideoStatus("El render ya está en curso.");return}
  if(!voiceAudio){setVideoStatus("Genera primero la narración IA.",true);return}
  if(!window.MediaRecorder){setVideoStatus("Este navegador no permite MediaRecorder.",true);return}

  // Modo estable para móviles: menos resolución/fps y trabajo por frame.
  // Evita que Chrome Android parezca congelado durante renders largos.
  const requestedQuality=Number($("videoQuality")?.value||540);
  const requestedFps=Number($("videoFps")?.value||15);
  const quality=Math.min(Math.max(requestedQuality,360),720);
  const fps=Math.min(Math.max(requestedFps,12),15);
  const sampleRate=voiceAudio.sample_rate||24000;
  const total=Math.max(1,voiceAudio.data.length/sampleRate);
  const canvas=document.createElement("canvas");
  const isLong=String($("format")?.value||"short")==="long";
  canvas.width=isLong?Math.round(quality*16/9):quality;
  canvas.height=isLong?quality:Math.round(quality*16/9);
  const ctx=canvas.getContext("2d",{alpha:false,desynchronized:true});
  if(!ctx)throw new Error("Canvas no disponible en este dispositivo.");
  const videoStream=canvas.captureStream(fps);

  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC){setVideoStatus("Tu navegador no permite AudioContext.",true);return}
  const ac=new AC();
  const buffer=ac.createBuffer(1,voiceAudio.data.length,sampleRate);
  buffer.getChannelData(0).set(voiceAudio.data);
  const source=ac.createBufferSource();source.buffer=buffer;
  const gain=ac.createGain();gain.gain.value=.96;
  const dest=ac.createMediaStreamDestination();
  source.connect(gain);gain.connect(dest);gain.connect(ac.destination);
  const combined=new MediaStream([...videoStream.getVideoTracks(),...dest.stream.getAudioTracks()]);

  const candidates=["video/mp4;codecs=avc1.42E01E","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
  const mime=candidates.find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime){setVideoStatus("Tu Chrome no ofrece un formato de video compatible.",true);try{await ac.close()}catch{}return}

  const chunks=[];
  const bitrate=quality>=720?2600000:1800000;
  videoRecorder=new MediaRecorder(combined,{mimeType:mime,videoBitsPerSecond:bitrate,audioBitsPerSecond:96000});
  videoRecording=true;
  $("renderVideoBtn").disabled=true;$("stopVideoBtn").disabled=false;$("downloadVideoBtn").disabled=true;
  setVideoProgress(0);
  setVideoStatus(`Preparando render ${quality}p / ${fps} fps…`);
  videoRecorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
  const done=new Promise(resolve=>videoRecorder.onstop=resolve);
  videoRecorder.start(1000);
  await ac.resume();
  source.start(0);

  const start=performance.now();
  const sceneCount=Math.max(1,(current.scenes||[]).length);
  let lastPaint=0;
  const frame=now=>{
    if(!videoRecording)return;
    const elapsed=Math.min(total,Math.max(0,(now-start)/1000));
    const pct=elapsed/total*100;
    // No pintamos más de lo necesario; captureStream ya controla la cadencia.
    if(now-lastPaint >= 125 || elapsed>=total){
      lastPaint=now;
      const sceneIndex=Math.min(sceneCount-1,Math.floor((elapsed/total)*sceneCount));
      const scene=current.scenes?.[sceneIndex];
      const sceneVisual=Array.isArray(scene)?scene[1]:(scene?.visual||"");
      drawVideoFrame(ctx,canvas.width,canvas.height,elapsed,total,sceneIndex,current.title||"ZonaGTA6TV",sceneVisual||current.hook||current.script||"");
      setVideoProgress(pct);
      setVideoStatus(`Renderizando ${Math.floor(pct)}% — ${formatTime(elapsed)} / ${formatTime(total)} · ${quality}p/${fps}fps`);
    }
    if(elapsed<total&&videoRecording)videoAnimation=requestAnimationFrame(frame);
    else{
      videoRecording=false;
      try{videoRecorder.stop()}catch{}
    }
  };
  videoAnimation=requestAnimationFrame(frame);
  await done;
  try{combined.getTracks().forEach(t=>t.stop());await ac.close()}catch{}
  if(!chunks.length)throw new Error("Chrome no entregó datos del video. Prueba 540p/15fps.");
  const blob=new Blob(chunks,{type:mime});videoBlob=blob;
  const ext=mime.includes("mp4")?"mp4":"webm",url=URL.createObjectURL(blob);
  $("videoPreview").src=url;$("videoPreview").load();$("downloadVideoBtn").disabled=false;
  $("downloadVideoBtn").dataset.ext=ext;$("renderVideoBtn").disabled=false;$("stopVideoBtn").disabled=true;
  setVideoProgress(100);setVideoStatus(`✓ Video ${ext.toUpperCase()} creado. Render estable ${quality}p/${fps}fps.`);
}

function stopVideo(){
  if(!videoRecording)return;
  videoRecording=false;
  cancelAnimationFrame(videoAnimation);
  try{videoRecorder?.stop();}catch{}
  $("renderVideoBtn").disabled=false;
  $("stopVideoBtn").disabled=true;
  setVideoStatus("Render detenido.");
}
function downloadVideo(){
  if(!videoBlob)return;
  const ext=$("downloadVideoBtn").dataset.ext||"webm";
  const a=document.createElement("a");
  a.href=URL.createObjectURL(videoBlob);
  a.download=(slug(current?.title)||"zonagta6tv-video")+"."+ext;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
  setVideoStatus("Video descargado en tu teléfono.");
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
$("renderVideoBtn")?.addEventListener("click",renderVideo);
$("stopVideoBtn")?.addEventListener("click",stopVideo);
$("downloadVideoBtn")?.addEventListener("click",downloadVideo);
$("imageInput")?.addEventListener("change",async e=>{
  await loadVideoImages(e.target.files||[]);
  setVideoStatus(videoImages.length?`${videoImages.length} imagen(es) cargada(s) para el video.`:"Sin imágenes: se usará fondo animado.");
});
$("generateVoiceBtn")?.addEventListener("click",generateVoice);
$("playVoiceBtn")?.addEventListener("click",playVoice);
$("downloadVoiceBtn")?.addEventListener("click",downloadVoice);
$("factoryStartBtn")?.addEventListener("click",createFullShort);
f$("batchStartBtn")?.addEventListener("click",startAutomaticBatch);
f$("batchStopBtn")?.addEventListener("click",stopAutomaticBatch);
$("factoryStopBtn")?.addEventListener("click",stopFullShort);
$("generateImagesBtn")?.addEventListener("click",generateAIImages);
$("clearImagesBtn")?.addEventListener("click",clearAIImages);

$("copyBtn").onclick=async()=>{await navigator.clipboard.writeText($("scriptOut").value);setStatus("Guion copiado.");};
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tabContent").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active")});

/* =========================
   v11 AUTOPILOT — automatic idea generation + queue launcher
   Uses local templates only; it does not invent current news claims.
========================= */
const PILOT_BANK={
 viral:[
  "5 detalles de GTA 6 que muchos jugadores todavía no han visto",
  "El detalle más curioso de Vice City en GTA 6",
  "3 cosas que podrían cambiar por completo GTA 6",
  "El secreto del mundo abierto de GTA 6 que más llama la atención",
  "Una función de GTA 6 que podría sorprender a todos",
  "El detalle de GTA 6 que demuestra cuánto ha evolucionado Rockstar",
  "5 cosas que esperamos ver en el próximo gran vistazo de GTA 6",
  "¿Qué tan grande podría ser el mapa de GTA 6?",
  "El misterio de GTA 6 que sigue generando teorías",
  "Detalles de GTA 6 que parecen pequeños pero podrían ser importantes",
  "3 diferencias que podrían separar GTA 6 de los juegos anteriores",
  "La característica de GTA 6 que podría cambiar la forma de jugar"
 ],
 characters:["Lucia: detalles del personaje que más llaman la atención en GTA 6","Jason: lo que sabemos del protagonista de GTA 6","Personajes secundarios que podrían destacar en GTA 6","¿Volverán personajes conocidos en GTA 6? Esto es lo que se ha comentado","Las relaciones entre personajes que podrían hacer diferente a GTA 6","5 personajes que los fans quieren volver a ver"],
 map:["Vice City: zonas que todos quieren explorar en GTA 6","¿Qué tan grande podría ser el mapa de GTA 6?","Los lugares más interesantes que esperamos encontrar en GTA 6","Cómo podría sentirse Vice City con el mundo abierto de GTA 6","Islas, carreteras y zonas urbanas: qué podría ofrecer el mapa","Detalles del entorno de GTA 6 que pueden cambiar la exploración"],
 vehicles:["Los vehículos que más queremos ver en GTA 6","Cómo podrían mejorar los vehículos en GTA 6","Motos, coches y barcos: qué esperamos del tráfico de GTA 6","¿Tendrá GTA 6 vehículos más realistas?","Detalles del gameplay de conducción que los fans esperan","5 vehículos que encajarían perfecto en Vice City"],
 features:["Funciones de GTA 6 que podrían cambiar el gameplay","El sistema social de GTA 6 explicado de forma sencilla","Detalles de interacción que podrían hacer más vivo GTA 6","¿Qué podría hacer más inmersivo a GTA 6?","5 funciones que queremos probar en GTA 6","Cómo podría evolucionar la inteligencia de los NPC en GTA 6"]
};
function pilotStatus(t,err=false){const e=f$("pilotStatus");if(e){e.textContent=t;e.classList.toggle("error",err)}}
function pilotEscape(t){return esc(String(t||""))}
function pilotMakeIdeas(){
 const n=Math.min(20,Math.max(1,Number(f$("pilotCount")?.value||10)));
 const focus=f$("pilotFocus")?.value||"viral";
 const bank=[...(PILOT_BANK[focus]||PILOT_BANK.viral)];
 const all=[...bank,...PILOT_BANK.viral];
 const seen=new Set(), out=[];
 for(let i=0;i<all.length && out.length<n;i++) if(!seen.has(all[i])){seen.add(all[i]);out.push(all[i]);}
 // Deterministic rotation so repeated runs do not always start identically.
 const shift=(new Date().getDate()+new Date().getHours())%out.length;
 const rotated=out.slice(shift).concat(out.slice(0,shift)).slice(0,n);
 const box=f$("batchTopics"); if(box)box.value=rotated.join("\n");
 const view=f$("pilotIdeas"); if(view)view.innerHTML=`<strong>${rotated.length} ideas preparadas</strong><br>`+rotated.map((x,i)=>`${i+1}. ${pilotEscape(x)}`).join("<br>");
 pilotStatus(`✅ ${rotated.length} ideas listas para producción.`);
 return rotated;
}
async function startAutopilot(){
 const mode=f$("pilotMode")?.value||"short";
 const topics=pilotMakeIdeas();
 if(!topics.length)return;
 const batchFormat=f$("batchFormat"), batchDuration=f$("batchDuration"), voice=f$("ttsVoice");
 if(mode==="short"){
   if(batchFormat)batchFormat.value="short";
   if(batchDuration)batchDuration.value="60";
 }else if(mode==="long"){
   if(batchFormat)batchFormat.value="long";
   if(batchDuration)batchDuration.value="300";
 }else{
   if(batchFormat)batchFormat.value="short";
   if(batchDuration)batchDuration.value="60";
 }
 if(voice)voice.value=f$("pilotVoice")?.value||"em_alex";
 // For mixed mode, the batch engine alternates format/duration per item.
 if(mode!=="mix"){
   pilotStatus("🤖 Autopilot iniciado. La cola producirá los videos automáticamente.");
   await startAutomaticBatch();
   return;
 }
 // Mixed mode: run each item sequentially with alternating presets.
 if(batchRunning)return;
 batchRunning=true;batchStop=false;
 const start=f$("batchStartBtn"), stop=f$("batchStopBtn"); if(start)start.disabled=true;if(stop)stop.disabled=false;
 let ok=0,failed=0,log=[];
 try{
   for(let i=0;i<topics.length;i++){
     if(batchStop)break;
     const fmt=i%2===0?"short":"long", dur=fmt==="short"?60:300, images=Number(f$("batchImages")?.value||6);
     batchProgress((i/topics.length)*100); pilotStatus(`🤖 Autopilot ${i+1}/${topics.length}: ${fmt==='short'?'Short':'video largo'}…`);
     try{const title=await produceOneAutomatic(topics[i],fmt,dur,images);ok++;log.push(`✅ ${i+1}. ${title}`)}catch(e){failed++;log.push(`❌ ${i+1}. ${topics[i]} — ${e?.message||e}`);if(batchStop)break}
     batchProgress(((i+1)/topics.length)*100);
   }
   const stopped=batchStop; pilotStatus(stopped?`⏹ Autopilot detenido. ${ok} producidos, ${failed} con error.`:`🎉 Autopilot terminado: ${ok} listos, ${failed} con error.`);
   const r=f$("batchResult");if(r)r.innerHTML=`<strong>${stopped?'AUTOPILOT DETENIDO':'AUTOPILOT COMPLETADO'}</strong><br>${log.map(x=>`<div>${esc(x)}</div>`).join("")}`;
 }finally{batchRunning=false;if(start)start.disabled=false;if(stop)stop.disabled=true;}
}
f$("pilotIdeasBtn")?.addEventListener("click",pilotMakeIdeas);
f$("pilotStartBtn")?.addEventListener("click",startAutopilot);

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

/* =========================
   v11 AUTO PILOT FACTORY
   Sequential unattended production queue.
========================= */
let batchRunning=false, batchStop=false;
function batchStatus(t,err=false){const e=f$("batchStatus");if(e){e.textContent=t;e.classList.toggle("error",err)}}
function batchProgress(v){const e=f$("batchProgress");if(e)e.style.width=Math.max(0,Math.min(100,v))+"%"}
function batchDurationLabel(sec){return sec<60?`${sec} segundos`:`${Math.round(sec/60)} minutos`}
async function produceOneAutomatic(topic,format,duration,images){
  if(batchStop)throw new Error("Cola detenida.");
  const topicEl=f$("topic"), formatEl=f$("format"), durationEl=f$("duration");
  const oldTopic=topicEl?.value, oldFormat=formatEl?.value, oldDuration=durationEl?.value;
  if(topicEl)topicEl.value=topic;
  if(formatEl)formatEl.value=format;
  if(durationEl)durationEl.value=batchDurationLabel(duration);
  const fi=f$("factoryImages"), ic=f$("imageCount");
  const oldFi=fi?.value, oldIc=ic?.value;
  if(fi)fi.value=String(images); if(ic)ic.value=String(images);
  try{
    batchStatus(`Generando: ${topic}`);
    await factoryMakeScript(topic,duration);
    if(batchStop)throw new Error("Cola detenida.");
    await factoryGenerateImages();
    if(batchStop)throw new Error("Cola detenida.");
    const voice=await generateVoice();
    if(!voice)throw new Error("No se pudo generar la voz.");
    factorySrt=subtitleSegments.map((x,i)=>`${i+1}\n${srtTime(x.start)} --> ${srtTime(x.end)}\n${x.text}\n`).join("\n");
    if(batchStop)throw new Error("Cola detenida.");
    await factoryRender();
    if(batchStop)throw new Error("Cola detenida.");
    await factoryDownloadPackage();
    return current?.title||topic;
  }finally{
    if(topicEl)topicEl.value=oldTopic||"";
    if(formatEl)formatEl.value=oldFormat||"short";
    if(durationEl)durationEl.value=oldDuration||"30 segundos";
    if(fi)fi.value=oldFi||"6"; if(ic)ic.value=oldIc||"4";
  }
}
async function startAutomaticBatch(){
  if(batchRunning)return;
  const topics=String(f$("batchTopics")?.value||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,20);
  if(!topics.length){batchStatus("Pega al menos un tema, uno por línea.",true);return}
  batchRunning=true;batchStop=false;
  const start=f$("batchStartBtn"), stop=f$("batchStopBtn");
  if(start)start.disabled=true;if(stop)stop.disabled=false;
  const format=f$("batchFormat")?.value||"short";
  const duration=Number(f$("batchDuration")?.value||45);
  const images=Number(f$("batchImages")?.value||6);
  let ok=0,failed=0,log=[];
  try{
    for(let i=0;i<topics.length;i++){
      if(batchStop)break;
      batchProgress((i/topics.length)*100);
      batchStatus(`🎬 Video ${i+1}/${topics.length}: preparando producción automática…`);
      try{
        const title=await produceOneAutomatic(topics[i],format,duration,images);
        ok++;log.push(`✅ ${i+1}. ${title}`);
      }catch(e){
        failed++;log.push(`❌ ${i+1}. ${topics[i]} — ${e?.message||e}`);
        if(batchStop)break;
      }
      batchProgress(((i+1)/topics.length)*100);
    }
    const stopped=batchStop;
    batchStatus(stopped?`⏹ Cola detenida. ${ok} producidos, ${failed} con error.`:`🎉 Producción automática terminada: ${ok} listos, ${failed} con error.`);
    const r=f$("batchResult");if(r)r.innerHTML=`<strong>${stopped?'PRODUCCIÓN DETENIDA':'PRODUCCIÓN COMPLETADA'}</strong><br>${log.map(x=>`<div>${esc(x)}</div>`).join("")}<small>Los ZIP se descargan automáticamente al terminar cada video.</small>`;
  }finally{
    batchRunning=false;if(start)start.disabled=false;if(stop)stop.disabled=true;
  }
}
function stopAutomaticBatch(){batchStop=true;try{stopVideo?.()}catch{}batchStatus("⏹ Deteniendo la producción automática…")}

/* ===== V14 SMART PUBLISH CENTER ===== */
function v14Status(t,err=false){const e=document.getElementById('publishStatus');if(e){e.textContent=t;e.classList.toggle('error',err)}}
function v14Checklist(){const box=document.getElementById('publishChecklist');if(!box)return;box.classList.remove('hidden');box.innerHTML=`<ol><li>☐ Revisar que el dato principal tenga fuente.</li><li>☐ Si es rumor/filtración, mantener la etiqueta de no confirmado.</li><li>☐ Revisar título y miniatura.</li><li>☐ Verificar subtítulos.</li><li>☐ Revisar duración y formato: Short 9:16 / largo 16:9.</li><li>☐ Pegar descripción y hashtags en YouTube Studio.</li><li>☐ Elegir audiencia, visibilidad y fecha de publicación.</li><li>☐ Comprobar derechos de imágenes, música y clips antes de publicar.</li></ol>`}
async function createPublishPack(){if(!current){v14Status('Primero genera un contenido.',true);return}try{v14Status('Creando paquete de publicación…');if(!window.JSZip)await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)});const zip=new JSZip();const meta={title:current.title||'',description:current.description||'',hashtags:current.hashtags||'',keywords:current.keywords||'',hook:current.hook||'',type:current.type||document.getElementById('type')?.value||'',format:document.getElementById('format')?.value||'',duration:document.getElementById('duration')?.value||'',source:window.ZGTA6_SELECTED_STORY||null,generatedAt:new Date().toISOString()};zip.file('01_VIDEO_METADATA.txt',`TITULO\n${meta.title}\n\nDESCRIPCION\n${meta.description}\n\nHASHTAGS\n${meta.hashtags}\n\nKEYWORDS\n${meta.keywords}\n`);zip.file('02_GUION.txt',current.script||'');zip.file('03_SUBTITULOS.srt',typeof makeSrt==='function'?makeSrt(current):'');zip.file('04_CHECKLIST_PUBLICACION.txt','REVISAR FUENTES\nREVISAR DERECHOS\nREVISAR TITULO\nREVISAR MINIATURA\nREVISAR SUBTITULOS\nREVISAR FORMATO\nSUBIR EN YOUTUBE STUDIO\n');if(videoBlob)zip.file('05_VIDEO.'+($('downloadVideoBtn')?.dataset.ext||'webm'),new Uint8Array(await videoBlob.arrayBuffer()));if(voiceWavBlob)zip.file('06_NARRACION.wav',new Uint8Array(await voiceWavBlob.arrayBuffer()));if(aiImages?.length){for(let i=0;i<aiImages.length;i++){try{const r=await fetch(aiImages[i].url);zip.file(`imagenes/escena-${String(i+1).padStart(2,'0')}.jpg`,await r.blob())}catch{}}}const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(slug(meta.title)||'zonagta6tv-publicacion')+'-LISTO-PARA-PUBLICAR.zip';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),15000);v14Status('✓ Paquete listo: video + metadata + guion + subtítulos + fuentes + checklist.');}catch(e){console.error(e);v14Status('No se pudo crear el paquete: '+e.message,true)}}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('publishPackBtn')?.addEventListener('click',createPublishPack);document.getElementById('publishChecklistBtn')?.addEventListener('click',v14Checklist)});


/* =========================================================
   ZONAGTA6TV V15 — ONE-CLICK PUBLISH READY
   One news story -> Short 9:16 + Long 16:9 + MP4 + assets + metadata + sources.
   MP4 conversion uses ffmpeg.wasm locally in the browser when MediaRecorder
   produces WebM. No video is uploaded to a third-party render service.
========================================================= */
let v15Running=false, v15Stop=false;
let v15ShortAsset=null, v15LongAsset=null, v15ShortMeta=null, v15LongMeta=null;
let v15FFmpeg=null, v15FFmpegLoading=null;

function v15Status(t,err=false){
  const e=document.getElementById("v15Status");
  if(e){e.textContent=t;e.classList.toggle("error",err);}
}
function v15Progress(v){
  const e=document.getElementById("v15Progress");
  if(e)e.style.width=Math.max(0,Math.min(100,v))+"%";
}
function v15Step(n){
  for(let i=1;i<=6;i++){
    const e=document.getElementById("v15Step"+i);
    if(!e)continue;
    e.classList.remove("active","done");
    if(i<n)e.classList.add("done");
    if(i===n)e.classList.add("active");
  }
}
function v15Sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function v15LoadJSZip(){
  if(window.JSZip)return;
  await new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    s.onload=resolve;s.onerror=()=>reject(new Error("No se pudo cargar el empaquetador ZIP."));
    document.head.appendChild(s);
  });
}

/* ffmpeg.wasm single-thread build: works without SharedArrayBuffer. */
async function v15LoadFFmpeg(){
  if(v15FFmpeg?.loaded)return v15FFmpeg;
  if(v15FFmpegLoading)return v15FFmpegLoading;
  v15FFmpegLoading=(async()=>{
    v15Status("Preparando conversor MP4 local (~31 MB)…");
    const add=(src)=>new Promise((res,rej)=>{
      const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("No se pudo cargar FFmpeg."));
      document.head.appendChild(s);
    });
    if(!window.FFmpegWASM)await add("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js");
    if(!window.FFmpegUtil)await add("https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/util.min.js");
    const {FFmpeg}=window.FFmpegWASM;
    const {toBlobURL,fetchFile}=window.FFmpegUtil;
    const ff=new FFmpeg();
    const base="https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
    await ff.load({
      coreURL:await toBlobURL(base+"/ffmpeg-core.js","text/javascript"),
      wasmURL:await toBlobURL(base+"/ffmpeg-core.wasm","application/wasm")
    });
    ff.__fetchFile=fetchFile;
    v15FFmpeg=ff;
    return ff;
  })().finally(()=>{v15FFmpegLoading=null;});
  return v15FFmpegLoading;
}

async function v15ToMp4(blob,name){
  if(blob.type?.includes("mp4"))return blob;
  const ff=await v15LoadFFmpeg();
  const input=name+".webm", output=name+".mp4";
  await ff.writeFile(input,await ff.__fetchFile(blob));
  await ff.exec([
    "-i",input,
    "-c:v","libx264","-preset","ultrafast","-crf","28",
    "-c:a","aac","-b:a","128k",
    "-movflags","+faststart",
    output
  ]);
  const data=await ff.readFile(output);
  try{await ff.deleteFile(input);await ff.deleteFile(output)}catch{}
  return new Blob([data.buffer],{type:"video/mp4"});
}

function v15SnapshotMeta(kind,c,story){
  const source=story||window.ZGTA6_SELECTED_STORY||null;
  const sources=(source?.coverage?.length?source.coverage:[source]).filter(Boolean).map(x=>({
    title:x.title||source?.title||"",
    source:x.source||source?.source||"Fuente no especificada",
    url:x.url||source?.url||""
  }));
  const unique=[];const seen=new Set();
  for(const s of sources){if(!seen.has(s.url||s.title)){seen.add(s.url||s.title);unique.push(s)}}
  const pinned=`¿Qué opinas de esta noticia sobre GTA 6? 👀\n\nDéjame tu teoría o reacción en los comentarios. Suscríbete a ZonaGTA6TV para más noticias, detalles y filtraciones de GTA 6.\n\n${source?.type==="FILTRACIÓN/RUMOR"?"⚠️ Recuerda: esta información está marcada como rumor/filtración y no debe tomarse como confirmada.":""}`.trim();
  return {
    version:"V15 ONE-CLICK PUBLISH READY",
    kind,
    title:c?.title||"",
    hook:c?.hook||"",
    description:c?.description||"",
    hashtags:c?.hashtags||"",
    keywords:c?.keywords||"",
    pinnedComment:pinned,
    script:c?.script||"",
    subtitles:typeof makeSrt==="function"?makeSrt(c):"",
    scenes:c?.scenes||[],
    sources:unique,
    generatedAt:new Date().toISOString()
  };
}

async function v15GenerateStory(format,duration,topic){
  const topicEl=document.getElementById("topic"),formatEl=document.getElementById("format"),durationEl=document.getElementById("duration");
  const old={topic:topicEl?.value||"",format:formatEl?.value||"short",duration:durationEl?.value||"30 segundos"};
  if(topicEl)topicEl.value=topic;
  if(formatEl)formatEl.value=format;
  if(durationEl)durationEl.value=duration<60?`${duration} segundos`:(duration%60===0?`${duration/60} minutos`:`${duration} segundos`);
  try{
    await generate();
    if(!current)throw new Error("La IA no devolvió el contenido.");
    return JSON.parse(JSON.stringify(current));
  }finally{
    if(topicEl)topicEl.value=old.topic;
    /* Keep format/duration set during the render phase; caller restores at the end. */
  }
}

async function v15RenderCurrent(format){
  const formatEl=document.getElementById("format");
  const old=formatEl?.value||"short";
  if(formatEl)formatEl.value=format;
  try{
    await renderVideo();
    if(!videoBlob)throw new Error("El render de video no produjo un archivo.");
    return {blob:videoBlob,ext:document.getElementById("downloadVideoBtn")?.dataset.ext||"webm"};
  }finally{if(formatEl)formatEl.value=old;}
}

async function v15MakeVideo(kind,format,duration,topic){
  const c=await v15GenerateStory(format,duration,topic);
  if(v15Stop)throw new Error("Producción detenida.");
  current=c;
  /* Short generates the image set. Long reuses the same images to avoid a second
     image-generation bill/latency while still incorporating the scenes into video. */
  if(kind==="short"){
    clearAIImages();
    const ic=document.getElementById("imageCount"),fi=document.getElementById("factoryImages");
    const oldI=ic?.value,oldF=fi?.value;
    const count=document.getElementById("v15Images")?.value||"6";
    if(ic)ic.value=count;if(fi)fi.value=count;
    try{await factoryGenerateImages();}finally{if(ic)ic.value=oldI||"4";if(fi)fi.value=oldF||"6";}
    if(!aiImages?.length)throw new Error("No se pudieron generar las escenas.");
  }
  if(v15Stop)throw new Error("Producción detenida.");
  await generateVoice();
  if(!voiceAudio)throw new Error("No se pudo generar la narración.");
  subtitleSegments=buildSubtitleSegments(current.script,voiceAudio.data.length/voiceAudio.sample_rate);
  factorySrt=subtitleSegments.map((s,i)=>`${i+1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s.text}\n`).join("\n");
  const rendered=await v15RenderCurrent(format);
  let mp4=rendered.blob;
  if(document.getElementById("v15Mp4Mode")?.value!=="browser" && rendered.ext!=="mp4"){
    v15Status(`Convirtiendo ${kind==="short"?"Short":"video largo"} a MP4 local…`);
    mp4=await v15ToMp4(rendered.blob,`v15-${kind}`);
  }
  return {
    content:c,
    blob:mp4,
    ext:"mp4",
    srt:factorySrt,
    voice:voiceWavBlob,
    images:aiImages.map(x=>({...x})),
    meta:v15SnapshotMeta(kind,c,window.ZGTA6_SELECTED_STORY)
  };
}

async function v15BuildZip(shortAsset,longAsset){
  await v15LoadJSZip();
  const zip=new JSZip();
  const safeSlug=typeof slug==="function"?slug(shortAsset.meta.title||longAsset.meta.title):"zonagta6tv-v15";
  const enc=new TextEncoder();
  const story=window.ZGTA6_SELECTED_STORY||{};
  const sourceText=(shortAsset.meta.sources||[]).map((s,i)=>`${i+1}. ${s.title}\n   Fuente: ${s.source}\n   ${s.url}`).join("\n\n")||"No se proporcionó una fuente específica.";
  const common=`ZONAGTA6TV V15 — ONE-CLICK PUBLISH READY

NOTICIA
${story.title||shortAsset.meta.title}

TIPO
${story.type||"No especificado"}

FUENTES
${sourceText}
`;
  zip.file("00_LEEME_V15.txt",common);
  zip.file("01_SHORT/VIDEO_SHORT.mp4",shortAsset.blob);
  zip.file("01_SHORT/TITULO.txt",shortAsset.meta.title);
  zip.file("01_SHORT/DESCRIPCION.txt",shortAsset.meta.description);
  zip.file("01_SHORT/HASHTAGS.txt",shortAsset.meta.hashtags);
  zip.file("01_SHORT/KEYWORDS.txt",shortAsset.meta.keywords);
  zip.file("01_SHORT/COMENTARIO_FIJADO.txt",shortAsset.meta.pinnedComment);
  zip.file("01_SHORT/GUION.txt",shortAsset.meta.script);
  zip.file("01_SHORT/SUBTITULOS.srt",shortAsset.srt);
  zip.file("01_SHORT/STORYBOARD.json",JSON.stringify(shortAsset.meta.scenes,null,2));
  zip.file("01_SHORT/FUENTES.txt",sourceText);
  zip.file("02_VIDEO_LARGO/VIDEO_LARGO.mp4",longAsset.blob);
  zip.file("02_VIDEO_LARGO/TITULO.txt",longAsset.meta.title);
  zip.file("02_VIDEO_LARGO/DESCRIPCION.txt",longAsset.meta.description);
  zip.file("02_VIDEO_LARGO/HASHTAGS.txt",longAsset.meta.hashtags);
  zip.file("02_VIDEO_LARGO/KEYWORDS.txt",longAsset.meta.keywords);
  zip.file("02_VIDEO_LARGO/COMENTARIO_FIJADO.txt",longAsset.meta.pinnedComment);
  zip.file("02_VIDEO_LARGO/GUION.txt",longAsset.meta.script);
  zip.file("02_VIDEO_LARGO/SUBTITULOS.srt",longAsset.srt);
  zip.file("02_VIDEO_LARGO/STORYBOARD.json",JSON.stringify(longAsset.meta.scenes,null,2));
  zip.file("02_VIDEO_LARGO/FUENTES.txt",sourceText);
  zip.file("03_IMAGENES/README.txt","Imágenes generadas para las escenas. Verifica derechos y condiciones de uso antes de publicar.");
  for(let i=0;i<(shortAsset.images||[]).length;i++){
    try{
      const r=await fetch(shortAsset.images[i].url);
      const b=await r.blob();
      zip.file(`03_IMAGENES/ESCENA_${String(i+1).padStart(2,"0")}.${b.type.includes("png")?"png":"jpg"}`,b);
    }catch(e){}
  }
  if(shortAsset.voice)zip.file("04_AUDIO/NARRACION_SHORT.wav",shortAsset.voice);
  if(longAsset.voice)zip.file("04_AUDIO/NARRACION_LARGO.wav",longAsset.voice);
  zip.file("05_FUENTES/fuentes.json",JSON.stringify(shortAsset.meta.sources,null,2));
  zip.file("05_FUENTES/fuentes.txt",sourceText);
  zip.file("06_PUBLICACION/CHECKLIST.txt",
`ONE-CLICK PUBLISH READY — CHECKLIST
☐ Revisar que el dato principal coincida con la fuente.
☐ Si es rumor/filtración, conservar la etiqueta de no confirmado.
☐ Revisar título y miniatura.
☐ Revisar subtítulos y narración.
☐ Short: 9:16.
☐ Video largo: 16:9.
☐ Verificar derechos de imágenes, música y clips.
☐ Pegar metadata en YouTube Studio.
☐ Revisar audiencia, visibilidad y fecha.
☐ Publicar manualmente en YouTube Studio.
`);
  zip.file("06_PUBLICACION/COMENTARIO_FIJADO.txt",shortAsset.meta.pinnedComment);
  const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:3}});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`${safeSlug}-V15-ONE-CLICK-PUBLISH-READY.zip`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),20000);
  return blob;
}

function v15Download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
}

async function createV15FromSelectedStory(){
  const t=window.ZGTA6_SELECTED_STORY?.title||document.getElementById("topic")?.value||"";
  if(!t)return;
  document.getElementById("oneClickV15")?.scrollIntoView({behavior:"smooth",block:"start"});
  return createV15OneClick(t);
}

async function createV15OneClick(topicOverride){
  if(v15Running)return;
  const topic=String(topicOverride||document.getElementById("topic")?.value||"").trim();
  if(!topic){v15Status("Selecciona una noticia o escribe un tema.",true);return}
  if(!engine){v15Status("Primero pulsa “Cargar IA gratuita”.",true);document.getElementById("loadBtn")?.scrollIntoView({behavior:"smooth"});return}
  v15Running=true;v15Stop=false;
  const start=document.getElementById("v15StartBtn"),stop=document.getElementById("v15StopBtn");
  if(start)start.disabled=true;if(stop)stop.disabled=false;
  v15Progress(0);v15Step(1);
  const oldTopic=document.getElementById("topic")?.value||"";
  const oldFormat=document.getElementById("format")?.value||"short";
  const oldDuration=document.getElementById("duration")?.value||"30 segundos";
  try{
    v15Status("1/6 — Preparando noticia y fuentes…");
    await v15Sleep(250);
    v15Progress(5);v15Step(2);
    const shortDur=Number(document.getElementById("v15ShortDuration")?.value||60);
    const longDur=Number(document.getElementById("v15LongDuration")?.value||300);
    v15Status("2/6 — Creando guion del Short y guion del video largo…");
    /* Build the Short first. Images are generated from its scenes and then reused. */
    v15ShortAsset=await v15MakeVideo("short","short",shortDur,topic);
    if(v15Stop)throw new Error("Producción detenida.");
    v15Progress(35);v15Step(3);
    v15Status("3/6 — Escenas listas. Preparando el video largo con la misma noticia…");
    v15LongAsset=await v15MakeVideo("long","long",longDur,topic);
    if(v15Stop)throw new Error("Producción detenida.");
    v15Progress(78);v15Step(5);
    v15Status("5/6 — Verificando MP4 y preparando archivos de publicación…");
    /* Keep the long-form content as the active project without clearing generated image URLs. */
    current=v15LongAsset.content;
    v15Progress(88);v15Step(6);
    v15Status("6/6 — Empaquetando todo en un ZIP organizado…");
    await v15BuildZip(v15ShortAsset,v15LongAsset);
    v15Progress(100);v15Step(6);
    const result=document.getElementById("v15Result");
    if(result)result.innerHTML=`
      <div class="v15Asset"><strong>🎬 SHORT MP4 9:16</strong><span>Listo para YouTube Shorts.</span></div>
      <div class="v15Asset"><strong>📺 VIDEO MP4 16:9</strong><span>Listo para YouTube.</span></div>
      <div class="v15Asset"><strong>🖼️ ESCENAS + 🎙️ NARRACIÓN + 📝 SUBTÍTULOS</strong><span>Incorporados en los dos videos y guardados también como archivos.</span></div>
      <div class="v15Asset"><strong>🔥 SEO + 💬 COMENTARIO + 🔗 FUENTES</strong><span>Incluidos en carpetas separadas.</span></div>
      <div class="v15Asset"><strong>📦 ZIP V15</strong><span>Descargado automáticamente.</span></div>`;
    v15Status("✓ V15 TERMINADA — Short MP4 + video largo MP4 + assets + publicación listos.");
  }catch(e){
    console.error(e);
    v15Status("Producción detenida: "+(e?.message||e),true);
  }finally{
    const te=document.getElementById("topic"),fe=document.getElementById("format"),de=document.getElementById("duration");
    if(te)te.value=oldTopic;if(fe)fe.value=oldFormat;if(de)de.value=oldDuration;
    if(start)start.disabled=false;if(stop)stop.disabled=true;
    v15Running=false;
  }
}
function stopV15(){v15Stop=true;try{stopVideo?.()}catch{}v15Status("⏹ Deteniendo producción…");}

document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("v15StartBtn")?.addEventListener("click",()=>createV15OneClick());
  document.getElementById("v15StopBtn")?.addEventListener("click",stopV15);
});
