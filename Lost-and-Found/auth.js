const USERS_KEY="lf_users", CURRENT_KEY="lf_currentUser";
function getUsers(){return JSON.parse(localStorage.getItem(USERS_KEY)||"[]")}
function saveUsers(u){localStorage.setItem(USERS_KEY,JSON.stringify(u))}
function currentUser(){return JSON.parse(localStorage.getItem(CURRENT_KEY)||"null")}
function requireAuth(){if(!currentUser()){location.href="login.html";return false}return true}
function showError(id,msg){const e=document.getElementById(id);if(e){e.textContent=msg;e.classList.add("show")}}
document.addEventListener("DOMContentLoaded",()=>{
 const lf=location.pathname.split("/").pop();
 if(["dashboard.html","report.html","my-reports.html"].includes(lf)) requireAuth();
 const login=document.getElementById("loginForm");
 if(login) login.addEventListener("submit",e=>{e.preventDefault();const email=loginEmail.value.trim().toLowerCase(),pass=loginPassword.value;const u=getUsers().find(x=>x.email===email&&x.password===pass);if(!u)return showError("loginError","Email or password is incorrect.");localStorage.setItem(CURRENT_KEY,JSON.stringify(u));location.href="dashboard.html"});
 const reg=document.getElementById("registerForm");
 if(reg) reg.addEventListener("submit",e=>{e.preventDefault();const name=registerName.value.trim(),email=registerEmail.value.trim().toLowerCase(),password=registerPassword.value;if(getUsers().some(x=>x.email===email))return showError("registerError","An account with this email already exists.");const u={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),name,email,password};const users=getUsers();users.push(u);saveUsers(users);localStorage.setItem(CURRENT_KEY,JSON.stringify(u));location.href="dashboard.html"});
});