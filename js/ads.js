// Rewarded-ad bridge. On a Capacitor-wrapped build this calls into the
// native AndroidAds interface; on the web it shows a simulated rewarded
// ad so the flow can be tested without a wrapper. Callers pass a single
// callback that fires with `true` on success, `false` on cancel/fail.
//
// PC/Steam builds never invoke this — the caller is responsible for
// hiding any ad-CTA on non-mobile via `GameAds.isMobile()`.
//
// ============================================================
//  MASTER ENABLE FLAG
//  Auto-detects the Capacitor wrapper at RUNTIME (not load-time)
//  so async-injected native bridges still resolve cleanly. On a
//  wrapped Android build window.Capacitor is injected by the
//  native shell — sometimes before our scripts run, sometimes
//  just after. Evaluating each call sidesteps the race.
//
//  In a plain browser (web testing flow), neither window.Capacitor
//  nor window.AndroidAds exists, so the Hint button stays hidden
//  and no fake-ad overlay fires.
//
//  Force-enable for browser flow testing by uncommenting the
//  return true below.
// ============================================================
(function (global) {
  'use strict';

  function adsEnabled() {
    // return true;  // <-- uncomment to force-enable in a browser
    return typeof window !== 'undefined' &&
           (!!window.Capacitor || !!window.AndroidAds);
  }

  // Touch + UA + width detection. Cached after first call so it can't
  // flip mid-session (a dock or external monitor toggle would otherwise
  // race with already-mounted UI state).
  let _isMobileCached = null;
  function isMobile() {
    if (_isMobileCached !== null) return _isMobileCached;
    const ua = navigator.userAgent || '';
    const touch   = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const phoneUA = /Android|iPhone|iPod|iPad|Mobile/i.test(ua);
    const narrow  = window.innerWidth <= 900;
    _isMobileCached = touch && (phoneUA || narrow);
    return _isMobileCached;
  }

  function nativeAvailable() {
    return !!(window.AndroidAds && typeof window.AndroidAds.showRewarded === 'function');
  }

  // showRewarded(callback): callback(success) fires once.
  // On Capacitor builds we wait for window.__onRewarded(success) from the
  // native side. On the web we run the simulation directly.
  function showRewarded(callback) {
    if (nativeAvailable()) {
      window.__onRewarded = (success) => {
        window.__onRewarded = null;
        if (typeof callback === 'function') callback(!!success);
      };
      try { window.AndroidAds.showRewarded(); }
      catch (e) {
        window.__onRewarded = null;
        if (typeof callback === 'function') callback(false);
      }
      return;
    }
    simulateRewardedAd(callback);
  }

  function simulateRewardedAd(callback) {
    let done = false;
    function finish(success) {
      if (done) return;
      done = true;
      clearInterval(interval);
      overlay.remove();
      if (typeof callback === 'function') callback(success);
    }

    const overlay = document.createElement('div');
    overlay.className = 'fake-ad-overlay';
    overlay.innerHTML =
      '<div class="fake-ad-card">' +
        '<div class="fake-ad-label">Simulated rewarded ad</div>' +
        '<div class="fake-ad-art" aria-hidden="true">⚗</div>' +
        '<div class="fake-ad-count">Reward in <span class="fake-ad-num">5</span>s</div>' +
        '<button type="button" class="fake-ad-skip">Cancel</button>' +
      '</div>';
    document.body.appendChild(overlay);
    const numEl = overlay.querySelector('.fake-ad-num');
    let secondsLeft = 5;
    const interval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) { finish(true); return; }
      numEl.textContent = secondsLeft;
    }, 1000);
    overlay.querySelector('.fake-ad-skip').addEventListener('click', () => finish(false));
  }

  global.GameAds = { isMobile, showRewarded, nativeAvailable, adsEnabled };
})(window);
