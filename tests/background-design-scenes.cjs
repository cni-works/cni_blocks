const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'blocks/background-design-plus/index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'blocks/background-design-plus/style.css'), 'utf8');
const motionRuntime = fs.readFileSync(path.join(root, 'blocks/background-design-plus/motion.js'), 'utf8');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'blocks/background-design-plus/block.json'), 'utf8'));
const defaults = Object.fromEntries(Object.entries(metadata.attributes).map(([key, value]) => [key, value.default]));
const context = { window: { cniBlocksBackgroundDesignPlusConfig: {themeColor:'#cc0000'}, wp: { blocks: {}, element: { createElement: (type, props, ...children) => ({type, props, children}) }, blockEditor: {}, components: {}, i18n: { __: text => text } } } };
vm.createContext(context);
vm.runInContext(source.replace('\tregister();', 'globalThis.designTest = { canvas, presetsFor, presetChanges, STYLE_OPTIONS, rootStyle, BackgroundMarkup };'), context);
const api = context.designTest;
const escape = text => String(text).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const serialize = node => {
  if (node == null || node === false) return '';
  if (Array.isArray(node)) return node.map(serialize).join('');
  if (typeof node !== 'object') return escape(node);
  if (typeof node.type === 'function') return serialize(node.type({...node.props,children:node.children}));
  const attrs = Object.entries(node.props || {}).filter(([key])=>key !== 'key').map(([key,value])=> {
    if (key === 'style') value = Object.entries(value).map(([name,item])=>(name.startsWith('--') ? name : name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))+':'+item).join(';');
    return ' '+(key === 'className' ? 'class' : key)+'="'+escape(value)+'"';
  }).join('');
  return '<'+node.type+attrs+'>'+node.children.map(serialize).join('')+'</'+node.type+'>';
};
const scene = (style, changes={}) => ({...defaults,...api.presetChanges(style,'classic'),...changes,style,paddingY:0,paddingX:0,minHeight:360});
const section = attrs => serialize(api.BackgroundMarkup({attributes:attrs,blockProps:{className:'wp-block-cni-blocks-background-design-plus',style:api.rootStyle(attrs,false),'data-cni-bg2-motion':attrs.motion,'data-cni-bg2-mobile-motion':attrs.motionMobile ? 'true':'false'},editor:false,children:[]}));
const diff = async (a,b) => {
  const first = await sharp(a).removeAlpha().raw().toBuffer(); const second = await sharp(b).removeAlpha().raw().toBuffer();
  let changed=0; for(let index=0;index<first.length;index+=3) if(Math.abs(first[index]-second[index])+Math.abs(first[index+1]-second[index+1])+Math.abs(first[index+2]-second[index+2])>12) changed++;
  return changed/(first.length/3);
};
(async()=>{
  for(const option of api.STYLE_OPTIONS) for(const preset of api.presetsFor(option.value)) {
    const a=api.presetChanges(option.value,preset[0],{...defaults,paletteMode:'theme',baseColor:'#ff0000'});
    const b=api.presetChanges(option.value,preset[0],{...defaults,paletteMode:'manual',baseColor:'#00ff00'});
    assert.equal(JSON.stringify(a),JSON.stringify(b),'Preset must not inherit previous palette');
    assert.equal(a.paletteMode,'manual'); for(const key of ['baseColor','color1','color2','color3','color4','color5']) assert.match(a[key],/^#[0-9a-f]{6}$/i);
  }
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page=await browser.newPage({viewport:{width:1000,height:360},deviceScaleFactor:1});
    const render=async attrs=>{await page.setContent('<style>html,body{margin:0}'+css+'</style>'+section(attrs));await page.addScriptTag({content:motionRuntime});await page.evaluate(async()=>{await Promise.all(Array.from(document.querySelectorAll('span')).map(async element=>{const background=getComputedStyle(element).backgroundImage;if(background.startsWith('url(')){const image=new Image();image.src=background.slice(5,-2);await image.decode();}}));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});return page.screenshot();};
    const panels=[]; const labels=[];
    for(const style of ['pixel-wave','waves','particle-wave','layered-panels','soft-polygons']) {
      const extra=style==='soft-polygons'?{polygonShape:'faceted'}:{};
      const attrs=scene(style,extra);
      const normal=await render(attrs); const small=await render({...attrs,scale:'small',density:20,opacity:28});const bold=await render({...attrs,scale:'xlarge',density:80,variation:90,opacity:65});
      assert(await diff(normal,small)>.02,style+' small must visibly differ');assert(await diff(normal,bold)>.02,style+' large must visibly differ');
      const seedImages=[];for(const seed of [1,37291,91837,75349,876421]) seedImages.push((await render({...attrs,seed})).toString('base64'));
      assert.equal(new Set(seedImages).size,5,style+' regeneration');
      assert(await diff(await render(attrs),normal)<.001,style+' deterministic save');
      for(const motion of ['gentle','flow']) {
        await render({...attrs,motion,motionStrength:'subtle'});
        assert(await page.evaluate(()=>document.getAnimations().length)>0,style+' animation must exist');
        await page.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=0;}));const first=await page.screenshot();
        await page.evaluate(()=>document.getAnimations().forEach(a=>a.currentTime=4000));const later=await page.screenshot();
        assert(await diff(first,later)>.002,style+' subtle '+motion+' must move within four seconds');
      }
      panels.push(normal,small,bold);labels.push(style+' / recommended',style+' / small',style+' / bold');
      await page.setViewportSize({width:390,height:360});await render({...attrs,motion:'flow',motionMobile:false});
      assert.equal(await page.evaluate(()=>document.getAnimations().length),0,'Mobile motion off');
      await page.setViewportSize({width:1000,height:360});
      const top=await render({...attrs,composition:'top'});const bottom=await render({...attrs,composition:'bottom'});
      assert(await diff(top,bottom)>.02,style+' top/bottom placement');
      await render({...attrs,scale:'small',density:100,variation:100,motion:'flow',motionStrength:'dynamic'});
      assert(await page.locator('.cni-bg2__design-layer').count()<=9,style+' must keep DOM layers bounded');
      const shapes=await page.locator('.cni-bg2__design-layer').evaluateAll(elements=>elements.reduce((count,element)=>{const data=getComputedStyle(element).backgroundImage;return count+(decodeURIComponent(data).match(/<(?:circle|rect|path|polygon)\b/g)||[]).length;},0));
      assert(shapes<=2200,style+' SVG budget');
      const plain=await render(attrs);const grain=await render({...attrs,texture:'grain',textureOpacity:35});
      assert(await diff(plain,grain)>.01,style+' texture must be visible');
    }
    const output=path.join(os.tmpdir(),'cni-bg2-design-review.png');
    const inputs=[];
    for(let index=0;index<panels.length;index++) {
      const buffer=await sharp(panels[index]).resize(500,180).png().toBuffer();const x=(index%3)*500;const y=Math.floor(index/3)*210;
      inputs.push({input:buffer,left:x,top:y+30});inputs.push({input:Buffer.from('<svg width="500" height="30"><text x="12" y="22" font-family="sans-serif" font-size="16">'+labels[index]+'</text></svg>'),left:x,top:y});
    }
    await sharp({create:{width:1500,height:1050,channels:4,background:'#ffffff'}}).composite(inputs).png().toFile(output);
    console.log('Passed: all preset palettes, five styles with small/large differences, five seeds, deterministic rendering, 4-second subtle motions, mobile motion off.');console.log(output);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
