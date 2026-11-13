(() => {
  const root = document.getElementById('beyond-form');
  root.querySelectorAll('.research-connection').forEach((section, group) => {
    const paragraphs = [...section.children].filter(el => el.tagName === 'P');
    if (!paragraphs.length) return;
    const list = document.createElement('div');
    list.className = 'research-tabs';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', section.querySelector('strong').textContent);
    const panels = document.createElement('div');
    panels.className = 'research-panels';
    const buttons = paragraphs.map((paragraph, index) => {
      const title = paragraph.querySelector('strong');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = title.textContent.replace(/\.$/, '');
      button.id = `research-tab-${group}-${index}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `research-panel-${group}-${index}`);
      const panel = document.createElement('div');
      panel.id = `research-panel-${group}-${index}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      title.remove();
      panel.append(paragraph);
      panels.append(panel);
      list.append(button);
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % paragraphs.length;
        if (event.key === 'ArrowLeft') next = (index + paragraphs.length - 1) % paragraphs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = paragraphs.length - 1;
        if (next !== undefined) { event.preventDefault(); select(next); buttons[next].focus({preventScroll:true}); }
      });
      return button;
    });
    function select(index) {
      buttons.forEach((button, i) => {
        button.setAttribute('aria-selected', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
        panels.children[i].hidden = i !== index;
      });
    }
    section.querySelector(':scope > strong').after(list, panels);
    section.classList.add('has-research-tabs');
    select(0);
    section.addEventListener('show-concept', event => {
      if (Number.isInteger(event.detail) && event.detail >= 0 && event.detail < buttons.length) select(event.detail);
    });
  });
})();
