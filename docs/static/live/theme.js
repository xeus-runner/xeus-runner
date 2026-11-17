const sync = () => {
  document.documentElement.dataset.theme = parent.document.documentElement.dataset.theme;
};
sync();
new MutationObserver(sync).observe(parent.document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});
