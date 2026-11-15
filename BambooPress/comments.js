const GISCUS_ORIGIN = 'https://giscus.app';
const GISCUS_CONFIG = {
  repo: 'Frankhuex/Frankhuex.github.io',
  repoId: 'R_kgDOLalNVg',
  categories: {
    shelf: {
      name: 'BambooPress 书架',
      id: 'DIC_kwDOLalNVs4DLMsC'
    },
    book: {
      name: 'BambooPress 书评',
      id: 'DIC_kwDOLalNVs4DLMpe'
    },
    chapter: {
      name: 'BambooPress 章评',
      id: 'DIC_kwDOLalNVs4DLMpl'
    }
  }
};

const DARK_THEMES = new Set(['black', 'night', 'immerse-dark']);

function currentGiscusTheme() {
  return DARK_THEMES.has(document.body.dataset.theme) ? 'noborder_dark' : 'noborder_light';
}

function syncGiscusTheme(section) {
  const frame = section.querySelector('iframe.giscus-frame');
  if (!frame?.contentWindow) return;
  frame.contentWindow.postMessage(
    {giscus: {setConfig: {theme: currentGiscusTheme()}}},
    GISCUS_ORIGIN
  );
}

/**
 * Mounts a lazy-loaded Giscus comment section into the given container.
 */
export function mountComments(container, {kind, term, label}) {
  const category = GISCUS_CONFIG.categories[kind];
  if (!container || !category || !term) return () => {};

  const section = document.createElement('section');
  section.className = 'comments-section';
  section.setAttribute('aria-label', label);

  const host = document.createElement('div');
  host.className = 'giscus';

  section.append(host);
  container.append(section);

  let loaded = false;
  let disposed = false;

  const themeObserver = new MutationObserver(() => {
    if (!disposed) syncGiscusTheme(section);
  });
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  function loadGiscus() {
    if (loaded || disposed) return;
    loaded = true;
    const script = document.createElement('script');
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.repo = GISCUS_CONFIG.repo;
    script.dataset.repoId = GISCUS_CONFIG.repoId;
    script.dataset.category = category.name;
    script.dataset.categoryId = category.id;
    script.dataset.mapping = 'specific';
    script.dataset.term = term;
    script.dataset.strict = '1';
    script.dataset.reactionsEnabled = '1';
    script.dataset.emitMetadata = '0';
    script.dataset.inputPosition = 'top';
    script.dataset.theme = currentGiscusTheme();
    script.dataset.lang = 'zh-CN';
    host.append(script);
  }

  let observer = null;
  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          observer = null;
          loadGiscus();
        }
      },
      {rootMargin: '240px 0px'}
    );
    observer.observe(section);
  } else {
    loadGiscus();
  }

  return () => {
    disposed = true;
    observer?.disconnect();
    themeObserver.disconnect();
  };
}
