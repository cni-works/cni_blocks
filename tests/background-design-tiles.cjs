// Run with Node and sharp on NODE_PATH. Render the production tile generator,
// not a duplicate implementation, and check coverage and seeded regeneration.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'blocks/background-design-plus/index.js'), 'utf8');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'blocks/background-design-plus/block.json'), 'utf8'));
const defaults = Object.fromEntries(Object.entries(metadata.attributes).map(([key, value]) => [key, value.default]));
const context = { window: { wp: { blocks: {}, element: { createElement: (type, props, ...children) => ({type, props, children}) }, blockEditor: {}, components: {}, i18n: { __: text => text } } } };
vm.createContext(context);
vm.runInContext(source.replace('\tregister();', 'globalThis.tileTest = { canvas, styleDefaults };'), context);
const attrs = { ...defaults, style: 'tile-geometry', color1: '#2563eb', color2: '#7dd3fc', baseColor: '#f8fafc', opacity: 70, tileGap: 0 };
const render = changes => context.tileTest.canvas({ ...attrs, ...changes });
const svg = node => { const image = node.props.style.backgroundImage; return Buffer.from(decodeURIComponent(image.slice(image.indexOf(',') + 1, -2))); };
const assertCoverage = async (pattern, changes = {}) => {
  const pixels = await sharp(svg(render({ tilePattern: pattern, ...changes }))).resize(720, pattern === 'hex' ? 400 : 720).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let holes = 0;
  for (let index = 3; index < pixels.data.length; index += 4) if (pixels.data[index] < 250) holes++;
  assert.equal(holes, 0, pattern + ' must cover every pixel when gap is zero');
};
(async () => {
  for (const pattern of ['hex', 'square', 'diamond']) await assertCoverage(pattern);
  const hexOpen = await sharp(svg(render({tilePattern:'hex', tileGap:16}))).ensureAlpha().raw().toBuffer();
  assert(hexOpen.some((value, index) => index % 4 === 3 && value < 10), 'Nonzero hex gaps must expose the base');
  const sizes = ['small', 'normal', 'large', 'xlarge'].map(scale => parseFloat(render({tilePattern:'hex', scale}).props.style.backgroundSize));
  assert(sizes.every((size, index) => !index || size > sizes[index - 1]), 'Object size must grow with the size selector');
  const seeds = [1, 37291, 87421, 918371, 2147482999];
  assert.equal(new Set(seeds.map(seed => render({tilePattern:'classic', seed}).props.style.backgroundImage)).size, seeds.length);
  assert.equal(render({tilePattern:'classic'}).props.style.backgroundImage, render({tilePattern:'classic'}).props.style.backgroundImage);
  assert.equal(render({tilePattern:'classic'}).props.style.backgroundRepeat, 'no-repeat');
  assert.equal(context.tileTest.styleDefaults('tile-geometry', attrs).tilePattern, 'classic');
  const mainLine = source.split('\n').find(line => line.includes("title: __( '背景スタイル'"));
  assert(mainLine.indexOf('tileControls( attributes, setAttributes )') < mainLine.indexOf("label: __( 'サイズ'"), 'Tile pattern control must be above size');
  const panels = [];
  const variants = [['classic',0,'Classic triangles'],['diamond',0,'Diamond'],['square',12,'Square / gap 12px'],['mosaic',0,'Mosaic'],['hex',0,'Hex / gap 0px'],['hex',16,'Hex / gap 16px']];
  for (const [pattern, gap, label] of variants) {
    const node = render({tilePattern:pattern, tileGap:gap});
    const size = node.props.style.backgroundSize.split(' ').map(parseFloat);
    const image = await sharp(svg(node)).resize(pattern === 'classic' ? 500 : Math.round(size[0]), pattern === 'classic' ? 260 : Math.round(size[1]), {fit:'fill'}).png().toBuffer();
    const heading = Buffer.from('<svg width="500" height="40"><text x="16" y="27" font-size="18" font-family="sans-serif">' + label + '</text></svg>');
    const panel = await sharp({create:{width:500,height:300,channels:4,background:attrs.baseColor}}).composite([{input:image, tile:pattern !== 'classic', top:40,left:0,blend:'over'},{input:heading,top:0,left:0}]).png().toBuffer();
    panels.push(panel);
  }
  const output = path.join(os.tmpdir(), 'cni-bg2-tile-review.png');
  await sharp({create:{width:1500,height:600,channels:4,background:'#ffffff'}}).composite(panels.map((input,index)=>({input,left:(index%3)*500,top:Math.floor(index/3)*300}))).png().toFile(output);
  console.log('Passed: gap-zero coverage, adjustable gaps, monotonic sizing, five seeded layouts, deterministic rendering, UI order.');
  console.log('Visual comparison: ' + output);
})().catch(error=>{console.error(error);process.exitCode=1;});
