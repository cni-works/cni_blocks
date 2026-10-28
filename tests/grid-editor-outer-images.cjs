const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'blocks/auto-grid/style.css'), 'utf8');
const oldCss = execFileSync('git', ['show', 'v1.51.0:blocks/auto-grid/style.css'], { cwd: root, encoding: 'utf8' });
const outerCss = fs.readFileSync(path.join(root, 'blocks/outer/style.css'), 'utf8');
// Gutenberg-like editor wrappers and Image styles, including both supported
// image/alignment DOM shapes. No JavaScript changes the public markup.
const base = `
  * { box-sizing: border-box; } body { margin: 0; font: 16px/1.5 sans-serif; color: #173d64; }
  .fixture { width: min(1600px, 100%); padding: 24px; margin: auto; background: #eaf5fc; }
  p { margin: 0 0 16px; overflow-wrap: anywhere; }
  .editor-styles-wrapper .wp-block { margin-left: auto; margin-right: auto; max-width: 840px; }
  .editor-styles-wrapper .wp-block-cni-blocks-auto-grid { max-width: none; }
  .wp-block-image { margin: 0 0 16px; max-width: 100%; }
  .wp-block-image img { height: auto; max-width: 100%; vertical-align: bottom; }
  .wp-block-image > a { display: inline-block; }
  .wp-block-image.alignleft,.wp-block-image.aligncenter,.wp-block-image.alignright { display: table; }
  .wp-block-image.alignleft { float: left; margin-left: 0; margin-right: 1em; }
  .wp-block-image.alignright { float: right; margin-left: 1em; margin-right: 0; }
  .wp-block-image.aligncenter { margin-left: auto; margin-right: auto; text-align: center; }
  .wp-block-image.alignleft > figcaption,.wp-block-image.aligncenter > figcaption,.wp-block-image.alignright > figcaption { display: table-caption; caption-side: bottom; }
  figcaption { font-size: 12px; text-align: center; overflow-wrap: anywhere; margin: 6px 0 0; }
  .components-resizable-box__container { position: relative; display: inline-block; max-width: 100%; pointer-events: none; }
  .components-resizable-box__handle { position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; padding: 0; pointer-events: auto; }
  .wp-block[data-align] > .wp-block-image { display: table; float: none; }
  .wp-block[data-align] > .wp-block-image > figcaption { display: table-caption; caption-side: bottom; }
  .wp-block[data-align="center"] > .wp-block-image { margin-left: auto; margin-right: auto; text-align: center; }
  .wp-block[data-align="left"] > .wp-block-image { margin-left: 0; margin-right: 1em; }
  .wp-block[data-align="right"] > .wp-block-image { margin-left: 1em; margin-right: 0; }
  .block-list-appender { position: absolute; bottom: 0; right: 0; }
  .block-editor-button-block-appender { height: 60px; width: 100%; }
  .wp-block-group { width: 180px; max-width: 100%; }
  .wp-block-buttons { display: flex; width: max-content; }
  .wp-block-buttons button { width: 100px; }
`;
const add = '<div class="block-list-appender"><div class="block-editor-inserter"><button class="block-editor-button-block-appender">+</button></div></div>';
const wp = editor => editor ? 'wp-block ' : '';
function image(editor, options) {
  const natural = options.large ? 1600 : 280;
  const height = Math.round(natural * .6);
  const url = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + natural + '" height="' + height + '"><rect width="100%" height="100%" fill="#3c8abd"/><circle cx="25%" cy="45%" r="18%" fill="#f3bf59"/></svg>');
  const width = options.percent ? '50%' : options.resized ? '120px' : '';
  const tag = '<img data-image src="' + url + '" width="' + natural + '" height="' + height + '" alt="Test image"' + (width ? ' style="width:' + (editor ? '100%' : width) + ';height:auto"' : '') + '>';
  const linked = options.linked ? '<a href="#details">' + tag + '</a>' : tag;
  const resizer = editor ? '<div class="components-resizable-box__container" style="width:' + (width || 'auto') + ';height:auto">' + linked + '<button class="components-resizable-box__handle" aria-label="Resize image"></button></div>' : linked;
  const alignClass = options.align && !(editor && options.legacy) ? ' align' + options.align : '';
  const figure = '<figure data-figure class="' + (editor && !options.legacy ? wp(true) : '') + 'wp-block-image' + alignClass + (width ? ' is-resized' : '') + '">' + resizer + (options.caption ? '<figcaption>Caption describing this image with enough words to wrap naturally.</figcaption>' : '') + '</figure>';
  return editor && options.legacy ? '<div class="wp-block" data-type="core/image"' + (options.align ? ' data-align="' + options.align + '"' : '') + '>' + figure + '</div>' : figure;
}
function content(editor, options) {
  const item = options.kind === 'outer' ? (options.empty ? '' : options.outerImage ? image(editor, options) : '<p class="' + wp(editor) + '">' + (options.long ? 'A longer paragraph that should wrap at the real content boundary. '.repeat(12) : 'Short content') + '</p>') : image(editor, options);
  if (options.kind !== 'outer') return item;
  return '<div data-outer class="' + wp(editor) + 'wp-block-cni-blocks-outer" style="--cni-outer-background-color:#f8eac9;--cni-outer-padding-v-pc:20px;--cni-outer-padding-h-pc:20px;--cni-outer-padding-v-tablet:20px;--cni-outer-padding-h-tablet:20px;--cni-outer-padding-v-mobile:20px;--cni-outer-padding-h-mobile:20px;--cni-outer-content-width:' + (options.limited ? '200px' : '100%') + '"><div class="cni-outer__inner">' + (editor ? '<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">' + item + '</div></div>' : item) + '</div></div>';
}
function fixture(editor, options = {}) {
  const cards = Array.from({ length: options.single ? 1 : 2 }, (_, index) => '<div data-card="' + index + '" class="' + wp(editor) + 'wp-block-cni-blocks-grid-card"><div class="cni-grid-card__inner">' + (editor ? '<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">' + content(editor, options) + add + '</div></div>' : content(editor, options)) + '</div></div>').join('');
  const inner = editor ? '<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">' + cards + '</div></div>' : options.cell ? '<div class="cni-cell-grid-content">' + cards + '</div>' : cards;
  return '<div class="fixture ' + (editor ? 'editor-styles-wrapper' : '') + '"><div class="wp-block-cni-blocks-auto-grid' + (options.cell ? ' cni-grid--cell' : '') + (options.flush ? ' cni-grid--flush-first-image' : '') + '" data-card-width-mode="' + (options.fixed ? 'fixed' : 'flex') + '" data-cell-mobile-layout="stack" style="--cni-grid-min-width-pc:460px;--cni-grid-min-width-tablet:320px;--cni-grid-card-max-width:420px;--cni-cell-columns-pc:2;--cni-cell-columns-tablet:2;--cni-cell-outer-border-width:0px;--cni-cell-vertical-border-width:0px;--cni-cell-horizontal-border-width:0px;--cni-grid-first-image-ratio:4/3;--cni-grid-first-image-fit:' + (options.contain ? 'contain' : 'cover') + '">' + (options.cell ? '<div class="cni-cell-grid-scroll">' + inner + '</div>' : inner) + '</div></div>';
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 600 } });
    const render = async (sheet, editor, options) => {
      await page.setContent('<style>' + base + outerCss + sheet + '</style>' + fixture(editor, options));
      await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const metrics = () => page.locator('[data-card="0"]').evaluate(card => {
      const layout = card.querySelector('.cni-grid-card__inner > .block-editor-inner-blocks > .block-editor-block-list__layout') || card.querySelector('.cni-grid-card__inner');
      const parent = layout.getBoundingClientRect();
      const box = element => { const rect = element.getBoundingClientRect(); return { x: rect.x - parent.x, y: rect.y - parent.y, width: rect.width, height: rect.height }; };
      const result = { available: parent.width };
      for (const [name, selector] of [['outer', '[data-outer]'], ['inner', '[data-outer] > .cni-outer__inner'], ['image', '[data-image]'], ['caption', 'figcaption']]) { const element = card.querySelector(selector); if (element) result[name] = box(element); }
      return result;
    });
    await render(oldCss, true, { kind: 'outer', empty: true });
    const old = await metrics(); assert(old.outer.width < old.available / 2, 'Reproduce shrinking empty Outer+');
    const before = await page.screenshot();
    await render(css, true, { kind: 'outer', empty: true });
    const after = await page.screenshot(); assert(Math.abs((await metrics()).outer.width - old.available) < 1, 'Empty Outer+ fills the card');
    const cases = [
      { kind: 'outer', empty: true }, { kind: 'outer' }, { kind: 'outer', long: true }, { kind: 'outer', limited: true },
      { kind: 'outer', fixed: true }, { kind: 'outer', cell: true }, { kind: 'outer', outerImage: true, resized: true },
      { kind: 'outer', outerImage: true, large: true, single: true }, { kind: 'outer', outerImage: true, align: 'center', resized: true, caption: true },
      {}, { large: true }, { resized: true }, { resized: true, linked: true, caption: true }, { percent: true },
      { resized: true, align: 'left', caption: true }, { resized: true, align: 'center', caption: true }, { resized: true, align: 'right', caption: true },
      { large: true, align: 'center' }, { large: true, single: true, align: 'center' },
      { resized: true, legacy: true }, { resized: true, align: 'left', legacy: true },
      { resized: true, align: 'center', legacy: true, caption: true }, { resized: true, align: 'right', legacy: true, caption: true },
      { large: true, cell: true }, { resized: true, fixed: true },
      { flush: true, large: true, linked: true, caption: true }, { flush: true, resized: true, contain: true }
    ];
    for (const width of [1800, 1280, 900, 390]) {
      await page.setViewportSize({ width, height: 600 });
      for (const options of cases) {
        const label = width + ' ' + JSON.stringify(options);
        await render(oldCss, false, options); const publicBefore = await page.screenshot();
        await render(css, false, options); const expected = await metrics();
        if (!['left', 'right'].includes(options.align) || options.kind === 'outer') assert((await page.screenshot()).equals(publicBefore), 'Public appearance unchanged except intentional image left/right repair: ' + label);
        await render(css, true, options); const actual = await metrics();
        for (const key of ['outer', 'inner', 'image', 'caption']) {
          if (!expected[key]) continue;
          const properties = ['outer', 'inner'].includes(key) ? ['width', 'x'] : ['width', 'height', 'x', 'y'];
          // Empty Outer+ deliberately keeps an editor-only insertion height.
          for (const property of properties) assert(Math.abs(actual[key][property] - expected[key][property]) < 1, key + '/' + property + ' editor/public match: ' + label + ' ' + JSON.stringify({ actual, expected }));
        }
        if (options.kind === 'outer') assert(Math.abs(actual.outer.width - actual.available) < 1, 'Outer+ fills available width: ' + label);
        if (options.align === 'right' && options.kind !== 'outer') assert(Math.abs(actual.image.x + actual.image.width - actual.available) < 1, 'Right aligned to card content edge: ' + label);
        if (options.resized && !options.flush) assert.equal(actual.image.width, 120, 'Explicit image width kept: ' + label);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow: ' + label);
        const handle = page.locator('[data-card="0"] .components-resizable-box__handle');
        if (await handle.count()) {
          await handle.focus(); assert(await handle.evaluate(element => document.activeElement === element), 'Resize handle remains keyboard accessible: ' + label);
          assert(await handle.evaluate(element => { const rect = element.getBoundingClientRect(); const target = element.ownerDocument.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); return target === element || element.contains(target); }), 'Resize handle is not blocked by another layer: ' + label);
        }
      }
    }
    // Other placements, including ordinary Outer+ outside Grid+, are unchanged.
    for (const options of [{ kind: 'outer' }, { resized: true, align: 'right' }]) {
      const markup = '<div class="editor-styles-wrapper" style="width:600px">' + content(true, options) + '</div>';
      await page.setContent('<style>' + base + outerCss + oldCss + '</style>' + markup); await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode()))); const original = await page.screenshot();
      await page.setContent('<style>' + base + outerCss + css + '</style>' + markup); await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      assert((await page.screenshot()).equals(original), 'Outside Grid+ unchanged');
    }
    const output = path.join(os.tmpdir(), 'cni-grid-outer-images-review.png');
    await sharp({ create: { width: 1280, height: 1260, channels: 4, background: '#fff' } }).composite([
      { input: Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">Before: empty Outer+ shrinks in the editor</text></svg>'), left: 0, top: 0 }, { input: before, left: 0, top: 30 },
      { input: Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">After: empty Outer+ fills the card content width</text></svg>'), left: 0, top: 630 }, { input: after, left: 0, top: 660 }
    ]).png().toFile(output);
    console.log('Passed: empty/short/long/limited Outer+; normal/large/resized/percent/linked/aligned/caption images; old/new editor wrappers; nested Outer+ images; fixed/cell grids; full-bleed cover/contain; four viewports; preserved public appearance except image alignment repair.');
    console.log(output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
