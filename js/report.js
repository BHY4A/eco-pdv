/* report.js — отчёт по практической работе «Расчёт рассеивания и нормативов ПДВ» в формате Word (.docx) */
(function (root) {
  'use strict';
  const LOGO = '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';

  const META = {
    title: 'Расчёт рассеивания и нормативов предельно допустимых выбросов вредных веществ в атмосферу',
    goal: 'Определение наибольших приземных концентраций вредных веществ, выбрасываемых в атмосферу паросиловым производством, сравнение их с санитарно-гигиеническими нормативами (ПДК), расчёт нормативов предельно допустимых выбросов (ПДВ) и разработка рекомендаций по снижению выбросов.',
    src: 'Фридланд, С. В. Промышленная экология. Основы инженерных расчетов : учеб. пособие для вузов / С. В. Фридланд, Л. В. Ряписова, Н. Р. Стрельцова, Р. Н. Зиятдинов. – М. : КолосС, 2008. – 176 с. – (Учебники и учеб. пособия для студентов высш. учеб. заведений)',
    ond: 'ОНД-86. Методика расчёта концентраций в атмосферном воздухе вредных веществ, содержащихся в выбросах предприятий. – Л. : Гидрометеоиздат, 1987. – 93 с',
    title2: 'Обоснование необходимости установки аппарата пылеулавливания на линии вытяжной вентиляции',
    goal2: 'Определение наибольшей приземной концентрации пыли, выбрасываемой системой вытяжной вентиляции отделения предварительной подготовки сырья, расчёт предельно допустимого выброса пыли (ПДВ) и обоснование необходимости установки аппарата пылеулавливания.',
    stages: { s1: 'Параметры источника выброса', s2: 'Максимальные приземные концентрации', s3: 'Предельно допустимые выбросы' }
  };

  function titlePage(doc, T) {
    const c = { align: 'center', indent: 0, spacing: { line: 240 } };
    const p0 = doc.p.bind(doc); doc.p = (t, pp, base) => p0(t, pp, Object.assign({ size: 28 }, base || {}));   // титульный лист — всегда 14 пт
    if (T.logo) doc.image(LOGO, 'jpeg', 1.0, 0.93, { spacing: { before: 0, after: 60, line: 240 }, keepNext: false });
    String(T.org || '').split('\n').forEach(l => doc.p(l, c));
    if (T.dept) String(T.dept).split('\n').forEach((l, k) => doc.p(l, Object.assign({}, c, k === 0 ? { spacing: { before: 240, line: 240 } } : {})));
    doc.p([{ t: 'ОТЧЁТ', b: true, size: 40 }], { align: 'center', indent: 0, spacing: { before: 1900, after: 120, line: 240 } });
    doc.p('по ' + (T.kind || 'практической работе'), c);
    doc.p('«' + (T.title || T._title || META.title) + '»', Object.assign({}, c, { spacing: { before: 60, line: 240 } }), { b: true });
    doc.p('по дисциплине', Object.assign({}, c, { spacing: { before: 120, line: 240 } }));
    doc.p('«' + (T.discipline || '') + '»', c);
    const r = { align: 'right', indent: 0, spacing: { line: 240 } };
    doc.p('Выполнил:', Object.assign({}, r, { spacing: { before: 1500, line: 240 } }));
    if (T.group) doc.p('ст. гр. ' + T.group, r);
    doc.p(T.student || '______________', r);
    doc.p('Проверил:', Object.assign({}, r, { spacing: { before: 360, line: 240 } }));
    doc.p(T.teacher || '______________', r);
    doc.p((T.city || 'Казань') + ' ' + (T.year || new Date().getFullYear()), { align: 'center', indent: 0, spacing: { before: 1600, line: 240 } });
    doc.p = p0;
  }

  function lc(t) { t = String(t); return /^[А-ЯЁ][а-яё]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  let READ = false;
  let MS = 28;                                             // кегль формул в полупунктах (14 пт; 12 пт — 24)
  function keepIdx(k, n, max, head, tail) {
    if (k >= n - 1 || !READ) return false;
    if (n <= max) return true;
    return k < head - 1 || k >= n - tail - 1;
  }
  function listOut(doc, lines) {
    lines.forEach((l, k) => { l = String(l).replace(/[;.]\s*$/, ''); doc.html('– ' + l + (k === lines.length - 1 ? '.' : ';'), keepIdx(k, lines.length, 10, 3, 3) ? { keepNext: true } : undefined); });
  }

  /* ---------- перенос длинных формул (ГОСТ 2.105) ---------- */
  const LIMIT = 560;
  function splitTop(t, ch) {
    const out = []; let depth = 0, cur = '';
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (c === '{') depth++; else if (c === '}') depth--;
      if (c === ch && depth === 0 && t[i - 1] !== '\\') { out.push(cur); cur = ''; } else cur += c;
    }
    out.push(cur); return out;
  }
  function fitMath(tex, ctx) {
    const W = x => ctx.measure(x);
    if (W(tex) <= LIMIT) return [{ t: tex }];
    const parts = splitTop(tex, '=');
    const lines = [];
    let cur = parts[0];
    for (let k = 1; k < parts.length; k++) {
      const cand = cur + '=' + parts[k];
      if (W(cand) <= LIMIT) cur = cand; else { lines.push(cur); cur = '=' + parts[k]; }
    }
    lines.push(cur);
    return lines.map(t => ({ t, size: W(t) > LIMIT ? Math.max(16, Math.floor(MS * LIMIT / W(t))) : MS }));
  }
  function emitMath(doc, tex, ctx) {
    const lines = fitMath(tex, ctx);
    for (const l of lines) doc.math(ctx.omml(l.t, false, l.size || MS), l !== lines[lines.length - 1] ? { keepNext: true } : {});
  }
  function symHtml(t) {
    let s = String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    s = s.replace(/(^|[^A-Za-zА-Яа-яЁё0-9])([A-Za-z])_([A-Za-zА-Яа-яЁё\w]+)/g, (m0, a, l, ix) => a + '<i>' + l + '</i><sub>' + ix + '</sub>');
    return s;
  }

  /* ---------- экспликации к формулам (ГОСТ 2.105-95, п. 4.2.15): «где …», каждый символ с новой строки ---------- */
  const S_ = {
    'W': 'средняя скорость выхода газовоздушной смеси из устья источника, м/с',
    'D': 'диаметр устья источника выброса, м',
    'H': 'высота источника выброса над уровнем земли, м',
    'T_{г}': 'температура выбрасываемой газовоздушной смеси, °C',
    'T_{в}': 'температура окружающего атмосферного воздуха, °C',
    'T_{п}': 'температура выбрасываемой пылевоздушной смеси, °C',
    '\\Delta T': 'разность температур газовоздушной смеси и окружающего воздуха, °C',
    'f': 'параметр, определяющий тип выброса',
    "V'_m": 'параметр, характеризующий начальный подъём струи, м/с',
    'f_e': 'параметр для проверки условия f<sub>e</sub> < f < 100',
    'V_i': 'объём газовоздушной смеси, м³/с',
    'V_m': 'параметр, характеризующий опасную скорость ветра, м/с',
    'A': 'коэффициент, зависящий от температурной стратификации атмосферы',
    'M': 'количество вредного вещества, выбрасываемого в атмосферу, г/с',
    'F': 'безразмерный коэффициент, учитывающий скорость оседания вредных веществ',
    'm, n': 'безразмерные коэффициенты, учитывающие условия выхода газовоздушной смеси из устья источника',
    'n': 'безразмерный коэффициент, учитывающий условия выхода газовоздушной смеси из устья источника',
    '\\eta': 'безразмерный коэффициент, учитывающий рельеф местности',
    'd': 'безразмерный коэффициент',
    'ПДК': 'предельно допустимая концентрация вредного вещества, мг/м³',
    'C_{ф}': 'фоновая концентрация вредного вещества, мг/м³',
    'C': 'концентрация вещества в приземном слое с учётом фона, мг/м³',
    'ПДВ': 'предельно допустимый выброс вредного вещества, г/с'
  };
  const WHERE = {
    '\\Delta T': ['T_{г}', 'T_{п}', 'T_{в}'], f: ['W', 'D', 'H', '\\Delta T'], V_i: ['D', 'W'], "V'_m": ['W', 'D', 'H'], f_e: ["V'_m"], m: ['f'],
    V_m: ['V_i', '\\Delta T', 'H'], n: ['V_m'], d: ['V_m', 'f', 'f_e', "V'_m"],
    cmax: ['A', 'M', 'F', 'm, n', '\\eta', 'H', 'V_i', '\\Delta T'], cmaxc: ['A', 'M', 'F', 'n', 'D', '\\eta', 'V_i', 'H'],
    xmax: ['F', 'd', 'H'], q: ['C', 'ПДК'], pdv: ['ПДК', 'C_{ф}', 'H', 'V_i', '\\Delta T', 'A', 'F', 'm, n', '\\eta', 'D'], eps: ['M', 'ПДВ']
  };
  let CUR_S = S_, CUR_W = WHERE;                         // экспликации текущей задачи (1.3–1.6 дополняют общие)
  const reEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function whereList(key, formula, cnt) {
    /* позиция символа в формуле, не считая букв внутри команд TeX (\mathrm, \dfrac …) */
    const pos = sy => { if (sy === 'm, n') return formula.search(/mn/); const m = new RegExp('(?<!\\\\[A-Za-z]*)' + reEsc(sy)).exec(formula); return m ? m.index : -1; };
    return (CUR_W[key] || []).filter(sy => !cnt.expl[sy] && !(sy === 'n' && cnt.expl['m, n']) && pos(sy) >= 0)
      .sort((a, b) => pos(a) - pos(b));                     // в порядке появления в формуле (ГОСТ 2.105-95, п. 4.2.15)
  }
  function where(doc, list, ctx, cnt) {
    list.forEach((sy, k) => {
      cnt.expl[sy] = 1; if (sy === 'm, n') cnt.expl.n = 1;
      const om = ctx.omml(sy === 'm, n' ? 'm,\\ n' : sy, true, MS);
      const last = k === list.length - 1;
      doc.raw(`<w:p>${doc.pPr(Object.assign({ indent: 0, left: k ? 425 : 0 }, last ? {} : { keepNext: true }))}${doc.runs(k ? '' : 'где ')}${om}${doc.runs(' – ')}${doc.runs(doc.htmlSegs((CUR_S[sy] || '') + (last ? '.' : ';')))}</w:p>`);
    });
  }
  /* ссылки на формулы пособия: «по формуле (1.6)» → «по формуле (1.6) [1]» */
  function cite(t) {
    return String(t).replace(/(?:\(1\.\d+\)(?:,\s*|\s*[–-]\s*|\s+и\s+)?)+/g, m => {
      const core = m.replace(/(?:,\s*|\s*[–-]\s*|\s+и\s+)$/, '');
      return core + ' [1]' + m.slice(core.length);
    });
  }
  /* формула с номером у правого края; слишком широкая — уменьшенным кеглем, но всё равно с номером */
  function numbered(doc, tex, ctx, cnt, keep) {
    cnt.eq++;
    const w = ctx.measure(tex), lim = LIMIT * 0.88;
    doc.mathNum(ctx.omml(tex, false, w > lim ? Math.max(18, Math.floor(MS * lim / w)) : MS), cnt.eq, keep);
  }

  function addItems(doc, items, ctx, opt, cnt) {
    const vis = items.filter(x => !x.web && !(x.ext && !opt.ext)).map(x => x.rep !== undefined ? Object.assign({}, x, { k: 'p', t: x.rep }) : x);
    for (let ix = 0; ix < vis.length; ix++) {
      const it = vis[ix], nx = vis[ix + 1];
      const nextMath = !!nx && (nx.k === 'eq' && !nx.formula || nx.k === 'tex');
      switch (it.k) {
        case 'h': cnt.sub++; doc.html(cnt.sec + '.' + cnt.sub + ' ' + it.t.replace(/^\d+(?:\.\d+)*\.?\s+/, '').replace(/\.$/, ''), { style: 'Heading3' }); break;
        case 'p': {
          if (nx && nx.k === 'table' && /:\s*$/.test(it.t)) {      // ссылка на таблицу в тексте (ГОСТ 2.105-95, п. 4.4.1)
            doc.html(cite(it.t.replace(/:\s*$/, '')) + ' (таблица ' + (cnt.tab + 1) + ').', { keepNext: true }); cnt.tabRef = true; cnt.lead = false; continue;
          }
          doc.html(cite(it.t), /:\s*$/.test(it.t) ? { keepNext: true } : undefined); cnt.lead = /:\s*$/.test(it.t); continue;
        }
        case 'note': break;
        case 'tex': {
          const d = opt.explain && root.EXPLAIN && !cnt.lead ? EXPLAIN.texDesc(it.desc) : '';
          if (d) doc.html(cite(symHtml(d.replace(/\.$/, ':'))), { keepNext: true });
          const wl = whereList(it.desc, it.t, cnt);
          numbered(doc, it.t + (wl.length || nextMath ? ',' : '.'), ctx, cnt, wl.length > 0);
          where(doc, wl, ctx, cnt);
          break;
        }
        case 'eq': {
          const val = (it.vs || ctx.L.n(it.val)) + (it.unit ? '\\ \\text{' + it.unit.replace('%', '\\%') + '}' : '');
          const d = opt.explain && root.EXPLAIN && !cnt.lead && !cnt.seen[it.key] ? EXPLAIN.eqDesc(it.key) : '';
          cnt.seen[it.key] = 1;
          if (d) doc.html(symHtml(d.replace(/\.$/, ':')), { keepNext: true });
          const end = nextMath ? ',' : '.';
          if (it.formula) {
            const wl = whereList(it.key, it.formula, cnt);
            numbered(doc, it.lhs + '=' + it.formula + ',', ctx, cnt, true);
            cnt.expl[it.key] = 1;
            where(doc, wl, ctx, cnt);
          }
          emitMath(doc, it.lhs + (it.subst ? '=' + it.subst : '') + '=' + val + end, ctx);
          break;
        }
        case 'check':
          doc.raw(`<w:p>${doc.pPr({ indent: 709 })}${doc.runs('Проверка: ')}${ctx.omml(it.tex, true, MS)}${doc.runs(' – ')}${doc.runs(doc.htmlSegs(cite(lc(it.t || (it.ok ? 'выполняется' : 'не выполняется')).replace(/\.?$/, '.'))))}</w:p>`); break;
        case 'table': {
          cnt.tab++;
          if (!cnt.tabRef) doc.html('Результаты приведены в таблице ' + cnt.tab + '.', { keepNext: true });
          cnt.tabRef = false;
          doc.p('Таблица ' + cnt.tab + ' – ' + (it.caption || 'Результаты расчёта'), { style: 'TableCaption' });
          doc.table(it.head, it.rows, it.cols ? { cols: it.cols } : undefined);
          break;
        }
        case 'plot': {
          const img = ctx.png[it.id];
          if (!img) break;
          const nn = cnt.fig + 1;
          doc.html((it.lead ? it.lead : it.id === 'prof' ? 'Распределение приземных концентраций представлено на рисунке {n}.' : 'Сравнение фактических выбросов с ПДВ представлено на рисунке {n}.').replace('{n}', nn), { keepNext: true });
          const w = 16, h = Math.min(w * img.h / img.w, 12);
          doc.image(img.data, 'png', h === 12 ? 12 * img.w / img.h : w, h);
          doc.p('Рисунок ' + nn + ' – ' + it.title.replace(/\.$/, ''), { style: 'Caption' });
          doc.p('', { indent: 0 });
          cnt.fig++;
          break;
        }
      }
      cnt.lead = false;
    }
  }

  function inputList(doc, P, ctx, given) {
    const f = ctx.L.fin;
    const items = given ? given : +P.task === 2 ? [
      ['M_{пыли}', P.Mdust, 'г/с', 'выброс пыли'], ['C_{ф}^{пыли}', P.cf_dust, 'мг/м³', 'фоновая концентрация пыли'],
      ['H', P.H, 'м', 'высота трубы'], ['D', P.D, 'м', 'диаметр устья трубы'], ['W', P.W, 'м/с', 'скорость выхода пылевоздушной смеси'],
      ['T_{п}', P.Tg, '°C', 'температура пылевоздушной смеси'], ['T_{в}', P.Tv, '°C', 'температура окружающего воздуха'],
      ['A', P.A, '', 'коэффициент, зависящий от температурной стратификации атмосферы'],
      ['F', P.Fd, '', 'коэффициент скорости оседания пыли'], ['\\eta', P.eta, '', 'коэффициент рельефа местности (ровная местность)'], ['N', 1, '', 'число труб']
    ] : [
      ['M_{\\mathrm{CO}}', P.Mco, 'г/с', 'выброс оксида углерода'], ['M_{\\mathrm{NO_2}}', P.Mno2, 'г/с', 'выброс диоксида азота'],
      ['M_{\\mathrm{SO_2}}', P.Mso2, 'г/с', 'выброс диоксида серы'], ['M_{пыли}', P.Mdust, 'г/с', 'выброс пыли'],
      ['H', P.H, 'м', 'высота трубы'], ['D', P.D, 'м', 'диаметр устья трубы'], ['W', P.W, 'м/с', 'скорость выхода дымовых газов'],
      ['T_{г}', P.Tg, '°C', 'температура дымовых газов'], ['T_{в}', P.Tv, '°C', 'температура окружающего воздуха'],
      ['A', P.A, '', 'коэффициент, зависящий от температурной стратификации атмосферы'],
      ['F', P.Fg + '/' + P.Fd, '', 'коэффициент скорости оседания для газов / для пыли'],
      ['\\eta', P.eta, '', 'коэффициент рельефа местности (ровная местность)'], ['N', 1, '', 'число дымовых труб']
    ];
    items.forEach(([sym, v, u, d], k) => {
      const vs = typeof v === 'string' && /\\/.test(v) ? v : String(f(v)).replace(',', '{,}').replace('-', '-');
      const om = ctx.omml(sym + '=' + vs + (u ? (u === '\\%' ? '\\ ' + u : '\\ \\text{' + u + '}') : ''), true, MS);
      doc.raw(`<w:p>${doc.pPr({ indent: 709 })}${om}${doc.runs(doc.htmlSegs(' – ' + d + (k === items.length - 1 ? '.' : ';')))}</w:p>`);
    });
  }

  /* ---------- выводы ---------- */
  function conclusions(R, L, ext) {
    if (ext === undefined) ext = true;
    L.use(R);
    const SPc = L.TX && L.TX(R.task);
    if (SPc) return SPc.rep.conclusions(R, ext);
    const P = R.P, o = R.o, fk = L.fk, fa = L.fauto, out = [];
    if (R.task === 2) {
      const x = R.by.dust;
      out.push(`Для варианта ${P.variant} выброс пылевоздушной смеси ${o.hot ? `нагретый (f = ${fk(o.f, 2)} < 100)` : `холодный (f = ${fk(o.f, 2)} ≥ 100)`}: объём смеси V<sub>i</sub> = ${fk(o.Vi, 2)} м³/с, ${o.hot ? `m = ${fk(o.m, 2)}, V<sub>m</sub>` : 'V′<sub>m</sub>'} = ${fk(o.Vm, 2)} м/с, n = ${fk(o.n, 2)}, d = ${fk(o.d, 2)}.`);
      out.push(`Наибольшая приземная концентрация пыли C<sub>max</sub> = ${fk(x.Cmax, R.CD)} мг/м³ достигается на расстоянии X<sub>max</sub> = ${fk(x.Xmax, 1)} м от трубы. С учётом фона C<sub>max</sub> + C<sub>ф</sub> = ${fk(x.tot, 3)} мг/м³ ${x.exceed ? `превышает ПДК = ${L.fin(x.PDK)} мг/м³ в ${fa(x.ratio, 3)} раза` : `не превышает ПДК = ${L.fin(x.PDK)} мг/м³`}.`);
      out.push(`Предельно допустимый выброс пыли ПДВ = ${fk(x.PDV, 2)} г/с. ` + (x.over
        ? `Фактический выброс M = ${L.fin(x.M)} г/с превышает ПДВ, поэтому на линии вытяжной вентиляции необходимо установить аппарат пылеулавливания с требуемой степенью очистки ε = ${fk(x.eps, 1)} %; рекомендуется ${L.dustAdvice(x.eps).app}.`
        : `Фактический выброс M = ${L.fin(x.M)} г/с не превышает ПДВ — установка аппарата пылеулавливания не требуется.`) + (ext && P.hmin && R.Hreq > 0 ? ` Альтернативное решение — увеличение высоты трубы до ${fa(Math.ceil(R.Hreq), 4)} м.` : ''));
      return out;
    }
    out.push(`Для варианта ${P.variant} выброс дымовых газов ${o.hot ? `нагретый (f = ${fk(o.f, 2)} < 100)` : `холодный (f = ${fk(o.f, 2)} ≥ 100)`}: объём газовоздушной смеси V<sub>i</sub> = ${fk(o.Vi, 2)} м³/с, коэффициенты ${o.hot ? `m = ${fk(o.m, 2)}, V<sub>m</sub> = ${fk(o.Vm, 2)} м/с` : `V′<sub>m</sub> = ${fk(o.Vm, 2)} м/с`}, n = ${fk(o.n, 2)}, d = ${fk(o.d, 2)}.`);
    const g = R.sub.filter(x => x.F === R.sub[0].F), dd = R.sub.filter(x => x.F !== R.sub[0].F);
    out.push(`Наибольшие приземные концентрации при неблагоприятных условиях рассеивания: ${R.sub.map(x => `${x.s.html === 'пыль' ? 'пыли' : x.s.html} — ${fk(x.Cmax, R.CD)} мг/м³`).join(', ')}. Максимум достигается на расстоянии ${fk(g[0].Xmax, 1)} м от трубы для газов${dd.length ? ` и ${fk(dd[0].Xmax, 1)} м для пыли` : ''}.`);
    const exc = R.excList;
    out.push(exc.length
      ? `С учётом фоновых концентраций ПДК превышена по ${exc.map(x => (x.key === 'dust' ? 'пыли' : x.s.html) + ` (${fk(x.tot, 4)} мг/м³ при ПДК ${L.fin(x.PDK)} мг/м³, в ${fa(x.ratio, 3)} раза)`).join(', ')}; остальные вещества не загрязняют воздушный бассейн сверх нормы.`
      : 'С учётом фоновых концентраций содержание всех вредных веществ в приземном слое не превышает ПДК.');
    if (P.sumEff && ext) out.push(`Безразмерная суммарная концентрация SO<sub>2</sub> и NO<sub>2</sub>, обладающих эффектом суммации, q = ${fk(R.sum.q, 3)} ${R.sum.ok ? '≤ 1 — условие (1.1) выполняется' : '> 1 — условие (1.1) не выполняется'}.`);
    out.push(`Рассчитаны нормативы ПДВ: ${R.sub.map(x => `${x.key === 'dust' ? 'пыль' : x.s.html} — ${fk(x.PDV, 2)} г/с`).join(', ')}. ` + (R.overList.length
      ? `Фактический выброс превышает ПДВ по ${R.overList.map(x => (x.key === 'dust' ? 'пыли' : x.s.html) + ` (M = ${L.fin(x.M)} г/с, требуемая степень очистки ε = ${fk(x.eps, 1)} %)`).join(', ')}; по остальным веществам фактический выброс не превышает ПДВ.`
      : 'Фактические выбросы всех веществ не превышают ПДВ.'));
    if (R.overList.length) out.push('Для достижения нормативов рекомендуется: ' + R.overList.map(x => x.key === 'dust' ? 'для улавливания пыли — ' + L.dustAdvice(x.eps).app : 'для ' + x.s.html + ' — ' + L.GAS_ADVICE[x.key]).join('; ') + '.' + (ext && P.hmin && R.Hreq > 0 ? ` Альтернативное решение — увеличение высоты трубы до ${fa(Math.ceil(R.Hreq), 4)} м${R.Hreq > 2.5 * P.H ? ', что практически нереализуемо' : ''}.` : ''));
    return out;
  }

  async function build(ctx, T, opt) {
    READ = opt.readable !== false;
    const small = !!opt.compact;                           // основной текст 12 пт, интервал одинарный (титульный лист — без изменений)
    MS = small ? 24 : 28;
    const doc = new DOCX.Doc(Object.assign({ readable: READ, italVars: true }, small ? { size: 24, line: 240 } : {}));
    const R = ctx.S.R, P = R.P, T2 = R.task === 2, fin = ctx.L.fin;
    const SP = ctx.L.TX(R.task);
    CUR_S = SP ? Object.assign({}, S_, SP.rep.sym) : S_; CUR_W = SP ? Object.assign({}, WHERE, SP.rep.where) : WHERE;
    ctx.L.use(R);
    titlePage(doc, Object.assign({}, T, { _variant: P.variant, _title: SP ? SP.rep.title : T2 ? META.title2 : META.title }));
    /* разделы «Цель работы», «Задание», «Исходные данные» можно отключить; первый заголовок после титульного листа — с новой страницы */
    let first = true;
    const H2 = t => { doc.p(t, Object.assign({ style: 'Heading2' }, first ? { pageBreakBefore: true } : {})); first = false; };
    const secGoal = T.secGoal !== false, secTask = T.secTask !== false, secData = T.secData !== false;
    if (secGoal) { H2('Цель работы'); doc.p(SP ? SP.rep.goal : T2 ? META.goal2 : META.goal); }
    if (secTask) H2('Задание');
    if (!secTask) { /* пропуск */ } else if (SP) {
      const tk = SP.rep.task(P);
      tk.lead.forEach(t => doc.html(t));
      if (tk.need) { doc.p('Необходимо:', { keepNext: true }); listOut(doc, tk.need); }
    } else if (T2) {
      doc.html(`В отделении предварительной подготовки сырья на предприятии от установленного оборудования выделяется пыль, которая системой вытяжной вентиляции выбрасывается в атмосферу с температурой T<sub>п</sub> = ${fin(P.Tg)} °C. Выбросы проводятся со скоростью W = ${fin(P.W)} м/с через трубу высотой H = ${fin(P.H)} м с устьем диаметром D = ${fin(P.D)} м. Температура окружающей среды T<sub>в</sub> = ${fin(P.Tv)} °C.`);
      doc.html(`Необходимо обосновать необходимость установки аппарата пылеулавливания на линии вытяжной вентиляции, если ПДК<sup>пыли</sup> = ${fin(P.pdk_dust)} мг/м³ [1].`);
    } else {
      doc.html(`Источником выброса на предприятии является паросиловое производство, сжигающее уголь. Выброс дымовых газов с температурой T<sub>г</sub> = ${fin(P.Tg)} °C ведётся через одну трубу высотой H = ${fin(P.H)} м и диаметром устья D = ${fin(P.D)} м со скоростью W = ${fin(P.W)} м/с. Рассеивание происходит в атмосферном воздухе, температура которого T<sub>в</sub> = ${fin(P.Tv)} °C. Количество выбрасываемых вредных веществ M, коэффициент стратификации атмосферы A, фоновые концентрации C<sub>ф</sub> и ПДК заданы в исходных данных.`);
      doc.p('Необходимо:', { keepNext: true });
      listOut(doc, ['определить наибольшую ожидаемую концентрацию C<sub>max</sub> вредных веществ (CO, NO<sub>2</sub>, SO<sub>2</sub>, пыли) в приземном слое атмосферы при неблагоприятных условиях рассеивания',
        'рассчитать расстояние X<sub>max</sub> от источника выбросов, на котором приземная концентрация достигает максимального значения',
        'сравнить фактическое содержание вредных веществ в атмосферном воздухе C<sub>max</sub> + C<sub>ф</sub> с учётом фоновой концентрации с санитарно-гигиеническими нормами (ПДК)',
        'рассчитать ПДВ отдельно по каждому выбрасываемому веществу с учётом фоновых концентраций',
        'определить требуемую степень очистки и дать рекомендации по снижению выбросов, если фактический выброс какого-либо вещества превышает ПДВ']);
    }
    const cnt = { fig: 0, tab: 0, eq: 0, seen: {}, expl: {} };
    if (secData && SP) {
      H2('Исходные данные');
      doc.p('Согласно варианту № ' + P.variant + ' (табл. ' + SP.table + ' [1]) приняты следующие значения:', { keepNext: true });
      inputList(doc, P, ctx, SP.rep.inputs(P));
      const dt = SP.rep.dataTable && SP.rep.dataTable(R);
      if (dt) {
        cnt.tab++;
        doc.p(dt.text.replace('{n}', cnt.tab), { keepNext: true });
        doc.p('Таблица ' + cnt.tab + ' – ' + dt.caption, { style: 'TableCaption' });
        doc.table(dt.head, dt.rows, { cols: dt.cols });
      }
    } else if (secData) {
    H2('Исходные данные');
    doc.p('Согласно варианту № ' + P.variant + ' (табл. ' + (T2 ? '1.3' : '1.2') + ' [1]) приняты следующие значения:', { keepNext: true });
    inputList(doc, P, ctx);
    if (T2) doc.p('Предельно допустимая концентрация пыли ПДК = ' + fin(P.pdk_dust) + ' мг/м³ [1].');
    else {
    cnt.tab++;
    doc.p('Фоновые концентрации и предельно допустимые концентрации вредных веществ [1] приведены в таблице ' + cnt.tab + '.', { keepNext: true });
    doc.p('Таблица ' + cnt.tab + ' – Фоновые концентрации и ПДК вредных веществ [1]', { style: 'TableCaption' });
    doc.table(['Вещество', 'C<sub>ф</sub>, мг/м³', 'ПДК, мг/м³', 'F'], R.sub.map(x => [x.s.name + (x.key === 'dust' ? '' : ' (' + x.s.html + ')'), ctx.L.fin(x.Cf), ctx.L.fin(x.PDK), ctx.L.fin(x.F)]), { cols: [3954, 1800, 1800, 1800] });
    }
    }
    ['s1', 's2', 's3'].forEach((tab, i) => {
      H2((i + 1) + ' ' + (SP ? SP.rep.stages[i] : META.stages[tab]));
      cnt.sec = i + 1; cnt.sub = 0;
      addItems(doc, R['L' + (i + 1)].items, ctx, opt, cnt);
    });
    doc.p('Вывод', { style: 'Heading2' });
    conclusions(R, ctx.L, opt.ext).forEach(t => doc.html(t));
    if (T.secSrc !== false) {
      doc.p('Список использованных источников', { style: 'Heading2', pageBreakBefore: !!READ });
      const src = [T.src || META.src];
      if (!SP && opt.ext && (P.prof || P.hmin)) src.push(META.ond);
      src.forEach((t, k) => doc.p((k + 1) + ' ' + t.replace(/\.?$/, '.')));
    } else doc.body = doc.body.map(x => x.replace(/ \[1\]/g, ''));   // без списка источников ссылки [1] не нужны
    return doc.build({ title: 'Отчёт: задача 1.' + R.task + ', вариант ' + P.variant, author: T.student || '' });
  }
  root.REPORT = { build, META, conclusions };
})(typeof window !== 'undefined' ? window : globalThis);
