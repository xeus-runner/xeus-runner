// Generate a runnable static/live/<name>.html page from the ```html live code block in each
// docs/examples/<name>.mdx file.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const cdn = 'https://cdn.jsdelivr.net/npm/@xeus-runner/xeus-runner@VERSION/dist_web/xeus-runner.js';

for (const file of readdirSync('docs/examples')) {
  if (!file.endsWith('.mdx')) {
    continue;
  }
  const match = readFileSync(`docs/examples/${file}`, 'utf8').match(/```html live\n([\s\S]*?)```/);
  if (!match) {
    continue;
  }
  const html = match[1]
    .replace(cdn, '../xeus-runner/xeus-runner.js')
    .replace('<script type="module">', '<script type="text/plain" id="example">')
    .replace(
      '<body>',
      `<head>
  <link rel="stylesheet" href="example.css">
  <script src="resize.js" defer></script>
  <script src="theme.js"></script>
</head>
<body>
  <button id="run">Run</button>`,
    )
    .replace(
      '</body>',
      `  <script>
    document.getElementById('run').onclick = (event) => {
      event.target.disabled = true;
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = document.getElementById('example').textContent;
      document.body.append(script);
    };
  </script>
</body>`,
    );

  writeFileSync(`static/live/${file.replace('.mdx', '.html')}`, html);
}
