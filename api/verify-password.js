// Gate a password condivisa per /gioco — non è un vero sistema di autenticazione (nessun
// account, nessuna sessione lato server): serve solo a filtrare chi arriva per curiosità
// da chi vuole davvero provare il simulatore. La password vive in Vercel come env var
// PLAYTEST_PASSWORD, mai nel codice o nel client.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const expected = process.env.PLAYTEST_PASSWORD;
  if (!expected) {
    res.status(500).json({ ok: false, error: 'PLAYTEST_PASSWORD non configurata su Vercel' });
    return;
  }

  let password = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    password = (body && body.password) || '';
  } catch {
    password = '';
  }

  res.status(200).json({ ok: password === expected });
};
