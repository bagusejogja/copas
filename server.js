const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

// File Logging
const logFile = fs.createWriteStream(path.join(__dirname, 'stderr.log'), { flags: 'a' });
process.stderr.write = logFile.write.bind(logFile);
process.stdout.write = logFile.write.bind(logFile);

const dev = false
const hostname = 'localhost'
const port = process.env.PORT || 3000
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

console.log(`[${new Date().toISOString()}] Starting application...`);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
}).catch((err) => {
  console.error('App prepare failed:', err);
  process.exit(1);
});
