# 书签搜索位置调整（2026-09-19）

状态：本地实现和验证完成，未部署生产。

搜索从顶栏移到页面标题与“添加书签”之间。桌面三列依次为当前分类标题、搜索框、添加按钮；宽度不超过 740px 时标题和按钮保持首行，搜索框独占第二行。搜索组件、查询状态、清空与 Cmd/Ctrl+K 快捷键沿用原实现。

本地 Docker 前端 `vue-tsc && vite build` 通过，只重建并替换 Navigation 前端。专用 Chrome CDP 在 1440、768、390、320px 下完成 20 项检查，覆盖唯一搜索入口、桌面排列、手机换行、页面无横向溢出、Cmd/Ctrl+K 聚焦、输入筛选和清空恢复；无运行时异常。桌面与手机截图已人工检查。

本地测试账号真实书签数为 0，筛选验证使用当前标签 GET 接口拦截提供的 24 条明确样例，没有写入数据库。结束后关闭拦截、确认真实 GET 结果与视图偏好未变，使用 Target.closeTarget 关闭自建标签并验证。4 张截图、检查报告与脚本保存在 infra 的 gitignored `backups/navigation-search-local-20260919/`。

维护位置：`frontend/src/views/DashboardView.vue` 的 `.page-head` 与 `.page-search`。页面级宽度与移动端换行由这里控制，`BookmarkSearch.vue` 继续负责搜索交互。
