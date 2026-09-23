// Gate a password condivisa per /gioco — non è un vero sistema di autenticazione (nessun
// account, nessuna sessione lato server): serve solo a filtrare chi arriva per curiosità
// da chi vuole davvero provare il simulatore. Le password vivono in Vercel come env var,
// mai nel codice o nel client:
//   PLAYTEST_PASSWORD — password pubblica, filtrata da CURRENT_WAVE (reveal progressivo)
//   MASTER_PASSWORD   — accesso sempre completo, a prescindere da CURRENT_WAVE (per i test)
//   CURRENT_WAVE      — numero dell'onda di reveal attuale, alzato a mano ogni settimana
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const publicPw = process.env.PLAYTEST_PASSWORD;
  const masterPw = process.env.MASTER_PASSWORD;
  if (!publicPw && !masterPw) {
    res.status(500).json({ ok: false, error: 'Nessuna password configurata su Vercel (PLAYTEST_PASSWORD / MASTER_PASSWORD)' });
    return;
  }

  let password = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    password = (body && body.password) || '';
  } catch {
    password = '';
  }

  const parsedWave = parseInt(process.env.CURRENT_WAVE, 10);
  const currentWave = Number.isFinite(parsedWave) ? parsedWave : 1;

  if (masterPw && password === masterPw) {
    res.status(200).json({ ok: true, tier: 'master', currentWave });
    return;
  }
  if (publicPw && password === publicPw) {
    res.status(200).json({ ok: true, tier: 'public', currentWave });
    return;
  }
  res.status(200).json({ ok: false });
};
