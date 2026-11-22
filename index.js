const http = require('http');
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

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok\n'); return; }
  if (req.url === '/' || req.url === '') {
    const result = await egressIp();
    res.writeHead(result.ip ? 200 : 502, { 'Content-Type': 'text/plain' });
    res.end(result.ip ? result.ip + '\n' : 'error: ' + (result.error || 'unknown') + '\n');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found\n');
});

server.listen(PORT, '0.0.0.0', () => console.log('listening on ' + PORT));
