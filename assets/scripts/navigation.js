(()=>{
const root=document.getElementById('beyond-form'),header=root?.querySelector('.mast');if(!header)return;
const links=[...header.querySelectorAll('.nav a[href^="#"]')];
const entries=links.map(link=>({link,section:root.querySelector(link.hash)})).filter(e=>e.section);
let pending=false;
function update(){pending=false;const height=header.getBoundingClientRect().height;root.style.setProperty('--header-height',height+'px');
let active=entries[0];const line=height+36;
for(const entry of entries)if(entry.section.getBoundingClientRect().top<=line)active=entry;
const bottom=document.documentElement.scrollHeight-window.innerHeight;
if(window.scrollY>=bottom-2&&window.scrollY>0)active=entries.at(-1);
for(const entry of entries){const yes=entry===active;entry.link.classList.toggle('active',yes);if(yes)entry.link.setAttribute('aria-current','location');else entry.link.removeAttribute('aria-current');}
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
new ResizeObserver(schedule).observe(header);
if(document.fonts)document.fonts.ready.then(schedule);
window.addEventListener('load',schedule);update();
})();