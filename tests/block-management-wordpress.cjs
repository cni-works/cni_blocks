/** Optional integration test: npm-cache Playground + a disposable WordPress/SQLite site.
 * CNI_PLAYGROUND_MODULE points to an installed @wp-playground/cli directory.
 * No repository dependency install, release ZIP, or existing site is used.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { runCLI } = require(process.env.CNI_PLAYGROUND_MODULE || '@wp-playground/cli');
const root = path.resolve(__dirname, '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cni-block-management-wp-'));
const pluginCopy = path.join(scratch, 'cni_blocks');
fs.mkdirSync(pluginCopy);
for (const name of ['cni_blocks.php', 'block.json', 'index.js', 'view.js', 'style.css', 'readme.txt', 'includes', 'blocks', 'assets']) {
  fs.cpSync(path.join(root, name), path.join(pluginCopy, name), { recursive: true });
}
const pass = 'Cni-ephemeral-review-42!';
const setup = `<?php
require '/wordpress/wp-load.php';
wp_set_password('${pass}', 1);
wp_insert_user(array('user_login'=>'cni-review-editor','user_pass'=>'${pass}','role'=>'editor'));
$content = '<!-- wp:paragraph --><p>Keep this content.</p><!-- /wp:paragraph -->' . "\n" . '<!-- wp:cni-blocks/page-flip ' . wp_json_encode(array('pages'=>array(array('url'=>home_url('/cni-review.svg'),'alt'=>'Review','focusAreas'=>array())))) . ' /-->';
$id=wp_insert_post(array('post_type'=>'page','post_status'=>'publish','post_title'=>'CNI Recovery Fixture','post_content'=>$content));
update_post_meta($id,'cni_review_marker',array('keep'=>'unchanged'));
update_option('cni_review_post_id',$id);
update_option('blog_public',0);
`;
const endpoint = `<?php
require __DIR__.'/wp-load.php';
if(!current_user_can('manage_options')){status_header(403);exit;}
$registry=WP_Block_Type_Registry::get_instance()->get_all_registered();
$names=array_values(array_filter(array_keys($registry),static function($name){return strpos($name,'cni-blocks/')===0;}));sort($names);
$id=get_option('cni_review_post_id');$post=get_post($id);
$state=array('version'=>get_bloginfo('version'),'blocks'=>$names,'option'=>get_option('cni_blocks_block_management',null),'postId'=>$id,'content'=>$post->post_content,'meta'=>get_post_meta($id,'cni_review_marker',true),'color'=>get_option('cni_blocks_background_design_theme_color',null),'html'=>do_blocks($post->post_content));
wp_send_json($state);
`;
let server, browser;
(async () => {
  console.log('Booting disposable WordPress 6.8.3 / PHP 8.3 with a copy of the plugin...');
  server = await runCLI({
    command: 'server', wp: '6.8.3', php: '8.3', port: 9628, workers: 1, verbosity: 'quiet',
    mount: [{ hostPath: pluginCopy, vfsPath: '/wordpress/wp-content/plugins/cni_blocks' }],
    blueprint: { steps: [
      { step: 'defineWpConfigConsts', consts: { WP_DEBUG: true, WP_DEBUG_LOG: true, WP_DEBUG_DISPLAY: true } },
      { step: 'activatePlugin', pluginPath: 'cni_blocks/cni_blocks.php' },
      { step: 'runPHP', code: setup }
    ] }
  });
  await server.playground.writeFile('/wordpress/cni-review-state.php', endpoint);
  await server.playground.writeFile('/wordpress/cni-review-nonce.php', `<?php require __DIR__.'/wp-load.php'; if(!is_user_logged_in()){status_header(403);exit;} wp_send_json(array('nonce'=>wp_create_nonce('cni_blocks_block_management-options'),'canManage'=>current_user_can('manage_options')));`);
  await server.playground.writeFile('/wordpress/cni-review.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#173e68"/></svg>');
  console.log('WordPress booted; checking actual HTTP login, options.php and DB persistence.');
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: server.serverUrl });
  const page = await context.newPage();
  const login = async (ctx, user) => {
    await ctx.request.get('/wp-login.php');
    await ctx.request.post('/wp-login.php', { form: { log: user, pwd: pass, 'wp-submit': 'Log In', redirect_to: server.serverUrl + '/wp-admin/', testcookie: '1' } });
  };
  await login(context, 'admin');
  const state = async () => {
    const response = await context.request.get('/cni-review-state.php');
    assert.equal(response.status(), 200);
    const text = await response.text();
    assert(!text.includes('Warning:') && !text.includes('Notice:'), text.slice(0, 500));
    return JSON.parse(text);
  };
  const initial = await state();
  assert.equal(initial.blocks.length, 27);
  const checkEditor = async (enabled, count) => {
    await page.goto('/wp-admin/post.php?post=' + initial.postId + '&action=edit', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.wp?.data?.select('core/block-editor')?.getBlocks?.().length > 0);
    const result = await page.evaluate(() => {
      const blocks = wp.data.select('core/block-editor').getBlocks();
      return { registered: wp.blocks.getBlockTypes().filter(block => block.name.startsWith('cni-blocks/')).length, comic: blocks.some(block => block.name === 'cni-blocks/page-flip'), missing: blocks.some(block => block.name === 'core/missing'), invalid: blocks.some(block => block.isValid === false) };
    });
    assert.equal(result.registered, count, 'Client block registrations match availability');
    assert.equal(result.comic, enabled, 'Saved comic block is recognized after enabling');
    assert.equal(result.missing, !enabled, 'Disabled block remains a missing block without saving');
    if (enabled) assert.equal(result.invalid, false, 'Restored block validates');
    assert.equal((await state()).content, initial.content, 'Opening editor without saving keeps stored source');
  };
  await checkEditor(true, 27);
  const settingsUrl = '/wp-admin/options-general.php?page=cni-blocks';
  const checkPage = async () => {
    const response = await page.goto(settingsUrl);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('#cni-blocks-management [data-cni-blocks-unit]').count(), 23);
    assert.equal(await page.locator('input[name="cni_blocks_background_design_theme_color"]').count(), 1);
    assert(!/Warning:|Fatal error:|Notice:/.test(await page.locator('body').innerText()));
  };
  const submit = async () => {
    await Promise.all([page.waitForURL(/settings-updated=true/), page.locator('#cni-blocks-management button[type="submit"],#cni-blocks-management input[type="submit"]').click()]);
    assert(!/Warning:|Fatal error:|Notice:/.test(await page.locator('body').innerText()));
  };
  await checkPage();
  await page.locator('input[value="cni-blocks/page-flip"]').uncheck();
  await submit();
  const comicOff = await state();
  assert.equal(comicOff.blocks.length, 26);
  assert(!comicOff.blocks.includes('cni-blocks/page-flip'));
  assert(!comicOff.html.includes('cni-page-flip__stage'));
  assert.equal(comicOff.content, initial.content);
  assert.deepEqual(comicOff.meta, initial.meta);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-cni-blocks-all="off"]').click();
  await submit();
  const allOff = await state();
  assert.deepEqual(allOff.blocks, []);
  assert.equal(allOff.content, initial.content);
  assert.deepEqual(allOff.meta, initial.meta);
  await checkEditor(false, 0);
  await checkPage();
  assert.equal(await page.locator('#cni-blocks-management input:checked').count(), 0);
  const dashboard = await context.request.get('/wp-admin/');
  assert.equal(dashboard.status(), 200, 'Dashboard remains usable with all blocks OFF');
  // Saving the unrelated colour form must not change block availability.
  await page.locator('input[name="cni_blocks_background_design_theme_color"]').fill('#123456');
  await Promise.all([page.waitForURL(/settings-updated=true/), page.locator('form').filter({ has: page.locator('input[name="cni_blocks_background_design_theme_color"]') }).locator('input[type="submit"],button[type="submit"]').click()]);
  assert.deepEqual((await state()).blocks, []);
  assert.equal((await state()).color, '#123456');
  // Real options.php rejects missing, tampered and cross-group nonces.
  const nonce = await page.locator('#cni-blocks-management input[name="_wpnonce"]').inputValue();
  const otherNonce = await page.locator('form').filter({ has: page.locator('input[name="cni_blocks_background_design_theme_color"]') }).locator('input[name="_wpnonce"]').inputValue();
  const onPayload = { option_page: 'cni_blocks_block_management', action: 'update', 'cni_blocks_block_management[form]': '1', 'cni_blocks_block_management[enabled][]': 'cni-blocks/outer' };
  for (const bad of [undefined, 'invalid-nonce', otherNonce]) {
    const response = await context.request.post('/wp-admin/options.php', { form: { ...onPayload, ...(bad ? { _wpnonce: bad } : {}) }, maxRedirects: 0 });
    assert.equal(response.status(), 403, 'Invalid nonce rejected');
    assert.deepEqual((await state()).blocks, [], 'Rejected save leaves DB unchanged');
  }
  const editorContext = await browser.newContext({ baseURL: server.serverUrl });
  await login(editorContext, 'cni-review-editor');
  assert.equal((await editorContext.request.get(settingsUrl)).status(), 403, 'Editor cannot open settings');
  const editorNonce = await (await editorContext.request.get('/cni-review-nonce.php')).json();
  assert.equal(editorNonce.canManage, false);
  assert.equal((await editorContext.request.post('/wp-admin/options.php', { form: { ...onPayload, _wpnonce: editorNonce.nonce }, maxRedirects: 0 })).status(), 403, 'Editor cannot save even with a valid nonce for their own session');
  assert.deepEqual((await state()).blocks, []);
  await editorContext.close();
  const guestContext = await browser.newContext({ baseURL: server.serverUrl });
  const guestSave = await guestContext.request.post('/wp-admin/options.php', { form: { ...onPayload, _wpnonce: nonce }, maxRedirects: 0 });
  assert.equal(guestSave.status(), 302, 'Unauthenticated save is redirected to login');
  assert(guestSave.headers().location.includes('wp-login.php'));
  assert.deepEqual((await state()).blocks, []);
  await guestContext.close();
  await page.locator('[data-cni-blocks-all="on"]').click();
  await submit();
  const restored = await state();
  assert.deepEqual(restored.blocks, initial.blocks);
  assert.equal(restored.content, initial.content);
  assert.deepEqual(restored.meta, initial.meta);
  assert.equal(restored.html, initial.html, 'Same saved content renders identically after restore');
  assert.equal(restored.color, '#123456', 'Block setting save preserves unrelated colour');
  await checkEditor(true, 27);
  await checkPage();
  await page.screenshot({ path: path.join(os.tmpdir(), 'cni-management-wordpress-settings.png'), fullPage: true });
  console.log(JSON.stringify({ wordpress: restored.version, allOnBlocks: initial.blocks.length, comicOffBlocks: comicOff.blocks.length, allOffBlocks: allOff.blocks.length, restoredBlocks: restored.blocks.length, unchangedContentAndMeta: true, invalidNonceHttp: 403, unauthorizedHttp: 403, independentColourSave: true }));
  console.log('Passed actual WordPress HTTP/DB: login, both forms, all OFF admin, save/reload, nonce rejection, capability rejection, OFF to ON, Gutenberg client registration/recovery and identical stored content/meta/render.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await server[Symbol.asyncDispose]();
  // All artifacts are in a fresh, verified child of OS temp, never the workspace.
  const absolute = path.resolve(scratch);
  assert(absolute.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(absolute).startsWith('cni-block-management-wp-'));
  fs.rmSync(absolute, { recursive: true, force: true });
});
