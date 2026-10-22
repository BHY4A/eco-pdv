/* =====================================================================
 * labs.js — расчёт рассеивания и нормативов ПДВ вредных веществ
 * в атмосферу (задача 1.1 учебного пособия «Промышленная экология»,
 * часть 1 «Атмосфера и её загрязнение», разд. 1.1, формулы 1.1–1.28).
 * ===================================================================== */
(function (root) {
  'use strict';
  const D = root.LABDATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const SUB = D.substances;

  /* ---------- режим округления ----------
   * book  — промежуточные величины округляются, как в примере решения (π = 3,14; f, Vi, m, Vm, n, d — до 0,01; X — до 0,1; ПДВ — до 0,01)
   * exact — без округления, вывод 4 значащих цифр */
  let BOOK = true;
  const rd = (x, k) => BOOK && isFinite(x) ? Math.round(x * Math.pow(10, k)) / Math.pow(10, k) : x;

  /* ---------- форматирование ---------- */
  function fauto(x, sig) {
    sig = sig || 4;
    if (x === null || x === undefined || isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax >= 1e6 || ax < 1e-4) {
      const e = Math.floor(Math.log10(ax));
      return parseFloat((x / Math.pow(10, e)).toPrecision(sig)).toString().replace('.', ',') + '·10^' + e;
    }
    const d = Math.floor(Math.log10(ax)) + 1;
    const s = d >= sig ? String(Math.round(x)) : parseFloat(x.toPrecision(sig)).toString();
    return s.replace('.', ',').replace('-', '−');
  }
  /* число с k знаками после запятой (в режиме «как в методичке») или 4 значащими */
  function fk(x, k) {
    if (x === null || x === undefined || isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (!BOOK) return fauto(x);
    return parseFloat(x.toFixed(k)).toString().replace('.', ',').replace('-', '−');
  }
  const fnum = (x, sig) => fauto(x, sig);
  /* исходное значение как в таблице */
  const fin = x => String(x).replace('.', ',');
  function tx(s) {
    s = String(s);
    if (s.indexOf('·10^') >= 0) { const [mm, e] = s.split('·10^'); return mm.replace(',', '{,}').replace('−', '-') + '\\cdot 10^{' + e + '}'; }
    return s.replace(',', '{,}').replace('−', '-');
  }
  const nk = (x, k) => tx(fk(x, k));
  const n0 = x => tx(fin(x));
  const n = (x, sig) => tx(fauto(x, sig));

  /* ---------- построитель отчёта (как в остальных утилитах) ---------- */
  function Report() { this.items = []; this.x = false; }
  /* разделы сверх задания (в отчёт попадают только в режиме «расширенный») */
  Report.prototype.ext = function (on) { this.x = on; return this; };
  Report.prototype._push = Report.prototype.push = function (o) { if (this.x) o.ext = true; this.items.push(o); return this; };
  Report.prototype.h = function (t) { return this.push({ k: 'h', t }); };
  Report.prototype.p = function (t) { return this.push({ k: 'p', t }); };
  Report.prototype.note = function (t, kind) { return this.push({ k: 'note', t, kind: kind || 'info' }); };
  /* eq: lhs = формула = подстановка = значение; vs — готовая запись значения в TeX */
  Report.prototype.eq = function (lhs, formula, subst, val, unit, vs, key) { return this.push({ k: 'eq', lhs, formula, subst, val, unit: unit || '', vs, key: key || lhs }); };
  Report.prototype.tex = function (t, desc) { return this.push({ k: 'tex', t, desc }); };
  Report.prototype.check = function (tex, ok, text) { return this.push({ k: 'check', tex, ok, t: text }); };
  Report.prototype.table = function (head, rows, caption, opt) { return this.push(Object.assign({ k: 'table', head, rows, caption }, opt || {})); };
  Report.prototype.plot = function (id, title) { return this.push({ k: 'plot', id, title }); };
  Report.prototype.webOnly = function () { this.items[this.items.length - 1].web = true; return this; };
  Report.prototype.repOnly = function () { this.items[this.items.length - 1].repOnly = true; return this; };
  Report.prototype.rep = function (t) { this.items[this.items.length - 1].rep = t; return this; };

  /* ---------- исходные данные ---------- */
  const VKEYS1 = ['Mco', 'Mno2', 'Mso2', 'Mdust', 'H', 'D', 'W', 'Tg', 'Tv', 'A'];
  const VKEYS2 = ['Mdust', 'cf_dust', 'H', 'D', 'W', 'Tg', 'Tv', 'A'];
  const VKEYS = VKEYS1;
  /* задачи 1.3–1.8 описаны в tasks.js (реестр ECOTASKS) */
  const TX = task => +task >= 3 && root.ECOTASKS ? root.ECOTASKS[+task] : null;
  const vkeys = task => TX(task) ? TX(task).vkeys : +task === 2 ? VKEYS2 : VKEYS1;
  const vlist = task => TX(task) ? TX(task).variants : +task === 2 ? D.variants2 : D.variants;
  const nkeys = task => TX(task) ? (TX(task).nkeys || []) : NKEYS;
  const NKEYS = ['eta', 'Fg', 'Fd'].concat(...SUB.map(s => ['cf_' + s.key, 'pdk_' + s.key]));
  function defaults() {
    const v = D.variants[0];
    const d = { variant: 1, task: 1 };
    VKEYS.forEach(k => d[k] = v[k]);
    d.eta = 1; d.Fg = 1; d.Fd = 3;
    SUB.forEach(s => { d['cf_' + s.key] = s.Cf; d['pdk_' + s.key] = s.PDK; });
    return Object.assign(d, { mode: 'book', sumEff: false, hmin: false, prof: false });
  }
  function fromVariant(no, task) {
    task = TX(task) ? +task : +task === 2 ? 2 : 1;
    const L = vlist(task), v = L.find(x => x.no === +no) || L[0];
    const d = defaults();
    if (TX(task)) Object.assign(d, TX(task).defaults || {});
    d.task = task; d.variant = v.no; vkeys(task).forEach(k => d[k] = v[k]);
    return d;
  }
  const Fof = (P, s) => s.key === 'dust' ? +P.Fd : +P.Fg;

  /* ---------- безразмерные коэффициенты и параметры источника при высоте H ---------- */
  function nCoef(v) {
    if (v >= 2) return { n: 1, eqn: '1.10' };
    if (v >= 0.5) return { n: rd(0.532 * v * v - 2.13 * v + 3.13, 2), eqn: '1.11' };
    return { n: rd(4.4 * v, 2), eqn: '1.12' };
  }
  function source(P, H, opt) {
    const pi = BOOK ? 3.14 : Math.PI;
    const dT = rd(P.Tg - P.Tv, 1);
    const f = dT > 0 ? rd(1000 * P.W * P.W * P.D / (H * H * dT), 2) : Infinity;
    const hot = f < 100;
    const Vi = rd(pi * P.D * P.D / 4 * P.W, opt && opt.vdig || 2);
    const Vm1 = rd(1.3 * P.W * P.D / H, 2);
    const o = { H, dT, f, hot, Vi, Vm1, pi };
    if (hot) {
      o.Vm = rd(0.65 * Math.cbrt(Vi * dT / H), 2);
      o.fe = rd(800 * Math.pow(Vm1, 3), 2);
      o.mf = o.fe < f ? o.fe : f;
      o.m = rd(1 / (0.67 + 0.1 * Math.sqrt(o.mf) + 0.34 * Math.cbrt(o.mf)), 2);
      o.cr = Math.cbrt(Vi * dT);
      const nn = nCoef(o.Vm); o.n = nn.n; o.neq = nn.eqn;
      if (o.Vm <= 0.5) { o.d = rd(2.48 * (1 + 0.28 * Math.cbrt(o.fe)), 2); o.deq = '1.16'; }
      else if (o.Vm <= 2) { o.d = rd(4.95 * o.Vm * (1 + 0.28 * Math.cbrt(f)), 2); o.deq = '1.17'; }
      else { o.d = rd(7 * Math.sqrt(o.Vm) * (1 + 0.28 * Math.cbrt(f)), 2); o.deq = '1.18'; }
    } else {
      o.Vm = Vm1; o.m = 1;
      const nn = nCoef(Vm1); o.n = nn.n; o.neq = nn.eqn;
      if (Vm1 <= 0.5) { o.d = 5.7; o.deq = '1.19'; }
      else if (Vm1 <= 2) { o.d = rd(11.4 * Vm1, 2); o.deq = '1.20'; }
      else { o.d = rd(16 * Math.sqrt(Vm1), 2); o.deq = '1.21'; }
      o.H43 = Math.pow(H, 4 / 3);
    }
    return o;
  }
  /* максимальная приземная концентрация, мг/м³ */
  function cmax(P, o, M, F) {
    if (o.hot) return P.A * M * F * o.m * o.n * P.eta / (o.H * o.H * o.cr);
    return P.A * M * F * o.n * P.D * P.eta / (8 * o.Vi * o.H43);
  }
  /* предельно допустимый выброс, г/с */
  function pdv(P, o, dC, F) {
    if (!(dC > 0)) return 0;
    if (o.hot) return rd(dC * o.H * o.H * o.cr / (P.A * F * o.m * o.n * P.eta), 2);
    return rd(8 * dC * o.H43 * o.Vi / (P.A * F * o.n * P.eta * P.D), 2);
  }
  /* безразмерная функция s1 = C(x)/Cmax по ОНД-86 (в пособии не приводится; для графика) */
  function s1(r, F) {
    if (r <= 0) return 0;
    if (r <= 1) return 3 * r ** 4 - 8 * r ** 3 + 6 * r * r;
    if (r <= 8) return 1.13 / (0.13 * r * r + 1);
    return F <= 1.5 ? r / (3.58 * r * r - 35.2 * r + 120) : 1 / (0.1 * r * r + 2.47 * r - 17.8);
  }
  /* наименьшая высота трубы, при которой Cmax + Cф ≤ ПДК (без округлений) */
  function hMin(P, s) {
    const saved = BOOK; BOOK = false;
    try {
      const F = Fof(P, s), M = +P[s.mk], Cf = +P['cf_' + s.key], PDK = +P['pdk_' + s.key];
      if (!(PDK - Cf > 0)) return NaN;
      const g = H => cmax(P, source(P, H), M, F) + Cf - PDK;
      if (g(+P.H) <= 0) return null;
      let lo = +P.H, hi = lo;
      while (g(hi) > 0) { lo = hi; hi *= 1.05; if (hi > 5000) return Infinity; }
      for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; }
      return hi;
    } finally { BOOK = saved; }
  }
  /* граница зоны, где C + Cф > ПДК (по распределению ОНД-86), м */
  function zone(P, sub) {
    if (sub.Cmax + sub.Cf <= sub.PDK) return null;
    if (sub.Cf >= sub.PDK) return Infinity;
    const r0 = (sub.PDK - sub.Cf) / sub.Cmax;
    let x1 = 0, x2 = 0, r = 0.001;
    for (; r < 1; r += 0.001) if (sub.Cmax * s1(r, sub.F) >= r0 * sub.Cmax) { x1 = r; break; }
    for (r = 1; r < 400; r += 0.002) if (s1(r, sub.F) < r0) { x2 = r; break; }
    return { from: x1 * sub.Xmax, to: x2 * sub.Xmax };
  }

  /* рекомендации по степени очистки от пыли */
  function dustAdvice(eps) {
    if (eps <= 80) return { app: 'циклон (одиночный или группа циклонов ЦН-15) соответствующей производительности', why: 'требуемая степень очистки до 80 % обеспечивается инерционными сухими пылеуловителями' };
    if (eps <= 95) return { app: 'батарейный циклон или мокрый пылеуловитель (скруббер Вентури)', why: 'степень очистки 80–95 % превышает возможности одиночного циклона' };
    if (eps <= 99) return { app: 'рукавный фильтр или электрофильтр', why: 'степень очистки свыше 95 % достижима только фильтрованием или электроосаждением' };
    return { app: 'двухступенчатая очистка: циклон (первая ступень) и электрофильтр или рукавный фильтр (вторая ступень)', why: 'требуемая степень очистки свыше 99 %' };
  }
  const GAS_ADVICE = {
    co: 'наладка режима горения (оптимальный коэффициент избытка воздуха, полное смешение топлива с воздухом), каталитическое дожигание CO',
    no2: 'режимные мероприятия (ступенчатое сжигание, рециркуляция дымовых газов, малотоксичные горелки), селективное каталитическое или некаталитическое восстановление оксидов азота',
    so2: 'переход на малосернистое топливо, сероочистка дымовых газов (мокрый известняковый или аммиачный способ)'
  };

  /* =================================================================
   * ГЛАВНЫЙ РАСЧЁТ
   * ================================================================= */
  function compute(P) {
    BOOK = P.mode !== 'exact';
    if (TX(P.task)) { const R = TX(P.task).compute(P); R.book = BOOK; R.task = +P.task; return R; }
    ['A', 'H', 'D', 'W', 'Tg', 'Tv', 'eta', 'Fg', 'Fd'].forEach(k => { if (!(+P[k] > 0) && k !== 'Tv') throw new Error('параметр ' + k + ' должен быть положительным'); });
    if (!(P.Tg - P.Tv > 0)) throw new Error('температура выбрасываемой смеси должна быть выше температуры воздуха');
    const T2 = +P.task === 2;
    const R = { P, book: BOOK, task: T2 ? 2 : 1 };
    const CD = T2 ? 3 : 5;                                   // знаков C_max в режиме «как в методичке»
    R.CD = CD;
    const o = source(P, +P.H);
    R.o = o;
    R.sub = (T2 ? SUB.filter(s => s.key === 'dust') : SUB).map(s => {
      const F = Fof(P, s), M = +P[s.mk], Cf = +P['cf_' + s.key], PDK = +P['pdk_' + s.key];
      const Cm = cmax(P, o, M, F), Cmd = BOOK ? rd(Cm, CD) : Cm;
      const Xmax = rd((5 - F) / 4 * o.d * o.H, 1);
      const PDV = pdv(P, o, PDK - Cf, F);
      const tot = Cmd + Cf, exceed = tot > PDK;
      const over = M > PDV;
      const eps = over ? rd((M - PDV) / M * 100, 1) : 0;
      return { s, key: s.key, F, M, Cf, PDK, Cmax: Cmd, tot, exceed, ratio: tot / PDK, Xmax, PDV, over, eps };
    });
    R.by = {}; R.sub.forEach(x => R.by[x.key] = x);
    R.sum = T2 ? { q: 0, ok: true } : (() => { const a = R.by.so2, b = R.by.no2; const q = a.tot / a.PDK + b.tot / b.PDK; return { q, ok: q <= 1 }; })();
    R.overList = R.sub.filter(x => x.over);
    R.excList = R.sub.filter(x => x.exceed);
    if (P.hmin) R.sub.forEach(x => { x.Hmin = x.exceed ? hMin(P, x.s) : null; });
    R.sub.forEach(x => { x.zone = zone(P, x); });
    R.Hreq = P.hmin ? Math.max(0, ...R.sub.map(x => x.Hmin && isFinite(x.Hmin) ? x.Hmin : 0)) : 0;

    const L1 = new Report(), L2 = new Report(), L3 = new Report();
    const sT = s => s.tex === 'пыли' ? 'пыли' : s.tex;              // верхний индекс
    const Cm = x => 'C_{\\mathrm{max}}^{' + sT(x.s) + '}';
    const hot = o.hot;

    /* ======================= ЭТАП 1. Параметры источника ======================= */
    L1.h('1.1. Исходные данные (вариант ' + P.variant + ')').webOnly();
    L1.table(['Параметр', 'Обозначение', 'Значение'], (T2 ? [
      ['Выброс пыли', 'M<sub>пыли</sub>', fin(P.Mdust) + ' г/с'], ['Фоновая концентрация пыли', 'C<sub>ф</sub><sup>пыли</sup>', fin(P.cf_dust) + ' мг/м³'],
      ['Высота трубы', 'H', fin(P.H) + ' м'], ['Диаметр устья трубы', 'D', fin(P.D) + ' м'], ['Скорость выхода смеси', 'W', fin(P.W) + ' м/с'],
      ['Температура пылевоздушной смеси', 'T<sub>п</sub>', fin(P.Tg) + ' °C'], ['Температура воздуха', 'T<sub>в</sub>', fin(P.Tv) + ' °C'],
      ['Коэффициент стратификации атмосферы', 'A', fin(P.A)], ['Коэффициент рельефа местности', 'η', fin(P.eta)], ['Коэффициент оседания пыли', 'F', fin(P.Fd)], ['Число труб', 'N', '1']
    ] : [
      ['Выброс оксида углерода', 'M<sub>CO</sub>', fin(P.Mco) + ' г/с'], ['Выброс диоксида азота', 'M<sub>NO<sub>2</sub></sub>', fin(P.Mno2) + ' г/с'],
      ['Выброс диоксида серы', 'M<sub>SO<sub>2</sub></sub>', fin(P.Mso2) + ' г/с'], ['Выброс пыли', 'M<sub>пыли</sub>', fin(P.Mdust) + ' г/с'],
      ['Высота трубы', 'H', fin(P.H) + ' м'], ['Диаметр устья трубы', 'D', fin(P.D) + ' м'], ['Скорость выхода газов', 'W', fin(P.W) + ' м/с'],
      ['Температура дымовых газов', 'T<sub>г</sub>', fin(P.Tg) + ' °C'], ['Температура воздуха', 'T<sub>в</sub>', fin(P.Tv) + ' °C'],
      ['Коэффициент стратификации атмосферы', 'A', fin(P.A)], ['Коэффициент рельефа местности', 'η', fin(P.eta)],
      ['Коэффициент оседания: газы / пыль', 'F', fin(P.Fg) + ' / ' + fin(P.Fd)], ['Число дымовых труб', 'N', '1']
    ])).webOnly();
    L1.table(['Вещество', 'C<sub>ф</sub>, мг/м³', 'ПДК, мг/м³', 'F'], R.sub.map(x => [x.s.name + (x.key === 'dust' ? '' : ' (' + x.s.html + ')'), fin(x.Cf), fin(x.PDK), fin(x.F)]), 'Фоновые концентрации и ПДК').webOnly();
    if (BOOK) L1.note('Режим «как в методичке»: π = 3,14, промежуточные величины f, V<sub>i</sub>, m, V<sub>m</sub>, n, d округляются до 0,01, расстояние X<sub>max</sub> — до 0,1 м, ПДВ — до 0,01 г/с, как в примере решения. Точный расчёт без округлений включается на вкладке «Исходные данные».').webOnly();
    L1.h('1.2. Тип выброса');
    const TG = T2 ? 'T_{п}' : 'T_{г}', MIX = T2 ? 'пылевоздушной' : 'газовоздушной';
    L1.p(`Разность температур выбрасываемой ${MIX} смеси и окружающего воздуха:`);
    L1.eq('\\Delta T', TG + '-T_{в}', `${n0(P.Tg)}-${n0(P.Tv)}`, o.dT, '°C', nk(o.dT, 1));
    L1.p('Коэффициент f, определяющий тип выброса, рассчитываем по формуле (1.6):');
    L1.eq('f', '10^3\\dfrac{W^2D}{H^2\\Delta T}', `\\dfrac{10^3\\cdot ${n0(P.W)}^2\\cdot ${n0(P.D)}}{${n0(P.H)}^2\\cdot ${nk(o.dT, 1)}}`, o.f, '', nk(o.f, 2));
    L1.check(hot ? `f=${nk(o.f, 2)}<100` : `f=${nk(o.f, 2)}\\ge 100`, true, hot
      ? 'Выбросы нагретые: расчёт ведём по формулам для нагретых выбросов (1.2), (1.4), (1.10)–(1.13), (1.16)–(1.18), (1.25).'
      : 'Выбросы холодные: расчёт ведём по формулам для холодных выбросов (1.3), (1.14), (1.19)–(1.21), (1.26).');
    L1.h(`1.3. Объём ${MIX} смеси`);
    L1.p(T2 ? 'Объём выбрасываемой пылевоздушной смеси определяем по формуле (1.9):' : 'Объём выбрасываемых дымовых газов определяем по формуле (1.9):');
    L1.eq('V_i', '\\dfrac{\\pi D^2}{4}W', `\\dfrac{${BOOK ? '3{,}14' : '\\pi'}\\cdot ${n0(P.D)}^2}{4}\\cdot ${n0(P.W)}`, o.Vi, 'м³/с', nk(o.Vi, 2));
    if (hot) {
      L1.h('1.4. Коэффициент m');
      L1.p('Для проверки условия f<sub>e</sub> < f < 100 находим параметр V′<sub>m</sub> по формуле (1.14) и параметр f<sub>e</sub> по формуле (1.7):');
      L1.eq("V'_m", '1{,}3\\dfrac{WD}{H}', `1{,}3\\cdot\\dfrac{${n0(P.W)}\\cdot ${n0(P.D)}}{${n0(P.H)}}`, o.Vm1, 'м/с', nk(o.Vm1, 2));
      L1.eq('f_e', "800\\left(V'_m\\right)^3", `800\\cdot ${nk(o.Vm1, 2)}^3`, o.fe, '', nk(o.fe, 2));
      L1.check(o.fe < o.f ? `f_e=${nk(o.fe, 2)}<f=${nk(o.f, 2)}<100` : `f_e=${nk(o.fe, 2)}\\ge f=${nk(o.f, 2)}`, true, o.fe < o.f
        ? 'Условие f<sub>e</sub> < f < 100 выполняется — коэффициент m вычисляем при f = f<sub>e</sub>.'
        : 'Условие f<sub>e</sub> < f < 100 не выполняется — коэффициент m вычисляем при фактическом значении f.');
      L1.p('Безразмерный коэффициент m, учитывающий условия выхода газовоздушной смеси из устья источника, находим по формуле (1.4):');
      L1.eq('m', '\\dfrac{1}{0{,}67+0{,}1\\sqrt{f}+0{,}34\\sqrt[3]{f}}', `\\dfrac{1}{0{,}67+0{,}1\\sqrt{${nk(o.mf, 2)}}+0{,}34\\sqrt[3]{${nk(o.mf, 2)}}}`, o.m, '', nk(o.m, 2));
      L1.h('1.5. Параметр V<sub>m</sub>');
      L1.p('Параметр V<sub>m</sub> для нагретых выбросов вычисляем по формуле (1.13):');
      L1.eq('V_m', '0{,}65\\sqrt[3]{\\dfrac{V_i\\Delta T}{H}}', `0{,}65\\sqrt[3]{\\dfrac{${nk(o.Vi, 2)}\\cdot ${nk(o.dT, 1)}}{${n0(P.H)}}}`, o.Vm, 'м/с', nk(o.Vm, 2));
    } else {
      L1.h('1.4. Параметр V′<sub>m</sub>');
      L1.p('Для холодных выбросов коэффициент m в расчёт не входит. Параметр V′<sub>m</sub> находим по формуле (1.14):');
      L1.eq("V'_m", '1{,}3\\dfrac{WD}{H}', `1{,}3\\cdot\\dfrac{${n0(P.W)}\\cdot ${n0(P.D)}}{${n0(P.H)}}`, o.Vm1, 'м/с', nk(o.Vm1, 2));
    }
    L1.h((hot ? '1.6' : '1.5') + '. Коэффициент n');
    const vn = hot ? 'V_m' : "V'_m", vv = nk(o.Vm, 2);
    if (o.neq === '1.10') L1.check(`${vn}=${vv}\\ge 2`, true, 'Следовательно, n = 1 (формула (1.10)).').rep(`Поскольку ${hot ? 'V<sub>m</sub>' : 'V′<sub>m</sub>'} = ${fk(o.Vm, 2)} ≥ 2, по формуле (1.10) коэффициент n = 1.`);
    else if (o.neq === '1.11') {
      L1.p(`Поскольку 0,5 ≤ ${hot ? 'V<sub>m</sub>' : 'V′<sub>m</sub>'} = ${fk(o.Vm, 2)} < 2, коэффициент n находим по формуле (1.11):`);
      L1.eq('n', `0{,}532${hot ? vn + '^2' : "\\left(V'_m\\right)^2"}-2{,}13${vn}+3{,}13`, `0{,}532\\cdot ${vv}^2-2{,}13\\cdot ${vv}+3{,}13`, o.n, '', nk(o.n, 2));
    } else {
      L1.p(`Поскольку ${hot ? 'V<sub>m</sub>' : 'V′<sub>m</sub>'} = ${fk(o.Vm, 2)} < 0,5, коэффициент n находим по формуле (1.12):`);
      L1.eq('n', `4{,}4${vn}`, `4{,}4\\cdot ${vv}`, o.n, '', nk(o.n, 2));
    }

    /* ======================= ЭТАП 2. Cmax и Xmax ======================= */
    L2.h('2.1. Наибольшая приземная концентрация');
    if (hot) {
      L2.p('Наибольшую ожидаемую концентрацию вредных веществ в приземном слое атмосферы при неблагоприятных условиях рассеивания определяем по формуле (1.2):');
      L2.tex('C_{\\mathrm{max}}=\\dfrac{AMFmn\\eta}{H^2\\sqrt[3]{V_i\\Delta T}}', 'cmax');
    } else {
      L2.p('Для холодных выбросов наибольшую приземную концентрацию определяем по формуле (1.3):');
      L2.tex('C_{\\mathrm{max}}=\\dfrac{AMFnD\\eta}{H\\sqrt[3]{H}\\cdot 8V_i}', 'cmaxc');
      L2.note('В формуле (1.3) пособия показатель степени у H напечатан как 3/4; в формулах (1.24) и (1.28) того же раздела — H<sup>4/3</sup>, как в ОНД-86. Расчёт выполнен с H<sup>4/3</sup>.', 'warn').webOnly();
    }
    for (const x of R.sub) {
      const subst = hot
        ? `\\dfrac{${n0(P.A)}\\cdot ${n0(x.M)}\\cdot ${n0(x.F)}\\cdot ${nk(o.m, 2)}\\cdot ${nk(o.n, 2)}\\cdot ${n0(P.eta)}}{${n0(P.H)}^2\\sqrt[3]{${nk(o.Vi, 2)}\\cdot ${nk(o.dT, 1)}}}`
        : `\\dfrac{${n0(P.A)}\\cdot ${n0(x.M)}\\cdot ${n0(x.F)}\\cdot ${nk(o.n, 2)}\\cdot ${n0(P.D)}\\cdot ${n0(P.eta)}}{${n0(P.H)}\\cdot\\sqrt[3]{${n0(P.H)}}\\cdot 8\\cdot ${nk(o.Vi, 2)}}`;
      L2.eq(Cm(x), '', subst, x.Cmax, 'мг/м³', nk(x.Cmax, CD), 'C_{\\mathrm{max}}');
    }
    if (BOOK && T2 && +P.variant === 1) L2.note('В примере пособия получено C<sub>max</sub> = 2,05 мг/м³. Подстановка тех же чисел (n = 2,06, V<sub>i</sub> = 6,44) даёт 200·4·3·2,06/(18·∛18·8·6,44) = 2,034 мг/м³ — в примере арифметическая неточность; вывод о превышении ПДК не меняется.', 'warn').webOnly();
    L2.h('2.2. Расстояние до точки максимума');
    L2.p('Расстояние X<sub>max</sub> от источника выбросов, на котором приземная концентрация при неблагоприятных метеорологических условиях достигает максимального значения C<sub>max</sub>, находим по формуле (1.15):');
    L2.tex('X_{\\mathrm{max}}=\\dfrac{5-F}{4}dH', 'xmax');
    const dDesc = { '1.16': ['V<sub>m</sub> ≤ 0,5', '2{,}48\\left(1+0{,}28\\sqrt[3]{f_e}\\right)', `2{,}48\\left(1+0{,}28\\sqrt[3]{${nk(o.fe, 2)}}\\right)`],
      '1.17': ['0,5 < V<sub>m</sub> ≤ 2', '4{,}95V_m\\left(1+0{,}28\\sqrt[3]{f}\\right)', `4{,}95\\cdot ${vv}\\left(1+0{,}28\\sqrt[3]{${nk(o.f, 2)}}\\right)`],
      '1.18': ['V<sub>m</sub> > 2', '7\\sqrt{V_m}\\left(1+0{,}28\\sqrt[3]{f}\\right)', `7\\sqrt{${vv}}\\left(1+0{,}28\\sqrt[3]{${nk(o.f, 2)}}\\right)`],
      '1.19': ['V′<sub>m</sub> ≤ 0,5', '', ''], '1.20': ['0,5 < V′<sub>m</sub> ≤ 2', "11{,}4V'_m", `11{,}4\\cdot ${vv}`], '1.21': ['V′<sub>m</sub> > 2', "16\\sqrt{V'_m}", `16\\sqrt{${vv}}`] }[o.deq];
    if (o.deq === '1.19') L2.p(`Безразмерный коэффициент d: поскольку f ≥ 100 и V′<sub>m</sub> = ${fk(o.Vm, 2)} ≤ 0,5, по формуле (1.19) d = 5,7.`);
    else {
      L2.p(`Безразмерный коэффициент d: поскольку ${dDesc[0].replace(/V(<sub>m<\/sub>|′<sub>m<\/sub>)/, (hot ? 'V<sub>m</sub>' : 'V′<sub>m</sub>') + ' = ' + fk(o.Vm, 2))}, находим d по формуле (${o.deq}):`);
      L2.eq('d', dDesc[1], dDesc[2], o.d, '', nk(o.d, 2));
    }
    if (BOOK && T2 && +P.variant === 1) L2.note('В примере пособия d = 11,4·0,59 = 6,7 округлено до 0,1, поэтому X<sub>max</sub> = 60,3 м; при d = 6,73 (округление до 0,01, как во всей утилите) X<sub>max</sub> = 60,6 м.', 'warn').webOnly();
    if (!T2 && BOOK && +P.variant === 1 && Math.abs(o.d - 14.9) < 1e-9) L2.note('В примере пособия получено d = 14,92 и X<sub>max</sub> = 447,6 м (223,8 м для пыли). Пересчёт по формуле (1.18) с теми же V<sub>m</sub> = 2,69 и f = 1,2 даёт d = 14,90, поэтому X<sub>max</sub> = 447,0 м и 223,5 м — расхождение 0,15 % из-за арифметики примера.', 'warn').webOnly();
    const fG = R.sub.filter(x => x.F === R.sub[0].F), fD = R.sub.filter(x => x.F !== R.sub[0].F);
    const xGroup = (grp, label) => {
      const x = grp[0];
      const lhs = grp.map(g => 'X_{\\mathrm{max}}^{' + sT(g.s) + '}').join('=');
      L2.eq(lhs, '', `\\dfrac{5-${n0(x.F)}}{4}\\cdot ${nk(o.d, 2)}\\cdot ${n0(P.H)}`, x.Xmax, 'м', nk(x.Xmax, 1), 'X_{\\mathrm{max}}' + label);
    };
    xGroup(fG, fG[0].F > 1 ? 'd' : 'g'); if (fD.length) xGroup(fD, 'd');
    L2.h('2.3. Сравнение с санитарно-гигиеническими нормативами');
    L2.p('Сравниваем фактическое загрязнение с учётом фоновой концентрации C<sub>max</sub> + C<sub>ф</sub> с ПДК' + (T2 ? '' : ' каждого вещества') + ':');
    if (!T2) L2.table(['Вещество', 'C<sub>max</sub>, мг/м³', 'C<sub>ф</sub>, мг/м³', 'C<sub>max</sub> + C<sub>ф</sub>, мг/м³', 'ПДК, мг/м³', 'Превышение ПДК'],
      R.sub.map(x => [x.s.name + (x.key === 'dust' ? '' : ' (' + x.s.html + ')'), fk(x.Cmax, 5), fin(x.Cf), fk(x.tot, BOOK ? 4 : 4), fin(x.PDK), x.exceed ? 'да, в ' + fauto(x.ratio, 3) + ' раза' : 'нет']),
      'Сравнение приземных концентраций с ПДК', { cols: [2300, 1350, 1150, 1600, 1150, 1800] });
    for (const x of R.sub) {
      const t = `${Cm(x)}+C_{ф}^{${sT(x.s)}}=${nk(x.Cmax, CD)}+${n0(x.Cf)}=${nk(x.tot, 4)}\\ ${x.exceed ? '>' : '\\le'}\\ ПДК^{${sT(x.s)}}=${n0(x.PDK)}`;
      L2.check(t, !x.exceed, x.exceed ? `${x.s.name} загрязняет воздушный бассейн: ПДК превышена в ${fauto(x.ratio, 3)} раза.` : `${x.s.name}: содержание в приземном слое не превышает ПДК.`);
      if (!T2) L2.webOnly();
    }
    L2.ext(true);
    if (P.sumEff && !T2) {
      L2.h('2.4. Эффект суммации');
      L2.p('Диоксид серы и диоксид азота обладают эффектом суммации вредного действия. Их максимумы (при одинаковом F) находятся в одной точке, поэтому безразмерная суммарная концентрация по формуле (1.1):');
      const a = R.by.so2, b = R.by.no2;
      L2.eq('q', '\\dfrac{C^{\\mathrm{SO_2}}}{ПДК^{\\mathrm{SO_2}}}+\\dfrac{C^{\\mathrm{NO_2}}}{ПДК^{\\mathrm{NO_2}}}', `\\dfrac{${nk(a.tot, 4)}}{${n0(a.PDK)}}+\\dfrac{${nk(b.tot, 4)}}{${n0(b.PDK)}}`, R.sum.q, '', nk(R.sum.q, 3), 'q');
      L2.check(`q=${nk(R.sum.q, 3)}\\ ${R.sum.ok ? '\\le' : '>'}\\ 1`, R.sum.ok, R.sum.ok ? 'Условие (1.1) выполняется — совместное действие SO<sub>2</sub> и NO<sub>2</sub> допустимо.' : 'Условие (1.1) не выполняется — совместное присутствие SO<sub>2</sub> и NO<sub>2</sub> недопустимо, требуется снижение их выбросов.');
    }
    if (P.prof) {
      L2.h((P.sumEff && !T2 ? '2.5' : '2.4') + '. Распределение приземных концентраций');
      L2.p('Для наглядности построено распределение приземной концентрации по оси факела C(x) + C<sub>ф</sub>, отнесённой к ПДК. Форма кривой C(x)/C<sub>max</sub> = s<sub>1</sub>(x/X<sub>max</sub>) взята по методике ОНД-86 (в пособии не приводится); значения C<sub>max</sub> и X<sub>max</sub> — из расчёта выше. Выше линии «1» — превышение ПДК.');
      L2.plot('prof', 'Распределение приземных концентраций вредных веществ по оси факела');
      const zs = R.sub.filter(x => x.zone);
      if (zs.length) L2.p('Зона превышения ПДК по оси факела: ' + zs.map(x => x.s.name.toLowerCase() + (x.zone === Infinity ? ' — всюду (фон выше ПДК)' : ` — от ${fauto(x.zone.from, 3)} до ${fauto(x.zone.to, 3)} м`)).join('; ') + '. Санитарно-защитная зона должна охватывать эту область.');
      else L2.p('Ни для одного вещества суммарная концентрация не превышает ПДК ни на каком расстоянии от источника.');
    }

    /* ======================= ЭТАП 3. ПДВ ======================= */
    L3.h('3.1. Расчёт ПДВ по веществам');
    L3.p(hot ? 'Предельно допустимый выброс каждого вещества, при котором его концентрация в приземном слое с учётом фона не превышает ПДК, рассчитываем по формуле (1.25) для нагретых выбросов:' : 'Предельно допустимый выброс каждого вещества рассчитываем по формуле (1.26) для холодных выбросов:');
    L3.tex(hot ? 'ПДВ=\\dfrac{\\left(ПДК-C_{ф}\\right)H^2\\sqrt[3]{V_i\\Delta T}}{AFmn\\eta}' : 'ПДВ=\\dfrac{8V_i\\left(ПДК-C_{ф}\\right)H\\sqrt[3]{H}}{AFn\\eta D}', 'pdv');
    for (const x of R.sub) {
      const subst = hot
        ? `\\dfrac{\\left(${n0(x.PDK)}-${n0(x.Cf)}\\right)\\cdot ${n0(P.H)}^2\\sqrt[3]{${nk(o.Vi, 2)}\\cdot ${nk(o.dT, 1)}}}{${n0(P.A)}\\cdot ${n0(x.F)}\\cdot ${nk(o.m, 2)}\\cdot ${nk(o.n, 2)}\\cdot ${n0(P.eta)}}`
        : `\\dfrac{8\\cdot ${nk(o.Vi, 2)}\\left(${n0(x.PDK)}-${n0(x.Cf)}\\right)\\cdot ${n0(P.H)}\\cdot\\sqrt[3]{${n0(P.H)}}}{${n0(P.A)}\\cdot ${n0(x.F)}\\cdot ${nk(o.n, 2)}\\cdot ${n0(P.eta)}\\cdot ${n0(P.D)}}`;
      if (x.PDK - x.Cf > 0) L3.eq('ПДВ^{' + sT(x.s) + '}', '', subst, x.PDV, 'г/с', nk(x.PDV, 2), 'ПДВ');
      else L3.check(`C_{ф}^{${sT(x.s)}}=${n0(x.Cf)}\\ge ПДК=${n0(x.PDK)}`, false, 'Фоновая концентрация не ниже ПДК — выброс этого вещества недопустим (ПДВ = 0).');
    }
    if (!T2 && +P.variant === 1) L3.note('В тексте примера пособия при сравнении записано «ПДК<sup>пыли</sup> = 6,57 г/с» — это опечатка, речь идёт о ПДВ<sup>пыли</sup> = 6,57 г/с.', 'warn').webOnly();
    L3.h('3.2. Сравнение фактического выброса с ПДВ');
    if (!T2) L3.table(['Вещество', 'M, г/с', 'ПДВ, г/с', 'M / ПДВ', 'Норматив'],
      R.sub.map(x => [x.s.name + (x.key === 'dust' ? '' : ' (' + x.s.html + ')'), fin(x.M), fk(x.PDV, 2), x.PDV > 0 ? fauto(x.M / x.PDV, 3) : '∞', x.over ? 'превышен' : 'выполняется']),
      'Фактические выбросы и ПДВ', { cols: [2800, 1500, 1500, 1500, 2050] });
    for (const x of R.sub) L3.check(`M^{${sT(x.s)}}=${n0(x.M)}\\ ${x.over ? '>' : '\\le'}\\ ПДВ^{${sT(x.s)}}=${nk(x.PDV, 2)}\\ \\text{г/с}`, !x.over, x.over ? 'фактический выброс превышает ПДВ' : 'фактический выброс не превышает ПДВ');
    if (!T2) L3.items.slice(-R.sub.length).forEach(it => it.web = true);
    L3.ext(true).plot('mpdv', 'Фактические выбросы M и предельно допустимые выбросы ПДВ');
    L3.ext(false);
    if (R.overList.length) {
      L3.h('3.3. Требуемая степень очистки');
      L3.p('Для веществ, фактический выброс которых превышает ПДВ, необходимо разработать мероприятия по снижению выбросов. Требуемая степень очистки:');
      L3.tex('\\varepsilon=\\dfrac{M-ПДВ}{M}\\cdot 100', 'eps');
      for (const x of R.overList) L3.eq('\\varepsilon^{' + sT(x.s) + '}', '', `\\dfrac{${n0(x.M)}-${nk(x.PDV, 2)}}{${n0(x.M)}}\\cdot 100`, x.eps, '%', nk(x.eps, 1), '\\varepsilon');
      L3.h(T2 ? '3.4. Выбор аппарата пылеулавливания' : '3.4. Рекомендации по снижению выбросов');
      if (T2) L3.p(`Поскольку M<sup>пыли</sup> = ${fin(R.by.dust.M)} г/с > ПДВ<sup>пыли</sup> = ${fk(R.by.dust.PDV, 2)} г/с, на линии выброса вытяжной вентиляции необходимо установить аппарат пылеулавливания.`);
      for (const x of R.overList) {
        if (x.key === 'dust') { const ad = dustAdvice(x.eps); x.advice = ad.app; L3.p(`Пыль: требуемая степень очистки ${fk(x.eps, 1)} % — ${ad.why}. Для улавливания пыли рекомендуется ${ad.app}.`); }
        else { x.advice = GAS_ADVICE[x.key]; L3.p(`${x.s.name} (${x.s.html}): требуемая степень очистки ${fk(x.eps, 1)} % — рекомендуются ${GAS_ADVICE[x.key]}.`); }
      }
    } else {
      L3.h('3.3. Вывод о нормативах');
      if (T2) L3.p(`Поскольку M<sup>пыли</sup> = ${fin(R.by.dust.M)} г/с ≤ ПДВ<sup>пыли</sup> = ${fk(R.by.dust.PDV, 2)} г/с, установка аппарата пылеулавливания на линии вытяжной вентиляции не требуется.`);
      else L3.p('Фактические выбросы всех веществ не превышают расчётных значений ПДВ — установка дополнительных очистных устройств не требуется; фактические выбросы могут быть приняты в качестве нормативов ПДВ.');
    }
    L3.ext(true);
    if (P.hmin && R.excList.length) {
      L3.h((R.overList.length ? '3.5' : '3.4') + '. Альтернатива: высота трубы');
      L3.p('Другой способ обеспечить C<sub>max</sub> + C<sub>ф</sub> ≤ ПДК — увеличить высоту трубы. Наименьшую высоту находим из условия C<sub>max</sub>(H) = ПДК − C<sub>ф</sub> по формулам (1.2) и (1.27); так как f, m, V<sub>m</sub> и n сами зависят от H, уравнение решено численно (подбором H):');
      L3.table(['Вещество', 'H<sub>min</sub>, м', 'Увеличение высоты'],
        R.excList.map(x => [x.s.name + (x.key === 'dust' ? '' : ' (' + x.s.html + ')'), x.Hmin === Infinity ? '> 5000' : isNaN(x.Hmin) ? 'невозможно (C<sub>ф</sub> ≥ ПДК)' : fauto(Math.ceil(x.Hmin), 4), isFinite(x.Hmin) ? 'в ' + fauto(x.Hmin / P.H, 3) + ' раза' : '—']),
        'Наименьшая высота трубы', { cols: [3600, 2700, 3050] });
      if (R.Hreq > 0) L3.p(`Для одновременного выполнения нормативов по всем веществам высота трубы должна быть не менее ${fauto(Math.ceil(R.Hreq), 4)} м вместо ${fin(P.H)} м. ${R.Hreq > 2.5 * P.H ? 'Такое увеличение высоты нереально — снижать выбросы необходимо очисткой газов.' : 'Это решение сопоставимо по затратам с очисткой и должно рассматриваться при технико-экономическом сравнении вариантов.'}`);
    }

    R.L1 = L1; R.L2 = L2; R.L3 = L3;
    return R;
  }

  /* сводка по всем вариантам — для преподавателя / тьютора */
  function summary(opt, task) {
    task = TX(task) ? +task : +task === 2 ? 2 : 1;
    return vlist(task).map(v => {
      const P = Object.assign(fromVariant(v.no, task), opt || {}, { task, variant: v.no, hmin: false, prof: false });
      vkeys(task).forEach(k => P[k] = v[k]);
      try { const R = compute(P); return { no: v.no, R }; } catch (e) { return { no: v.no, err: e.message }; }
    });
  }

  /* профиль концентраций для графика */
  function profile(R, npts) {
    npts = npts || 400;
    const xm = Math.max(...R.sub.map(x => x.Xmax));
    const xend = Math.max(8 * xm, ...R.sub.map(x => x.zone && isFinite(x.zone.to) ? x.zone.to * 1.25 : 0));
    const xs = [];
    for (let i = 0; i <= npts; i++) xs.push(xend * Math.pow(i / npts, 1.6));
    return R.sub.map(x => ({ key: x.key, name: x.s.short, x: xs, y: xs.map(xx => (x.Cmax * s1(xx / x.Xmax, x.F) + x.Cf) / x.PDK) }));
  }

  function use(R) { if (R) BOOK = !!R.book; }
  const _ = { Report, rd, book: () => BOOK, source, pdv, cmax, nCoef, tx, nk, n0, n };
  const api = { _, TX, nkeys, vkeys, vlist, VKEYS2, use, compute, defaults, fromVariant, summary, profile, s1, fnum, fauto, fk, fin, n, nk, VKEYS, NKEYS, dustAdvice, GAS_ADVICE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LABS = api;
})(typeof window !== 'undefined' ? window : globalThis);
