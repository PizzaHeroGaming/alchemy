// Workspace: library drag-to-slot + reset modal.
// Free-form tile placement and on-board combine were removed when the
// gameplay shifted to the Circle of Binding — the player now drags
// elements from the library into the circle slots instead.
(function (global) {
  'use strict';

  const TILE_W = 78;
  const TILE_H = 78;

  let workspaceEl;

  function init() {
    workspaceEl = document.getElementById('workspace');

    document.getElementById('btn-reset').addEventListener('click', openResetModal);
    initResetModal();

    // 'Clear' wipes the current arrangement of slot contents.
    const clearBtn = document.getElementById('btn-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (window.Circle && Circle.rebuildSlots) {
        const count = parseInt(document.getElementById('circle-board').dataset.slotCount || '2', 10);
        Circle.rebuildSlots(count);
      }
    });
  }

  // --- Reset confirmation modal ---------------------------------------------
  function openResetModal() {
    const modal = document.getElementById('reset-modal');
    if (!modal) return;
    showResetStage(1);
    document.getElementById('reset-count').textContent = State.state.discovered.size;
    modal.classList.remove('hidden');
  }

  function showResetStage(n) {
    const modal = document.getElementById('reset-modal');
    if (!modal) return;
    for (const s of modal.querySelectorAll('.reset-stage')) {
      s.classList.toggle('hidden', s.dataset.stage !== String(n));
    }
    if (n === 2) armFinalConfirm();
  }

  function armFinalConfirm() {
    const modal = document.getElementById('reset-modal');
    const btn = modal.querySelector('.reset-confirm');
    btn.disabled = true;
    let secondsLeft = 2;
    const baseLabel = 'Yes, reset everything';
    btn.textContent = baseLabel + ' (' + secondsLeft + ')';
    const interval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        btn.textContent = baseLabel + ' (' + secondsLeft + ')';
      } else {
        clearInterval(interval);
        btn.disabled = false;
        btn.textContent = baseLabel;
      }
    }, 1000);
    btn._countdown = interval;
  }

  function initResetModal() {
    const modal = document.getElementById('reset-modal');
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target.dataset.close !== undefined) closeResetModal();
    });
    modal.querySelector('.reset-next').addEventListener('click', () => showResetStage(2));
    modal.querySelector('.reset-confirm').addEventListener('click', (e) => {
      if (e.currentTarget.disabled) return;
      closeResetModal();
      // Rebuild slots fresh.
      if (window.Circle && Circle.rebuildSlots) {
        Circle.rebuildSlots(2);
      }
      State.resetProgress();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeResetModal();
    });
  }

  function closeResetModal() {
    const modal = document.getElementById('reset-modal');
    if (!modal) return;
    const btn = modal.querySelector('.reset-confirm');
    if (btn && btn._countdown) { clearInterval(btn._countdown); btn._countdown = null; }
    modal.classList.add('hidden');
    showResetStage(1);
  }

  // --- Library tile gesture model ------------------------------------------
  // Quick tap     → Circle.fillNextEmptySlot (the dominant action)
  // Long-press    → Lineage panel  (secondary "inspect" action)
  // Sideways drag → drag-to-specific-slot (precision use)
  // Vertical drag → scroll the library
  // Right-click   → Lineage panel  (desktop convenience equivalent
  //                                 to long-press)
  const LONG_PRESS_MS  = 600;   // hold this long → Lineage instead of tap-fill
  const HORIZ_DRAG_PX  = 12;
  const VERT_SCROLL_PX = 6;
  const TAP_TIME_MS    = 500;   // pointerup before this counts as a tap

  function attachLibraryDragSource(node, elementId) {
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      const isTouch = e.pointerType !== 'mouse';

      const pointerId = e.pointerId;
      const startX = e.clientX, startY = e.clientY;
      const startTime = Date.now();
      const scrollContainer = node.closest('#library-list');
      const initialScroll = scrollContainer ? scrollContainer.scrollTop : 0;
      // 'pending' = still figuring out what the user wants
      // 'drag'    = drag-with-ghost flow active
      // 'scroll'  = list-scroll flow active
      // 'lineage' = long-press fired, Lineage opened, ignore further motion
      let mode = 'pending';

      // Long-press timer — fires Lineage if the player holds without
      // moving significantly. Cancelled if motion or release happens
      // first.
      const longPressTimer = setTimeout(() => {
        if (mode !== 'pending') return;
        mode = 'lineage';
        node.classList.remove('lib-pressed');
        if (window.Lineage && Lineage.open) Lineage.open(elementId);
      }, LONG_PRESS_MS);

      // Add the pressed visual feedback. Helps the player feel that the
      // tap registered before the action fires on release.
      node.classList.add('lib-pressed');

      // Mouse-only: prevent the native drag-image default. On touch,
      // calling preventDefault here would block the long-press timer,
      // so we only call it for mouse.
      if (!isTouch) e.preventDefault();

      function onMove(ev) {
        if (ev.pointerId !== pointerId) return;
        if (mode !== 'pending' && mode !== 'scroll') return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (mode === 'pending') {
          // Sideways drag → start drag-to-specific-slot
          if (Math.abs(dx) > HORIZ_DRAG_PX && Math.abs(dx) > Math.abs(dy) * 1.2) {
            clearTimeout(longPressTimer);
            mode = 'drag';
            beginLibraryDrag(elementId, pointerId, ev.clientX, ev.clientY);
            return;
          }
          // Vertical drag → list-scroll mode
          if (Math.abs(dy) > VERT_SCROLL_PX) {
            clearTimeout(longPressTimer);
            mode = 'scroll';
            node.classList.remove('lib-pressed');
          }
          // Mouse: any significant movement = drag intent
          if (!isTouch && (Math.abs(dx) > HORIZ_DRAG_PX || Math.abs(dy) > HORIZ_DRAG_PX)) {
            clearTimeout(longPressTimer);
            mode = 'drag';
            beginLibraryDrag(elementId, pointerId, ev.clientX, ev.clientY);
            return;
          }
        }
        if (mode === 'scroll' && scrollContainer) {
          scrollContainer.scrollTop = initialScroll - dy;
        }
      }

      function onEnd(ev) {
        if (ev.pointerId !== pointerId) return;
        clearTimeout(longPressTimer);
        node.classList.remove('lib-pressed');
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup',     onEnd);
        document.removeEventListener('pointercancel', onEnd);

        // Quick tap: released before the long-press timer, no motion,
        // no drag started → fill the next empty circle slot.
        if (mode === 'pending') {
          const elapsed = Date.now() - startTime;
          if (elapsed < TAP_TIME_MS) {
            if (window.Circle && Circle.fillNextEmptySlot) {
              Circle.fillNextEmptySlot(elementId);
            }
          }
        }
        // Other modes (drag/scroll/lineage) handled their own cleanup.
      }

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup',     onEnd);
      document.addEventListener('pointercancel', onEnd);
    });

    // Right-click → Lineage (desktop). Mirrors the touch long-press
    // behavior so the secondary action is reachable on every input.
    node.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (window.Lineage && Lineage.open) Lineage.open(elementId);
    });
  }

  // Begin the drag-with-ghost flow. On release, try to fill a circle slot;
  // otherwise, just fade the ghost out.
  function beginLibraryDrag(elementId, pointerId, startX, startY) {
    if (window.Circle && Circle.isCombining && Circle.isCombining()) return;
    const el = State.state.byId.get(elementId);
    if (!el) return;

    const ghost = document.createElement('div');
    ghost.className = 'tile drag-ghost';
    ghost.appendChild(Icons.buildIcon(el));
    const nm = document.createElement('div');
    nm.className = 'name';
    nm.textContent = el.name;
    ghost.appendChild(nm);
    document.body.appendChild(ghost);
    positionGhost(startX, startY);

    function positionGhost(cx, cy) {
      ghost.style.left = (cx - TILE_W / 2) + 'px';
      ghost.style.top  = (cy - TILE_H / 2) + 'px';
    }

    function onMove(ev) {
      if (ev.pointerId !== pointerId) return;
      positionGhost(ev.clientX, ev.clientY);
      const idx = window.Circle ? Circle.previewSlotAt(ev.clientX, ev.clientY) : -1;
      ghost.classList.toggle('over-workspace', idx >= 0);
    }

    function onEnd(ev) {
      if (ev.pointerId !== pointerId) return;
      cleanup();
      if (window.Circle) Circle.clearSlotHovers();
      const filled = window.Circle && Circle.tryFillFromDrop(ev.clientX, ev.clientY, elementId);
      if (filled) {
        ghost.remove();
      } else {
        ghost.classList.add('drag-ghost-cancel');
        setTimeout(() => ghost.remove(), 200);
      }
    }

    function cleanup() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
  }

  global.Workspace = { init, attachLibraryDragSource };
})(window);
