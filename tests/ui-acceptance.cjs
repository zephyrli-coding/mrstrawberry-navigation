/* Run against the isolated local Navigation Compose project only.
 * NODE_PATH=<bundled node_modules> NAV_UI_CREDENTIALS=/private/tmp/navigation-ui-credentials.json node tests/ui-acceptance.cjs
 * The two supplied accounts must be dedicated acceptance accounts. Their Navigation data is replaced.
 */
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
let privateValues = []
function redact(error) {
  let message = String(error).replace(
    /([?&](?:code|state|token)=)[^&\s]+/g,
    '$1[redacted]',
  )
  for (const value of privateValues)
    if (value) message = message.split(value).join('[redacted]')
  return message
}

const baseline = {
  version: '1.0',
  app: 'mrstrawberry-navigation',
  data: {
    categories: [
      {
        name: '工作工具',
        sort_order: 0,
        bookmarks: [
          {
            title: 'GitHub',
            url: 'https://github.com',
            description: '代码托管、开源项目与团队协作',
            sort_order: 0,
          },
          {
            title: 'MDN Web Docs',
            url: 'https://developer.mozilla.org',
            description: 'Web 开发文档与浏览器参考',
            sort_order: 1,
          },
          {
            title: 'TypeScript',
            url: 'https://www.typescriptlang.org',
            description: '类型系统、语言指南与工具',
            sort_order: 2,
          },
        ],
      },
      {
        name: '投资研究',
        sort_order: 1,
        bookmarks: [
          {
            title: 'OpenBB',
            url: 'https://openbb.co',
            description: '投资研究工具与数据资料',
            sort_order: 0,
          },
          {
            title:
              '很长的书签标题用于检查桌面与手机布局：每周研究资料、市场观察、资产配置和复盘记录',
            url: 'https://example.com/research',
            description:
              '较长的中文描述和连续字符串 LongUnbrokenDescriptionForResponsiveLayoutTesting1234567890，让搜索、列表和卡片都保持清晰。',
            sort_order: 1,
          },
        ],
      },
      {
        name: '链上世界',
        sort_order: 2,
        bookmarks: [
          {
            title: 'Etherscan',
            url: 'https://etherscan.io',
            description: '以太坊区块浏览器',
            sort_order: 0,
          },
          {
            title: 'Ethereum',
            url: 'https://ethereum.org',
            description: '以太坊学习资料',
            sort_order: 1,
          },
        ],
      },
      ...[
        '设计灵感',
        '日常阅读',
        '学习计划',
        '开发资源',
        '新闻资讯',
        '效率工具',
        '长期项目',
        '待整理资料',
        '旅行计划',
        '很长的分类名称用于验证侧栏文字溢出处理与提示',
        '公开数据',
        '个人文档',
        '周末阅读',
      ].map((name, i) => ({ name, sort_order: i + 3, bookmarks: [] })),
    ],
  },
}

async function run({ browser, ctx, page, credentials, base, outputDir }) {
  assert.equal(
    base,
    'http://localhost:20261',
    'Only the isolated local entry is supported',
  )
  privateValues = credentials.users.flatMap((user) => [
    user.email,
    user.password,
  ])
  page.setDefaultTimeout(12000)
  fs.mkdirSync(outputDir, { recursive: true })
  const checks = [],
    runtimeErrors = []
  page.on('pageerror', (e) => runtimeErrors.push(e.message))
  const test = async (name, fn) => {
    try {
      await fn()
    } catch (error) {
      throw new Error(redact(error))
    }
    checks.push(name)
    console.log(`PASS ${name}`)
  }
  const closed = () => page.locator('dialog[open]').waitFor({ state: 'hidden' })
  const ready = async () => {
    await page.locator('.workspace').waitFor()
    await page.locator('.loading-state').waitFor({ state: 'hidden' })
  }
  const shot = async (name) =>
    page.screenshot({
      path: path.join(outputDir, `${name}.png`),
      fullPage: !name.includes('mobile'),
      mask: [
        page.locator('.account-name'),
        page.locator('.dropdown p'),
        ...credentials.users.map((u) =>
          page.locator('dd').filter({ hasText: u.email }),
        ),
      ],
      maskColor: '#e9ecf1',
    })
  const navigate = async (suffix) => {
    await page.goto(base + suffix)
    await ready()
  }
  const upload = async (content, replace = false) => {
    await navigate('/profile')
    await page.getByLabel(replace ? /^替换模式/ : /^合并模式/).check()
    await page.locator('input[type=file]').setInputFiles({
      name: 'navigation-ui-fixture.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(content)),
    })
    await page.getByRole('heading', { name: '确认导入备份' }).waitFor()
  }
  const add = async (
    title,
    category = '工作工具',
    url = 'https://example.com/ui-created',
  ) => {
    await page
      .getByRole('button', { name: '添加书签', exact: true })
      .first()
      .click()
    await page.getByLabel('标题', { exact: true }).fill(title)
    await page.getByLabel('网址', { exact: true }).fill(url)
    await page
      .getByLabel('描述（可选）', { exact: true })
      .fill('浏览器验收专用非敏感书签')
    await page
      .getByLabel('分类', { exact: true })
      .selectOption({ label: category })
    await page.getByRole('button', { name: '添加', exact: true }).click()
    await closed()
  }
  const card = (title) =>
    page
      .locator('.bookmark-card')
      .filter({ has: page.getByRole('link', { name: title, exact: true }) })
  const count = async (expected) => {
    await page.waitForFunction(
      (n) => document.querySelectorAll('.bookmark-card').length === n,
      expected,
    )
  }
  const api = async (p, resource) => {
    const response = await p.request.get(base + '/api/' + resource)
    assert.equal(response.status(), 200)
    return response.json()
  }
  const login = async (p, user) => {
    await p.goto(base + '/login')
    await p.getByRole('button', { name: /前往统一登录|重新登录/ }).click()
    await p.waitForURL((u) => u.port === '20263')
    await p.locator('input[name=email]').fill(user.email)
    await p.locator('input[name=password]').fill(user.password)
    await p.getByRole('button', { name: '登录', exact: true }).click()
    await p.waitForURL((u) => u.port === '20261' && u.pathname === '/')
    await p.locator('.search-field').waitFor()
  }
  await test('real OAuth login; unverified active user permitted', async () => {
    assert.equal((await page.request.get(base + '/api/auth/me')).status(), 200)
  })
  await test('replace import preview, cancel, confirmation and persistence', async () => {
    const previous = (await api(page, 'bookmarks')).length
    await upload(baseline, true)
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await closed()
    assert.equal((await api(page, 'bookmarks')).length, previous)
    await upload(baseline, true)
    await page.getByRole('button', { name: '确认替换并导入' }).click()
    await closed()
    await page.getByText('导入完成：', { exact: false }).waitFor()
    await navigate('/')
    await count(7)
    assert.equal((await api(page, 'categories')).length, 16)
  })
  await test('category create, duplicate validation and rename', async () => {
    await page.getByRole('button', { name: '新建分类', exact: true }).click()
    await page.getByLabel('分类名称', { exact: true }).fill('验收临时分类')
    await page.getByRole('button', { name: '创建', exact: true }).click()
    await closed()
    await page.getByRole('button', { name: '新建分类', exact: true }).click()
    await page.getByLabel('分类名称', { exact: true }).fill('工作工具')
    await page.getByRole('button', { name: '创建', exact: true }).click()
    await page
      .getByRole('alert')
      .filter({ hasText: '分类名称已存在' })
      .waitFor()
    await page.keyboard.press('Escape')
    await closed()
    await page
      .getByRole('button', { name: '编辑分类 验收临时分类', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    await page.getByLabel('分类名称', { exact: true }).fill('验收归档')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await closed()
    await page.reload()
    await page.getByRole('button', { name: '验收归档', exact: true }).waitFor()
  })
  await test('bookmark validation, failed save retains draft and retry', async () => {
    await page
      .getByRole('button', { name: '添加书签', exact: true })
      .first()
      .click()
    await page.getByLabel('标题', { exact: true }).fill('验收书签')
    await page.getByLabel('网址', { exact: true }).fill('javascript:alert(1)')
    await page.getByRole('button', { name: '添加', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: 'http 或 https' }).waitFor()
    await page
      .getByLabel('网址', { exact: true })
      .fill('https://example.com/ui-created')
    await page
      .getByLabel('分类', { exact: true })
      .selectOption({ label: '验收归档' })
    const failure = (route) =>
      route.request().method() === 'POST'
        ? route.abort('failed')
        : route.continue()
    await page.route('**/api/bookmarks', failure)
    await page.getByRole('button', { name: '添加', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: '书签保存失败' }).waitFor()
    assert.equal(
      await page.getByLabel('标题', { exact: true }).inputValue(),
      '验收书签',
    )
    await page.unroute('**/api/bookmarks', failure)
    await page.getByRole('button', { name: '添加', exact: true }).click()
    await closed()
    await page.reload()
    await card('验收书签').waitFor()
  })
  await test('bookmark edit and category deletion retain bookmark after reload', async () => {
    await page
      .getByRole('button', { name: '编辑书签 验收书签', exact: true })
      .click()
    await page.getByLabel('标题', { exact: true }).fill('验收已编辑')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await closed()
    await page
      .getByRole('button', { name: '删除分类 验收归档', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: '确认删除', exact: true }).click()
    await closed()
    await page.reload()
    await card('验收已编辑').waitFor()
    assert.equal(
      (await api(page, 'bookmarks')).find((x) => x.title === '验收已编辑')
        .category_id,
      null,
    )
  })
  await test('bookmark deletion cancel, failure and retry', async () => {
    await page
      .getByRole('button', { name: '删除书签 验收已编辑', exact: true })
      .click()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await closed()
    await card('验收已编辑').waitFor()
    await page
      .getByRole('button', { name: '删除书签 验收已编辑', exact: true })
      .click()
    const failure = (route) =>
      route.request().method() === 'DELETE'
        ? route.abort('failed')
        : route.continue()
    await page.route('**/api/bookmarks/*', failure)
    await page.getByRole('button', { name: '确认删除', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: '删除失败' }).waitFor()
    await page.unroute('**/api/bookmarks/*', failure)
    await page.getByRole('button', { name: '确认删除', exact: true }).click()
    await closed()
    await count(7)
    await page.reload()
    await count(7)
  })
  await test('search, empty results, clear and keyboard shortcut', async () => {
    await page.getByRole('searchbox', { name: '搜索书签' }).fill('github')
    await count(1)
    await page.getByRole('searchbox', { name: '搜索书签' }).fill('没有这个结果')
    await page.getByRole('heading', { name: '没有找到匹配的书签' }).waitFor()
    await page
      .getByRole('button', { name: '清除搜索', exact: true })
      .first()
      .click()
    await count(7)
    await page.keyboard.press('Control+k')
    assert.equal(
      await page
        .getByRole('searchbox', { name: '搜索书签' })
        .evaluate((el) => el === document.activeElement),
      true,
    )
    await page.getByRole('searchbox', { name: '搜索书签' }).fill('投资研究')
    await count(2)
    await page.getByRole('button', { name: '清除搜索', exact: true }).click()
  })
  await test('category filtering and deep-link reload', async () => {
    await page.getByRole('button', { name: '工作工具', exact: true }).click()
    await count(3)
    await page.reload()
    await count(3)
    assert.match(new URL(page.url()).search, /category=/)
    await page.getByRole('link', { name: /全部书签/ }).click()
    await count(7)
  })
  await test('keyboard bookmark order persisted through real batch API', async () => {
    await page
      .getByRole('button', { name: '上移书签 MDN Web Docs', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    await page
      .locator('.notice')
      .filter({ hasText: '书签顺序已保存' })
      .waitFor()
    await page.reload()
    await count(7)
    assert.equal(
      await page
        .locator('.group')
        .first()
        .locator('.card-title')
        .first()
        .innerText(),
      'MDN Web Docs',
    )
  })
  await test('bookmark drag order persisted', async () => {
    const source = page.getByRole('button', {
      name: '拖动书签 MDN Web Docs',
      exact: true,
    })
    const target = page.getByRole('button', {
      name: '拖动书签 TypeScript',
      exact: true,
    })
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith('/bookmarks/sort/batch') &&
        r.request().method() === 'POST',
    )
    await source.dragTo(target)
    assert.equal((await response).status(), 200)
    await ready()
    await page.reload()
    await count(7)
    const titles = await page
      .locator('.group')
      .first()
      .locator('.card-title')
      .allTextContents()
    assert.notEqual(titles[0], 'MDN Web Docs')
  })
  await test('category keyboard order and drag order persisted', async () => {
    await page.getByRole('button', { name: '排序分类', exact: true }).click()
    await page
      .getByRole('button', { name: '上移分类 投资研究', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    await page
      .locator('.notice')
      .filter({ hasText: '分类顺序已保存' })
      .waitFor()
    await page.reload()
    await ready()
    assert.equal(
      await page.locator('.category-name').first().innerText(),
      '投资研究',
    )
    await page.getByRole('button', { name: '排序分类', exact: true }).click()
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith('/categories/sort/batch') &&
        r.request().method() === 'POST',
    )
    await page
      .getByRole('button', { name: '拖动分类 投资研究', exact: true })
      .dragTo(
        page.getByRole('button', { name: '拖动分类 链上世界', exact: true }),
      )
    assert.equal((await response).status(), 200)
    await ready()
    await page.reload()
    await ready()
    assert.notEqual(
      await page.locator('.category-name').first().innerText(),
      '投资研究',
    )
  })
  await test('title/recent sorting and all three view modes survive reload', async () => {
    await page.getByRole('combobox', { name: '书签排序' }).selectOption('title')
    await page.reload()
    await ready()
    assert.equal(
      await page.getByRole('combobox', { name: '书签排序' }).inputValue(),
      'title',
    )
    await page.getByRole('link', { name: '最近添加', exact: true }).click()
    await page.getByRole('heading', { name: '最近添加', exact: true }).waitFor()
    await page.getByRole('link', { name: /全部书签/ }).click()
    for (const [label, mode] of [
      ['列表视图', 'list'],
      ['简化视图', 'simple'],
      ['网格视图', 'card'],
    ]) {
      await page.getByRole('button', { name: label, exact: true }).click()
      await page.reload()
      await ready()
      assert.equal(await page.locator(`.bookmark-card--${mode}`).count(), 7)
      if (mode === 'list') await shot('navigation-desktop-list')
    }
  })
  await test('safe external link opens user-requested tab', async () => {
    const link = page.getByRole('link', { name: 'GitHub', exact: true })
    assert.equal(await link.getAttribute('target'), '_blank')
    assert.match(await link.getAttribute('rel'), /noopener/)
    const popup = await Promise.all([
      ctx.waitForEvent('page'),
      link.click(),
    ]).then((x) => x[0])
    await popup.waitForURL((u) => u.hostname === 'github.com', {
      waitUntil: 'commit',
    })
    await popup.close()
  })
  await test('merge import, invalid file and real exported JSON', async () => {
    await navigate('/profile')
    await page.locator('input[type=file]').setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{broken'),
    })
    await page.locator('.notice.error').waitFor()
    assert.equal(await page.locator('dialog[open]').count(), 0)
    const data = {
      version: '1.0',
      data: {
        categories: [
          {
            name: '工作工具',
            bookmarks: [
              {
                title: 'Vite',
                url: 'https://vite.dev',
                description: '前端构建工具',
                sort_order: 4,
              },
            ],
          },
        ],
      },
    }
    await upload(data)
    await page.getByRole('button', { name: '确认合并导入' }).click()
    await closed()
    assert.equal((await api(page, 'bookmarks')).length, 8)
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出备份', exact: true }).click(),
    ]).then((x) => x[0])
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'))
    assert.equal(exported.app, 'mrstrawberry-navigation')
    assert.equal(exported.data.categories.flatMap((c) => c.bookmarks).length, 8)
  })
  await test('nickname save and account/security entries', async () => {
    await page.getByRole('button', { name: '编辑昵称', exact: true }).click()
    await page
      .getByRole('textbox', { name: '昵称', exact: true })
      .fill('Navigation 验收')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('昵称已保存', { exact: true }).waitFor()
    await page.reload()
    await page.getByText('Navigation 验收', { exact: true }).last().waitFor()
    assert.equal(
      await page
        .getByRole('link', { name: '打开统一账号中心' })
        .getAttribute('href'),
      'http://localhost:20263/auth/profile',
    )
    await shot('navigation-desktop-settings')
  })
  await test('loading failure and retry', async () => {
    await navigate('/')
    const failure = (route) => route.abort('failed')
    await page.route('**/api/bookmarks', failure)
    await page.reload()
    await page.getByRole('heading', { name: '暂时无法加载' }).waitFor()
    await page.unroute('**/api/bookmarks', failure)
    await page.getByRole('button', { name: '重新加载' }).click()
    await count(8)
  })
  await test('desktop and phone layouts, long names, category scrolling and modal keyboard', async () => {
    await shot('navigation-desktop-grid')
    const desktopPage = page
    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    page = await phone.newPage()
    page.setDefaultTimeout(12000)
    await login(page, credentials.users[0])
    await ready()
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      )
      for (const label of ['列表视图', '简化视图', '网格视图']) {
        await page.getByRole('button', { name: label, exact: true }).click()
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        )
        if (width === 390 && label === '列表视图')
          await shot('navigation-mobile-list')
      }
      await page.getByRole('button', { name: '打开导航菜单' }).click()
      await page
        .getByRole('button', { name: '个人文档', exact: true })
        .scrollIntoViewIfNeeded()
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      )
      if (width === 390) await shot('navigation-mobile-menu')
      await page.keyboard.press('Escape')
      await page
        .getByRole('button', { name: '添加书签', exact: true })
        .first()
        .click()
      await page.getByLabel('标题', { exact: true }).waitFor()
      assert.equal(
        await page
          .getByLabel('标题', { exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      )
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Shift+Tab')
      assert.equal(
        await page.evaluate(
          () => !!document.activeElement.closest('dialog[open]'),
        ),
        true,
      )
      if (width === 390) await shot('navigation-mobile-dialog')
      await page.keyboard.press('Escape')
      await closed()
      if (width === 390) await shot('navigation-mobile-grid')
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await navigate('/profile')
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    )
    await shot('navigation-mobile-settings')
    page = desktopPage
    await phone.close()
    await navigate('/')
  })
  await test('second real user isolation and CSRF protection', async () => {
    const other = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    })
    const second = await other.newPage()
    second.setDefaultTimeout(12000)
    await login(second, credentials.users[1])
    await second.screenshot({
      path: path.join(outputDir, 'navigation-desktop-empty.png'),
      fullPage: true,
      mask: [second.locator('.account-name')],
      maskColor: '#e9ecf1',
    })
    const owned = (await api(page, 'bookmarks'))[0]
    assert.equal(
      (await api(second, 'bookmarks')).some((b) => b.id === owned.id),
      false,
    )
    await second
      .getByRole('button', { name: '添加书签', exact: true })
      .first()
      .click()
    await second.getByLabel('标题', { exact: true }).fill('第二账号专属书签')
    await second
      .getByLabel('网址', { exact: true })
      .fill('https://example.com/second-user')
    await second.getByRole('button', { name: '添加', exact: true }).click()
    await second.locator('dialog[open]').waitFor({ state: 'hidden' })
    await second.reload()
    await second
      .getByRole('link', { name: '第二账号专属书签', exact: true })
      .waitFor()
    assert.equal(
      (await api(page, 'bookmarks')).some(
        (b) => b.title === '第二账号专属书签',
      ),
      false,
    )
    await second
      .getByRole('button', { name: '删除书签 第二账号专属书签', exact: true })
      .click()
    await second.getByRole('button', { name: '确认删除', exact: true }).click()
    await second.locator('dialog[open]').waitFor({ state: 'hidden' })
    const noCsrf = await second.request.post(base + '/api/categories', {
      data: { name: 'missing-csrf' },
    })
    assert.equal(noCsrf.status(), 403)
    const csrf = (await other.cookies(base)).find(
      (c) => c.name === 'navigation_csrf',
    ).value
    assert.equal(
      (
        await second.request.put(base + '/api/bookmarks/' + owned.id, {
          headers: { 'X-CSRF-Token': csrf },
          data: { title: 'must-not-change' },
        })
      ).status(),
      404,
    )
    const session = (await ctx.cookies(base)).find(
      (c) => c.name === 'navigation_session',
    )
    assert.equal(session.httpOnly, true)
    assert.equal(session.sameSite, 'Lax')
    assert.equal(
      await page.evaluate(() =>
        [...Object.keys(localStorage), ...Object.keys(sessionStorage)].some(
          (k) => /access_token|refresh_token/.test(k),
        ),
      ),
      false,
    )
    await other.close()
  })
  await test('expired local session, explicit re-login and deep-link return', async () => {
    await navigate('/profile')
    const session = (await ctx.cookies(base)).find(
      (c) => c.name === 'navigation_session',
    )
    // Expire only this dedicated test session in Navigation's isolated Redis.
    // The cookie is passed via stdin, never as a logged command argument.
    require('node:child_process').execFileSync(
      'docker',
      [
        'exec',
        '-i',
        'navigation-ui-backend',
        'python',
        '-c',
        'import sys; from app.session import session_store; sid=sys.stdin.read(); assert session_store.redis.expire(session_store._key(sid), 0)',
      ],
      { input: session.value, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    await page.reload()
    await page.waitForURL((u) => u.pathname === '/login')
    await page.getByRole('heading', { name: '请重新登录' }).waitFor()
    await shot('navigation-session-expired')
    await page.getByRole('button', { name: '重新登录', exact: true }).click()
    const loginState = await Promise.race([
      page
        .locator('input[name=email]')
        .waitFor()
        .then(() => 'login'),
      page
        .waitForURL((u) => u.port === '20261' && u.pathname === '/profile')
        .then(() => 'returned'),
    ])
    if (loginState === 'login') {
      await page.locator('input[name=email]').fill(credentials.users[0].email)
      await page
        .locator('input[name=password]')
        .fill(credentials.users[0].password)
      await page.getByRole('button', { name: '登录', exact: true }).click()
    }
    await page.waitForURL(
      (u) => u.port === '20261' && u.pathname === '/profile',
    )
    await page.getByRole('heading', { name: '个人设置与备份' }).waitFor()
  })
  await test('logout and invalid callback feedback', async () => {
    await page.getByRole('button', { name: '账号菜单' }).click()
    await page.getByRole('button', { name: '退出登录', exact: true }).click()
    await page.waitForURL((u) => u.port === '20261' && u.pathname === '/login')
    await page.getByRole('heading', { name: '已退出登录' }).waitFor()
    assert.equal((await page.request.get(base + '/api/auth/me')).status(), 401)
    await shot('navigation-logged-out')
    await page.goto(base + '/auth/callback')
    await page.getByRole('alert').filter({ hasText: '缺少授权码' }).waitFor()
  })
  await test('registration and password entry routes keep real Auth redirects', async () => {
    for (const target of ['register', 'forgot-password', 'reset-password']) {
      await page.goto(base + '/' + target)
      await page.getByRole('link', { name: '立即跳转', exact: true }).click()
      await page.waitForURL(
        (u) => u.port === '20263' && u.pathname === '/auth/' + target,
      )
      assert.equal(await page.locator('h1').count(), 1)
    }
  })
  assert.deepEqual(runtimeErrors, [])
  const report = {
    date: new Date().toISOString(),
    environment: base,
    browser: 'Persistent CDP Chrome 9223; dedicated contexts',
    checks,
    uncovered: [
      'Favorite/pin is absent from current backend and was explicitly excluded from this UI scope.',
      'MFA login is not covered. Session expiration is exercised by expiring only this test account BFF session in the isolated Navigation Redis.',
    ],
    runtimeErrors,
  }
  fs.writeFileSync(
    path.join(__dirname, '../docs/ui-acceptance-results.json'),
    JSON.stringify(report, null, 2) + '\n',
  )
  await login(page, credentials.users[0])
  await page.getByRole('link', { name: 'GitHub', exact: true }).waitFor()
  return { passed: checks.length, runtimeErrors: runtimeErrors.length }
}
module.exports = { run }

if (require.main === module)
  (async () => {
    const credentials = JSON.parse(
      fs.readFileSync(
        process.env.NAV_UI_CREDENTIALS ||
          '/private/tmp/navigation-ui-credentials.json',
        'utf8',
      ),
    )
    privateValues = credentials.users.flatMap((user) => [
      user.email,
      user.password,
    ])
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223')
    // Never dismiss another task's native dialogs on this shared browser connection.
    for (const c of browser.contexts()) {
      c.on('page', (p) => p.on('dialog', () => {}))
      for (const p of c.pages()) p.on('dialog', () => {})
    }
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    })
    const page = await ctx.newPage()
    page.setDefaultTimeout(12000)
    const base = 'http://localhost:20261'
    await page.goto(base + '/login')
    await page.getByRole('button', { name: /前往统一登录|重新登录/ }).click()
    await page.waitForURL((u) => u.port === '20263')
    await page.locator('input[name=email]').fill(credentials.users[0].email)
    await page
      .locator('input[name=password]')
      .fill(credentials.users[0].password)
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await page.waitForURL((u) => u.port === '20261' && u.pathname === '/')
    try {
      console.log(
        await run({
          browser,
          ctx,
          page,
          credentials,
          base,
          outputDir: path.join(__dirname, '../docs/screenshots'),
        }),
      )
    } finally {
      await ctx.close()
      await browser.close()
    }
  })().catch((e) => {
    console.error(redact(e))
    process.exitCode = 1
  })
