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

  function ensureCaptionEl(block) {
    const pos = block.dataset.captionPosition || 'below';
    const style = block.dataset.captionStyle || 'glass';
    const cls = `cni-caption cni-caption--${pos} cni-caption--${style}`;

    let cap = block.querySelector('.cni-caption');
    const viewport = block.querySelector('.cni-main-viewport');
    const main = block.querySelector('.cni-main');

    if (cap) {
      cap.className = cls;
      if (pos === 'overlay' && viewport && cap.parentElement !== viewport) viewport.appendChild(cap);
      if (pos !== 'overlay' && main && main.parentNode && cap.parentElement !== main.parentNode) main.parentNode.insertBefore(cap, main.nextSibling);
      return cap;
    }

    cap = document.createElement('div');
    cap.className = cls;
    if (pos === 'overlay' && viewport) viewport.appendChild(cap);
    else if (main && main.parentNode) main.parentNode.insertBefore(cap, main.nextSibling);
    else block.appendChild(cap);
    return cap;
  }

  function setCaption(block, text) {
    if (block.dataset.showCaption !== '1') return;
    const cap = ensureCaptionEl(block);
    cap.textContent = (text || '').trim();
    cap.style.display = cap.textContent ? '' : 'none';
  }

  function setBusy(block, busy) { block.dataset.cniBusy = busy ? '1' : '0'; }
  function isBusy(block) { return block.dataset.cniBusy === '1'; }

  function clearTimers(block) {
    if (block.__cniCleanupTimer) { clearTimeout(block.__cniCleanupTimer); block.__cniCleanupTimer = null; }
    if (block.__cniBusyTimer) { clearTimeout(block.__cniBusyTimer); block.__cniBusyTimer = null; }
  }

  function resetSlideStyles(slides) {
    slides.forEach((s) => {
      s.classList.remove('is-active', 'is-enter', 'is-leave');
      s.style.transform = 'translateX(0%)';
      s.style.transition = '';
      s.style.opacity = '';
    });
  }

  function finalizeActive(block, slides, activeIdx) {
    block.classList.add('cni-no-transition');
    slides.forEach((s, i) => {
      if (i === activeIdx) s.classList.add('is-active');
      else s.classList.remove('is-active');
      s.classList.remove('is-enter', 'is-leave');
      s.style.transform = 'translateX(0%)';
      s.style.transition = '';
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

    // ghost/snap-back h~
    block.classList.add('cni-no-transition');
    resetSlideStyles(slides);

    if (transition === 'none') {
      to.classList.add('is-active');
      requestAnimationFrame(() => block.classList.remove('cni-no-transition'));
      return;
    }

    if (transition === 'fade') {
      from.classList.add('is-active');
      block.classList.remove('cni-no-transition');
      requestAnimationFrame(() => to.classList.add('is-active'));
      block.__cniCleanupTimer = window.setTimeout(() => finalizeActive(block, slides, toIdx), TRANSITION_MS);
      return;
    }

    if (transition === 'slide') {
      from.classList.add('is-active');
      to.classList.add('is-active');
      block.classList.remove('cni-no-transition');

      from.style.transition = 'transform 260ms ease';
      to.style.transition = 'transform 260ms ease';
      from.style.opacity = '1';
      to.style.opacity = '1';

      const enterFrom = dir >= 0 ? '100%' : '-100%';
      const leaveTo  = dir >= 0 ? '-100%' : '100%';

      to.style.transform = `translateX(${enterFrom})`;
      to.getBoundingClientRect();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          from.style.transform = `translateX(${leaveTo})`;
          to.style.transform = 'translateX(0%)';
        });
      });

      block.__cniCleanupTimer = window.setTimeout(() => finalizeActive(block, slides, toIdx), TRANSITION_MS);
      return;
    }

    block.classList.remove('cni-no-transition');
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

    let dir;
    if (typeof opts.dir === 'number') dir = opts.dir;
    else if (loop) {
      if (currentIdx === max && idx === 0) dir = 1;
      else if (currentIdx === 0 && idx === max) dir = -1;
      else dir = idx > currentIdx ? 1 : -1;
    } else dir = idx > currentIdx ? 1 : -1;

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

  function ensureTileLightbox() {
    let lb = document.getElementById('cni-tile-lightbox');
    if (lb) return lb;
    lb = document.createElement('div');
    lb.id = 'cni-tile-lightbox';
    lb.className = 'cni-lightbox';
    lb.hidden = true;
    lb.innerHTML = '<button type="button" class="cni-lightbox__btn cni-lightbox__close" aria-label="close">X</button><button type="button" class="cni-lightbox__btn cni-lightbox__prev" aria-label="prev"><</button><img class="cni-lightbox__img" alt=""><button type="button" class="cni-lightbox__btn cni-lightbox__next" aria-label="next">></button>';
    document.body.appendChild(lb);
    return lb;
  }

  function getTileItems(grid) { return Array.from(grid.querySelectorAll('.cni-tile-open')); }

  function openTileLightbox(grid, idx) {
    const lb = ensureTileLightbox();
    const img = lb.querySelector('.cni-lightbox__img');
    const items = getTileItems(grid);
    if (!items.length) return;
    const max = items.length - 1;
    const clamped = clamp(idx, 0, max);
    lb.__grid = grid;
    lb.__index = clamped;
    const active = items[clamped];
    const target = active && active.dataset.full ? active.dataset.full : '';
    const thumb = active ? active.querySelector('img') : null;
    img.src = target;
    img.alt = thumb ? (thumb.alt || '') : '';
    lb.hidden = false;
  }

  function closeTileLightbox() {
    const lb = document.getElementById('cni-tile-lightbox');
    if (lb) lb.hidden = true;
  }

  function moveTileLightbox(dir) {
    const lb = document.getElementById('cni-tile-lightbox');
    if (!lb || lb.hidden || !lb.__grid) return;
    const items = getTileItems(lb.__grid);
    if (!items.length) return;
    const max = items.length - 1;
    let next = (typeof lb.__index === 'number' ? lb.__index : 0) + dir;
    if (next < 0) next = max;
    if (next > max) next = 0;
    openTileLightbox(lb.__grid, next);
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

    const tileOpen = e.target.closest('.wp-block-cni-blocks-tile-gallery .cni-tile-open');
    if (tileOpen) {
      const grid = tileOpen.closest('.cni-tile-grid');
      if (!grid || grid.dataset.lightbox !== '1') return;
      const idx = parseInt(tileOpen.dataset.index || '0', 10);
      openTileLightbox(grid, idx);
      return;
    }

    const lb = e.target.closest('#cni-tile-lightbox');
    if (lb && e.target === lb) { closeTileLightbox(); return; }
    if (e.target.closest('.cni-lightbox__close')) { closeTileLightbox(); return; }
    if (e.target.closest('.cni-lightbox__prev')) { moveTileLightbox(-1); return; }
    if (e.target.closest('.cni-lightbox__next')) { moveTileLightbox(1); return; }
  });

  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('cni-tile-lightbox');
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') closeTileLightbox();
    if (e.key === 'ArrowLeft') moveTileLightbox(-1);
    if (e.key === 'ArrowRight') moveTileLightbox(1);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.wp-block-cni-blocks-slide-gallery').forEach(initBlock);
    });
  } else {
    document.querySelectorAll('.wp-block-cni-blocks-slide-gallery').forEach(initBlock);
  }
})();
