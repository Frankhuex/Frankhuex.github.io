export function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(`bamboo-${key}`)) ?? fallback; } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(`bamboo-${key}`, JSON.stringify(value)); } catch { /* Reading remains available when storage is full. */ }
}
export const settings = read('settings', {font: innerWidth < 960 ? 18 : 19, leading:1.9,theme:'warm',signatures:true});
export function applySettings() {
  document.documentElement.style.setProperty('--font', `${settings.font}px`);
  document.documentElement.style.setProperty('--leading', settings.leading);
  document.body.dataset.theme = settings.theme;
  document.body.classList.toggle('hide-signatures', !settings.signatures);
}
export function setupSettings() {
  applySettings();
  const dialog = document.querySelector('#settings');
  let closing = false;
  function closeSettings() {
    if (closing || !dialog.open) return;
    closing = true;
    dialog.classList.add('closing');
    const finish = () => {
      dialog.close();
      dialog.classList.remove('closing');
      closing = false;
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
    } else {
      setTimeout(finish, 180);
    }
  }
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    closeSettings();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeSettings();
  });

  let pointerStartedOutside = false;
  function outsideDialog(event) {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
  dialog.addEventListener('pointerdown', event => {
    pointerStartedOutside = event.target === dialog && outsideDialog(event);
  });
  dialog.addEventListener('click', event => {
    if (pointerStartedOutside && event.target === dialog && outsideDialog(event)) {
      closeSettings();
    }
    pointerStartedOutside = false;
  });

  document.querySelector('#settings-open').onclick = () => dialog.showModal();
  for (const radio of dialog.querySelectorAll('[name=paper]')) {
    radio.checked = radio.value === settings.theme;
    radio.onchange = () => {
      settings.theme = radio.value;
      applySettings();
      save('settings', settings);
    };
  }
  for (const key of ['font','leading','signatures']) {
    const input = document.getElementById(key);
    if (key === 'signatures') input.checked = settings[key]; else input.value = settings[key];
    const output = document.getElementById(`${key}-value`);
    const updateOutput = () => {
      if (output) output.value = key === 'font' ? `${input.value} px` : Number(input.value).toFixed(1);
    };
    updateOutput();
    input.oninput = () => {
      updateOutput();
      settings[key] = key === 'signatures' ? input.checked : ['font','leading'].includes(key) ? Number(input.value) : input.value;
      applySettings(); save('settings', settings);
    };
  }
}
