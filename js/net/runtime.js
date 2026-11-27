// Runtime injected at the top of every page that is shown in the sandboxed iframe.
// javascript: links are run by hand because sandboxed frames refuse javascript: navigations.
// It routes links and forms to the parent (the virtual network), stubs alert/confirm/prompt and exposes `vloc`.
const CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'";

export function inject(html, { nonce, vloc }) {
  const safe = (s) => JSON.stringify(s).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
  const runtime = `<meta http-equiv="Content-Security-Policy" content="${CSP}"><script>(function(){
var N=${safe(nonce)},P=parent;window.vloc=${safe(vloc)};
function send(t,d){P.postMessage({n:N,t:t,d:d},'*')}
window.alert=function(m){send('alert',String(m))};window.confirm=function(m){send('alert',String(m));return true};window.prompt=function(m){send('alert',String(m));return ''};
document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');e.preventDefault();if(/^\\s*javascript:/i.test(h)){var c=h.replace(/^\\s*javascript:/i,'');try{c=decodeURIComponent(c)}catch(x){}try{(0,eval)(c)}catch(x){}return}send('nav',{href:h})},true);
document.addEventListener('submit',function(e){var f=e.target;e.preventDefault();var fd={};try{new FormData(f).forEach(function(v,k){fd[k]=String(v)})}catch(x){}
var s=e.submitter;if(s&&s.name)fd[s.name]=s.value;send('nav',{href:f.getAttribute('action')||'',method:(f.getAttribute('method')||'get').toUpperCase(),form:fd})},true);
window.addEventListener('message',function(e){var m=e.data;if(!m||m.n!==N)return;
if(m.t==='zoom'){document.documentElement.style.zoom=m.v===1?'':m.v}
if(m.t==='hash'){window.vloc.hash=m.v;window.dispatchEvent(new Event('hashchange'))}
if(m.t==='lantern'){var s=document.getElementById('__lantern');if(m.v&&!s){s=document.createElement('style');s.id='__lantern';s.textContent='*{color:#f0c987!important;-webkit-text-fill-color:#f0c987!important;opacity:1!important;visibility:visible!important;text-shadow:none!important;outline:1px dashed rgba(240,201,135,.45)!important}';(document.head||document.documentElement).append(s)}else if(!m.v&&s)s.remove()}});
function ready(){send('ready',{title:document.title})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
window.addEventListener('load',ready);
})();<\/script>`;
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + runtime) : runtime + html;
}
