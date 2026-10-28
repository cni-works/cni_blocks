const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'blocks/outer/style.css'), 'utf8');
const gridCss = fs.readFileSync(path.join(root, 'blocks/auto-grid/style.css'), 'utf8');
const defaults = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(root, 'blocks/outer/block.json'), 'utf8')).attributes).map(([key, value]) => [key, value.default]));
let block;
const createElement = (type, props, ...children) => ({ type, props: props || {}, children });
const useBlockProps = props => ({ ...props, className: 'wp-block-cni-blocks-outer ' + (props.className || '') });
useBlockProps.save = useBlockProps;
const context = { window: { wp: {
  blocks: { registerBlockType: (name, settings) => { block = settings; } },
  element: { createElement }, blockEditor: { useBlockProps, InnerBlocks: { Content: 'content' } },
  components: {}, i18n: { __: text => text }
} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'blocks/outer/index.js'), 'utf8'), context);
const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function serialize(node) {
  if (node == null || node === false) return '';
  if (Array.isArray(node)) return node.map(serialize).join('');
  if (typeof node !== 'object') return escape(node);
  if (node.type === 'content') return '<h2>Service</h2><button type="button">Details</button>';
  const attrs = Object.entries(node.props).filter(([key, value]) => key !== 'key' && value !== undefined).map(([key, value]) => {
    if (key === 'style') value = Object.entries(value).map(([name, item]) => (name.startsWith('--') ? name : name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())) + ':' + item).join(';');
    return ' ' + (key === 'className' ? 'class' : key) + '="' + escape(value) + '"';
  }).join('');
  return '<' + node.type + attrs + '>' + node.children.map(serialize).join('') + '</' + node.type + '>';
}
const outer = (effect = 'draw') => serialize(block.save({ attributes: { ...defaults, creativeFrameEffect: effect, creativeFrameColor: '#ffffff', backgroundColor: '#173e68', minHeightPc: 220 } }));
assert.equal((outer().match(/class="cni-outer__creative-frame-line /g) || []).length, 4, 'Public save renders all four lines');
assert(!outer('none').includes('cni-outer__creative-frame'), 'Disabled effect has no frame markup');
const card = (id, linked) => '<div id="' + id + '" class="wp-block-cni-blocks-grid-card cni-grid-card--hover-none ' + (linked ? 'has-cni-grid-card-link' : '') + '"><div class="cni-grid-card__inner">' + outer() + '</div>' + (linked ? '<a class="cni-grid-card__link" href="#destination" aria-label="Service page"></a>' : '') + '</div>';
const fixture = '<main><div id="standalone">' + outer() + '</div><div class="wp-block-cni-blocks-auto-grid" style="--cni-grid-min-width-pc:350px;--cni-grid-card-padding-pc:0px">' + card('linked', true) + card('unlinked', false) + '</div><div id="nested" class="wp-block-cni-blocks-outer cni-outer--creative-frame-draw" style="background:#173e68;padding:30px"><div class="cni-outer__inner">' + outer() + '</div></div><div id="destination">Destination</div></main>';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await page.setContent('<style>body{margin:0}main{padding:25px}#standalone{width:500px;margin-bottom:24px}h2{margin:0;padding:40px;color:white}button{margin:0 40px}#nested{margin-top:24px}</style><style>' + gridCss + css + '</style>' + fixture);
    const settle = () => page.evaluate(() => document.getAnimations().forEach(animation => animation.finish()));
    const values = selector => page.locator(selector + ' > .cni-outer__creative-frame > .cni-outer__creative-frame-line').evaluateAll(lines => lines.map(line => new DOMMatrix(getComputedStyle(line).transform).isIdentity));
    const isDrawn = async (selector, expected, label) => assert.deepEqual(await values(selector), [expected, expected, expected, expected], label);
    const linkedOuter = '#linked > .cni-grid-card__inner > .wp-block-cni-blocks-outer';
    await isDrawn(linkedOuter, false, 'Frame starts collapsed');
    await page.locator('#linked').hover({ position: { x: 30, y: 30 } });
    await settle();
    const hit = await page.locator('#linked').evaluate(card => { const r = card.getBoundingClientRect(); return document.elementFromPoint(r.x + 30, r.y + 30).className; });
    assert.equal(hit, 'cni-grid-card__link', 'Whole-card link remains the pointer target');
    if (process.argv.includes('--reproduce')) {
      await isDrawn(linkedOuter, false, 'Reproduce: overlay link prevents nested Outer hover');
      console.log('Reproduced public failure: pointer hits card link, nested Outer frame stays collapsed.');
      return;
    }
    await isDrawn(linkedOuter, true, 'Overlay link hover draws the nested Outer frame');
    await page.locator('#linked').screenshot({ path: path.join(os.tmpdir(), 'cni-outer-frame-hover.png') });
    await isDrawn('#unlinked > .cni-grid-card__inner > .wp-block-cni-blocks-outer', false, 'Adjacent card stays collapsed');
    await page.mouse.move(5, 5);
    await settle();
    await isDrawn(linkedOuter, false, 'Pointer leave resets frame');
    await page.locator('#linked > .cni-grid-card__link').focus();
    await settle();
    await isDrawn(linkedOuter, true, 'Keyboard focus on card link draws frame');
    await page.locator('#linked > .cni-grid-card__link').press('Enter');
    assert.equal(new URL(page.url()).hash, '#destination', 'Card link still navigates');
    await page.evaluate(() => { document.activeElement.blur(); history.replaceState(null, '', 'about:blank'); window.detailsClicks = 0; document.querySelector('#linked button').addEventListener('click', () => window.detailsClicks++); });
    await page.locator('#linked button').click();
    assert.equal(await page.evaluate(() => window.detailsClicks), 1, 'Inner buttons still receive clicks');
    await settle();
    await isDrawn(linkedOuter, true, 'Own focus/hover still works on inner buttons');
    for (const selector of ['#standalone > .wp-block-cni-blocks-outer', '#unlinked > .cni-grid-card__inner > .wp-block-cni-blocks-outer']) {
      await page.evaluate(() => document.activeElement.blur());
      await page.locator(selector).hover({ position: { x: 25, y: 25 } });
      await settle();
      await isDrawn(selector, true, 'Ordinary Outer hover still draws frame');
    }
    const nestedOuter = '#nested > .cni-outer__inner > .wp-block-cni-blocks-outer';
    await page.locator('#nested').hover({ position: { x: 5, y: 5 } });
    await settle();
    await isDrawn(nestedOuter, false, 'Hovering an ancestor Outer does not draw a different Outer frame');
    await page.mouse.move(5, 5);
    await page.locator('#linked').hover({ position: { x: 30, y: 30 } });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const running = await page.locator(linkedOuter + ' > .cni-outer__creative-frame').evaluate(frame => frame.getAnimations({ subtree: true }).map(animation => animation.effect.getTiming()));
    assert(running.some(timing => timing.duration === 340 && timing.delay === 240), 'Sequential frame animation keeps its duration and delays');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator(linkedOuter + ' > .cni-outer__creative-frame').evaluate(frame => getComputedStyle(frame).display), 'none', 'Reduced motion remains respected');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 800 });
    assert.equal(await page.locator(linkedOuter + ' > .cni-outer__creative-frame').evaluate(frame => getComputedStyle(frame).display), 'none', 'Mobile keeps existing non-hover presentation');
    console.log('Outer frame: public save, linked/unlinked hover, reset, keyboard, navigation, inner button, nested scope, sequencing, reduced motion and mobile passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
