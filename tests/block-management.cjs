const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync, execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const optionName = 'cni_blocks_block_management';
function request(data = {}) {
  const result = spawnSync('php', [path.join(__dirname, 'block-management-worker.php'), Buffer.from(JSON.stringify(data)).toString('base64')], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
  return JSON.parse(result.stdout);
}
const offOption = disabled => ({ [optionName]: { version: 1, disabled } });
const keys = value => Object.keys(value);
const all = request({ render: true, html: true });
const names = keys(all.blocks);
assert.equal(names.length, 27);
assert.deepEqual(keys(all.catalog).sort(), names.toSorted(), 'Every registered type appears in management, including internal/legacy types');
assert.equal(all.units.length, 23);
const snapshot = path.join(os.tmpdir(), 'cni-blocks-before-management.php');
if (fs.existsSync(snapshot)) {
  const before = request({ baseline: snapshot, render: true });
  for (const key of ['blocks', 'scripts', 'styles', 'localized', 'routes', 'rendered']) assert.deepEqual(all[key], before[key], 'All-ON matches pre-change implementation: ' + key);
  console.log('All-ON registration, metadata, attributes, render callbacks, assets, localization, routes and sample public render match pre-change source.');
}
function requiredAssets(blocks) {
  const scripts = new Set(), styles = new Set();
  function add(handle, type) {
    const records = type === 'scripts' ? all.scripts : all.styles;
    const set = type === 'scripts' ? scripts : styles;
    if (!records[handle] || set.has(handle)) return;
    set.add(handle);
    for (const dep of records[handle].deps) add(dep, type);
  }
  for (const block of Object.values(blocks)) {
    for (const key of ['editor_script', 'script', 'view_script']) if (block.args[key]) add(block.args[key], 'scripts');
    for (const key of ['style', 'editor_style']) if (block.args[key]) add(block.args[key], 'styles');
  }
  return { scripts: [...scripts].sort(), styles: [...styles].sort() };
}
const renderTypes = ['post-list', 'selected-post-list', 'breadcrumb', 'custom-field', 'visual-embed', 'circle-image-plus', 'image-hotspot-plus', 'image-text-layer', 'page-flip'];
for (const name of names) {
  const off = request({ options: offOption([name]) });
  const unit = all.units.find(unit => unit.includes(name));
  const expected = Object.fromEntries(Object.entries(all.blocks).filter(([key]) => !unit.includes(key)));
  assert.deepEqual(off.blocks, expected, 'Only dependent unit is unregistered: ' + name);
  const required = requiredAssets(expected);
  assert.deepEqual(keys(off.scripts).sort(), required.scripts, 'Only required scripts registered: ' + name);
  assert.deepEqual(keys(off.styles).sort(), required.styles, 'Only required styles registered: ' + name);
  for (const type of renderTypes) {
    assert.equal(off.functions[type.replaceAll('-', '_')], !unit.includes('cni-blocks/' + type), 'Dedicated PHP unloaded: ' + name + ' / ' + type);
    if (unit.includes('cni-blocks/' + type)) assert(!off.includes.some(file => file.replaceAll('\\', '/').endsWith('/blocks/' + type + '/render.php')));
  }
  assert.equal(off.outerPreloadHook, !unit.includes('cni-blocks/outer'));
  assert.equal(off.headingPhp, !unit.includes('cni-blocks/heading-plus'));
  assert.equal(off.termQueries, unit.includes('cni-blocks/post-list') ? 0 : all.termQueries, 'OFF Post List stops taxonomy preparation');
  if (name === 'cni-blocks/post-list') assert.equal(off.sharedPostBadge, all.sharedPostBadge, 'Selected Post List retains shared taxonomy helpers');
  assert(off.optionsUnchanged, 'Registration must not write existing options');
  assert.deepEqual(off.earlyTranslations, [], 'OFF lookup must not trigger translations before init: ' + name);
}
for (const enabled of [['cni-blocks/selected-post-list'], ['cni-blocks/image-text-layer'], ['cni-blocks/outer', 'cni-blocks/slide-gallery'], ['cni-blocks/auto-grid', 'cni-blocks/tabs']]) {
  const disabled = names.filter(name => !all.units.some(unit => unit.includes(name) && unit.some(member => enabled.includes(member))));
  const mixed = request({ options: offOption(disabled) });
  const expected = Object.fromEntries(Object.entries(all.blocks).filter(([name]) => !disabled.includes(name)));
  assert.deepEqual(mixed.blocks, expected, 'Mixed configurations preserve enabled blocks');
  const required = requiredAssets(expected);
  assert.deepEqual(keys(mixed.scripts).sort(), required.scripts);
  assert.deepEqual(keys(mixed.styles).sort(), required.styles);
}
for (const unit of all.units) {
  const one = request({ options: offOption(names.filter(name => !unit.includes(name))) });
  const expected = Object.fromEntries(Object.entries(all.blocks).filter(([name]) => unit.includes(name)));
  assert.deepEqual(one.blocks, expected, 'Each functional unit can run alone: ' + unit.join(', '));
  const required = requiredAssets(expected);
  assert.deepEqual(keys(one.scripts).sort(), required.scripts);
  assert.deepEqual(keys(one.styles).sort(), required.styles);
  if (unit.length > 1) {
    for (const member of unit) {
      assert.deepEqual(request({ options: offOption([member]) }).disabled, [...unit].sort(), 'Raw parent-only or child-only OFF normalizes consistently');
    }
    const selected = request({ sanitize: { form: '1', enabled: [unit[0]] } }).sanitized;
    assert.deepEqual(request({ options: { [optionName]: selected } }).blocks, expected, 'Saving one parent checkbox enables its full unit');
  }
}
const none = request({ options: offOption(names), html: true, render: true });
assert(none.menus['cni-blocks'], 'All OFF retains the management menu');
assert(none.settingsNames.includes(optionName) && none.settingsNames.includes('cni_blocks_background_design_theme_color'), 'All OFF retains both Settings API groups');
assert(none.html.includes('id="cni-blocks-management"') && none.html.includes('name="cni_blocks_background_design_theme_color"'), 'All OFF renders both settings forms');
for (const key of ['blocks', 'scripts', 'styles', 'localized', 'routes']) assert.equal(keys(none[key]).length, 0, 'All OFF: ' + key);
assert(Object.values(none.functions).every(value => !value));
assert.equal(none.headingPhp, false);
assert.equal(none.sharedPostBadge, null);
assert.equal(none.outerPreloadHook, false);
assert.equal(none.rendered, null);
assert.equal(none.storedContent, all.storedContent, 'OFF never mutates saved block source');
const onAgain = request({ options: offOption([]), render: true });
assert.deepEqual(onAgain.blocks, all.blocks, 'OFF to ON restores every registration');
assert.equal(onAgain.rendered, all.rendered, 'Saved sample dynamic block renders identically after re-enable');
assert.equal(onAgain.storedContent, all.storedContent);
assert(onAgain.optionsUnchanged);
for (const value of [null, false, 'broken', [], {}, { version: 2, disabled: names }, { version: '1', disabled: names }, { version: 1, disabled: 'all' }, { version: 1, disabled: [7, names[0]] }, { version: 1, disabled: { all: names[0] } }]) {
  const invalid = request({ options: { [optionName]: value } });
  assert.deepEqual(invalid.blocks, all.blocks, 'Malformed settings fail open: ' + JSON.stringify(value));
}
assert.deepEqual(request({ options: offOption(['cni-blocks/future-block', '<script>']) }).blocks, all.blocks, 'Unknown names are ignored and new blocks default ON');
const enabledForm = { form: '1', enabled: names };
const offForm = { form: '1' };
assert.deepEqual(request({ sanitize: enabledForm }).sanitized, { version: 1, disabled: [] });
assert.deepEqual(request({ sanitize: offForm }).sanitized.disabled, names.toSorted());
assert.deepEqual(request({ sanitize: { form: '1', enabled: 'invalid' } }).sanitized.disabled, []);
assert.deepEqual(request({ sanitize: { form: '1', enabled: null } }).sanitized.disabled, [], 'Explicit null input is invalid, not an all-OFF request');
assert.deepEqual(request({ sanitize: { form: '1', enabled: ['<script>'] } }).sanitized.disabled, []);
const pageOff = request({ sanitize: { form: '1', enabled: names.filter(name => name !== 'cni-blocks/page-flip') } }).sanitized;
assert.deepEqual(pageOff.disabled, ['cni-blocks/page-flip']);
assert.deepEqual(request({ sanitize: pageOff }).sanitized, pageOff, 'Settings API sanitizer is idempotent');
const savedOff = request({ options: { [optionName]: pageOff }, html: true });
assert(!savedOff.blocks['cni-blocks/page-flip']);
assert.deepEqual(request({ options: { [optionName]: request({ sanitize: enabledForm }).sanitized } }).blocks, all.blocks, 'Save and next-request reload restore ON');
assert.equal(request({ admin: false, html: true }).html, '', 'Unauthorized user cannot render settings');
assert.equal(all.setting.group, 'cni_blocks_block_management');
assert.equal(all.setting.args.show_in_rest, false);
assert.equal(all.menus['cni-blocks'][1], 'manage_options');
assert(all.html.includes('name="_wpnonce"') && all.html.includes('name="option_page" value="cni_blocks_block_management"'), 'Management form uses Settings API nonce/group');
assert(all.html.includes('name="cni_blocks_background_design_theme_color"'), 'Existing colour form is retained');
assert(all.html.includes('OFF中に対象ブロックを含むページを編集・保存した場合'));

// Evaluate the actual shared editor source. Dedicated editors do not load when OFF.
function galleryEditor(disabled) {
  const registered = [];
  const context = { window: { cniBlocksDisabledBlocks: disabled, wp: { blocks: { registerBlockType: name => registered.push(name) }, element: {}, blockEditor: {}, components: {}, i18n: { __: text => text } } } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'index.js'), 'utf8'), context);
  return registered;
}
assert.deepEqual(galleryEditor(undefined), ['cni-blocks/slide-gallery', 'cni-blocks/tile-gallery']);
assert.deepEqual(galleryEditor(['cni-blocks/slide-gallery']), ['cni-blocks/tile-gallery']);
assert.deepEqual(galleryEditor(['cni-blocks/tile-gallery']), ['cni-blocks/slide-gallery']);
assert.deepEqual(galleryEditor(['cni-blocks/slide-gallery', 'cni-blocks/tile-gallery']), []);
function gallerySettings(source) {
  const result = {};
  const context = { window: { wp: { blocks: { registerBlockType: (name, settings) => { result[name] = settings; } }, element: {}, blockEditor: {}, components: {}, i18n: { __: text => text } } } };
  vm.createContext(context); vm.runInContext(source, context); return result;
}
const oldGallery = gallerySettings(execFileSync('git', ['show', 'HEAD:index.js'], { cwd: root, encoding: 'utf8' }));
const newGallery = gallerySettings(fs.readFileSync(path.join(root, 'index.js'), 'utf8'));
for (const name of keys(oldGallery)) {
  assert.equal(String(newGallery[name].save), String(oldGallery[name].save), 'Shared gallery save function unchanged');
  assert.equal(JSON.stringify(newGallery[name].attributes), JSON.stringify(oldGallery[name].attributes), 'Shared gallery attributes unchanged');
}
const assetBytes = assets => Object.values(assets).reduce((sum, asset) => sum + fs.statSync(path.join(root, new URL(asset.src).pathname.split('/cni_blocks/')[1])).size, 0);
const fullBytes = assetBytes(all.scripts) + assetBytes(all.styles);
const comicOff = request({ options: offOption(['cni-blocks/page-flip']) });
console.log(JSON.stringify({ allOn: { scripts: keys(all.scripts).length, styles: keys(all.styles).length, bytes: fullBytes }, comicOff: { scripts: keys(comicOff.scripts).length, styles: keys(comicOff.styles).length, removedBytes: fullBytes - assetBytes(comicOff.scripts) - assetBytes(comicOff.styles) }, allOff: { scripts: keys(none.scripts).length, styles: keys(none.styles).length, removedBytes: fullBytes } }));

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const render = async html => { await page.setContent('<style>body{font:14px sans-serif;margin:24px;color:#1d2327}.widefat{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}tbody tr:nth-child(odd){background:#f6f7f7}small{font-weight:normal}.notice{background:#fff8e5;padding:12px}button{padding:6px 10px}hr{margin-top:24px}</style>' + html); await page.addScriptTag({ path: path.join(root, 'assets/admin/block-management.js') }); };
    await render(all.html);
    const toggles = page.locator('#cni-blocks-management [data-cni-blocks-unit]');
    assert.equal(await toggles.count(), 23);
    assert.equal(await toggles.evaluateAll(inputs => inputs.filter(input => input.checked).length), 23);
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('[data-cni-blocks-all="off"]').click();
    assert.equal(await toggles.evaluateAll(inputs => inputs.filter(input => input.checked).length), 23, 'Cancel all OFF leaves values intact');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-cni-blocks-all="off"]').click();
    assert.equal(await toggles.evaluateAll(inputs => inputs.filter(input => input.checked).length), 0);
    assert((await page.locator('[data-cni-blocks-summary]').innerText()).includes('OFF 27'));
    const emptyForm = await page.locator('#cni-blocks-management').evaluate(form => ({ form: '1', enabled: new FormData(form).getAll('cni_blocks_block_management[enabled][]') }));
    assert.deepEqual(request({ sanitize: emptyForm }).sanitized.disabled, names.toSorted(), 'Browser all-OFF submits an empty enabled list');
    await page.locator('[data-cni-blocks-all="on"]').click();
    assert.equal(await toggles.evaluateAll(inputs => inputs.filter(input => input.checked).length), 23);
    const comic = page.locator('input[value="cni-blocks/page-flip"]');
    await comic.focus(); await page.keyboard.press('Space');
    assert.equal(await comic.isChecked(), false, 'Keyboard toggling works');
    assert.equal(await comic.evaluate(input => input.closest('tr').querySelector('[data-cni-blocks-state]').textContent), 'OFF');
    const submitted = await page.locator('#cni-blocks-management').evaluate(form => Object.fromEntries([['form', '1'], ['enabled', new FormData(form).getAll('cni_blocks_block_management[enabled][]')]]));
    assert.deepEqual(request({ sanitize: submitted }).sanitized.disabled, ['cni-blocks/page-flip'], 'Actual browser form serializes correct OFF set, including grouped children');
    await page.screenshot({ path: path.join(os.tmpdir(), 'cni-block-management-admin.png'), fullPage: true });
    await render(savedOff.html);
    assert.equal(await page.locator('input[value="cni-blocks/page-flip"]').isChecked(), false, 'Saved status reappears on reload');
    await page.setViewportSize({ width: 390, height: 800 });
    assert(await page.locator('input[value="cni-blocks/outer"]').isVisible());
    await page.screenshot({ path: path.join(os.tmpdir(), 'cni-block-management-mobile.png'), fullPage: true });
    const gridToggle = page.locator('input[value="cni-blocks/auto-grid"]');
    await gridToggle.uncheck();
    const groupedForm = await page.locator('#cni-blocks-management').evaluate(form => ({ form: '1', enabled: new FormData(form).getAll('cni_blocks_block_management[enabled][]') }));
    assert.deepEqual(request({ sanitize: groupedForm }).sanitized.disabled, ['cni-blocks/auto-grid', 'cni-blocks/grid-card', 'cni-blocks/page-flip'], 'One parent toggle controls the dependent child');
    await render(none.html);
    assert.equal(await page.locator('#cni-blocks-management input:checked').count(), 0, 'All-OFF page remains usable');
    await page.locator('[data-cni-blocks-all="on"]').click();
    const restoreForm = await page.locator('#cni-blocks-management').evaluate(form => ({ form: '1', enabled: new FormData(form).getAll('cni_blocks_block_management[enabled][]') }));
    const restoreOption = request({ sanitize: restoreForm }).sanitized;
    assert.deepEqual(request({ options: { [optionName]: restoreOption } }).blocks, all.blocks, 'All-OFF UI can restore every block');
    // Shared front-end code must not initialize disabled blocks left in old HTML.
    for (const disabled of [['cni-blocks/slide-gallery'], ['cni-blocks/tile-gallery']]) {
      await page.setContent('<div class="wp-block-cni-blocks-slide-gallery"></div>');
      await page.evaluate(disabled => { window.cniBlocksDisabledBlocks = disabled; window.blockQueries = []; const original = document.querySelectorAll.bind(document); document.querySelectorAll = selector => { window.blockQueries.push(selector); return original(selector); }; }, disabled);
      await page.addScriptTag({ path: path.join(root, 'view.js') });
      const queries = await page.evaluate(() => window.blockQueries);
      if (disabled.includes('cni-blocks/slide-gallery')) assert(!queries.some(selector => selector.includes('slide-gallery')), 'OFF slide gallery is not initialized through shared viewer');
    }
    for (const disabled of [['cni-blocks/heading-plus'], ['cni-blocks/image-text-layer']]) {
      await page.setContent('<div></div>');
      await page.evaluate(disabled => { window.cniBlocksDisabledBlocks = disabled; window.blockQueries = []; const original = document.querySelectorAll.bind(document); document.querySelectorAll = selector => { window.blockQueries.push(selector); return original(selector); }; }, disabled);
      await page.addScriptTag({ path: path.join(root, 'blocks/heading-plus/view.js') });
      const queries = await page.evaluate(() => window.blockQueries);
      assert(!queries.some(selector => selector.includes(disabled[0].endsWith('heading-plus') ? 'wp-block-cni-blocks-heading-plus' : 'cni-image-text-layer')), 'Shared text code skips disabled consumer');
    }
  } finally { await browser.close(); }
  console.log('Passed: 27 individual OFF cases, parent/child units, exact asset dependency closure, dedicated PHP/hooks/routes, all OFF/ON, corrupt inputs, unchanged stored content/options, recovery render, gallery editor guards, shared front-end guards, admin bulk confirmation/status/form/keyboard/reload/mobile.');
})().catch(error => { console.error(error); process.exitCode = 1; });
