
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     ESTADO GLOBAL
  ═══════════════════════════════════════════════════════════ */
  const STATE = {
    isDark:     true,
    bfRunning:  false,
    bfBestXOR:  42,
    bfBestShift: 2,
    lastXOR:    42,
    lastShift:  2,
    opts: { pcall: true, junk: true, header: true },
    history: [],   // histórico da sessão
  };

  const TABS = ['ofuscar', 'deofuscar', 'cruzar', 'brute', 'ajuda'];


  /* ═══════════════════════════════════════════════════════════
     HELPERS DOM
  ═══════════════════════════════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const $val = id => $(id).value;
  const $set = (id, v) => { $(id).value = v; };
  const $txt = (id, v) => { $(id).textContent = v; };
  const $show = (id, v = 'block') => { $(id).style.display = v; };
  const $hide = id => { $(id).style.display = 'none'; };


  /* ═══════════════════════════════════════════════════════════
     NAVEGAÇÃO
  ═══════════════════════════════════════════════════════════ */
  function goTab(id, el) {
    TABS.forEach(t => $hide('tab-' + t));
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    $show('tab-' + id);
    el.classList.add('active');
    el.setAttribute('aria-selected', 'true');

    if (id === 'deofuscar') {
      $set('dxor', STATE.lastXOR);
      $set('dshift', STATE.lastShift);
      $txt('dkey-hint', STATE.lastXOR !== 42
        ? '✨ chaves da última ofuscação'
        : '');
    }
  }

  function goStab(id, el) {
    ['cr-normal', 'cr-reverso'].forEach(t => $hide(t));
    el.closest('.stabs').querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    $show(id);
    el.classList.add('active');
  }

  function goStab2(id, el) {
    ['res-rel', 'res-ev', 'res-deobf'].forEach(t => $hide(t));
    document.querySelectorAll('#res-stabs .stab').forEach(b => b.classList.remove('active'));
    $show(id);
    el.classList.add('active');
  }

  function goStab3(id, el) {
    ['rv-rel', 'rv-ev', 'rv-deobf'].forEach(t => $hide(t));
    document.querySelectorAll('#rv-stabs .stab').forEach(b => b.classList.remove('active'));
    $show(id);
    el.classList.add('active');
  }


  /* ═══════════════════════════════════════════════════════════
     TEMA
  ═══════════════════════════════════════════════════════════ */
  function toggleTheme() {
    STATE.isDark = !STATE.isDark;
    $('root').classList.toggle('light', !STATE.isDark);
    $txt('t-icon', STATE.isDark ? '🌙' : '☀️');
    $txt('t-lbl',  STATE.isDark ? 'Dark' : 'Light');
    $('t-track').classList.toggle('on', STATE.isDark);
    try { localStorage.setItem('shield-theme', STATE.isDark ? 'dark' : 'light'); } catch(_) {}
  }

  // Restaura tema salvo
  (function initTheme() {
    try {
      const saved = localStorage.getItem('shield-theme');
      if (saved === 'light') toggleTheme();
    } catch(_) {}
  })();


  /* ═══════════════════════════════════════════════════════════
     TOAST — suporte a múltiplos simultâneos
  ═══════════════════════════════════════════════════════════ */
  function toast(msg, type = '') {
    const box = $('toast-box');
    const el  = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.add('show');
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
      }, 2800);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     UTILITÁRIOS
  ═══════════════════════════════════════════════════════════ */
  function tog(key, cardId) {
    STATE.opts[key] = !STATE.opts[key];
    $(cardId).classList.toggle('on', STATE.opts[key]);
  }

  function randKeys() {
    const x = Math.floor(Math.random() * 220) + 20;
    const s = Math.floor(Math.random() * 15) + 2;
    $set('xor', x);
    $set('shift', s);
    updateStrength();
    toast('🎲 XOR=' + x + ' Shift=' + s, 'info');
  }

  /** Indicador visual de força das chaves */
  function updateStrength() {
    const x = parseInt($val('xor'))   || 0;
    const s = parseInt($val('shift')) || 0;
    // Score: XOR longe do padrão (42) + Shift > 5 = mais forte
    const xScore = Math.abs(x - 42) > 80 ? 2 : Math.abs(x - 42) > 20 ? 1 : 0;
    const sScore = s > 10 ? 2 : s > 5 ? 1 : 0;
    const total  = Math.min(3, Math.round((xScore + sScore) / 4 * 3) + 1);

    ['sb1','sb2','sb3'].forEach((id, i) => {
      const bar = $(id);
      bar.className = 'strength-bar';
      if (i < total) bar.classList.add('s' + total);
    });
  }

  function cp(id) {
    const v = $val(id);
    if (!v) { toast('⚠️ Nada para copiar', 'err'); return; }
    navigator.clipboard.writeText(v)
      .then(() => toast('📋 Copiado!', 'ok'))
      .catch(() => toast('❌ Clipboard bloqueado', 'err'));
  }

  function dl(id, name) {
    const v = $val(id);
    if (!v) { toast('⚠️ Nada para baixar', 'err'); return; }
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([v], { type: 'text/plain;charset=utf-8' }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('💾 Download iniciado!', 'ok');
  }

  function updIn() {
    const v = $val('in');
    const lines = v ? v.split('\n').length : 0;
    const el = $('in-info');
    el.textContent = v.length.toLocaleString() + ' chars · ' + lines.toLocaleString() + ' linhas';
    el.classList.toggle('warn', v.length > 50000);
  }


  /* ═══════════════════════════════════════════════════════════
     HISTÓRICO DE SESSÃO
  ═══════════════════════════════════════════════════════════ */
  function addHistory(xor, shift, size) {
    STATE.history.unshift({ xor, shift, size, ts: new Date().toLocaleTimeString('pt-BR') });
    if (STATE.history.length > 10) STATE.history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (!STATE.history.length) { $hide('history-panel'); return; }
    $show('history-panel');
    $('history-list').innerHTML = STATE.history.map((h, i) =>
      `<div class="history-item" onclick="loadHistory(${i})" title="Clique para usar estas chaves">
        <span>${h.ts}</span>
        <code>XOR=${h.xor} · Shift=${h.shift}</code>
        <span style="color:var(--tx3);font-size:10px;">${(h.size/1024).toFixed(1)}KB</span>
       </div>`
    ).join('');
  }

  function loadHistory(i) {
    const h = STATE.history[i];
    $set('xor', h.xor);
    $set('shift', h.shift);
    updateStrength();
    toast('🕘 Chaves carregadas: XOR=' + h.xor + ' Shift=' + h.shift, 'info');
  }

  function clearHistory() {
    STATE.history = [];
    renderHistory();
    toast('🗑️ Histórico limpo', 'ok');
  }


  /* ═══════════════════════════════════════════════════════════
     PRIMITIVAS DE CRIPTOGRAFIA
     Pipeline: código → b64 → reverse → shift → XOR → bytes
  ═══════════════════════════════════════════════════════════ */

  /** Gera nome de variável aleatório (começa com _) */
  function rand(n = 9) {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let s = '_';
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function b64e(s)      { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s)      { return decodeURIComponent(escape(atob(s))); }
  function revS(s)      { return s.split('').reverse().join(''); }
  function shiftE(s, n) { return Array.from(s, c => String.fromCharCode(c.charCodeAt(0) + n)).join(''); }
  function shiftD(s, n) { return Array.from(s, c => String.fromCharCode(c.charCodeAt(0) - n)).join(''); }
  function xorS(s, k)   { return Array.from(s, c => String.fromCharCode(c.charCodeAt(0) ^ k)).join(''); }
  function toBytes(s)   { return Array.from(s, c => c.charCodeAt(0)); }
  function fromBytes(a) { return a.map(b => String.fromCharCode(b)).join(''); }

  /**
   * Deofusca código gerado por este obfuscador.
   * Lança erro com mensagem clara se falhar.
   */
  function deobfRaw(raw, XOR, SHIFT) {
    if (!raw || typeof raw !== 'string') throw new Error('Entrada inválida');

    const m = raw.match(/local\s+\w+\s*=\s*\{([\d,\s\n]+)\}/);
    if (!m) throw new Error('Array de bytes não encontrado — este código foi gerado por este obfuscador?');

    const bytes = m[1].split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n <= 255);

    if (bytes.length < 10) throw new Error('Array de bytes muito pequeno ou corrompido');

    let s = fromBytes(bytes);
    s = xorS(s, XOR);
    s = shiftD(s, SHIFT);
    s = revS(s);
    s = b64d(s);
    return s;
  }


  /* ═══════════════════════════════════════════════════════════
     ABA: OFUSCAR
  ═══════════════════════════════════════════════════════════ */

  function obf() {
    const code = $val('in').trim();
    if (!code) { toast('⚠️ Cole um código primeiro', 'err'); return; }

    const XOR   = Math.max(1, Math.min(255, parseInt($val('xor'))   || 42));
    const SHIFT = Math.max(1, Math.min(20,  parseInt($val('shift')) || 2));
    STATE.lastXOR   = XOR;
    STATE.lastShift = SHIFT;

    // Pipeline de ofuscação
    let c = b64e(code);
    c = revS(c);
    c = shiftE(c, SHIFT);
    c = xorS(c, XOR);
    const bytes = toBytes(c);

    // Nomes aleatórios para dificultar pattern matching
    const [v, f1, f2, f3, f4, f5, ex] = Array.from({length: 7}, () => rand());

    const hdr = STATE.opts.header ? `--[[ LuaShield Runtime · ${Date.now()} ]]\n` : '';
    const j1  = STATE.opts.junk   ? `\nlocal _${rand(4)}=math.random()` : '';
    const j2  = STATE.opts.junk   ? '\nif false then end' : '';

    const body = hdr
      + `local ${v}={${bytes.join(',')}}`
      + j1
      + `\nlocal function ${f1}(t) local s="" for i=1,#t do s=s..string.char(t[i]) end return s end`
      + `\nlocal function ${f2}(s) local r="" for i=1,#s do r=r..string.char(s:byte(i)~${XOR}) end return r end`
      + `\nlocal function ${f3}(s) local r="" for i=1,#s do r=r..string.char(s:byte(i)-${SHIFT}) end return r end`
      + `\nlocal function ${f4}(s) return s:reverse() end` + j2
      + `\nlocal b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='`
      + `\nlocal function ${f5}(d) d=string.gsub(d,'[^'..b..'=]','') return(d:gsub('.',function(x) if x=='='then return''end local r,f='',(b:find(x)-1) for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and'1'or'0')end return r end):gsub('%d%d%d?%d?%d?%d?%d?%d?',function(x) if #x~=8 then return''end local c=0 for i=1,8 do c=c+(x:sub(i,i)=='1'and 2^(8-i)or 0)end return string.char(c) end)) end`
      + (STATE.opts.pcall
        ? `\nlocal ok,err=pcall(function() local s=${f1}(${v}) s=${f2}(s) s=${f3}(s) s=${f4}(s) s=${f5}(s) local ${ex}=load(s) if ${ex} then ${ex}()end end)\nif not ok then print("ShieldErr:"..tostring(err))end`
        : `\nlocal s=${f1}(${v}) s=${f2}(s) s=${f3}(s) s=${f4}(s) s=${f5}(s) local ${ex}=load(s) if ${ex} then ${ex}()end`);

    $set('out', body);

    // Stats
    const enc = new TextEncoder();
    const ol  = enc.encode(code).length;
    const nl  = enc.encode(body).length;
    $txt('s1', ol.toLocaleString());
    $txt('s2', nl.toLocaleString());
    $txt('s3', (nl / ol).toFixed(2) + 'x');
    $txt('s4', body.split('\n').length.toLocaleString());
    $show('stats', 'grid');
    $txt('out-info', `· ${nl.toLocaleString()} bytes`);
    $txt('key-hint-save', `💾 XOR=${XOR} · Shift=${SHIFT}`);

    // Topbar indicator
    const disp = $('session-key-display');
    disp.textContent = `XOR=${XOR} S=${SHIFT}`;
    $show('session-key-display', 'inline-block');

    addHistory(XOR, SHIFT, nl);
    toast(`✅ Ofuscado! Salve XOR=${XOR} Shift=${SHIFT}`, 'ok');
  }

  function clrObf() {
    $set('in', '');
    $set('out', '');
    $hide('stats');
    $txt('key-hint-save', '');
    $txt('in-info', '0 chars · 0 linhas');
    $txt('out-info', '');
    toast('🗑️ Limpo', 'ok');
  }


  /* ═══════════════════════════════════════════════════════════
     ABA: DEOFUSCAR
  ═══════════════════════════════════════════════════════════ */

  function deobf(inId, outId, xorId, shiftId, statusId) {
    const raw   = $val(inId).trim();
    if (!raw) { toast('⚠️ Cole o código ofuscado', 'err'); return; }

    const XOR   = Math.max(1, Math.min(255, parseInt($val(xorId))   || 42));
    const SHIFT = Math.max(1, Math.min(20,  parseInt($val(shiftId)) || 2));

    try {
      const result = deobfRaw(raw, XOR, SHIFT);
      $set(outId, result);
      if (statusId) $txt(statusId, '✅ recuperado · ' + result.length.toLocaleString() + ' chars');
      toast('✅ Código recuperado!', 'ok');
    } catch (e) {
      $set(outId, `-- ❌ Erro: ${e.message}\n-- 💡 Verifique as chaves ou use 🔑 Brute Force`);
      if (statusId) $txt(statusId, '❌ falhou');
      toast('❌ ' + e.message, 'err');
    }
  }


  /* ═══════════════════════════════════════════════════════════
     ABA: CRUZAR — PADRÕES LUA
  ═══════════════════════════════════════════════════════════ */

  /** Padrões de extração de eventos / exports Lua/FiveM */
  const PAT = {
    srvEv: /(?:RegisterNetEvent|AddEventHandler)\s*\(\s*["']([^"']+)["']/g,
    trigC: /TriggerClientEvent\s*\(\s*["']([^"']+)["']/g,
    trigS: /TriggerServerEvent\s*\(\s*["']([^"']+)["']/g,
    trigE: /TriggerEvent\s*\(\s*["']([^"']+)["']/g,
    exp:   /exports\s*(?:\[["']([^"']+)["']\]|\.([a-zA-Z_]\w*))/g,
    cb:    /(?:QBCore\.Functions\.CreateCallback|ESX\.RegisterServerCallback|CreateCallback)\s*\(\s*["']([^"']+)["']/g,
    sql:   /(?:MySQL\.Async|MySQL\.Sync|oxmysql)\.\w+\s*\(\s*["']([^"']+)["']/g,
  };

  function extr(code, pat) {
    const re = new RegExp(pat.source, pat.flags);
    const s  = new Set();
    let m;
    while ((m = re.exec(code)) !== null) {
      const v = m[1] || m[2];
      if (v) s.add(v.trim());
    }
    return [...s];
  }

  function extrAll(code) {
    if (!code) return { srvEv:[], trigC:[], trigS:[], trigE:[], exp:[], cb:[], sql:[] };
    return {
      srvEv: extr(code, PAT.srvEv),
      trigC: extr(code, PAT.trigC),
      trigS: extr(code, PAT.trigS),
      trigE: extr(code, PAT.trigE),
      exp:   extr(code, PAT.exp),
      cb:    extr(code, PAT.cb),
      sql:   extr(code, PAT.sql),
    };
  }

  function makeResultItem(icon, name, tagClass, tagLabel, cls = '') {
    return `<div class="result-item ${cls}">
      <span class="ri-icon">${icon}</span>
      <span class="ri-name">${escHtml(name)}</span>
      <span class="ri-tag ${tagClass}">${tagLabel}</span>
    </div>`;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderEvs(elId, crossed, aOnly, bOnly) {
    const items = [
      ...crossed.map(e => makeResultItem('✅', e, 'tag-grn', 'cruzado', 'ok')),
      ...aOnly.map(e   => makeResultItem('📤', e, 'tag-amb', 'só back')),
      ...bOnly.map(e   => makeResultItem('📱', e, 'tag-blu', 'só front')),
    ];
    $(elId).innerHTML = items.length
      ? items.join('')
      : '<div class="empty-state">⚠️ Nenhum evento detectado</div>';
  }

  function crossAnalyze(bCode, fCode, xor, shift) {
    const bd   = extrAll(bCode);
    let fDecod = '';
    try { fDecod = deobfRaw(fCode, xor, shift); } catch(_) {}
    const fdat = extrAll(fDecod || fCode);

    const bAll    = [...new Set([...bd.srvEv, ...bd.trigC, ...bd.trigE])];
    const fAll    = [...new Set([...fdat.trigS, ...fdat.trigE, ...fdat.srvEv])];
    const crossed = bAll.filter(e => fAll.some(f => f === e || f.includes(e) || e.includes(f)));
    const bOnly   = bAll.filter(e => !crossed.includes(e));
    const fOnly   = fAll.filter(e => !crossed.includes(e));

    return { bd, fdat, bAll, fAll, crossed, bOnly, fOnly, fDecod };
  }

  // Modo normal
  function analisar() {
    const back  = $val('cr-back');
    const front = $val('cr-front');
    if (!back && !front) { toast('⚠️ Cole pelo menos um arquivo', 'err'); return; }

    const XOR   = parseInt($val('cr-xor'))   || 42;
    const SHIFT = parseInt($val('cr-shift')) || 2;

    const { bd, fdat, crossed, bOnly, fOnly, fDecod } = crossAnalyze(back, front, XOR, SHIFT);
    const ts = new Date().toLocaleString('pt-BR');

    let r = `=== LUASHIELD ANALYZER — BACK ABERTO + FRONT OFUSCADO ===\n${ts}\n\n`;
    r += `📊 BACK : eventos=${bd.srvEv.length} · trigClient=${bd.trigC.length} · callbacks=${bd.cb.length} · mysql=${bd.sql.length}\n`;
    r += `📊 FRONT: trigServer=${fdat.trigS.length} · exports=${fdat.exp.length}\n\n`;
    r += `✅ CRUZAMENTOS: ${crossed.length}\n`;
    crossed.forEach(e => { r += `  ✓ ${e}\n`; });
    if (bOnly.length)  { r += `\n📤 SÓ NO BACK (${bOnly.length}):\n`; bOnly.forEach(e => { r += `  ? ${e}\n`; }); }
    if (fOnly.length)  { r += `\n📱 SÓ NO FRONT (${fOnly.length}):\n`; fOnly.forEach(e => { r += `  ? ${e}\n`; }); }
    if (bd.sql.length) { r += `\n🗄️ MYSQL:\n`; bd.sql.forEach(e => { r += `  • ${e}\n`; }); }
    if (bd.cb.length)  { r += `\n🔁 CALLBACKS:\n`; bd.cb.forEach(e => { r += `  • ${e}\n`; }); }

    $set('cr-relatorio', r);
    renderEvs('ev-lista', crossed, bOnly, fOnly);
    if (fDecod) $set('cr-deobf-out', fDecod);
    toast(`⚡ ${crossed.length} cruzamento(s) encontrado(s)`, crossed.length ? 'ok' : 'warn');
  }

  function deobfFront() {
    const front = $val('cr-front');
    if (!front) { toast('⚠️ Cole o front ofuscado', 'err'); return; }
    const XOR   = parseInt($val('cr-xor'))   || 42;
    const SHIFT = parseInt($val('cr-shift')) || 2;
    try {
      $set('cr-deobf-out', deobfRaw(front, XOR, SHIFT));
      goStab2('res-deobf', document.querySelectorAll('#res-stabs .stab')[2]);
      toast('✅ Front deofuscado!', 'ok');
    } catch (e) {
      $set('cr-deobf-out', `-- ❌ Falhou: ${e.message}\n-- 💡 Use Brute Force para encontrar as chaves`);
      toast('❌ Falhou — use 🔑 Brute Force', 'warn');
    }
  }

  // Modo reverso
  function analisarReverso() {
    const front = $val('rv-front');
    const back  = $val('rv-back');
    if (!front && !back) { toast('⚠️ Cole pelo menos um arquivo', 'err'); return; }

    const XOR   = parseInt($val('rv-xor'))   || 42;
    const SHIFT = parseInt($val('rv-shift')) || 2;

    const fd = extrAll(front);
    let bDecod = '';
    try { bDecod = deobfRaw(back, XOR, SHIFT); } catch(_) {}
    const bdat = extrAll(bDecod || back);

    const fAll    = [...new Set([...fd.trigS, ...fd.trigE, ...fd.srvEv])];
    const bAll    = [...new Set([...bdat.srvEv, ...bdat.trigC, ...bdat.trigE])];
    const crossed = fAll.filter(e => bAll.some(b => b === e || b.includes(e) || e.includes(b)));
    const fOnly   = fAll.filter(e => !crossed.includes(e));
    const bOnly   = bAll.filter(e => !crossed.includes(e));

    const ts = new Date().toLocaleString('pt-BR');
    let r = `=== LUASHIELD ANALYZER — FRONT ABERTO + BACK OFUSCADO (REVERSO) ===\n${ts}\n\n`;
    r += `📊 FRONT: trigServer=${fd.trigS.length} · exports=${fd.exp.length}\n`;
    r += `📊 BACK : eventos=${bdat.srvEv.length} · callbacks=${bdat.cb.length}\n\n`;
    r += `✅ CRUZAMENTOS: ${crossed.length}\n`;
    crossed.forEach(e => { r += `  ✓ ${e}\n`; });
    if (fOnly.length)   { r += `\n📱 SÓ NO FRONT (${fOnly.length}):\n`; fOnly.forEach(e => { r += `  ? ${e}\n`; }); }
    if (bOnly.length)   { r += `\n📤 SÓ NO BACK (${bOnly.length}):\n`; bOnly.forEach(e => { r += `  ? ${e}\n`; }); }
    if (bdat.sql.length){ r += `\n🗄️ MYSQL NO BACK:\n`; bdat.sql.forEach(e => { r += `  • ${e}\n`; }); }

    $set('rv-relatorio', r);

    const items = [
      ...crossed.map(e => makeResultItem('✅', e, 'tag-grn', 'cruzado', 'ok')),
      ...fOnly.map(e   => makeResultItem('📱', e, 'tag-blu', 'só front')),
      ...bOnly.map(e   => makeResultItem('📤', e, 'tag-amb', 'só back')),
    ];
    $('rv-ev-lista').innerHTML = items.length
      ? items.join('')
      : '<div class="empty-state">⚠️ Nenhum evento detectado</div>';

    if (bDecod) $set('rv-deobf-out', bDecod);
    toast(`⚡ ${crossed.length} cruzamento(s) — reverso`, crossed.length ? 'ok' : 'warn');
  }

  function deobfBack() {
    const back = $val('rv-back');
    if (!back) { toast('⚠️ Cole o back ofuscado', 'err'); return; }
    const XOR   = parseInt($val('rv-xor'))   || 42;
    const SHIFT = parseInt($val('rv-shift')) || 2;
    try {
      $set('rv-deobf-out', deobfRaw(back, XOR, SHIFT));
      goStab3('rv-deobf', document.querySelectorAll('#rv-stabs .stab')[2]);
      toast('✅ Back deofuscado!', 'ok');
    } catch (e) {
      $set('rv-deobf-out', `-- ❌ Falhou: ${e.message}`);
      toast('❌ Falhou — use 🔑 Brute Force', 'warn');
    }
  }


  /* ═══════════════════════════════════════════════════════════
     ABA: BRUTE FORCE
     Usa Worker sintético via requestAnimationFrame para não
     travar a UI enquanto testa combinações.
  ═══════════════════════════════════════════════════════════ */

  function startBF() {
    const raw  = $val('bf-in').trim();
    const hint = $val('bf-hint').trim();
    if (!raw)  { toast('⚠️ Cole o código ofuscado', 'err'); return; }
    if (!hint) { toast('⚠️ Informe um texto esperado', 'err'); return; }

    const x1 = Math.max(1,   Math.min(255, parseInt($val('bfx1')) || 1));
    const x2 = Math.max(x1,  Math.min(255, parseInt($val('bfx2')) || 255));
    const s1 = Math.max(1,   Math.min(20,  parseInt($val('bfs1')) || 1));
    const s2 = Math.max(s1,  Math.min(20,  parseInt($val('bfs2')) || 20));

    const hints = hint.split('\n')
      .map(h => h.trim().toLowerCase())
      .filter(Boolean);

    // Gera combos embaralhados para melhor cobertura inicial
    const combos = [];
    for (let x = x1; x <= x2; x++) {
      for (let s = s1; s <= s2; s++) combos.push([x, s]);
    }

    STATE.bfRunning = true;
    $hide('bf-start');
    $show('bf-stop', 'block');
    $hide('bf-res');

    const prog = $('bf-prog');
    prog.className = 'prog-fill';

    const log = $('bf-log');
    log.innerHTML = `<span class="log-try">🔍 Iniciando — ${combos.length.toLocaleString()} combinações...</span>\n`;

    let idx = 0, found = 0;
    let best = { score: 0, xor: 42, shift: 2, text: '' };

    // Tamanho do chunk por frame — mais rápido sem travar UI
    const CHUNK = 60;

    function step() {
      if (!STATE.bfRunning || idx >= combos.length) {
        finishBF(found, best);
        return;
      }

      const end = Math.min(idx + CHUNK, combos.length);
      for (; idx < end; idx++) {
        const [x, s] = combos[idx];
        try {
          const r     = deobfRaw(raw, x, s);
          const low   = r.toLowerCase();
          const score = hints.reduce((acc, h) => acc + (low.includes(h) ? 1 : 0), 0);
          if (score > 0) {
            found++;
            const pct = Math.round(score / hints.length * 100);
            const preview = r.substring(0, 50).replace(/\n/g, ' ');
            log.innerHTML += `<span class="log-ok">✅ XOR=${x} Shift=${s} (${pct}%) → ${escHtml(preview)}...</span>\n`;
            log.scrollTop  = log.scrollHeight;
            if (score > best.score) best = { score, xor: x, shift: s, text: r };
          }
        } catch(_) {}
      }

      const pct = Math.min(100, Math.round(idx / combos.length * 100));
      prog.style.width = pct + '%';
      $txt('bf-info', `⏳ ${idx.toLocaleString()}/${combos.length.toLocaleString()} tentativas`);
      $txt('bf-pct', pct + '%');

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function finishBF(found, best) {
    STATE.bfRunning = false;
    $show('bf-start', 'block');
    $hide('bf-stop');

    const prog = $('bf-prog');
    prog.style.width  = '100%';
    prog.className    = 'prog-fill done';
    $txt('bf-info', found ? `✅ Concluído — ${found} resultado(s)` : '❌ Nenhuma chave encontrada');
    $txt('bf-pct', '100%');

    if (!found) {
      $('bf-log').innerHTML += '<span class="log-err">❌ Nenhuma chave encontrada. Tente outro hint ou amplie o intervalo.</span>\n';
      toast('❌ Não encontrado', 'err');
    } else {
      STATE.bfBestXOR   = best.xor;
      STATE.bfBestShift = best.shift;
      $show('bf-res');
      $set('bf-out', best.text);
      $txt('bf-best-keys', `🗝️ XOR=${best.xor}  Shift=${best.shift}  (score ${best.score})`);
      $('bf-log').innerHTML += `<span class="log-ok">✅ ${found} chave(s) encontrada(s)! Melhor: XOR=${best.xor} Shift=${best.shift}</span>\n`;
      toast(`✅ ${found} chave(s) encontrada(s)!`, 'ok');
    }
  }

  function stopBF() {
    STATE.bfRunning = false;
    toast('⏹️ Busca interrompida', 'warn');
  }

  function usarChavesBF() {
    $set('dxor',   STATE.bfBestXOR);
    $set('dshift', STATE.bfBestShift);
    goTab('deofuscar', document.querySelectorAll('.nav-btn')[1]);
    toast(`✅ Chaves aplicadas: XOR=${STATE.bfBestXOR} Shift=${STATE.bfBestShift}`, 'ok');
  }
