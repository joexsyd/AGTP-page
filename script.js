'use strict';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused=reducedMotion.matches;
const players=[...document.querySelectorAll('[data-player]')].map(el=>({el,video:el.querySelector('video'),ratio:0,userPaused:false}));
function ensureSource(p){if(!p.video.getAttribute('src')){p.video.src=p.video.dataset.src;p.video.load();}}
function play(p){ensureSource(p);p.video.play().catch(()=>{});}
function reconcile(){
 const fullscreen=document.fullscreenElement;
 for(const p of players){
  const visible=p.ratio>.12||fullscreen===p.el;
  const allowed=visible&&!motionPaused&&!document.hidden&&!p.userPaused&&(!fullscreen||fullscreen===p.el);
  if(allowed)play(p);else p.video.pause();
 }
}
reducedMotion.addEventListener('change',event=>{motionPaused=event.matches;reconcile();});
for(const p of players){
 const toggle=p.el.querySelector('.play-toggle'),seek=p.el.querySelector('.video-seek');
 function update(){toggle.textContent=p.video.paused?'Play':'Pause';toggle.setAttribute('aria-label',p.video.paused?'Play video':'Pause video');}
 p.video.addEventListener('play',update);p.video.addEventListener('pause',update);
 p.video.addEventListener('timeupdate',()=>{if(Number.isFinite(p.video.duration)&&p.video.duration>0)seek.value=String(p.video.currentTime/p.video.duration*100);});
 p.video.addEventListener('error',()=>{p.el.querySelector('.video-error').hidden=false;});
 toggle.addEventListener('click',()=>{if(p.video.paused){p.userPaused=false;motionPaused=false;reconcile();}else{p.userPaused=true;p.video.pause();}});
 seek.addEventListener('input',()=>{ensureSource(p);if(Number.isFinite(p.video.duration))p.video.currentTime=p.video.duration*Number(seek.value)/100;});
 p.el.querySelector('.fullscreen-toggle').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(p.el.requestFullscreen)await p.el.requestFullscreen();else if(p.video.webkitEnterFullscreen)p.video.webkitEnterFullscreen();}catch{}});
}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const p=players.find(p=>p.el===entry.target);p.ratio=entry.intersectionRatio;}reconcile();},{threshold:[0,.12,.3,.6,1]});
players.forEach(p=>observer.observe(p.el));
const preloadObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const p=players.find(p=>p.el===entry.target);p.video.preload='metadata';ensureSource(p);preloadObserver.unobserve(entry.target);}}},{rootMargin:'160px 0px'});
players.forEach(p=>preloadObserver.observe(p.el));
document.addEventListener('visibilitychange',reconcile);
document.addEventListener('fullscreenchange',reconcile);
const navLinks=[...document.querySelectorAll('nav a')];
const navObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)navLinks.forEach(link=>{const active=link.hash===`#${entry.target.id}`;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});},{rootMargin:'-15% 0px -60% 0px'});
document.querySelectorAll('main section[id]').forEach(section=>navObserver.observe(section));
