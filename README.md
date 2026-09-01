# xeus-runner

Run `xeus` WebAssembly kernels outside of JupyterLite in TypeScript/JavaScript projects.

## Build

To build you need a `nodejs >= 24`.

```bash
npm install
npm run build
```

Output JavaScript is in the `lib` directory.

# Testing

To test, first build the project and then:

```bash
cd test
npm install
npm run build
npm run test
```
