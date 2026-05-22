// UI settings: layout (library width) + library tile size, persisted to localStorage.
(function (global) {
  'use strict';

  const KEY_LAYOUT   = 'alchemy_layout';
  const KEY_TILESIZE = 'alchemy_tilesize';
  const KEY_POSITION = 'alchemy_position';

  const LAYOUTS = {
    'focus-board':   { libW: '240px' },
    'balanced':      { libW: '320px' },
    'focus-library': { libW: '48vw' },
  };

  const TILE_SIZES = {
    compact: { lib: 64, icon: 30, name: 8  },
    normal:  { lib: 78, icon: 38, name: 9  },
    large:   { lib: 96, icon: 48, name: 10 },
  };

  const POSITIONS = { right: true, left: true };

  let layout   = 'balanced';
  let tileSize = 'normal';
  let position = 'right';

  function init() {
    layout   = readPref(KEY_LAYOUT, 'balanced', LAYOUTS);
    tileSize = readPref(KEY_TILESIZE, 'normal', TILE_SIZES);
    position = readPref(KEY_POSITION, 'right', POSITIONS);
    apply();
    wireModal();
  }

  function readPref(key, fallback, valid) {
    try {
      const v = localStorage.getItem(key);
      if (v && valid[v]) return v;
    } catch (e) { /* ignore */ }
    return fallback;
  }

  function writePref(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  function apply() {
    const root = document.documentElement;
    root.style.setProperty('--library-w', LAYOUTS[layout].libW);
    const ts = TILE_SIZES[tileSize];
    root.style.setProperty('--lib-tile-size', ts.lib + 'px');
    root.style.setProperty('--lib-icon-size', ts.icon + 'px');
    root.style.setProperty('--lib-name-size', ts.name + 'px');

    document.body.classList.toggle('layout-flipped', position === 'left');

    // Sound mute state (driven by Sound module, but reflected here).
    const soundOn = !(window.Sound && Sound.isMuted && Sound.isMuted());
    for (const b of document.querySelectorAll('#sound-options .settings-opt')) {
      const wantOn = b.dataset.sound === 'on';
      b.classList.toggle('active', wantOn === soundOn);
    }

    // Music mute state — same pattern, independent toggle.
    const musicOn = !(window.Sound && Sound.isMusicMuted && Sound.isMusicMuted());
    for (const b of document.querySelectorAll('#music-options .settings-opt')) {
      const wantOn = b.dataset.music === 'on';
      b.classList.toggle('active', wantOn === musicOn);
    }
    // Music volume slider — sync its position + label from Sound module.
    const vol = (window.Sound && Sound.getMusicVolume) ? Sound.getMusicVolume() : 0.35;
    const slider = document.getElementById('music-volume');
    const label  = document.getElementById('music-volume-value');
    if (slider) slider.value = Math.round(vol * 100);
    if (label)  label.textContent = Math.round(vol * 100) + '%';

    // Update active state on settings buttons (if modal exists).
    for (const b of document.querySelectorAll('#layout-options .settings-opt')) {
      b.classList.toggle('active', b.dataset.layout === layout);
    }
    for (const b of document.querySelectorAll('#tilesize-options .settings-opt')) {
      b.classList.toggle('active', b.dataset.tilesize === tileSize);
    }
    for (const b of document.querySelectorAll('#position-options .settings-opt')) {
      b.classList.toggle('active', b.dataset.position === position);
    }
  }

  function setLayout(name) {
    if (!LAYOUTS[name] || name === layout) return;
    layout = name;
    writePref(KEY_LAYOUT, name);
    apply();
  }

  function setTileSize(name) {
    if (!TILE_SIZES[name] || name === tileSize) return;
    tileSize = name;
    writePref(KEY_TILESIZE, name);
    apply();
  }

  function setPosition(name) {
    if (!POSITIONS[name] || name === position) return;
    position = name;
    writePref(KEY_POSITION, name);
    apply();
  }

  function wireModal() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('btn-settings');
    if (!modal || !openBtn) return;

    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      apply();  // refresh active state on open
    });

    modal.addEventListener('click', (e) => {
      const t = e.target;
      if (t.dataset.close !== undefined) {
        modal.classList.add('hidden');
        return;
      }
      const opt = t.closest('.settings-opt');
      if (!opt) return;
      if (opt.dataset.layout) setLayout(opt.dataset.layout);
      if (opt.dataset.tilesize) setTileSize(opt.dataset.tilesize);
      if (opt.dataset.position) setPosition(opt.dataset.position);
      if (opt.dataset.sound) {
        const wantOn = opt.dataset.sound === 'on';
        if (window.Sound) {
          Sound.setMuted(!wantOn);
          if (wantOn) Sound.ui();   // give immediate audible feedback
        }
        apply();
      }
      if (opt.dataset.music) {
        const wantOn = opt.dataset.music === 'on';
        if (window.Sound && Sound.setMusicMuted) {
          Sound.setMusicMuted(!wantOn);
        }
        apply();
      }
    });

    // Live music-volume slider — update on every drag tick so the player
    // hears the change immediately instead of only on commit.
    const slider = document.getElementById('music-volume');
    if (slider) {
      slider.addEventListener('input', () => {
        const v = parseInt(slider.value, 10) / 100;
        if (window.Sound && Sound.setMusicVolume) Sound.setMusicVolume(v);
        const label = document.getElementById('music-volume-value');
        if (label) label.textContent = Math.round(v * 100) + '%';
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) modal.classList.add('hidden');
    });
  }

  global.Settings = { init, setLayout, setTileSize, setPosition };
})(window);
