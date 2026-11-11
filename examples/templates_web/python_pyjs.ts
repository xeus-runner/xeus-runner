// :title: pyjs modifying DOM
// :note: in web worker needs cross-origin headers

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['pyjs'],
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
kernel.execute({
  code: `from pyjs.js import window

document = window.document

div = document.createElement("div")
div.textContent = "This <div> is created by Python code using pyjs from {{ workerName }}"
div.setAttribute("style", "color: yellow; background-color: indigo; padding: 1em; font-size: 2em")

document.getElementById("target").append(div)`,
});
