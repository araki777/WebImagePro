const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  lines.forEach(line => {
    const match = line.match(/^(\w+)=["']?(.*?)["']?$/);
    if (match) {
      const [key, value] = match;
      process.env[key] = value;
    }
  })
}