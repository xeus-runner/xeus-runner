new ResizeObserver(() => {
  window.frameElement.style.height = `${document.documentElement.offsetHeight}px`;
}).observe(document.body);
