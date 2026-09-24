
const $=id=>document.getElementById(id);
const esc=v=>{const d=document.createElement("div");d.textContent=v??"";return d.innerHTML};
const typeIcon=n=>{const x=String(n||"").split(".").pop().toLowerCase();if(x==="pdf")return"PDF";if(["png","jpg","jpeg","gif","webp"].includes(x))return"IMG";if(["doc","docx"].includes(x))return"DOC";if(["zip","rar","7z"].includes(x))return"ZIP";return"FILE"};
const courseName=k=>k==="desarrollo"?"Desarrollo de Aplicaciones":"Algoritmos y Estructura de Datos";
const fmtDate=v=>v?new Date(v+"T00:00:00").toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"}):"";
let user=null,works=[],selectedCourse=null,selectedPeriod=null,selectedWeek=null;

function msg(text,type=""){const e=$("uploadMsg");e.textContent=text;e.className=`msg ${type}`;}

function countWorks(course,period,week){
  return works.filter(w=>w.curso===course && Number(w.periodo)===Number(period) && Number(w.semana)===Number(week));
}

function renderCourseExplorer(course){
  selectedCourse=course;selectedPeriod=null;selectedWeek=null;
  document.querySelectorAll(".course-select-card").forEach(b=>b.classList.toggle("active",b.dataset.course===course));

  const box=$("privateCourseExplorer");
  box.innerHTML=`
    <div class="explorer-head">
      <div><div class="panel-label">${course==="desarrollo"?"CURSO 01":"CURSO 02"}</div>
      <h3>${courseName(course)}</h3><p>Selecciona un período y después una semana para administrar sus trabajos.</p></div>
      <span class="course-count">${works.filter(w=>w.curso===course).length} trabajos</span>
    </div>
    <div class="period-explorer" id="privatePeriodExplorer"></div>
  `;

  const periodExplorer=$("privatePeriodExplorer");
  for(let p=1;p<=4;p++){
    const pCount=works.filter(w=>w.curso===course && Number(w.periodo)===p).length;
    const block=document.createElement("div");
    block.className="period-explorer-card";
    block.innerHTML=`
      <div class="period-explorer-head">
        <button class="period-select-button" data-period="${p}">Período ${p}</button>
        <span>${pCount} ${pCount===1?"trabajo":"trabajos"}</span>
      </div>
      <div class="week-buttons-row"></div>
    `;
    const row=block.querySelector(".week-buttons-row");

    for(let w=1;w<=4;w++){
      const n=countWorks(course,p,w).length;
      const b=document.createElement("button");
      b.className="week-select-button";
      b.dataset.period=p;b.dataset.week=w;
      b.innerHTML=`<strong>Semana ${w}</strong><span>${n} ${n===1?"trabajo":"trabajos"}</span>`;
      row.appendChild(b);
      b.addEventListener("click",()=>{
        selectedPeriod=p;selectedWeek=w;
        periodExplorer.querySelectorAll(".period-select-button").forEach(x=>x.classList.remove("active"));
        block.querySelector(".period-select-button").classList.add("active");
        periodExplorer.querySelectorAll(".week-select-button").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        showSelectedWeek();
      });
    }
    block.querySelector(".period-select-button").addEventListener("click",()=>{
      periodExplorer.querySelectorAll(".period-select-button").forEach(x=>x.classList.remove("active"));
      block.querySelector(".period-select-button").classList.add("active");
    });
    periodExplorer.appendChild(block);
  }
}

function showSelectedWeek(){
  if(!selectedCourse||!selectedPeriod||!selectedWeek)return;
  $("noSelectedWeek").classList.add("hidden");
  $("selectedWeekPanel").classList.remove("hidden");
  $("selectedWeekTitle").textContent=`${courseName(selectedCourse)} · Período ${selectedPeriod} · Semana ${selectedWeek}`;
  $("selectedWeekSub").textContent="Sube un trabajo nuevo o elimina uno que ya esté registrado en esta semana.";
  $("selectedInfo").textContent=`${courseName(selectedCourse)} · Período ${selectedPeriod} · Semana ${selectedWeek}`;
  $("fecha").value=new Date().toISOString().slice(0,10);
  renderSelectedWeek();
  $("trabajos").scrollIntoView({behavior:"smooth",block:"start"});
}

function renderSelectedWeek(){
  const rows=countWorks(selectedCourse,selectedPeriod,selectedWeek);
  $("selectedWeekCount").textContent=`${rows.length} ${rows.length===1?"trabajo":"trabajos"}`;
  $("adminWeekList").innerHTML=rows.length?rows.map(w=>`
    <article class="admin-row">
      <div class="file-type">${typeIcon(w.archivo_nombre)}</div>
      <div class="work-info"><strong>${esc(w.titulo)}</strong><span>${esc(w.descripcion||"Trabajo académico")} · ${esc(w.archivo_nombre||"Archivo")} · ${fmtDate(w.fecha)}</span></div>
      <div class="admin-actions">
        ${w.archivo_url?`<a class="btn-view" href="${esc(w.archivo_url)}" target="_blank" rel="noopener">Ver</a>`:""}
        <button class="btn-delete" data-id="${w.id}" data-url="${encodeURIComponent(w.archivo_url||"")}">Eliminar</button>
      </div>
    </article>`).join("")
    : `<div class="empty-week">No hay trabajos registrados en esta semana. Usa el formulario de arriba para subir uno.</div>`;

  $("adminWeekList").querySelectorAll(".btn-delete").forEach(b=>b.addEventListener("click",()=>deleteWork(b.dataset.id,decodeURIComponent(b.dataset.url))));
}

async function loadWorks(){
  const {data,error}=await supabaseClient.from("trabajos")
    .select("id,curso,periodo,semana,titulo,descripcion,fecha,archivo_url,archivo_nombre,creado_en")
    .eq("usuario_id",user.id)
    .order("fecha",{ascending:false})
    .order("creado_en",{ascending:false});
  if(error){$("privateCourseExplorer").innerHTML=`<div class="empty-state"><h3>No se pudieron cargar tus trabajos</h3><p>${esc(error.message)}</p></div>`;return;}
  works=data||[];
  $("totalAdmin").textContent=works.length;
  if(selectedCourse)renderCourseExplorer(selectedCourse);
  if(selectedCourse&&selectedPeriod&&selectedWeek)showSelectedWeek();
}

async function uploadWork(e){
  e.preventDefault();
  if(!selectedCourse||!selectedPeriod||!selectedWeek){msg("Selecciona curso, período y semana.","error");return;}
  const form=e.currentTarget,file=$("archivo").files[0];
  if(!file){msg("Selecciona un archivo.","error");return;}
  const title=$("titulo").value.trim();
  if(!title){msg("Escribe un título.","error");return;}

  const btn=form.querySelector("button[type=submit]");btn.disabled=true;msg("Subiendo trabajo...");
  const description=$("descripcion").value.trim(),date=$("fecha").value||new Date().toISOString().slice(0,10);
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=`${user.id}/${Date.now()}_${safe}`;

  const {error:upError}=await supabaseClient.storage.from("trabajos").upload(path,file,{cacheControl:"3600",upsert:false});
  if(upError){btn.disabled=false;msg("No se pudo subir: "+upError.message,"error");return;}

  const {data:urlData}=supabaseClient.storage.from("trabajos").getPublicUrl(path);
  const {error:rowError}=await supabaseClient.from("trabajos").insert({
    usuario_id:user.id,
    curso:selectedCourse,
    periodo:selectedPeriod,
    semana:selectedWeek,
    titulo:title,
    descripcion:description,
    fecha:date,
    archivo_url:urlData.publicUrl,
    archivo_nombre:file.name
  });

  if(rowError){
    await supabaseClient.storage.from("trabajos").remove([path]);
    btn.disabled=false;
    msg("No se pudo guardar el trabajo: "+rowError.message,"error");
    return;
  }

  form.reset();
  $("fecha").value=new Date().toISOString().slice(0,10);
  btn.disabled=false;
  msg("Trabajo guardado correctamente.","success");
  await loadWorks();
}

async function deleteWork(id,url){
  if(!confirm("¿Seguro que deseas eliminar este trabajo?"))return;

  const {error:rowError}=await supabaseClient.from("trabajos")
    .delete()
    .eq("id",id)
    .eq("usuario_id",user.id);

  if(rowError){
    alert("No se pudo eliminar el trabajo: "+rowError.message);
    return;
  }

  if(url){
    const marker="/storage/v1/object/public/trabajos/";
    const i=url.indexOf(marker);
    if(i!==-1){
      const path=decodeURIComponent(url.slice(i+marker.length));
      const {error:storageError}=await supabaseClient.storage.from("trabajos").remove([path]);
      if(storageError) console.warn("El registro se eliminó, pero el archivo físico no pudo borrarse:",storageError.message);
    }
  }

  await loadWorks();
}

document.querySelectorAll(".course-select-card").forEach(b=>b.addEventListener("click",()=>renderCourseExplorer(b.dataset.course)));
$("uploadForm").addEventListener("submit",uploadWork);
$("logout").addEventListener("click",async()=>{await supabaseClient.auth.signOut();location.href="index.html";});

(async()=>{
  const {data}=await supabaseClient.auth.getUser();
  if(!data.user){location.href="login.html";return;}
  user=data.user;
  const name=user.user_metadata?.nombre||"Franco Taipe Quispe";
  $("userName").textContent=name;
  $("userNameHero").textContent=name.split(" ")[0];
  await loadWorks();
})();
