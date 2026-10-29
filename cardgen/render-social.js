// Post social (Instagram carosello 4:5 + TikTok foto 9:16) da due foto del gioco sul tavolo: ritagli, un po' di colore,
// poco testo nel carattere del gioco e frecce che spiegano cosa si vede. Le foto NON stanno nel repo (sono dell'utente).
//
// Uso: node render-social.js <foto1_dall_alto> <foto2_di_taglio> [cartella_output]
//   foto1 e foto2 sono immagini JPG/PNG (se arrivano da PDF: pdfimages -all file.pdf prefisso)
//   -> <output>/ig_1.jpg ig_2.jpg ig_3.jpg (1080x1350) e tt_1.jpg tt_2.jpg tt_3.jpg (1080x1920)
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const F1 = path.resolve(process.argv[2] || ''), F2 = path.resolve(process.argv[3] || '');
const OUT = path.resolve(process.argv[4] || path.join(__dirname, '..', 'cards_final', 'social'));
if (!fs.existsSync(F1) || !fs.existsSync(F2)) { console.error('Uso: node render-social.js <foto1> <foto2> [output]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

// frazioni delle foto (0..1) dei punti di interesse
const P = {
  f1: { mazzi: [0.62, 0.17], mappa: [0.80, 0.63], gettoni: [0.64, 0.915], spell: [0.39, 0.58], scheda: [0.17, 0.16], dadi: [0.235, 0.17] },
  f2: { pedina: [0.455, 0.822] },
};

// crop in frazioni: x0,y0 (angolo) e altezza/larghezza ricavate dal rapporto del formato
const SLIDES = [
  { file: 'ig_1', W: 1080, H: 1350, photo: 'f2', crop: { x0: 0.06, y0: 0, hFrac: 1 }, kind: 'hook',
    labels: [{ t: 'Una pedina per ogni\npiano visitato', pt: 'f2.pedina', box: [40, 1020], side: 'l' }], handleY: 1296 },
  { file: 'ig_2', W: 1080, H: 1350, photo: 'f1', crop: { x0: 0.351, y0: 0, hFrac: 1 }, kind: 'plain', title: 'IL TABELLONE',
    labels: [
      { t: 'Mazzi degli Incontri', pt: 'f1.mazzi', box: [40, 250] },
      { t: 'La mappa dei 36 piani', pt: 'f1.mappa', box: [560, 900] },
      { t: 'Gettoni e pedine', pt: 'f1.gettoni', box: [40, 1130] },
      { t: 'Carte spell', pt: 'f1.spell', box: [40, 640] },
    ], handleY: 1322 },
  { file: 'ig_3', W: 1080, H: 1350, photo: 'f1', kind: 'framed', title: 'IL TUO PERSONAGGIO', titleY: 110, box: { x: 150, y: 170, w: 780, h: 975 }, crop: { x0: 0, y0: 0.04, hFrac: 0.7395 },
    sub: 'Sei dadi, sei caratteristiche', subY: 1198, cta: true, handleY: 1262, labels: [] },
  { file: 'tt_1', W: 1080, H: 1920, photo: 'f2', crop: { x0: 0.14, y0: 0, hFrac: 1 }, kind: 'hook', tt: true,
    labels: [{ t: 'Una pedina per ogni\npiano visitato', pt: 'f2.pedina', box: [40, 1300], side: 'l' }], handleY: null, handleUnderHook: true },
  { file: 'tt_2', W: 1080, H: 1920, photo: 'f1', crop: { x0: 0.505, y0: 0, hFrac: 1 }, kind: 'plain', tt: true, title: 'IL TABELLONE',
    labels: [
      { t: 'Mazzi degli Incontri', pt: 'f1.mazzi', box: [40, 420] },
      { t: 'La mappa dei 36 piani', pt: 'f1.mappa', box: [300, 1080] },
    ], handleY: null },
  { file: 'tt_3', W: 1080, H: 1920, photo: 'f1', kind: 'framed', tt: true, title: 'IL TUO PERSONAGGIO', titleY: 250, box: { x: 90, y: 320, w: 900, h: 1125 }, crop: { x0: 0, y0: 0.04, hFrac: 0.7395 },
    sub: 'Sei dadi, sei caratteristiche', subY: 1500, cta: true, handleY: 1560, labels: [] },
];

const HTML = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@1,500&display=swap" rel="stylesheet">
</head><body><canvas id="c"></canvas>
<img id="f1" src="${pathToFileURL(F1).href}"><img id="f2" src="${pathToFileURL(F2).href}"></body></html>`;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const tmp = path.join(__dirname, '_social.html');
  fs.writeFileSync(tmp, HTML);
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction(() => ['f1', 'f2'].every(i => document.getElementById(i).complete && document.getElementById(i).naturalWidth > 0));
  await page.evaluate(async () => { await document.fonts.load('700 80px Cinzel'); await document.fonts.load('600 30px Cinzel'); await document.fonts.load('italic 500 30px "Source Serif 4"'); });
  for (const sl of SLIDES) {
    const b64 = await page.evaluate(async ([sl, P]) => {
      const img = document.getElementById(sl.photo), c = document.getElementById('c');
      c.width = sl.W; c.height = sl.H;
      const x = c.getContext('2d');
      if(sl.kind==='framed'){
        const iw0 = img.naturalWidth, ih0 = img.naturalHeight, b = sl.box;
        let gg = x.createLinearGradient(0,0,0,sl.H); gg.addColorStop(0,'#141a38'); gg.addColorStop(1,'#080a18'); x.fillStyle = gg; x.fillRect(0,0,sl.W,sl.H);
        const chh = ih0*sl.crop.hFrac, cww = chh*(b.w/b.h);
        x.save(); x.beginPath(); x.roundRect(b.x,b.y,b.w,b.h,18); x.clip();
        x.filter = 'brightness(1.05) contrast(1.08) saturate(1.12)';
        x.drawImage(img, sl.crop.x0*iw0, sl.crop.y0*ih0, cww, chh, b.x, b.y, b.w, b.h);
        x.filter = 'none'; x.restore();
        x.strokeStyle = '#e7c988'; x.lineWidth = 4; x.beginPath(); x.roundRect(b.x,b.y,b.w,b.h,18); x.stroke();
        const gold0 = '#e7c988', cream0 = '#fbf4e3';
        x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 12;
        x.fillStyle = gold0; x.font = '700 62px Cinzel'; x.fillText(sl.title, sl.W/2, sl.titleY);
        x.fillStyle = cream0; x.font = '600 40px Cinzel'; x.fillText(sl.sub, sl.W/2, sl.subY);
        x.font = '700 40px Cinzel'; x.fillText('@planar.escape', sl.W/2, sl.handleY);
        if(sl.cta){ x.fillStyle = gold0; x.font = 'italic 500 34px "Source Serif 4"'; x.fillText('la demo giocabile è nel link in bio', sl.W/2, sl.handleY + 50); }
        x.shadowColor = 'transparent'; x.shadowBlur = 0;
        return c.toDataURL('image/jpeg', 0.93).split(',')[1];
      }
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const ratio = sl.W / sl.H;
      const ch = ih * sl.crop.hFrac, cw = ch * ratio;
      const sx = sl.crop.x0 * iw, sy = sl.crop.y0 * ih;
      const s = sl.W / cw;
      x.filter = 'brightness(1.06) contrast(1.1) saturate(1.14)';
      x.drawImage(img, sx, sy, cw, ch, 0, 0, sl.W, sl.H);
      x.filter = 'none';
      const toCanvas = key => { const [g, k] = key.split('.'); const [fx, fy] = P[g][k]; return [(fx * iw - sx) * s, (fy * ih - sy) * s]; };
      // vignettatura leggera
      let g = x.createRadialGradient(sl.W / 2, sl.H / 2, sl.H * 0.35, sl.W / 2, sl.H / 2, sl.H * 0.78);
      g.addColorStop(0, 'rgba(6,7,16,0)'); g.addColorStop(1, 'rgba(6,7,16,.5)');
      x.fillStyle = g; x.fillRect(0, 0, sl.W, sl.H);
      // sfumatura in alto per i titoli e in basso per il nome del profilo
      g = x.createLinearGradient(0, 0, 0, sl.H * (sl.kind === 'hook' ? 0.44 : 0.2));
      g.addColorStop(0, 'rgba(7,9,22,.88)'); g.addColorStop(1, 'rgba(7,9,22,0)');
      x.fillStyle = g; x.fillRect(0, 0, sl.W, sl.H * 0.5);
      g = x.createLinearGradient(0, sl.H - (sl.tt ? 560 : 200), 0, sl.H);
      g.addColorStop(0, 'rgba(7,9,22,0)'); g.addColorStop(1, 'rgba(7,9,22,.82)');
      x.fillStyle = g; x.fillRect(0, sl.H - (sl.tt ? 560 : 200), sl.W, sl.tt ? 560 : 200);
      const gold = '#e7c988', cream = '#fbf4e3';
      const shadow = (b) => { x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = b; x.shadowOffsetY = 2; };
      const noShadow = () => { x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0; };
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      const topY = sl.kind === 'hook' ? (sl.tt ? 330 : 120) : (sl.tt ? 150 : 20);   // TikTok: fuori dalle fasce coperte dall'interfaccia
      if (sl.kind === 'hook') {
        shadow(14); x.fillStyle = cream; x.font = '700 88px Cinzel';
        x.fillText('36 PIANI.', sl.W / 2, topY + 70);
        x.fillStyle = gold; x.fillText('UN SOLO PORTALE.', sl.W / 2, topY + 170);
        x.fillStyle = '#efe4cb'; x.font = 'italic 500 38px "Source Serif 4"';
        x.fillText('Planar Escape · gioco da tavolo cooperativo', sl.W / 2, topY + 240);
        if (sl.handleUnderHook) { x.fillStyle = cream; x.font = '700 40px Cinzel'; x.fillText('@planar.escape', sl.W / 2, topY + 310); }
        noShadow();
      } else if (sl.title) {
        shadow(12); x.fillStyle = gold; x.font = '700 64px Cinzel';
        x.fillText(sl.title, sl.W / 2, topY + 50);
        noShadow();
        x.fillStyle = gold; x.fillRect(sl.W / 2 - 110, topY + 80, 220, 3);
      }
      // frecce e didascalie
      const label = (l) => {
        const lines = l.t.split('\n');
        x.font = '600 36px Cinzel';
        const wBox = Math.max(...lines.map(t => x.measureText(t).width)) + 44, hBox = lines.length * 46 + 22;
        let [bx, by] = l.box;
        if (l.side === 'l') bx = 40;
        const [tx, ty] = toCanvas(l.pt);
        // linea dal bordo piu' vicino della scatola al punto
        const cx = Math.min(Math.max(tx, bx), bx + wBox), cy = Math.min(Math.max(ty, by), by + hBox);
        x.strokeStyle = gold; x.lineWidth = 4; x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 8;
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(tx, ty); x.stroke();
        x.fillStyle = gold; x.beginPath(); x.arc(tx, ty, 11, 0, 7); x.fill();
        x.strokeStyle = '#0a0d1c'; x.lineWidth = 3; x.beginPath(); x.arc(tx, ty, 11, 0, 7); x.stroke();
        noShadow();
        x.fillStyle = 'rgba(8,10,24,.84)'; x.strokeStyle = gold; x.lineWidth = 3;
        const r = 14; x.beginPath(); x.roundRect(bx, by, wBox, hBox, r); x.fill(); x.stroke();
        x.fillStyle = cream; x.textAlign = 'left';
        lines.forEach((t, i) => x.fillText(t, bx + 22, by + 46 + i * 46 - 4));
        x.textAlign = 'center';
      };
      sl.labels.forEach(label);
      // nome del profilo (e invito alla demo nell'ultima slide)
      shadow(10); x.fillStyle = cream; x.font = '700 40px Cinzel';
      if (sl.handleY) x.fillText('@planar.escape', sl.W / 2, sl.handleY);
      if (sl.cta && sl.handleY) { x.fillStyle = gold; x.font = 'italic 500 34px "Source Serif 4"'; x.fillText('la demo giocabile è nel link in bio', sl.W / 2, sl.handleY + 50); }
      noShadow();
      return c.toDataURL('image/jpeg', 0.93).split(',')[1];
    }, [sl, P]);
    fs.writeFileSync(path.join(OUT, sl.file + '.jpg'), Buffer.from(b64, 'base64'));
    console.log('OK', sl.file);
  }
  await browser.close();
  fs.unlinkSync(tmp);
  console.log('Fatto in ' + OUT);
})();
