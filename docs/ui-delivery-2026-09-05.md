# Navigation UI 本地交付 · 2026-09-05

实际 Vue 应用已完成统一 UI 改造，当前运行于 **http://localhost:20261**。

仓库：`mrstrawberry-navigation`。分支：`feat/navigation-unified-ui`，基于 `5379267`。
改动保留在本地工作区，未提交、推送、创建 PR 或部署生产。

## 实现范围

- 按统一规范替换配色、字体、细边框、侧栏、顶栏、按钮与表单。桌面固定产品导航，手机使用可滚动的独立菜单。
- 保留分类分组、书签/分类增删改、拖拽、简化视图、设置、导入导出及账号入口。新增真实书签搜索、完整列表视图、标题/最近排序和键盘移动。
- 书签与分类继续由原有 API 持久化。自定义排序在刷新后保持；搜索和按标题查看不重写服务端自定义顺序。视图偏好仍是本机浏览器偏好。
- 弹窗等待真实提交完成；失败时保留输入与重试入口。删除提供确认；导入先校验、展示数量、确认合并/替换后提交；导出等待真实下载并反馈失败。
- 修正前端导入 `mode` 参数位置，使其匹配既有后端 query 契约。删除分类前通过原有书签更新接口保存 `category_id=null`，避免当前 SQLite 外键设置留下无效分类引用。
- 保留 OAuth callback、BFF、HttpOnly Cookie、CSRF、用户数据隔离；未新增邮箱或角色门槛。增加首次登录/过期提示区分和原页面回跳，统一旧注册/密码入口的 OAuth state 生成与清理定时器。
- 处理加载失败、空搜索、长标题/分类、320px/390px 视口、触屏操作、焦点可见、弹窗 Tab 循环、Esc 与 Ctrl/Cmd+K。

完整逐项对照：[功能保留清单](ui-functional-inventory.md)。

## 验证结果

| 检查 | 结果 |
|---|---|
| `npm ci --offline --no-audit --no-fund` | 通过，使用现有锁文件 |
| `npm run build`（vue-tsc + Vite） | 通过 |
| Navigation Docker 镜像构建 | 通过 |
| 独立无网络容器 `pytest tests/test_app.py -q` | **5 passed** |
| 独立 CDP Chrome 9223 浏览器验收 | **21 组通过** |
| `git diff --check` | 通过 |
| 运行时主页面未捕获异常 | 0 |
| 三个 Navigation 容器 | running，RestartCount 均为 0 |

浏览器覆盖真实 OAuth 登录（包括未验证邮箱账号）、书签/分类增删改、重复和网址校验、失败/重试、分类删除后刷新、搜索/清除、分类深链接、键盘/鼠标排序及持久化、网格/列表/简化视图、外链新标签页、合并/替换导入、实际 JSON 下载、昵称、加载失败重试、桌面/触屏手机布局、长文本、多分类、两个账号双向隔离、越权 404、缺少 CSRF 的请求 403、HttpOnly/SameSite、浏览器无 access/refresh token、Redis 会话过期/重新登录/原页面返回、退出、异常 callback、注册及密码入口跳转。

失败状态通过仅在专用页面中中断指定请求验证；业务成功路径全部走真实本地后端。会话过期测试只过期当前测试账号在 Navigation 专用 Redis 中的一条 BFF 会话。没有修改认证安全设置、其他账号会话或共享 Auth 配置。

运行详情：[验收 JSON](ui-acceptance-results.json)。复现脚本：[ui-acceptance.cjs](../tests/ui-acceptance.cjs)。脚本要求两个专用本地账号，会通过确认导入替换第一个账号的 **Navigation 测试数据**，不能用于个人账号或其他部署。凭据由环境变量 `NAV_UI_CREDENTIALS` 指定私有文件，报告不包含凭据。

## Docker 归属与复现

Compose project：`navigation-ui`。基础配置为本仓库原有 `docker-compose.yml`，叠加本次专用 `docker-compose.ui-local.yml`。

| 资源 | 名称 / 地址 |
|---|---|
| 前端 | `navigation-ui-frontend`，`http://localhost:20261` |
| 后端 | `navigation-ui-backend`，内部 8002 |
| 会话 Redis | `navigation-ui-redis` |
| 业务数据 volume | `navigation-ui_navigation_ui_data` → `/app/data` |
| 会话 volume | `navigation-ui_navigation_session_data` → `/data` |
| 专用网络 | `navigation-ui_navigation-site-network` |
| 共享依赖 | 原有 Auth、`compound-internal`、`compound-edge` |
| 前端镜像 | `navigation-ui:frontend`，`sha256:d8c384f6bc9b3d7fdf8a3ad54683b1998c898a445ceaa56f2ff7839a2dd29ebe` |
| 后端镜像 | `navigation-ui:backend`，`sha256:98fe6ea5f993f25f63453e791e2877575d309f2946ec91ba51e35f99cbabe0c7` |

本仓库执行：

```sh
docker compose -p navigation-ui -f docker-compose.yml -f docker-compose.ui-local.yml build frontend backend
docker compose -p navigation-ui -f docker-compose.yml -f docker-compose.ui-local.yml up -d backend session-redis frontend
```

只替换前端时：

```sh
docker compose -p navigation-ui -f docker-compose.yml -f docker-compose.ui-local.yml build frontend
docker compose -p navigation-ui -f docker-compose.yml -f docker-compose.ui-local.yml up -d --no-deps frontend
```

未覆盖原 `.env`、旧 Navigation 容器、原 `data/`、其他产品、共享设计或共享配置；没有清理 volume。当前应用保持运行，页面显示的是专用测试账号通过真实接口保存的非敏感书签。

## 已知边界与未覆盖项

- **收藏/置顶：**现有模型和 API 没有该能力，协调任务已确认本轮不扩展。没有复制原型收藏或增加假按钮。
- **未分类书签导出：**原有后端 JSON 只包含分类内书签。设置页已明确提示先归类；此次没有改变备份格式或后端。替换导入仍会删除该账号的全部现有书签，确认框明确包含未分类书签。
- 未实测 MFA 登录、真实邮件投递、生产 HTTPS Secure Cookie 或 SG01。它们不在此次本地 UI 部署范围；未声称完成生产验收。
- Vite CJS API 与 pytest asyncio 存在既有弃用提示，不影响本次构建/测试通过。

## 截图

- [桌面网格](screenshots/navigation-desktop-grid.png)
- [桌面列表](screenshots/navigation-desktop-list.png)
- [桌面设置与备份](screenshots/navigation-desktop-settings.png)
- [空数据](screenshots/navigation-desktop-empty.png)
- [手机网格](screenshots/navigation-mobile-grid.png)
- [手机列表](screenshots/navigation-mobile-list.png)
- [手机菜单](screenshots/navigation-mobile-menu.png)
- [手机弹窗与键盘焦点](screenshots/navigation-mobile-dialog.png)
- [手机设置](screenshots/navigation-mobile-settings.png)
- [会话过期](screenshots/navigation-session-expired.png)
- [退出登录](screenshots/navigation-logged-out.png)

截图使用桌面 1440px、手机触屏 390px；另检查 320px 无整体横向溢出。账号字段已遮挡。
