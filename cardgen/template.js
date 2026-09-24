const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const CARD_W = 1417; // 120mm @ 300dpi — scena panoramica (Piani, Piano Terreno)
const CARD_H = 827;  // 70mm  @ 300dpi

// Formato "standard" ritratto: personaggi/oggetti/incontri/spell, non scene d'ambiente.
// 63,5x88mm @ 300dpi — formato Poker reale (2,5x3,5in), per il print-and-play.
// Leggermente più "tozzo" del rapporto nativo dei ritratti generati (1696x2528, ~0.671):
// artLayer() riempie comunque tutta la carta con background-size:cover (centrato), quindi
// taglia un filo in più sopra/sotto rispetto a prima — impercettibile, l'illustrazione ha margine.
const PORTRAIT_CARD_W = 750;
const PORTRAIT_CARD_H = 1039;

const FAMILY_ACCENT = {
  elementare: '#c1531f',
  eterei:     '#3a5aa8',
  armonia:    '#b89323',
  entropia:   '#5f3f92',
  demoniaco:  '#8f1f1f',
  nonmorti:   '#3d5c40',
  generico:   '#5f564a',
};

const FAMILY_EMOJI = {
  elementare: '🔥', eterei: '🌙', armonia: '✨', entropia: '🌀', demoniaco: '👹', nonmorti: '☠️', terrestre: '🌋', generico: '🌐',
};

const INCONTRO_TYPE_LABEL = { nessun: 'Nessun evento', incontro: 'Incontro', check: 'Check', ricompensa: 'Ricompensa' };

// Piano Terreno: destinazioni leggendarie, nessuna Famiglia — un unico accento fisso
// (oro/bronzo) le distingue a colpo d'occhio dalle carte Piano elementali/eteree/ecc.
const PIANO_TERRENO_ACCENT = '#a3781c';
const PIANO_TERRENO_EMOJI = '🏔️';

// Classi: stesso discorso, un accento fisso (bordeaux araldico) invece di una Famiglia.
const CLASS_ACCENT = '#7a2f3d';

const WEAPONS_LABEL = { heavy: 'Armi pesanti', light: 'Armi leggere', none: "Nessun'arma" };

// Spell: un accento per scuola invece che per Famiglia, coordinato col colore del
// sigillo luminoso (icona) di quella scuola, cosi' badge/nastro e sigillo si intonano.
const SCHOOL_ACCENT = { essenza: '#a855e0', flusso: '#d9924a', divinazione: '#7c7fe0' };
const SCHOOL_LABEL = { essenza: 'Essenza', flusso: 'Flusso', divinazione: 'Divinazione' };
const SCHOOL_EMOJI = { essenza: '🪄', flusso: '✨', divinazione: '🔮' };

// Oggetti: stesso principio degli spell (icona di categoria come sigillo, coordinata via
// colore), ma solo "arma" ha per ora un'illustrazione fornita — le altre useranno il grigio
// di fallback finché non arriva l'icona/l'accento dedicato.
// Tassonomia "di stampa" scelta dall'utente — 5 gruppi visivi, distinti dalla categoria
// meccanica `cat` usata dal gioco (che resta invariata: arma/armatura/anello/pozione/
// protezione/oneshot/particolare). Scudi si separano dall'armatura (slot "shield"), anelli
// e protezioni confluiscono insieme in "altro". Pozione/oneshot confluiranno in
// "consumabile" quando arriverà l'icona dedicata; particolare resta a sé per ora.
// "particolare" si divide fra "altro" (effetto permanente/riusabile) e "consumabile"
// (si esaurisce con l'uso) — scelta dall'utente carta per carta, non deducibile da un solo
// flag dati (alcuni consumabili qui non hanno oneUse impostato pur esaurendosi all'uso).
const PARTICOLARE_CONSUMABILE_IDS = new Set(['o_acquasanta', 'o_ancoracasa', 'o_chiaveplanare', 'o_cimeliodelviandante', 'o_frammentocristallo']);
function badgeCategoryFor(item) {
  if (item.cat === 'armatura' && item.slot === 'shield') return 'scudo';
  if (item.cat === 'anello' || item.cat === 'protezione') return 'altro';
  if (item.cat === 'pozione' || item.cat === 'oneshot') return 'consumabile';
  if (item.cat === 'particolare') return PARTICOLARE_CONSUMABILE_IDS.has(item.id) ? 'consumabile' : 'altro';
  return item.cat;
}
const ITEM_CAT_ACCENT = { arma: '#6b7a8f', armatura: '#7a8f6b', scudo: '#8f9a6b', altro: '#c9932a', consumabile: '#4fb0a6', particolare: '#a3781c' };
const ITEM_CAT_LABEL = { arma: 'Arma', armatura: 'Armatura', scudo: 'Scudo', altro: 'Altro', consumabile: 'Consumabile', particolare: 'Particolare' };
const ITEM_CAT_EMOJI = { arma: '⚔️', armatura: '🛡️', scudo: '🛡️', altro: '🧿', consumabile: '🧪', particolare: '🔮' };

const STAT_ICON = { for:'💪', int:'🧠', des:'🏃', pv:'❤️', san:'🌀', anima:'🕯️' };
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

function findSchoolIcon(school, artDir) {
  // il sigillo (icona) di scuola: file condiviso fra tutti gli spell della stessa scuola,
  // non specifico della singola carta — cercato come "icon_<school>.*" invece di "<id>.*".
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  if (!artDir) return null;
  for (const ext of exts) {
    const p = path.join(artDir, 'icon_' + school + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
function schoolBadgeLayer(school, artDir) {
  const found = findSchoolIcon(school, artDir);
  if (!found) return '';
  const fileUrl = pathToFileURL(found).href;
  return `<div class="school-badge"><img src="${fileUrl}"></div>`;
}

function spellCardHtml(spell, flavor, artDir, school) {
  const accent = SCHOOL_ACCENT[school] || '#7a6f5e';
  const emoji = SCHOOL_EMOJI[school] || '📖';
  return `
  <div class="card card-portrait" id="card-${spell.id}" data-id="${spell.id}" style="--fam:${accent};">
    ${artLayer(spell, artDir, accent, emoji)}
    ${schoolBadgeLayer(school, artDir)}
    <div class="top-strip"></div>
    <div class="panel spell-panel">
      <div class="name-row">
        <div class="name-block">
          <div class="name spell-name">${esc(spell.name)}</div>
        </div>
        <div class="badges">
          <span class="badge"><span class="badge-icon">${emoji}</span>${esc(SCHOOL_LABEL[school]||school)}</span>
          ${spell.cost ? `<span class="badge cost-badge"><span class="badge-icon">◆</span>Costo ${spell.cost}</span>` : ''}
        </div>
      </div>
      <div class="flavor">${esc(flavor || '')}</div>
      <div class="rule-text spell-text">${esc(spell.text)}</div>
    </div>
  </div>`;
}

function spellPageHtml(spells, flavors, artDir) {
  const cards = spells.map(s => spellCardHtml(s, flavors[s.id], artDir, s.school)).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${sharedCardCss()}
  .school-badge{
    position:absolute; top:26px; left:26px; z-index:4;
    width:130px; height:130px; border-radius:50%;
    background:radial-gradient(circle, rgba(8,6,12,.92) 0%, rgba(8,6,12,.72) 60%, rgba(8,6,12,0) 100%);
    box-shadow:0 0 24px 7px var(--fam), 0 0 50px 16px var(--fam);
    display:flex; align-items:center; justify-content:center; overflow:hidden;
  }
  .school-badge img{ width:90%; height:90%; object-fit:contain; mix-blend-mode:screen; filter:drop-shadow(0 0 10px var(--fam)); }
  .spell-panel{ height:60%; padding:16px 26px 24px; }
  .cost-badge{ background:rgba(217,146,74,.18); border-color:rgba(217,146,74,.55); color:#f0c396; }
</style></head>
<body><div class="stage">
${cards}
</div></body></html>`;
}

const TIER_LABEL = { tutti: 'Per tutti', leggera: 'Leggera', pesante: 'Pesante' };

function itemBadgeLayer(cat, artDir) {
  // sigillo di categoria oggetto: file condiviso da tutti gli oggetti della stessa categoria
  // (es. "icon-arma.*"), non specifico della singola carta.
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  let found = null;
  if (artDir) {
    for (const ext of exts) {
      const p = path.join(artDir, 'icon-' + cat + ext);
      if (fs.existsSync(p)) { found = p; break; }
    }
  }
  if (!found) return '';
  const fileUrl = pathToFileURL(found).href;
  return `<div class="cat-badge"><img src="${fileUrl}"></div>`;
}

function itemCardHtml(item, artDir) {
  const badgeCat = badgeCategoryFor(item);
  const accent = ITEM_CAT_ACCENT[badgeCat] || '#5f564a';
  const emoji = ITEM_CAT_EMOJI[badgeCat] || '🃏';
  return `
  <div class="card card-portrait" id="card-${item.id}" data-id="${item.id}" style="--fam:${accent};">
    ${artLayer(item, artDir, accent, emoji)}
    ${itemBadgeLayer(badgeCat, artDir)}
    <div class="top-strip"></div>
    <div class="panel item-panel">
      <div class="name-row">
        <div class="name-block">
          <div class="name item-name">${esc(item.name)}</div>
        </div>
        <div class="badges">
          <span class="badge"><span class="badge-icon">${emoji}</span>${esc(ITEM_CAT_LABEL[badgeCat]||badgeCat)}</span>
          ${item.tier ? `<span class="badge tier-badge">${esc(TIER_LABEL[item.tier]||item.tier)}</span>` : ''}
        </div>
      </div>
      <div class="rule-text item-text">${esc(item.text)}</div>
    </div>
  </div>`;
}

function itemPageHtml(items, artDir) {
  const cards = items.map(it => itemCardHtml(it, artDir)).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${sharedCardCss()}
  .cat-badge{
    position:absolute; top:24px; left:24px; z-index:4;
    width:84px; height:84px; border-radius:50%;
    background:radial-gradient(circle, rgba(10,10,12,.72) 0%, rgba(10,10,12,.46) 55%, rgba(10,10,12,0) 100%);
    box-shadow:0 0 10px 2px var(--fam);
    display:flex; align-items:center; justify-content:center; overflow:hidden;
  }
  .cat-badge img{ width:86%; height:86%; object-fit:contain; mix-blend-mode:screen; opacity:.85; filter:drop-shadow(0 0 4px var(--fam)); }
  .item-panel{ height:56%; padding:16px 26px 22px; }
  .tier-badge{ background:rgba(255,255,255,.08); }
</style></head>
<body><div class="stage">
${cards}
</div></body></html>`;
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
    ${dest.personalExit ? `<div class="corner-ribbon exit-ribbon">✦ USCITA ✦</div>` : ''}
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
  // Spell iniziali: quante carte pesca all'inizio e da quale/i scuola/e (affinity, es.
  // {divinazione:2, essenza:1}) — mancava del tutto sulla carta, un'informazione che invece
  // serve a colpo d'occhio in fase di scelta del personaggio. Un sigillo (stesso usato sulle
  // carte Spell) + il conteggio per ogni scuola con affinità; le classi senza spell (Guerriero,
  // Barbaro, Ladro, Saltimbanco) semplicemente non mostrano questa riga.
  const affinityEntries = Object.entries(cls.affinity || {}).filter(([, n]) => n > 0);
  const affinityHtml = affinityEntries.length ? `<div class="affinity-row">${affinityEntries.map(([school, n]) => {
    const iconPath = findSchoolIcon(school, artDir);
    const iconHtml = iconPath ? `<img src="${pathToFileURL(iconPath).href}">` : `<span class="aff-fallback">${SCHOOL_EMOJI[school] || '📖'}</span>`;
    return `<div class="affinity-chip" style="--school:${SCHOOL_ACCENT[school] || '#7a6f5e'};">${iconHtml}<span class="aff-n">×${n}</span></div>`;
  }).join('')}</div>` : '';
  return `
  <div class="card card-portrait" id="card-${cls.id}" data-id="${cls.id}" style="--fam:${CLASS_ACCENT};">
    ${artLayer(cls, artDir, CLASS_ACCENT, cls.icon)}
    <div class="top-strip"></div>
    <div class="panel class-panel">
      <div class="name-row">
        <div class="name-block">
          <div class="name">${cls.icon} ${esc(cls.name)}</div>
        </div>
      </div>
      <div class="stat-block">
        ${['for','int','des','pv','san','anima'].map(s => `<div class="stat-cell"><div class="stat-ic">${STAT_ICON[s]}</div><div class="stat-v">${stats[s]}</div></div>`).join('')}
      </div>
      ${affinityHtml}
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
  .class-panel{ height:60%; padding:16px 26px 24px; }
  .stat-block{ display:flex; gap:7px; margin-bottom:10px; }
  .stat-cell{
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
    background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); border-radius:9px;
    width:66px; padding:7px 0;
  }
  .stat-ic{ font-size:19px; line-height:1; }
  .stat-v{ font-family:'JetBrains Mono','DejaVu Sans Mono',monospace; font-size:24px; font-weight:700; }
  .affinity-row{ display:flex; gap:8px; margin-bottom:10px; }
  .affinity-chip{
    display:flex; align-items:center; gap:6px;
    background:rgba(255,255,255,.10); border:1px solid var(--school); border-radius:999px;
    padding:3px 14px 3px 3px;
  }
  .affinity-chip img{ width:30px; height:30px; border-radius:50%; object-fit:cover; box-shadow:0 0 8px 1px var(--school); }
  .affinity-chip .aff-fallback{ font-size:20px; width:30px; text-align:center; }
  .affinity-chip .aff-n{ font-family:'JetBrains Mono','DejaVu Sans Mono',monospace; font-size:19px; font-weight:700; }
  .class-badges{ flex-direction:row; flex-wrap:wrap; align-items:center; gap:6px; margin-bottom:8px; }
  .class-badges .badge{ font-size:12px; padding:4px 10px; gap:5px; }
  .class-badges .badge-icon{ font-size:15px; }
</style></head>
<body><div class="stage">
${cards}
</div></body></html>`;
}

function incontroCardHtml(card, artDir) {
  const accent = FAMILY_ACCENT[card.family] || '#5f564a';
  const emoji = FAMILY_EMOJI[card.family] || '🌐';
  const typeLabel = INCONTRO_TYPE_LABEL[card.type] || card.type;
  return `
  <div class="card card-portrait" id="card-${card.id}" data-id="${card.id}" style="--fam:${accent};">
    ${artLayer(card, artDir, accent, emoji)}
    <div class="top-strip"></div>
    <div class="panel incontro-panel">
      <div class="name-row">
        <div class="name-block">
          <div class="name incontro-name">${esc(card.name)}</div>
        </div>
      </div>
      <div class="badges incontro-badges">
        <span class="badge">${esc(typeLabel)}</span>
        ${card.manual?`<span class="badge badge-manual">manuale</span>`:''}
        ${card.forte?`<span class="badge badge-forte">forte</span>`:''}
        ${card.persistent?`<span class="badge">persistente</span>`:''}
      </div>
      <div class="rule-text incontro-text">${esc(card.text)}</div>
    </div>
  </div>`;
}

function incontroPageHtml(cards, artDir) {
  const html = cards.map(c => incontroCardHtml(c, artDir)).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${sharedCardCss()}
  .incontro-panel{ height:62%; padding:16px 26px 24px; }
  .incontro-badges{ flex-direction:row; flex-wrap:wrap; align-items:center; gap:6px; margin-bottom:8px; }
  .incontro-badges .badge{ font-size:12px; padding:4px 10px; }
  .badge-manual{ background:rgba(214,140,69,.22); border-color:rgba(214,140,69,.55); color:#f0c396; }
  .badge-forte{ background:rgba(196,64,64,.22); border-color:rgba(196,64,64,.55); color:#f3a3a3; }
</style></head>
<body><div class="stage">
${html}
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
    position:absolute; left:0; right:0; bottom:0; height:52%; z-index:2;
    background:linear-gradient(to bottom, rgba(12,10,9,0) 0%, rgba(12,10,9,.5) 20%, rgba(10,8,7,.90) 52%, rgba(8,6,6,.97) 100%);
    display:flex; flex-direction:column; justify-content:flex-end;
    padding:26px 56px 42px;
    color:#f4ede0;
  }
  .name-row{ display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:10px; }
  .name-block{ min-width:0; }
  .name{
    font-family:'Cinzel','GFS Baskerville','Liberation Serif',serif; font-weight:700;
    font-size:58px; letter-spacing:.015em; line-height:1.05; text-transform:uppercase;
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
    font-style:italic; font-size:28px; color:#d9cdb9; opacity:.92; margin-bottom:14px;
    font-family:'Source Serif 4','Lora','Liberation Serif',serif;
  }
  .rule-text{
    font-size:36px; line-height:1.32; color:#f4ede0; max-width:96%;
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

// Dorsi delle carte: l'arte lascia già una zona circolare volutamente semplice e scura al
// centro (o, per le classi, vuota SOTTO l'icona già presente al centro) apposta per scriverci
// sopra — qui si aggiunge solo l'etichetta di categoria, niente illustrazione da comporre.
function cardBackHtml(back, artDir) {
  const { id, label, accent, shape, labelPos, fontSize } = back;
  const w = shape === 'landscape' ? CARD_W : PORTRAIT_CARD_W;
  const h = shape === 'landscape' ? CARD_H : PORTRAIT_CARD_H;
  const exts = ['.jpg', '.png', '.jpeg', '.webp'];
  let bg = null;
  if (artDir) {
    for (const ext of exts) {
      const p = path.join(artDir, id + ext);
      if (fs.existsSync(p)) { bg = pathToFileURL(p).href; break; }
    }
  }
  const top = labelPos === 'belowCircle' ? '77%' : '49.5%';
  return `
  <div class="retro-card" id="card-${id}" data-id="${id}" style="width:${w}px;height:${h}px;background-image:url('${bg}');">
    <div class="retro-label" style="top:${top}; --glow:${accent}; font-size:${fontSize || 40}px;">${esc(label)}</div>
  </div>`;
}
function cardBackPageHtml(backs, artDir) {
  const cards = backs.map(b => cardBackHtml(b, artDir)).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap">
<style>
  *{box-sizing:border-box; margin:0; padding:0;}
  body{ background:#3a3630; }
  .stage{ display:flex; flex-direction:column; gap:40px; padding:40px; align-items:flex-start; }
  .retro-card{
    position:relative; background-size:cover; background-position:center;
    border-radius:22px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.4);
  }
  .retro-label{
    position:absolute; left:50%; transform:translate(-50%,-50%);
    font-family:'Cinzel','GFS Baskerville','Liberation Serif',serif; font-weight:700;
    font-size:40px; letter-spacing:.05em; white-space:nowrap; text-align:center;
    color:#f4ede0;
    text-shadow:0 0 18px var(--glow), 0 0 34px var(--glow), 0 2px 6px rgba(0,0,0,.8);
  }
</style></head>
<body><div class="stage">
${cards}
</div></body></html>`;
}

module.exports = { pageHtml, pianoTerrenoPageHtml, classPageHtml, incontroPageHtml, spellPageHtml, itemPageHtml, cardBackPageHtml, CARD_W, CARD_H, PORTRAIT_CARD_W, PORTRAIT_CARD_H, FAMILY_ACCENT };
