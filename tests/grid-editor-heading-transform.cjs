const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const original=file=>execFileSync('git',['show','v1.50.0:'+file],{cwd:root,encoding:'utf8'});
const css=read('blocks/auto-grid/style.css');
const oldCss=original('blocks/auto-grid/style.css');
function headingSettings(source){
  let settings;
  const useBlockProps=props=>props;useBlockProps.save=useBlockProps;
  const context={window:{wp:{blocks:{registerBlockType:(_name,value)=>settings=value,createBlock:(name,attributes)=>({name,attributes})},element:{createElement:(type,props,...children)=>({type,props,children})},blockEditor:{useBlockProps,RichText:{Content:'RichText.Content'}},components:{},data:{},i18n:{__:text=>text},richText:{getFormatType:()=>undefined,registerFormatType:()=>{}}}}};
  vm.createContext(context);vm.runInContext(source,context);return settings;
}
const heading=headingSettings(read('blocks/heading-plus/index.js'));
const oldHeading=headingSettings(original('blocks/heading-plus/index.js'));
const paragraph=heading.transforms.from.find(item=>item.blocks.includes('core/paragraph'));
const fromHeading=heading.transforms.from.find(item=>item.blocks.includes('core/heading'));
assert(fromHeading,'Standard heading transform is registered');
assert.equal(paragraph.transform.toString(),oldHeading.transforms.from[0].transform.toString(),'Paragraph transform unchanged');
assert.equal(heading.save.toString(),oldHeading.save.toString(),'Existing save markup unchanged');
assert.equal(heading.deprecated[0].save.toString(),oldHeading.deprecated[0].save.toString(),'Legacy save unchanged');
const content='見出し <strong>強調</strong> <em>斜体</em> <a href="#details">リンク</a><br>次の行';
for(const level of [1,2,3,4,5,6]){
  const input={level,content,textAlign:'center',anchor:'section-'+level,className:'custom-heading',textColor:'primary',backgroundColor:'base'};
  const before=JSON.stringify(input);const result=fromHeading.transform(input);
  assert.equal(result.name,'cni-blocks/heading-plus');assert.equal(result.attributes.level,level);assert.equal(result.attributes.tagName,'h'+level);
  assert.equal(result.attributes.content,content);assert.equal(result.attributes.alignment,'center');assert.equal(result.attributes.anchor,'section-'+level);assert.equal(result.attributes.className,'custom-heading');
  assert.equal(result.attributes.textColor,'var(--wp--preset--color--primary)');assert.equal(result.attributes.backgroundColor,'var(--wp--preset--color--base)');
  assert.equal(JSON.stringify(input),before,'Source attributes not mutated');
  if(level===2)assert.deepEqual([result.attributes.fontSizePc,result.attributes.fontSizeTablet,result.attributes.fontSizeMobile],[32,28,21]);
  if(level===3)assert.deepEqual([result.attributes.fontSizePc,result.attributes.fontSizeTablet,result.attributes.fontSizeMobile],[24,22,17.5]);
}
assert.equal(fromHeading.transform({}).attributes.level,2);assert.equal(fromHeading.transform({level:9}).attributes.tagName,'h2');
const customColor=fromHeading.transform({level:3,style:{color:{text:'#173f70',background:'#eef7ff'}},textColor:'primary'}).attributes;
assert.equal(customColor.textColor,'#173f70');assert.equal(customColor.backgroundColor,'#eef7ff');
assert.equal(fromHeading.transform({textColor:'invalid);color:red'}).attributes.textColor,undefined);
const editorBase=`
  html,body{margin:0;font-family:Arial,sans-serif;color:#12395c}p{margin:0 0 16px;overflow-wrap:anywhere;line-height:1.6}
  .fixture{box-sizing:border-box;width:min(1200px,100%);margin:0 auto;padding:20px;background:#e9f5ff}
  .editor-styles-wrapper .wp-block{margin-left:auto;margin-right:auto;max-width:840px}
  .editor-styles-wrapper .wp-block-cni-blocks-auto-grid{max-width:none}
  .components-button{display:inline-flex;align-items:center;justify-content:center;height:36px;border:1px solid #9ba4af;background:white;color:#3858e9;box-sizing:border-box}
  .components-button:focus-visible{outline:2px solid #3858e9;outline-offset:2px}
  .block-list-appender{position:absolute;bottom:0;right:0;width:auto;margin:0}
  .block-editor-button-block-appender{display:flex;align-items:center;justify-content:center;width:100%;height:60px;padding:12px;font-size:24px}
`;
const appender='<div class="block-list-appender"><div class="block-editor-inserter"><button class="components-button block-editor-button-block-appender" aria-label="ブロックを追加">+</button></div></div>';
function fixture(editor,{cell=false,fixed=false,equal=true,items=['<p tabindex="0">短い本文</p>','<p tabindex="0">こちらは少し長い本文のカード</p>']}={}){
  const cards=items.map((item,index)=>'<div class="'+(editor?'wp-block ':'')+'wp-block-cni-blocks-grid-card" data-card="'+index+'"><div class="cni-grid-card__inner">'+(editor?'<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">'+item+appender+'</div></div>':item)+'</div></div>').join('');
  const style='--cni-grid-min-width-pc:400px;--cni-grid-min-width-tablet:300px;--cni-grid-min-width-mobile:280px;--cni-grid-card-max-width:240px;--cni-grid-card-track-alignment:center;--cni-cell-columns-pc:3;--cni-cell-columns-tablet:2;--cni-cell-outer-border-width:1px;--cni-cell-inner-border-width:1px;--cni-grid-gap-x:24px;--cni-grid-gap-y:24px';
  const inner=editor?'<div class="block-editor-inner-blocks"><div class="block-editor-block-list__layout">'+cards+'</div></div>':cell?'<div class="cni-cell-grid-content">'+cards+'</div>':cards;
  return '<div class="fixture '+(editor?'editor-styles-wrapper':'')+'"><div class="'+(editor?'wp-block ':'')+'wp-block-cni-blocks-auto-grid'+(cell?' cni-grid--cell':'')+'" data-equal-height="'+(equal?'1':'0')+'" data-card-width-mode="'+(fixed?'fixed':'flex')+'" data-cell-mobile-layout="stack" style="'+style+'">'+(cell?'<div class="cni-cell-grid-scroll">'+inner+'</div>':inner)+(editor?'<div class="cni-grid-add-card"><button class="components-button cni-grid-add-card__button">＋ カードを追加</button></div>':'')+'</div></div>';
}
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:460}});
    const render=async(sheet,editor,options={})=>{await page.setContent('<style>'+editorBase+sheet+'</style>'+fixture(editor,options));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
    const widths=()=>page.locator('.wp-block-cni-blocks-grid-card').evaluateAll(cards=>cards.map(card=>card.getBoundingClientRect().width));
    await render(oldCss,true);const before=await page.screenshot();const narrow=await widths();assert(Math.abs(narrow[0]-narrow[1])>50,'Reproduce intrinsic-width editor cards');
    await render(css,true);const after=await page.screenshot();const expanded=await widths();assert(Math.abs(expanded[0]-expanded[1])<1);assert(expanded[0]>narrow[0]*2,'Cards fill their tracks');
    await render(css,false);const publicWidths=await widths();for(let index=0;index<expanded.length;index++)assert(Math.abs(expanded[index]-publicWidths[index])<1,'Editor/public width match');
    for(const width of [1280,900,390])for(const options of [{},{fixed:true},{cell:true},{items:['','']},{equal:false,items:['<p>短い本文</p>','<p style="height:180px">長い本文</p>']}]){
      await page.setViewportSize({width,height:460});
      await render(oldCss,false,options);const originalPublic=await page.screenshot();
      await render(css,false,options);assert((await page.screenshot()).equals(originalPublic),'Public rendering unchanged '+width+' '+JSON.stringify(options));
      const expected=await widths();await render(css,true,options);const actual=await widths();
      actual.forEach((value,index)=>assert(Math.abs(value-expected[index])<1,'Track width match '+width));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No editor horizontal overflow '+width);
      if(options.equal===false){const heights=await page.locator('.wp-block-cni-blocks-grid-card').evaluateAll(cards=>cards.map(card=>card.getBoundingClientRect().height));assert(heights[1]>heights[0]+80,'Unequal heights remain available');}
    }
    await page.setViewportSize({width:1280,height:460});await render(css,true);
    const card=page.locator('[data-card="0"]');const add=card.locator('.block-list-appender');
    assert.equal(await add.isVisible(),false,'Quiet when unselected');
    await card.evaluate(element=>element.classList.add('is-selected'));assert(await add.isVisible(),'Selected card can insert');
    const contentBox=await card.locator('p').boundingBox();const addBox=await add.boundingBox();assert(addBox.y>=contentBox.y+contentBox.height,'Appender does not cover content');
    const button=add.locator('button');const size=await button.boundingBox();assert.equal(size.width,32);assert.equal(size.height,32);
    await card.evaluate(element=>element.classList.remove('is-selected'));await card.locator('p').focus();assert(await add.isVisible(),'Keyboard focus reveals appender');
    await button.focus();assert.equal(await button.evaluate(element=>document.activeElement===element),true,'Keyboard accessible');
    await page.locator('body').click({position:{x:1,y:1}});await add.evaluate(element=>element.classList.add('is-drag-over'));assert(await add.isVisible(),'Drop target remains visible');
    await render(css,true,{items:['','']});assert(await page.locator('[data-card="0"] .block-list-appender button').isVisible(),'Empty card can insert');
    const compact=await page.locator('.cni-grid-add-card__button').boundingBox();assert(compact.width<200,'Add-card button is content-sized');
    const output=path.join(os.tmpdir(),'cni-grid-editor-review.png');
    await sharp({create:{width:1280,height:980,channels:4,background:'#ffffff'}}).composite([
      {input:Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">Before / editor</text></svg>'),left:0,top:0},{input:before,left:0,top:30},
      {input:Buffer.from('<svg width="1280" height="30"><text x="24" y="22" font-family="sans-serif" font-size="18">After / editor</text></svg>'),left:0,top:490},{input:after,left:0,top:520}
    ]).png().toFile(output);
    console.log('Passed: grid widths for empty/short/long cards, fixed tracks, cell mode, unequal heights, three viewports; compact non-overlapping keyboard/drop appenders; unchanged public screenshots; H1-H6 transforms, H2/H3 sizes, rich content/anchors/alignment/colors, unchanged saves and paragraph transform.');console.log(output);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
