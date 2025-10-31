/* 基础 Hash Router + 状态模拟 + 交互脚本 */
(function(){
  const appEl = document.getElementById('app');
  const titleEl = document.querySelector('.app-title');
  const tabbarEl = document.querySelector('.app-tabbar');
  const toastEl = document.getElementById('toast');

  const State = {
    data: {
      children: [], questionBank: [], dailySets: [], results: [], mistakes: [], rewards: [], notifications: [],
      checkins: [],
      api: { baseUrl: '', token: '' },
      parentProfile: { name: '', phone: '', email: '' },
      account: { id:'', role:'guest', identifier:'', password:'' },
      settings: { highContrast: false },
      parentLock: { enabled: false, pin: "", }
    },
    session: {
      currentChildId: null,
      currentSetId: null,
      role: null,
      unlockUntil: 0,
    }
  };

  // 工具
  const sleep = (ms)=>new Promise(r=>setTimeout(r, ms));
  const showToast = (msg, ms=1800)=>{ toastEl.textContent = msg; toastEl.hidden = false; setTimeout(()=> toastEl.hidden = true, ms); };
  const setState = (name)=>{ appEl.setAttribute('data-state', name); };
  const setTitle = (t)=>{ titleEl.textContent = t || '小学口算练习'; };
  const save = ()=> localStorage.setItem('se-prototype', JSON.stringify(State));
  const load = ()=>{ try{ const raw = localStorage.getItem('se-prototype'); if(raw){ const s = JSON.parse(raw); Object.assign(State.data, s.data||{}); Object.assign(State.session, s.session||{});} }catch(e){} };

  // 路由表
  const routes = {
    '': 'auth-login',
    'index': 'auth-login',
    'onboarding': { title: '欢迎', file: 'onboarding.html' },
    'parent-home': { title: '家长首页', file: 'parent-home.html' },
    'child-home': { title: '学生首页', file: 'child-home.html' },
    'profile-child': { title: '孩子档案', file: 'profile-child.html' },
    'generator': { title: '出题器', file: 'generator.html' },
    'practice': { title: '练习', file: 'practice.html' },
    'result': { title: '结果', file: 'result.html' },
    'mistakes': { title: '错题本', file: 'mistakes.html' },
    'reports': { title: '报告中心', file: 'reports.html' },
    'print-center': { title: '打印中心', file: 'print-center.html' },
    'review-ocr': { title: '批改中心', file: 'review-ocr.html' },
    'calendar': { title: '日历打卡', file: 'calendar.html' },
  'study-settings': { title: '题库设置', file: 'study-settings.html' },
  'auth-register': { title: '注册', file: 'auth-register.html' },
  'auth-login': { title: '登录', file: 'auth-login.html' },
    'settings': { title: '设置', file: 'settings.html' },
    'notifications': { title: '通知', file: 'notifications.html' },
  'my': { title: '我的', file: 'my.html' },
    'rewards': { title: '奖励中心', file: 'rewards.html' },
    'help': { title: '帮助', file: 'help.html' },
  };

  // 简单数据生成/加载
  async function ensureData(){
    if(State.data.children && State.data.children.length) return;
    try{
      const res = await fetch('assets/mock-data.json');
      const data = await res.json();
      Object.assign(State.data, data);
      if(!Array.isArray(State.data.checkins)) State.data.checkins = [];
      if(!State.session.currentChildId && data.children[0]){
        State.session.currentChildId = data.children[0].id;
      }
      save();
    }catch(e){ console.error(e); }
  }

  const PARENT_ROUTES = new Set(['parent-home','generator','profile-child','reports','print-center','review-ocr','settings','notifications']);

  function parentLocked(){
    if(!State.data.parentLock?.enabled) return false;
    const now = Date.now();
    return !(State.session.unlockUntil && now < State.session.unlockUntil);
  }

  function lockView(target){
    return `<div class="card"><div class="section-title">家长童锁</div>
      <div class="text-subtle">访问该页面需要输入家长PIN。解锁后5分钟内无需重复输入。</div>
      <div style="height:8px"></div>
      <input id="lock-input" inputmode="numeric" type="password" placeholder="输入PIN" style="width:100%;height:48px;border-radius:10px;border:1px solid var(--c-border);padding:0 12px;font-size:var(--fz-lg)" />
      <div class="numpad" style="margin-top:12px">
        ${[1,2,3,4,5,6,7,8,9,'del',0,'ok'].map(k=>`<button class="numpad-btn ${k==='ok'?'primary':''} ${k==='del'?'warn':''}" data-key="${k}">${k==='del'?'退格':(k==='ok'?'解锁':k)}</button>`).join('')}
      </div>
      <div class="row" style="margin-top:12px">
        <a class="btn btn-plain col" href="#/child-home">切换到学生区</a>
      </div>
    </div>`;
  }

  // 渲染页面片段
  async function render(routeKey){
    const entry = routes[routeKey] || routes['auth-login'];
    if(typeof entry === 'string') return render(entry);

    setState('loading');
    setTitle(entry.title);

    try{
      if(PARENT_ROUTES.has(routeKey) && parentLocked()){
        appEl.innerHTML = lockView(routeKey);
        appEl.setAttribute('data-state','ready');
        bindCommonActions(routeKey);
        // 绑定锁输入
        const input = document.getElementById('lock-input');
        const submit = ()=>{
          const pin = (input.value||'').trim();
          if(pin && State.data.parentLock.pin && pin === State.data.parentLock.pin){
            State.session.unlockUntil = Date.now()+5*60*1000; save();
            showToast('已解锁（5分钟）');
            render(routeKey);
          }else{
            showToast('PIN 不正确');
          }
        };
        document.querySelectorAll('.numpad-btn[data-key]').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const k = btn.getAttribute('data-key');
            if(k==='del'){ input.value = input.value.slice(0,-1); }
            else if(k==='ok'){ submit(); }
            else { input.value += k; }
            input.focus();
          })
        });
        input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ submit(); } });
        return;
      }
      const res = await fetch(`pages/${entry.file}`);
      if(!res.ok) throw new Error(res.statusText);
      const html = await res.text();
      appEl.innerHTML = html;
      appEl.setAttribute('data-state','ready');
      activateTab(routeKey);
      bindCommonActions(routeKey);
      pageInit(routeKey);
    }catch(e){
      console.error(e);
      const isFile = location.protocol === 'file:';
      const tip = isFile
        ? '本地以 file:// 打开时，浏览器会阻止通过 fetch 读取页面片段与数据。请使用 VS Code Live Server 或启动本地静态服务器后再试。'
        : '请稍后重试。';
      appEl.innerHTML = errorView('加载失败', tip);
      setState('error');
    }
  }

  function errorView(title,desc){
    return `<div class="card"><div class="empty"><img class="empty-icon" src="assets/icons/error.svg" alt="错误图标"><div>${title}</div><div class="text-subtle">${desc}</div><button class="btn btn-primary" onclick="location.reload()">重试</button></div></div>`;
  }

  function renderTabbar(activeRoute){
    // 登录/注册/引导页隐藏底部导航
    if(['auth-login','auth-register','onboarding'].includes(activeRoute)){
      tabbarEl.innerHTML = '';
      return;
    }
    const role = State.session.role || 'student';
    /** 统一的底部导航：不直接展示“学生/家长”切换 **/
    const items = role==='parent'
      ? [
          { route:'parent-home', label:'主页', icon:'home.svg' },
          { route:'reports', label:'报告', icon:'report.svg' },
          { route:'my', label:'我的', icon:'user.svg' },
        ]
      : [
          { route:'child-home', label:'学习', icon:'practice.svg' },
          { route:'calendar', label:'打卡', icon:'calendar.svg' },
          { route:'rewards', label:'成就', icon:'trophy.svg' },
          { route:'my', label:'我的', icon:'user.svg' },
        ];
    tabbarEl.innerHTML = items.map(i=>
      `<a href="#/${i.route}" class="tab-item ${i.route===activeRoute?'active':''}" data-route="${i.route}" aria-label="${i.label}">
         <img src="assets/icons/${i.icon}" alt="" class="tab-icon" />
         <span>${i.label}</span>
       </a>`
    ).join('');
  }

  function activateTab(routeKey){
    // 重新渲染，确保“学生/家长不会同时出现”
    renderTabbar(routeKey);
  }

  function bindCommonActions(routeKey){
    // 顶部返回
    document.querySelector('[data-nav="back"]').onclick = ()=> history.back();

    // 全局离线监听
    const updateOnline = ()=>{ if(!navigator.onLine){ showToast('已离线，功能受限'); appEl.setAttribute('data-state','offline'); }else if(appEl.getAttribute('data-state')==='offline'){ appEl.setAttribute('data-state','ready'); }};
    window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline);
    window.addEventListener('online', updateOnline); window.addEventListener('offline', updateOnline);
    updateOnline();

    // 头部更多菜单
    const moreBtn = document.querySelector('[data-nav="more"]');
    const menu = document.getElementById('header-menu');
    if(moreBtn && menu){
      moreBtn.onclick = (e)=>{
        e.stopPropagation();
        buildHeaderMenu();
        menu.hidden = !menu.hidden;
      };
      document.addEventListener('click', (ev)=>{
        if(!menu.hidden){ menu.hidden = true; }
      }, { once: true });
      menu.addEventListener('click', (ev)=> ev.stopPropagation());
    }
  }

  function buildHeaderMenu(){
    const menu = document.getElementById('header-menu'); if(!menu) return;
    const role = State.session.role || 'student';
    const targetRole = role==='parent' ? 'student' : 'parent';
    const label = targetRole==='parent' ? '切换到家长模式' : '切换到学生模式';
    menu.innerHTML = `
      <div class="dropdown-item" id="menu-switch-role">${label}</div>
      <div class="dropdown-sep"></div>
      <a class="dropdown-item" href="#/settings">设置</a>
    `;
    document.getElementById('menu-switch-role').onclick = async ()=>{
      if(targetRole==='parent' && State.data.parentLock?.enabled){
        const pin = window.prompt('输入家长PIN以切换到家长模式');
        if(!pin || pin !== State.data.parentLock.pin){ showToast('PIN 不正确'); return; }
        State.session.unlockUntil = Date.now()+5*60*1000;
      }
      State.session.role = targetRole; save();
      updateRoleIndicator();
      renderTabbar(getRoute());
      location.hash = targetRole==='parent'? '#/parent-home' : '#/child-home';
      showToast('已切换角色');
      const menu = document.getElementById('header-menu'); if(menu) menu.hidden = true;
    };
  }

  // 页面初始化逻辑（轻量占位实现）
  function pageInit(route){
    switch(route){
      case 'onboarding': initOnboarding(); break;
      case 'parent-home': initParentHome(); break;
      case 'child-home': initChildHome(); break;
      case 'generator': initGenerator(); break;
      case 'practice': initPractice(); break;
      case 'result': initResult(); break;
      case 'mistakes': initMistakes(); break;
      case 'print-center': initPrintCenter(); break;
      case 'review-ocr': initReviewOCR(); break;
      case 'calendar': initCalendar(); break;
  case 'study-settings': initStudySettings(); break;
  case 'auth-register': initAuthRegister(); break;
  case 'auth-login': initAuthLogin(); break;
      case 'settings': initSettings(); break;
      case 'notifications': initNotifications(); break;
      case 'rewards': initRewards(); break;
  case 'my': initMy(); break;
      case 'reports': initReports(); break;
      case 'profile-child': initProfile(); break;
      case 'help': default: break;
    }
  }

  // 路由解析
  function getRoute(){
    const hash = location.hash.replace(/^#\//,'');
    return hash || 'auth-login';
  }

  window.addEventListener('hashchange', ()=> render(getRoute()));

  // 页面实现
  function initOnboarding(){
    const form = document.getElementById('onb-form');
    if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name')||'').toString().trim();
      const grade = (fd.get('grade')||'').toString().trim();
      const dailyCount = Number(fd.get('dailyCount')||30);
      State.session.role = 'student';
      if(name){
        const id = 'c_'+Math.random().toString(36).slice(2,8);
        const child = { id, name, grade, textbook: '人教版', goals: { dailyCount, timeLimitSec: 600 }};
        State.data.children.push(child);
        State.session.currentChildId = id;
      }
      save();
      updateRoleIndicator();
      location.hash = '#/child-home';
      showToast('设置完成');
    });
  }

  function initParentHome(){
    const list = document.querySelector('#kids-list');
    if(!list) return;
    const items = State.data.children.map(c=>{
      const today = (State.data.dailySets||[]).find(s=> s.childId===c.id && s.date===todayStr());
      const status = today? (getResultBySet(today.id)? '已完成':'未开始') : '未开始';
      const remain = today? (getResultBySet(today.id)? 0 : (today.questionIds.length)) : (c.goals?.dailyCount||30);
      return `<li class="card"> <div class="row" style="align-items:center"> <div class="col"><div class="text-strong">${c.name}（${c.grade||'未设年级'}）</div><div class="text-subtle">今日目标：${c.goals?.dailyCount||30}题</div></div><div class="col" style="flex:0 0 auto;display:flex;gap:8px"><span class="badge ${status==='已完成'?'badge-success':''}">${status}</span><button class="btn btn-primary" data-kid="${c.id}">一键出题</button></div></div></li>`
    }).join('');
    list.innerHTML = items || `<div class="card"><div class="empty"><img class="empty-icon" src="assets/icons/empty.svg" alt="空"><div>还没有孩子信息</div><a class="btn btn-primary" href="#/onboarding">去添加</a></div></div>`;
    list.querySelectorAll('[data-kid]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const childId = btn.getAttribute('data-kid');
        State.session.currentChildId = childId; save();
        generateDailySet(childId);
        location.hash = '#/child-home';
      })
    })

    // 本周进度与最近活动（针对当前孩子）
    const kid = getCurrentChild() || State.data.children[0];
    if(kid){
      const {percent} = getWeeklyProgress(kid.id);
      const pf = document.getElementById('weekly-progress-fill');
      const pp = document.getElementById('weekly-progress-percent');
      if(pf) pf.style.width = `${percent}%`;
      if(pp) pp.textContent = String(percent);

      const act = document.getElementById('recent-activity');
      if(act){
        const recent = getRecentActivity(kid.id, 5);
        act.innerHTML = recent.map(r=>{
          const d = new Date(r.timestamp);
          const acc = Math.round(r.correctCount/r.total*100);
          return `<li class="row" style="justify-content:space-between; padding:6px 0; border-bottom:1px dashed var(--c-border)">
            <span class="text-subtle">${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</span>
            <span>${r.correctCount}/${r.total} · <span class="text-strong">${acc}%</span> · ${Math.floor(r.durationSec/60)}分</span>
          </li>`;
        }).join('') || '<div class="text-subtle">暂无活动</div>';
      }
    }
  }

  function initChildHome(){
    const c = getCurrentChild(); if(!c) return;
    const info = document.querySelector('#child-info');
    const todaySet = (State.data.dailySets||[]).find(s=> s.childId===c.id && s.date===todayStr());
    const remain = todaySet? todaySet.questionIds.length : c.goals?.dailyCount || 30;
    info.innerHTML = `<div class="card"><div class="section-title">${c.name}，准备好了吗？</div><div class="text-subtle">今日剩余：${remain} 题 · 预计用时 ${Math.ceil(remain/3)} 分钟</div><div style="height:8px"></div><a class="btn btn-primary btn-block" href="#/practice">开始练习</a><div style="height:8px"></div><a class="btn btn-plain btn-block" href="#/mistakes">错题快练</a></div>`;

    // 连击与本周完成
    const streak = getStreak(c.id);
    const week = getWeeklyProgress(c.id);
    const streakEl = document.getElementById('streak-count'); if(streakEl) streakEl.textContent = String(streak);
    const weekEl = document.getElementById('week-done'); if(weekEl) weekEl.textContent = `${week.daysDone}/7`;

    // 迷你日历
    renderMiniCalendar(c.id);
    document.getElementById('btn-checkin-today')?.addEventListener('click', ()=>{
      checkInToday(c.id);
      renderMiniCalendar(c.id);
      showToast('已打卡');
    });
  }

  function initGenerator(){
    const form = document.querySelector('#gen-form');
    const preview = document.querySelector('#gen-preview');
    if(!form) return;
    form.addEventListener('input', ()=> updatePreview());
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const kid = getCurrentChild(); if(!kid){ showToast('请先添加孩子'); return; }
      const gp = readGenParams();
      generateDailySet(kid.id, gp);
      showToast(`已生成 ${gp.count} 题`);
      location.hash = '#/practice';
    });
    function updatePreview(){
      const {count} = readGenParams();
      preview.textContent = `将生成 ${count} 道题（默认策略）`;
    }
    updatePreview();
    document.querySelector('#to-print')?.addEventListener('click', ()=>{ location.hash = '#/print-center'; });
  }

  function initPractice(){
    const kid = getCurrentChild(); if(!kid){ appEl.innerHTML = errorView('没有可练习的套题','请先在出题器中生成'); return; }
    let set = (State.data.dailySets||[]).find(s=> s.childId===kid.id && s.date===todayStr());
    if(!set){ set = generateDailySet(kid.id); }
    State.session.currentSetId = set.id; save();

    const stemEl = document.querySelector('#q-stem');
    const inputEl = document.querySelector('#q-input');
    const progEl = document.querySelector('.progress-fill');
    const nextBtn = document.querySelector('#btn-submit');
    const skipBtn = document.querySelector('#btn-skip');

    let idx = 0; const answers = {};

    function renderQ(){
      const qid = set.questionIds[idx];
      const q = State.data.questionBank.find(x=> x.id===qid);
      stemEl.textContent = q? q.stem : '...';
      inputEl.value = '';
      progEl.style.width = `${Math.round((idx)/set.questionIds.length*100)}%`;
      inputEl.focus();
    }

    function submit(){
      const qid = set.questionIds[idx];
      const q = State.data.questionBank.find(x=> x.id===qid);
      const val = inputEl.value.trim();
      const correct = String(q.answer) === val;
      answers[qid] = { val, correct };
      idx++;
      if(idx >= set.questionIds.length){
        // 统计结果
        const correctCount = Object.values(answers).filter(a=>a.correct).length;
        const result = { setId:set.id, childId:kid.id, correctCount, total:set.questionIds.length, durationSec: Math.floor(Math.random()*600)+300, mistakes: Object.entries(answers).filter(([_,a])=>!a.correct).map(([qid])=>qid), timestamp: Date.now() };
        State.data.results.push(result);
        // 记录错题
        result.mistakes.forEach(qid=>{
          const m = State.data.mistakes.find(m=> m.childId===kid.id && m.questionId===qid);
          if(m){ m.count+=1; m.lastSeen = Date.now(); } else { State.data.mistakes.push({ childId:kid.id, questionId:qid, lastSeen:Date.now(), count:1}); }
        })
        save();
        location.hash = '#/result';
        showToast('已提交');
      } else {
        renderQ();
      }
    }

    // 交互
    nextBtn.addEventListener('click', submit);
    skipBtn.addEventListener('click', ()=>{ idx++; if(idx>=set.questionIds.length){ idx=set.questionIds.length-1; } renderQ(); });
    document.addEventListener('keydown', (e)=>{
      if(e.key>='0'&&e.key<='9'){ inputEl.value += e.key; }
      if(e.key==='Backspace'){ inputEl.value = inputEl.value.slice(0,-1); }
      if(e.key==='Enter'){ submit(); }
    });

    // 数字键盘
    document.querySelectorAll('.numpad-btn[data-key]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const k = btn.getAttribute('data-key');
        if(k==='del'){ inputEl.value = inputEl.value.slice(0,-1); }
        else if(k==='ok'){ submit(); }
        else { inputEl.value += k; }
        inputEl.focus();
      })
    })

    renderQ();
  }

  function initResult(){
    const kid = getCurrentChild(); if(!kid) return;
    const last = [...State.data.results].reverse().find(r=> r.childId===kid.id);
    const box = document.querySelector('#result-box');
    if(!last){ box.innerHTML = `<div class="card"><div class="empty">暂无结果</div></div>`; return; }
    const acc = Math.round(last.correctCount/last.total*100);
    box.innerHTML = `<div class="card"><div class="section-title">成绩</div><div class="stats"><div class="stats-card"><div class="stats-value">${acc}%</div><div class="stats-sub">正确率</div></div><div class="stats-card"><div class="stats-value">${Math.floor(last.durationSec/60)}分</div><div class="stats-sub">用时</div></div><div class="stats-card"><div class="stats-value">${last.correctCount}/${last.total}</div><div class="stats-sub">对/总</div></div></div><div class="row" style="margin-top:12px"><a class="btn btn-primary col" href="#/practice">再做一套</a><a class="btn btn-plain col" href="#/mistakes">只练错题</a></div></div>`;
  }

  function initMistakes(){
    const kid = getCurrentChild(); if(!kid) return;
    const list = document.querySelector('#mistakes-list');
    const items = State.data.mistakes.filter(m=> m.childId===kid.id).slice(0,30).map(m=>{
      const q = State.data.questionBank.find(q=> q.id===m.questionId);
      return `<li class="card"><div class="row" style="align-items:center"><div class="col">${q.stem}</div><div class="col" style="flex:0 0 auto"><span class="badge badge-danger">错 ${m.count}</span></div></div></li>`;
    }).join('');
    list.innerHTML = items || `<div class="card"><div class="empty"><img src="assets/icons/empty.svg" alt="空" class="empty-icon"/><div>没有错题，太棒了！</div></div></div>`;
    document.querySelector('#btn-mistakes30')?.addEventListener('click', ()=>{
      const ids = State.data.mistakes.filter(m=> m.childId===kid.id).map(m=> m.questionId);
      if(!ids.length){ showToast('暂无错题'); return; }
      const set = { id: 'set_'+Date.now(), childId: kid.id, date: todayStr(), questionIds: ids.slice(0,30), strategy:'mistakesFirst' };
      State.data.dailySets.push(set); State.session.currentSetId = set.id; save();
      location.hash = '#/practice';
    })
  }

  function initStudySettings(){
    const kid = getCurrentChild();
    const form = document.getElementById('study-form'); if(!kid || !form) return;
    const prefs = kid.prefs || { includeWeak:true, includeWarm:true };
    document.getElementById('pref-count').value = kid.goals?.dailyCount || 30;
    document.getElementById('pref-weak').checked = !!prefs.includeWeak;
    document.getElementById('pref-warm').checked = !!prefs.includeWarm;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const count = Number(document.getElementById('pref-count').value||30);
      kid.goals = Object.assign({}, kid.goals||{}, { dailyCount: count });
      kid.prefs = {
        includeWeak: document.getElementById('pref-weak').checked,
        includeWarm: document.getElementById('pref-warm').checked,
      };
      save();
      showToast('已保存题库设置');
      history.back();
    });
  }

  function initPrintCenter(){
    // 简单交互：切换两栏/三栏，是否显示答案
    const cols = document.querySelector('#print-cols');
    const ans = document.querySelector('#print-ans');
    const grid = document.querySelector('.preview-grid');
    const list = document.querySelector('#print-list');
    const kid = getCurrentChild();
    const set = (State.data.dailySets||[]).find(s=> s.childId===kid?.id && s.date===todayStr());
    const ids = set? set.questionIds : (State.data.questionBank.slice(0,30).map(q=> q.id));
    function render(){
      grid.style.setProperty('--cols', cols.value);
      const items = ids.map(id=>{
        const q = State.data.questionBank.find(x=> x.id===id);
        return `<div class="preview-item">${q.stem}${ans.checked? ` = <span style=\"color:var(--c-text-3)\">${q.answer}</span>`:''}</div>`;
      }).join('');
      list.innerHTML = items;
    }
    cols.addEventListener('change', render);
    ans.addEventListener('change', render);
    render();
  }

  function initReviewOCR(){
    const upload = document.querySelector('#ocr-upload');
    const prog = document.querySelector('#ocr-progress');
    upload.addEventListener('change', async ()=>{
      setState('loading');
      await sleep(800);
      setState('ready');
      prog.textContent = '识别完成（占位），置信度 0.92，已同步到结果与错题本';
      showToast('识别完成（占位）');
    })
  }

  function initAuthRegister(){
    const form = document.getElementById('reg-form');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const identifier = (document.getElementById('reg-identifier').value||'').trim();
      const pwd = (document.getElementById('reg-password').value||'').trim();
      const pwd2 = (document.getElementById('reg-password2').value||'').trim();
      if(!identifier || !pwd){ showToast('请填写账号与密码'); return; }
      if(pwd!==pwd2){ showToast('两次密码不一致'); return; }
      State.data.account = { id: 'acc_'+Date.now(), role: 'student', identifier, password: pwd };
      State.session.role = 'student'; save(); updateRoleIndicator();
      showToast('注册成功');
      location.hash = '#/child-home';
    });
  }

  function initAuthLogin(){
    const form = document.getElementById('login-form');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const identifier = (document.getElementById('login-identifier').value||'').trim();
      const pwd = (document.getElementById('login-password').value||'').trim();
      const acc = State.data.account||{};
      if(acc.identifier && identifier===acc.identifier && pwd===acc.password){
        State.session.role = acc.role==='guest' ? 'student' : acc.role || 'student';
        save(); updateRoleIndicator();
        showToast('登录成功');
        location.hash = State.session.role==='parent' ? '#/parent-home' : '#/child-home';
      } else {
        showToast('账号或密码不正确（原型）');
      }
    });
  }

  function initCalendar(){
    const kid = getCurrentChild();
    const title = document.getElementById('cal-title');
    const grid = document.getElementById('cal-grid');
    const prev = document.getElementById('cal-prev');
    const next = document.getElementById('cal-next');
    let cur = new Date(); cur.setDate(1);

    function renderMonth(d){
      title.textContent = `${d.getFullYear()} 年 ${d.getMonth()+1} 月`;
      const days = buildMonthDays(d.getFullYear(), d.getMonth());
      const checked = getCheckedMap(kid?.id);
      grid.innerHTML = days.map(day=>{
        const ds = dateStr(day.date);
        const classes = ['cal-day'];
        if(day.isOut) classes.push('is-out');
        if(isToday(day.date)) classes.push('is-today');
        if(checked.has(ds)) classes.push('is-checked');
        return `<div class="${classes.join(' ')}" data-date="${ds}" aria-label="${ds}${checked.has(ds)?' 已打卡':''}"><span>${day.n}</span><i class="dot" aria-hidden="true"></i></div>`;
      }).join('');
    }

    prev?.addEventListener('click', ()=>{ cur.setMonth(cur.getMonth()-1); renderMonth(cur); });
    next?.addEventListener('click', ()=>{ cur.setMonth(cur.getMonth()+1); renderMonth(cur); });
    document.getElementById('btn-checkin-page')?.addEventListener('click', ()=>{
      if(!kid) return; checkInToday(kid.id); renderMonth(cur); showToast('已打卡');
    });

    renderMonth(cur);
  }

  function initSettings(){
    // 读取并初始化开关
    const hc = document.getElementById('hc-toggle');
    if(hc){ hc.checked = !!State.data.settings?.highContrast; document.body.classList.toggle('high-contrast', hc.checked); hc.addEventListener('change', ()=>{ State.data.settings.highContrast = hc.checked; document.body.classList.toggle('high-contrast', hc.checked); save(); showToast('已更新外观'); }); }

  const enable = document.getElementById('lock-enable');
    const pinInput = document.getElementById('lock-pin');
    const saveBtn = document.getElementById('lock-save');
    const nowBtn = document.getElementById('lock-now');
    if(enable){ enable.checked = !!State.data.parentLock?.enabled; }
    if(pinInput){ pinInput.value = State.data.parentLock?.pin || ''; }
    saveBtn?.addEventListener('click', ()=>{
      State.data.parentLock.enabled = !!enable?.checked;
      const v = (pinInput?.value||'').trim();
      if(State.data.parentLock.enabled && (!v || v.length < 4)) { showToast('请设置4-6位数字PIN'); return; }
      if(v){ State.data.parentLock.pin = v; }
      save(); showToast('已保存童锁设置');
    });
    nowBtn?.addEventListener('click', ()=>{
      if(!State.data.parentLock?.enabled || !State.data.parentLock?.pin){ showToast('请先启用并设置PIN'); return; }
      State.session.unlockUntil = 0; save(); showToast('已上锁');
    });

    // 角色切换
    const roleParent = document.getElementById('role-parent');
    const roleStudent = document.getElementById('role-student');
    const roleApply = document.getElementById('role-apply');
    if(roleParent && roleStudent){
      const current = State.session.role || 'student';
      if(current==='parent') roleParent.checked = true; else roleStudent.checked = true;
      roleApply?.addEventListener('click', ()=>{
        const target = roleParent.checked ? 'parent' : 'student';
        if(target === State.session.role) { showToast('角色未变化'); return; }
        if(target==='parent' && State.data.parentLock?.enabled){
          if(!pin || pin !== State.data.parentLock.pin){ showToast('PIN 不正确'); return; }
          State.session.unlockUntil = Date.now()+5*60*1000; // 同步解锁
        }
        State.session.role = target; save();
        updateRoleIndicator();
        renderTabbar(getRoute());
        location.hash = target==='parent' ? '#/parent-home' : '#/child-home';
        showToast('已切换角色');
      });
    }

    document.querySelector('#btn-clear')?.addEventListener('click', ()=>{
      localStorage.removeItem('se-prototype');
      showToast('已清除本地数据');
      setTimeout(()=> location.reload(), 500);
    })
  }

  function initNotifications(){
    // 占位：切换开关时提示
    document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
      ch.addEventListener('change', ()=> showToast('已更新设置'))
    })
  }

  function initRewards(){
    // 占位：展示徽章
  }

  function initMy(){
    const role = State.session.role || 'student';
    const form = document.getElementById('my-form');
    const apiBase = document.getElementById('api-base');
    const apiToken = document.getElementById('api-token');
    const btnPull = document.getElementById('btn-sync-pull');
    const btnPush = document.getElementById('btn-sync-push');
    const btnLogout = document.getElementById('btn-logout');
    const btnChangePwd = document.getElementById('btn-change-pwd');
    const accIdEl = document.getElementById('acc-identifier');
    const accRoleEl = document.getElementById('acc-role');
    const acc = State.data.account || { identifier:'', role:'guest' };
    if(accIdEl) accIdEl.textContent = acc.identifier || '未登录';
    if(accRoleEl) accRoleEl.textContent = acc.role || '-';
    // 显示服务配置
    if(apiBase) apiBase.value = State.data.api?.baseUrl || '';
    if(apiToken) apiToken.value = State.data.api?.token || '';

    if(role==='student'){
      const kid = getCurrentChild();
      if(!kid){
        const box = document.getElementById('my-box');
        if(box) box.innerHTML = `<div class="card"><div class="empty">暂无孩子信息</div><a class="btn btn-primary" href="#/onboarding">去创建</a></div>`;
        return;
      }
      document.getElementById('field-name').value = kid.name || '';
      document.getElementById('field-grade').value = kid.grade || '';
      document.getElementById('field-goal').value = kid.goals?.dailyCount || 30;
    } else {
      const p = State.data.parentProfile || { name:'', phone:'', email:'' };
      document.getElementById('field-p-name').value = p.name || '';
      document.getElementById('field-p-phone').value = p.phone || '';
      document.getElementById('field-p-email').value = p.email || '';
    }

    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      // 保存服务配置
      if(apiBase) State.data.api.baseUrl = (apiBase.value||'').trim();
      if(apiToken) State.data.api.token = (apiToken.value||'').trim();
      if(role==='student'){
        const kid = getCurrentChild(); if(!kid) return;
        kid.name = document.getElementById('field-name').value.trim();
        kid.grade = document.getElementById('field-grade').value.trim();
        const g = Number(document.getElementById('field-goal').value||30);
        kid.goals = Object.assign({}, kid.goals||{}, { dailyCount: g });
      } else {
        State.data.parentProfile = {
          name: document.getElementById('field-p-name').value.trim(),
          phone: document.getElementById('field-p-phone').value.trim(),
          email: document.getElementById('field-p-email').value.trim(),
        };
      }
      save();
      showToast('已保存');
    });

    btnPull?.addEventListener('click', async ()=>{
      try{
        const payload = await apiRequest('GET', `/profile?role=${role}&childId=${getCurrentChild()?.id||''}`);
        if(role==='student' && payload?.child){
          const kid = getCurrentChild(); if(kid){ Object.assign(kid, payload.child); }
        } else if(role==='parent' && payload?.parent){
          State.data.parentProfile = Object.assign({}, State.data.parentProfile||{}, payload.parent);
        }
        save();
        initMy();
        showToast('已从服务端拉取（或模拟）');
      }catch(err){ showToast('拉取失败'); console.error(err); }
    });

    btnPush?.addEventListener('click', async ()=>{
      try{
        const body = role==='student' ? { child: getCurrentChild() } : { parent: State.data.parentProfile };
        await apiRequest('POST', '/profile', body);
        showToast('已提交到服务端（或模拟）');
      }catch(err){ showToast('提交失败'); console.error(err); }
    });

    btnChangePwd?.addEventListener('click', ()=>{
      const p1 = (document.getElementById('acc-newpwd')?.value||'').trim();
      const p2 = (document.getElementById('acc-newpwd2')?.value||'').trim();
      if(!p1){ showToast('请输入新密码'); return; }
      if(p1!==p2){ showToast('两次密码不一致'); return; }
      State.data.account.password = p1; save(); showToast('已更新密码（原型）');
    });

    btnLogout?.addEventListener('click', ()=>{
      State.data.account = { id:'', role:'guest', identifier:'', password:'' };
      State.session.role = null; save();
      showToast('已退出登录');
      setTimeout(()=> location.hash = '#/onboarding', 300);
    });
  }

  async function apiRequest(method, path, body){
    const base = (State.data.api?.baseUrl||'').trim();
    const token = State.data.api?.token||'';
    // 若未配置后端，则模拟网络延迟并返回示例数据
    if(!base){
      await sleep(500);
      if(method==='GET'){
        return { ok:true, child: getCurrentChild(), parent: State.data.parentProfile };
      }
      return { ok:true };
    }
    const url = base.replace(/\/$/, '') + path;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) },
      body: method==='GET'? undefined : JSON.stringify(body||{})
    });
    if(!res.ok) throw new Error(`API ${res.status}`);
    const ct = res.headers.get('content-type')||'';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  function initReports(){
    // 占位：简单趋势文本
    const box = document.querySelector('#report-box');
    const kid = getCurrentChild();
    const data = State.data.results.filter(r=> r.childId===kid?.id).slice(-7);
    if(!data.length){ box.innerHTML = `<div class="card"><div class=empty>暂无数据</div></div>`; return; }
    const trend = data.map(r=> Math.round(r.correctCount/r.total*100));
    box.innerHTML = `<div class="card"><div class="section-title">最近7次正确率</div><div>${trend.join('% · ')}%</div></div>`;
  }

  function initProfile(){
    const kid = getCurrentChild(); if(!kid) return;
    document.querySelector('#profile-info').innerHTML = `<div class="card"><div class="section-title">${kid.name}</div><div class="text-subtle">年级：${kid.grade||'未设置'} · 教材：${kid.textbook||'人教版'}</div></div>`;
  }

  // 业务逻辑 helpers
  function readGenParams(){
    const count = Number(document.querySelector('[name="count"]').value||30);
    const strategy = document.querySelector('[name="strategy"]').value||'default';
    const screen = document.querySelector('[name="screen"]')?.checked;
    return { count, strategy, screen };
  }

  function getCurrentChild(){
    const id = State.session.currentChildId; if(!id) return null;
    return State.data.children.find(c=> c.id===id) || null;
  }

  function todayStr(){
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function dateStr(d){ const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; }
  function isToday(d){ const x=new Date(d); const t=new Date(); return x.getFullYear()===t.getFullYear() && x.getMonth()===t.getMonth() && x.getDate()===t.getDate(); }

  function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function daysAgo(n){ const d = new Date(); d.setDate(d.getDate()-n); return d; }

  function getWeekRange(){
    // 以周一为一周开始
    const d = new Date();
    const day = d.getDay() || 7; // 周日=7
    const start = new Date(d); start.setDate(d.getDate() - (day-1)); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate()+7); end.setHours(0,0,0,0);
    return {start, end};
  }

  function getWeeklyProgress(childId){
    const {start, end} = getWeekRange();
    const res = (State.data.results||[]).filter(r=> r.childId===childId && r.timestamp>=start.getTime() && r.timestamp<end.getTime());
    const days = new Set(res.map(r=> startOfDay(r.timestamp).getTime()));
    const daysDone = Math.min(days.size, 7);
    const percent = Math.round(daysDone/7*100);
    return { daysDone, percent };
  }

  function getStreak(childId){
    // 从今天往回连续有完成记录的天数
    let streak = 0;
    for(let i=0;i<365;i++){
      const d = startOfDay(daysAgo(i)).getTime();
      const has = (State.data.results||[]).some(r=> r.childId===childId && startOfDay(r.timestamp).getTime()===d);
      if(has) streak++; else break;
    }
    return streak;
  }

  function getCheckedMap(childId){
    const set = new Set();
    // 完成练习的日期计为打卡
    (State.data.results||[]).filter(r=> r.childId===childId).forEach(r=> set.add(dateStr(r.timestamp)));
    // 手动打卡
    (State.data.checkins||[]).filter(c=> c.childId===childId).forEach(c=> set.add(c.date));
    return set;
  }

  function checkInToday(childId){
    const ds = todayStr();
    const has = (State.data.checkins||[]).some(c=> c.childId===childId && c.date===ds);
    if(!has){ State.data.checkins.push({ childId, date: ds, ts: Date.now() }); save(); }
  }

  function buildMonthDays(year, month){
    // month: 0-11; 周一开始
    const first = new Date(year, month, 1);
    const w = (first.getDay()||7) - 1; // 0..6 offset for Monday-first
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const arr = [];
    // leading
    for(let i=w-1;i>=0;i--){ arr.push({ n: daysInPrev - i, date: new Date(year, month-1, daysInPrev - i), isOut:true }); }
    // current
    for(let d=1; d<=daysInMonth; d++){ arr.push({ n:d, date:new Date(year, month, d), isOut:false }); }
    // trailing to fill 6 rows
    const remain = (7*6) - arr.length; for(let d=1; d<=remain; d++){ arr.push({ n:d, date:new Date(year, month+1, d), isOut:true }); }
    return arr;
  }

  function renderMiniCalendar(childId){
    const host = document.getElementById('mini-cal'); if(!host) return;
    const now = new Date(); now.setDate(1);
    const days = buildMonthDays(now.getFullYear(), now.getMonth());
    const checked = getCheckedMap(childId);
    host.innerHTML = `
      <div class="cal-header" aria-live="polite"><div class="cal-title">${now.getFullYear()} 年 ${now.getMonth()+1} 月</div></div>
      <div class="cal-week"><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div></div>
      <div class="cal-grid">${days.map(day=>{
        const ds = dateStr(day.date);
        const classes = ['cal-day']; if(day.isOut) classes.push('is-out'); if(isToday(day.date)) classes.push('is-today'); if(checked.has(ds)) classes.push('is-checked');
        return `<div class="${classes.join(' ')}" data-date="${ds}" aria-hidden="true"><span>${day.n}</span><i class="dot"></i></div>`;
      }).join('')}</div>
    `;
  }

  function getRecentActivity(childId, n){
    return (State.data.results||[]).filter(r=> r.childId===childId).sort((a,b)=> b.timestamp-a.timestamp).slice(0,n||5);
  }

  function generateDailySet(childId, params){
    const kid = State.data.children.find(c=> c.id===childId);
    const defaultCount = kid?.goals?.dailyCount || 30;
    const p = Object.assign({ count: defaultCount, strategy:'default' }, params||{});
    // 策略：默认 30% 弱项（weaknessTags），60% 常规，10% 预热
    const bank = State.data.questionBank;
    const weakness = bank.filter(q=> (q.tags||[]).includes('weak'));
    const normal = bank.filter(q=> !(q.tags||[]).includes('weak'));
    const warm = bank.filter(q=> (q.tags||[]).includes('warm'));
    // 根据孩子偏好调整比例
    const prefs = kid?.prefs || { includeWeak:true, includeWarm:true };
    let rWeak = prefs.includeWeak ? 0.3 : 0;
    let rWarm = prefs.includeWarm ? 0.1 : 0;
    let rNorm = 1 - rWeak - rWarm; if(rNorm < 0) rNorm = 0;
    const pick = (arr,n)=>{ const a=[...arr]; const out=[]; while(n-->0 && a.length){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; };
    const cntWeak = Math.round(p.count*rWeak);
    const cntNorm = Math.round(p.count*rNorm);
    const cntWarm = Math.max(0, p.count - cntWeak - cntNorm);
    const ids = [
      ...pick(weakness, cntWeak),
      ...pick(normal, cntNorm),
      ...pick(warm, cntWarm)
    ].slice(0,p.count).map(q=> q.id);
    const set = { id: 'set_'+Date.now(), childId, date: todayStr(), questionIds: ids, strategy: p.strategy };
    // 替换当天已有
    State.data.dailySets = (State.data.dailySets||[]).filter(s=> !(s.childId===childId && s.date===todayStr()));
    State.data.dailySets.push(set); save();
    return set;
  }

  function getResultBySet(setId){ return State.data.results.find(r=> r.setId===setId); }

  // 启动
  (async function start(){
    load();
    await ensureData();
    // 应用高对比度外观
    if(State.data.settings?.highContrast){ document.body.classList.add('high-contrast'); }
    if(!location.hash){ location.hash = '#/auth-login'; }
    updateRoleIndicator();
    render(getRoute());
  })();

  function updateRoleIndicator(){
    const el = document.getElementById('role-indicator');
    if(!el) return;
    const role = State.session.role || 'student';
    el.textContent = role==='parent' ? '家长模式' : '学生模式';
    el.classList.toggle('role-parent', role==='parent');
    el.classList.toggle('role-student', role!=='parent');
  }
})();
