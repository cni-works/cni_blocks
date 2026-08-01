=== cni_blocks ===
Requires at least: 6.3
Requires PHP: 7.4
Stable tag: 1.32.0

Includes:
- Slide Gallery block (cni-blocks/slide-gallery)
- Tile Gallery block (cni-blocks/tile-gallery)
- Outer+ block (cni-blocks/outer)
- Grid+ block (cni-blocks/auto-grid)
- Grid+ Card internal block (cni-blocks/grid-card)
- Custom Field+ block (cni-blocks/custom-field)
- Timeline+ block (cni-blocks/timeline)
- Timeline+ Item internal block (cni-blocks/timeline-item)
- Map+ block (cni-blocks/visual-embed)
- Fixed Display+ block (cni-blocks/fixed-display)
- Overlap Image Layout+ block (cni-blocks/overlap-media)

Updates:
- Slide Gallery arrow controls now support selectable circular background colors, automatic white/black icon contrast, white, black, or custom icon colors, and inside, edge, or outside positioning in both single and carousel layouts.
- Grid+ can now place each card's first direct Image block outside the top and side padding, with a shared 16:9, 3:2, 4:3, or 1:1 ratio, cover/contain fitting, and top/center/bottom positioning. Existing Grid+ blocks remain unchanged until enabled.
- WordPress 7.1 preparation: all blocks now register with Block API v3 for the enforced iframe editor.
- Fixed Display+ and Tabs+ front-end interaction scripts now use view-only registration instead of loading in the editor.
- Dynamic block previews now prefer the current named ServerSideRender export while retaining an older-core fallback.
- Selected Post List+ search is now limited to users who can edit posts and rejects oversized search values.
- Outer+ now provides compact adjustable-width triangle dividers, unified adjustable-width curve dividers, inward/outward direction controls, and configurable zigzag counts; legacy triangle, curve, and center-arch shapes remain available only when already in use.
- Outer+ cloud detail levels now use hand-composed, uneven cloud groups with varied peak spacing, cluster width, lobe count, and valley depth instead of a repeating large-small rhythm.
- Fixed clipping on the tallest Outer+ cloud lobes by extending the cloud-only SVG viewBox above the original top boundary.
- Outer+ cloud dividers now use original overlapping ellipse compositions instead of broad hill-like paths, producing clearer cloud clusters at all three detail levels.
- Outer+ cloud dividers now use irregular clusters of large and small curves for a softer, more natural cloud silhouette at all three detail levels.
- Slide Gallery now supports wide/full alignment for the whole gallery, clickable image selection in the carousel editor, a thumbnail-based per-image link picker, and horizontal editor scrolling.
- Horizontal carousel autoplay now offers stepped or nonstop continuous movement, left/right direction, interval or speed controls, configurable animation duration, hover pause, focus pause, off-screen pause, background-tab pause, and reduced-motion protection.
- Slide Gallery now supports hiding thumbnails while retaining arrow navigation, a responsive multi-image horizontal carousel, and per-image safe links with optional new-tab behavior for banner use.
- Removed theme-provided outer borders from the Overlap Image Layout+ wrapper without affecting its content-card border option.
- Added Overlap Image Layout+, with image selection, left/right placement, responsive overlap amounts, mobile stacking order, aspect ratio, content background-only opacity, responsive padding, text color, border, radius, and shadow controls.
- Added independent top and bottom section dividers to Outer+, with adjacent-section color, depth, horizontal flip, cloud density, and nine original SVG shapes including clouds and torn paper.
- Fixed Display+ now has a clear background-transparency switch for fully transparent fixed containers while retaining optional borders and shadows.
- Renamed Visual Embed+ to Map+ in the editor while retaining its internal block name for saved-content compatibility.
- Map+ full alignment now escapes fixed-width theme containers and spans the viewport.
- Fixed Display+ now allows widths from 50px, lowers the viewport-width cap minimum to 10vw, and resets its editor z-index so inner-block toolbars remain accessible.
- Added Fixed Display+, an InnerBlocks container with six screen positions, offsets, width, padding, background, border, radius, shadow, z-index, device visibility, and an optional accessible close button.
- Added Visual Embed+ for safe Google Maps iframe display, with URL-only storage, responsive device heights, width, border, radius, accessible title, lazy loading, and wide/full alignment support.
- Added Timeline+, with freely editable labels, unrestricted inner blocks, a clear item-add button, and shared marker, line, label, and spacing settings.
- Added Custom Field+, a dynamic block that safely displays text, textarea, or numeric post meta from the current post, page, or custom post type.
- Custom Field+ supports preserved line breaks, empty-value fallback text, div/p/span output, alignment, font size, and text color. Protected keys and complex array/object values are not rendered.
- Added Grid+, an auto-fit responsive card grid with device-specific minimum widths and padding, horizontal/vertical gaps, shared background, radius, shadow and border settings, equal-height cards, and optional bottom-aligned buttons.

- Added Outer+, a section container with InnerBlocks, responsive padding and minimum height, device-specific backgrounds and focal points (including fixed cover on PC/tablet), overlay, content width, default text color, solid/dotted/dashed borders, radius, and div/section selection.
- New Outer+ insertions start with a light gray background and practical responsive padding; existing saved Outer+ blocks retain their current appearance.

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

- New: added cni-blocks block category so Slide Gallery / Tile Gallery are grouped together in block lists.
- Change: aspect ratio auto is removed from Slide Gallery and defaults to 3:2. Existing auto blocks are treated as 3:2.

- Fix: tile-gallery now declares title/category on PHP server registration so My Blocks Launcher groups it under cni-blocks.

- Update: removed fixed width/height controls from Slide Gallery UI.
- New: added side thumbnail column ratio and thumbnail size controls.

- Fix: tile gallery now loads the shared style in the block editor, so editor preview reflects grid columns.


- Fix: tile gallery editor preview now applies columns, gap, radius, border and shadow with inline styles so changes are reflected immediately in the editor.
