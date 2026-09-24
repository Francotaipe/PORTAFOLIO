function showMsg(id,text,type=""){const e=document.getElementById(id); if(e){e.textContent=text;e.className=`msg ${type}`}}
if(document.getElementById("loginForm")){
  document.getElementById("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const btn=e.currentTarget.querySelector("button[type=submit]");btn.disabled=true;
    showMsg("loginMsg","Iniciando sesión...");
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const {error}=await supabaseClient.auth.signInWithPassword({email,password});
    btn.disabled=false;
    if(error){showMsg("loginMsg",error.message,"error");return}
    location.href="panel.html";
  });
}
if(document.getElementById("registerForm")){
  document.getElementById("registerForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const btn=e.currentTarget.querySelector("button[type=submit]");btn.disabled=true;
    showMsg("regMsg","Creando cuenta...");
    const nombre=document.getElementById("nombre").value.trim();
    const email=document.getElementById("registerEmail").value.trim();
    const password=document.getElementById("registerPassword").value;
    if(password.length<6){btn.disabled=false;showMsg("regMsg","La contraseña debe tener al menos 6 caracteres.","error");return}
    const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{nombre}}});
    btn.disabled=false;
    if(error){showMsg("regMsg",error.message,"error");return}
    if(data.session){location.href="panel.html";return}
    showMsg("regMsg","Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.","success");
  });
}
