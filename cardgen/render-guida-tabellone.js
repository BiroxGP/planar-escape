// Guida di layout per RIGENERARE l'immagine del tabellone in modo che stia su 2 A4 (420x297mm) con le
// carte a misura reale. Stesse dimensioni in pixel dell'immagine attuale (2464x1728 = 0,1705 mm/px).
// Slot: Poker 63,5x88mm e Tarocco 120x70mm (il bordo dello slot = la misura della carta, senza gioco: la
// cornice disegnata va FUORI da questi rettangoli). 10 slot sul tabellone; Oggetti e Spell stanno a parte.
// Uso: node render-guida-tabellone.js  -> cards_final/altro/tabellone_guida_layout.png
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const W = 2464, H = 1728, MMPX = 420 / W, PX = mm => mm / MMPX;
const P = { w: 63.5, h: 88 }, T = { w: 120, h: 70 };
const LX = [26, 100], RX = [256.5, 330.5], R1 = 96, R2 = 192;
const SL = [
  { n: 'MAZZO PIANI', x: 26, y: 18, ...T, c: '#c9a15a' },
  { n: 'PIANO ATTUALE', x: 264, y: 18, ...T, c: '#c9a15a' },
  { n: 'GENERICO', x: LX[0], y: R1, ...P, c: '#a9adb8' }, { n: 'ARMONIA', x: LX[1], y: R1, ...P, c: '#c9a15a' },
  { n: 'NON-MORTI', x: LX[0], y: R2, ...P, c: '#4f8a68' }, { n: 'ENTROPIA', x: LX[1], y: R2, ...P, c: '#7a6fa8' },
  { n: 'INCONTRO', x: RX[0], y: R1, ...P, c: '#a9adb8' }, { n: 'ETEREI', x: RX[1], y: R1, ...P, c: '#3d6f9f' },
  { n: 'ELEMENTARE', x: RX[0], y: R2, ...P, c: '#b87a3d' }, { n: 'DEMONIACO', x: RX[1], y: R2, ...P, c: '#b8505c' },
];
const FRAME = 16;  // fascia decorativa lungo i bordi (cornice dell'immagine)
(async () => {
  const slots = SL.map(s => `<div style="position:absolute;left:${PX(s.x)}px;top:${PX(s.y)}px;width:${PX(s.w)}px;height:${PX(s.h)}px;border:4px solid ${s.c};border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#eee;font:700 34px sans-serif;background:rgba(255,255,255,.06)">${s.n}<span style="font:22px sans-serif;margin-top:8px;color:#bbb">${s.w}x${s.h}mm</span></div>`).join('');
  const html = `<body style="margin:0;background:#101426"><div style="position:relative;width:${W}px;height:${H}px;background:#151a33;overflow:hidden">
    <div style="position:absolute;inset:0;border:${PX(FRAME)}px solid rgba(201,161,90,.25)"></div>
    <div style="position:absolute;left:${W / 2 - 2}px;top:0;width:4px;height:${H}px;background:#f33"></div>
    <div style="position:absolute;left:${W / 2 + 14}px;top:30px;color:#f66;font:24px sans-serif">taglio fra i due A4 (x = 210mm)</div>
    <div style="position:absolute;left:${PX(166)}px;top:${PX(100)}px;width:${PX(88)}px;height:${PX(176)}px;border:3px dashed #8a8;color:#aca;font:26px sans-serif;display:flex;align-items:center;justify-content:center;text-align:center">centro libero:<br>vortice + promemoria<br>(Check / Turno)</div>
    <div style="position:absolute;left:${PX(150)}px;top:${PX(22)}px;width:${PX(110)}px;height:${PX(62)}px;border:3px dashed #8a8;color:#aca;font:24px sans-serif;display:flex;align-items:center;justify-content:center;text-align:center">spazio testo / titolo</div>
    ${slots}
    <div style="position:absolute;left:30px;bottom:24px;color:#ccc;font:26px sans-serif">Guida: ${W}x${H}px = 420x297mm (0,1705 mm/px). Slot a misura REALE della carta; cornice fuori dal rettangolo. Oggetti e Spell: fuori dal tabellone (mini-tappetino a parte).</div>
  </div></body>`;
  const f = path.join(__dirname, '_guida.html'); fs.writeFileSync(f, html);
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto(pathToFileURL(f).href); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(__dirname, '..', 'cards_final', 'altro', 'tabellone_guida_layout.png') });
  await b.close(); fs.unlinkSync(f);
  console.log('Fatto: tabellone_guida_layout.png');
})();
