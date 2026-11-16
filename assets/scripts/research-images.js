(() => {
  const images = document.querySelectorAll('#fp-research img');
  if (!images.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'research-image-viewer';
  dialog.setAttribute('aria-label', 'Enlarged research image');
  dialog.innerHTML = '<button type="button" class="research-image-close" autofocus>Close ×</button><img class="research-image-large" alt=""><div class="research-image-caption"></div>';
  document.body.append(dialog);
  const enlarged = dialog.querySelector('img');
  const caption = dialog.querySelector('.research-image-caption');
  let opener;
  let previousOverflow;
  function close() { dialog.close(); }
  dialog.querySelector('button').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus({preventScroll: true});
  });
  caption.addEventListener('click', event => {
    if (event.target.closest('a[href^="#"]')) close();
  });
  images.forEach(image => {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-haspopup', 'dialog');
    image.setAttribute('aria-label', `Enlarge image: ${image.alt}`);
    image.title = 'Click to enlarge';
    function open() {
      opener = image;
      enlarged.src = image.currentSrc || image.src;
      enlarged.alt = image.alt;
      caption.replaceChildren();
      const figureCaption = image.closest('figure')?.querySelector('figcaption');
      const columnCaption = image.closest('.image-column')?.querySelector(':scope > .cap');
      const captions = [...new Set([figureCaption, columnCaption].filter(Boolean))];
      captions.forEach(source => {
        const paragraph = document.createElement('p');
        [...source.childNodes].forEach(node => paragraph.append(node.cloneNode(true)));
        caption.append(paragraph);
      });
      if (!captions.length) caption.textContent = image.alt;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
    image.addEventListener('click', open);
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
})();
