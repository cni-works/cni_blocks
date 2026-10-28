const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const baseline = file => execFileSync('git', ['show', 'v1.51.0:' + file], { cwd: root, encoding: 'utf8' });
const css = read('blocks/fixed-display/style.css');
const view = read('blocks/fixed-display/view.js');
const outerCss = read('blocks/outer/style.css');
const oldCss = baseline('blocks/fixed-display/style.css');
const oldView = baseline('blocks/fixed-display/view.js');

function settings(source) {
  let block;
  const useBlockProps = props => props;
  useBlockProps.save = props => props;
  const context = { window: { wp: {
    blocks: { registerBlockType: (_name, value) => { block = value; } },
    element: { Fragment: 'Fragment', createElement: (type, props, ...children) => ({ type, props, children }) },
    blockEditor: { useBlockProps, InnerBlocks: Object.assign('InnerBlocks', { Content: 'InnerBlocks.Content' }), InspectorControls: 'InspectorControls' },
    components: Object.fromEntries(['ColorPalette', 'Notice', 'PanelBody', 'RangeControl', 'SelectControl', 'TextControl', 'ToggleControl'].map(name => [name, name])),
    i18n: { __: text => text }
  } } };
  vm.createContext(context);
  vm.runInContext(source, context);
  return block;
}
const block = settings(read('blocks/fixed-display/index.js'));
const oldBlock = settings(baseline('blocks/fixed-display/index.js'));
for (const attributes of [{}, { position: 'top-left', width: 180, transparentBackground: true, showDesktop: false }, { showCloseButton: true, closeLabel: 'Close', zIndex: 9999 }]) {
  assert.equal(JSON.stringify(block.save({ attributes })), JSON.stringify(oldBlock.save({ attributes })), 'Legacy save markup unchanged');
  assert.equal(JSON.stringify(block.save({ attributes: { ...attributes, showAfterScroll: 0 } })), JSON.stringify(oldBlock.save({ attributes })), 'Zero threshold retains legacy markup');
}
assert.equal(block.attributes.showAfterScroll.default, 0);
assert.equal(JSON.parse(read('blocks/fixed-display/block.json')).attributes.showAfterScroll.default, 0);
for (const [value, expected] of [[200, 200], [200.6, 201], [-3, 0], [Infinity, 0], [NaN, 0], [100001, 100000]]) {
  const props = block.save({ attributes: { showAfterScroll: value } }).props;
  assert.equal(props['data-show-after-scroll'] || 0, expected, 'Threshold normalized');
}
let changes;
const editTree = block.edit({ attributes: {}, setAttributes: value => { changes = value; } });
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of (node.children || []).flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
  return null;
}
const control = find(editTree, node => node.type === 'TextControl' && node.props.label.includes('スクロール量'));
assert(control, 'Scroll threshold editor control exists');
for (const [input, expected] of [['200', 200], ['', 0], ['-1', 0], ['abc', 0], ['999999', 100000]]) {
  control.props.onChange(input);
  assert.equal(changes.showAfterScroll, expected);
}

function fixed(id, threshold, device = '') {
  return '<div id="' + id + '" class="wp-block-cni-blocks-fixed-display" data-position="top-left" ' + (threshold ? 'data-show-after-scroll="' + threshold + '" ' : '') + device + ' style="--cni-fixed-width:150px;--cni-fixed-offset-x:20px;--cni-fixed-offset-y:20px;--cni-fixed-z-index:999;--cni-fixed-padding:12px;--cni-fixed-background:#fff"><button type="button" class="cni-fixed-display__close" aria-label="Close">×</button><div class="cni-fixed-display__content"><a href="#target">Fixed link</a><span class="inherited">Inherited</span></div></div>';
}
function fixture(sheet, { threshold = 0, transformed = false, editor = false, device = '', extra = false } = {}) {
  return '<style>' + outerCss + sheet + `
    body { margin: 0; min-height: 3000px; font: 14px Arial; color: #111; }
    .front { min-height: 1500px; background: #f9f5ed; }
    footer { position: relative; }
    .origin { color: rgb(43, 65, 87); font: 600 19px/1.6 Georgia; text-align: right; --accent: rgb(123, 45, 67); }
    .inherited { color: var(--accent); }
    .origin .cni-outer__inner { ${transformed ? 'transform:translateZ(0);overflow:hidden;height:30px;' : ''} }
    #later { --cni-fixed-offset-x:200px !important; }
    #always { --cni-fixed-offset-x:380px !important; }
    .editor-styles-wrapper { position: absolute; top: 1600px; left: 0; width: 500px; }
  </style><section class="wp-block-cni-blocks-outer cni-outer--has-outward-divider front"><div class="cni-outer__inner">ABOUT US</div></section><footer><div class="wp-block-cni-blocks-outer origin"><div class="cni-outer__inner">` +
    (editor ? '<div class="editor-styles-wrapper">' : '') + fixed('fixed', threshold, device) +
    (extra ? fixed('later', 500) + fixed('always', 0) : '') + (editor ? '</div>' : '') + '</div></div></footer><div id="target">Target</div>';
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const render = async (sheet, options = {}, script = view) => {
      await page.goto('about:blank');
      await page.setContent(fixture(sheet, options));
      await page.evaluate(() => { window.scrollTo(0, 0); window.fixedScrollListeners = 0; const original = window.addEventListener; window.addEventListener = function(type, ...args) { if (type === 'scroll') window.fixedScrollListeners++; return original.call(this, type, ...args); }; });
      if (script) await page.addScriptTag({ content: script });
      await settle();
    };
    const scroll = async value => { await page.evaluate(y => window.scrollTo(0, y), value); await page.waitForFunction(y => Math.abs(window.scrollY - y) < 1, value); await settle(); };
    const topmost = () => page.evaluate(() => { const block = document.querySelector('#fixed'); const box = block.getBoundingClientRect(); return !!document.elementFromPoint(box.x + 3, box.y + 3)?.closest('#fixed'); });
    await render(oldCss, {}, oldView);
    assert.equal(await topmost(), false, 'Reproduce z-index 999 trapped below outward Outer+ z-index 2');
    await render(css);
    assert.equal(await page.locator('#fixed').evaluate(element => element.parentElement === document.body), true, 'Move outside isolated ancestors');
    assert(await topmost(), 'Above outward Outer+');
    const inherited = await page.locator('#fixed').evaluate(element => { const style = getComputedStyle(element); return { color: style.color, family: style.fontFamily, size: style.fontSize, weight: style.fontWeight, align: style.textAlign, child: getComputedStyle(element.querySelector('.inherited')).color }; });
    assert.deepEqual(inherited, { color: 'rgb(43, 65, 87)', family: 'Georgia', size: '19px', weight: '600', align: 'right', child: 'rgb(123, 45, 67)' }, 'Typography and custom properties survive relocation');
    await page.locator('#fixed').evaluate(element => { element.querySelector('a').addEventListener('click', event => { event.preventDefault(); window.fixedLinkWorked = true; }); });
    await page.locator('#fixed a').click();
    assert(await page.evaluate(() => window.fixedLinkWorked), 'Original DOM/events retained');

    for (const width of [1280, 900, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await render(css, { threshold: 200, transformed: true });
      assert.equal(await page.locator('#fixed').isVisible(), false, 'Hidden above threshold: ' + width);
      await scroll(199); assert.equal(await page.locator('#fixed').isVisible(), false);
      await scroll(200); assert(await page.locator('#fixed').isVisible());
      assert(await topmost(), 'Not clipped by transformed ancestor: ' + width);
      const box = await page.locator('#fixed').boundingBox(); assert.equal(box.x, 20); assert.equal(box.y, 20);
      await scroll(600); assert.equal((await page.locator('#fixed').boundingBox()).y, 20, 'Viewport fixed after scroll');
      await scroll(0); assert.equal(await page.locator('#fixed').isVisible(), false, 'Hide on return to top');
      await scroll(200); await page.locator('#fixed .cni-fixed-display__close').click();
      await scroll(0); await scroll(500); assert.equal(await page.locator('#fixed').isVisible(), false, 'Closed block never reopened by scroll');
    }
    await page.setViewportSize({ width: 900, height: 700 });
    await render(css, { threshold: 200, extra: true });
    assert.equal(await page.evaluate(() => window.fixedScrollListeners), 1, 'One passive scroll listener for multiple blocks');
    assert(await page.locator('#always').isVisible());
    await scroll(200); assert(await page.locator('#fixed').isVisible()); assert.equal(await page.locator('#later').isVisible(), false);
    await scroll(500); assert(await page.locator('#later').isVisible());
    // Initial load after restored scroll and pageshow both use current scroll position.
    await render(css, { threshold: 200 }, null); await scroll(400); await page.addScriptTag({ content: view }); await settle();
    assert(await page.locator('#fixed').isVisible(), 'Initial restored scroll respected');
    await page.evaluate(() => { window.scrollTo(0, 0); window.dispatchEvent(new Event('pageshow')); }); await settle();
    assert.equal(await page.locator('#fixed').isVisible(), false);

    for (const [width, attr] of [[1280, 'data-show-desktop="0"'], [900, 'data-show-tablet="0"'], [390, 'data-show-mobile="0"']]) {
      await page.setViewportSize({ width, height: 700 }); await render(css, { threshold: 200, device: attr }); await scroll(500);
      assert.equal(await page.locator('#fixed').isVisible(), false, 'Device hiding wins after threshold: ' + width);
    }
    await render(css, { threshold: 200, editor: true, device: 'data-show-mobile="0"' });
    assert(await page.locator('#fixed').isVisible(), 'Editor ignores scroll/device hiding');
    assert(await page.locator('#fixed').evaluate(element => !!element.closest('.editor-styles-wrapper')), 'Editor block never relocated');
    // Prevent flash before the script runs and hidden links receiving focus.
    await render(css, { threshold: 200 }, null); assert.equal(await page.locator('#fixed').isVisible(), false);
    assert.equal(await page.locator('#fixed a').evaluate(element => element.getClientRects().length), 0);
    console.log('Passed: legacy saves/defaults/UI bounds; isolated/transformed/clipped ancestors; retained typography/CSS variables/events; exact thresholds, return-to-top, close persistence, initial scroll/pageshow, multiple blocks, three device modes, no flash and editable preview.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
