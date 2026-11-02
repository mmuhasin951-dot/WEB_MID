const $ = id => document.getElementById(id);
const homeScreen=$('homeScreen'), gameScreen=$('gameScreen');
let mode='bubbles', difficulty='medium', running=false, score=0, misses=0, correct=0, incorrect=0;
let bubbles=[], bubbleLoop=null, spawnLoop=null, timerLoop=null, elapsed=0, timeLeft=0, target=null, targetStarted=0, responseTotal=0, responses=0, keySet='home';

const levels={
 easy:{bubbleSpeed:22,spawn:1700,count:5,time:60,targets:12},
 medium:{bubbleSpeed:34,spawn:1300,count:6,time:45,targets:18},
 hard:{bubbleSpeed:48,spawn:950,count:7,time:35,targets:25}
};
const sets={home:['A','S','D','F','J','K','L'],top:['Q','W','E','R','U','I','O','P'],mixed:['A','E','I','O','U','J','K','L','Q','W']};

document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>openGame(btn.dataset.mode)));
$('difficultySelect').addEventListener('change',e=>difficulty=e.target.value);
$('homeBtn').addEventListener('click',goHome);
$('restartBtn').addEventListener('click',()=>startMode());
$('resetBtn').addEventListener('click',()=>{stopAll();resetState();renderStats();$('resultsPanel').classList.add('hidden');$('bubblesPanel').classList.toggle('hidden',mode!=='bubbles');$('magnetPanel').classList.toggle('hidden',mode!=='magnet');if(mode==='bubbles')showBubbleIntro();else showMagnetIntro();});
$('startBubblesBtn').addEventListener('click',startMode);
$('startMagnetBtn').addEventListener('click',startMode);
$('playAgainBtn').addEventListener('click',startMode);
$('resultsHomeBtn').addEventListener('click',goHome);
$('keySetSelect').addEventListener('change',e=>{keySet=e.target.value;$('keySetLabel').textContent=e.target.options[e.target.selectedIndex].text.split(' ')[0].toUpperCase();renderKeyboard();if(!running&&mode==='magnet')newTarget();});

function openGame(selected){
 mode=selected;difficulty=$('difficultySelect').value;homeScreen.classList.add('hidden');gameScreen.classList.remove('hidden');
 $('gameTitle').textContent=mode==='bubbles'?'Bubbles':'KeyMagnet';$('modeEyebrow').textContent=mode==='bubbles'?'MODE A · LETTER RECOGNITION':'MODE B · KEYBOARD PRECISION';
 $('bubblesPanel').classList.toggle('hidden',mode!=='bubbles');$('magnetPanel').classList.toggle('hidden',mode!=='magnet');$('resultsPanel').classList.add('hidden');
 resetState();renderStats();if(mode==='bubbles')showBubbleIntro();else{renderKeyboard();showMagnetIntro();}
}
function goHome(){stopAll();gameScreen.classList.add('hidden');homeScreen.classList.remove('hidden');}
function resetState(){score=0;misses=0;correct=0;incorrect=0;elapsed=0;timeLeft=levels[difficulty].time;bubbles=[];responseTotal=0;responses=0;running=false;target=null;clearArena();}
function clearArena(){document.querySelectorAll('.bubble').forEach(b=>b.remove());$('bubbleFeedback').textContent='';}
function stopAll(){running=false;[bubbleLoop,spawnLoop,timerLoop].forEach(id=>{if(id!==null)clearInterval(id)});bubbleLoop=spawnLoop=timerLoop=null;}
function renderStats(){
 const stats=mode==='bubbles'?[['SCORE',score],['MISSES',`${misses} / 6`],['TIME',`${timeLeft}s`],['DIFFICULTY',difficulty.toUpperCase()]]:[['SCORE',score],['CORRECT',correct],['INCORRECT',incorrect],['TIME',`${elapsed}s`]];
 $('statsGrid').innerHTML=stats.map(s=>`<div class="stat-card"><div class="stat-label">${s[0]}</div><div class="stat-value">${s[1]}</div></div>`).join('');
}
function showBubbleIntro(){clearArena();$('bubbleStart').classList.remove('hidden');$('bubbleStatus').textContent='Waiting to start';$('startBubblesBtn').textContent='Start Game →';}
function showMagnetIntro(){running=false;$('magnetFeedback').textContent='Choose Start to begin';$('magnetStatus').textContent='Waiting to start';$('startMagnetBtn').classList.remove('hidden');newTarget();}
function startMode(){
 stopAll();resetState();renderStats();$('resultsPanel').classList.add('hidden');
 if(mode==='bubbles')startBubbles();else startMagnet();
}
function startBubbles(){
 $('bubbleStart').classList.add('hidden');$('bubbleStatus').textContent='Game in progress';running=true;
 const cfg=levels[difficulty];
 for(let i=0;i<cfg.count;i++)spawnBubble(true);
 bubbleLoop=setInterval(updateBubbles,40);
 spawnLoop=setInterval(()=>{if(bubbles.length<cfg.count+2)spawnBubble(false)},cfg.spawn);
 timerLoop=setInterval(()=>{if(!running)return;timeLeft--;elapsed++;renderStats();if(timeLeft<=0)endGame('Time is up!')},1000);
}
function spawnBubble(initial){
 const arena=$('bubbleArena'),letter=String.fromCharCode(65+Math.floor(Math.random()*26));
 const el=document.createElement('div');el.className='bubble';el.textContent=letter;
 const x=5+Math.random()*88;el.style.left=x+'%';el.style.bottom=initial?(Math.random()*55)+'%':'-55px';
 arena.appendChild(el);bubbles.push({el,letter,y:initial?Math.random()*220:0,speed:levels[difficulty].bubbleSpeed*(0.8+Math.random()*.45)});
}
function updateBubbles(){
 if(!running)return;
 bubbles.forEach(b=>{b.y+=b.speed/25;b.el.style.bottom=b.y+'px';if(b.y>390&&!b.missed){b.missed=true;misses++;b.el.remove();}});
 bubbles=bubbles.filter(b=>!b.missed);
 if(misses>=6){endGame('Too many bubbles escaped!');return}
 renderStats();
}
function startMagnet(){
 running=true;correct=0;incorrect=0;elapsed=0;responseTotal=0;responses=0;
 $('startMagnetBtn').classList.add('hidden');$('magnetStatus').textContent='Training in progress';$('magnetFeedback').textContent='Find the highlighted key';
 newTarget();renderStats();
 timerLoop=setInterval(()=>{if(!running)return;elapsed++;renderStats();if(correct>=levels[difficulty].targets)endGame('Target set completed!');},1000);
}
function newTarget(){
 const arr=sets[keySet];target=arr[Math.floor(Math.random()*arr.length)];$('targetKey').textContent=target;
 renderKeyboard();
}
function renderKeyboard(){
 const arr=sets[keySet];$('keyboard').innerHTML=arr.map(k=>`<div class="key ${k===target?'active':''}" data-key="${k}">${k}</div>`).join('');
}
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.altKey||e.metaKey)return;
 const key=e.key.toUpperCase();if(key.length!==1||key<'A'||key>'Z')return;
 if(!running)return;
 if(mode==='bubbles')handleBubbleKey(key);else handleMagnetKey(key);
});
function handleBubbleKey(key){
 const match=bubbles.find(b=>b.letter===key);
 if(match){match.el.remove();bubbles=bubbles.filter(b=>b!==match);score+=10;correct++;feedback('Correct +10',true);if(bubbles.length<levels[difficulty].count)spawnBubble(false);}
 else{score=Math.max(0,score-2);incorrect++;feedback('Wrong key −2',false);}
 renderStats();
}
function feedback(msg,good){$('bubbleFeedback').textContent=msg;$('bubbleFeedback').style.color=good?'var(--green)':'var(--red)';}
function handleMagnetKey(key){
 const now=Date.now(),ms=now-targetStarted;responses++;responseTotal+=ms;
 if(key===target){correct++;score+=10;$('magnetFeedback').textContent=`Correct · ${(ms/1000).toFixed(2)} sec`;$('magnetFeedback').style.color='var(--green)';}
 else{incorrect++;score=Math.max(0,score-3);$('magnetFeedback').textContent=`Incorrect · target was ${target} (−3)`;$('magnetFeedback').style.color='var(--red)';}
 const keyEl=document.querySelector(`.key[data-key="${key}"]`);if(keyEl)keyEl.classList.add(key===target?'correct':'');
 renderStats();
 if(correct>=levels[difficulty].targets){endGame('Target set completed!');return}
 newTarget();
}
function endGame(message){
 stopAll();$('bubbleStatus').textContent='Session ended';$('magnetStatus').textContent='Session ended';
 $('resultsPanel').classList.remove('hidden');$('resultTitle').textContent=message;
 $('resultMessage').textContent=mode==='bubbles'?'Your bubble challenge summary:':'Your keyboard precision summary:';
 const accuracy=(correct+incorrect)?Math.round(correct/(correct+incorrect)*100):0;
 const data=mode==='bubbles'?[['FINAL SCORE',score],['CORRECT POPS',correct],['MISSES',misses],['WRONG KEYS',incorrect]]:[['FINAL SCORE',score],['CORRECT',correct],['INCORRECT',incorrect],['AVG RESPONSE',responses?(responseTotal/responses/1000).toFixed(2)+'s':'—']];
 $('resultStats').innerHTML=data.map(d=>`<div class="result-item"><span>${d[0]}</span><strong>${d[1]}</strong></div>`).join('');
 if(mode==='magnet')$('resultMessage').textContent=`${message} Accuracy: ${accuracy}%. Total training time: ${elapsed} seconds.`;
 else $('resultMessage').textContent=`${message} You popped ${correct} bubbles and missed ${misses}.`;
 $('startBubblesBtn').classList.remove('hidden');$('startMagnetBtn').classList.remove('hidden');
}
