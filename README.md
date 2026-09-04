# xeus-runner

Run `xeus` WebAssembly kernels outside of JupyterLite in TypeScript/JavaScript projects.

## Kernel languages supported

- xeus-cpp
- xeus-haskell
- xeus-lfortran
- xeus-lua
- xeus-octave
- xeus-python
- xeus-r
- xeus-shakespearelang
- xeus-sqlite

## Build

To build you need a `nodejs >= 24`.

```bash
npm install
npm run build
```

Output JavaScript is in the `lib` directory.

## Testing

To test, first build the project and then:

```bash
cd test
npm install
npx playwright install chromium
npm run build
npm run test
```
