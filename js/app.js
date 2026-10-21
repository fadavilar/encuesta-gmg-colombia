/* Motor de la encuesta: navegación por partes, guardado local, saltos, código de hogar y envío. */
(function () {
  'use strict';

  const E = window.ENCUESTAS;
  const CFG = window.ENCUESTA_CONFIG;
  const app = document.getElementById('app');
  const params = new URLSearchParams(location.search);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
  };
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  const fmtPesos = d => d ? Number(d).toLocaleString('es-CO') : '';
  const hoy = () => new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  let S = null;   // definición de la encuesta activa
  let st = null;  // estado: { id, rol, codigo, hogar, paso, inicio, r: {respuestas} }
  let saveTimer = null;

  /* ---------- preferencias de lectura (tema y tamaño de letra) ---------- */
  const prefs = LS.get('gmg:prefs') || {};
  function applyPrefs() {
    const root = document.documentElement;
    if (prefs.theme) root.setAttribute('data-theme', prefs.theme); else root.removeAttribute('data-theme');
    root.style.fontSize = (prefs.size || 112.5) + '%';
  }
  applyPrefs();
  document.getElementById('btn-theme').addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!prefs.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    prefs.theme = dark ? 'light' : 'dark';
    LS.set('gmg:prefs', prefs); applyPrefs();
  });
  document.getElementById('btn-font-up').addEventListener('click', () => {
    prefs.size = Math.min(150, (prefs.size || 112.5) + 12.5); LS.set('gmg:prefs', prefs); applyPrefs();
  });
  document.getElementById('btn-font-down').addEventListener('click', () => {
    prefs.size = Math.max(87.5, (prefs.size || 112.5) - 12.5); LS.set('gmg:prefs', prefs); applyPrefs();
  });

  /* ---------- código de hogar (une paciente y cuidador) ---------- */
  const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function nuevoCodigo() {
    const a = new Uint8Array(6);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; });
    return 'H-' + Array.from(a, x => ALFABETO[x % ALFABETO.length]).join('');
  }
  const normCodigo = s => String(s || '').toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '').slice(0, 20);
  const otroRol = () => (S.rol === 'paciente' ? 'cuidador' : 'paciente');
  const enlaceOtro = () => location.origin + location.pathname + '?r=' + otroRol() + '&c=' + encodeURIComponent(st.hogar.codigo);
  const vincula = () => st.r.consent_vinculacion === 'Sí';

  /* ---------- claves de variables ---------- */
  const costRows = () => E.COSTOS.filter(c => typeof c === 'string');
  const pad2 = i => String(i).padStart(2, '0');
  function itemKeys(it) {
    switch (it.t) {
      case 'single': case 'multi': case 'long':
        return [[it.k, it.label || '']].concat(it.otro ? [[it.k + '_otro', 'Otro, ¿cuál?']] : []);
      case 'nums': case 'texts':
        return it.f.map(f => [f[0] ? it.k + '_' + f[0] : it.k, f[1] + (f[2] ? ' (' + f[2].replace(/[()]/g, '') + ')' : '')]);
      case 'place':
        return [[it.k + '_depto', 'Departamento'], [it.k + '_municipio', 'Municipio']];
      case 'grid':
        return it.rows.map((r, i) => [it.k + '_' + (i + 1), r]);
      case 'adl':
        return it.rows.map((r, i) => [it.k + '_' + (i + 1), r[0] + ' (0–3)'])
          .concat([[it.k + '_total', 'Puntaje total MG-ADL (0–24; solo si respondió las 8 actividades)'],
            [it.k + '_banda', 'Severidad según MG-ADL: leve 0–4, moderada 5–9, grave ≥10']]);
      case 'costs': {
        const out = [];
        costRows().forEach((c, i) => {
          const b = it.k + '_' + pad2(i + 1);
          if (c.startsWith('Otros')) out.push([b + '_cual', c + ' — ¿cuáles?']);
          out.push([b + '_tipico', c + ' — mes típico ($)'], [b + '_malo', c + ' — mes malo ($)'],
            [b + '_anual', c + ' — últimos 12 meses ($)'], [b + '_quien', c + ' — ¿quién lo paga?']);
        });
        return out;
      }
      case 'invest': {
        const out = [];
        E.ADAPTACIONES.forEach((c, i) => {
          const b = it.k + '_' + pad2(i + 1);
          if (c.startsWith('Otra')) out.push([b + '_cual', c + ' — ¿cuál?']);
          out.push([b + '_estado', c + ' — situación'], [b + '_costo', c + ' — costo total ($)'],
            [b + '_anio', c + ' — año'], [b + '_quien', c + ' — ¿quién lo pagó?']);
        });
        return out;
      }
      case 'vinculo':
        return [[it.k, 'Clave de respaldo para unir paciente y cuidador (SHA-256 de iniciales y día/mes de nacimiento de la persona con miastenia; no reversible a simple vista)']];
    }
    return [];
  }
  // Campos que solo viven en el dispositivo (no se envían tal cual).
  const rawKeys = it => it.t === 'vinculo' ? ['_ini1', '_ini2', '_dia', '_mes'].map(s => it.k + s) : [];
  const allQuestions = () => S.partes.flatMap(p => p.preguntas);
  const qById = id => allQuestions().find(q => q.id === id);
  const test = fn => { try { return !!fn(st.r); } catch (e) { return true; } };
  const qVisible = q => !q.showIf || test(q.showIf);
  const itVisible = it => !it.showIf || test(it.showIf);
  const hasValue = v => Array.isArray(v) ? v.length > 0 : (v != null && String(v).trim() !== '');
  const qAnswered = q => q.items.some(it => itemKeys(it).concat(rawKeys(it).map(k => [k])).some(([k]) => hasValue(st.r[k])));

  /* ---------- estado ---------- */
  const storeKey = () => 'gmg:' + S.rol + ':' + (st && st.codigo ? st.codigo : 'sin-codigo');
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { LS.set(storeKey(), st); flashSaved(); }, 250);
  }
  function flashSaved() {
    const el = document.getElementById('saved');
    if (!el) return;
    el.textContent = 'Guardado en este dispositivo · ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  function loadState(rol, codigo) {
    S = E[rol];
    st = { codigo };
    const prev = LS.get(storeKey());
    st = prev && prev.rol === rol ? prev : { id: uid(), rol, codigo, paso: 0, inicio: null, r: {} };
    st.codigo = codigo;
    if (!st.enviado && !st.hogar) st.hogar = codigo ? { codigo: normCodigo(codigo), origen: 'enlace' } : { codigo: nuevoCodigo(), origen: 'generado' };
  }

  /* ---------- render de ítems ---------- */
  function fieldNum(k, label, unit, lim) {
    const v = st.r[k] || '';
    const pesos = unit === 'pesos';
    const dec = /hora/.test(unit);
    return `<label class="field num">
      <span class="f-label">${esc(label)}</span>
      <span class="f-input">
        <input type="text" inputmode="${dec ? 'decimal' : 'numeric'}" autocomplete="off" data-k="${k}" data-num="1"
          ${pesos ? 'data-pesos="1"' : ''} ${dec ? 'data-dec="1"' : ''}
          ${lim && lim.min != null ? `data-min="${lim.min}"` : ''} ${lim && lim.max != null ? `data-max="${lim.max}"` : ''}
          value="${esc(pesos ? fmtPesos(v) : v)}" ${pesos ? 'placeholder="$"' : ''}>
        ${unit ? `<span class="unit">${esc(unit)}</span>` : ''}
      </span>
      <span class="warn" hidden></span>
    </label>`;
  }
  function fieldText(k, label, ph, max) {
    return `<label class="field"><span class="f-label">${esc(label)}</span>
      <input type="text" data-k="${k}" value="${esc(st.r[k] || '')}" maxlength="${max || 300}" ${ph ? `placeholder="${esc(ph)}"` : ''}></label>`;
  }
  function fieldSelect(k, label, opts) {
    const v = st.r[k] || '';
    return `<label class="field"><span class="f-label">${esc(label)}</span>
      <select data-k="${k}"><option value="">—</option>${opts.map(x => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>`;
  }
  const otroField = it => it.otro ? fieldText(it.k + '_otro', 'Otro, ¿cuál?') : '';
  const legend = (it, q) => it.label ? `<legend class="item-label">${esc(it.label)}</legend>` : `<legend class="sr-only">${esc(q.q)}</legend>`;

  function renderItem(it, q) {
    const v = st.r[it.k];
    switch (it.t) {
      case 'single':
        return `<fieldset class="opts">${legend(it, q)}${it.o.map(o => `
          <label class="opt"><input type="radio" name="${it.k}" value="${esc(o)}" data-k="${it.k}" ${v === o ? 'checked' : ''}>
          <span>${esc(o)}${it.saltoN && it.saltoN[o] ? ` <em class="jump">→ pasa a la pregunta ${it.saltoN[o]}</em>` : ''}</span></label>`).join('')}
          </fieldset>${otroField(it)}`;
      case 'multi': {
        const arr = Array.isArray(v) ? v : [];
        const ex = it.excl || [];
        return `<fieldset class="opts">${legend(it, q)}${it.o.map(o => `
          <label class="opt"><input type="checkbox" value="${esc(o)}" data-k="${it.k}" ${ex.includes(o) ? 'data-excl="1"' : ''} ${arr.includes(o) ? 'checked' : ''}>
          <span>${esc(o)}</span></label>`).join('')}
          </fieldset>${otroField(it)}`;
      }
      case 'nums':
        return `<div class="fields">${it.f.map(f => fieldNum(f[0] ? it.k + '_' + f[0] : it.k, f[1], f[2], f[3])).join('')}</div>`;
      case 'texts':
        return `<div class="fields">${it.f.map(f => fieldText(f[0] ? it.k + '_' + f[0] : it.k, f[1])).join('')}</div>`;
      case 'place': {
        const d = st.r[it.k + '_depto'] || '';
        return `<div class="fields">
          <label class="field"><span class="f-label">Departamento</span>
            <select data-k="${it.k}_depto"><option value="">— Seleccione —</option>
            ${E.DEPARTAMENTOS.map(x => `<option ${x === d ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
          ${fieldText(it.k + '_municipio', 'Municipio')}</div>`;
      }
      case 'grid': {
        const compact = it.cols.every(c => c.length <= 2);
        return `<div class="grid ${compact ? 'grid-compact' : ''}">${it.rows.map((row, i) => {
          const k = it.k + '_' + (i + 1);
          return `<fieldset class="grow"><legend>${esc(row)}</legend><div class="pills">${it.cols.map(c => `
            <label class="pill"><input type="radio" name="${k}" value="${esc(c)}" data-k="${k}" ${st.r[k] === c ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}
            </div></fieldset>`;
        }).join('')}</div>`;
      }
      case 'adl':
        return `<div class="grid adl">${it.rows.map(([act, anclas], i) => {
          const k = it.k + '_' + (i + 1);
          return `<fieldset class="grow"><legend>${esc(act)}</legend><div class="opts adl-opts">${anclas.map((a, s) => `
            <label class="opt"><input type="radio" name="${k}" value="${s}" data-k="${k}" ${st.r[k] === String(s) ? 'checked' : ''}>
            <span><b class="score">${s}</b> ${esc(a)}</span></label>`).join('')}</div></fieldset>`;
        }).join('')}</div>`;
      case 'long':
        return `<label class="field"><span class="sr-only">${esc(q.q)}</span>
          <textarea data-k="${it.k}" rows="4" maxlength="5000" placeholder="Escriba aquí…">${esc(v || '')}</textarea></label>`;
      case 'costs': {
        let i = 0;
        return `<div class="costs">${E.COSTOS.map(c => {
          if (typeof c !== 'string') return `<h4 class="cost-group">${esc(c.grupo)}</h4>`;
          const b = it.k + '_' + pad2(++i);
          return `<fieldset class="cost"><legend>${esc(c)}</legend>
            ${c.startsWith('Otros') ? fieldText(b + '_cual', '¿Cuáles?') : ''}
            <div class="cost-fields">
              ${fieldNum(b + '_tipico', 'En un mes típico', 'pesos')}
              ${fieldNum(b + '_malo', 'En un mes malo', 'pesos')}
              ${fieldNum(b + '_anual', 'En los últimos 12 meses', 'pesos')}
              ${fieldSelect(b + '_quien', '¿Quién lo paga?', ['Yo', 'Familiar', 'EPS', 'Otro'])}
            </div></fieldset>`;
        }).join('')}</div>`;
      }
      case 'invest':
        return `<div class="costs">${E.ADAPTACIONES.map((c, i) => {
          const b = it.k + '_' + pad2(i + 1);
          const hecho = st.r[b + '_estado'] === 'Lo hicimos o lo compramos';
          return `<fieldset class="cost invest"><legend>${esc(c)}</legend>
            ${c.startsWith('Otra') ? fieldText(b + '_cual', '¿Cuál?') : ''}
            <div class="pills invest-estado">${['No ha sido necesario', 'Lo hicimos o lo compramos', 'Lo necesitamos y no hemos podido'].map(o => `
              <label class="pill"><input type="radio" name="${b}_estado" value="${o}" data-k="${b}_estado" ${st.r[b + '_estado'] === o ? 'checked' : ''}><span>${o}</span></label>`).join('')}</div>
            <div class="cost-fields invest-detalle" data-invest="${b}" ${hecho ? '' : 'hidden'}>
              ${fieldNum(b + '_costo', 'Costo total aproximado', 'pesos')}
              ${fieldNum(b + '_anio', 'Año', '', { min: 1980, max: 2026 })}
              ${fieldSelect(b + '_quien', '¿Quién lo pagó?', ['Yo o mi hogar', 'Otro familiar', 'EPS', 'Fundación o donación', 'Otro'])}
            </div></fieldset>`;
        }).join('')}</div>`;
      case 'vinculo': {
        const mes = st.r[it.k + '_mes'] || '';
        return `<div class="fields vinculo">
          ${fieldText(it.k + '_ini1', `Primera letra del primer nombre de ${it.persona === 'usted' ? 'usted' : 'su familiar'}`, 'Ej.: M', 1)}
          ${fieldText(it.k + '_ini2', `Primera letra del primer apellido de ${it.persona === 'usted' ? 'usted' : 'su familiar'}`, 'Ej.: R', 1)}
          ${fieldNum(it.k + '_dia', `Día de nacimiento de ${it.persona === 'usted' ? 'usted' : 'su familiar'}`, '', { min: 1, max: 31 })}
          <label class="field"><span class="f-label">Mes de nacimiento de ${it.persona === 'usted' ? 'usted' : 'su familiar'}</span>
            <select data-k="${it.k}_mes"><option value="">—</option>${MESES.map((m, i) => `<option value="${i + 1}" ${String(i + 1) === mes ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        </div>`;
      }
    }
    return '';
  }

  const refLink = r => `${esc(r.cita)} <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https:\/\/(doi\.org\/)?/, r.url.includes('doi.org') ? 'doi:' : ''))}</a>`;
  const fuenteHtml = f => `<details class="fuente"><summary>Fuente: ${esc(f.instrumento)}</summary>
      <ul>${f.refs.map(r => `<li>${refLink(r)}</li>`).join('')}</ul></details>`;

  function renderQuestion(q) {
    // En preguntas sensibles el distintivo ya dice que es opcional; no se repite en la nota.
    const note = q.s ? (q.note || '').replace(/^Pregunta opcional: puede dejarla en blanco\.\s*/, '') : q.note;
    return `<section class="q ${qAnswered(q) ? 'is-answered' : ''}" id="q-${q.id}" data-qid="${q.id}" ${qVisible(q) ? '' : 'hidden'}>
      <header class="q-head"><span class="q-num" aria-hidden="true">${q.n}</span>
        <h3 class="q-text"><span class="sr-only">Pregunta ${q.n}. </span>${esc(q.q)}</h3></header>
      ${q.s ? '<p class="badge-sens">Tema sensible · puede dejarla en blanco</p>' : ''}
      ${note ? `<p class="q-note">${esc(note)}</p>` : ''}
      ${q.items.map((it, i) => `<div class="item" data-item="${i}" ${itVisible(it) ? '' : 'hidden'}>${renderItem(it, q)}</div>`).join('')}
      ${q.fuente ? fuenteHtml(E.FUENTES[q.fuente]) : ''}
      <button type="button" class="link-btn" data-clear="${q.id}">Borrar mi respuesta</button>
    </section>`;
  }

  /* ---------- bloque del código de hogar ---------- */
  function hogarHtml(final) {
    const otro = S.rol === 'paciente' ? 'su cuidador(a)' : 'su familiar con miastenia';
    if (!vincula()) {
      return final ? '' : `<div class="callout hogar"><p>Usted eligió no unir sus respuestas con las de ${otro}. Si cambia de opinión, puede marcarlo en “Su decisión”, en el consentimiento.</p></div>`;
    }
    const link = enlaceOtro();
    const msg = `Hola. Estoy respondiendo la encuesta sobre la vida con miastenia gravis en Colombia. Para que nuestras respuestas queden unidas, responde la tuya desde este enlace (código de hogar ${st.hogar.codigo}): ${link}`;
    return `<div class="callout hogar" id="hogar">
      <h3>Código de hogar</h3>
      <p class="code-big mono">${esc(st.hogar.codigo)}</p>
      <p>Si ${otro} también va a responder, envíele este enlace. Así sus respuestas se analizan juntas, sin usar nombres, y ninguno de los dos verá las respuestas del otro.</p>
      <div class="share">
        <a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enviar por WhatsApp</a>
        <button type="button" class="btn" id="btn-copy" data-link="${esc(link)}">Copiar enlace</button>
        <span id="copy-status" class="muted" role="status"></span>
      </div>
      ${final ? '' : `<details class="hogar-otro" ${st.hogar.origen === 'ingresado' ? 'open' : ''}>
        <summary>¿${S.rol === 'paciente' ? 'Su cuidador(a)' : 'Su familiar'} ya respondió y le compartió un código de hogar?</summary>
        <div class="hogar-form">
          <label class="field"><span class="f-label">Escriba el código que le compartieron</span>
            <input type="text" id="hogar-input" maxlength="20" placeholder="Ej.: H-7K4P2Q" autocomplete="off"></label>
          <button type="button" class="btn" id="btn-hogar">Usar este código</button>
        </div>
        <p class="error" id="hogar-error" role="alert" hidden></p>
      </details>`}
    </div>`;
  }

  /* ---------- pantallas ---------- */
  const totalSteps = () => S.partes.length + 2; // consentimiento + partes + revisión

  function progressHtml() {
    const n = S.partes.length;
    const p = st.paso;
    const label = p === 0 ? 'Consentimiento informado' : p <= n ? `Parte ${p} de ${n}` : 'Revisión y envío';
    const pct = Math.round((p / (totalSteps() - 1)) * 100);
    return `<div class="progress" role="navigation" aria-label="Avance">
      <div class="progress-top"><span>${label}</span><span id="saved" class="saved"></span></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
      ${p > 0 ? `<ol class="steps">${S.partes.map((pt, i) => `<li><button type="button" data-go="${i + 1}" class="${i + 1 === p ? 'current' : ''}" aria-label="Ir a la parte ${i + 1}: ${esc(pt.titulo)}" ${i + 1 === p ? 'aria-current="step"' : ''}>${i + 1}</button></li>`).join('')}
        <li><button type="button" data-go="${n + 1}" class="${p === n + 1 ? 'current' : ''}" aria-label="Ir a revisión y envío">✓</button></li></ol>` : ''}
    </div>`;
  }

  function show(html, focusSel) {
    app.innerHTML = html;
    window.scrollTo(0, 0);
    const h = app.querySelector(focusSel || 'h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function contactoHtml() {
    const inv = CFG.investigador;
    return `${esc(inv.nombre)} · <a href="tel:+57${esc(inv.telefono)}">${esc(inv.telefono)}</a> · <a href="mailto:${esc(inv.correo)}">${esc(inv.correo)}</a>`;
  }

  function screenInicio() {
    const saved = ['paciente', 'cuidador'].map(r => {
      const s = LS.get('gmg:' + r + ':' + (codigoURL || 'sin-codigo'));
      return s && !s.enviado && s.inicio ? r : null;
    }).filter(Boolean);
    const c = codigoURL ? '&c=' + encodeURIComponent(codigoURL) : '';
    show(`<div class="hero">
      <p class="eyebrow">${esc(CFG.estudio)}</p>
      <h2>¿Quién responde la encuesta?</h2>
      <p class="lead">Gracias por su interés. Queremos conocer cómo es vivir con miastenia gravis generalizada y recibir atención en Colombia, y cómo la enfermedad afecta el trabajo, el tiempo y los gastos de los pacientes y de quienes los cuidan.</p>
      <p>Hay una encuesta para personas con miastenia gravis generalizada y otra para sus cuidadores. Si en su hogar responden los dos, cada uno llena la suya por separado. Elija la que le corresponde:</p>
      <div class="choices">
        <a class="choice" href="?r=paciente${c}">
          <strong>Soy paciente</strong><span>Tengo miastenia gravis generalizada · ${esc(E.paciente.tiempo)}</span>
          ${saved.includes('paciente') ? '<em>Tiene respuestas guardadas: continuar</em>' : ''}</a>
        <a class="choice" href="?r=cuidador${c}">
          <strong>Soy cuidador(a)</strong><span>Acompaño a una persona con miastenia gravis · ${esc(E.cuidador.tiempo)}</span>
          ${saved.includes('cuidador') ? '<em>Tiene respuestas guardadas: continuar</em>' : ''}</a>
      </div>
      <ul class="facts">
        <li><strong>Voluntaria y confidencial.</strong> Antes de empezar leerá el consentimiento informado. Su nombre no aparecerá en los resultados.</li>
        <li><strong>Paciente y cuidador, unidos por un código.</strong> Quien empiece recibe un código de hogar y puede enviárselo al otro por WhatsApp. Así sus respuestas se analizan juntas, sin nombres.</li>
        <li><strong>A su ritmo y sin cifras exactas.</strong> Sus respuestas se guardan en este dispositivo. Para dinero o tiempo, un cálculo aproximado es suficiente.</li>
      </ul>
      <p class="muted">${esc(CFG.alternativas)} ${contactoHtml()}</p>
    </div>
    <section class="sources" aria-labelledby="fuentes-h">
      <h3 id="fuentes-h">Fuentes de los instrumentos y de los costos que se preguntan</h3>
      ${Object.values(E.FUENTES).map(f => `<div class="source"><p><strong>${esc(f.instrumento)}</strong> <span class="muted">· ${esc(f.usadaEn)}</span></p>
        <ul>${f.refs.map(r => `<li>${refLink(r)}</li>`).join('')}</ul></div>`).join('')}
    </section>`);
  }

  function screenConsentimiento() {
    const c = S.consentimiento;
    const inv = CFG.investigador;
    const r = st.r;
    const otro = S.rol === 'paciente' ? 'cuidador(a)' : 'familiar';
    show(`${progressHtml()}
    <article class="paper">
      <p class="eyebrow">${esc(CFG.estudio)}</p>
      <h2>${esc(S.titulo)}</h2>
      <p class="muted">${esc(S.subtitulo)} · <a href="?r=${otroRol()}${st.codigo ? '&c=' + encodeURIComponent(st.codigo) : ''}">${S.rol === 'paciente' ? '¿No es paciente? Cambiar a la encuesta de cuidadores' : '¿No es cuidador(a)? Cambiar a la encuesta de pacientes'}</a></p>
      <p class="lead">${esc(S.bienvenida)}</p>

      <div class="callout">
        <h3>Cómo responder</h3>
        <ul>
          <li>Responda usted mismo(a). No hay respuestas buenas ni malas: nos interesa su experiencia.</li>
          <li>Para marcar una opción, tóquela o haga clic sobre ella. En los recuadros escriba su respuesta.</li>
          <li>Algunas preguntas solo aparecen si aplican a su caso; las demás se saltan solas.</li>
          <li>Cuando le pidan dinero o tiempo, un cálculo aproximado es suficiente. No necesita facturas. Si no sabe, deje en blanco.</li>
          <li>Las preguntas marcadas como <span class="badge-sens inline">Tema sensible</span> tratan temas sensibles (salud mental, trabajo, dinero, origen étnico). Puede dejarlas en blanco.</li>
          <li>Puede hacer pausas y continuar después: sus respuestas se guardan en este dispositivo y navegador. Vuelva a abrir el mismo enlace para seguir.</li>
          <li>Si se cansa o le cuesta escribir, puede pedir a alguien de confianza que le ayude a marcar, pero las respuestas deben ser las suyas.</li>
          <li>Cuando termine, toque <strong>Enviar mis respuestas</strong> al final.</li>
        </ul>
        <p><strong>Tiempo aproximado:</strong> ${esc(S.tiempo)}.</p>
        <p>${esc(CFG.alternativas)} ${contactoHtml()}</p>
      </div>

      <h2 class="h-consent">Consentimiento informado</h2>
      <p>Lea este texto con calma. Si tiene dudas, puede escribir o llamar a las personas de contacto antes de decidir.</p>
      <h3>¿De qué se trata?</h3><p>${esc(c.trata)}</p>
      <h3>¿Quién realiza y financia el estudio?</h3><p>${esc(CFG.realiza)}</p>
      <h3>¿Qué se le pide?</h3><ul>${c.pide.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      ${c.terceros ? `<p>${esc(c.terceros)}</p>` : ''}
      <h3>¿Cómo se unen sus respuestas con las de su ${otro}?</h3>
      <p>Cuando un paciente y su cuidador(a) participan, sus respuestas se pueden unir para analizar cómo cambian los gastos y el tiempo de cuidado según la intensidad de la enfermedad. Para eso se usa un <strong>código de hogar</strong> (por ejemplo, H-7K4P2Q) que uno de los dos le comparte al otro. Si no lo comparten, se puede usar un código que se calcula en su dispositivo a partir de las iniciales y el día y mes de nacimiento de la persona con miastenia; esos datos no se envían tal como se escriben. No se usan nombres, y ninguno de los dos podrá ver las respuestas del otro. Unir las respuestas es opcional.</p>
      <h3>Riesgos y beneficios</h3><p>${esc(c.riesgos)}</p><p>${esc(c.beneficios)}</p>
      <h3>Es voluntario</h3><p>${esc(c.voluntario)}</p>
      <h3>Confidencialidad de sus datos</h3>
      <p>Sus datos de salud, trabajo, ingresos y origen étnico son información sensible; responder las preguntas marcadas como tema sensible es opcional. No le pedimos su nombre ni su documento de identidad. En los resultados se usará solo un código. Las respuestas se envían por una conexión cifrada y se guardan en una hoja de cálculo de Google (un servicio en la nube cuyos servidores pueden estar fuera de Colombia), con acceso restringido al equipo investigador, durante ${esc(CFG.conservacion)}. Los resultados se presentarán de forma agregada o anonimizada.</p>
      <p>De acuerdo con la Ley 1581 de 2012 y sus decretos reglamentarios, usted tiene derecho a conocer, actualizar y rectificar sus datos, a solicitar su supresión y a revocar esta autorización. Responsable del tratamiento: ${esc(CFG.responsableDatos)}. Para ejercer estos derechos escriba a <a href="mailto:${esc(inv.correo)}">${esc(inv.correo)}</a>, indicando el código de envío que verá al final.</p>
      <h3>Costos y compensación</h3><p>Participar no tiene costo para usted y no recibirá pago por participar.</p>
      <h3>¿Conocerá los resultados?</h3><p>${esc(CFG.devolucion)}</p>
      <h3>Marco normativo y contacto</h3>
      <p>Este estudio se clasifica como investigación con riesgo mínimo (art. 11, Resolución 8430 de 1993) y se rige por esa resolución, la Declaración de Helsinki y la Ley 1581 de 2012.${CFG.comiteEtica ? ' ' + esc(CFG.comiteEtica) : ''}</p>
      <p>Para dudas antes, durante o después de responder: investigador responsable ${contactoHtml()}.</p>

      <h3 id="decision">Su decisión</h3>
      <div class="grid decision">${c.decision.map(d => `<fieldset class="grow"><legend>${esc(d.t)}</legend><div class="pills">
          ${['Sí', 'No'].map(o => `<label class="pill"><input type="radio" name="${d.k}" value="${o}" data-k="${d.k}" ${r[d.k] === o ? 'checked' : ''}><span>${o}</span></label>`).join('')}
          </div></fieldset>`).join('')}</div>
      <p class="muted">Las cinco primeras líneas son necesarias para participar. Si respondió “No” en alguna de ellas, le agradecemos su interés: no continúe con la encuesta. Las dos últimas son opcionales.</p>
      <div id="contacto-wrap" ${r.consent_recontacto === 'Sí' ? '' : 'hidden'}>
        ${fieldText('consent_contacto', 'Nombre y teléfono o correo para contactarlo', 'Solo si autorizó que lo contactemos', 200)}
      </div>
      <div class="fields">
        <div class="field"><span class="f-label">Fecha</span><span class="static">${esc(hoy())}</span></div>
      </div>
      <label class="opt accept"><input type="checkbox" data-k="consent_acepta" value="Sí" ${Array.isArray(r.consent_acepta) && r.consent_acepta.length ? 'checked' : ''}>
        <span><strong>Aceptación electrónica:</strong> marcar esta casilla equivale a mi firma.</span></label>
      <p class="error" id="consent-error" role="alert" hidden></p>
      <div class="nav"><span></span><button type="button" class="btn primary" id="btn-start">Comenzar la encuesta</button></div>
      <p class="restart"><button type="button" class="link-btn" id="btn-reset">Borrar mis respuestas guardadas y empezar de nuevo</button></p>
    </article>`);
    if (st.inicio) flashSaved();
  }

  function screenParte(idx) {
    const parte = S.partes[idx];
    const n = S.partes.length;
    show(`${progressHtml()}
      <div class="part-head">
        <p class="eyebrow">Parte ${idx + 1} · ≈ ${parte.min} min</p>
        <h2>${esc(parte.titulo)}</h2>
        ${parte.intro ? `<p class="lead">${esc(parte.intro)}</p>` : ''}
      </div>
      ${idx === 0 ? hogarHtml(false) : ''}
      <form class="questions" onsubmit="return false" novalidate>
        ${parte.preguntas.map(renderQuestion).join('')}
      </form>
      <div class="nav">
        <button type="button" class="btn" data-go="${idx}">← Anterior</button>
        <button type="button" class="btn primary" data-go="${idx + 2}">${idx + 1 < n ? 'Siguiente: Parte ' + (idx + 2) + ' →' : 'Revisar y enviar →'}</button>
      </div>`);
    flashSaved();
  }

  function screenRevision() {
    const n = S.partes.length;
    let pending = 0;
    const rows = S.partes.map((p, i) => {
      const vis = p.preguntas.filter(qVisible);
      const miss = vis.filter(q => !qAnswered(q));
      pending += miss.length;
      return `<li class="rev-part"><div class="rev-head"><strong>Parte ${i + 1}. ${esc(p.titulo)}</strong>
        <span class="muted">${vis.length - miss.length} de ${vis.length} respondidas</span></div>
        ${miss.length ? `<div class="chips">${miss.map(q => `<button type="button" class="chip" data-goq="${q.id}" title="${esc(q.q)}">${q.n}</button>`).join('')}</div>` : '<span class="ok">Completa</span>'}</li>`;
    }).join('');
    show(`${progressHtml()}
      <div class="part-head"><p class="eyebrow">Último paso</p><h2>Revisión y envío</h2>
      <p class="lead">Antes de enviar, revise que no haya dejado sin marcar alguna pregunta que sí quería responder. ${pending ? 'Los números indican preguntas sin respuesta; tóquelos para ir a ellas. Puede enviar aunque queden preguntas en blanco.' : '¡Respondió todas las preguntas que le aplican!'}</p></div>
      <ul class="review">${rows}</ul>
      <div class="send-box">
        <label class="hp" aria-hidden="true">No llenar <input type="text" id="hp" tabindex="-1" autocomplete="off"></label>
        ${CFG.endpoint ? '' : '<p class="callout warn-box"><strong>Modo prueba:</strong> esta encuesta todavía no está conectada a la hoja de respuestas. Al enviar se descargará una copia de sus respuestas.</p>'}
        <button type="button" class="btn primary big" id="btn-send">Enviar mis respuestas</button>
        <div id="send-status" role="status" aria-live="polite"></div>
      </div>
      <div class="nav"><button type="button" class="btn" data-go="${n}">← Volver a la parte ${n}</button><span></span></div>`);
  }

  function screenGracias(info) {
    show(`<article class="paper center">
      <p class="eyebrow">${esc(CFG.estudio)}</p>
      <h2>Gracias por su tiempo</h2>
      <p class="lead">Sus respuestas ayudarán a que se conozca mejor la vida con miastenia gravis en Colombia.</p>
      ${info && info.id ? `<p>Sus respuestas se recibieron${info.fecha ? ' el ' + esc(info.fecha) : ''}. Código de envío: <strong class="mono">${esc(String(info.id).slice(0, 8).toUpperCase())}</strong></p>` : ''}
      ${info && info.hogarHtml ? info.hogarHtml : ''}
      <div class="callout"><h3>Si necesita apoyo</h3>
        <p>Si al responder sintió tristeza, cansancio o preocupación, puede pedir orientación psicológica a través de su EPS. Contacto del estudio: ${contactoHtml()}.</p>
        <p>Si usted o su familiar tienen una emergencia de salud, no espere: acuda a urgencias o llame a la línea de emergencias (123).</p></div>
    </article>`);
  }

  function screenNoElegible() {
    show(`<article class="paper center">
      <h2>Gracias por su interés</h2>
      <p class="lead">Según sus respuestas en “Su decisión”, no es necesario que continúe con la encuesta. No se ha enviado ninguna información.</p>
      <p>Si marcó una opción por error, puede volver y corregirla.</p>
      <div class="nav"><button type="button" class="btn" data-go="0">← Volver al consentimiento</button><span></span></div>
    </article>`);
  }

  function render() {
    const n = S.partes.length;
    if (st.paso <= 0) screenConsentimiento();
    else if (st.paso <= n) screenParte(st.paso - 1);
    else screenRevision();
  }

  function go(step) {
    if (step > 0 && !consentOk()) { st.paso = 0; render(); return; }
    st.paso = Math.max(0, Math.min(totalSteps() - 1, step));
    save(); render();
  }

  const requeridas = () => S.consentimiento.decision.filter(d => d.req);
  function consentOk() {
    const r = st.r;
    return requeridas().every(d => r[d.k] === 'Sí') && Array.isArray(r.consent_acepta) && r.consent_acepta.length > 0;
  }

  /* ---------- eventos ---------- */
  function setValue(t) {
    const k = t.dataset.k;
    if (t.type === 'radio') {
      st.r[k] = t.value;
    } else if (t.type === 'checkbox') {
      const boxes = Array.from(app.querySelectorAll('input[type=checkbox]')).filter(b => b.dataset.k === k);
      if (t.checked) boxes.forEach(b => { if (b !== t && (t.dataset.excl || b.dataset.excl)) b.checked = false; });
      const vals = boxes.filter(b => b.checked).map(b => b.value);
      if (vals.length) st.r[k] = vals; else delete st.r[k];
    } else if (t.dataset.num) {
      const raw = t.dataset.dec ? t.value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') : t.value.replace(/\D/g, '');
      if (raw) st.r[k] = raw; else delete st.r[k];
      const w = t.closest('.field').querySelector('.warn');
      const x = Number(raw);
      const min = t.dataset.min != null ? Number(t.dataset.min) : null;
      const max = t.dataset.max != null ? Number(t.dataset.max) : null;
      if (raw && ((min != null && x < min) || (max != null && x > max))) {
        w.textContent = `Revise este valor: se espera entre ${min} y ${max}.`; w.hidden = false;
      } else { w.hidden = true; }
    } else {
      const v = t.value;
      if (v.trim()) st.r[k] = v; else delete st.r[k];
    }
  }

  function refresh() {
    app.querySelectorAll('section.q').forEach(sec => {
      const q = qById(sec.dataset.qid);
      if (!q) return;
      sec.hidden = !qVisible(q);
      sec.querySelectorAll('.item').forEach(div => { div.hidden = !itVisible(q.items[Number(div.dataset.item)]); });
      sec.classList.toggle('is-answered', qAnswered(q));
    });
    app.querySelectorAll('[data-invest]').forEach(div => { div.hidden = st.r[div.dataset.invest + '_estado'] !== 'Lo hicimos o lo compramos'; });
    const cw = document.getElementById('contacto-wrap');
    if (cw) cw.hidden = st.r.consent_recontacto !== 'Sí';
  }

  app.addEventListener('change', e => {
    const t = e.target;
    if (!t.dataset || !t.dataset.k) return;
    setValue(t);
    if (t.dataset.pesos) t.value = fmtPesos(st.r[t.dataset.k]);
    refresh(); save();
  });
  app.addEventListener('input', e => {
    const t = e.target;
    if (!t.dataset || !t.dataset.k) return;
    if (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type === 'text')) { setValue(t); refresh(); save(); }
  });
  app.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go != null) { go(Number(b.dataset.go)); return; }
    if (b.dataset.goq) {
      const id = b.dataset.goq;
      const idx = S.partes.findIndex(p => p.preguntas.some(q => q.id === id));
      go(idx + 1);
      const sec = document.getElementById('q-' + id);
      if (sec) { sec.scrollIntoView({ block: 'start' }); sec.classList.add('flash'); const f = sec.querySelector('input,select,textarea'); if (f) f.focus({ preventScroll: true }); }
      return;
    }
    if (b.dataset.clear) {
      const q = qById(b.dataset.clear);
      q.items.forEach(it => { itemKeys(it).forEach(([k]) => delete st.r[k]); rawKeys(it).forEach(k => delete st.r[k]); });
      const sec = b.closest('section.q');
      sec.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(x => { x.checked = false; });
      sec.querySelectorAll('input[type=text],textarea').forEach(x => { x.value = ''; });
      sec.querySelectorAll('select').forEach(x => { x.selectedIndex = 0; });
      sec.querySelectorAll('.warn').forEach(x => { x.hidden = true; });
      refresh(); save();
      return;
    }
    if (b.id === 'btn-start') {
      const r = st.r;
      const err = document.getElementById('consent-error');
      if (requeridas().some(d => r[d.k] === 'No')) { screenNoElegible(); return; }
      if (!requeridas().every(d => r[d.k] === 'Sí')) {
        err.textContent = 'Por favor responda las cinco primeras líneas de “Su decisión”.'; err.hidden = false;
        document.getElementById('decision').scrollIntoView({ block: 'start' }); return;
      }
      if (!consentOk()) { err.textContent = 'Para continuar, marque la casilla de aceptación electrónica.'; err.hidden = false; return; }
      if (!st.inicio) st.inicio = new Date().toISOString();
      go(1); return;
    }
    if (b.id === 'btn-hogar') {
      const val = normCodigo(document.getElementById('hogar-input').value);
      const err = document.getElementById('hogar-error');
      if (val.length < 4) { err.textContent = 'Revise el código: debe tener al menos 4 letras o números (por ejemplo, H-7K4P2Q).'; err.hidden = false; return; }
      st.hogar = { codigo: /^[A-Z0-9]{6}$/.test(val) ? 'H-' + val : val, origen: 'ingresado' };
      save();
      document.getElementById('hogar').outerHTML = hogarHtml(false);
      return;
    }
    if (b.id === 'btn-copy') {
      const link = b.dataset.link;
      const ok = () => { document.getElementById('copy-status').textContent = 'Enlace copiado.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, () => { window.prompt('Copie este enlace:', link); });
      else window.prompt('Copie este enlace:', link);
      return;
    }
    if (b.id === 'btn-reset') {
      if (confirm('¿Borrar todas las respuestas guardadas en este dispositivo para esta encuesta?')) {
        LS.del(storeKey());
        loadState(S.rol, st.codigo); render();
      }
      return;
    }
    if (b.id === 'btn-send') { enviar(b); return; }
    if (b.id === 'btn-download') { descargar(); return; }
  });

  /* ---------- envío ---------- */
  // Clave de respaldo: SHA-256 de iniciales + día + mes de la persona con miastenia, calculada en el dispositivo.
  async function claveRespaldo(k) {
    const r = st.r;
    const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    const a = norm(r[k + '_ini1']), b = norm(r[k + '_ini2']);
    const d = Number(r[k + '_dia']), m = Number(r[k + '_mes']);
    if (!a || !b || !(d >= 1 && d <= 31) || !(m >= 1 && m <= 12)) return '';
    if (!(window.crypto && crypto.subtle)) return '';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`gmg|${a}${b}|${d}|${m}`));
    return Array.from(new Uint8Array(buf), x => x.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }

  function mgadl(it) {
    const vals = it.rows.map((_, i) => st.r[it.k + '_' + (i + 1)]);
    if (vals.some(v => v == null || v === '')) return { total: '', banda: '' };
    const total = vals.reduce((s, v) => s + Number(v), 0);
    return { total: String(total), banda: total <= 4 ? 'Leve (0–4)' : total <= 9 ? 'Moderada (5–9)' : 'Grave (≥10)' };
  }

  async function buildPayload() {
    const now = new Date();
    const r = st.r;
    const claves = {};
    for (const q of allQuestions()) for (const it of q.items) if (it.t === 'vinculo') claves[it.k] = vincula() ? await claveRespaldo(it.k) : '';
    const d = {
      _id: st.id,
      version: CFG.version,
      rol: S.rol,
      codigo_hogar: vincula() ? st.hogar.codigo : '',
      codigo_hogar_origen: vincula() ? st.hogar.origen : 'no autorizó vinculación',
      codigo_enlace: st.codigo || '',
      fecha_inicio: st.inicio || '',
      fecha_envio: now.toISOString(),
      minutos_desde_inicio: st.inicio ? Math.round((now - new Date(st.inicio)) / 60000) : ''
    };
    S.consentimiento.decision.forEach(x => { d[x.k] = r[x.k] || ''; });
    d.consent_acepta = consentOk() ? 'Sí' : '';
    d.consent_contacto = r.consent_recontacto === 'Sí' ? (r.consent_contacto || '') : '';
    const dic = [];
    allQuestions().forEach(q => {
      const qv = qVisible(q);
      q.items.forEach(it => {
        const iv = qv && itVisible(it);
        const opts = it.o ? it.o.join(' | ') : it.cols ? it.cols.join(' | ') : it.t === 'adl' ? '0 a 3 (ver anclajes en la encuesta)' : '';
        const adl = it.t === 'adl' ? mgadl(it) : null;
        itemKeys(it).forEach(([k, label]) => {
          let v = r[k];
          if (it.t === 'vinculo') v = claves[it.k];
          if (adl && k === it.k + '_total') v = adl.total;
          if (adl && k === it.k + '_banda') v = adl.banda;
          d[k] = !iv ? 'NA' : Array.isArray(v) ? v.join(' | ') : (v == null ? '' : String(v));
          dic.push([k, q.n, q.q, label, opts]);
        });
      });
    });
    return { hp: (document.getElementById('hp') || {}).value || '', data: d, diccionario: dic };
  }

  async function descargar() {
    const payload = await buildPayload();
    const blob = new Blob([JSON.stringify(payload.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `respuestas_gmg_${S.rol}_${String(st.id).slice(0, 8)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function fallback(msg) {
    const inv = CFG.investigador;
    const subject = encodeURIComponent('Respuestas encuesta gMG (' + S.rol + ')');
    const body = encodeURIComponent('Adjunto el archivo con mis respuestas a la encuesta.');
    document.getElementById('send-status').innerHTML = `<div class="callout warn-box">
      <p>${msg}</p>
      <p>Sus respuestas siguen guardadas en este dispositivo. Puede intentar de nuevo más tarde, o descargar una copia y enviarla por correo a <a href="mailto:${esc(inv.correo)}?subject=${subject}&body=${body}">${esc(inv.correo)}</a>.</p>
      <button type="button" class="btn" id="btn-download">Descargar copia de mis respuestas</button></div>`;
  }

  async function enviar(btn) {
    const status = document.getElementById('send-status');
    if (!CFG.endpoint) { await descargar(); fallback('Modo prueba: se descargó una copia de sus respuestas; no se envió nada.'); return; }
    btn.disabled = true;
    status.innerHTML = '<p class="muted">Enviando sus respuestas…</p>';
    try {
      const res = await fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(await buildPayload())
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'respuesta inválida');
      const otroResponde = S.rol === 'paciente' ? /^Sí, (y también|y no sé)/.test(st.r.P_cuidador || '') : /^Sí, la va/.test(st.r.C_paciente_responde || '');
      const info = { enviado: true, id: st.id, fecha: hoy(), rol: S.rol, hogarHtml: vincula() && otroResponde ? hogarHtml(true) : '' };
      LS.set(storeKey(), info);
      screenGracias(info);
    } catch (err) {
      btn.disabled = false;
      fallback('No pudimos enviar sus respuestas (revise su conexión a internet).');
    }
  }

  /* ---------- arranque ---------- */
  const codigoURL = normCodigo(params.get('c'));
  const rolURL = (params.get('r') || '').toLowerCase();
  if (!E[rolURL]) {
    screenInicio();
  } else {
    loadState(rolURL, codigoURL);
    document.title = (rolURL === 'paciente' ? 'Encuesta pacientes' : 'Encuesta cuidadores') + ' · gMG Colombia';
    document.getElementById('emergency').hidden = rolURL !== 'paciente';
    if (st.enviado) screenGracias(st);
    else render();
  }
})();
