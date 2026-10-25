/* app.js — интерфейс веб-утилиты «Промышленная экология · ПДВ» */
(function () {
  'use strict';
  const D = window.LABDATA, L = window.LABS, CH = window.CHARTS;
  const fnum = L.fauto, fk = L.fk, fin = L.fin;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  /* варианты текущей задачи: 1.1 — табл. 1.2, 1.2 — табл. 1.3 */
  const TK = () => { const t = S.P ? +S.P.task : 1; return t >= 1 && t <= 8 ? t : 1; };
  const SP = () => L.TX(TK());                                   // спецификация задач 1.3–1.8 (tasks.js) или null
  const TBL = t => { t = t || TK(); return L.TX(t) ? L.TX(t).table : '1.' + (t + 1); };
  const tpre = () => TK() > 1 ? 't' + TK() : '';
  const fin2 = x => x === null || x === undefined || x === '' ? '–' : fin(x);
  const VL = () => L.vlist(TK());
  const VK = () => L.vkeys(TK());
  const NVf = () => VL().length;
  const VMIN = 1;
  const VMAXf = () => VL()[VL().length - 1].no;
  const SETTINGS = ['mode', 'sumEff', 'hmin', 'prof', 'eta', 'Fg', 'Fd'];
  /* настройки, которые сохраняются при смене варианта (всё, что не берётся из таблицы вариантов) */
  const keepSettings = () => { const keep = {}, vk = VK(); SETTINGS.concat(L.nkeys(TK())).forEach(k => { if (!vk.includes(k)) keep[k] = S.P[k]; }); return keep; };
  const PFX = 'eco-';

  const LABS_META = [
    { id: 'data', no: '◦', short: 'Данные', t: 'Исходные данные', s: 'Параметры, методика, отчёт' },
    { id: 's1', no: '1', short: 'Источник', t: 'Параметры источника', s: 'ΔT, f, Vᵢ, m, Vₘ, n' },
    { id: 's2', no: '2', short: 'Cmax', t: 'Приземные концентрации', s: 'Cmax, Xmax, сравнение с ПДК' },
    { id: 's3', no: '3', short: 'ПДВ', t: 'ПДВ и очистка', s: 'ПДВ, степень очистки, H' },
    { id: 'all', no: 'Σ', short: 'Сводка', t: 'Все варианты', s: 'Ответы для проверки' }
  ];
  const railMeta = () => { const sp = SP(); return sp ? LABS_META.map(m => sp.rail[m.id] ? Object.assign({}, m, { short: sp.rail[m.id][0], t: sp.rail[m.id][1], s: sp.rail[m.id][2] }) : m) : LABS_META; };
  const title = tab => SP() && SP().titles[tab] ? SP().titles[tab] : TITLES[tab];
  const TITLES = { s1: 'Параметры источника выброса', s2: 'Максимальные приземные концентрации', s3: 'Предельно допустимые выбросы и мероприятия', all: 'Сводка по всем вариантам' };
  const STAGES = ['s1', 's2', 's3'];
  const TABS = STAGES.concat('all');
  const stNo = tab => STAGES.indexOf(tab) + 1;

  /* ---------------- состояние ---------------- */
  const S = { P: null, R: null, tab: 'data', err: null, T: null };
  const T_DEF = {
    org: 'МИНОБРНАУКИ РОССИИ\nФедеральное государственное бюджетное образовательное учреждение\nвысшего образования\n«Казанский национальный исследовательский технологический университет»\n(ФГБОУ ВО «КНИТУ»)',
    dept: '', discipline: 'Экология', kind: 'практической работе', title: '',
    group: '741-15', student: '', teacher: 'Савельев С. Н.', city: 'Казань', year: String(new Date().getFullYear()),
    logo: true, explain: true, content: 'task', readable: true, src: '', compact: false, secGoal: true, secTask: true, secData: true, secSrc: true, eqNum: true
  };
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(PFX + k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  function loadT() { const t = ls.get('title') || {}; if (t.discipline === 'Промышленная экология') t.discipline = 'Экология'; if (!t.teacher) delete t.teacher; S.T = Object.assign({}, T_DEF, t); }
  function saveT() { ls.set('title', S.T); autoSave(); }
  function save() { ls.set('state', { P: S.P, tab: S.tab }); autoSave(); }
  let autoTimer = null;
  function autoSave(now) {
    if (S.skipAuto) { S.skipAuto = false; return; }
    clearTimeout(autoTimer);
    const run = () => {
      if (!S.P || !S.T) return;
      if (!ls.set('autosave', { name: 'Автосохранение', at: Date.now(), tab: S.tab, P: S.P, T: S.T })) return;
      const row = $('#slot-auto'); if (row) { row.outerHTML = autoRowHtml(); bindAuto(); }
    };
    if (now) run(); else autoTimer = setTimeout(run, 1200);
  }
  const clampV = v => Math.min(VMAXf(), Math.max(VMIN, v | 0));
  function load() {
    const st = ls.get('state');
    const h = (location.hash || '').match(/^#(?:t([1-8]))?v(\d+)(?:-(s\d|data|all))?(?:&s=([\w-]+))?$/);
    const ht = h && h[1] ? +h[1] : 1;
    if (h) h.splice(1, 1);
    if (h) S.P = { task: ht };
    if (h && h[3]) {
      const v = clampV(+h[1]);
      let diff = {}; try { diff = JSON.parse(decodeURIComponent(escape(atob(h[3].replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { diff = {}; }
      S.P = Object.assign(L.fromVariant(v, ht), diff); S.tab = h[2] || 'data'; S.shared = true;
    } else if (h) {
      const v = clampV(+h[1]);
      S.P = (st && st.P && st.P.variant === v && (+st.P.task || 1) === ht) ? Object.assign(L.defaults(), st.P) : L.fromVariant(v, ht);
      S.tab = h[2] || (st && st.tab) || 'data';
    } else if (st && st.P) { S.P = Object.assign(L.defaults(), st.P); S.tab = st.tab || 'data'; }
    else { S.P = L.fromVariant(1); S.tab = 'data'; }
    if (S.tab !== 'data' && !TABS.includes(S.tab)) S.tab = 'data';
  }
  function setHash() { try { history.replaceState(null, '', '#' + tpre() + 'v' + S.P.variant + '-' + S.tab); } catch (e) { /* ignore */ } }

  function recompute() {
    try { S.R = L.compute(S.P); S.err = null; }
    catch (e) { console.error(e); S.err = e; }
    S.sum = null;
    save(); setHash();
    renderTop();
    renderTab();
  }

  /* ---------------- KaTeX ---------------- */
  function texify(s) { return String(s).replace(/_\{(max|min)\}/g, '_{\\mathrm{$1}}').replace(/([А-Яа-яЁё][А-Яа-яЁё.]*)/g, '\\text{$1}'); }
  function tex(s, display) {
    try { return katex.renderToString(texify(s), { displayMode: !!display, throwOnError: false, strict: 'ignore', output: 'html' }); }
    catch (e) { return '<code>' + esc(s) + '</code>'; }
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  const pw = v => String(v === undefined || v === null ? '' : v).replace(/·10\^(-?\d+)/g, (m, e) => '·10<sup>' + e.replace('-', '−') + '</sup>');

  /* ---------------- шапка ---------------- */
  function renderTop() {
    L.use(S.R);
    const sel = $('#var-sel');
    if (sel.options.length !== NVf()) sel.innerHTML = VL().map(v => `<option value="${v.no}">${v.no}</option>`).join('');
    const ts = $('#task-sel'); if (ts) ts.value = String(TK());
    sel.value = S.P.variant;
    if (S.railTask !== TK()) renderRail();
    const R = S.R, P = S.P, foot = $('#rail-foot');
    if (foot && SP()) foot.innerHTML = R ? SP().foot(R, P) : '';
    else if (foot) foot.innerHTML = R ? `<b>Вариант ${P.variant}</b><br>H = ${fin(P.H)} м, D = ${fin(P.D)} м<br>W = ${fin(P.W)} м/с, ΔT = ${fk(R.o.dT, 1)} °C<br>${R.o.hot ? 'нагретый' : 'холодный'} выброс · f = ${fk(R.o.f, 2)}<br>${R.excList.length ? 'ПДК превышена: ' + R.excList.map(x => x.s.short).join(', ') : 'ПДК не превышена'}` : '';
  }
  function stamp(no) {
    const P = S.P;
    const head = `<table class="stamp" aria-label="Штамп"><tr><td class="k">Работа</td><td class="v">${no === 'all' ? 'Сводка' : no ? 'Этап ' + no : 'Данные'}</td><td class="k">Лист</td><td class="v">${no === 'all' ? '—' : no || 0} / 3</td></tr>`;
    if (SP()) return head + `<tr><td class="k">Вариант</td><td class="v">${P.variant}${isEdited() ? '*' : ''}</td><td class="k">Задача</td><td class="v">1.${TK()}</td></tr>` + SP().stamp(P) + '</table>';
    return head + `
      <tr><td class="k">Вариант</td><td class="v">${P.variant}${isEdited() ? '*' : ''}</td><td class="k">A</td><td class="v">${fin(P.A)}</td></tr>
      <tr><td class="k">Труба</td><td class="v" colspan="3">H = ${fin(P.H)} м, D = ${fin(P.D)} м</td></tr>
      <tr><td class="k">${TK() === 2 ? 'Смесь' : 'Газы'}</td><td class="v">${fin(P.W)} м/с</td><td class="k">T, °C</td><td class="v">${fin(P.Tg)}/${fin(P.Tv)}</td></tr></table>`;
  }
  function isEdited() {
    const v = L.fromVariant(S.P.variant, TK());
    return VK().concat(L.nkeys(TK())).some(k => (v[k] === null) !== (S.P[k] === null) || +v[k] !== +S.P[k]);
  }

  /* ---------------- вкладки ---------------- */
  function renderTab() {
    const main = $('#main');
    L.use(S.R);
    if (S.err && S.tab !== 'data') { main.innerHTML = `<div class="sheet"><div class="sheet-body"><div class="note bad" style="margin-top:20px">Ошибка расчёта: ${esc(S.err.message)}. Проверьте исходные данные на вкладке «Исходные данные».</div></div></div>`; }
    else if (S.tab === 'data') renderData(main);
    else if (S.tab === 'all') renderAll(main);
    else renderLab(main, S.tab);
    $$('nav.rail a').forEach(a => a.setAttribute('aria-current', a.dataset.tab === S.tab ? 'page' : 'false'));
    buildToc();
  }

  /* ---------- навигация по разделам текущей вкладки ---------- */
  function tocItems() {
    const out = [];
    $$('#main .sheet-body h2').forEach((el, k) => {
      if (!el.id) el.id = 'sec-' + S.tab + '-' + k;
      const t = el.textContent.trim().replace(/\s+/g, ' ');
      const m = t.match(/^(\d+(?:\.\d+)?)\.?\s+(.*)$/);
      out.push({ id: el.id, no: m ? m[1] : '', t: m ? m[2] : t, el });
    });
    return out;
  }
  let tocList = [];
  function buildToc() {
    $$('.rail-toc').forEach(x => x.remove());
    tocList = tocItems();
    const fab = $('#toc-fab'); if (fab) fab.remove();
    const pop = $('#toc-pop'); if (pop) pop.remove();
    if (!tocList.length) return;
    const links = tocList.map(it => `<a href="#${it.id}" data-toc="${it.id}"><span class="tn">${it.no || '·'}</span><span>${esc(it.t)}</span></a>`).join('');
    const cur = $(`nav.rail a[data-tab="${S.tab}"]`);
    if (cur) cur.insertAdjacentHTML('afterend', `<div class="rail-toc" aria-label="Разделы">${links}</div>`);
    document.body.insertAdjacentHTML('beforeend', `<button class="toc-fab" id="toc-fab" aria-expanded="false" aria-controls="toc-pop"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>Разделы</button><div class="toc-pop" id="toc-pop" hidden><div class="toc-pop-h">Разделы<button class="toc-top" data-top>↑ В начало</button></div>${links}</div>`);
    const f = $('#toc-fab'), p = $('#toc-pop');
    f.onclick = () => { const open = p.hidden; p.hidden = !open; f.setAttribute('aria-expanded', String(open)); };
    $('[data-top]', p).onclick = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); p.hidden = true; f.setAttribute('aria-expanded', 'false'); };
    $$('[data-toc]').forEach(a => a.onclick = e => {
      e.preventDefault();
      const el = document.getElementById(a.dataset.toc); if (!el) return;
      const off = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) || 64) + (window.innerWidth <= 960 ? 60 : 16);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'smooth' });
      tocLock = a.dataset.toc; markToc(tocLock);
      p.hidden = true; f.setAttribute('aria-expanded', 'false');
    });
    spy();
  }
  let tocLock = null;
  ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(ev => window.addEventListener(ev, e => { if (tocLock && !(e.target.closest && e.target.closest('[data-toc]'))) tocLock = null; }, { passive: true }));
  function markToc(act) { $$('[data-toc]').forEach(a => a.classList.toggle('on', a.dataset.toc === act)); }
  function spy() {
    if (!tocList.length) return;
    if (tocLock) { markToc(tocLock); return; }
    const lim = window.innerWidth <= 960 ? 150 : 110;
    let act = tocList[0].id;
    for (const it of tocList) { if (it.el.getBoundingClientRect().top - lim <= 0) act = it.id; else break; }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      for (const it of tocList) { const r = it.el.getBoundingClientRect(); if (r.top < window.innerHeight * 0.6) act = it.id; }
    }
    markToc(act);
    const on = $('.rail-toc a.on'), box = $('nav.rail');
    if (on && box && box.scrollHeight > box.clientHeight) { const r = on.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.top < b.top || r.bottom > b.bottom) on.scrollIntoView({ block: 'nearest' }); }
  }
  let spyRaf = 0;
  window.addEventListener('scroll', () => { if (!spyRaf) spyRaf = requestAnimationFrame(() => { spyRaf = 0; spy(); }); }, { passive: true });
  document.addEventListener('click', e => { const p = $('#toc-pop'); if (p && !p.hidden && !e.target.closest('#toc-pop, #toc-fab')) { p.hidden = true; const f = $('#toc-fab'); if (f) f.setAttribute('aria-expanded', 'false'); } });

  /* ---------- вкладка «Исходные данные» ---------- */
  const FIELDS = [
    ['Mco', 'M<sub>CO</sub>', 'Выброс оксида углерода', 'г/с'], ['Mno2', 'M<sub>NO₂</sub>', 'Выброс диоксида азота', 'г/с'],
    ['Mso2', 'M<sub>SO₂</sub>', 'Выброс диоксида серы', 'г/с'], ['Mdust', 'M<sub>пыли</sub>', 'Выброс пыли', 'г/с'],
    ['H', 'H', 'Высота трубы', 'м'], ['D', 'D', 'Диаметр устья', 'м'], ['W', 'W', 'Скорость выхода газов', 'м/с'],
    ['Tg', 'T<sub>г</sub>', 'Температура газов', '°C'], ['Tv', 'T<sub>в</sub>', 'Температура воздуха', '°C'], ['A', 'A', 'Коэффициент стратификации', '']
  ];
  const FIELDS2 = [
    ['Mdust', 'M<sub>пыли</sub>', 'Выброс пыли', 'г/с'], ['cf_dust', 'C<sub>ф</sub><sup>пыли</sup>', 'Фоновая концентрация пыли', 'мг/м³'],
    ['H', 'H', 'Высота трубы', 'м'], ['D', 'D', 'Диаметр устья', 'м'], ['W', 'W', 'Скорость выхода смеси', 'м/с'],
    ['Tg', 'T<sub>п</sub>', 'Температура пылевоздушной смеси', '°C'], ['Tv', 'T<sub>в</sub>', 'Температура воздуха', '°C'], ['A', 'A', 'Коэффициент стратификации', '']
  ];
  const ADV = [
    ['eta', 'η', 'Коэффициент рельефа', ''], ['Fg', 'F<sub>газ</sub>', 'Оседание газов', ''], ['Fd', 'F<sub>пыль</sub>', 'Оседание пыли', ''],
    ['cf_co', 'C<sub>ф</sub><sup>CO</sup>', 'Фон CO', 'мг/м³'], ['pdk_co', 'ПДК<sup>CO</sup>', 'ПДК CO', 'мг/м³'],
    ['cf_no2', 'C<sub>ф</sub><sup>NO₂</sup>', 'Фон NO₂', 'мг/м³'], ['pdk_no2', 'ПДК<sup>NO₂</sup>', 'ПДК NO₂', 'мг/м³'],
    ['cf_so2', 'C<sub>ф</sub><sup>SO₂</sup>', 'Фон SO₂', 'мг/м³'], ['pdk_so2', 'ПДК<sup>SO₂</sup>', 'ПДК SO₂', 'мг/м³'],
    ['cf_dust', 'C<sub>ф</sub><sup>пыли</sup>', 'Фон пыли', 'мг/м³'], ['pdk_dust', 'ПДК<sup>пыли</sup>', 'ПДК пыли', 'мг/м³']
  ];
  function fld(key, sym, label, unit, val, changed) {
    return `<div class="fld${changed ? ' changed' : ''}"><label for="f-${key}"><span>${label}</span><span class="sym">${sym}</span></label>
      <div class="inp${unit ? ' has-u' : ''}"><input id="f-${key}" data-key="${key}" inputmode="decimal" value="${esc(val === null || val === undefined ? '' : typeof val === 'number' ? String(val).replace('.', ',') : val)}" autocomplete="off">${unit ? `<span class="unit">${unit}</span>` : ''}</div></div>`;
  }
  function optRow(title, desc, ctl) {
    const key = (ctl.match(/data-[tp]?key="(\w+)"/) || [])[1];
    const ex = key && PV[key] ? `<div class="opt-ex" data-pv="${key}">${exHtml(key)}</div>` : '';
    return `<div class="opt${ctl.startsWith('<div class="seg"') ? ' has-seg' : ''}"><div class="opt-t"><b>${title}</b>${desc ? `<span>${desc}</span>` : ''}</div><div class="opt-c">${ctl}</div>${ex}</div>`;
  }
  function exHtml(key) {
    const d = PV[key]();
    const box = (lbl, body, on) => `<div class="ex${on ? ' on' : ''}"><div class="ex-h"><span class="ex-l">${lbl}</span>${on ? '<span class="ex-now">сейчас</span>' : ''}</div><div class="ex-b">${body}</div></div>`;
    if (d.table) return `<div class="ex on ex-wide"><div class="ex-b">${d.table}</div></div>`;
    return box(d.la, d.a, !d.b_on) + box(d.lb, d.b, d.b_on) + (d.note ? `<p class="ex-note">${d.note}</p>` : '');
  }
  function altR(patch) { try { return L.compute(Object.assign({}, S.P, patch)); } catch (e) { return null; } }
  /* превью разделов отчёта: какие заголовки идут в начале отчёта */
  function outlinePv(key) {
    const items = [['secGoal', 'Цель работы'], ['secTask', 'Задание'], ['secData', 'Исходные данные'], ['', '1 Расчёт …']];
    const page = on => `<div class="ex-paper">${items.filter(([k]) => k !== key || on).map(([k, t]) => `<p class="toc${k === key ? ' h' : ''}">${t}</p>`).join('')}</div>`;
    return { la: 'Без раздела', a: page(false), lb: 'С разделом', b: page(true), b_on: S.T[key] !== false };
  }
  const PV = {
    eqNum() {
      const o = S.R && S.R.o && S.R.o.m ? S.R.o : { f: 1.2 };
      const page = on => `<div class="ex-paper"><p>Параметр f для нагретого выброса:</p><div class="ex-math">f = 10³W²D/(H²ΔT) = ${fk(o.f, 2)}${on ? '<span class="ex-no">(2)</span>' : ''}</div></div>`;
      return { la: 'Без номеров', a: page(false), lb: 'С номерами', b: page(true), b_on: !!S.T.eqNum };
    },
    compact() {
      const t = 'Максимальная приземная концентрация вредного вещества достигается на расстоянии X<sub>max</sub> от источника и сравнивается с ПДК с учётом фоновой концентрации.';
      return { la: '14 пт, интервал 1,5', a: `<div class="ex-paper lh15"><p>${t}</p></div>`, lb: '12 пт, интервал 1,0', b: `<div class="ex-paper fs12 lh10"><p>${t}</p></div>`, b_on: !!S.T.compact };
    },
    secGoal() { return outlinePv('secGoal'); },
    secTask() { return outlinePv('secTask'); },
    secData() { return outlinePv('secData'); },
    secSrc() {
      const page = on => `<div class="ex-paper"><p>Коэффициент F принимаем по табл. 1.2${on ? ' [1]' : ''}.</p>${on ? '<p class="h">Список использованных источников</p><p class="cap">1. Фридланд С. В. Промышленная экология. Основы инженерных расчётов…</p>' : '<p class="cap">…конец отчёта.</p>'}</div>`;
      return { la: 'Без списка и ссылок', a: page(false), lb: 'Со списком', b: page(true), b_on: S.T.secSrc !== false };
    },
    sumEff() {
      const on = !!S.P.sumEff, R = S.R;
      const q = R && R.sum && R.sum.q ? R.sum : null;
      const b = q ? `<div class="ex-f">q = C<sup>SO₂</sup>/ПДК + C<sup>NO₂</sup>/ПДК = ${fk(q.q, 3)} ${q.ok ? '≤' : '>'} 1</div><p class="ex-p">${q.ok ? 'Совместное действие SO<sub>2</sub> и NO<sub>2</sub> допустимо.' : 'Условие (1.1) не выполняется — нужно снижать выбросы SO<sub>2</sub> и NO<sub>2</sub>.'}</p>` : '<p class="ex-p">Проверка по формуле (1.1).</p>';
      return { la: 'Без проверки (как в примере пособия)', a: '<p class="ex-p">Проверка эффекта суммации в расчёт и отчёт не входит.</p>', lb: 'С проверкой (1.1)', b, b_on: on };
    },
    hmin() {
      const on = !!S.P.hmin, R = on ? S.R : altR({ hmin: true }); L.use(S.R);
      const rows = R ? R.excList.map(x => `<div class="ex-f">${x.s.name}: H<sub>min</sub> = ${x.Hmin === Infinity ? '> 5000' : isFinite(x.Hmin) ? fin(Math.ceil(x.Hmin)) : '—'} м</div>`).join('') : '';
      const b = rows ? rows + `<p class="ex-p">Вместо H = ${fin(S.P.H)} м.</p>` : '<p class="ex-p">В этом варианте ПДК нигде не превышена — раздел не появится.</p>';
      return { la: 'Без раздела (как в пособии)', a: '<p class="ex-p">Нормативы обеспечиваются только очисткой газов.</p>', lb: 'С наименьшей высотой трубы', b, b_on: on };
    },
    prof() {
      const fig = this.figs().b;
      return { la: 'Без графика (как в пособии)', a: '<p class="ex-p">Только C<sub>max</sub> и X<sub>max</sub> — без распределения по оси факела.</p>', lb: 'С графиком C(x)', b: fig, b_on: !!S.P.prof };
    },
    uFix() {
      const on = S.P.uFix !== false, a = on ? S.R : altR({ uFix: true }), b = on ? altR({ uFix: false }) : S.R; L.use(S.R);
      const body = r => r ? `<div class="ex-f">U = ${fin(r.U)} м/с</div><div class="ex-f">f<sub>газ</sub> = ${fk(r.fGas, 2)}, f<sub>пыли</sub> = ${fk(r.fDust, 2)}</div><div class="ex-f">У<sub>атм</sub> = ${window.ECOTASKS_UTIL ? ECOTASKS_UTIL.money(r.Uatm) : fin(Math.round(r.Uatm))} руб./год</div>` : '';
      const note = a && b && a.U === b.U ? 'В этом варианте скорость ветра в табл. 1.19 напечатана правильно (или введена вручную) — расчёт не меняется.' : '';
      return { la: '1,0…2,2 м/с (рекомендуется)', a: body(a), lb: 'Как напечатано (10…22 м/с)', b: body(b), b_on: !on, note };
    },
    indK() {
      const on = !!S.P.indK, a = on ? altR({ indK: false }) : S.R, b = on ? S.R : altR({ indK: true }); L.use(S.R);
      const body = r => r ? `<div class="ex-f">У<sub>п</sub> = ${fin(r.Up)} руб./год</div><div class="ex-f">У = ${fin(r.U)} руб./год</div>` : '';
      return { la: 'Без коэффициентов, как в пособии (рекомендуется)', a: body(a), lb: 'С коэффициентами табл. 1.14', b: body(b), b_on: on };
    },
    mode() {
      const a = altR({ mode: 'book' }), b = altR({ mode: 'exact' });
      L.use(S.R);
      if (!a || !b) return { table: '' };
      const cur = S.P.mode === 'exact' ? 1 : 0;
      const rows = SP() ? SP().modeRows(a, b) : [['V<sub>i</sub>, м³/с', a.o.Vi, b.o.Vi], ['m', a.o.m, b.o.m], ['V<sub>m</sub>, м/с', a.o.Vm, b.o.Vm], ['d', a.o.d, b.o.d], ['X<sub>max</sub> газов, м', a.sub[0].Xmax, b.sub[0].Xmax],
        ['C<sub>max</sub> пыли, мг/м³', a.by.dust.Cmax, b.by.dust.Cmax], ['ПДВ пыли, г/с', a.by.dust.PDV, b.by.dust.PDV]];
      return { table: `<table class="ex-tbl"><thead><tr><th>Величина</th><th class="${cur === 0 ? 'on' : ''}">Как в методичке${cur === 0 ? ' <span>сейчас</span>' : ''}</th><th class="${cur === 1 ? 'on' : ''}">Точно${cur === 1 ? ' <span>сейчас</span>' : ''}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${(+r[1].toFixed(5)).toString().replace('.', ',')}</td><td>${fnum(r[2], 5)}</td></tr>`).join('')}</tbody></table>` };
    },
    logo() {
      const page = l => `<div class="ex-paper title">${l ? '<b class="ex-logo">КНИТУ</b>' : ''}<p>МИНОБРНАУКИ РОССИИ</p><p>Федеральное государственное бюджетное образовательное учреждение высшего образования</p><p>«Казанский национальный исследовательский технологический университет»</p></div>`;
      return { la: 'Без логотипа', a: page(false), lb: 'С логотипом', b: page(true), b_on: !!S.T.logo };
    },
    explain() {
      const o = S.R && S.R.o && S.R.o.m ? S.R.o : { f: 1.2, m: 0.88 };
      const page = e => `<div class="ex-paper">${e ? '<p>Параметр f сравнивает скоростной напор струи с её перегревом:</p>' : ''}<div class="ex-math">f = 10³W²D/(H²ΔT) = ${fk(o.f, 2)}</div>${e ? '<p>Коэффициент m учитывает условия выхода смеси из устья:</p>' : ''}<div class="ex-math">m = 1/(0,67 + 0,1√f + 0,34∛f) = ${fk(o.m, 2)}</div></div>`;
      return { la: 'Только формулы', a: page(false), lb: 'С пояснениями', b: page(true), b_on: !!S.T.explain };
    },
    content() {
      const a = '<div class="ex-paper"><p class="h">2.3 Сравнение с нормативами</p><p>Таблица 2 – Сравнение приземных концентраций с ПДК</p><p class="h">3 Предельно допустимые выбросы</p><p>…</p></div>';
      return { la: 'По заданию', a, lb: 'Расширенный', b: this.figs().b, b_on: S.T.content === 'ext' };
    },
    figs() {
      const fig = `<div class="ex-paper fig"><svg viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M30 8V92H295" fill="none" stroke="#7d8996"/><path d="M30 92 C60 92 70 20 95 22 S160 70 295 86" fill="none" stroke="#0072BD" stroke-width="2"/><path d="M30 50H295" stroke="#c0392b" stroke-dasharray="4 3"/></svg><p class="cap">Рисунок 1 — Распределение приземных концентраций</p></div>`;
      return { la: 'Без рисунков', a: '<div class="ex-paper"><p class="h">3 Предельно допустимые выбросы</p><p>…</p></div>', lb: 'С рисунками', b: fig, b_on: !!S.T.figs };
    },
    readable() {
      const brk = '<div class="ex-brk"><span>разрыв страницы</span></div>';
      const off = `<div class="ex-paper"><p>…конец предыдущего расчёта.</p><p>Коэффициент m находим по формуле (1.4):</p>${brk}<p class="h" style="text-align:center">m = 1/(0,67 + …) = 0,88</p></div>`;
      const on = `<div class="ex-paper"><p>…конец предыдущего расчёта.</p><p class="gap">свободное место</p>${brk}<p>Коэффициент m находим по формуле (1.4):</p><p class="h" style="text-align:center">m = 1/(0,67 + …) = 0,88</p></div>`;
      return { la: 'Обычный перенос', a: off, lb: 'Пояснение с формулой', b: on, b_on: !!S.T.readable };
    }
  };
  function refreshPv(key) { const el = $(`.opt-ex[data-pv="${key}"]`); if (el && PV[key]) el.innerHTML = exHtml(key); }
  function seg(scope, key, cur, opts, kind) {
    return `<div class="seg" role="radiogroup" data-scope="${scope}" data-key="${key}" data-kind="${kind}">${opts.map(([v, l]) => `<button type="button" role="radio" aria-checked="${String(v) === String(cur)}" data-val="${v}">${l}</button>`).join('')}</div>`;
  }
  function sw(key) { return `<label class="sw"><input type="checkbox" data-tkey="${key}" ${S.T[key] ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="sr">вкл.</span></label>`; }
  function swP(key) { const d = SP() && SP().defaults ? SP().defaults[key] : undefined; return `<label class="sw"><input type="checkbox" data-pkey="${key}" ${(S.P[key] === undefined ? d : S.P[key]) ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="sr">вкл.</span></label>`; }

  /* ---------- ссылка «поделиться» ---------- */
  function shareUrl() {
    const base = L.fromVariant(S.P.variant, TK()), diff = {};
    for (const k of Object.keys(S.P)) if (k !== 'variant' && JSON.stringify(S.P[k]) !== JSON.stringify(base[k])) diff[k] = S.P[k];
    let h = '#' + tpre() + 'v' + S.P.variant + '-' + S.tab;
    if (Object.keys(diff).length) h += '&s=' + btoa(unescape(encodeURIComponent(JSON.stringify(diff)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return location.href.split('#')[0] + h;
  }
  function share() { copyText(shareUrl(), 'Ссылка скопирована: по ней откроется этот же расчёт'); }

  /* ---------- слоты сохранений ---------- */
  const SLOT_N = 5;
  function getSlots() { let a = ls.get('slots'); a = Array.isArray(a) ? a : []; while (a.length < SLOT_N) a.push(null); return a.slice(0, SLOT_N); }
  function putSlots(a) { if (ls.set('slots', a)) return true; toast('Браузер не разрешает сохранять данные на этой странице'); return false; }
  function slotMeta(sl) {
    const d = new Date(sl.at), pad = x => String(x).padStart(2, '0');
    return `Вариант ${sl.P.variant}${sl.T && sl.T.student ? ' · ' + esc(sl.T.student) : ''} · ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function getAuto() { return ls.get('autosave'); }
  function autoRowHtml() {
    const sl = getAuto();
    return `<div class="opt slot auto" id="slot-auto"><div class="opt-t"><b><i class="slot-no">А</i>Автосохранение</b><span>${sl ? slotMeta(sl) + ' · обновляется само после каждого изменения; загрузка слота его не затирает' : 'Появится после первого изменения'}</span></div><div class="opt-c slot-act">${sl ? '<button class="btn primary" id="slot-auto-load">Загрузить</button>' : ''}</div></div>`;
  }
  function bindAuto() {
    const b = $('#slot-auto-load'); if (!b) return;
    b.onclick = () => { const sl = getAuto(); if (!sl) return; S.P = Object.assign(L.defaults(), sl.P); S.T = Object.assign({}, T_DEF, sl.T || {}); S.skipAuto = true; saveT(); S.skipAuto = true; recompute(); toast('Загружено автосохранение'); };
  }
  function slotsHtml() {
    return autoRowHtml() + getSlots().map((sl, k) => `<div class="opt slot${sl ? '' : ' empty'}"><div class="opt-t"><b><i class="slot-no">${k + 1}</i>${sl ? esc(sl.name) : 'Пустой слот'}</b><span>${sl ? slotMeta(sl) : 'Сохраните сюда текущее состояние'}</span></div><div class="opt-c slot-act">
      <button class="btn" data-slot-save="${k}">${sl ? 'Перезаписать' : 'Сохранить'}</button>${sl ? `<button class="btn primary" data-slot-load="${k}">Загрузить</button><button class="btn icon-x" data-slot-del="${k}" title="Удалить" aria-label="Удалить слот ${k + 1}">✕</button>` : ''}</div></div>`).join('');
  }
  function bindSlots() {
    const box = $('#slots'); if (!box) return;
    const redraw = () => { box.innerHTML = slotsHtml(); bindSlots(); };
    bindAuto();
    $$('[data-slot-save]', box).forEach(b => b.onclick = () => {
      const k = +b.dataset.slotSave, a = getSlots();
      const def = a[k] ? a[k].name : 'Вариант ' + S.P.variant + (S.T.student ? ' — ' + S.T.student : '');
      const name = prompt('Название сохранения', def); if (name === null) return;
      a[k] = { name: name.trim() || def, at: Date.now(), P: JSON.parse(JSON.stringify(S.P)), T: JSON.parse(JSON.stringify(S.T)) };
      if (putSlots(a)) { toast('Сохранено в слот ' + (k + 1)); redraw(); }
    });
    $$('[data-slot-load]', box).forEach(b => b.onclick = () => {
      const sl = getSlots()[+b.dataset.slotLoad]; if (!sl) return;
      autoSave(true);
      S.P = Object.assign(L.defaults(), sl.P); S.T = Object.assign({}, T_DEF, sl.T || {}); S.skipAuto = true; saveT();
      S.skipAuto = true; recompute(); toast('Загружено: ' + sl.name);
    });
    $$('[data-slot-del]', box).forEach(b => b.onclick = () => {
      const k = +b.dataset.slotDel, a = getSlots(); if (!a[k] || !confirm('Удалить сохранение «' + a[k].name + '»?')) return;
      a[k] = null; if (putSlots(a)) redraw();
    });
    const ex = $('#slots-exp'); if (ex) ex.onclick = () => downloadText('ekologiya-pdv-sohraneniya.json', JSON.stringify({ app: 'eco-pdv', ver: 1, current: { P: S.P, T: S.T }, slots: getSlots() }, null, 1));
    const im = $('#slots-imp-f'); if (im) im.onchange = () => {
      const f = im.files && im.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const j = JSON.parse(rd.result); if (!j || j.app !== 'eco-pdv' || !Array.isArray(j.slots)) throw new Error('fmt');
          const a = getSlots(); let n = 0;
          j.slots.forEach(sl => { if (!sl || !sl.P) return; const k = a.findIndex(x => !x); if (k < 0) return; a[k] = sl; n++; });
          if (putSlots(a)) { toast(n ? 'Импортировано сохранений: ' + n : 'Нет свободных слотов или пустой файл'); redraw(); }
        } catch (e) { toast('Это не файл сохранений утилиты'); }
        im.value = '';
      };
      rd.readAsText(f);
    };
  }

  /* ---------- расчёт M по расходу топлива (табл. 1.1) ---------- */
  const FUEL = { fuel: 'kuz', B: 50000, tau: 6000 };
  function fuelCalc() {
    const fu = D.fuels.find(x => x.id === FUEL.fuel) || D.fuels[0];
    const k = FUEL.B * 1e6 / (FUEL.tau * 3600);           // т/год → г/с на единицу удельного показателя
    return { fu, Mdust: fu.dust * k, Mco: fu.co * k, Mso2: fu.so2 * k, Mno2: fu.nox * k };
  }
  function fuelHtml() {
    const r = fuelCalc(), u = r.fu.unit === 'т' ? 'т/год' : 'тыс. м³/год';
    return `<div class="form-grid fg4">
        <div class="fld"><label for="fu-sel"><span>Топливо (табл. 1.1)</span></label><select id="fu-sel" class="txt">${D.fuels.map(f => `<option value="${f.id}"${f.id === FUEL.fuel ? ' selected' : ''}>${f.name}</option>`).join('')}</select></div>
        <div class="fld"><label for="fu-B"><span>Годовой расход B</span></label><div class="inp has-u"><input id="fu-B" inputmode="decimal" value="${String(FUEL.B).replace('.', ',')}"><span class="unit">${u}</span></div></div>
        <div class="fld"><label for="fu-t"><span>Работа котельной τ</span></label><div class="inp has-u"><input id="fu-t" inputmode="decimal" value="${String(FUEL.tau).replace('.', ',')}"><span class="unit">ч/год</span></div></div>
      </div>
      <div class="calc"><div class="calc-math">${tex('M=\\dfrac{q\\,B\\cdot 10^6}{3600\\,\\tau}', true)}</div><div class="calc-desc">q — удельный показатель выброса, т/т топлива (для газа — т/1000 м³); 10<sup>6</sup> — перевод т в г; 3600·τ — время работы, с.</div></div>
      <div class="tbl"><table><thead><tr><th>Вещество</th><th class="num">q, т/${r.fu.unit === 'т' ? 'т' : '1000 м³'}</th><th class="num">M, г/с</th></tr></thead><tbody>
        <tr><td>Пыль</td><td class="num">${fin(r.fu.dust)}</td><td class="num">${fnum(r.Mdust)}</td></tr>
        <tr><td>CO</td><td class="num">${fin(r.fu.co)}</td><td class="num">${fnum(r.Mco)}</td></tr>
        <tr><td>SO<sub>2</sub></td><td class="num">${fin(r.fu.so2)}</td><td class="num">${fnum(r.Mso2)}</td></tr>
        <tr><td>NO<sub>x</sub> (как NO<sub>2</sub>)</td><td class="num">${fin(r.fu.nox)}</td><td class="num">${fnum(r.Mno2)}</td></tr></tbody></table></div>
      <div class="dact"><button class="btn" id="fu-apply">Подставить эти M в расчёт</button></div>`;
  }
  function bindFuel() {
    const box = $('#fuel'); if (!box) return;
    const redraw = () => { box.innerHTML = fuelHtml(); bindFuel(); };
    $('#fu-sel').onchange = e => { FUEL.fuel = e.target.value; redraw(); };
    const num = (el, key) => el.onchange = () => { const v = parseFloat(el.value.replace(',', '.')); if (!(v > 0)) { toast('Введите положительное число'); el.value = FUEL[key]; return; } FUEL[key] = v; redraw(); };
    num($('#fu-B'), 'B'); num($('#fu-t'), 'tau');
    $('#fu-apply').onclick = () => {
      const r = fuelCalc(), rnd = x => +x.toPrecision(4);
      S.P.Mdust = rnd(r.Mdust); S.P.Mco = rnd(r.Mco); S.P.Mso2 = rnd(r.Mso2); S.P.Mno2 = rnd(r.Mno2);
      if (!(S.P.Mdust > 0) || !(S.P.Mso2 > 0)) toast('Для газа выбросы пыли и SO₂ равны нулю — расчёт по ним формальный');
      recompute(); toast('Выбросы M подставлены — поля подсвечены как изменённые');
    };
  }

  function renderData(main) {
    const P = S.P, V = L.fromVariant(P.variant, TK()), T2 = TK() === 2, sp = SP();
    const DEF = sp ? L.fromVariant(P.variant, TK()) : L.defaults();
    const vrows = VL().map(v => `<tr data-v="${v.no}" class="${v.no === P.variant ? 'on' : ''}"><td class="num">${v.no}</td>${sp ? sp.vcols.map(c => `<td class="num">${c[1](v)}</td>`).join('') : VK().map(k => `<td class="num">${fin(v[k])}</td>`).join('')}</tr>`).join('');
    const vhead = sp ? sp.vcols.map(c => c[0]) : T2 ? ['M<sub>пыли</sub>, г/с', 'C<sub>ф</sub><sup>пыли</sup>, мг/м³', 'H, м', 'D, м', 'W, м/с', 'T<sub>п</sub>, °C', 'T<sub>в</sub>, °C', 'A'] : ['M<sub>CO</sub>', 'M<sub>NO₂</sub>', 'M<sub>SO₂</sub>', 'M<sub>пыли</sub>', 'H, м', 'D, м', 'W, м/с', 'T<sub>г</sub>, °C', 'T<sub>в</sub>, °C', 'A'];
    const vname = sp && sp.vname ? ' · ' + esc(sp.vname(VL().find(v => v.no === P.variant) || {})) : '';
    const advHtml = sp ? (sp.adv ? `<details class="adv"><summary>${sp.advTitle}</summary><div class="in"><div class="form-grid">${sp.adv.map(f => fld(f[0], f[1], f[2], f[3], P[f[0]], String(DEF[f[0]]) !== String(P[f[0]]))).join('')}</div><p class="dhint">${sp.advHint}</p></div></details>` : '')
      : `<details class="adv"><summary>${T2 ? 'ПДК пыли и коэффициенты F, η' : 'Фоновые концентрации, ПДК и коэффициенты F, η'}</summary><div class="in"><div class="form-grid">${(T2 ? ADV.filter(f => ['eta', 'Fd', 'pdk_dust'].includes(f[0])) : ADV).map(f => fld(f[0], f[1], f[2], f[3], P[f[0]], String(DEF[f[0]]) !== String(P[f[0]]))).join('')}</div>
            <p class="dhint">${T2 ? 'По условию задачи 1.2: ПДК<sup>пыли</sup> = 0,5 мг/м³, F = 3, N = 1; фоновая концентрация пыли задана в табл. 1.3 для каждого варианта. ' : ''}По умолчанию — условие задачи 1.1: C<sub>ф</sub><sup>CO</sup> = 1,5, C<sub>ф</sub><sup>NO₂</sup> = 0,03, C<sub>ф</sub><sup>SO₂</sup> = 0,1, C<sub>ф</sub><sup>пыли</sup> = 0,2 мг/м³; ПДК: CO — 5, NO₂ — 0,085, SO₂ — 0,5, пыль — 0,5 мг/м³. η = 1 — ровная местность. F для пыли: 2 при степени очистки ≥ 90 %, 2,5 при 75–90 %, 3 — менее 75 % или без очистки.</p></div></details>`;
    main.innerHTML = `<article class="sheet">
      <header class="sheet-head"><div><div class="eyebrow">${sp ? 'Задача 1.' + TK() + ' · табл. ' + sp.table + ' «' + sp.vcaption + '»' : T2 ? 'Задача 1.2 · табл. 1.3 «Варианты задачи 1.2 по расчёту C<sub>max</sub> пыли и ПДВ пыли»' : 'Задача 1.1 · табл. 1.2 «Варианты задачи 1.1 по расчёту C<sub>max</sub> и ПДВ»'}</div><h1>Вариант ${P.variant}${vname}</h1>
        <p class="lead">${sp ? sp.dataLead + ' Задача и номер варианта выбираются вверху страницы; всё пересчитывается автоматически, изменённые поля подсвечиваются.' : ''}${sp ? '' : `Задача выбирается вверху страницы (1.1 — паросиловое производство, CO, NO₂, SO₂ и пыль; 1.2 — выброс пыли вытяжной вентиляцией), рядом — номер варианта; всё пересчитывается автоматически. Изменённые поля подсвечиваются. Вариант 1 — пример решения из пособия (для сверки: ${T2 ? 'ПДВ<sup>пыли</sup> = 0,98 г/с, ε = 75,5 %' : 'C<sub>max</sub><sup>пыли</sup> = 0,60745 мг/м³, ПДВ<sup>пыли</sup> = 6,57 г/с, ε = 50,6 %'}).`}</p></div>
        ${stamp(0)}
      </header>
      <div class="sheet-body rep data-page">
        ${S.err ? `<div class="note bad" style="margin-top:16px">Ошибка расчёта: ${esc(S.err.message)}.</div>` : ''}
        <section class="dsec">
          <h2>1. Параметры варианта</h2>
          <div class="form-grid fg4">${(sp ? sp.fields : T2 ? FIELDS2 : FIELDS).map(f => fld(f[0], f[1], f[2], f[3], P[f[0]], (V[f[0]] === null) !== (P[f[0]] === null) || +V[f[0]] !== +P[f[0]])).join('')}</div>
          <div class="dact"><button class="btn" id="reset-var">Сбросить к варианту ${P.variant}</button><button class="btn" id="go-s1">Перейти к этапу 1 →</button></div>
          <details class="adv"><summary>Таблица ${TBL()} — все ${NVf()} ${plVar(NVf())} (щелчок по строке выбирает вариант)</summary><div class="in"><div class="tbl var-table"><table><thead><tr><th class="num">№</th>${vhead.map(k => `<th class="num">${k}</th>`).join('')}</tr></thead><tbody>${vrows}</tbody></table></div><p class="dhint">${sp ? sp.vhint : 'Выбросы M — в г/с. Для газовых выбросов F = 1, для пыли F = 3; число дымовых труб N = 1.'}</p></div></details>
          ${advHtml}
          ${TK() !== 1 ? '' : `<details class="adv"><summary>Расчёт выбросов M по годовому расходу топлива (табл. 1.1)</summary><div class="in" id="fuel">${fuelHtml()}</div></details>`}
        </section>
        <section class="dsec set set-calc" data-set="настройки расчёта">
          <h2>2. Методика расчёта</h2>
          <p class="dlead">Как округлять и какие дополнительные проверки выполнять. Значения по умолчанию воспроизводят пример решения пособия.</p>
          <div class="opts">
            ${optRow('Промежуточные значения', sp ? sp.modeText : '«Как в методичке» — π = 3,14 и округление f, V<sub>i</sub>, m, V<sub>m</sub>, n, d до 0,01, ПДВ до 0,01 г/с: числа совпадают с примером решения. «Точно» — без округлений.', seg('P', 'mode', P.mode || 'book', [['book', 'Как в методичке'], ['exact', 'Точно']], 'str'))}
            ${TK() !== 1 ? '' : optRow('Эффект суммации SO<sub>2</sub> + NO<sub>2</sub>', 'Проверка по формуле (1.1): сумма отношений концентраций к ПДК не больше 1. В примере пособия не выполняется.', swP('sumEff'))}
            ${sp && sp.opts ? sp.opts.map(o => optRow(o[0], o[1], swP(o[2]))).join('') : ''}
            ${sp ? '' : optRow('Наименьшая высота трубы', 'Альтернатива очистке: при какой высоте H выполняется C<sub>max</sub> + C<sub>ф</sub> ≤ ПДК (формула (1.27) с подбором H).', swP('hmin'))}
            ${sp ? '' : optRow('Распределение концентраций C(x)', 'График по оси факела и граница зоны превышения ПДК (форма кривой — по ОНД-86).', swP('prof'))}
          </div>
        </section>
        <section class="dsec set set-rep" data-set="настройки отчёта">
          <h2>3. Отчёт и файлы</h2>
          <h3>Титульный лист</h3>
          <div class="form-grid fg4">
            ${tfld('student', 'Студент (Ф. И. О.)', 'Иванов И. И.')}${tfld('group', 'Группа', '741-15')}${tfld('teacher', 'Проверил', 'Савельев С. Н.')}${tfld('discipline', 'Дисциплина', '')}
            ${tfld('title', 'Тема работы', sp ? sp.rep.title : T2 ? REPORT.META.title2 : REPORT.META.title)}${tfld('kind', 'Вид работы («по …»)', 'практической работе')}${tfld('dept', 'Институт / кафедра', 'необязательно')}${tfld('year', 'Год', '')}
          </div>
          <div class="fld"><label for="t-src"><span>Источник [1] в списке литературы (пусто — пособие Фридланда и др., 2008)</span></label><input id="t-src" data-tkey="src" value="${esc(S.T.src || '')}" placeholder="${esc(REPORT.META.src)}" autocomplete="off" class="txt"></div>
          <div class="fld"><label for="t-org"><span>Шапка титульного листа (каждая строка — отдельный абзац)</span></label><textarea id="t-org" data-tkey="org" rows="5">${esc(S.T.org)}</textarea></div>
          <div class="opts">${optRow('Логотип КНИТУ', 'Над шапкой титульного листа.', sw('logo'))}</div>
          <h3>Содержание и оформление</h3>
          <div class="opts">
            ${optRow('Пояснения к формулам', 'Перед формулой — что считается и зачем.', sw('explain'))}
            ${optRow('Состав отчёта', sp ? sp.contentText : '«По заданию» — только пункты 1–5 задачи 1.1: C<sub>max</sub>, X<sub>max</sub>, сравнение с ПДК, ПДВ, степень очистки и рекомендации. «Расширенный» — дополнительно графики (чёрно-белые) и разделы, включённые в «Методике расчёта»: эффект суммации, распределение концентраций, высота трубы.', seg('T', 'content', S.T.content || 'task', [['task', 'По заданию'], ['ext', 'Расширенный']], 'str'))}
            ${optRow('Раздел «Цель работы»', 'Выключите, если преподаватель не требует.', sw('secGoal'))}
            ${optRow('Раздел «Задание»', 'Условие задачи с данными варианта и перечень того, что требуется определить.', sw('secTask'))}
            ${optRow('Раздел «Исходные данные»', 'Значения варианта из таблицы пособия и таблица фона и ПДК. Выключено — отчёт сразу начинается с расчёта (раздел 1).', sw('secData'))}
            ${optRow('Номера формул', '(1), (2)… у правого края строки. Выключено — формулы без номеров.', sw('eqNum'))}
            ${optRow('Список использованных источников', 'Выключено — списка нет, ссылки [1] из текста, подписей таблиц и формул тоже убираются.', sw('secSrc'))}
            ${optRow('Шрифт 12 пт, интервал 1,0', 'Основной текст, таблицы и формулы — 12 пт с одинарным межстрочным интервалом; титульный лист не меняется. Выключено — 14 пт, интервал 1,5.', sw('compact'))}
            ${optRow('Улучшение читаемости', 'Не отрывать пояснение от формулы и пункты списков друг от друга при переходе на новую страницу.', sw('readable'))}
          </div>
          <h3>Скачать</h3>
          <div class="dl-grid"><button class="btn primary dl-all" data-docx="1">${dlIcon()} Отчёт по варианту ${P.variant} (.docx)</button></div>
          <div class="dact"><button class="btn" id="zip-all">${dlIcon()} Архив работы (.zip)</button></div>
          <p class="dhint">Архив: отчёт Word, полный расчёт в HTML (открывается в браузере, печатается), графики PNG, результаты в CSV (открываются в Excel) и сводка ответов по всем вариантам.</p>
        </section>
        <section class="dsec set set-saves" data-set="сохранения">
          <h2>4. Сохранения</h2>
          <p class="dlead">Текущее состояние запоминается автоматически и восстанавливается при следующем открытии сайта; отдельно ведётся автосохранение. Чтобы держать несколько наборов (например, свой вариант и вариант одногруппника), сохраните их в слоты.</p>
          <div class="opts slots" id="slots">${slotsHtml()}</div>
          <div class="dact"><button class="btn" id="share2">${LINK_ICON} Скопировать ссылку на расчёт</button><button class="btn" id="slots-exp">${dlIcon()} Экспорт в файл</button><label class="btn" for="slots-imp-f">Импорт из файла</label><input type="file" id="slots-imp-f" accept=".json,application/json" hidden></div>
          <p class="dhint">Ссылка содержит вариант и все ваши правки — по ней одногруппник откроет ровно этот расчёт; данные титульного листа в ссылку не попадают. Слоты хранятся только в этом браузере на этом устройстве; чтобы перенести их, сохраните файл экспорта.</p>
        </section>
      </div></article>`;
    bindSlots(); bindFuel();
    $('#zip-all').onclick = e => zipAll(e.currentTarget);
    $('#share2').onclick = share;
    $$('#main input[data-key]').forEach(el => el.addEventListener('change', onField));
    $$('#main .seg button').forEach(b => b.onclick = () => {
      const g = b.parentElement, raw = b.dataset.val, v = g.dataset.kind === 'bool' ? raw === 'true' : g.dataset.kind === 'str' ? raw : +raw;
      $$('button', g).forEach(x => x.setAttribute('aria-checked', String(x === b)));
      if (g.dataset.scope === 'P') { S.P[g.dataset.key] = v; recompute(); } else { S.T[g.dataset.key] = v; saveT(); refreshPv(g.dataset.key); }
    });
    $$('#main [data-pkey]').forEach(el => el.addEventListener('change', () => { S.P[el.dataset.pkey] = el.checked; recompute(); }));
    $('#reset-var').onclick = () => { const keep = {}; ['mode', 'sumEff', 'hmin', 'prof'].forEach(k => keep[k] = S.P[k]); S.P = Object.assign(L.fromVariant(S.P.variant, TK()), keep); recompute(); };
    $('#go-s1').onclick = () => go('s1');
    $$('#main [data-tkey]').forEach(el => el.addEventListener('change', () => { S.T[el.dataset.tkey] = el.type === 'checkbox' ? el.checked : el.value; saveT(); refreshPv(el.dataset.tkey); }));
    $$('#main [data-docx]').forEach(b => b.onclick = () => makeDocx(b));
    $$('.var-table tr[data-v]').forEach(tr => tr.onclick = () => setVariant(+tr.dataset.v));
  }
  function plVar(n) { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'вариант' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'варианта' : 'вариантов'; }
  function tfld(key, label, ph) {
    return `<div class="fld"><label for="t-${key}"><span>${label}</span></label><input id="t-${key}" data-tkey="${key}" value="${esc(S.T[key] || '')}" placeholder="${esc(ph)}" autocomplete="off" class="txt"></div>`;
  }
  function onField(e) {
    const el = e.target, k = el.dataset.key;
    const raw = el.value.trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
    const sp = SP();
    if (raw === '' && sp && (sp.nullable || []).includes(k)) { S.P[k] = null; recompute(); return; }
    const v = parseFloat(raw);
    if (!isFinite(v)) { toast('Введите число'); el.value = String(S.P[k]).replace('.', ','); return; }
    const zeroOk = sp ? (sp.zero || []).includes(k) : /^(M|cf_)/.test(k), negOk = k === 'Tv' || !!(sp && (sp.neg || []).includes(k));
    if (!negOk && (v < 0 || (v === 0 && !zeroOk))) { toast(zeroOk ? 'Значение не может быть отрицательным' : 'Значение должно быть положительным'); el.value = String(S.P[k]).replace('.', ','); return; }
    if (!sp && (k === 'Fg' || k === 'Fd') && (v < 1 || v > 3)) { toast('Коэффициент F — от 1 до 3'); el.value = String(S.P[k]).replace('.', ','); return; }
    if (TK() <= 3 && k === 'Tg' && !(v > S.P.Tv) || TK() <= 3 && k === 'Tv' && !(v < S.P.Tg)) { toast('Температура газов должна быть выше температуры воздуха'); el.value = String(S.P[k]).replace('.', ','); return; }
    S.P[k] = v;
    recompute();
  }
  function setVariant(v) { v = clampV(v); const keep = {}; ['mode', 'sumEff', 'hmin', 'prof'].concat(SP() && SP().opts ? SP().opts.map(o => o[2]) : []).forEach(k => keep[k] = S.P[k]); S.P = Object.assign(L.fromVariant(v, TK()), keep); recompute(); }
  function setTask(t) {
    t = +t >= 1 && +t <= 8 ? +t : 1; if (t === TK()) return;
    const keep = {}; ['mode', 'sumEff', 'hmin', 'prof'].forEach(k => keep[k] = S.P[k]);
    S.P = Object.assign(L.fromVariant(1, t), keep); S.sum = null;
    $('#var-sel').innerHTML = ''; recompute(); toast('Задача 1.' + t + ': табл. ' + TBL(t) + ', ' + NVf() + ' вариантов');
  }

  /* ---------- вкладки этапов ---------- */
  function kpis(tab) {
    const R = S.R, o = R.o;
    if (SP()) return SP().kpis(R, tab);
    const k = (a, b, u, cls) => `<div class="kpi${cls ? ' ' + cls : ''}"><div class="k">${a}</div><div class="v">${pw(b)}${u ? ' <small>' + u + '</small>' : ''}</div></div>`;
    switch (tab) {
      case 's1': return k('ΔT', fk(o.dT, 1), '°C') + k('f · тип выброса', fk(o.f, 2) + ' · ' + (o.hot ? 'нагретый' : 'холодный')) + k('V<sub>i</sub>', fk(o.Vi, 2), 'м³/с') + (o.hot ? k('m', fk(o.m, 2)) : '') + k(o.hot ? 'V<sub>m</sub>' : 'V′<sub>m</sub>', fk(o.Vm, 2), 'м/с') + k('n', fk(o.n, 2));
      case 's2': return R.sub.map(x => k('(C<sub>max</sub> + C<sub>ф</sub>) / ПДК · ' + x.s.html, fnum(x.ratio, 3), '', x.exceed ? 'bad' : 'ok')).join('') + k('d', fk(o.d, 2)) + (R.task === 2 ? k('X<sub>max</sub> пыли', fk(R.by.dust.Xmax, 1), 'м') : k('X<sub>max</sub> газы / пыль', fk(R.sub[0].Xmax, 1) + ' / ' + fk(R.by.dust.Xmax, 1), 'м'));
      case 's3': return R.sub.map(x => k('ПДВ · ' + x.s.html, fk(x.PDV, 2), 'г/с', x.over ? 'bad' : 'ok')).join('') + (R.overList.length ? R.overList.map(x => k('ε · ' + x.s.html, fk(x.eps, 1), '%')).join('') : k('Очистка', 'не требуется'));
    }
    return '';
  }
  function renderItems(items, tab) {
    let h = '', fig = 0; const seen = {};
    for (const it of items) {
      if (it.repOnly) continue;
      switch (it.k) {
        case 'h': h += `<h2>${pw(it.t)}</h2>` + (window.MDOC ? MDOC.theory('t' + TK(), it.t) : ''); break;
        case 'p': h += `<p>${pw(it.t)}</p>`; break;
        case 'note': h += `<div class="note ${it.kind}">${pw(it.t)}</div>`; break;
        case 'tex': h += calcCard(it.t, window.EXPLAIN ? EXPLAIN.texDesc(it.desc) : ''); break;
        case 'eq': {
          let s = it.lhs;
          if (it.formula) s += '=' + it.formula;
          if (it.subst) s += '=' + it.subst;
          s += '=' + (it.vs || L.n(it.val)) + (it.unit ? '\\ \\text{' + it.unit.replace('%', '\\%') + '}' : '');
          const d = window.EXPLAIN && !seen['#' + it.key] ? EXPLAIN.eqDesc(it.key) : ''; seen['#' + it.key] = 1;
          const n = seen[it.lhs] = (seen[it.lhs] || 0) + 1, ck = tab + '|' + it.lhs + '|' + n;
          CHKIDX[ck] = { tab, lhs: it.lhs, n, val: it.val, unit: it.unit || '', order: Object.keys(CHKIDX).length };
          h += calcCard(s, d, ck); break;
        }
        case 'check': h += `<div class="check ${it.ok ? '' : 'bad'}"><span class="mark">${it.ok ? '✓' : '!'}</span><div class="body">${tex(it.tex, false)}<div class="ct">${it.t || ''}</div></div></div>`; break;
        case 'table': h += `<div class="tbl"><table>${it.caption ? `<caption>${esc(it.caption)}</caption>` : ''}<thead><tr>${it.head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${it.rows.map(r => `<tr>${r.map(c => `<td>${pw(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; break;
        case 'plot': fig++; h += `<figure class="fig"><div class="plot" id="p-${it.id}"><div class="plot-wait"><span><span class="spinner"></span>Построение…</span></div></div><figcaption><span><b>Рис. ${stNo(tab)}.${fig}.</b> ${esc(it.title)}</span></figcaption></figure>`; break;
      }
    }
    return h;
  }
  const LINK_ICON = '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.6 9.4a2.6 2.6 0 0 0 3.7 0l2.4-2.4a2.6 2.6 0 0 0-3.7-3.7l-.9.9M9.4 6.6a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.9-.9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  let calcSeq = 0;
  const CALC = {};
  const ICON_COPY = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  function calcCard(src, desc, ck) {
    const id = 'f' + (++calcSeq); CALC[id] = src;
    const chk = ck && CHK.on ? chkRow(ck) : '';
    return `<div class="calc"><div class="calc-math">${tex(src, true)}</div><div class="calc-tools"><button class="calc-btn" data-mml="${id}" title="Копировать формулу для Word (MathML)" aria-label="Копировать формулу для Word">${ICON_COPY}</button><button class="calc-btn tx" data-tex="${id}" title="Копировать как LaTeX" aria-label="Копировать как LaTeX">TeX</button></div>${desc ? `<div class="calc-desc">${esc(desc)}</div>` : ''}${chk}</div>`;
  }
  /* ---------- сверка с ручным расчётом ---------- */
  const CHKIDX = {};
  const CHK = Object.assign({ on: false, vals: {} }, ls.get('check') || {});
  function saveChk() { ls.set('check', CHK); }
  const chkKey = ck => S.P.variant + '|' + ck;
  function chkRow(ck) {
    const v = CHK.vals[chkKey(ck)];
    return `<div class="chk-row" data-ck="${esc(ck)}"><label><span>Ваше значение</span><input inputmode="decimal" autocomplete="off" value="${v === undefined ? '' : esc(String(v).replace('.', ','))}" placeholder="из тетради">${CHKIDX[ck] && CHKIDX[ck].unit ? `<em>${esc(CHKIDX[ck].unit)}</em>` : ''}</label><div class="chk-v"></div></div>`;
  }
  const relDev = (u, v) => Math.abs(u - v) / Math.max(Math.abs(v), 1e-12);
  const TOL = 0.006;
  function verdict(ck, row) {
    const out = $('.chk-v', row), c = CHKIDX[ck];
    const raw = CHK.vals[chkKey(ck)];
    row.classList.remove('ok', 'warn', 'bad');
    if (raw === undefined || raw === '') { out.innerHTML = ''; return; }
    const u = +raw, v = c.val;
    if (!isFinite(u)) { out.textContent = 'Введите число'; row.classList.add('warn'); return; }
    const dv = relDev(u, v), pc = x => String(+(x * 100).toFixed(x < 0.01 ? 2 : 1)).replace('.', ',') + ' %';
    if (dv <= TOL) { row.classList.add('ok'); out.innerHTML = '✓ Совпадает' + (dv > 0.0005 ? ` (разница ${pc(dv)} — округление)` : ''); return; }
    if (relDev(-u, v) <= TOL) { row.classList.add('warn'); out.innerHTML = '≈ Совпадает по модулю, но знак противоположный — проверьте знак в формуле.'; return; }
    for (const k of [1e3, 1e-3, 1e6, 1e-6]) if (relDev(u * k, v) <= TOL) { row.classList.add('warn'); out.innerHTML = `≈ Совпадает с точностью до единиц измерения: проверьте приставку (×${k >= 1 ? fnum(k) : '1/' + fnum(1 / k)}) — утилита считает в ${esc(c.unit || 'основных единицах')}.`; return; }
    for (let k = 1; k <= 4; k++) {
      const e = Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - k + 1), tr = Math.trunc(v / e) * e, rn = Math.round(v / e) * e;
      if (Math.abs(u - tr) < e * 1e-6 && Math.abs(tr - rn) > e * 0.5) { row.classList.add('warn'); out.innerHTML = `≈ Похоже, значение обрезано, а не округлено: ${fnum(v)} ≈ ${String(+rn.toPrecision(k)).replace('.', ',')}, а не ${String(+tr.toPrecision(k)).replace('.', ',')}.`; return; }
    }
    if (dv <= 0.025) { row.classList.add('warn'); out.innerHTML = `≈ Близко: расхождение ${pc(dv)} (утилита: ${fnum(v, 5)}). Обычно так бывает при сильном округлении промежуточных величин.`; return; }
    const entered = Object.entries(CHKIDX).filter(([k, x]) => k !== ck && x.tab === c.tab && CHK.vals[chkKey(k)] !== undefined && CHK.vals[chkKey(k)] !== '');
    const prev = entered.filter(([k, x]) => x.order < c.order && relDev(+CHK.vals[chkKey(k)], x.val) > 0.025);
    row.classList.add('bad');
    out.innerHTML = `✗ Расхождение ${pc(dv)} (утилита: ${fnum(v, 5)}). ` + (prev.length
      ? `Возможно, это следствие расхождения выше: ${prev.map(([, x]) => tex(x.lhs, false)).join(', ')}. Начните сверку с первого несовпадающего значения.`
      : 'Предыдущие значения совпадают — вероятна арифметическая ошибка в этой формуле. Сверьте подстановку чисел с формулой выше.');
  }
  function chkSummary() {
    const box = $('#chk-sum'); if (!box) return;
    const rows = $$('.chk-row'), n = rows.filter(r => CHK.vals[chkKey(r.dataset.ck)] !== undefined && CHK.vals[chkKey(r.dataset.ck)] !== '').length;
    const ok = rows.filter(r => r.classList.contains('ok')).length, w = rows.filter(r => r.classList.contains('warn')).length, b = rows.filter(r => r.classList.contains('bad')).length;
    box.innerHTML = n ? `Сверено: ${n} из ${rows.length} · <b class="c-ok">✓ ${ok}</b> · <b class="c-warn">≈ ${w}</b> · <b class="c-bad">✗ ${b}</b>` : 'Впишите свои значения в поля под формулами — утилита сравнит их и подскажет возможную причину расхождения.';
  }
  function bindChk(root) {
    const swc = $('#chk-on', root);
    if (swc) swc.onchange = () => { CHK.on = swc.checked; saveChk(); const y = window.scrollY; renderTab(); window.scrollTo(0, y); };
    const clr = $('#chk-clr', root);
    if (clr) clr.onclick = () => { const pre = S.P.variant + '|' + S.tab + '|'; Object.keys(CHK.vals).forEach(k => { if (k.startsWith(pre)) delete CHK.vals[k]; }); saveChk(); const y = window.scrollY; renderTab(); window.scrollTo(0, y); };
    if (!CHK.on) return;
    const rows = $$('.chk-row', root);
    rows.forEach(row => {
      const inp = $('input', row);
      inp.addEventListener('change', () => {
        const t = inp.value.trim().replace(/\s/g, '').replace(',', '.');
        const k = chkKey(row.dataset.ck);
        if (t === '') delete CHK.vals[k]; else CHK.vals[k] = t;
        saveChk(); verdict(row.dataset.ck, row);
        rows.filter(r => CHKIDX[r.dataset.ck].order > CHKIDX[row.dataset.ck].order && CHK.vals[chkKey(r.dataset.ck)] !== undefined).forEach(r => verdict(r.dataset.ck, r));
        chkSummary();
      });
    });
    rows.forEach(r => { if (CHK.vals[chkKey(r.dataset.ck)] !== undefined) verdict(r.dataset.ck, r); });
    chkSummary();
  }
  function mathml(src) {
    let h = katex.renderToString(texify(src), { displayMode: true, output: 'mathml', throwOnError: false, strict: 'ignore' });
    const a = h.indexOf('<math'), b = h.lastIndexOf('</math>');
    h = h.slice(a, b + 7);
    h = h.replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<\/?semantics>/g, '');
    h = h.replace(/^<math[^>]*>/, '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">');
    h = h.replace(/<mi>([Ͱ-Ͽ])<\/mi>/g, '<mi mathvariant="normal">$1</mi>');
    return h;
  }
  function bindCalc(root) {
    $$('[data-mml]', root).forEach(b => b.onclick = () => copyText(mathml(CALC[b.dataset.mml]), 'Формула скопирована — вставьте в Word (Ctrl+V)'));
    $$('[data-tex]', root).forEach(b => b.onclick = () => copyText(texify(CALC[b.dataset.tex]), 'LaTeX скопирован'));
  }

  function renderLab(main, tab) {
    const R = S.R, no = stNo(tab);
    const rep = R['L' + no];
    main.innerHTML = `<article class="sheet">
      <header class="sheet-head"><div><div class="eyebrow">Задача 1.${TK()} · этап ${no}</div><h1>${esc(title(tab))}</h1><p class="lead">${leadText(tab)}</p></div>${stamp(no)}</header>
      <div class="sheet-body rep"><div class="kpis">${kpis(tab)}</div><p class="calc-hint">${ICON_COPY} у каждой формулы копирует её в формате MathML — в Word вставляется как редактируемое уравнение (Ctrl+V). Кнопка «TeX» копирует LaTeX.</p>
        <div class="opts chk-bar"><div class="opt"><div class="opt-t"><b>Сверка с ручным расчётом</b><span id="chk-sum">${CHK.on ? '' : 'Под каждой формулой появится поле для вашего значения: утилита сравнит его и подскажет возможную причину расхождения — округление, единицы, знак или ошибка в подстановке.'}</span></div><div class="opt-c" style="display:flex;gap:10px;align-items:center">${CHK.on ? '<button class="btn" id="chk-clr">Очистить</button>' : ''}<label class="sw"><input type="checkbox" id="chk-on" ${CHK.on ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="sr">Сверка</span></label></div>${CHK.on || !window.SUITE || !SUITE.chkEx ? '' : (S.R && S.R.o && S.R.o.f ? SUITE.chkEx('f = 10³W²D/(H²ΔT) = ' + fk(S.R.o.f, 2), fk(S.R.o.f, 2)) : SUITE.chkEx('C<sub>max</sub> = AMFmn/(H²∛(V<sub>i</sub>ΔT))', '…'))}</div></div>
        ${renderItems(rep.items, tab)}
        ${tab === 's3' ? `<h2>Вывод</h2>${REPORT.conclusions(R, L).map(t => `<p>${t}</p>`).join('')}<div class="dact"><button class="btn primary" data-docx="1">${dlIcon()} Отчёт Word (.docx)</button></div>` : ''}
        <div style="display:flex;justify-content:space-between;gap:8px;margin-top:22px;flex-wrap:wrap">${no > 1 ? `<button class="btn" data-go="s${no - 1}">← Этап ${no - 1}</button>` : '<button class="btn" data-go="data">← Исходные данные</button>'}${no < 3 ? `<button class="btn" data-go="s${no + 1}">Этап ${no + 1} →</button>` : '<button class="btn" data-go="all">Сводка по вариантам →</button>'}</div>
      </div></article>`;
    $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    $$('#main [data-docx]').forEach(b => b.onclick = () => makeDocx(b));
    bindCalc(main);
    bindChk(main);
    drawTab(tab);
  }
  function leadText(tab) {
    if (SP()) return SP().lead[tab];
    if (TK() === 2) return {
      s1: 'Разность температур, тип выброса по параметру f, объём пылевоздушной смеси и безразмерный коэффициент n, учитывающий условия выхода смеси из устья трубы.',
      s2: 'Наибольшая приземная концентрация пыли при неблагоприятных условиях рассеивания, расстояние до точки максимума и сравнение с ПДК с учётом фона.',
      s3: 'Предельно допустимый выброс пыли, сравнение с фактическим выбросом и обоснование необходимости установки аппарата пылеулавливания.'
    }[tab];
    return {
      s1: 'Разность температур, тип выброса по параметру f, объём газовоздушной смеси и безразмерные коэффициенты m и n, учитывающие условия выхода смеси из устья трубы.',
      s2: 'Наибольшие приземные концентрации CO, NO₂, SO₂ и пыли при неблагоприятных условиях рассеивания, расстояние до точки максимума и сравнение с ПДК с учётом фона.',
      s3: 'Предельно допустимые выбросы каждого вещества, сравнение с фактическими выбросами, требуемая степень очистки и рекомендации по снижению выбросов.'
    }[tab];
  }

  /* ---------- графики ---------- */
  const PLOTS = { s2: ['prof'], s3: ['mpdv'] };
  function drawTab(tab) { for (const id of (SP() ? SP().plots : PLOTS)[tab] || []) { const el = $('#p-' + id); if (el) { try { drawById(id, el); } catch (e) { console.error(e); el.innerHTML = '<div class="plot-wait"><span>Ошибка построения: ' + esc(e.message) + '</span></div>'; } } } }
  function drawById(id, el, ex) {
    const R = S.R; ex = ex || {};
    if (SP()) return SP().draw(id, el, ex, R, CH);
    if (id === 'prof') {
      const curves = L.profile(R);
      const marks = [{ x: R.sub[0].Xmax, t: R.task === 2 ? 'X<sub>max</sub> пыли' : 'X<sub>max</sub> газов' }];
      if (R.by.dust.Xmax !== R.sub[0].Xmax) marks.push({ x: R.by.dust.Xmax, t: 'X<sub>max</sub> пыли', y: 0.1 });
      return CH.profile(el, curves, marks, ex);
    }
    if (id === 'mpdv') return CH.bars(el, R.sub.map(x => x.s.short === 'пыль' ? 'Пыль' : x.s.short), R.sub.map(x => x.M), R.sub.map(x => x.PDV), ex);
  }

  /* ---------- сводка по всем вариантам ---------- */
  function getSum() { if (!S.sum) S.sum = L.summary(keepSettings(), TK()); return S.sum; }
  const SUMCOLS2 = [
    ['№', r => r.P.variant], ['f', r => fk(r.o.f, 2)], ["V′<sub>m</sub>", r => fk(r.o.Vm, 2)], ['n', r => fk(r.o.n, 2)], ['V<sub>i</sub>, м³/с', r => fk(r.o.Vi, 2)], ['d', r => fk(r.o.d, 2)],
    ['C<sub>max</sub>, мг/м³', r => fk(r.by.dust.Cmax, r.CD)], ['C<sub>max</sub> + C<sub>ф</sub>', r => fk(r.by.dust.tot, 3)], ['X<sub>max</sub>, м', r => fk(r.by.dust.Xmax, 1)],
    ['ПДВ, г/с', r => fk(r.by.dust.PDV, 2)], ['M > ПДВ', r => r.by.dust.over ? 'да' : 'нет'], ['ε, %', r => r.by.dust.over ? fk(r.by.dust.eps, 1) : '—']
  ];
  const SUMCOLS1 = [
    ['№', r => r.P.variant], ['f', r => fk(r.o.f, 2)], ['m', r => r.o.hot ? fk(r.o.m, 2) : '—'], ['V<sub>m</sub>', r => fk(r.o.Vm, 2)], ['n', r => fk(r.o.n, 2)], ['d', r => fk(r.o.d, 2)],
    ['C<sub>max</sub> CO', r => fk(r.by.co.Cmax, 5)], ['C<sub>max</sub> NO₂', r => fk(r.by.no2.Cmax, 5)], ['C<sub>max</sub> SO₂', r => fk(r.by.so2.Cmax, 5)], ['C<sub>max</sub> пыли', r => fk(r.by.dust.Cmax, 5)],
    ['X<sub>max</sub> газ / пыль, м', r => fk(r.sub[0].Xmax, 1) + ' / ' + fk(r.by.dust.Xmax, 1)],
    ['ПДВ CO', r => fk(r.by.co.PDV, 2)], ['ПДВ NO₂', r => fk(r.by.no2.PDV, 2)], ['ПДВ SO₂', r => fk(r.by.so2.PDV, 2)], ['ПДВ пыли', r => fk(r.by.dust.PDV, 2)],
    ['Превышение ПДК', r => r.excList.map(x => x.s.short).join(', ') || '—'], ['ε, %', r => r.overList.map(x => x.s.short + ' ' + fk(x.eps, 1)).join('; ') || '—']
  ];
  const SC = () => SP() ? SP().sumCols : TK() === 2 ? SUMCOLS2 : SUMCOLS1;
  function renderAll(main) {
    const list = getSum();
    const r0 = list.find(s => s.R); if (r0) L.use(r0.R);
    const rows = list.map(s => s.err ? `<tr><td class="num">${s.no}</td><td colspan="${SC().length - 1}">${esc(s.err)}</td></tr>` : `<tr data-v="${s.no}" class="${s.no === S.P.variant ? 'on' : ''}">${SC().map(c => `<td class="num">${c[1](s.R)}</td>`).join('')}</tr>`).join('');
    main.innerHTML = `<article class="sheet">
      <header class="sheet-head"><div><div class="eyebrow">Для преподавателя и тьютора</div><h1>${TITLES.all}</h1><p class="lead">Ответы задачи 1.${TK()} по всем ${NVf()} вариантам табл. ${TBL()} при текущих настройках методики (${S.P.mode === 'exact' ? 'точный расчёт' : 'округление как в методичке'}${SP() ? '' : ', фон и ПДК — как на вкладке «Исходные данные»'}). Щелчок по строке открывает вариант.${TK() <= 3 ? ' C<sub>max</sub> — мг/м³, ПДВ — г/с.' : ''}</p></div>${stamp('all')}</header>
      <div class="sheet-body rep">
        <h2>Ответы по вариантам</h2>
        <div class="tbl var-table sum-table"><table><thead><tr>${SC().map(c => `<th class="num">${c[0]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
        <div class="dact"><button class="btn primary" id="sum-csv">${dlIcon()} Сводка (.csv для Excel)</button><button class="btn" id="sum-copy">Копировать таблицу</button><button class="btn" id="all-docx" title="Отладка: отчёты Word по всем вариантам с текущими настройками">${dlIcon()} Все отчёты (.zip)</button></div>
        <p class="dhint">CSV — с разделителем «;» и десятичной запятой: открывается в Excel двойным щелчком. «Копировать таблицу» — для вставки в Word или Excel.</p>
        <h2>Статистика</h2>
        <p>${statLine(list)}</p>
      </div></article>`;
    $$('.sum-table tr[data-v]').forEach(tr => tr.onclick = () => { setVariant(+tr.dataset.v); go('s1'); });
    $('#sum-csv').onclick = () => downloadText('Svodka_zad1' + TK() + '_vse_varianty.csv', '﻿' + sumCsv());
    $('#sum-copy').onclick = () => copyText(sumTsv(), 'Таблица скопирована — вставьте в Word или Excel');
    $('#all-docx').onclick = e => allReports(e.currentTarget);
  }
  /* отладка: отчёты Word по всем вариантам (текущие настройки методики и отчёта) */
  async function allReports(btn) {
    const old = btn.innerHTML, saveP = S.P, saveR = S.R, keep = {};
    Object.assign(keep, keepSettings());
    btn.disabled = true;
    const zip = new JSZip(), log = [];
    try {
      for (const v of VL()) {
        btn.innerHTML = '<span class="spinner"></span> Вариант ' + v.no + ' / ' + VMAXf();
        try {
          S.P = Object.assign(L.fromVariant(v.no, TK()), keep); S.R = L.compute(S.P);
          const t0 = performance.now();
          zip.file('Otchet_zad1' + TK() + '_var' + v.no + '.docx', await buildDocxBlob());
          log.push(`Вариант ${v.no}: OK (${Math.round(performance.now() - t0)} мс) · ` + (SP() ? SP().logLine(S.R) : `${S.R.o.hot ? 'нагретый' : 'холодный'}, f = ${fk(S.R.o.f, 2)}, превышение ПДК: ${S.R.excList.map(x => x.s.short).join(', ') || 'нет'}`));
        } catch (e) { console.error(e); log.push(`Вариант ${v.no}: ОШИБКА — ${e.message}`); }
        await sleep(10);
      }
    } finally { S.P = saveP; S.R = saveR; L.use(S.R); }
    zip.file('log.txt', '\ufeff' + log.join('\r\n') + '\r\n');
    zip.file('Svodka_vse_varianty.csv', '\ufeff' + sumCsv());
    btn.innerHTML = '<span class="spinner"></span> Упаковка…';
    downloadBlob('Otchety_zad1' + TK() + '_vse_varianty.zip', await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }));
    const bad = log.filter(l => /ОШИБКА/.test(l)).length;
    toast(bad ? 'Готово, ошибок: ' + bad + ' — см. log.txt в архиве' : 'Готово: ' + log.length + ' отчётов');
    btn.disabled = false; btn.innerHTML = old;
  }
  function statLine(list) {
    if (SP()) return SP().stat(list);
    const ok = list.filter(s => s.R);
    const cnt = key => ok.filter(s => s.R.by[key] && s.R.by[key].exceed).length;
    if (TK() === 2) return `Превышение ПДК по пыли — в ${cnt('dust')} вариантах из ${ok.length}; аппарат пылеулавливания нужен в ${ok.filter(s => s.R.by.dust.over).length} вариантах. Холодных выбросов (f ≥ 100) — ${ok.filter(s => !s.R.o.hot).length}.`;
    const clean = ok.filter(s => !s.R.excList.length).length;
    return `Превышение ПДК по пыли — в ${cnt('dust')} вариантах из ${ok.length}, по SO₂ — в ${cnt('so2')}, по NO₂ — в ${cnt('no2')}, по CO — в ${cnt('co')}. Без превышений — ${clean} ${clean === 1 ? 'вариант' : clean >= 2 && clean <= 4 ? 'варианта' : 'вариантов'}. Холодных выбросов (f ≥ 100) — ${ok.filter(s => !s.R.o.hot).length}.`;
  }
  const plain = h => String(h).replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<[^>]+>/g, '');
  function sumCsv() {
    const r0 = getSum().find(s => s.R); if (r0) L.use(r0.R);
    const head = SC().map(c => plain(c[0]));
    return [head.join(';')].concat(getSum().filter(s => s.R).map(s => SC().map(c => String(c[1](s.R)).replace(/−/g, '-')).join(';'))).join('\r\n');
  }
  function sumTsv() { return [SC().map(c => plain(c[0])).join('\t')].concat(getSum().filter(s => s.R).map(s => SC().map(c => c[1](s.R)).join('\t'))).join('\n'); }

  /* ---------------- общие функции ---------------- */
  function dlIcon() { return '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v9m0 0L4.5 6.5M8 10l3.5-3.5M2 12v2.5h12V12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function copyText(t, msg) {
    const done = () => toast(msg || 'Скопировано в буфер обмена');
    try { navigator.clipboard.writeText(t).then(done, () => fallbackCopy(t, done)); } catch (e) { fallbackCopy(t, done); }
  }
  function fallbackCopy(t, done) {
    const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать — выделите текст вручную'); }
    ta.remove();
  }
  function downloadBlob(name, blob) {
    if (window.SUITE && SUITE.save) return SUITE.save(name, blob);   // общий механизм (suite.js): сайт или артефакт claude.ai
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function downloadText(name, text) { downloadBlob(name, new Blob([text], { type: 'text/plain;charset=utf-8' })); toast('Файл ' + name + ' сохранён'); }

  /* ---------- отчёт Word ---------- */
  const PNG_H = { prof: 420, mpdv: 380 };
  async function plotPng(id) {
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-12000px;top:0;width:900px;';
    document.body.appendChild(host);
    const h = PNG_H[id] || 380;
    try {
      await drawById(id, host, { export: true, h });
      const url = await Plotly.toImage(host, { format: 'png', width: 900, height: h, scale: 2 });
      return { data: url.split(',')[1], w: 900, h };
    } finally { try { Plotly.purge(host); } catch (e) { /* ignore */ } host.remove(); }
  }
  function omml(src, inline, size) {
    const h = katex.renderToString(texify(src), { displayMode: !inline, output: 'mathml', throwOnError: false, strict: 'ignore' });
    const a = h.indexOf('<math'), b = h.lastIndexOf('</math>');
    const mm = h.slice(a, b + 7).replace(/^<math[^>]*>/, '<math xmlns="http://www.w3.org/1998/Math/MathML">');
    return OMML.convert(mm, { size: size || 28 });
  }
  function plotIds() { const ids = []; for (const k of [1, 2, 3]) for (const it of S.R['L' + k].items) if (it.k === 'plot') ids.push(it.id); return ids; }
  async function buildDocxBlob(prog) {
    if (S.err) throw S.err;
    L.use(S.R);
    const png = {};
    if (S.T.content === 'ext') {
      const ids = plotIds();
      for (let k = 0; k < ids.length; k++) { prog && prog('Рисунки ' + (k + 1) + '/' + ids.length); png[ids[k]] = await plotPng(ids[k]); await sleep(5); }
    }
    prog && prog('Сборка документа…');
    const meas = document.createElement('div'); meas.style.cssText = 'position:absolute;left:-20000px;top:0;visibility:hidden;white-space:nowrap;font-size:18.67px';
    document.body.appendChild(meas);
    const measure = t => { meas.innerHTML = katex.renderToString(texify(t), { displayMode: true, throwOnError: false, strict: 'ignore' }); const k = meas.querySelector('.katex'); return k ? k.getBoundingClientRect().width : 0; };
    const ctx = { S, L, omml, png, measure };
    try { return await REPORT.build(ctx, S.T, { explain: S.T.explain, readable: S.T.readable, ext: S.T.content === 'ext', compact: !!S.T.compact, eqNum: S.T.eqNum !== false }); } finally { meas.remove(); }
  }
  function docxName() { return 'Otchet_zad1' + TK() + '_var' + S.P.variant + '.docx'; }
  async function makeDocx(btn) {
    const old = btn.innerHTML; btn.disabled = true;
    try {
      const blob = await buildDocxBlob(t => { btn.innerHTML = '<span class="spinner"></span>' + t; });
      downloadBlob(docxName(), blob);
      toast('Отчёт ' + docxName() + ' сформирован');
    } catch (e) { console.error(e); toast('Ошибка формирования отчёта: ' + e.message); }
    btn.disabled = false; btn.innerHTML = old;
  }
  window.__docxTest = () => buildDocxBlob().then(b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result.split(',')[1]); f.readAsDataURL(b); }));

  /* ---------- архив ---------- */
  function resultsCsv() {
    if (SP()) return '\ufeff' + SP().csv(S.R);
    const R = S.R, P = S.P, o = R.o, num = x => String(x).replace('.', ',');
    const lines = ['Вариант;' + P.variant, 'Тип выброса;' + (o.hot ? 'нагретый' : 'холодный'), 'dT, °C;' + num(o.dT), 'f;' + num(o.f), 'Vi, м3/с;' + num(o.Vi), 'm;' + num(o.m), 'Vm, м/с;' + num(o.Vm), 'n;' + num(o.n), 'd;' + num(o.d), '',
      'Вещество;M, г/с;F;Cmax, мг/м3;Cф, мг/м3;Cmax+Cф, мг/м3;ПДК, мг/м3;Превышение ПДК;Xmax, м;ПДВ, г/с;M>ПДВ;ε, %'];
    R.sub.forEach(x => lines.push([x.s.name, x.M, x.F, +x.Cmax.toPrecision(6), x.Cf, +x.tot.toPrecision(6), x.PDK, x.exceed ? 'да' : 'нет', x.Xmax, x.PDV, x.over ? 'да' : 'нет', x.eps].map(num).join(';')));
    return '﻿' + lines.join('\r\n');
  }
  function profileCsv() {
    const c = L.profile(S.R, 200);
    return '﻿x, м;' + c.map(k => '(C+Cф)/ПДК ' + k.name).join(';') + '\r\n' + c[0].x.map((x, i) => [x.toFixed(1)].concat(c.map(k => k.y[i].toFixed(5))).join(';').replace(/\./g, ',')).join('\r\n');
  }
  async function zipAll(btn) {
    if (S.err) { toast('Сначала исправьте исходные данные'); return; }
    btn.disabled = true; const old = btn.innerHTML;
    const prog = t => { btn.innerHTML = '<span class="spinner"></span>' + t; };
    try {
      const zip = new JSZip(), root = 'Zadacha1' + TK() + '_Variant_' + S.P.variant + '/';
      const ids = plotIds(), imgs = {};
      for (let k = 0; k < ids.length; k++) { prog(' Графики ' + (k + 1) + '/' + ids.length); const im = await plotPng(ids[k]); imgs[ids[k]] = im; zip.file(root + 'Report/img/' + ids[k] + '.png', im.data, { base64: true }); }
      zip.file(root + 'Report/report.html', reportHtml(Object.keys(imgs)));
      zip.file(root + 'Report/data/rezultaty.csv', resultsCsv());
      if (S.P.prof && TK() <= 2) zip.file(root + 'Report/data/profil_koncentraciy.csv', profileCsv());
      zip.file(root + 'Svodka_vse_varianty.csv', '﻿' + sumCsv());
      prog(' Отчёт…');
      zip.file(root + docxName(), await buildDocxBlob());
      prog(' Упаковка…');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      downloadBlob('Zadacha1' + TK() + '_Variant_' + S.P.variant + '.zip', blob);
      toast('Архив сформирован');
    } catch (e) { console.error(e); toast('Ошибка экспорта: ' + e.message); }
    btn.disabled = false; btn.innerHTML = old;
  }
  function reportHtml(imgs) {
    const parts = [], R = S.R, P = S.P;
    STAGES.forEach((tab, i) => {
      let h = `<section><h1>Этап ${i + 1}. ${esc(title(tab))}</h1>`, fig = 0;
      for (const it of R['L' + (i + 1)].items) {
        if (it.k === 'plot') { fig++; h += imgs.includes(it.id) ? `<figure><img src="img/${it.id}.png" alt=""><figcaption>Рис. ${i + 1}.${fig}. ${esc(it.title)}</figcaption></figure>` : ''; }
        else h += renderItems([it], tab);
      }
      parts.push(h + '</section>');
    });
    parts.push(`<section><h1>Вывод</h1>${REPORT.conclusions(R, L).map(t => `<p>${t}</p>`).join('')}</section>`);
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Задача 1.${TK()}, вариант ${P.variant}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>body{font:15px/1.5 "IBM Plex Sans","Segoe UI",Arial,sans-serif;color:#1a222b;max-width:1000px;margin:0 auto;padding:24px}
h1{font-size:22px;border-bottom:2px solid #1a222b;padding-bottom:6px;margin-top:48px}h2{font-size:17px;margin-top:26px}
table{border-collapse:collapse;margin:10px 0;font-size:13px}td,th{border:1px solid #aab4bf;padding:4px 8px;text-align:left}caption{text-align:left;font-weight:600;padding:4px 0}
.katex-display{text-align:left;margin:4px 0}.katex-display>.katex{text-align:left}
.check{padding:6px 10px;border:1px solid #9cc7ab;background:#eef8f1;margin:6px 0}.check.bad{border-color:#e0a49d;background:#fbeceb}.mark{font-weight:700;margin-right:8px}
.note{padding:6px 10px;border-left:3px solid #5b7a12;background:#eef3e1;margin:8px 0}.note.warn{border-color:#9a6512;background:#fbf4e6}
figure{margin:14px 0}figure img{max-width:100%;border:1px solid #ccd4dd}figcaption{font-size:13px;color:#5a6776}
.calc{border:1.5px dashed #a9b4c0;background:#f3f5f8;padding:6px 12px;margin:8px 0;border-radius:6px}.calc-math{overflow-x:auto}.calc-tools{display:none}.calc-desc{font-size:13px;color:#5a6776;border-top:1px dashed #ccd4dd;padding-top:4px}
@media print{h1{page-break-before:always}section:first-child h1{page-break-before:avoid}}</style></head><body>
<p><b>Задача 1.${TK()}, вариант ${P.variant}</b> · ${SP() ? esc(SP().headLine(P)) : `${['Mco', 'Mno2', 'Mso2', 'Mdust'].map(k => k.replace('M', 'M_') + ' = ' + fin(P[k]) + ' г/с').join(', ')}; H = ${fin(P.H)} м, D = ${fin(P.D)} м, W = ${fin(P.W)} м/с, Tг = ${fin(P.Tg)} °C, Tв = ${fin(P.Tv)} °C, A = ${fin(P.A)}`}</p>
${parts.join('\n')}</body></html>`;
  }

  /* ---------------- прочее ---------------- */
  let toastT = null;
  function toast(t) {
    let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2800);
  }
  function go(tab) { S.tab = tab; S.skipAuto = true; save(); setHash(); renderTab(); window.scrollTo({ top: 0 }); }
  function themeToggle() {
    const r = document.documentElement;
    const cur = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark';
    r.setAttribute('data-theme', nx);
    try { localStorage.setItem('suite-theme', nx); } catch (e) { /* ignore */ }
    if (S.tab !== 'data') renderTab();
  }

  function renderRail() {
    S.railTask = S.P ? TK() : 1;
    $('#rail').innerHTML = railMeta().map(m => `<a href="#" data-tab="${m.id}"><span class="no" data-short="${m.short}">${m.no}</span><span class="t">${m.t}</span><span class="s">${m.s}</span></a>`).join('') + '<div class="rail-foot" id="rail-foot"></div>';
    $$('nav.rail a').forEach(a => a.onclick = e => { e.preventDefault(); go(a.dataset.tab); });
    $$('nav.rail a').forEach(a => a.setAttribute('aria-current', a.dataset.tab === S.tab ? 'page' : 'false'));
  }
  function init() {
    renderRail();
    $('#var-sel').onchange = e => setVariant(+e.target.value);
    $('#task-sel').onchange = e => setTask(+e.target.value);
    $('#var-prev').onclick = () => setVariant(S.P.variant - 1);
    $('#var-next').onclick = () => setVariant(S.P.variant + 1);
    $('#share').onclick = share;
    $('#theme').onclick = themeToggle;
    window.addEventListener('suite:style', () => { if (S.tab !== 'data') renderTab(); });   // новый стиль — перерисовать графики в его цветах и шрифтах
    const setTopH = () => document.documentElement.style.setProperty('--top-h', $('.top').offsetHeight + 'px');
    window.addEventListener('resize', setTopH); setTopH();
    load(); loadT();
    const au = getAuto();
    if (S.shared) { S.skipAuto = true; recompute(); toast('Открыт расчёт по ссылке'); }
    else if (au && au.P && !/^#(?:t\d)?v\d/.test(location.hash || '')) {   // ссылка с вариантом открывается сразу, без вопроса об автосохранении
      S.P = L.fromVariant(1, 1); S.T = Object.assign({}, T_DEF); S.tab = 'data';
      S.skipAuto = true; recompute();
      askResume(au);
    } else { S.skipAuto = true; recompute(); }
  }
  function askResume(au) {
    const d = document.createElement('div');
    d.className = 'modal-back';
    d.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="rs-t"><h2 id="rs-t">Продолжить с того места?</h2>
      <p>Найдено автосохранение:</p><div class="modal-card"><b>${au.T && au.T.student ? esc(au.T.student) : 'Последняя работа'}</b><span>${slotMeta(au)}</span></div>
      <p class="dhint">«Начать заново» сбросит параметры и настройки к значениям по умолчанию. Автосохранение при этом не удаляется — к нему можно вернуться в разделе «Сохранения», пока вы не начнёте вносить изменения.</p>
      <div class="modal-act"><button class="btn" id="rs-new">Начать заново</button><button class="btn primary" id="rs-go">Продолжить</button></div></div>`;
    document.body.appendChild(d);
    const close = () => d.remove();
    $('#rs-go', d).onclick = () => {
      S.P = Object.assign(L.defaults(), au.P); S.T = Object.assign({}, T_DEF, au.T || {});
      if (au.tab) S.tab = au.tab;
      S.skipAuto = true; saveT(); S.skipAuto = true; close(); recompute();
    };
    $('#rs-new', d).onclick = () => { S.skipAuto = true; saveT(); close(); toast('Начато заново'); };
    setTimeout(() => $('#rs-go', d).focus(), 30);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
