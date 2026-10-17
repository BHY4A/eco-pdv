/* charts.js — графики (Plotly): распределение приземных концентраций и сравнение M с ПДВ */
(function (root) {
  'use strict';
  function tok(name, fb) {
    try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch (e) { return fb; }
  }
  function theme(forExport) {
    /* для отчёта — чёрно-белый рисунок: кривые различаются типом линии */
    if (forExport) return { mono: true, bg: '#ffffff', paper: '#ffffff', fg: '#000000', grid: '#d0d0d0', axis: '#000000', c: ['#000000', '#000000', '#000000', '#000000', '#000000'], muted: '#555555', bad: '#000000', ok: '#9a9a9a', zone: 'rgba(0,0,0,0)' };
    return {
      bg: tok('--plot-bg', '#fff'), paper: tok('--sheet', '#fff'), fg: tok('--fg', '#1b232c'), grid: tok('--grid', '#d9dee4'), axis: tok('--axis', '#3a4653'),
      c: [tok('--c1', '#0072BD'), tok('--c2', '#D95319'), tok('--c3', '#C9971A'), tok('--c4', '#7E2F8E'), tok('--c5', '#77AC30')],
      muted: tok('--muted', '#5b6876'), bad: tok('--bad', '#c0392b'), ok: tok('--ok', '#2b7a4b'), zone: tok('--zone', 'rgba(192,57,43,0.08)')
    };
  }
  function axis(th, title, extra) {
    return Object.assign({
      title: { text: title, font: { size: 12, color: th.fg }, standoff: 6 }, showline: true, mirror: true, linecolor: th.axis, linewidth: 1,
      ticks: 'inside', exponentformat: 'power', tickcolor: th.axis, tickfont: { size: 11, color: th.fg }, gridcolor: th.grid, griddash: 'dot', zeroline: false, automargin: true
    }, extra || {});
  }
  function baseLayout(th, h) {
    return {
      height: h || 340, separators: ', ', margin: { l: 58, r: 14, t: 34, b: 46 }, paper_bgcolor: th.paper, plot_bgcolor: th.bg,
      font: { family: tok('--f-body', '"IBM Plex Sans", "Segoe UI", Roboto, Arial, sans-serif'), size: 12, color: th.fg },
      showlegend: true, hovermode: 'x unified', hoverlabel: { font: { family: tok('--f-mono', '"IBM Plex Mono", monospace'), size: 11 } },
      legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', bgcolor: 'rgba(0,0,0,0)', font: { size: 11 } }
    };
  }
  function prep(el) { if (el) { const w = el.querySelector('.plot-wait'); if (w) w.remove(); } }
  const config = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines'], toImageButtonOptions: { format: 'png', scale: 2 } };

  /* профиль (C(x)+Cф)/ПДК: curves = [{x, y, name}] */
  function profile(el, curves, marks, opt) {
    opt = opt || {};
    const th = theme(opt.export);
    const dashes = th.mono ? ['dot', 'dash', 'dashdot', 'solid'] : ['solid', 'dash', 'dashdot', 'solid'];
    const data = curves.map((c, k) => ({ x: c.x, y: c.y, name: c.name, type: 'scatter', mode: 'lines', line: { color: th.c[k % th.c.length], width: k === 3 ? 2.4 : 1.7, dash: dashes[k % 4] }, hovertemplate: c.name + ': %{y:.3f}<extra></extra>' }));
    const xmax = Math.max(...curves.map(c => c.x[c.x.length - 1]));
    const ymax = Math.max(1.15, ...curves.map(c => Math.max(...c.y))) * 1.08;
    data.unshift({ x: [0, xmax, xmax, 0], y: [1, 1, ymax, ymax], type: 'scatter', mode: 'lines', fill: 'toself', fillcolor: th.zone, line: { width: 0 }, hoverinfo: 'skip', showlegend: false });
    const lay = baseLayout(th, opt.h || 360);
    lay.xaxis = axis(th, 'x — расстояние от трубы по оси факела, м', { range: [0, xmax] });
    lay.yaxis = axis(th, '(C + Cф) / ПДК', { range: [0, ymax] });
    lay.shapes = [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 1, y1: 1, line: { color: th.bad, width: 1.3, dash: 'dash' } }]
      .concat((marks || []).map(m => ({ type: 'line', xref: 'x', x0: m.x, x1: m.x, yref: 'paper', y0: 0, y1: 1, line: { color: th.muted, width: 1, dash: 'dot' } })));
    lay.annotations = [{ xref: 'paper', x: 1, y: 1, yref: 'y', xanchor: 'right', yanchor: 'bottom', text: 'ПДК', showarrow: false, font: { size: 11, color: th.bad } }]
      .concat((marks || []).map(m => ({ xref: 'x', x: m.x, yref: 'paper', y: m.y || 0.02, xanchor: 'left', text: ' ' + m.t, showarrow: false, font: { size: 10.5, color: th.muted } })));
    prep(el); return Plotly.react(el, data, lay, config);
  }
  /* столбцы M и ПДВ по веществам (логарифмическая шкала) */
  function bars(el, cats, M, PDV, opt) {
    opt = opt || {};
    const th = theme(opt.export);
    const lbl = v => (+v.toPrecision(4)).toString().replace('.', ',');
    const data = [
      { x: cats, y: M, name: 'M — фактический выброс', type: 'bar', marker: th.mono ? { color: M.map((v, k) => v > PDV[k] ? '#ffffff' : '#404040'), line: { color: '#000', width: 1 }, pattern: { shape: M.map((v, k) => v > PDV[k] ? '/' : ''), fgcolor: '#000000', size: 7, solidity: 0.3, fillmode: 'overlay' } } : { color: M.map((v, k) => v > PDV[k] ? th.bad : th.c[0]) }, text: M.map(lbl), textposition: 'outside', cliponaxis: false, hovertemplate: 'M = %{y:.4g} г/с<extra></extra>' },
      { x: cats, y: PDV.map(v => v > 0 ? v : null), name: 'ПДВ', type: 'bar', marker: th.mono ? { color: '#bdbdbd', line: { color: '#000', width: 0.8 } } : { color: th.ok, opacity: 0.75 }, text: PDV.map(lbl), textposition: 'outside', cliponaxis: false, hovertemplate: 'ПДВ = %{y:.4g} г/с<extra></extra>' }
    ];
    const lay = baseLayout(th, opt.h || 340);
    lay.barmode = 'group'; lay.bargap = 0.3; lay.hovermode = 'x';
    lay.xaxis = axis(th, '', { showgrid: false });
    const all = M.concat(PDV).filter(v => v > 0);
    lay.yaxis = axis(th, 'Выброс, г/с (лог. шкала)', { type: 'log', range: [Math.floor(Math.log10(Math.min(...all))) - 0.1, Math.ceil(Math.log10(Math.max(...all))) + 0.35] });
    prep(el); return Plotly.react(el, data, lay, config);
  }
  root.CHARTS = { profile, bars, theme, config };
})(typeof window !== 'undefined' ? window : globalThis);
