
(()=>{
const root=document.getElementById('flow-reflection');if(!root)return;
const field=root.querySelector('.field'),paths=root.querySelector('.paths'),draft=root.querySelector('.draft'),feedback=root.querySelector('.feedback');
const items=[
{id:'clustering',label:'Clustering',bin:'show',why:'The Neighbourhood model lets us observe groups forming through repeated local moves.'},
{id:'fairness',label:'Fairness',bin:'more',why:'A spatial pattern cannot tell us who benefits or whose needs have been overlooked.'},
{id:'branching',label:'Branching',bin:'show',why:'Growth shows how a repeated branching rule changes the form.'},
{id:'safety',label:'Structural safety',bin:'more',why:'To assess safety, we need loads, materials, connections, and structural analysis.'},
{id:'comfort',label:'Comfort',bin:'more',why:'Comfort needs evidence about people and environmental conditions.'},
{id:'boundaries',label:'Spatial boundaries',bin:'show',why:'Territory shows how distance to seeds divides the field into regions.'},
{id:'variation',label:'Geometric variation',bin:'show',why:'We can compare the shapes produced by different parameter settings.'},
{id:'accessibility',label:'Accessibility',bin:'more',why:'Accessibility depends on routes, barriers, dimensions, and user needs.'}
];
const explanations=document.createElement('section');
explanations.className='research-connection concept-explanations';
const explanationHeading=document.createElement('strong');
explanationHeading.textContent='Explore the eight concepts';
explanations.append(explanationHeading);
items.forEach(item=>{const p=document.createElement('p'),label=document.createElement('strong');label.textContent=item.label;p.append(label,document.createTextNode(' '+item.why));explanations.append(p);});
feedback.after(explanations);
function showExplanation(item){explanations.dispatchEvent(new CustomEvent('show-concept',{detail:items.indexOf(item)}));}
const colors={show:'#E4B5AB',more:'#E8D89F'},desktop=[[14,13],[39,9],[65,12],[87,21],[12,53],[89,57],[28,84],[69,90]];
let selected=null,pointer=null,connected=[],nodes=[],suppressClick=false,positions=null;
function validPositions(v){return Array.isArray(v)&&v.length===8&&v.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1));}
if(validPositions(window.openai?.widgetState?.flowPositions))positions=window.openai.widgetState.flowPositions;
const saved=window.openai?.widgetState?.flowConnectionsAvoid;if(Array.isArray(saved))connected=saved.filter(id=>items.some(i=>i.id===id));
function save(){window.openai?.setWidgetState?.({modelContent:{activity:'Flowing connections prototype',connected:connected.length,total:8},privateContent:{flowConnectionsAvoid:connected,flowPositions:positions}})?.catch(()=>{});}
function center(el){const a=el.getBoundingClientRect(),b=field.getBoundingClientRect();return{x:a.left-b.left+a.width/2,y:a.top-b.top+a.height/2};}
function curve(a,b,index){const dx=b.x-a.x,dy=b.y-a.y;const bend=(index%2?1:-1)*(45+(index%3)*24);return `M${a.x},${a.y} C${a.x+dx*.22+bend},${a.y+dy*.45} ${a.x+dx*.78-bend},${a.y+dy*.55} ${b.x},${b.y}`;}
function routeFlow(start, target, radius, width, height, boxes, previous, fine=false) {
  const step=fine?2:5, cols=Math.ceil(width/step), rows=Math.ceil(height/step), size=cols*rows;
  const blocked=new Uint8Array(size), clearance=fine?3:7;
  const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  function occupied(p){
    if(p.x<8||p.x>width-8||p.y<8||p.y>height-28)return true;
    if(boxes.some(b=>b.r?Math.hypot(p.x-b.x,p.y-b.y)<b.r: p.x>b.x-8&&p.x<b.x+b.w+8&&p.y>b.y-8&&p.y<b.y+b.h+8))return true;
    return previous.some(line=>line.some((a,i)=>i&&distance(p,line[i-1],a)<clearance));
  }
  const point=n=>({x:(n%cols)*step,y:Math.floor(n/cols)*step});
  for(let n=0;n<size;n++)blocked[n]=occupied(point(n))?1:0;
  const source=Math.round(start.y/step)*cols+Math.round(start.x/step);
  if(source<0||source>=size||blocked[source])return fine?null:routeFlow(start,target,radius,width,height,boxes,previous,true);
  const cost=new Float64Array(size).fill(Infinity),parent=new Int32Array(size).fill(-1),done=new Uint8Array(size),heap=[];
  const heuristic=p=>Math.max(0,Math.hypot(p.x-target.x,p.y-target.y)-radius);
  function push(n,f){let i=heap.length;heap.push({n,f});while(i){let j=(i-1)>>1;if(heap[j].f<=f)break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j;}}
  function pop(){const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;while(true){let a=i*2+1,b=a+1,j=i;if(a<heap.length&&heap[a].f<heap[j].f)j=a;if(b<heap.length&&heap[b].f<heap[j].f)j=b;if(j===i)break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j;}}return top.n;}
  cost[source]=0;push(source,heuristic(start));let end=-1;
  while(heap.length){const n=pop();if(done[n])continue;done[n]=1;const p=point(n),d=Math.hypot(p.x-target.x,p.y-target.y);if(d>=radius&&d<radius+step*1.5){const edge={x:target.x+(p.x-target.x)*radius/d,y:target.y+(p.y-target.y)*radius/d};if(!previous.some(l=>l.some((a,i)=>i&&distance(edge,l[i-1],a)<clearance))){end=n;break;}}
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=n%cols+dx,y=Math.floor(n/cols)+dy,m=y*cols+x;if(x<0||x>=cols||y<0||y>=rows||blocked[m]||done[m])continue;if(dx&&dy&&(blocked[n+dx]||blocked[n+dy*cols]))continue;
      const g=cost[n]+step*Math.hypot(dx,dy);if(g<cost[m]){cost[m]=g;parent[m]=n;push(m,g+heuristic(point(m)));}}
  }
  if(end<0)return fine?null:routeFlow(start,target,radius,width,height,boxes,previous,true);
  let raw=[];for(let n=end;n>=0;n=parent[n])raw.push(point(n));raw.reverse();
  function clear(a,b){const count=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2);for(let i=0;i<=count;i++){const t=i/(count||1);if(occupied({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;}return true;}
  let simple=[raw[0]];for(let i=0;i<raw.length-1;){let j=raw.length-1;while(j>i+1&&!clear(raw[i],raw[j]))j--;simple.push(raw[j]);i=j;}
  // Round corners only when every new segment still clears the obstacles.
  for(let pass=0;pass<3;pass++){let smooth=[simple[0]];for(let i=0;i<simple.length-1;i++){const a=simple[i],b=simple[i+1];smooth.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y},{x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y});}smooth.push(simple.at(-1));if(smooth.every((p,i)=>!i||clear(smooth[i-1],p)))simple=smooth;else break;}
  simple.clearance=clearance;return simple;
}

function crossingPoints(lines){
const result=[];
for(let i=0;i<lines.length;i++)for(let j=0;j<i;j++){
 const a=lines[i],b=lines[j];
 for(let u=1;u<a.length;u++)for(let v=1;v<b.length;v++){
  const p=a[u-1],q=b[v-1],rx=a[u].x-p.x,ry=a[u].y-p.y,sx=b[v].x-q.x,sy=b[v].y-q.y;
  const den=rx*sy-ry*sx;if(Math.abs(den)<1e-8)continue;
  const t=((q.x-p.x)*sy-(q.y-p.y)*sx)/den,k=((q.x-p.x)*ry-(q.y-p.y)*rx)/den;
  if(t<0||t>1||k<0||k>1)continue;
  const hit={x:p.x+t*rx,y:p.y+t*ry};
  if(!result.some(c=>Math.hypot(c.x-hit.x,c.y-hit.y)<9))result.push(hit);
 }
}
return result;
}
let routed=[];
function draw(){
paths.replaceChildren();routed=[];
const base=field.getBoundingClientRect();
const boxes=nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.left-base.left,y:r.top-base.top,w:r.width,h:r.height};});
const targets=[...field.querySelectorAll('.target')];
targets.forEach(t=>boxes.push({...center(t),r:t.offsetWidth/2}));
let blockedCount=0;
connected.forEach(id=>{const index=items.findIndex(i=>i.id===id),item=items[index],box=boxes[index],target=targets.find(t=>t.dataset.bin===item.bin);
const c0=center(target),mx=box.x+box.w/2,my=box.y+box.h/2;
const ports=[{x:mx,y:box.y-14,edge:{x:mx,y:box.y},px:'50%',py:'0%'},{x:mx,y:box.y+box.h+14,edge:{x:mx,y:box.y+box.h},px:'50%',py:'100%'},{x:box.x-14,y:my,edge:{x:box.x,y:my},px:'0%',py:'50%'},{x:box.x+box.w+14,y:my,edge:{x:box.x+box.w,y:my},px:'100%',py:'50%'}];
ports.sort((a,b)=>Math.hypot(a.x-c0.x,a.y-c0.y)-Math.hypot(b.x-c0.x,b.y-c0.y));
let line=null,port=null;
for(const allowCross of [false,true]){
for(const candidate of ports){
  const route=routeFlow(candidate,c0,target.offsetWidth/2,field.clientWidth,field.clientHeight,boxes,allowCross?[]:routed);
  if(!route)continue;
  // Check the short exit too, excluding only its own word rectangle.
  const others=boxes.filter((_,i)=>i!==index);
  const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  let safe=true;for(let j=0;j<=16;j++){const t=j/16,p={x:candidate.edge.x+(route[0].x-candidate.edge.x)*t,y:candidate.edge.y+(route[0].y-candidate.edge.y)*t};if(others.some(b=>b.r?Math.hypot(p.x-b.x,p.y-b.y)<b.r:p.x>b.x-8&&p.x<b.x+b.w+8&&p.y>b.y-8&&p.y<b.y+b.h+8)||(!allowCross&&routed.some(l=>l.some((a,i)=>i&&distance(p,l[i-1],a)<route.clearance)))){safe=false;break;}}
  if(safe){line=route;port=candidate;break;}
}
if(line)break;
}
if(!line){blockedCount++;return;}
nodes[index].style.setProperty('--port-x',port.px);nodes[index].style.setProperty('--port-y',port.py);
line.unshift(port.edge);
// Finish at the target perimeter; each connection keeps its own approach.
const last=line.at(-1),c=center(target),d=Math.hypot(last.x-c.x,last.y-c.y),r=target.offsetWidth/2;
line.push({x:c.x+(last.x-c.x)*r/d,y:c.y+(last.y-c.y)*r/d});
routed.push(line);
const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',line.map((v,i)=>(i?'L':'M')+v.x.toFixed(1)+','+v.y.toFixed(1)).join(' '));p.setAttribute('fill','none');p.setAttribute('stroke',colors[item.bin]);p.setAttribute('stroke-width','2');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');paths.append(p);
});
const crossings=crossingPoints(routed);
crossings.forEach(c=>{const mark=document.createElementNS('http://www.w3.org/2000/svg','circle');mark.setAttribute('class','crossing-mark');mark.setAttribute('cx',c.x);mark.setAttribute('cy',c.y);mark.setAttribute('r','4.5');mark.setAttribute('fill','#292039');mark.setAttribute('stroke','#F7F4FF');mark.setAttribute('stroke-width','1.5');paths.append(mark);});
return blockedCount;
}
function layout(fresh=false){
const w=field.clientWidth,h=field.clientHeight;
nodes.forEach(n=>n.style.maxWidth=w<570?'calc(50% - 24px)':'165px');
const dims=nodes.map(n=>({w:n.offsetWidth,h:n.offsetHeight}));
const circles=[...field.querySelectorAll('.target')].map(t=>({...center(t),r:t.offsetWidth/2}));
function fits(p,i,placed,gap){const s=dims[i],left=p[0]*w-s.w/2,right=left+s.w,top=p[1]*h-s.h/2,bottom=top+s.h;
if(left<14||right>w-14||top<18||bottom>h-48)return false;
if(circles.some(c=>Math.hypot(c.x-Math.max(left,Math.min(right,c.x)),c.y-Math.max(top,Math.min(bottom,c.y)))<c.r+24))return false;
return placed.every(q=>!q||Math.abs(p[0]*w-q.p[0]*w)>(s.w+dims[q.i].w)/2+gap||Math.abs(p[1]*h-q.p[1]*h)>(s.h+dims[q.i].h)/2+gap);}
const valid=positions&&positions.every((p,i)=>fits(p,i,positions.slice(0,i).map((v,j)=>({p:v,i:j})),12));
if(fresh||!valid){
 const previous=positions;let result=null;
 const order=dims.map((_,i)=>i).sort((a,b)=>dims[b].w*dims[b].h-dims[a].w*dims[a].h);
 for(let attempt=0;attempt<60&&!result;attempt++){
  const placed=[],candidate=new Array(8);let ok=true;
  for(const i of order){let best=null,score=-Infinity;
   for(let trial=0;trial<350;trial++){const p=[Math.random(),Math.random()];if(!fits(p,i,placed,attempt<30?24:14))continue;
    if(fresh&&previous&&Math.hypot((p[0]-previous[i][0])*w,(p[1]-previous[i][1])*h)<45)continue;
    const spacing=placed.length?Math.min(...placed.map(q=>Math.hypot((p[0]-q.p[0])*w,(p[1]-q.p[1])*h))):Math.random()*80;
    if(spacing>score){best=p;score=spacing;}}
   if(!best){ok=false;break;}candidate[i]=best;placed.push({p:best,i});
  }if(ok)result=candidate;
 }
 if(result)positions=result;else if(!valid){feedback.textContent='Please widen the activity to make room for the words.';return;}
}
nodes.forEach((n,i)=>{n.style.left=positions[i][0]*w+'px';n.style.top=positions[i][1]*h+'px';});draw();
}
function select(id){selected=id;nodes.forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.id===id)));}
function connect(bin){if(!selected){feedback.textContent='Select a word first, then choose a destination.';return;}const item=items.find(i=>i.id===selected);if(item.bin!==bin){feedback.textContent=`${item.label} belongs in “${item.bin==='show'?'The models reveal':'We need more evidence'}”. ${item.why}`;return;}connected.push(item.id);if(draw()){connected.pop();draw();feedback.textContent='Correct destination, but the words or bubbles leave no route. Shuffle to create more space.';return;}nodes[items.indexOf(item)].classList.add('connected');showExplanation(item);feedback.textContent=item.label+' connected.'+(connected.length===8?' All eight connected. Your drawing brings the model’s possibilities and limits together.':'');select(null);root.querySelector('.progress').textContent=`${connected.length} of 8 connected`;draw();save();}
items.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className='word';b.textContent=item.label;b.dataset.id=item.id;b.style.setProperty('--line',colors[item.bin]);b.setAttribute('aria-pressed','false');if(connected.includes(item.id))b.classList.add('connected');field.append(b);nodes.push(b);
b.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}if(connected.includes(item.id)){showExplanation(item);feedback.textContent=item.label+' — explanation selected below.';return;}select(item.id);feedback.textContent=item.label+' selected. Choose a destination.';});
b.addEventListener('pointerdown',e=>{if(connected.includes(item.id)||e.button!==0)return;select(item.id);pointer={id:e.pointerId,index:i,startX:e.clientX,startY:e.clientY,moved:false};b.setPointerCapture(e.pointerId);});
b.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;if(Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>5)pointer.moved=true;if(!pointer.moved)return;const r=field.getBoundingClientRect();draft.setAttribute('d',curve(center(b),{x:e.clientX-r.left,y:e.clientY-r.top},i));root.querySelectorAll('.target').forEach(t=>{const q=t.getBoundingClientRect();t.classList.toggle('over',e.clientX>=q.left&&e.clientX<=q.right&&e.clientY>=q.top&&e.clientY<=q.bottom);});});
b.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const moved=pointer.moved;suppressClick=moved;pointer=null;draft.setAttribute('d','');const target=[...root.querySelectorAll('.target')].find(t=>{const q=t.getBoundingClientRect();return e.clientX>=q.left&&e.clientX<=q.right&&e.clientY>=q.top&&e.clientY<=q.bottom;});root.querySelectorAll('.target').forEach(t=>t.classList.remove('over'));if(moved&&target)connect(target.dataset.bin);});
b.addEventListener('pointercancel',()=>{pointer=null;draft.setAttribute('d','');root.querySelectorAll('.target').forEach(t=>t.classList.remove('over'));});
});
root.querySelectorAll('.target').forEach(t=>t.addEventListener('click',()=>connect(t.dataset.bin)));
root.querySelector('.reset').addEventListener('click',()=>{
connected=[];pointer=null;suppressClick=false;select(null);draft.setAttribute('d','');nodes.forEach(n=>{n.classList.remove('connected');n.style.removeProperty('--port-x');n.style.removeProperty('--port-y');});root.querySelectorAll('.target').forEach(t=>t.classList.remove('over'));root.querySelector('.progress').textContent='0 of 8 connected';feedback.textContent='Connections cleared. The words are in the same positions—try a different order.';draw();save();});
root.querySelector('.shuffle').addEventListener('click',()=>{
connected=[];pointer=null;suppressClick=false;select(null);draft.setAttribute('d','');nodes.forEach(n=>{n.classList.remove('connected');n.style.removeProperty('--port-x');n.style.removeProperty('--port-y');});root.querySelectorAll('.target').forEach(t=>t.classList.remove('over'));root.querySelector('.progress').textContent='0 of 8 connected';feedback.textContent='New positions. Choose a connection to begin.';layout(true);save();});
root.addEventListener('keydown',e=>{if(e.key==='Escape'){select(null);draft.setAttribute('d','');feedback.textContent='Selection cleared.';}});
root.querySelector('.progress').textContent=`${connected.length} of 8 connected`;
window.addEventListener('openai:set_globals',e=>{const ids=e.detail?.globals?.widgetState?.flowConnectionsAvoid;if(!Array.isArray(ids))return;if(validPositions(e.detail.globals.widgetState.flowPositions))positions=e.detail.globals.widgetState.flowPositions;connected=[...new Set(ids)].filter(id=>items.some(i=>i.id===id));nodes.forEach(n=>n.classList.toggle('connected',connected.includes(n.dataset.id)));root.querySelector('.progress').textContent=connected.length+' of 8 connected';select(null);layout();});
new ResizeObserver(()=>layout()).observe(field);layout();
})();

