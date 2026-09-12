
const API_BASE = (localStorage.getItem("learnmate_api_base") || "").replace(/\/+$/,"");
const DEMO_MODE = !API_BASE;
const apiUrl = path => API_BASE ? API_BASE + path : path;

let S={
  token:localStorage.lm_token || null,
  user:JSON.parse(localStorage.lm_user||"null"),
  profile:JSON.parse(localStorage.lm_profile||"null"),
  sessionId:localStorage.lm_session || null
};
let sock=null, quizData=null;
const $=x=>document.getElementById(x);
function show(x){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(x).classList.add('active')}
function tab(r){
  $('role').value=r;
  $('kidFields').classList.toggle('hidden',r!=='kid');
  $('adultFields').classList.toggle('hidden',r==='kid');
  $('msg').textContent='';
  if(r==='parent'){$('email').value='parent@demo.com';$('password').value='demo123'}
  if(r==='teacher'){$('email').value='teacher@demo.com';$('password').value='demo123'}
}

const demoStore = {
  assignments: JSON.parse(localStorage.lm_demo_assignments||'null') || [
    {subject:'Science',topic:'Force and Motion',instructions:'Understand force with daily-life examples.'}
  ],
  quizHistory: JSON.parse(localStorage.lm_demo_quizzes||'[]'),
  notifications: JSON.parse(localStorage.lm_demo_notifs||'null') || [
    {kid_name:'Aarav',message:'Aarav completed Science quiz: 4/5',created_at:new Date().toISOString()},
    {kid_name:'Aarav',message:'Aarav logged in for study',created_at:new Date(Date.now()-3600000).toISOString()}
  ]
};
function saveDemo(){
  localStorage.lm_demo_assignments=JSON.stringify(demoStore.assignments);
  localStorage.lm_demo_quizzes=JSON.stringify(demoStore.quizHistory);
  localStorage.lm_demo_notifs=JSON.stringify(demoStore.notifications);
}
const demoKid={id:3,user_id:3,full_name:'Aarav Patel',role:'kid',student_code:'LM-AARAV-1001',standard:'6',board:'CBSE',subjects:['Mathematics','Science','English'],preferred_language:'English + Gujarati'};
const demoParent={id:1,full_name:'Demo Parent',role:'parent'};
const demoTeacher={id:2,full_name:'Demo Teacher',role:'teacher'};

function demoQuestions(subject){
  const banks={
    Science:[
      {id:101,question:'Which of these is a force?',options:['Push','Colour','Temperature','Sound'],correct_index:0,explanation:'A push or pull is called a force.'},
      {id:102,question:'What can force change?',options:['Only colour','Motion or shape','Only mass','Only temperature'],correct_index:1,explanation:'Force can change motion, speed, direction or shape.'},
      {id:103,question:'A moving bicycle slows down when brakes are applied because of:',options:['Gravity only','Friction','Light','Magnetism'],correct_index:1,explanation:'Friction opposes motion and helps the bicycle slow down.'},
      {id:104,question:'Which example shows a pull?',options:['Kicking a ball','Opening a drawer toward you','Pushing a cart','Pressing a switch'],correct_index:1,explanation:'Pulling a drawer toward you is a pull force.'},
      {id:105,question:'If balanced forces act on a resting object, it will usually:',options:['Stay at rest','Always move fast','Disappear','Become heavier'],correct_index:0,explanation:'Balanced forces do not change the state of motion.'}
    ],
    Mathematics:[
      {id:201,question:'What is 7 × 8?',options:['54','56','64','48'],correct_index:1,explanation:'7 multiplied by 8 equals 56.'},
      {id:202,question:'Which fraction is larger?',options:['1/4','1/3','They are equal','Cannot tell'],correct_index:1,explanation:'With the same numerator, the fraction with the smaller denominator is larger.'},
      {id:203,question:'48 ÷ 6 = ?',options:['6','7','8','9'],correct_index:2,explanation:'48 divided by 6 equals 8.'},
      {id:204,question:'3/4 of 20 = ?',options:['10','12','15','18'],correct_index:2,explanation:'20 ÷ 4 = 5, then 5 × 3 = 15.'},
      {id:205,question:'Which number is prime?',options:['9','15','17','21'],correct_index:2,explanation:'17 has only two factors: 1 and 17.'}
    ]
  };
  return banks[subject] || banks.Science;
}

async function api(path,o={}){
  if(DEMO_MODE) return demoApi(path,o);
  o.headers={...(o.headers||{}),'Content-Type':'application/json',...(S.token?{Authorization:'Bearer '+S.token}:{})};
  let r;
  try{
    r=await fetch(apiUrl(path),o);
  }catch(e){
    throw Error('Backend connect nathi thatu. Backend URL/check deployment.');
  }
  const ctype=r.headers.get('content-type')||'';
  if(!ctype.includes('application/json')){
    const txt=await r.text();
    throw Error('Backend JSON ni jagyae HTML return kare chhe. Backend URL/configuration check karo.');
  }
  const d=await r.json();
  if(!r.ok) throw Error(d.error||'Server error');
  return d;
}

async function demoApi(path,o={}){
  const body=()=>{try{return JSON.parse(o.body||'{}')}catch{return {}}};
  if(path==='/api/auth/login'){
    const b=body();
    if(b.role==='kid' && b.studentCode==='LM-AARAV-1001' && b.pin==='1234')
      return {token:'demo-kid-token',user:demoKid,profile:demoKid,sessionId:Date.now()};
    if(b.role==='parent' && b.email==='parent@demo.com' && b.password==='demo123')
      return {token:'demo-parent-token',user:demoParent};
    if(b.role==='teacher' && b.email==='teacher@demo.com' && b.password==='demo123')
      return {token:'demo-teacher-token',user:demoTeacher};
    throw Error('Demo credentials wrong chhe.');
  }
  if(path==='/api/auth/logout') return {ok:true};
  if(path==='/api/kid/today') return {profile:demoKid,assignments:demoStore.assignments};
  if(path==='/api/parent/kids') return [demoKid];
  if(path==='/api/teacher/students') return [demoKid];
  if(path==='/api/notifications') return demoStore.notifications;
  if(path.startsWith('/api/report/')){
    const subjectSummary = demoStore.quizHistory.length
      ? Object.values(demoStore.quizHistory.reduce((a,q)=>{
          a[q.subject] ||= {subject:q.subject,total:0,n:0};
          a[q.subject].total+=q.percent;a[q.subject].n++;
          return a;
        },{})).map(x=>({subject:x.subject,avg_percent:Math.round(x.total/x.n),attempts:x.n}))
      : [{subject:'Science',avg_percent:72,attempts:2},{subject:'Mathematics',avg_percent:58,attempts:2},{subject:'English',avg_percent:81,attempts:1}];
    return {
      profile:demoKid,studySeconds:78*60,
      quizzes:demoStore.quizHistory.length?demoStore.quizHistory:[{},{},{},{},{}],
      activities:[
        {title:'Science Quiz Completed',activity_type:'quiz',subject:'Science',created_at:new Date().toISOString()},
        {title:'AI Tutor Used',activity_type:'tutor',subject:'Science',created_at:new Date(Date.now()-1800000).toISOString()},
        {title:'Math Practice',activity_type:'practice',subject:'Mathematics',created_at:new Date(Date.now()-7200000).toISOString()}
      ],
      subjectSummary,
      suggestions:subjectSummary.map(s=>({
        subject:s.subject,level:s.avg_percent<60?'Needs Focus':s.avg_percent<80?'Learning':'Strong',
        text:s.avg_percent<60?`Daily 15–20 minutes ${s.subject} practice recommended.`:`Continue regular ${s.subject} practice.`
      }))
    };
  }
  if(path==='/api/kid/quiz/start'){
    const b=body(), subject=b.subject||'Science', qs=demoQuestions(subject);
    return {subject,topic:(demoStore.assignments.find(a=>a.subject===subject)||{}).topic||'Daily Practice',
      questions:qs.map(({correct_index,explanation,...q})=>q), _answers:qs};
  }
  if(path==='/api/kid/quiz/submit'){
    const b=body(), qs=demoQuestions(b.subject), amap=new Map(qs.map(q=>[q.id,q]));
    let score=0;
    const detail=b.answers.map(a=>{
      const q=amap.get(a.questionId), correct=q && a.selectedIndex===q.correct_index;
      if(correct)score++;
      return {question:q?.question||'',correct,explanation:q?.explanation||''};
    });
    const total=detail.length, percent=total?Math.round(score*100/total):0;
    const attempt={score,total,percent,subject:b.subject,created_at:new Date().toISOString()};
    demoStore.quizHistory.unshift(attempt);
    demoStore.notifications.unshift({kid_name:'Aarav',message:`Aarav completed ${b.subject} quiz: ${score}/${total}`,created_at:new Date().toISOString()});
    saveDemo();
    return {attempt,detail};
  }
  if(path==='/api/teacher/assignment'){
    const b=body();
    demoStore.assignments=[{subject:b.subject,topic:b.topic,instructions:b.instructions,board:b.board,standard:b.standard}];
    demoStore.notifications.unshift({kid_name:'Aarav',message:`Teacher assigned today’s topic: ${b.subject} — ${b.topic}`,created_at:new Date().toISOString()});
    saveDemo(); return {ok:true};
  }
  if(path==='/api/tutor'){
    const b=body(), m=(b.message||'').toLowerCase();
    let answer;
    if(m.includes('newton') || m.includes('force')){
      answer='Easy rite samjho: Force etle push ke pull. Newton na 1st law mujab object potani state maintain kare chhe jya sudhi external force na lage. 2nd law: vadhu force → vadhu acceleration (F = m × a). 3rd law: darek action ni equal ane opposite reaction hoy chhe. Example: tame wall ne push karo to wall pan tamne opposite force aape chhe.';
    }else if(m.includes('fraction')){
      answer='Fraction etle whole object na equal parts mathi ketla parts. Example: pizza na 4 equal slice hoy ane tame 1 slice lo, to 1/4. 1/3, 1/4 karta moto chhe kem ke 3 equal parts ma darek part 4 parts karta moto hoy.';
    }else{
      answer='Hu tamne aa topic simple steps ma samjavu: pehla basic idea, pachhi daily-life example, ane last ma ek nano question. Tame exact topic lakhsho to hu class 6 level par easy language ma samjavi dau.';
    }
    return {answer};
  }
  throw Error('Demo API route not found: '+path);
}

async function login(e){
  e.preventDefault();
  let r=$('role').value;
  let b=r==='kid'
    ? {role:r,studentCode:$('studentCode').value.trim(),pin:$('pin').value.trim()}
    : {role:r,email:$('email').value.trim(),password:$('password').value};
  $('msg').textContent='Logging in...';
  try{
    let d=await api('/api/auth/login',{method:'POST',body:JSON.stringify(b)});
    S={token:d.token,user:d.user,profile:d.profile||null,sessionId:d.sessionId||null};
    localStorage.lm_token=d.token;localStorage.lm_user=JSON.stringify(d.user);
    if(d.profile)localStorage.lm_profile=JSON.stringify(d.profile);
    if(d.sessionId)localStorage.lm_session=d.sessionId;
    $('msg').textContent='';
    route();
  }catch(e){$('msg').textContent=e.message}
}
async function logout(){
  try{if(S.user?.role==='kid'&&S.sessionId)await api('/api/auth/logout',{method:'POST',body:JSON.stringify({sessionId:+S.sessionId})})}catch{}
  ['lm_token','lm_user','lm_profile','lm_session'].forEach(k=>localStorage.removeItem(k));
  S={};show('login');
}
async function connect(){
  if(DEMO_MODE || !S.user || sock || !API_BASE) return;
  if(!window.io){
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=API_BASE+'/socket.io/socket.io.js';
      s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    }).catch(()=>{});
  }
  if(!window.io)return;
  sock=io(API_BASE);
  sock.on('connect',()=>sock.emit('identify',{userId:S.user.id}));
  sock.on('notification',n=>{
    let e=S.user.role==='parent'?$('liveParent'):$('liveTeacher');
    if(e){e.style.display='block';e.textContent=n.message}
    if(S.user.role==='parent')loadNotifs();
  });
}
async function route(){
  if(!S.user)return show('login');
  show(S.user.role);connect();
  if(S.user.role==='kid')await loadKid();
  if(S.user.role==='parent')await loadParent();
  if(S.user.role==='teacher')await loadTeacher();
}
async function loadKid(){
  let d=await api('/api/kid/today');S.profile=d.profile;
  $('kidHi').textContent='Hi '+S.user.full_name+' 👋';
  $('today').innerHTML='<h3>Today’s Study</h3>'+(d.assignments.length?d.assignments.map(a=>`<div class="row"><div><b>${a.subject}: ${a.topic}</b><small>${a.instructions||''}</small></div><span class="pill">Teacher Set</span></div>`).join(''):'<p>No teacher topic set for today.</p>');
  $('quizSubject').innerHTML=(d.profile.subjects||[]).map(x=>`<option>${x}</option>`).join('');
}
function panel(id){['quiz','tutor','practice'].forEach(x=>$(x).classList.add('hidden'));$(id).classList.remove('hidden')}
async function startQuiz(){
  quizData=await api('/api/kid/quiz/start',{method:'POST',body:JSON.stringify({subject:$('quizSubject').value})});
  $('quizArea').innerHTML=quizData.questions.length?quizData.questions.map((q,i)=>`<div class="question"><b>${i+1}. ${q.question}</b><div class="opts">${q.options.map((o,j)=>`<label><input type="radio" name="q${q.id}" value="${j}">${o}</label>`).join('')}</div></div>`).join('')+'<button onclick="submitQuiz()">Submit Quiz</button>':'<p>No matching questions yet.</p>';
}
async function submitQuiz(){
  let answers=quizData.questions.map(q=>{let x=document.querySelector(`input[name=q${q.id}]:checked`);return{questionId:q.id,selectedIndex:x?+x.value:-1}});
  let d=await api('/api/kid/quiz/submit',{method:'POST',body:JSON.stringify({subject:quizData.subject,topic:quizData.topic,answers})});
  $('quizArea').innerHTML=`<h3>Result: ${d.attempt.score}/${d.attempt.total} — ${d.attempt.percent}%</h3>`+d.detail.map(x=>`<div class="question"><b>${x.correct?'✅':'❌'} ${x.question}</b><p>${x.explanation||''}</p></div>`).join('');
}
async function askAI(){
  let m=$('ask').value.trim();if(!m)return;bubble(m,1);$('ask').value='';
  try{let d=await api('/api/tutor',{method:'POST',body:JSON.stringify({message:m,subject:$('quizSubject').value})});bubble(d.answer,0)}
  catch(e){bubble('Error: '+e.message,0)}
}
function bubble(t,me){let x=document.createElement('div');x.className='bubble'+(me?' me':'');x.textContent=t;$('chat').appendChild(x)}
async function loadNotifs(){let d=await api('/api/notifications');$('notifs').innerHTML=d.slice(0,12).map(n=>`<div class="row"><div><b>${n.kid_name||'Student'}</b><small>${n.message}</small></div><small>${new Date(n.created_at).toLocaleString()}</small></div>`).join('')}
async function loadParent(){let k=await api('/api/parent/kids');$('parentKids').innerHTML=k.map(x=>`<div class="row"><div><b>${x.full_name}</b><small>${x.student_code} • Class ${x.standard} • ${x.board}</small></div><button onclick="report(${x.user_id||x.id},'parentReport')">Report</button></div>`).join('');await loadNotifs();if(k[0])await report(k[0].user_id||k[0].id,'parentReport')}
async function loadTeacher(){let k=await api('/api/teacher/students');$('teacherKids').innerHTML=k.map(x=>`<div class="row"><div><b>${x.full_name}</b><small>${x.student_code} • Class ${x.standard} • ${x.board}</small></div><button onclick="report(${x.id},'teacherReport')">Report</button></div>`).join('');if(k[0])await report(k[0].id,'teacherReport')}
async function report(id,target){
  let d=await api('/api/report/'+id),w=[...d.subjectSummary].sort((a,b)=>a.avg_percent-b.avg_percent)[0];
  $(target).innerHTML=`<h3>${d.profile.full_name} — Complete Study Report</h3><div class="metrics"><div class="metric"><b>${Math.round(d.studySeconds/60)} min</b>Total study time</div><div class="metric"><b>${d.quizzes.length}</b>Quiz attempts</div><div class="metric"><b>${d.activities.length}</b>Tracked activities</div><div class="metric"><b>${w?w.avg_percent+'%':'—'}</b>${w?w.subject+' lowest':'No data'}</div></div><h4>Subject Performance</h4>`+(d.subjectSummary.length?d.subjectSummary.map(s=>`<div class="row"><b>${s.subject}</b><span>${s.avg_percent}% • ${s.attempts} quiz(es)</span></div>`).join(''):'<p>No quiz data yet.</p>')+'<h4>Smart Suggestions</h4>'+d.suggestions.map(s=>`<div class="row"><div><b>${s.subject} — ${s.level}</b><small>${s.text}</small></div></div>`).join('')+'<h4>Recent Activity</h4>'+d.activities.slice(0,10).map(a=>`<div class="row"><div><b>${a.title||a.activity_type}</b><small>${a.subject||''} • ${a.activity_type}</small></div><small>${new Date(a.created_at).toLocaleString()}</small></div>`).join('');
}
async function assign(e){
  e.preventDefault();
  await api('/api/teacher/assignment',{method:'POST',body:JSON.stringify({board:$('ab').value,standard:$('as').value,subject:$('asu').value,topic:$('at').value,instructions:$('ai').value})});
  alert(DEMO_MODE?'Today’s syllabus assigned in demo mode. Kid dashboard will show it now.':'Today’s syllabus assigned.');
  await loadTeacher();
}
async function enablePush(){
  if(DEMO_MODE){
    if(!('Notification' in window)){alert('Aa browser notifications support nathi karto.');return}
    const p=await Notification.requestPermission();
    if(p==='granted'){new Notification('LearnMate AI',{body:'Demo notifications enabled ✅'});alert('Demo notification enabled.')}
    else alert('Notification permission allow nathi thai.');
    return;
  }
  alert('Real push backend sathe configure thay pachhi work karse.');
}
tab('kid');
route();
