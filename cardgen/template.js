const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const CARD_W = 1417; // 120mm @ 300dpi — scena panoramica (Piani, Piano Terreno)
const CARD_H = 827;  // 70mm  @ 300dpi

// Formato "standard" ritratto: personaggi/oggetti/incontri/spell, non scene d'ambiente.
// 63x94mm @ 300dpi — combacia quasi esattamente col rapporto nativo dei ritratti
// generati (1696x2528, ~0.671), quindi l'immagine riempie la carta senza tagli pesanti.
const PORTRAIT_CARD_W = 744;
const PORTRAIT_CARD_H = 1110;

const FAMILY_ACCENT = {
  elementare: '#c1531f',
  eterei:     '#3a5aa8',
  armonia:    '#b89323',
  entropia:   '#5f3f92',
  demoniaco:  '#8f1f1f',
  nonmorti:   '#3d5c40',
};

const FAMILY_EMOJI = {
  elementare: '🔥', eterei: '🌙', armonia: '✨', entropia: '🌀', demoniaco: '👹', nonmorti: '☠️', terrestre: '🌋',
};

// Piano Terreno: destinazioni leggendarie, nessuna Famiglia — un unico accento fisso
// (oro/bronzo) le distingue a colpo d'occhio dalle carte Piano elementali/eteree/ecc.
const PIANO_TERRENO_ACCENT = '#a3781c';
const PIANO_TERRENO_EMOJI = '🏔️';

// Classi: stesso discorso, un accento fisso (bordeaux araldico) invece di una Famiglia.
const CLASS_ACCENT = '#7a2f3d';

const WEAPONS_LABEL = { heavy: 'Armi pesanti', light: 'Armi leggere', none: "Nessun'arma" };

const STAT_ICON = { for:'💪', int:'🧠', des:'🤸', pv:'❤️', san:'🌙', anima:'🕯️' };
const STAT_LABEL = { for:'Forza', int:'Intelletto', des:'Destrezza', pv:'Punti Vita', san:'Sanità Mentale', anima:'Anima' };

function checkBadge(check) {
  if (!check) return { icon: '—', label: 'Nessun check' };
  if (check === 'choice') return { icon: '🎯', label: 'A scelta' };
  if (check === 'random') return { icon: '🎲', label: 'Casuale' };
  if (check === 'for_or_int') return { icon: '💪🧠', label: 'Forza o Intelletto' };
  if (STAT_ICON[check]) return { icon: STAT_ICON[check], label: STAT_LABEL[check] };
  return { icon: '❔', label: check };
}

function splitTitle(rawName) {
  // "Le Porte di Brace (Demoniaco, 1° girone)" -> { title: "Le Porte di Brace", sub: "Demoniaco, 1° girone" }
  const m = rawName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (m) return { title: m[1].trim(), sub: m[2].trim() };
  return { title: rawName, sub: null };
}

function tierLabel(plane) {
  if (!plane.girone) return null;
  if (plane.family === 'demoniaco') return `${plane.girone}° GIRONE`;
  if (plane.family === 'nonmorti') return `${plane.girone}° LIVELLO`;
  return `${plane.girone}°`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function artLayer(item, artDir, accent, emoji) {
  accent = accent || FAMILY_ACCENT[item.family] || '#5f564a';
  emoji = emoji || FAMILY_EMOJI[item.family] || '🌐';
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  let found = null;
  if (artDir) {
    for (const ext of exts) {
      const p = path.join(artDir, item.id + ext);
      if (fs.existsSync(p)) { found = p; break; }
    }
  }
  if (found) {
    // path.join produce backslash su Windows: 'file://' + stringa grezza produce un URL
    // non valido (es. "file://C:\Users\..."), che Chromium scarta silenziosamente senza
    // errore — la carta risultava con lo sfondo sempre nero, a prescindere dall'attesa.
    // pathToFileURL costruisce l'URL file:// corretto su qualunque piattaforma.
    const fileUrl = pathToFileURL(found).href;
    return `<div class="art" style="background-image:url('${fileUrl}');"></div>`;
  }
  // placeholder fallback, same spirit as the web app's missing-art placeholder
  return `<div class="art placeholder" style="background:${accent};">
    <div class="placeholder-emoji">${emoji}</div>
    <div class="placeholder-label">immagine mancante<br>${esc(item.id)}.${exts[0].slice(1)}</div>
  </div>`;
}

function cardHtml(plane, flavor, artDir) {
  const accent = FAMILY_ACCENT[plane.family] || '#5f564a';
  const { title, sub: fullSub } = splitTitle(plane.name);
  const tier = tierLabel(plane);
  // se c'è già il nastrino del girone/livello in alto, nel sottotitolo basta la famiglia
  // (evita di ripetere "1° girone" due volte sulla stessa carta)
  const sub = tier && fullSub ? fullSub.split(',')[0].trim() : fullSub;
  const badge = checkBadge(plane.check);

  return `
  <div class="card" id="card-${plane.id}" data-id="${plane.id}" style="--fam:${accent};">
    ${artLayer(plane, artDir)}
    <div class="top-strip"></div>
    ${tier ? `<div class="tier-ribbon">${esc(tier)}</div>` : ''}
    <div class="panel">
      <div class="name-row">
        <div class="name-block">
          <div class="name">${esc(title)}</div>
          ${sub ? `<div class="name-sub">${esc(sub)}</div>` : ''}
        </div>
        <div class="badges">
          <span class="badge check-badge"><span class="badge-icon">${badge.icon}</span>${esc(badge.label)}</span>
          ${plane.recupero ? `<span class="badge recupero-badge">✦ Recupero</span>` : ''}
        </div>
      </div>
      <div class="flavor">${esc(flavor || '')}</div>
      <div class="rule-text">${esc(plane.text)}</div>
    </div>
  </div>`;
}

function pianoTerrenoCardHtml(dest, artDir) {
  return `
  <div class="card" id="card-${dest.id}" data-id="${dest.id}" style="--fam:${PIANO_TERRENO_ACCENT};">
    ${artLayer(dest, artDir, PIANO_TERRENO_ACCENT, PIANO_TERRENO_EMOJI)}
    <div class="top-strip"></div>
    ${dest.finale ? `<div class="corner-ribbon finale-ribbon">★ FINALE ★</div>` : ''}
    <div class="panel">
      <div class="name-row">
        <div class="name-block">
          <div class="name">${esc(dest.name)}</div>
        </div>
      </div>
      <div class="rule-text">${esc(dest.text)}</div>
    </div>
  </div>`;
}

function pianoTerrenoPageHtml(destinations, artDir) {
  const cards = destinations.map(d => pianoTerrenoCardHtml(d, artDir)).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${sharedCardCss()}</style></head>
<body><div class="stage">
${cards}
</div></body></html>`;
}

function classCardHtml(cls, artDir) {
  const stats = cls.stats;
  const resistBadges = cls.resistance.map(f => `<span class="badge"><span class="badge-icon">${FAMILY_EMOJI[f]||'🛡️'}</span>Resist. ${f}</span>`).join('');
  return `
  <div class="card card-portrait" id="card-${cls.id}" data-id="${cls.id}" style="--fam:${CLASS_ACCENT};">
    ${artLayer(cls, artDir, CLASS_ACCENT, cls.icon)}
    <div class="top-strip"></div>
    ${cls.exitPlane ? `<div class="corner-ribbon exit-ribbon">✦ USCITA ✦</div>` : ''}
    <div class="panel class-panel">
      <div class="name-row">
        <div class="name-block">
          <div class="name">${cls.icon} ${esc(cls.name)}</div>
        </div>
      </div>
      <div class="stat-block">
        ${['for','int','des','pv','san','anima'].map(s => `<div class="stat-cell"><div class="stat-ic">${STAT_ICON[s]}</div><div class="stat-v">${stats[s]}</div></div>`).join('')}
      </div>
      <div class="badges class-badges">
        <span class="badge"><span class="badge-icon">⚔️</span>${WEAPONS_LABEL[cls.weapons]||cls.weapons}</span>
        ${cls.reroll ? `<span class="badge"><span class="badge-icon">🔁</span>${cls.reroll} reroll</span>` : ''}
        ${cls.stealth ? `<span class="badge"><span class="badge-icon">🥷</span>Furtività</span>` : ''}
        ${cls.waterOk ? `<span class="badge"><span class="badge-icon">💧</span>A suo agio in acqua</span>` : ''}
        ${resistBadges}
      </div>
      <div class="rule-text class-desc">${esc(cls.desc)}</div>
    </div>
  </div>`;
}

function classPageHtml(classes, artDir) {
  const cards = classes.map(c => classCardHtml(c, artDir)).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${sharedCardCss()}
  .class-panel{ height:44%; padding:16px 26px 24px; }
  .class-panel .name{ font-size:34px; }
  .stat-block{ display:flex; gap:6px; margin-bottom:8px; }
  .stat-cell{
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
    background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); border-radius:8px;
    width:56px; padding:5px 0;
  }
  .stat-ic{ font-size:15px; line-height:1; }
  .stat-v{ font-family:'JetBrains Mono','DejaVu Sans Mono',monospace; font-size:17px; font-weight:600; }
  .class-badges{ flex-direction:row; flex-wrap:wrap; align-items:center; gap:6px; margin-bottom:8px; }
  .class-badges .badge{ font-size:12px; padding:4px 10px; gap:5px; }
  .class-badges .badge-icon{ font-size:15px; }
  .class-desc{ font-size:15px; line-height:1.3; }
</style></head>
<body><div class="stage">
${cards}
</div></body></html>`;
}

function sharedCardCss() {
  return `
  *{box-sizing:border-box; margin:0; padding:0;}
  body{ background:#3a3630; }
  .stage{ display:flex; flex-direction:column; gap:40px; padding:40px; align-items:flex-start; }
  .card{
    position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden;
    border-radius:22px; box-shadow:0 10px 30px rgba(0,0,0,.4);
    font-family:'Source Serif 4','Lora','Liberation Serif',serif;
    background:#141110;
  }
  .card-portrait{ width:${PORTRAIT_CARD_W}px; height:${PORTRAIT_CARD_H}px; }
  .art{ position:absolute; inset:0; background-size:cover; background-position:center; }
  .art.placeholder{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; }
  .placeholder-emoji{ font-size:180px; opacity:.55; filter:grayscale(.15); }
  .placeholder-label{ font-family:'JetBrains Mono','DejaVu Sans Mono',monospace; font-size:20px; color:rgba(255,255,255,.75); text-align:center; line-height:1.5; letter-spacing:.02em; }
  .top-strip{ position:absolute; top:0; left:0; right:0; height:12px; background:var(--fam); z-index:3; }
  .tier-ribbon{
    position:absolute; top:30px; left:0; z-index:3;
    background:var(--fam); color:#fff; font-family:'JetBrains Mono','DejaVu Sans Mono',monospace;
    font-size:20px; font-weight:600; letter-spacing:.08em;
    padding:8px 22px 8px 28px; border-radius:0 8px 8px 0;
    box-shadow:0 4px 10px rgba(0,0,0,.35);
  }
  .corner-ribbon{
    position:absolute; top:38px; right:-64px; z-index:3;
    color:#241a04; font-family:'Cinzel','GFS Baskerville','Liberation Serif',serif; font-weight:700;
    font-size:24px; letter-spacing:.08em; text-align:center;
    width:320px; padding:10px 0; transform:rotate(40deg);
    box-shadow:0 4px 14px rgba(0,0,0,.45); border:2px solid rgba(255,255,255,.35);
  }
  /* stesso nastro diagonale del Finale, ma oro contro verde: un colpo d'occhio basta
     a distinguere "fine partita" (Finale) da "esce solo questo personaggio" (Uscita). */
  .finale-ribbon{ background:linear-gradient(135deg,#d9a521,#a3781c); }
  .exit-ribbon{ background:linear-gradient(135deg,#4caf7d,#1f6b46); color:#f4fff8; }
  .panel{
    position:absolute; left:0; right:0; bottom:0; height:47%; z-index:2;
    background:linear-gradient(to bottom, rgba(12,10,9,0) 0%, rgba(12,10,9,.5) 20%, rgba(10,8,7,.90) 52%, rgba(8,6,6,.97) 100%);
    display:flex; flex-direction:column; justify-content:flex-end;
    padding:26px 56px 42px;
    color:#f4ede0;
  }
  .name-row{ display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:10px; }
  .name-block{ min-width:0; }
  .name{
    font-family:'Cinzel','GFS Baskerville','Liberation Serif',serif; font-weight:700;
    font-size:54px; letter-spacing:.015em; line-height:1.05;
    text-shadow:0 2px 10px rgba(0,0,0,.5);
  }
  .name-sub{
    font-family:'JetBrains Mono','DejaVu Sans Mono',monospace; font-size:18px; letter-spacing:.06em;
    text-transform:uppercase; color:var(--fam); margin-top:6px; font-weight:600;
  }
  .badges{ display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex:none; }
  .badge{
    display:inline-flex; align-items:center; gap:8px; white-space:nowrap;
    font-family:'JetBrains Mono','DejaVu Sans Mono',monospace; font-size:19px; font-weight:600;
    background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.22); border-radius:999px;
    padding:7px 18px;
  }
  .badge-icon{ font-size:22px; line-height:1; }
  .recupero-badge{ background:rgba(79,214,208,.18); border-color:rgba(79,214,208,.55); color:#bdf3ef; }
  .flavor{
    font-style:italic; font-size:24px; color:#d9cdb9; opacity:.92; margin-bottom:14px;
    font-family:'Source Serif 4','Lora','Liberation Serif',serif;
  }
  .rule-text{
    font-size:28px; line-height:1.4; color:#f4ede0; max-width:96%;
  }`;
}

function pageHtml(planes, flavors, artDir) {
  const cards = planes.map(p => cardHtml(p, flavors[p.id], artDir)).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${sharedCardCss()}</style></head>
<body><div class="stage">
${cards}
</div></body></html>`;
}

module.exports = { pageHtml, pianoTerrenoPageHtml, classPageHtml, CARD_W, CARD_H, PORTRAIT_CARD_W, PORTRAIT_CARD_H, FAMILY_ACCENT };
