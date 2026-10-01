// Gate per /gioco — non è un vero sistema di autenticazione (nessun account, nessuna
// sessione lato server). La demo pubblica (filtrata da CURRENT_WAVE, reveal progressivo)
// non richiede più alcuna password: chiunque arrivi ci entra subito. Solo lo sblocco
// completo (tutte le onde, per i test) resta dietro password, in Vercel come env var,
// mai nel codice o nel client:
//   MASTER_PASSWORD — accesso sempre completo, a prescindere da CURRENT_WAVE
//   CURRENT_WAVE    — numero dell'onda di reveal attuale, alzato a mano ogni settimana
// PLAYTEST_PASSWORD non è più usata (la password pubblica è stata rimossa): se è ancora
// impostata su Vercel non ha più alcun effetto, si può lasciare o cancellare a piacere.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const masterPw = process.env.MASTER_PASSWORD;

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
  // Nessuna password (richiesta automatica all'ingresso) → demo pubblica, sempre concessa.
  if (!password) {
    res.status(200).json({ ok: true, tier: 'public', currentWave });
    return;
  }
  // Password inserita a mano ma non corrispondente alla master → errore, per dare un
  // riscontro a chi sta davvero provando a sbloccare tutto (non si ricade silenziosamente
  // sul pubblico: altrimenti un errore di battitura sembrerebbe un login riuscito).
  res.status(200).json({ ok: false });
};
