const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'blocks/auto-grid/style.css'), 'utf8');
const baseline = execFileSync('git', ['show', 'v1.51.0:blocks/auto-grid/style.css'], { cwd: root, encoding: 'utf8' });
const headingCss = fs.readFileSync(path.join(root, 'blocks/heading-plus/style.css'), 'utf8');
const base = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: sans-serif; font-size: 16px; color: #153e68; }
  .fixture { width: min(1600px, 100%); padding: 24px; margin: auto; background: #eaf5fc; }
  p { margin: 16px 0; line-height: 1.5; overflow-wrap: anywhere; }
  .has-text-align-left { text-align: left; }
  .has-text-align-center { text-align: center; }
  .has-text-align-right { text-align: right; }
  .editor-styles-wrapper .wp-block { margin-left: auto; margin-right: auto; max-width: 840px; }
  .editor-styles-wrapper .wp-block-cni-blocks-auto-grid { max-width: none; }
  .wp-block-image { width: 80px; height: 24px; background: #9bc6e5; }
  .wp-block-buttons { display: flex; width: max-content; }
  .wp-block-buttons button { width: 96px; height: 28px; }
  .wp-block-group { width: 200px; }
  .block-list-appender { position: absolute; bottom: 0; right: 0; }
  .wp-block-columns { display: flex; width: 100%; gap: 16px; }
  .wp-block-column { flex: 1; min-width: 0; }
  .wp-block-columns :where(.wp-block) { max-width: none; margin-left: 0; margin-right: 0; }
`;
const appender = '<div class="block-list-appender"><div class="block-editor-inserter"><button class="block-editor-button-block-appender">+</button></div></div>';

function content(editor, options = {}) {
  const wp = editor ? 'wp-block ' : '';
  const align = options.align || 'left';
  const text = options.long ? 'A longer sentence that wraps naturally across the full card width. '.repeat(5) : 'Sample text';
  const explicit = options.explicit ? 'width:160px;' : '';
  const design = options.design ? ' data-cni-heading-design="' + options.design + '" data-cni-secondary-layout="v3" data-cni-layout-version="3"' : '';
  const paragraph = '<p data-test="paragraph" class="' + wp + (options.inherit ? '' : 'has-text-align-' + align) + '" style="' + explicit + (options.inherit ? '' : 'text-align:' + align + ';') + '"><span class="text-probe">' + text + '</span></p>';
  const number = options.design === 'number-title' ? '<span class="cni-heading-plus__number">01</span>' : '';
  const textClass = 'cni-heading-plus__text' + (options.design ? ' cni-heading-plus__effect-target' : '');
  const heading = '<div data-test="heading" class="' + wp + 'wp-block-cni-blocks-heading-plus" data-heading-alignment="' + align + '"' + design + ' style="' + explicit + '--cni-heading-align:' + align + ';--cni-heading-size-pc:24px;--cni-heading-size-tablet:24px;--cni-heading-size-mobile:24px;--cni-heading-margin-top:12px;--cni-heading-margin-bottom:12px;--cni-heading-outer-margin-top:12px;--cni-heading-outer-margin-bottom:12px;--cni-heading-padding-x:8px;--cni-heading-padding-y:4px;">' + number + '<h2 class="' + textClass + '"><span class="text-probe">' + (options.long ? text : 'Heading') + '</span></h2></div>';
  const other = '<figure class="' + wp + 'wp-block-image"></figure><div class="' + wp + 'wp-block-buttons"><button>Button</button></div>' + '<div class="' + wp + 'wp-block-group"><p>Nested paragraph</p></div>';
  const columns = options.columns ? '<div class="' + wp + 'wp-block-columns"><div class="' + wp + 'wp-block-column">' + paragraph + heading + '</div><div class="' + wp + 'wp-block-column"><p>Other column</p></div></div>' : paragraph + heading;
  return columns + other;
}

function fixture(editor, options = {}) {
  const cards = Array.from({ length: 2 }, (_, i) => '<div data-card="' + i + '" class="' + (editor ? 'wp-block ' : '') + 'wp-block-cni-blocks-grid-card"><div class="cni-grid-card__inner">' + (editor ? '<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">' + content(editor, options) + appender + '</div></div>' : content(editor, options)) + '</div></div>').join('');
  const inner = editor ? '<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">' + cards + '</div></div>' : options.cell ? '<div class="cni-cell-grid-content">' + cards + '</div>' : cards;
  return '<div class="fixture ' + (editor ? 'editor-styles-wrapper' : '') + '"><div class="wp-block-cni-blocks-auto-grid' + (options.cell ? ' cni-grid--cell' : '') + '" data-card-width-mode="' + (options.fixed ? 'fixed' : 'flex') + '" data-cell-mobile-layout="stack" style="--cni-grid-min-width-pc:460px;--cni-grid-min-width-tablet:320px;--cni-grid-card-max-width:420px;--cni-cell-columns-pc:2;--cni-cell-columns-tablet:2;--cni-cell-outer-border-width:0px;--cni-cell-vertical-border-width:0px;--cni-cell-horizontal-border-width:0px;--cni-cell-text-align:' + (options.inherit ? 'right' : 'left') + '">' + (options.cell ? '<div class="cni-cell-grid-scroll">' + inner + '</div>' : inner) + '</div></div>';
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 500 } });
    const render = async (sheet, editor, options = {}) => {
      await page.setContent('<style>' + base + headingCss + sheet + '</style>' + fixture(editor, options));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const metrics = () => page.locator('[data-card="0"] [data-test]').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      const probe = element.querySelector('.text-probe').getBoundingClientRect();
      const parent = element.parentElement.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { width: rect.width, height: rect.height, left: rect.left - parent.left, available: parent.width, textLeft: probe.left - parent.left, textRight: parent.right - probe.right, textAlign: style.textAlign, marginTop: style.marginTop, marginBottom: style.marginBottom };
    }));
    await render(baseline, true);
    const old = await metrics();
    old.forEach(item => assert(item.left > 60 && item.width < item.available / 2, 'Reproduce centered narrow left-aligned text blocks'));
    const before = await page.screenshot();
    await render(css, true);
    const fixed = await metrics();
    fixed.forEach(item => assert(Math.abs(item.width - item.available) < 1 && Math.abs(item.left) < 1, 'Text boxes fill card content width'));
    const after = await page.screenshot();

    for (const width of [1800, 1280, 900, 390]) {
      await page.setViewportSize({ width, height: 500 });
      for (const align of ['left', 'center', 'right']) for (const variant of [{}, { long: true }, { explicit: true }, { cell: true }, { fixed: true }, { design: 'number-title' }, { design: 'corner-frame' }, { columns: true }]) {
        const options = { ...variant, align };
        const label = width + ' ' + JSON.stringify(options);
        await render(baseline, false, options);
        const previous = await page.screenshot();
        await render(css, false, options);
        assert((await page.screenshot()).equals(previous), 'Public screenshot unchanged: ' + label);
        const expected = await metrics();
        await render(baseline, true, options);
        const originalMetrics = await metrics();
        const originalSizes = await page.locator('[data-card="0"] .wp-block-image, [data-card="0"] .wp-block-buttons, [data-card="0"] .wp-block-group').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
        await render(css, true, options);
        const actual = await metrics();
        actual.forEach((item, i) => {
          // Explicit inline widths remain intentional narrow editor boxes,
          // including their original automatic inline-margin positioning.
          const reference = options.explicit ? originalMetrics[i] : expected[i];
          for (const key of ['width', 'height', 'left', 'textLeft', 'textRight']) assert(Math.abs(item[key] - reference[key]) < 1, 'Editor/public or explicit geometry ' + key + ': ' + label + ' ' + JSON.stringify({ actual: item, reference }));
          assert.equal(item.textAlign, expected[i].textAlign, 'Alignment preserved: ' + label);
          assert.equal(item.marginTop, expected[i].marginTop, 'Top margin preserved: ' + label);
          assert.equal(item.marginBottom, expected[i].marginBottom, 'Bottom margin preserved: ' + label);
          if (options.explicit) assert.equal(item.width, 160, 'Explicit inline width remains');
        });
        const actualSizes = await page.locator('[data-card="0"] .wp-block-image, [data-card="0"] .wp-block-buttons, [data-card="0"] .wp-block-group').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
        assert.deepEqual(actualSizes, originalSizes, 'Image/button/nested-group widths unchanged: ' + label);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow: ' + label);
      }
    }
    // Width correction must not impose text-align, including inherited cell alignment.
    await render(css, true, { cell: true, inherit: true, align: 'right' });
    assert.equal((await metrics())[0].textAlign, 'right');
    // Standard text elsewhere in the editor is not affected by Grid+ rules.
    const external = '<div class="editor-styles-wrapper"><div style="display:flex;flex-direction:column;width:600px">' + content(true) + '</div></div>';
    await page.setContent('<style>' + base + headingCss + baseline + '</style>' + external);
    const externalBefore = await page.screenshot();
    await page.setContent('<style>' + base + headingCss + css + '</style>' + external);
    assert((await page.screenshot()).equals(externalBefore), 'Blocks outside Grid+ unchanged');

    const output = path.join(os.tmpdir(), 'cni-grid-text-alignment-review.png');
    await sharp({ create: { width: 1280, height: 1060, channels: 4, background: '#fff' } }).composite([
      { input: Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">Before: left-aligned text blocks shrink and appear centered</text></svg>'), left: 0, top: 0 },
      { input: before, left: 0, top: 30 },
      { input: Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">After: full-width text blocks honor their alignment</text></svg>'), left: 0, top: 530 },
      { input: after, left: 0, top: 560 }
    ]).png().toFile(output);
    console.log('Passed: Paragraph/Heading+ left/center/right geometry matches public view; short/long text, decorated/number headings, explicit widths, normal/fixed/cell grids, nested Columns, four viewports, margins, unchanged public screenshots and unrelated blocks.');
    console.log(output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
