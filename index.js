const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'cweb-egress-ip-test/1.0' } });
  if (!res.ok) throw new Error(url + ' HTTP ' + res.status);
  return (await res.text()).trim();
}

async function egressIp() {
  try { return { ip: await fetchText('https://api.ipify.org'), source: 'api.ipify.org' }; }
  catch (e) {
    try { return { ip: await fetchText('https://ifconfig.me/ip'), source: 'ifconfig.me/ip' }; }
    catch (e2) { return { ip: null, source: null, error: String(e2 && e2.message ? e2.message : e2) }; }
  }
}

app.get('/', async (req, res) => {
  const result = await egressIp();
  res.type('text/plain');
  if (result.ip) res.send(result.ip + '\n');
  else res.status(502).send('error: ' + (result.error || 'unknown') + '\n');
});

app.get('/health', (req, res) => res.type('text/plain').send('ok\n'));

app.listen(PORT, '0.0.0.0', () => console.log('listening on ' + PORT));
