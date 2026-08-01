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
    let transition = block.dataset.transition || 'fade';
    if (transition === 'slide' && block.dataset.hasFrame !== '1') transition = 'fade';
    const slides = getSlides(block);
    const from = slides[fromIdx];
    const to = slides[toIdx];
    if (!from || !to) return;

    clearTimers(block);

    // Reset before transition to prevent ghost/snap-back
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
    if (!block.dataset.aspectRatio || block.dataset.aspectRatio === 'auto') {
      block.dataset.aspectRatio = '3/2';
      block.dataset.hasFrame = '1';
      const viewport = block.querySelector('.cni-main-viewport');
      if (viewport && !viewport.style.aspectRatio) viewport.style.aspectRatio = '3 / 2';
    }
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
(() => {
  function getColumns(block) {
    if (window.innerWidth <= 600) return Math.max(1, parseInt(block.dataset.columnsMobile || '1', 10));
    if (window.innerWidth <= 1024) return Math.max(1, parseInt(block.dataset.columnsTablet || '2', 10));
    return Math.max(1, parseInt(block.dataset.columnsPc || '3', 10));
  }

  function getOriginalItems(block) {
    return Array.from(block.querySelectorAll('.cni-carousel-item:not(.cni-carousel-item--clone)'));
  }

  function isContinuous(block) {
    return block.dataset.autoplay === '1' && block.dataset.autoplayMode === 'continuous';
  }

  function renderCarousel(block) {
    const track = block.querySelector('.cni-carousel-track');
    const items = getOriginalItems(block);
    if (!track || !items.length) return;

    const columns = Math.min(getColumns(block), items.length);
    const max = Math.max(0, items.length - columns);
    const prev = block.querySelector('.cni-carousel-arrow--prev');
    const next = block.querySelector('.cni-carousel-arrow--next');

    if (isContinuous(block)) {
      track.style.transform = 'none';
      items.forEach((item) => {
        item.setAttribute('aria-hidden', 'false');
        item.querySelectorAll('a, button').forEach((control) => control.removeAttribute('tabindex'));
      });
      if (prev) { prev.hidden = max === 0; prev.disabled = max === 0; }
      if (next) { next.hidden = max === 0; next.disabled = max === 0; }
      return;
    }

    let index = Math.max(0, Math.min(parseInt(block.dataset.carouselIndex || '0', 10), max));
    block.dataset.carouselIndex = String(index);
    track.style.transform = `translateX(${-items[index].offsetLeft}px)`;

    items.forEach((item, itemIndex) => {
      const visible = itemIndex >= index && itemIndex < index + columns;
      item.setAttribute('aria-hidden', visible ? 'false' : 'true');
      item.querySelectorAll('a, button').forEach((control) => {
        if (visible) control.removeAttribute('tabindex');
        else control.setAttribute('tabindex', '-1');
      });
    });

    const loop = block.dataset.loop === '1';
    if (prev) {
      prev.hidden = max === 0;
      prev.disabled = max === 0 || (!loop && index === 0);
    }
    if (next) {
      next.hidden = max === 0;
      next.disabled = max === 0 || (!loop && index === max);
    }
  }

  function moveCarousel(block, direction) {
    const items = getOriginalItems(block);
    if (!items.length) return;

    if (isContinuous(block)) {
      const viewport = block.querySelector('.cni-carousel-viewport');
      const step = items.length > 1 ? Math.abs(items[1].offsetLeft - items[0].offsetLeft) : items[0].offsetWidth;
      block.__cniCarouselManualPauseUntil = performance.now() + 600;
      const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (viewport) viewport.scrollBy({ left: direction * step, behavior: reducedMotion ? 'auto' : 'smooth' });
      return;
    }

    const columns = Math.min(getColumns(block), items.length);
    const max = Math.max(0, items.length - columns);
    const loop = block.dataset.loop === '1';
    let index = parseInt(block.dataset.carouselIndex || '0', 10) + direction;
    if (index < 0) index = loop ? max : 0;
    if (index > max) index = loop ? 0 : max;
    block.dataset.carouselIndex = String(index);
    renderCarousel(block);
  }

  function isPaused(block) {
    return document.hidden || block.__cniCarouselOffscreen || block.__cniCarouselHoverPaused || block.__cniCarouselFocusPaused || (block.__cniCarouselManualPauseUntil || 0) > performance.now();
  }

  function setupPauseEvents(block) {
    if (block.__cniCarouselPauseReady) return;
    block.__cniCarouselPauseReady = true;

    if (block.dataset.pauseHover === '1') {
      block.addEventListener('mouseenter', () => { block.__cniCarouselHoverPaused = true; });
      block.addEventListener('mouseleave', () => { block.__cniCarouselHoverPaused = false; });
    }
    if (block.dataset.pauseFocus === '1') {
      block.addEventListener('focusin', () => { block.__cniCarouselFocusPaused = true; });
      block.addEventListener('focusout', () => {
        window.setTimeout(() => { block.__cniCarouselFocusPaused = block.contains(document.activeElement); }, 0);
      });
    }
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { block.__cniCarouselOffscreen = !entry.isIntersecting; });
      }, { threshold: 0.01 });
      observer.observe(block);
      block.__cniCarouselObserver = observer;
    }
  }

  function startStepAutoplay(block) {
    const seconds = Math.max(1, parseFloat(block.dataset.interval || '4'));
    block.__cniCarouselTimer = window.setInterval(() => {
      if (isPaused(block)) return;
      moveCarousel(block, block.dataset.direction === 'right' ? -1 : 1);
    }, seconds * 1000);
  }

  function startContinuousAutoplay(block) {
    const track = block.querySelector('.cni-carousel-track');
    const viewport = block.querySelector('.cni-carousel-viewport');
    const originals = getOriginalItems(block);
    if (!track || !viewport || !originals.length) return;
    if (originals.length <= getColumns(block)) return;

    const clones = originals.map((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add('cni-carousel-item--clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      clone.querySelectorAll('a, button').forEach((control) => control.setAttribute('tabindex', '-1'));
      track.appendChild(clone);
      return clone;
    });

    const speed = Math.max(1, parseFloat(block.dataset.continuousSpeed || '40'));
    const reverse = block.dataset.direction === 'right';
    let initialized = false;
    let lastTime = 0;

    const tick = (time) => {
      if (!block.isConnected) return;
      const threshold = clones[0] ? clones[0].offsetLeft : 0;
      if (!initialized && threshold > 0) {
        if (reverse) viewport.scrollLeft = threshold;
        initialized = true;
      }
      if (lastTime && initialized && !isPaused(block)) {
        const distance = speed * Math.min(64, time - lastTime) / 1000;
        viewport.scrollLeft += reverse ? -distance : distance;
        if (!reverse && viewport.scrollLeft >= threshold) viewport.scrollLeft -= threshold;
        if (reverse && viewport.scrollLeft <= 0) viewport.scrollLeft += threshold;
      }
      lastTime = time;
      block.__cniCarouselFrame = window.requestAnimationFrame(tick);
    };
    block.__cniCarouselFrame = window.requestAnimationFrame(tick);
  }

  function startAutoplay(block) {
    if (block.__cniCarouselAutoReady || block.dataset.autoplay !== '1') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    block.__cniCarouselAutoReady = true;
    setupPauseEvents(block);
    if (block.dataset.autoplayMode === 'continuous') startContinuousAutoplay(block);
    else startStepAutoplay(block);
  }

  function initializeCarousels() {
    document.querySelectorAll('.wp-block-cni-blocks-slide-gallery[data-gallery-type="carousel"]').forEach((block) => {
      renderCarousel(block);
      startAutoplay(block);
    });
  }

  document.addEventListener('click', (event) => {
    const prev = event.target.closest('.cni-carousel-arrow--prev');
    const next = event.target.closest('.cni-carousel-arrow--next');
    const button = prev || next;
    if (!button) return;
    const block = button.closest('.wp-block-cni-blocks-slide-gallery[data-gallery-type="carousel"]');
    if (block) moveCarousel(block, prev ? -1 : 1);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(initializeCarousels, 100);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCarousels);
  else initializeCarousels();
})();
(() => {
  function getTileItems(block) {
    return Array.from(block.querySelectorAll('.cni-tile-item img')).map((img, idx) => ({
      src: img.currentSrc || img.src,
      alt: img.alt || '',
      index: idx
    }));
  }

  function ensureLightbox() {
    let root = document.querySelector('.cni-lightbox');
    if (root) return root;

    root = document.createElement('div');
    root.className = 'cni-lightbox';
    root.innerHTML = '<div class="cni-lightbox__backdrop"></div><div class="cni-lightbox__dialog" role="dialog" aria-modal="true" tabindex="-1"><button type="button" class="cni-lightbox__close" aria-label="Close">×</button><button type="button" class="cni-lightbox__nav cni-lightbox__prev" aria-label="Prev">‹</button><img class="cni-lightbox__img" alt="" /><button type="button" class="cni-lightbox__nav cni-lightbox__next" aria-label="Next">›</button></div>';
    document.body.appendChild(root);
    return root;
  }

  function openTileLightbox(block, startIdx) {
    const items = getTileItems(block);
    if (!items.length) return;
    const box = ensureLightbox();
    const dialog = box.querySelector('.cni-lightbox__dialog');
    const imgEl = box.querySelector('.cni-lightbox__img');
    const prevFocus = document.activeElement;
    let idx = Math.max(0, Math.min(startIdx, items.length - 1));

    const render = () => {
      imgEl.src = items[idx].src;
      imgEl.alt = items[idx].alt;
    };

    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    render();
    if (dialog) dialog.focus();

    const onPrev = (e) => { e.stopPropagation(); idx = (idx - 1 + items.length) % items.length; render(); };
    const onNext = (e) => { e.stopPropagation(); idx = (idx + 1) % items.length; render(); };
    const onClose = () => {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      box.querySelector('.cni-lightbox__prev').removeEventListener('click', onPrev);
      box.querySelector('.cni-lightbox__next').removeEventListener('click', onNext);
      box.querySelector('.cni-lightbox__close').removeEventListener('click', onClose);
      box.querySelector('.cni-lightbox__backdrop').removeEventListener('click', onClose);
      document.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev(e);
      if (e.key === 'ArrowRight') onNext(e);
      if (e.key === 'Tab' && dialog) {
        const focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    box.querySelector('.cni-lightbox__prev').addEventListener('click', onPrev);
    box.querySelector('.cni-lightbox__next').addEventListener('click', onNext);
    box.querySelector('.cni-lightbox__close').addEventListener('click', onClose);
    box.querySelector('.cni-lightbox__backdrop').addEventListener('click', onClose);
    document.addEventListener('keydown', onKey);
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.wp-block-cni-blocks-tile-gallery[data-lightbox="1"] .cni-tile-trigger');
    if (!trigger) return;
    e.preventDefault();
    const block = trigger.closest('.wp-block-cni-blocks-tile-gallery');
    if (!block) return;
    const idx = parseInt(trigger.dataset.index || '0', 10);
    openTileLightbox(block, idx);
  });
})();
