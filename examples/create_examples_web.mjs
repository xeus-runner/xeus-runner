/**
 * Create html files and JS bundles for the TS examples in `templates_web` directory.
 * Multiple examples are created for each .ts template file, one for each worker type.
 * For each example+worker a .html file is created in dist_web/ and a .ts file is created in
 * tmp_web/ that will be compiled and bundled (by esbuild after this script is finished) into a .js
 * file in dist/ that is loaded by the .html file.
 * Also dist/index.html is created with links to all of the examples.
 */

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const rootDir = import.meta.dirname;
const distDir = join(rootDir, 'dist_web');
const tmpDir = join(rootDir, 'tmp_web');
const templateDir = join(rootDir, 'templates_web');
const titleRegex = /^\/\/\s+:title:\s+(.+)$/m;
const noteRegex = /^\/\/\s+:note:\s+(.+)$/m;
const notMainRegex = /^\/\/\s+:not-main:\s+$/m;
const notWorkerRegex = /^\/\/\s+:not-worker:\s+$/m;
const workerRegex = /^( *)\/\/\s+:worker:\s*$/m;

const workerNames = {
  main: 'main thread',
  worker: 'web worker',
};

for (const dir of [distDir, tmpDir]) {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
}

function languageText(language) {
  if (language === 'cpp') {
    return 'C++';
  } else if (language === 'lfortran') {
    return 'LFortran';
  } else {
    return language[0].toUpperCase() + language.slice(1);
  }
}

const htmlTemplate = readFileSync(join(templateDir, 'example.html'), 'utf8');
const tsFiles = readdirSync(templateDir)
  .filter((name) => name.endsWith('.ts'))
  .sort();
const allByLanguage = {};

for (const file of tsFiles) {
  const name = file.replace(/\.[^/.]*$/, '');
  const i = name.indexOf('_');
  const language = i < 0 ? name : name.slice(0, i);

  const source = readFileSync(join(templateDir, file), 'utf8');

  const title = source.match(titleRegex)?.[1] ?? name;
  const note = source.match(noteRegex)?.[1];
  const notMain = notMainRegex.test(source);
  const notWorker = notWorkerRegex.test(source);

  if (!workerRegex.test(source)) {
    throw new Error(`Abort as no :worker: in ${file} template`);
  }

  const workerTypes = [];
  if (!notMain) {
    workerTypes.push('main');
  }
  if (!notWorker) {
    workerTypes.push('worker');
  }

  if (!Object.hasOwn(allByLanguage, language)) {
    allByLanguage[language] = [];
  }
  allByLanguage[language].push({ name, note, title, workerTypes });

  for (const workerType of workerTypes) {
    const nameWorker = `${name}_${workerType}`;
    const titleWorker = `${title} in ${workerNames[workerType]}`;
    const html = htmlTemplate
      .replaceAll('{{ title }}', titleWorker)
      .replaceAll('{{ name }}', nameWorker)
      .replaceAll('{{ language }}', languageText(language));
    const htmlFilename = join(distDir, `${nameWorker}.html`);
    writeFileSync(htmlFilename, html);

    const tsFilename = join(tmpDir, `${nameWorker}.ts`);
    const ts = source
      .replace(workerRegex, `$1worker: ${workerType === 'worker'}`)
      .replaceAll('{{ workerName }}', workerNames[workerType]);
    writeFileSync(tsFilename, ts);
  }
}

// Write index file. Could use a TS/JS template engine for this instead.
const index = createWriteStream(join(distDir, 'index.html'));

index.write(`<!DOCTYPE html>
<html>
<head>
  <title>xeus-runner examples</title>
  <link rel="stylesheet" href="example.css">
</head>
`);

index.write('<body>\n');
index.write('  <h2>xeus-runner examples</h2>\n');
index.write('  <ul>\n');
for (const language of Object.keys(allByLanguage)) {
  index.write(`    <li>${languageText(language)}\n`);
  index.write('      <ul>\n');
  for (const example of allByLanguage[language]) {
    const { workerTypes, name, note } = example;
    const links = workerTypes
      .map((w) => ` <a href="${name}_${w}.html">${workerNames[w]}</a>`)
      .join('');
    let line = `        <li>${example.title}`;
    if (note !== undefined) {
      line = `${line} (${note})`;
    }
    line = `${line}:${links}</li>\n`;
    index.write(line);
  }
  index.write('      </ul>\n');
  index.write('    </li>\n');
}
index.write('  </ul>\n');
index.write(
  '  <p id="cross-origin-4500" hidden>Cross-origin import:' +
    ' <a href="http://localhost:4500/cross_origin.html">main thread</a>' +
    ' <a href="http://localhost:4500/cross_origin.html?worker">web worker</a> (no stdin in either)</p>\n',
);
index.write(
  '  <p id="cross-origin-4501" hidden>Cross-origin import, cross-origin isolated:' +
    ' <a href="http://127.0.0.1:4501/cross_origin.html">main thread</a>' +
    ' <a href="http://127.0.0.1:4501/cross_origin.html?worker">web worker</a> (stdin in worker only)</p>\n',
);
index.write(
  "  <script>document.getElementById(location.port === '4501' ? 'cross-origin-4501' : 'cross-origin-4500').hidden = false;</script>\n",
);
index.write('</body>\n');
index.write('</html>\n');
