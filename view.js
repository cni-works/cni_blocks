(() => {
  const TRANSITION_MS = 260;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function getThumbs(block) { return Array.from(block.querySelectorAll('.cni-thumb')); }
  function getSlides(block) { return Array.from(block.querySelectorAll('.cni-slide')); }

  function setActiveThumb(block, idx) {
    getThumbs(block).forEach((b) => b.classList.remove('is-active'));
    const btn = block.querySelector(`.cni-thumb[data-index="${idx}"]`);
    if (btn) btn.classList.add('is-active');
  }

  function isOverlayPos(pos) { return pos === 'overlay'; }

  function ensureCaptionEl(block) {
    const pos = block.dataset.captionPosition || 'below';
    const style = block.dataset.captionStyle || 'glass';
    const cls = `cni-caption cni-caption--${pos} cni-caption--${style}`;

    let cap = block.querySelector('.cni-caption');
    const viewport = block.querySelector('.cni-main-viewport');
    const main = block.querySelector('.cni-main');

    if (cap) {
      cap.className = cls;
      if (isOverlayPos(pos) && viewport && cap.parentElement !== viewport) viewport.appendChild(cap);
      if (!isOverlayPos(pos) && main && main.parentNode && cap.parentElement !== main.parentNode) main.parentNode.insertBefore(cap, main.nextSibling);
      return cap;
    }

    cap = document.createElement('div');
    cap.className = cls;

    if (isOverlayPos(pos) && viewport) viewport.appendChild(cap);
    else if (main && main.parentNode) main.parentNode.insertBefore(cap, main.nextSibling);
    else block.appendChild(cap);

    return cap;
  }

  function setCaption(block, text) {
    const show = block.dataset.showCaption === '1';
    if (!show) return;
    const cap = ensureCaptionEl(block);
    cap.textContent = (text || '').trim();
    cap.style.display = cap.textContent ? '' : 'none';
  }

  function setBusy(block, busy) { block.dataset.cniBusy = busy ? '1' : '0'; }
  function isBusy(block) { return block.dataset.cniBusy === '1'; }

  function clearTimers(block) {
    if (block.__cniCleanupTimer) {
      clearTimeout(block.__cniCleanupTimer);
      block.__cniCleanupTimer = null;
    }
    if (block.__cniBusyTimer) {
      clearTimeout(block.__cniBusyTimer);
      block.__cniBusyTimer = null;
    }
  }

  function resetSlideStyles(block, slides) {
    // Temporarily disable transitions while we clear transforms/classes.
    block.classList.add('cni-no-transition');
    slides.forEach((s) => {
      s.classList.remove('is-active', 'is-enter', 'is-leave');
      s.style.transform = 'translateX(0%)';
      s.style.transitionProperty = '';
      s.style.opacity = '';
    });
    // Re-enable transitions next frame
    requestAnimationFrame(() => block.classList.remove('cni-no-transition'));
  }

  function finalizeActive(block, slides, activeIdx) {
    block.classList.add('cni-no-transition');
    slides.forEach((s, i) => {
      if (i === activeIdx) s.classList.add('is-active');
      else s.classList.remove('is-active');
      s.classList.remove('is-enter', 'is-leave');
      s.style.transform = 'translateX(0%)';
      s.style.transitionProperty = '';
      s.style.opacity = '';
    });
    requestAnimationFrame(() => block.classList.remove('cni-no-transition'));
  }

  function applyTransition(block, fromIdx, toIdx, dir) {
    const transition = block.dataset.transition || 'fade';
    const slides = getSlides(block);
    const from = slides[fromIdx];
    const to = slides[toIdx];
    if (!from || !to) return;

    clearTimers(block);

    // Reset base state (but keep the two we need ready)
    resetSlideStyles(block, slides);

    if (transition === 'none') {
      to.classList.add('is-active');
      return;
    }

    if (transition === 'fade') {
      // Class-only fade: avoid inline opacity (can create a faint 'return' ghost on wrap in some browsers).
      // Base state: all slides inactive (opacity 0). Keep FROM visible, then activate TO on next frame.
      from.classList.add('is-active');
      // TO starts inactive (opacity 0), then we activate it to fade in.
      requestAnimationFrame(() => {
        to.classList.add('is-active');
      });

      block.__cniCleanupTimer = window.setTimeout(() => {
        finalizeActive(block, slides, toIdx);
      }, TRANSITION_MS);

      return;
    }

    if (transition === 'slide') {
      // For slide mode: avoid opacity tween (it can look like "ghosting" on wrap)
      from.classList.add('is-active');
      to.classList.add('is-active');
      // force transition for reliability
      from.style.transition = 'transform 260ms ease';
      to.style.transition = 'transform 260ms ease';
      from.style.opacity = '1';
      to.style.opacity = '1';

      const enterFrom = dir >= 0 ? '100%' : '-100%';
      const leaveTo  = dir >= 0 ? '-100%' : '100%';

      to.style.transform = `translateX(${enterFrom})`;
      to.getBoundingClientRect();

      // animate (double rAF for better reliability across browsers)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          from.style.transform = `translateX(${leaveTo})`;
          to.style.transform = 'translateX(0%)';
        });
      });

      block.__cniCleanupTimer = window.setTimeout(() => {
        finalizeActive(block, slides, toIdx);
      }, TRANSITION_MS);

      return;
    }

    // fallback
    to.classList.add('is-active');
  }

  function goTo(block, newIdx, opts = {}) {
    const thumbs = getThumbs(block);
    const slides = getSlides(block);
    if (!thumbs.length || !slides.length) return;

    const loop = block.dataset.loop === '1';
    const max = Math.min(thumbs.length, slides.length) - 1;

    let idx = newIdx;
    if (idx < 0) idx = loop ? max : 0;
    if (idx > max) idx = loop ? 0 : max;

    const currentIdx = clamp(parseInt(block.dataset.selected || '0', 10), 0, max);
    if (idx === currentIdx && !opts.force) return;

    if (isBusy(block)) return;
    setBusy(block, true);

    // Direction priority:
    // 1) explicit (arrow click)
    // 2) wrap-aware (loop): last->0 on "next" should be dir=+1, 0->last on "prev" should be dir=-1
    // 3) fallback by index comparison
    let dir;
    if (typeof opts.dir === 'number') {
      dir = opts.dir;
    } else if (loop) {
      if (currentIdx === max && idx === 0) dir = 1;
      else if (currentIdx === 0 && idx === max) dir = -1;
      else dir = idx > currentIdx ? 1 : -1;
    } else {
      dir = idx > currentIdx ? 1 : -1;
    }

    applyTransition(block, currentIdx, idx, dir);
    setActiveThumb(block, idx);
    block.dataset.selected = String(idx);

    const activeThumb = thumbs[idx];
    if (activeThumb) setCaption(block, activeThumb.dataset.text || '');

    const prev = block.querySelector('.cni-arrow-prev');
    const next = block.querySelector('.cni-arrow-next');
    if (prev && next && !loop) {
      prev.disabled = idx === 0;
      next.disabled = idx === max;
    }

    block.__cniBusyTimer = window.setTimeout(() => setBusy(block, false), TRANSITION_MS);
  }

  function initBlock(block) {
    const thumbs = getThumbs(block);
    const slides = getSlides(block);
    if (!thumbs.length || !slides.length) return;

    const arrowsOn = block.dataset.arrows === '1';
    const prev = block.querySelector('.cni-arrow-prev');
    const next = block.querySelector('.cni-arrow-next');
    // Confine arrows to the main image viewport (especially for side layout)
    const viewport = block.querySelector('.cni-main-viewport');
    if (viewport) {
      if (prev && prev.parentElement !== viewport) viewport.appendChild(prev);
      if (next && next.parentElement !== viewport) viewport.appendChild(next);
    }

    // Deduplicate arrows (older saved markup may contain extra arrow buttons)
    if (viewport) {
      const prevAll = Array.from(block.querySelectorAll('.cni-arrow-prev'));
      const nextAll = Array.from(block.querySelectorAll('.cni-arrow-next'));

      const prevKeep = prevAll.find((b) => b.parentElement === viewport) || prevAll[0] || null;
      const nextKeep = nextAll.find((b) => b.parentElement === viewport) || nextAll[0] || null;

      if (prevKeep && prevKeep.parentElement !== viewport) viewport.appendChild(prevKeep);
      if (nextKeep && nextKeep.parentElement !== viewport) viewport.appendChild(nextKeep);

      prevAll.forEach((b) => { if (prevKeep && b !== prevKeep) b.remove(); });
      nextAll.forEach((b) => { if (nextKeep && b !== nextKeep) b.remove(); });
    }

    if (prev) prev.style.display = arrowsOn ? '' : 'none';
    if (next) next.style.display = arrowsOn ? '' : 'none';

    const max = Math.min(thumbs.length, slides.length) - 1;
    const idx = clamp(parseInt(block.dataset.selected || '0', 10), 0, max);
    block.dataset.selected = String(idx);

    clearTimers(block);
    finalizeActive(block, slides, idx);
    setActiveThumb(block, idx);

    const active = thumbs[idx];
    if (active) setCaption(block, active.dataset.text || '');

    const loop = block.dataset.loop === '1';
    if (prev && next && !loop) {
      prev.disabled = idx === 0;
      next.disabled = idx === max;
    }
  }

  document.addEventListener('click', (e) => {
    const thumb = e.target.closest('.wp-block-cni-blocks-slide-gallery .cni-thumb');
    if (thumb) {
      const block = thumb.closest('.wp-block-cni-blocks-slide-gallery');
      if (!block) return;
      const idx = parseInt(thumb.dataset.index || '0', 10);
      goTo(block, idx, { force: true });
      return;
    }

    const prev = e.target.closest('.wp-block-cni-blocks-slide-gallery .cni-arrow-prev');
    if (prev) {
      const block = prev.closest('.wp-block-cni-blocks-slide-gallery');
      if (!block) return;
      const idx = parseInt(block.dataset.selected || '0', 10);
      goTo(block, idx - 1, { dir: -1 });
      return;
    }

    const next = e.target.closest('.wp-block-cni-blocks-slide-gallery .cni-arrow-next');
    if (next) {
      const block = next.closest('.wp-block-cni-blocks-slide-gallery');
      if (!block) return;
      const idx = parseInt(block.dataset.selected || '0', 10);
      goTo(block, idx + 1, { dir: 1 });
      return;
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.wp-block-cni-blocks-slide-gallery').forEach(initBlock);
    });
  } else {
    document.querySelectorAll('.wp-block-cni-blocks-slide-gallery').forEach(initBlock);
  }
})();