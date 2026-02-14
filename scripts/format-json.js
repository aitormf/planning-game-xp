const fs = require('fs');
const os = require('os');

let filePath = "/mnt/c/Users/Mánu Fosela/Downloads/planning-gamexp-default-rtdb_data.json";

if (os.platform() === 'win32') {
  filePath = "c:\\Users\\Mánu Fosela\\Downloads\\planning-gamexp-default-rtdb_data.json";
}

try {
  console.log(`Reading file from ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`Read ${content.length} bytes.`);

  console.log('Parsing JSON...');
  const data = JSON.parse(content);

  console.log('Formatting JSON...');
  const formatted = JSON.stringify(data, null, 2);

  console.log('Writing file...');
  fs.writeFileSync(filePath, formatted);
  console.log('Done.');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
