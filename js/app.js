
const $ = id => document.getElementById(id);
const esc = value => { const e=document.createElement("div"); e.textContent=value??""; return e.innerHTML; };
const iconType = name => {
  const x=String(name||"").split(".").pop().toLowerCase();
  if(x==="pdf") return "PDF";
  if(["png","jpg","jpeg","gif","webp"].includes(x)) return "IMG";
  if(["doc","docx"].includes(x)) return "DOC";
  if(["zip","rar","7z"].includes(x)) return "ZIP";
  return "FILE";
};
const fmtDate = value => value ? new Date(value+"T00:00:00").toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"}) : "";
const courseName = key => key==="desarrollo" ? "Desarrollo de Aplicaciones" : "Algoritmos y Estructura de Datos";
let allWorks = [];
let selectedCourse = null;
let selectedPeriod = null;
let selectedWeek = null;

function countFor(course, period, week) {
  return allWorks.filter(w =>
    w.curso===course &&
    Number(w.periodo)===Number(period) &&
    Number(w.semana)===Number(week)
  );
}

function renderCourseExplorer(course) {
  selectedCourse = course;
  selectedPeriod = null;
  selectedWeek = null;

  document.querySelectorAll(".course-select-card").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.course===course)
  );

  const explorer = $("publicCourseExplorer");
  explorer.innerHTML = `
    <div class="explorer-head">
      <div>
        <div class="panel-label">${course==="desarrollo" ? "CURSO 01" : "CURSO 02"}</div>
        <h3>${courseName(course)}</h3>
        <p>Selecciona un período y luego una semana para consultar los trabajos.</p>
      </div>
      <span class="course-count">${allWorks.filter(w=>w.curso===course).length} trabajos</span>
    </div>
    <div class="period-explorer" id="periodExplorer"></div>
  `;

  const periodExplorer = $("periodExplorer");
  for(let p=1;p<=4;p++){
    const pCount = allWorks.filter(w=>w.curso===course && Number(w.periodo)===p).length;
    const block = document.createElement("div");
    block.className = "period-explorer-card";
    block.innerHTML = `
      <div class="period-explorer-head">
        <button class="period-select-button" data-period="${p}">Período ${p}</button>
        <span>${pCount} ${pCount===1?"trabajo":"trabajos"}</span>
      </div>
      <div class="week-buttons-row"></div>
    `;
    const row = block.querySelector(".week-buttons-row");

    for(let w=1;w<=4;w++){
      const n = countFor(course,p,w).length;
      const btn = document.createElement("button");
      btn.className = "week-select-button";
      btn.dataset.period=p;
      btn.dataset.week=w;
      btn.innerHTML = `<strong>Semana ${w}</strong><span>${n} ${n===1?"trabajo":"trabajos"}</span>`;
      row.appendChild(btn);
      btn.addEventListener("click", ()=>{
        selectedPeriod=p;
        selectedWeek=w;
        row.querySelectorAll(".week-select-button").forEach(x=>x.classList.remove("active"));
        btn.classList.add("active");
        showPublicWeek(course,p,w);
      });
    }

    block.querySelector(".period-select-button").addEventListener("click", ()=>{
      periodExplorer.querySelectorAll(".period-select-button").forEach(x=>x.classList.remove("active"));
      block.querySelector(".period-select-button").classList.add("active");
    });

    periodExplorer.appendChild(block);
  }
}

function showPublicWeek(course, period, week) {
  const rows = countFor(course,period,week);
  $("publicNoWeek").classList.add("hidden");
  $("publicWeekDetail").classList.remove("hidden");
  $("publicWeekTitle").textContent = `${courseName(course)} · Período ${period} · Semana ${week}`;
  $("publicWeekSub").textContent = "Archivos disponibles para visualizar y descargar.";
  $("publicWeekCount").textContent = `${rows.length} ${rows.length===1?"trabajo":"trabajos"}`;

  const list = $("publicWorkList");
  list.innerHTML = rows.length ? rows.map(w=>`
    <article class="work-row">
      <div class="file-type">${iconType(w.archivo_nombre)}</div>
      <div class="work-info">
        <strong>${esc(w.titulo)}</strong>
        <span>${esc(w.descripcion||"Trabajo académico")} · ${esc(w.archivo_nombre||"Archivo")}</span>
      </div>
      <div style="font-size:11px;color:var(--muted)">${fmtDate(w.fecha)}</div>
      <div class="work-actions">
        ${w.archivo_url
          ? `<a class="btn-view" href="${esc(w.archivo_url)}" target="_blank" rel="noopener">Ver</a>
             <a class="btn-download" href="${esc(w.archivo_url)}" target="_blank" rel="noopener" download>Descargar</a>`
          : `<span class="no-file">Sin archivo</span>`}
      </div>
    </article>
  `).join("") : `<div class="empty-week">No hay trabajos registrados en esta semana.</div>`;

  $("trabajos").scrollIntoView({behavior:"smooth",block:"start"});
}

async function setupSessionUI() {
  if(!supabaseClient) return;
  const {data} = await supabaseClient.auth.getUser();
  if(!data.user) return;
  $("loginLink").textContent="Panel de trabajos";
  $("loginLink").href="panel.html";
  $("privateNav").href="panel.html";
  $("privateNav").innerHTML='<span class="nav-icon">✎</span>Panel privado';
}

async function load() {
  document.querySelectorAll(".course-select-card").forEach(btn =>
    btn.addEventListener("click", ()=>renderCourseExplorer(btn.dataset.course))
  );

  await setupSessionUI();

  const {data,error}=await supabaseClient.from("trabajos")
    .select("id,curso,periodo,semana,titulo,descripcion,fecha,archivo_url,archivo_nombre,creado_en")
    .order("fecha",{ascending:false})
    .order("creado_en",{ascending:false});

  if(error){
    $("publicCourseExplorer").innerHTML=`<div class="empty-state"><h3>No se pudieron cargar los trabajos</h3><p>${esc(error.message)}</p></div>`;
    return;
  }

  allWorks=data||[];
  $("totalWorks").textContent=allWorks.length;
  $("totalPeriods").textContent=new Set(allWorks.map(w=>`${w.curso}-${w.periodo}`)).size;
  $("totalWeeks").textContent=new Set(allWorks.map(w=>`${w.curso}-${w.semana}`)).size;
}
load();
