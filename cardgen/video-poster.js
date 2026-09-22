// Estrae il primo fotogramma di ogni video della landing come JPEG, da usare come
// attributo `poster` dei tag <video> — così il player mostra un'anteprima invece di
// un riquadro nero prima del play. Usa Chromium stesso (via <video>+<canvas>), senza
// librerie di decodifica video extra.
//
// Uso: node video-poster.js

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const VIDEO_DIR = path.join(__dirname, '..', 'assets', 'video');
const QUALITY = 0.85;

const VIDEOS = ['drago_scontro', 'salto_manina', 'fuga_baratro', 'fuga_tempesta'];

async function run() {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const harnessPath = path.join(__dirname, '_video-poster.html');
  fs.writeFileSync(harnessPath, '<video id="v" muted playsinline></video><canvas id="c"></canvas>');
  await page.goto(pathToFileURL(harnessPath).href);

  for (const name of VIDEOS) {
    const src = path.join(VIDEO_DIR, name + '.mp4');
    const out = path.join(VIDEO_DIR, name + '_poster.jpg');
    if (!fs.existsSync(src)) { console.error(`  MANCA ${src}`); continue; }
    const fileUrl = pathToFileURL(src).href;
    try {
      const dataUrl = await page.evaluate(async ({ fileUrl, quality }) => {
        const video = document.getElementById('v');
        await new Promise((resolve, reject) => {
          video.onloadeddata = resolve;
          video.onerror = () => reject(new Error('video non caricato: ' + fileUrl));
          video.src = fileUrl;
          video.currentTime = 0.05;
        });
        // aspetta che il frame a currentTime sia davvero decodificato, non solo i metadata
        await new Promise((resolve) => {
          if (video.readyState >= 2) return resolve();
          video.onseeked = resolve;
        });
        const canvas = document.getElementById('c');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', quality);
      }, { fileUrl, quality: QUALITY });
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(out, Buffer.from(base64, 'base64'));
      console.log(`  OK ${name}_poster.jpg (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.error(`  ERRORE ${name}:`, e.message);
    }
  }

  await browser.close();
  fs.unlinkSync(harnessPath);
}

run();
