=== cni_blocks ===
Stable tag: 1.6.6

Includes:
- Slide Gallery block (cni-blocks/slide-gallery)
- Tile Gallery block (cni-blocks/tile-gallery)

Updates:
- Restored aspect ratio controls and expanded wide ratio variants (3:2, 2:1, 21:9, 5:2, 3:1, 4:1).
- Caption position simplified to: below / overlay (overlay is full-width bottom band).
- Glass blur updated to blur(3px).

- Improved mobile rendering: preload/decode images before swapping to avoid 'reload-like' flashes.

- Major: main image no longer swaps <img src>; all slides are rendered and toggled via classes for smoother mobile/emu behavior.

- Fix: loop wrap (last→first / first→last) sometimes showed a faint reverse slide; cleaned up timers and removed opacity tween during slide.

- Fix: fade transition no longer uses inline opacity (prevents ghost 'snap-back' on first slide in some browsers).

- Fix: prevent 'self-slide' on first image by resetting transforms with transitions temporarily disabled.

- Fix: slide transition restored (forced frame separation so transforms animate reliably).

- Fix: slide animation reliability improved (double rAF) and cleaned CSS selector typo.

- Fix: transitions restored by using a temporary no-transition class during cleanup (avoids disabling transitions permanently).
- Fix: removed malformed CSS selector left from earlier build.

- New: layout option (thumbnails below / thumbnails on the right on desktop).

- Fix: side layout places thumbnails in the right column on desktop.
- Fix: arrows are now confined to the main image area (moved into viewport on load).

- Fix: side layout now truly moves thumbnails to the right column by making viewport and thumbs grid siblings; arrows are rendered inside the viewport.

- Fix: side layout overrides thumbnail flex styles (moves thumbs to right column on desktop).
- Fix: duplicate arrows removed; only one prev/next button kept inside viewport.

- Fix: side layout uses grid-areas + minmax(0,1fr) to prevent thumbnails dropping below; resets conflicting theme styles.

- Fix: side layout markup now keeps thumbnails inside .cni-main so CSS grid can place them in the right column.
