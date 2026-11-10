import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = import.meta.dirname;
const distDir = join(rootDir, 'dist_node');
const tmpDir = join(rootDir, 'tmp_node');
const templateDir = join(rootDir, 'templates_node');
//const titleRegex = /^\/\/\s+:title:\s+(.+)$/m;
//const noteRegex = /^\/\/\s+:note:\s+(.+)$/m;
const workerRegex = /^\s*(\/\/\s+:worker:)\s*$/m;

const workerNames = {
  main: 'main thread',
  worker: 'worker',
};

for (const dir of [distDir, tmpDir]) {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
}

/*function languageText(language) {
  if (language === 'cpp') {
    return 'C++';
  } else if (language === 'lfortran') {
    return 'LFortran';
  } else {
    return language[0].toUpperCase() + language.slice(1);
  }
}*/

const tsFiles = readdirSync(templateDir)
  .filter((name) => name.endsWith('.ts'))
  .sort();

for (const file of tsFiles) {
  const name = file.replace(/\.[^/.]*$/, '');
  const source = readFileSync(join(templateDir, file), 'utf8');
  if (!workerRegex.test(source)) {
    throw new Error(`Abort as no :worker: in ${file} template`);
  }

  const workerTypes = ['main', 'worker'];

  for (const workerType of workerTypes) {
    const nameWorker = `${name}_${workerType}`;
    const tsFilename = join(tmpDir, `${nameWorker}.ts`);
    const ts = source
      .replace(workerRegex, `worker: ${workerType === 'worker'}`)
      .replaceAll('{{ workerName }}', workerNames[workerType]);
    writeFileSync(tsFilename, ts);
  }
}
