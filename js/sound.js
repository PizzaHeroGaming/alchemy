// Audio. Most cues are synthesised on the fly with Web Audio so the
// game ships almost zero audio assets — the only files in
// assets/audio/ are signature stings from licensed sources (Kevin
// MacLeod's "Discovery Hit" for rank-up, future ambient music, etc.)
// where the procedural version isn't good enough.
//
// Mute + volume preferences persist in localStorage. The AudioContext
// is created lazily on the first user interaction so we don't trip
// browser autoplay policies; stings are fetched + decoded on the same
// first-gesture event.
(function (global) {
  'use strict';

  const KEY_MUTED  = 'alchemy_muted';
  const KEY_VOLUME = 'alchemy_volume';
  const KEY_MUSIC_MUTED  = 'alchemy_music_muted';
  const KEY_MUSIC_VOLUME = 'alchemy_music_volume';

  let ctx = null;
  let masterGain = null;
  let muted = false;
  let volume = 0.5;

  // Music settings (independent from SFX)
  let musicMuted  = false;
  let musicVolume = 0.35;     // a touch under SFX so it sits in the back

  // ---- Pre-recorded sting buffers ---------------------------------------
  // Loaded once after the first user gesture (when the AudioContext goes
  // live). Stored by short name so callers don't carry URLs around.
  const stingBuffers = new Map();   // name -> AudioBuffer
  const STING_SOURCES = {
    'rank-up': 'assets/audio/discovery-hit.mp3',
  };

  async function loadSting(name, url) {
    if (!ctx) return;
    if (stingBuffers.has(name)) return;
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      const ab  = await res.arrayBuffer();
      const buf = await new Promise((resolve, reject) =>
        ctx.decodeAudioData(ab, resolve, reject)
      );
      stingBuffers.set(name, buf);
    } catch (e) {
      // Silent — procedural fallbacks handle the absence.
      console.warn('[sound] sting load failed for "' + name + '":', e);
    }
  }

  function preloadStings() {
    for (const name in STING_SOURCES) loadSting(name, STING_SOURCES[name]);
  }

  function playSting(name) {
    if (!canPlay()) return false;
    const buf = stingBuffers.get(name);
    if (!buf) return false;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(masterGain);
    src.start(ctx.currentTime);
    return true;
  }

  // ---- Background music playlist --------------------------------------
  // Three Kevin MacLeod ambient tracks, shuffled — when one ends, advance
  // to a different one (same track won't play twice in a row). Routed
  // through musicGain so volume is independently adjustable from SFX.
  const MUSIC_TRACKS = [
    'assets/audio/southern-gothic.mp3',
    'assets/audio/kalimba-relaxation.mp3',
    'assets/audio/night-vigil.mp3',
  ];
  let musicElement = null;
  let musicSource  = null;
  let musicGain    = null;
  let musicTrackIndex = -1;
  let musicStarted = false;

  function ensureMusicStarted() {
    if (musicStarted || !ctx || musicMuted) return;
    if (MUSIC_TRACKS.length === 0) return;
    musicStarted = true;
    try {
      musicGain = ctx.createGain();
      musicGain.gain.value = musicVolume;
      musicGain.connect(masterGain);
    } catch (e) {
      console.warn('[sound] music gain init failed:', e);
      musicStarted = false;
      return;
    }
    // Random starting track so the same one doesn't play first every launch.
    musicTrackIndex = Math.floor(Math.random() * MUSIC_TRACKS.length);
    playCurrentTrack();
  }

  function playCurrentTrack() {
    if (!ctx || musicTrackIndex < 0) return;
    const url = MUSIC_TRACKS[musicTrackIndex];
    try {
      // Tear down any previous element first.
      if (musicElement) {
        try { musicElement.pause(); } catch (e) {}
        musicElement.src = '';
      }
      if (musicSource) {
        try { musicSource.disconnect(); } catch (e) {}
        musicSource = null;
      }
      musicElement = new Audio(url);
      musicElement.preload = 'auto';
      musicElement.addEventListener('ended', advanceMusicTrack);
      // Route through WebAudio so we share gain control with SFX.
      musicSource = ctx.createMediaElementSource(musicElement);
      musicSource.connect(musicGain);
      musicElement.play().catch(() => {
        // Autoplay blocked or aborted — fine, will retry on next user gesture.
      });
    } catch (e) {
      console.warn('[sound] music play failed:', e);
    }
  }

  function advanceMusicTrack() {
    // Avoid same-track-back-to-back by picking a different index when possible.
    if (MUSIC_TRACKS.length > 1) {
      let next = musicTrackIndex;
      while (next === musicTrackIndex) {
        next = Math.floor(Math.random() * MUSIC_TRACKS.length);
      }
      musicTrackIndex = next;
    }
    playCurrentTrack();
  }

  // Music control API — independent from SFX mute/volume
  function setMusicMuted(m) {
    musicMuted = !!m;
    try { localStorage.setItem(KEY_MUSIC_MUTED, musicMuted ? '1' : '0'); } catch (e) {}
    if (musicMuted) {
      if (musicElement) try { musicElement.pause(); } catch (e) {}
    } else if (!musicStarted) {
      ensureMusicStarted();
    } else if (musicElement) {
      musicElement.play().catch(() => {});
    }
  }
  function isMusicMuted() { return musicMuted; }
  function setMusicVolume(v) {
    musicVolume = Math.max(0, Math.min(1, v));
    if (musicGain) musicGain.gain.value = musicVolume;
    try { localStorage.setItem(KEY_MUSIC_VOLUME, String(musicVolume)); } catch (e) {}
  }
  function getMusicVolume() { return musicVolume; }

  function init() {
    try { muted  = localStorage.getItem(KEY_MUTED)  === '1'; } catch (e) {}
    try {
      const v = parseFloat(localStorage.getItem(KEY_VOLUME));
      if (!isNaN(v) && v >= 0 && v <= 1) volume = v;
    } catch (e) {}
    try { musicMuted = localStorage.getItem(KEY_MUSIC_MUTED) === '1'; } catch (e) {}
    try {
      const mv = parseFloat(localStorage.getItem(KEY_MUSIC_VOLUME));
      if (!isNaN(mv) && mv >= 0 && mv <= 1) musicVolume = mv;
    } catch (e) {}

    // Resume audio context on first user gesture (browsers require this).
    // iOS Safari has historically been picky about *which* event types
    // qualify, so we listen to several and run from the first that fires.
    // After the context is alive, kick off sting preloading + background
    // music (if a track is configured).
    const arm = () => {
      ensureContext();
      preloadStings();
      ensureMusicStarted();
      document.removeEventListener('pointerdown', arm, true);
      document.removeEventListener('touchstart',  arm, true);
      document.removeEventListener('keydown',     arm, true);
      document.removeEventListener('click',       arm, true);
    };
    document.addEventListener('pointerdown', arm, true);
    document.addEventListener('touchstart',  arm, true);
    document.addEventListener('keydown',     arm, true);
    document.addEventListener('click',       arm, true);

    setupVisibilityHandling();
  }

  // Pause music + suspend the audio context when the app backgrounds
  // (phone locks, screen off, app switcher, etc.). Resume on foreground.
  // Without this, music plays with the phone locked — annoying for the
  // player and a battery drain. Hooks both visibilitychange (universal)
  // and Capacitor's App.appStateChange (more reliable in the wrapped
  // Android WebView).
  function setupVisibilityHandling() {
    function pauseAudio() {
      if (musicElement && !musicElement.paused) {
        try { musicElement.pause(); } catch (e) {}
      }
      if (ctx && ctx.state === 'running' && ctx.suspend) {
        ctx.suspend().catch(() => {});
      }
    }
    function resumeAudio() {
      if (ctx && ctx.state === 'suspended' && ctx.resume) {
        ctx.resume().catch(() => {});
      }
      // Only auto-resume music if the player hasn't muted it and the
      // playlist has started before.
      if (musicElement && !musicMuted && musicStarted) {
        musicElement.play().catch(() => {});
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseAudio();
      else resumeAudio();
    });

    // Capacitor App plugin backup signal — fires on native lifecycle
    // events the WebView may not catch as visibilitychange.
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      try {
        window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
          if (state && state.isActive) resumeAudio();
          else pauseAudio();
        });
      } catch (e) {
        console.warn('[sound] App.appStateChange listener failed:', e);
      }
    }
  }

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function canPlay() { return !muted && ensureContext() !== null; }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(KEY_MUTED, muted ? '1' : '0'); } catch (e) {}
  }
  function isMuted() { return muted; }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain) masterGain.gain.value = volume;
    try { localStorage.setItem(KEY_VOLUME, String(volume)); } catch (e) {}
  }
  function getVolume() { return volume; }

  // ---- Helpers ------------------------------------------------------------
  // Build a short tone with an attack/decay envelope.
  function tone(freq, dur, opts) {
    if (!canPlay()) return;
    opts = opts || {};
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = opts.type || 'sine';
    if (opts.freqEnd != null) {
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), now + dur);
    } else {
      osc.frequency.value = freq;
    }
    const peak = (opts.peak != null ? opts.peak : 0.3);
    const attack = (opts.attack != null ? opts.attack : 0.008);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    osc.connect(g).connect(masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  // Filtered white-noise burst.
  function noise(dur, opts) {
    if (!canPlay()) return;
    opts = opts || {};
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'bandpass';
    if (opts.freqStart != null && opts.freqEnd != null) {
      filter.frequency.setValueAtTime(opts.freqStart, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), now + dur);
    } else {
      filter.frequency.value = opts.freq || 1000;
    }
    filter.Q.value = opts.Q || 1;
    const g = ctx.createGain();
    const peak = opts.peak != null ? opts.peak : 0.18;
    const attack = opts.attack != null ? opts.attack : 0.02;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(peak, now + attack);
    g.gain.linearRampToValueAtTime(0, now + dur);
    src.connect(filter).connect(g).connect(masterGain);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  // ---- Specific sounds ----------------------------------------------------

  // Element settles into a slot — short tonal clink.
  function slotFill() {
    tone(900, 0.18, { type: 'sine', freqEnd: 480, peak: 0.28, attack: 0.004 });
    tone(450, 0.22, { type: 'triangle', peak: 0.12, attack: 0.01 });
  }

  // Channels ignite — rising filtered whoosh.
  function channelIgnite() {
    noise(0.9, { filterType: 'bandpass', freqStart: 200, freqEnd: 2400, Q: 4, peak: 0.18 });
    tone(120, 0.5, { type: 'sine', peak: 0.08, attack: 0.04 });
  }

  // Successful brew — gold chime arpeggio.
  function brewSuccess() {
    if (!canPlay()) return;
    // C major arpeggio (C5 E5 G5 C6) staggered.
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const start = now + i * 0.08;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.18, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, start + 1.2);
      osc.connect(g).connect(masterGain);
      osc.start(start);
      osc.stop(start + 1.3);
    });
    // Sub-bass thump for body
    tone(80, 1.4, { type: 'sine', peak: 0.16, attack: 0.04 });
  }

  // Failed brew — three layered moments:
  //   1. A heavy low thud (the brew rejects, vessel slams shut)
  //   2. A high-pass steam hiss escaping (smoke billowing)
  //   3. A low descending sigh that fades (the working dying)
  // Total ~1.1s. Tuned to the failure animation: jolt + smoke + crucible
  // fizzle + slot shake.
  function brewFail() {
    if (!canPlay()) return;
    const now = ctx.currentTime;

    // 1. Heavy impact thud.
    const thudOsc = ctx.createOscillator();
    const thudG   = ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(85, now);
    thudOsc.frequency.exponentialRampToValueAtTime(38, now + 0.22);
    thudG.gain.setValueAtTime(0, now);
    thudG.gain.linearRampToValueAtTime(0.34, now + 0.004);
    thudG.gain.exponentialRampToValueAtTime(0.0005, now + 0.25);
    thudOsc.connect(thudG).connect(masterGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.27);

    // 2. Steam / smoke hiss — opens up, then fades.
    const hissDur = 0.95;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * hissDur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const hiss = ctx.createBufferSource();
    hiss.buffer = buf;
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.setValueAtTime(450, now + 0.04);
    hissFilter.frequency.exponentialRampToValueAtTime(3000, now + 0.55);
    hissFilter.Q.value = 0.4;
    const hissG = ctx.createGain();
    hissG.gain.setValueAtTime(0, now + 0.04);
    hissG.gain.linearRampToValueAtTime(0.14, now + 0.18);
    hissG.gain.linearRampToValueAtTime(0, now + hissDur);
    hiss.connect(hissFilter).connect(hissG).connect(masterGain);
    hiss.start(now + 0.04);
    hiss.stop(now + hissDur + 0.05);

    // 3. Low descending sigh — the working giving up.
    const sighStart = now + 0.28;
    const sighOsc = ctx.createOscillator();
    const sighG   = ctx.createGain();
    sighOsc.type = 'sine';
    sighOsc.frequency.setValueAtTime(180, sighStart);
    sighOsc.frequency.exponentialRampToValueAtTime(75, sighStart + 0.7);
    sighG.gain.setValueAtTime(0, sighStart);
    sighG.gain.linearRampToValueAtTime(0.09, sighStart + 0.1);
    sighG.gain.exponentialRampToValueAtTime(0.0005, sighStart + 0.78);
    sighOsc.connect(sighG).connect(masterGain);
    sighOsc.start(sighStart);
    sighOsc.stop(sighStart + 0.82);
  }

  // Rank up — Kevin MacLeod's "Discovery Hit" sting (CC-BY; credits in
  // the About modal). Falls back to a procedural C-major swell if the
  // MP3 hasn't finished loading yet (e.g. rapid first-session rank-up
  // before the network fetch completed) so the moment always has audio.
  function rankUp() {
    if (playSting('rank-up')) return;

    // Procedural fallback — original celestial swell.
    if (!canPlay()) return;
    const now = ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25];   // C major
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.13, now + 0.4 + i * 0.04);
      g.gain.linearRampToValueAtTime(0, now + 2.2);
      osc.connect(g).connect(masterGain);
      osc.start(now);
      osc.stop(now + 2.3);
    });
    // Bell on top
    tone(1046.5, 1.6, { type: 'triangle', peak: 0.14, attack: 0.02 });
  }

  // Crucible tap — deep thrum.
  function tap() {
    tone(110, 0.32, { type: 'sine', peak: 0.16, attack: 0.018 });
    tone(220, 0.18, { type: 'sine', peak: 0.05, attack: 0.005 });
  }

  // UI click — soft tick.
  function ui() {
    tone(1400, 0.05, { type: 'sine', peak: 0.06, attack: 0.002 });
  }

  global.Sound = {
    init, ensureContext,
    setMuted, isMuted, setVolume, getVolume,
    setMusicMuted, isMusicMuted, setMusicVolume, getMusicVolume,
    slotFill, channelIgnite, brewSuccess, brewFail, rankUp, tap, ui,
  };
})(window);
