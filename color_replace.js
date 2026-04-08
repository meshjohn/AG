const fs = require('fs');
const path = require('path');

const files = [
  'e:/gallery/alaa-gallery/src/components/HUD.module.css',
  'e:/gallery/alaa-gallery/src/components/DetailPanel.module.css',
  'e:/gallery/alaa-gallery/src/components/LoadingScreen.module.css'
];

const replacers = [
  { search: /200,\s*168,\s*75/g, replace: '191, 161, 95' },
  { search: /5,\s*4,\s*3/g, replace: '3, 5, 8' },
  { search: /10,\s*8,\s*6/g, replace: '6, 9, 14' },
  { search: /20,\s*16,\s*12/g, replace: '12, 18, 28' },
  { search: /#0e0c0a/gi, replace: '#0a0f18' },
  { search: /#050403/gi, replace: '#030508' },
  { search: /rgba\(\s*255,\s*240,\s*210/ig, replace: 'rgba(238, 240, 242' },
  { search: /rgba\(\s*240,\s*230,\s*210/ig, replace: 'rgba(238, 240, 242' },
  { search: /rgba\(\s*255,\s*235,\s*190/ig, replace: 'rgba(238, 240, 242' },
  { search: /rgba\(\s*200,\s*185,\s*160/ig, replace: 'rgba(180, 188, 200' }, // Detail panel description
  { search: /#f0e1be/gi, replace: '#eef0f2' }, // Loading screen title
  { search: /rgba\(\s*240,\s*230,\s*210/ig, replace: 'rgba(238, 240, 242' }
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  for (const r of replacers) {
    content = content.replace(r.search, r.replace);
  }
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}
