const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const file = 'blocks/auto-grid/style.css';
const css = fs.readFileSync(path.join(root, file), 'utf8');
const baseline = execFileSync('git', ['show', 'v1.51.0:' + file], { cwd: root, encoding: 'utf8' });
// A self-contained Gutenberg-like fixture: auto inline block margins reproduce
// the flex cross-axis shrink-to-content bug. Core Columns keeps its own layout.
const base = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: sans-serif; color: #153e68; }
  p { margin: 0 0 12px; overflow-wrap: anywhere; }
  .fixture { width: min(1600px, 100%); padding: 24px; margin: auto; background: #eaf5fc; }
  .editor-styles-wrapper .wp-block { margin-left: auto; margin-right: auto; max-width: 840px; }
  .editor-styles-wrapper .wp-block-cni-blocks-auto-grid { max-width: none; }
  .wp-block-columns { display: flex; flex-wrap: nowrap; gap: 24px; margin-bottom: 24px; }
  .wp-block-column { flex-grow: 1; min-width: 0; overflow-wrap: break-word; }
  .wp-block-columns > .wp-block-column { flex-basis: 0; }
  .wp-block-columns > .wp-block-column[style*="flex-basis"] { flex-grow: 0; }
  .wp-block-columns :where(.wp-block) { max-width: none; margin-left: 0; margin-right: 0; }
  .block-editor-default-block-appender { min-width: 36px; min-height: 48px; border: 1px dashed #8f9aab; }
  .column-content { min-height: 48px; }
  .block-list-appender { position: absolute; bottom: 0; right: 0; }
  .block-editor-button-block-appender { width: 100%; height: 60px; }
  .wp-block-image { width: 90px; height: 48px; background: #a0cce6; }
  .wp-block-buttons { display: flex; width: max-content; }
  .wp-block-buttons button { width: 110px; height: 32px; }
  .wp-block-group { width: 220px; max-width: 100%; }
  .wp-block-group > .wp-block-columns { width: 160px; max-width: 100%; }
  .wp-block-columns > .wp-block-column.is-vertically-aligned-center { align-self: center; }
  @media (max-width: 781px) {
    .wp-block-columns:not(.is-not-stacked-on-mobile) { flex-wrap: wrap; }
    .wp-block-columns:not(.is-not-stacked-on-mobile) > .wp-block-column { flex-basis: 100% !important; }
  }
`;
const appender = '<div class="block-list-appender"><div class="block-editor-inserter"><button class="block-editor-button-block-appender" aria-label="Add block">+</button></div></div>';

function columns(editor, options = {}, id = 'columns') {
  const count = options.count || 2;
  const columnHtml = Array.from({ length: count }, (_, i) => {
    const style = options.ratio ? ' style="flex-basis:' + options.ratio[i] + '%"' : '';
    const content = options.content === 'long' ? '<p>Long content ' + 'W'.repeat(90) + '</p>' : options.content === 'short' ? '<p>Short</p>' : '';
    const empty = editor && !content ? '<div class="block-editor-default-block-appender" tabindex="0" aria-label="Empty column"></div>' : '';
    const nested = options.nested && i === 0 ? columns(editor, { content: 'short' }, 'nested') : '';
    return '<div class="' + (editor ? 'wp-block ' : '') + 'wp-block-column' + (options.center ? ' is-vertically-aligned-center' : '') + '"' + style + '><div class="column-content">' + content + empty + nested + '</div></div>';
  }).join('');
  return '<div data-columns="' + id + '" class="' + (editor ? 'wp-block ' : '') + 'wp-block-columns' + (options.noStack ? ' is-not-stacked-on-mobile' : '') + '"' + (options.width ? ' style="width:' + options.width + 'px"' : '') + '>' + columnHtml + '</div>';
}

function fixture(editor, options = {}) {
  const content = columns(editor, options) + '<figure class="' + (editor ? 'wp-block ' : '') + 'wp-block-image"></figure><div class="' + (editor ? 'wp-block ' : '') + 'wp-block-buttons"><button>Button</button></div>' +
    '<div class="' + (editor ? 'wp-block ' : '') + 'wp-block-group">' + columns(editor, { content: 'short' }, 'constrained') + '</div>';
  const cards = Array.from({ length: 2 }, (_, i) => '<div data-card="' + i + '" class="' + (editor ? 'wp-block ' : '') + 'wp-block-cni-blocks-grid-card"><div class="cni-grid-card__inner">' + (editor ? '<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">' + content + appender + '</div></div>' : content) + '</div></div>').join('');
  const inner = editor ? '<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">' + cards + '</div></div>' : options.cell ? '<div class="cni-cell-grid-content">' + cards + '</div>' : cards;
  return '<div class="fixture ' + (editor ? 'editor-styles-wrapper' : '') + '"><div class="wp-block-cni-blocks-auto-grid' + (options.cell ? ' cni-grid--cell' : '') + '" data-card-width-mode="' + (options.fixed ? 'fixed' : 'flex') + '" data-cell-mobile-layout="stack" style="--cni-grid-min-width-pc:460px;--cni-grid-min-width-tablet:320px;--cni-grid-card-max-width:420px;--cni-cell-columns-pc:2;--cni-cell-columns-tablet:2;--cni-cell-outer-border-width:0px;--cni-cell-vertical-border-width:0px;--cni-cell-horizontal-border-width:0px">' + (options.cell ? '<div class="cni-cell-grid-scroll">' + inner + '</div>' : inner) + '</div></div>';
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 600 } });
    const render = async (sheet, editor, options = {}) => {
      await page.setContent('<style>' + base + sheet + '</style>' + fixture(editor, options));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const metrics = () => page.locator('[data-card="0"]').evaluate(card => {
      const layout = card.querySelector('.cni-grid-card__inner > .block-editor-inner-blocks > .block-editor-block-list__layout') || card.querySelector('.cni-grid-card__inner');
      const outer = layout.querySelector(':scope > [data-columns="columns"]');
      const rect = outer.getBoundingClientRect();
      return { available: layout.getBoundingClientRect().width, width: rect.width, x: rect.x, columns: Array.from(outer.children).map(column => { const box = column.getBoundingClientRect(); return { width: box.width, x: box.x, y: box.y }; }) };
    });
    await render(baseline, true);
    const old = await metrics();
    assert(old.width < old.available / 2, 'Reproduce empty Columns shrinkage');
    const before = await page.screenshot();
    await render(css, true);
    const fixed = await metrics();
    assert(Math.abs(fixed.width - fixed.available) < 1, 'Empty Columns fills card content width');
    const after = await page.screenshot();

    const cases = [
      {}, { count: 3 }, { content: 'short' }, { content: 'long' }, { ratio: [30, 70], center: true },
      { noStack: true }, { nested: true }, { width: 210 }, { fixed: true }, { cell: true },
      { cell: true, ratio: [30, 70] }
    ];
    for (const width of [1800, 1280, 900, 782, 781, 390]) {
      await page.setViewportSize({ width, height: 600 });
      for (const options of cases) {
        const label = width + ' ' + JSON.stringify(options);
        await render(baseline, false, options);
        const publicBefore = await page.screenshot();
        const publicMetrics = await metrics();
        await render(css, false, options);
        assert((await page.screenshot()).equals(publicBefore), 'Public screenshot unchanged: ' + label);
        await render(baseline, true, options);
        const unaffectedBefore = await page.locator('[data-card="0"] .wp-block-image, [data-card="0"] .wp-block-buttons, [data-card="0"] [data-columns="constrained"]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
        await render(css, true, options);
        const current = await metrics();
        assert(Math.abs(current.width - publicMetrics.width) < 1, 'Editor/public Columns width: ' + label);
        current.columns.forEach((column, i) => {
          assert(Math.abs(column.width - publicMetrics.columns[i].width) < 1, 'Column ratio maintained: ' + label);
          if (width <= 781 && !options.noStack) assert(Math.abs(column.width - current.width) < 1, 'Mobile stack fills width: ' + label);
          else assert(Math.abs(column.y - current.columns[0].y) < 1, 'Columns remain horizontal: ' + label);
        });
        if (options.width) {
          assert.equal(current.width, options.width, 'Explicit container width retained');
          const parent = await page.locator('[data-card="0"] .cni-grid-card__inner').boundingBox();
          assert(Math.abs(current.x - (parent.x + (parent.width - options.width) / 2)) < 1, 'Explicit narrow Columns remains centered');
        } else assert(Math.abs(current.width - current.available) < 1, 'No content-dependent shrinkage: ' + label);
        const unaffectedAfter = await page.locator('[data-card="0"] .wp-block-image, [data-card="0"] .wp-block-buttons, [data-card="0"] [data-columns="constrained"]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
        assert.deepEqual(unaffectedAfter, unaffectedBefore, 'Image/button/constrained nested Columns unchanged: ' + label);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow: ' + label);
        if (!options.content) {
          const placeholder = page.locator('[data-card="0"] [data-columns="columns"] .block-editor-default-block-appender').first();
          await placeholder.focus();
          assert(await placeholder.evaluate(element => document.activeElement === element), 'Empty column retains keyboard insertion');
        }
      }
    }
    // The same standard Columns outside a Grid+ card is unaffected.
    for (const sheet of [baseline, css]) {
      await page.setContent('<style>' + base + sheet + '</style><div class="editor-styles-wrapper"><div style="display:flex;flex-direction:column;width:600px">' + columns(true) + '</div></div>');
      const width = await page.locator('[data-columns="columns"]').evaluate(element => element.getBoundingClientRect().width);
      assert(Math.abs(width - old.width) < 1, 'No changes to Columns outside Grid+');
    }
    const output = path.join(os.tmpdir(), 'cni-grid-columns-editor-review.png');
    await sharp({ create: { width: 1280, height: 1260, channels: 4, background: '#fff' } }).composite([
      { input: Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">Before: empty Columns in Grid+ editor</text></svg>'), left: 0, top: 0 },
      { input: before, left: 0, top: 30 },
      { input: Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">After: empty Columns fill the card content width</text></svg>'), left: 0, top: 630 },
      { input: after, left: 0, top: 660 }
    ]).png().toFile(output);
    console.log('Passed: empty/short/long/three-column/nested Columns, ratios, explicit widths, fixed/cell grids, six viewports, stacking toggle, keyboard insertion, unchanged public screenshots and unrelated blocks.');
    console.log(output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
