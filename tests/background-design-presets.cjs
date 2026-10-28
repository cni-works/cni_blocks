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
const context = { window: { cniBlocksBackgroundDesignPlusConfig: {themeColor:'#cc0000'}, wp: {blocks:{}, element:{createElement:(type,props,...children)=>({type,props,children})}, blockEditor:{}, components:{}, i18n:{__:text=>text}}}};
vm.createContext(context);
vm.runInContext(source.replace('\tregister();','globalThis.designTest = { presetsFor, presetChanges, STYLE_OPTIONS, STYLE_PRESETS, rootStyle, BackgroundMarkup };'),context);
const api = context.designTest;
const stylePanel = source.indexOf("title: __( '背景スタイル'");
const presetPanel = source.indexOf("title: __( 'スタイル別プリセット'");
const compositionPanel = source.indexOf('compositionControls( attributes, setAttributes ),', stylePanel);
assert(stylePanel < presetPanel && presetPanel < compositionPanel, 'Inspector order: style, presets, composition');
assert.equal(source.split("title: __( 'スタイル別プリセット'").length - 1, 1, 'Preset panel appears once');
const escape = text => String(text).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const serialize = node => {
  if (node == null || node === false) return '';
  if (Array.isArray(node)) return node.map(serialize).join('');
  if (typeof node !== 'object') return escape(node);
  if (typeof node.type === 'function') return serialize(node.type({...node.props,children:node.children}));
  const attrs = Object.entries(node.props||{}).filter(([key])=>key!=='key').map(([key,value])=>{
    if(key==='style') value=Object.entries(value).map(([name,item])=>(name.startsWith('--')?name:name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))+':'+item).join(';');
    return ' '+(key==='className'?'class':key)+'="'+escape(value)+'"';
  }).join('');
  return '<'+node.type+attrs+'>'+node.children.map(serialize).join('')+'</'+node.type+'>';
};
const section = (attrs,editor=false) => serialize(api.BackgroundMarkup({attributes:attrs,blockProps:{className:'wp-block-cni-blocks-background-design-plus',style:api.rootStyle(attrs,false),'data-cni-bg2-motion':attrs.motion,'data-cni-bg2-mobile-motion':attrs.motionMobile?'true':'false','data-cni-bg2-direction':attrs.lineDirection},editor,children:[]}));
const palette = attrs => JSON.stringify(Object.fromEntries(['baseColor','color1','color2','color3','color4','color5'].map(key=>[key,attrs[key]])));
(async()=>{
  let total=0; let moving=0;
  const seeds=new Set();
  const preserved={paddingY:123,paddingX:47,minHeight:420,contentWidth:900,contentAlign:'center',borderRadius:22,fixedBackground:true,paddingVerticalMobile:34,freeImagesEnabled:true,freeImages:[{id:'existing',imageUrl:'existing.png',x:22,y:18}]};
  for(const option of api.STYLE_OPTIONS){
    const style=option.value; const presets=api.presetsFor(style);
    assert(presets.length>=5 && presets.length<=8,style+' useful preset count');
    assert.equal(new Set(presets.map(item=>item[0])).size,presets.length,style+' unique IDs');
    const before=new Map(presets.map(item=>[item[0],palette(item[2])]));
    api.STYLE_PRESETS[style].reverse();
    for(const item of api.presetsFor(style)) assert.equal(palette(item[2]),before.get(item[0]),style+' palette independent of ordering');
    api.STYLE_PRESETS[style].reverse();
    for(const item of presets){
      const changes=api.presetChanges(style,item[0]); const restored={...defaults,...preserved,...changes};
      for(const [key,value] of Object.entries(preserved)) assert.deepEqual(restored[key],value,style+' preserve '+key);
      for(const key of ['baseColor','color1','color2','color3','color4','color5']) assert.match(changes[key],/^#[0-9a-f]{6}$/i);
      assert.equal(changes.paletteMode,'manual');
      assert.equal(changes.seed,api.presetChanges(style,item[0]).seed,style+' repeatable placement');
      assert(Number.isInteger(changes.seed)&&changes.seed>0&&changes.seed<2147483647);
      assert(!seeds.has(changes.seed),'unique preset seed');seeds.add(changes.seed);
      const attrs={...defaults,...changes};
      assert.equal(section(attrs),section(JSON.parse(JSON.stringify(attrs))),style+' saved seed/render');
      assert.equal(section(attrs,true),section(attrs,false),style+' editor/front background markup');
      if(item[0].startsWith('moving-')) { assert.notEqual(changes.motion,'none');moving++; }
      else assert.equal(changes.motion,'none',style+' static unless explicitly named');
      total++;
    }
  }
  const output=path.join(os.tmpdir(),'cni-bg2-preset-review');fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1000,height:360},deviceScaleFactor:1});
    for(const option of api.STYLE_OPTIONS){
      const pictures=[]; const fingerprints=new Set(); const presets=api.presetsFor(option.value);
      for(let index=0;index<presets.length;index++){
        const item=presets[index];const attrs={...defaults,...api.presetChanges(option.value,item[0]),paddingY:0,paddingX:0,minHeight:360};
        await page.setContent('<style>html,body{margin:0}'+css+'</style>'+section(attrs));
        await page.addScriptTag({content:motionRuntime});
        await page.evaluate(async()=>{
          await Promise.all(Array.from(document.querySelectorAll('*')).map(async element=>{const background=getComputedStyle(element).backgroundImage;if(background.startsWith('url(')){const image=new Image();image.src=background.slice(5,-2);await image.decode();}}));
          document.getAnimations().forEach(animation=>{animation.pause();animation.currentTime=2000;});
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        });
        if(item[0].startsWith('moving-')) {
          assert(await page.evaluate(()=>document.getAnimations().length)>0,option.value+' moving preset animation');
          await page.evaluate(()=>document.getAnimations().forEach(animation=>animation.currentTime=0));const first=await page.screenshot();
          await page.evaluate(()=>document.getAnimations().forEach(animation=>animation.currentTime=4000));const later=await page.screenshot();
          const a=await sharp(first).removeAlpha().raw().toBuffer();const b=await sharp(later).removeAlpha().raw().toBuffer();
          let changed=0;for(let pixel=0;pixel<a.length;pixel+=3) if(Math.abs(a[pixel]-b[pixel])+Math.abs(a[pixel+1]-b[pixel+1])+Math.abs(a[pixel+2]-b[pixel+2])>12) changed++;
          console.log(option.value+' 4-second motion difference: '+(changed/(a.length/3)).toFixed(4));
          assert(changed/(a.length/3)>.001,option.value+' moving preset visible within four seconds');
          await page.evaluate(()=>document.getAnimations().forEach(animation=>animation.currentTime=2000));
        }
        const image=await page.screenshot();fingerprints.add(image.toString('base64'));
        const x=(index%4)*400;const y=Math.floor(index/4)*174;
        pictures.push({input:await sharp(image).resize(400,144).png().toBuffer(),left:x,top:y+30});
        pictures.push({input:Buffer.from('<svg width="400" height="30"><text x="8" y="21" font-family="sans-serif" font-size="14">'+escape(item[1])+'</text></svg>'),left:x,top:y});
      }
      assert.equal(fingerprints.size,presets.length,option.value+' no identical rendered presets');
      await sharp({create:{width:1600,height:348,channels:4,background:'#ffffff'}}).composite(pictures).png().toFile(path.join(output,option.value+'.png'));
      console.log(option.value+': '+presets.length+' rendered presets');
    }
    console.log('Passed: '+total+' presets / '+api.STYLE_OPTIONS.length+' styles / '+moving+' explicitly moving presets. Stable named palettes, fixed seeds, preserved layout/images, saved and editor/front markup.');
    console.log(output);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
