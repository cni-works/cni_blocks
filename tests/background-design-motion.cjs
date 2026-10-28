const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const original = file => execFileSync('git', ['show', 'v1.51.0:' + file], { cwd: root, encoding: 'utf8' });
const css = read('blocks/background-design-plus/style.css');
const oldCss = original('blocks/background-design-plus/style.css');
const runtime = read('blocks/background-design-plus/motion.js');
const defaults = Object.fromEntries(Object.entries(JSON.parse(read('blocks/background-design-plus/block.json')).attributes).map(([key, value]) => [key, value.default]));
function api(source) {
  const context = { window: { wp: { blocks: {}, element: { createElement: (type, props, ...children) => ({ type, props, children }) }, blockEditor: {}, components: {}, i18n: { __: text => text } } } };
  vm.createContext(context);
  vm.runInContext(source.replace('\tregister();', 'globalThis.api={STYLE_OPTIONS,presetChanges,rootStyle,BackgroundMarkup,motionValues};'), context);
  return context.api;
}
const current = api(read('blocks/background-design-plus/index.js'));
const old = api(original('blocks/background-design-plus/index.js'));
const escape = text => String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function serialize(node) {
  if (node == null || node === false) return '';
  if (Array.isArray(node)) return node.map(serialize).join('');
  if (typeof node !== 'object') return escape(node);
  if (typeof node.type === 'function') return serialize(node.type({ ...node.props, children: node.children }));
  const attrs = Object.entries(node.props || {}).filter(([key]) => key !== 'key').map(([key, value]) => {
    if (key === 'style') value = Object.entries(value).map(([name, item]) => (name.startsWith('--') ? name : name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())) + ':' + item).join(';');
    return ' ' + (key === 'className' ? 'class' : key) + '="' + escape(value) + '"';
  }).join('');
  return '<' + node.type + attrs + '>' + node.children.map(serialize).join('') + '</' + node.type + '>';
}
function section(attributes, version = current, preview = false) {
  return serialize(version.BackgroundMarkup({ attributes, editor: false, blockProps: { className: 'wp-block-cni-blocks-background-design-plus', style: version.rootStyle(attributes, preview), 'data-cni-bg2-motion': attributes.motion, 'data-cni-bg2-mobile-motion': attributes.motionMobile ? 'true' : 'false' }, children: [] }));
}
function attrs(style, extra = {}) { return { ...defaults, ...current.presetChanges(style, 'classic'), style, paddingX: 0, paddingY: 0, minHeight: 400, ...extra }; }
async function difference(a, b, threshold = 12) {
  const first = await sharp(a).removeAlpha().raw().toBuffer();
  const second = await sharp(b).removeAlpha().raw().toBuffer();
  let changed = 0;
  for (let i = 0; i < first.length; i += 3) if (Math.abs(first[i] - second[i]) + Math.abs(first[i + 1] - second[i + 1]) + Math.abs(first[i + 2] - second[i + 2]) > threshold) changed++;
  return changed / (first.length / 3);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 400 }, reducedMotion: 'no-preference' });
    const render = async (attributes, sheet = css, motion = true, preview = false) => {
      await page.setContent('<style>html,body{margin:0}' + sheet + '</style>' + section(attributes, current, preview));
      if (motion) await page.addScriptTag({ content: runtime });
      await page.evaluate(async () => {
        await Promise.all(Array.from(document.querySelectorAll('*')).map(async element => { const bg = getComputedStyle(element).backgroundImage; if (bg.startsWith('url(')) { const image = new Image(); image.src = bg.slice(5, -2); await image.decode(); } }));
        document.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 0; });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
    };
    const metrics = time => page.evaluate(async time => {
      const animations = document.getAnimations();
      animations.forEach(animation => { animation.pause(); animation.currentTime = time; });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return animations.map(animation => { const element = animation.effect.target; const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height, bx: parseFloat(style.backgroundPositionX) || 0, by: parseFloat(style.backgroundPositionY) || 0, duration: animation.effect.getTiming().duration, direction: animation.effect.getTiming().direction, name: animation.animationName }; });
    }, time);
    const impact = (a, b) => a.reduce((sum, first, i) => sum + Math.hypot(first.x - b[i].x, first.y - b[i].y) + Math.hypot(first.bx - b[i].bx, first.by - b[i].by) + Math.abs(first.width - b[i].width) * .25 + Math.abs(first.height - b[i].height) * .25, 0) / a.length;
    const pictures = [];
    const illustrated = ['soft-mesh', 'confetti', 'blur-spots', 'waves', 'flow-lines', 'grid'];
    for (const option of current.STYLE_OPTIONS) {
      const style = option.value;
      for (const strength of ['subtle', 'standard', 'dynamic']) {
        const attributes = attrs(style, { motion: 'flow', motionStrength: strength });
        assert.equal(section(attributes), section(attributes, old), 'Saved markup unchanged: ' + style + '/' + strength);
        for (const speed of ['standard', 'slow', 'verySlow']) assert.equal(JSON.stringify(current.motionValues({ ...attributes, motionSpeed: speed }, true)), JSON.stringify(current.motionValues({ ...attributes, motionSpeed: speed }, false)), 'Preview uses public speed');
      }
      const still = attrs(style);
      await render(still, oldCss, false); const oldImage = await page.screenshot();
      await render(still); const staticDifference = await difference(await page.screenshot(), oldImage, 4);
      assert(staticDifference < .0001, 'Motion-off appearance unchanged: ' + style + '=' + staticDifference);
      const modeFingerprints = [];
      for (const motion of ['gentle', 'flow']) {
        const levels = [];
        for (const strength of ['subtle', 'standard', 'dynamic']) {
          await render(attrs(style, { motion, motionStrength: strength }));
          const first = await metrics(0); assert(first.length > 0, 'Motion exists: ' + style);
          const a = await page.screenshot();
          const later = await metrics(4000); const b = await page.screenshot();
          // Soft gradients are intentionally low-contrast. Measure their
          // distributed RGB change as well as the independent travel floor.
          const soft = ['soft-mesh', 'blur-spots', 'bokeh-dots', 'metaballs', 'noise'].includes(style);
          const distance = impact(first, later); const visible = await difference(a, b, soft ? 4 : 12);
          levels.push(distance);
          assert(distance > 2, 'At least 2px average 4-second motion: ' + style + '/' + motion + '/' + strength + '=' + distance);
          assert(visible > .0015, 'Actual pixel difference: ' + style + '/' + motion + '/' + strength + '=' + visible);
          assert(first.every(item => item.duration * (item.direction.startsWith('alternate') ? 2 : 1) === 18000), 'Standard full cycle is 18 seconds');
          if (strength === 'standard') modeFingerprints.push(b.toString('base64'));
          if (motion === 'gentle' && illustrated.includes(style)) {
            const index = illustrated.indexOf(style) * 3 + ['subtle', 'standard', 'dynamic'].indexOf(strength);
            pictures[index] = { a, b, label: style + ' / ' + strength + ' / ' + distance.toFixed(1) + 'px in 4s' };
          }
        }
        assert(levels[1] > levels[0] * 1.35 && levels[2] > levels[1] * 1.3, 'Strengths must be meaningfully different: ' + style + '/' + motion + '=' + levels);
        console.log(style + '/' + motion + ': ' + levels.map(n => n.toFixed(1)).join(' / ') + ' px (subtle / standard / dynamic)');
      }
      assert.notEqual(modeFingerprints[0], modeFingerprints[1], 'Gentle/flow are visually distinct: ' + style);
      await render(attrs(style, { motion: 'flow', motionStrength: 'dynamic', scale: 'xlarge', density: 100, variation: 100 }));
      assert(await page.locator('.cni-bg2__canvas *').count() < 150, 'Maximum composition DOM budget: ' + style);
      await page.setViewportSize({ width: 390, height: 400 });
      await render(attrs(style, { motion: 'flow', motionMobile: false }));
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'Mobile off: ' + style);
      await render(attrs(style, { motion: 'flow', motionMobile: true }));
      assert((await metrics(0)).length > 0, 'Mobile on: ' + style);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile overflow: ' + style);
      await page.setViewportSize({ width: 1200, height: 400 });
    }
    for (const [speed, duration] of [['standard', 18000], ['slow', 30000], ['verySlow', 44000]]) {
      const attributes = attrs('confetti', { motion: 'gentle', motionSpeed: speed, scale: 'small' });
      await render(attributes); const normal = await metrics(4000);
      await render(attributes, css, true, true); const preview = await metrics(4000);
      assert.deepEqual(preview, normal, 'Preview/public transforms match at same time: ' + speed);
      assert(normal.every(item => item.duration * 2 === duration));
      const before = JSON.stringify(attributes);
      await page.evaluate(() => window.cniBlocksBackgroundMotion.preview(document.querySelector('.wp-block-cni-blocks-background-design-plus')));
      assert.equal(JSON.stringify(attributes), before, 'Preview never rewrites attributes');
    }
    await render(attrs('rings', { motion: 'flow', ringAppearance: 'outline' }));
    assert((await metrics(0)).every(item => item.name === 'cni-bg2-ring-ripple'), 'Outline rings retain expanding ripples');
    for (const width of [1200, 390]) for (const motion of ['gentle', 'flow']) {
      await page.setViewportSize({ width, height: 400 });
      await render(attrs('tile-geometry', { motion, motionStrength: 'dynamic', motionMobile: true }));
      for (const time of [0, 4000, 9000, 18000]) {
        await metrics(time);
        assert(await page.locator('.cni-bg2__pattern').evaluate(element => { const box = element.getBoundingClientRect(); const canvas = element.closest('.cni-bg2__canvas').getBoundingClientRect(); return box.left <= canvas.left && box.right >= canvas.right && box.top <= canvas.top && box.bottom >= canvas.bottom; }), 'Full-canvas tile has no exposed moving edges: ' + width + '/' + motion + '/' + time);
      }
    }
    await page.setViewportSize({ width: 1200, height: 400 });
    for (const style of ['confetti', 'waves']) {
      await render(attrs(style, { motion: 'gentle', motionStrength: 'subtle', scale: 'small' }));
      for (const start of [0, 3000, 7000, 11000, 15000]) {
        let traveled = 0, previous = await metrics(start);
        for (let step = 1; step <= 4; step++) { const next = await metrics(start + step * 1000); traveled += impact(previous, next); previous = next; }
        assert(traveled > 2, 'No long imperceptible pause near turnarounds: ' + style + '/' + start + '=' + traveled);
      }
    }
    await render(attrs('confetti', { motion: 'flow', scale: 'small', density: 100, motionStrength: 'dynamic' }));
    assert(await page.evaluate(() => document.getAnimations().every(animation => animation.effect.getKeyframes().every(frame => !Object.hasOwn(frame, 'filter')))), 'No animated blur/filter');
    assert((await metrics(0)).length < 100, 'Small high-density objects keep DOM budget');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await render(attrs('confetti', { motion: 'flow', motionStrength: 'dynamic' }));
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'Reduced-motion protection retained');
    await render(attrs('rings', { motion: 'flow', ringAppearance: 'outline' }));
    const reducedRings = await page.screenshot();
    await render(attrs('rings', { motion: 'none', ringAppearance: 'outline' }));
    assert((await page.screenshot()).equals(reducedRings), 'Reduced-motion rings remain visible as static decoration');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // Existing configuration is repeatable and can react to editor strength changes.
    await render(attrs('confetti', { motion: 'gentle', motionStrength: 'subtle' }));
    const before = await metrics(0);
    await page.evaluate(() => { const block = document.querySelector('.wp-block-cni-blocks-background-design-plus'); block.style.setProperty('--cni-bg2-shift', '23%'); window.cniBlocksBackgroundMotion.configure(block); });
    const after = await metrics(0); assert.notDeepEqual(after, before, 'Editor strength update reflected');
    const previewIsolation = await page.evaluate(() => {
      const block = document.querySelector('.wp-block-cni-blocks-background-design-plus');
      const foreground = document.createElement('span'); foreground.textContent = 'Content'; block.querySelector('.cni-bg2__inner').appendChild(foreground);
      const outside = foreground.animate([{ opacity: .5 }, { opacity: 1 }], { duration: 5000, iterations: Infinity }); outside.pause(); outside.currentTime = 1234;
      window.cniBlocksBackgroundMotion.preview(block);
      return { outside: outside.currentTime, canvas: block.querySelector('.cni-bg2__canvas').getAnimations({ subtree: true }).every(animation => animation.currentTime === 0) };
    });
    assert.deepEqual(previewIsolation, { outside: 1234, canvas: true }, 'Preview only restarts its own background, not content/image motions');

    const inputs = [];
    for (let index = 0; index < pictures.length; index++) {
      const item = pictures[index], x = (index % 3) * 400, y = Math.floor(index / 3) * 170;
      inputs.push({ input: Buffer.from('<svg width="400" height="30"><text x="8" y="20" font-family="sans-serif" font-size="12">' + item.label + '</text></svg>'), left: x, top: y });
      inputs.push({ input: await sharp(item.a).resize(200, 134).png().toBuffer(), left: x, top: y + 30 });
      inputs.push({ input: await sharp(item.b).resize(200, 134).png().toBuffer(), left: x + 200, top: y + 30 });
    }
    const output = path.join(os.tmpdir(), 'cni-bg2-motion-review.png');
    await sharp({ create: { width: 1200, height: illustrated.length * 170, channels: 4, background: '#fff' } }).composite(inputs).png().toFile(output);
    console.log('Passed: 19 styles x 2 motion modes x 3 strengths; visible four-second motion, distinct strengths, static/legacy saved compatibility, preview/public speed, mobile/reduced-motion protections.');
    console.log(output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
