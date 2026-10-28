const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const filename = 'blocks/background-design-plus/index.js';
const source = fs.readFileSync(path.join(root, filename), 'utf8');
const baseline = execFileSync('git', ['show', 'v1.50.0:' + filename], {cwd:root,encoding:'utf8'});
const css = fs.readFileSync(path.join(root, 'blocks/background-design-plus/style.css'), 'utf8');
const defaults = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(root,'blocks/background-design-plus/block.json'),'utf8')).attributes).map(([key,value])=>[key,value.default]));
const componentNames = ['Button','ButtonGroup','ColorPalette','PanelBody','RangeControl','SelectControl','TextControl','ToggleControl'];
const createElement = (type,props,...children)=>({type,props:props||{},children});
const makeContext = () => {
  const useBlockProps = props=>props; useBlockProps.save=useBlockProps;
  return {window:{wp:{blocks:{},element:{createElement,useState:initial=>[initial,()=>{}],useEffect:()=>{},useRef:initial=>({current:initial})},blockEditor:{useBlockProps,InnerBlocks:'InnerBlocks',InspectorControls:'InspectorControls',MediaUpload:'MediaUpload',MediaUploadCheck:'MediaUploadCheck'},components:Object.fromEntries(componentNames.map(name=>[name,name])),i18n:{__:text=>text}}}};
};
const load = text => {
  const context=makeContext(); vm.createContext(context);
  vm.runInContext(text.replace('\tregister();','globalThis.api={ BackgroundMarkup, rootStyle, freeImageElements, imageValue, imageVisible'+(text===source?', FreeImageControls, updatedFreeImage, register':'')+' };'),context);
  return {api:context.api,context};
};
const {api}=load(source); const old=load(baseline).api;
const normalize = value=>JSON.parse(JSON.stringify(value));
const flat = node=>node==null||node===false?[]:Array.isArray(node)?node.flatMap(flat):typeof node==='object'?[node,...node.children.flatMap(flat)]:[];
const find = (tree,type,label)=>{const node=flat(tree).find(item=>item.type===type&&(label===undefined||item.props.label===label||item.children.includes(label)));assert(node,type+' '+label);return node;};
const image={id:'one',name:'Image',imageId:1,imageUrl:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="80"%3E%3Crect width="100" height="80" fill="%232563eb"/%3E%3C/svg%3E',x:20,y:30,width:10,visible:true,rotation:15,opacity:75,flipX:true,imageMotion:'float'};
const legacyCases=[[],[image],[{...image,visible:false,tabletX:60,tabletWidth:40}],[{...image,layer:'back',mobileVisible:false,mobileX:0,mobileWidth:12}, {...image,id:'two',visible:false,mobileVisible:true}]];
for(const freeImages of legacyCases){
  const attrs={...defaults,freeImagesEnabled:true,freeImages};
  const props={attributes:attrs,blockProps:{className:'wp-block-cni-blocks-background-design-plus',style:api.rootStyle(attrs,false)},editor:false,children:[]};
  assert.deepEqual(normalize(api.BackgroundMarkup(props)),normalize(old.BackgroundMarkup(props)),'Unedited saved markup must stay identical');
}
assert.equal(api.updatedFreeImage(image,{name:'Renamed'}).responsiveVersion,undefined,'Name-only edit preserves legacy mode');
assert.equal(api.updatedFreeImage(image,{mobileX:12}).responsiveVersion,2,'Responsive edit opts in');
const outerContext=makeContext();vm.createContext(outerContext);
vm.runInContext(fs.readFileSync(path.join(root,'blocks/outer/index.js'),'utf8').replace("blocks.registerBlockType( 'cni-blocks/outer', {","globalThis.outerApi={freeImageNumber,freeImageVisible}; return; blocks.registerBlockType( 'cni-blocks/outer', {"),outerContext);
for(const overrides of [{},{visible:false},{visible:false,tabletVisible:true},{tabletX:61,tabletY:72,tabletWidth:44},{tabletVisible:false,mobileVisible:true,mobileX:0,mobileWidth:15}]){
  const item={...image,...overrides,responsiveVersion:2};
  for(const device of ['pc','tablet','mobile']){
    assert.equal(api.imageVisible(item,device),outerContext.outerApi.freeImageVisible(item,device),'Outer visibility '+device);
    for(const key of ['x','y','width'])assert.equal(api.imageValue(item,key,device,key==='width'?30:50),outerContext.outerApi.freeImageNumber(item,key,device,key==='width'?30:50),'Outer numeric inheritance '+device+' '+key);
  }
}
let attrs={...defaults,freeImagesEnabled:true,freeImages:[{...image,responsiveVersion:2,tabletX:60,tabletY:65,tabletWidth:40}]};
let device='pc';let selectedId='one';
const panel=()=>api.FreeImageControls({attributes:attrs,selected:attrs.freeImages.find(item=>item.id===selectedId)||attrs.freeImages[0]||null,device,setDevice:value=>device=value,select:id=>selectedId=id,setAttributes:changes=>attrs={...attrs,...changes},updateImage:(id,changes)=>attrs={...attrs,freeImages:attrs.freeImages.map(item=>item.id===id?api.updatedFreeImage(item,changes):item)}});
find(panel(),'Button','Mobile').props.onClick();assert.equal(device,'mobile');
find(panel(),'TextControl','X（%）').props.onChange('24.5');assert.equal(attrs.freeImages[0].mobileX,24.5);assert.equal(attrs.freeImages[0].x,20);assert.equal(attrs.freeImages[0].tabletX,60);
find(panel(),'TextControl','幅（%）').props.onChange('35.5');assert.equal(attrs.freeImages[0].mobileWidth,35.5);assert.equal(attrs.freeImages[0].width,10);
find(panel(),'TextControl','幅（%）').props.onChange('0');assert.equal(attrs.freeImages[0].mobileWidth,5);
find(panel(),'RangeControl').props.onChange(45);assert.equal(attrs.freeImages[0].mobileWidth,45);
find(panel(),'ToggleControl','Mobileで表示').props.onChange(false);assert.equal(attrs.freeImages[0].mobileVisible,false);assert.equal(attrs.freeImages[0].visible,true);
const pointer={button:0,pointerId:1,clientX:80,clientY:20,preventDefault(){},currentTarget:{getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}}};
flat(panel()).find(node=>node.props.className==='cni-bg2__image-picker').props.onPointerDown(pointer);
assert.equal(attrs.freeImages[0].mobileX,98);assert.equal(attrs.freeImages[0].mobileY,2);assert.equal(attrs.freeImages[0].x,20);
const replacement=flat(panel()).find(node=>node.type==='MediaUpload'&&node.props.value===1);
replacement.props.onSelect({id:2,url:image.imageUrl,alt:'Changed'});assert.equal(attrs.freeImages[0].imageId,2);assert.equal(attrs.freeImages[0].mobileWidth,45);
find(panel(),'Button','この画像を複製').props.onClick();assert.equal(attrs.freeImages.length,2);assert.equal(attrs.freeImages[1].mobileWidth,45);assert.equal(attrs.freeImages[1].x,23);
find(panel(),'Button','この画像を削除').props.onClick();assert.equal(attrs.freeImages.length,1);
const add=flat(panel()).find(node=>node.type==='MediaUpload'&&!Object.hasOwn(node.props,'value'));
add.props.onSelect({id:3,url:image.imageUrl});assert.equal(attrs.freeImages[1].responsiveVersion,2);assert.equal(attrs.freeImages[1].mobileVisible,undefined);
attrs={...attrs,freeImages:Array.from({length:6},(_,index)=>({...image,id:String(index)}))};
const fullPanel=panel();const fullUpload=flat(fullPanel).find(node=>node.type==='MediaUpload'&&!Object.hasOwn(node.props,'value'));
assert.equal(fullUpload.props.render({open(){}}).props.disabled,true);
fullUpload.props.onSelect({id:7,url:image.imageUrl});assert.equal(attrs.freeImages.length,6);
// Exercise the production editor drag handlers with Mobile selected.
let settings;
const dragContext=makeContext();const dragStates=[false,'one','mobile'];dragContext.window.wp.element.useState=()=>[dragStates.shift(),()=>{}];dragContext.window.wp.blocks.registerBlockType=(_name,value)=>settings=value;vm.createContext(dragContext);vm.runInContext(source,dragContext);
let dragAttrs={...defaults,freeImagesEnabled:true,freeImages:[{...image,mobileX:60,mobileY:40}]};
const tree=settings.edit({attributes:dragAttrs,setAttributes:changes=>dragAttrs={...dragAttrs,...changes}});
const markup=flat(tree).find(node=>typeof node.type==='function'&&node.type.name==='BackgroundMarkup');assert(markup);
const dragEvent={button:0,clientX:500,clientY:250,pointerId:1,preventDefault(){},stopPropagation(){},currentTarget:{closest:()=>({getBoundingClientRect:()=>({left:0,top:0,width:1000,height:500})}),setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}}};
markup.props.handlers.startDrag(dragEvent,dragAttrs.freeImages[0]);markup.props.handlers.moveDrag({...dragEvent,clientX:600,clientY:300},dragAttrs.freeImages[0]);markup.props.handlers.endDrag(dragEvent);
assert.equal(dragAttrs.freeImages[0].mobileX,70);assert.equal(dragAttrs.freeImages[0].mobileY,50);assert.equal(dragAttrs.freeImages[0].x,20);
const escape=text=>String(text).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const serialize=node=>{
  if(node==null||node===false)return '';if(Array.isArray(node))return node.map(serialize).join('');if(typeof node!=='object')return escape(node);
  if(typeof node.type==='function')return serialize(node.type({...node.props,children:node.children}));
  const props=Object.entries(node.props).filter(([key,value])=>key!=='key'&&value!==undefined&&typeof value!=='function').map(([key,value])=>{
    if(key==='style')value=Object.entries(value).map(([name,item])=>(name.startsWith('--')?name:name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))+':'+item).join(';');return ' '+(key==='className'?'class':key)+'="'+escape(value)+'"';
  }).join('');return '<'+node.type+props+'>'+node.children.map(serialize).join('')+'</'+node.type+'>';
};
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:700}});
    const render=async(item,editorDevice)=>{
      const attributes={...defaults,paddingY:0,paddingX:0,minHeight:400,freeImagesEnabled:true,freeImages:[{...item,imageMotion:'none'}]};
      const blockProps={className:'wp-block-cni-blocks-background-design-plus',style:api.rootStyle(attributes,false)};if(editorDevice)blockProps['data-cni-bg2-image-editor-device']=editorDevice;
      await page.setContent('<style>html,body{margin:0}'+css+'</style><div class="'+(editorDevice?'editor-styles-wrapper':'')+'">'+serialize(api.BackgroundMarkup({attributes,blockProps,editor:false,children:[]}))+'</div>');
      return page.locator('.cni-bg2__free-image').evaluate(element=>{const rect=element.getBoundingClientRect(),parent=element.closest('section').getBoundingClientRect();return {visible:getComputedStyle(element).display!=='none',x:(rect.left+rect.width/2-parent.left)/parent.width*100,y:(rect.top+rect.height/2-parent.top)/parent.height*100,width:rect.width/parent.width*100};});
    };
    const numeric={...image,responsiveVersion:2,tabletX:60,tabletY:65,tabletWidth:40};
    for(const width of [1280,1025,1024,1023,782,781,390]){
      await page.setViewportSize({width,height:700});const result=await render(numeric);const isPc=width>=1024;
      assert(Math.abs(result.x-(isPc?20:60))<.1,'Front X '+width);assert(Math.abs(result.width-(isPc?10:40))<.1,'Front width '+width);
    }
    const visibility={...numeric,visible:false,tabletVisible:false,mobileVisible:true};
    for(const [width,visible] of [[1280,false],[1024,false],[1023,false],[900,false],[390,true]]){await page.setViewportSize({width,height:700});assert.equal((await render(visibility)).visible,visible,'Visibility '+width);}
    await page.setViewportSize({width:1024,height:700});assert.equal((await render({...numeric,tabletVisible:false})).visible,true,'PC boundary matches Outer at 1024px');
    await page.setViewportSize({width:1280,height:700});
    assert.equal((await render(visibility,'mobile')).visible,true,'Editor Mobile overrides PC visibility');
    assert.equal((await render(visibility,'pc')).visible,false,'Editor PC hidden');
    const mobile=await render(numeric,'mobile');assert(Math.abs(mobile.x-60)<.1);assert(Math.abs(mobile.width-40)<.1);
    const inheritedHidden=await render({...numeric,tabletVisible:false},'mobile');assert.equal(inheritedHidden.visible,false,'Mobile inherits Tablet visibility');
    await page.setViewportSize({width:390,height:700});const legacy=await render({...image,tabletX:60,tabletWidth:40});assert(Math.abs(legacy.x-20)<.1,'Unedited legacy mobile position preserved');
    console.log('Passed: Outer-compatible responsive inheritance; legacy saved markup unchanged; integrated tabs/numeric controls/picker/drag/replacement/duplicate/remove/6-image limit; public breakpoints and editor visibility.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
