# Navigation UI 功能保留清单

核对基线：2026-09-05，`main` (`5379267`)，改造分支 `feat/navigation-unified-ui`。仅替换 Vue 界面与前端交互，不修改认证契约、后端、数据库或共享配置。

| 页面 / 操作 | 真实接口或现有行为 | 本次处理 |
|---|---|---|
| 首页与分类分组 | GET /api/bookmarks、/api/categories | 保留真实数据、增加搜索和清除 |
| 书签新增 / 编辑 / 删除 | POST / PUT / DELETE /api/bookmarks | 保留；验证网址、等待提交、显示失败、删除确认 |
| 打开链接 | 新标签页、noopener noreferrer | 保留，禁止可执行脚本网址 |
| 分类新增 / 编辑 / 删除 | /api/categories；删除后归入未分类 | 保留；长名称、失败反馈；删除前通过现有书签接口持久化未分类状态 |
| 分类拖拽 / 书签拖拽 | /categories/sort/batch、/bookmarks/sort/batch | 保留真实持久化，增加键盘移动入口 |
| 网格 / 简化视图 | localStorage view_mode | 保留简化视图，加完整列表视图 |
| 昵称设置 | PUT /api/auth/me | 保留；统一账号仍为身份来源 |
| JSON 导出 | GET /api/export-import/export | 保留；等待下载、显示失败 |
| JSON 合并 / 替换导入 | validate 与 import；mode 为 query 参数 | 保留校验，增加内容预览与确认，匹配既有参数位置 |
| 登录、退出、callback | OAuth、HttpOnly BFF session、CSRF、/auth/callback | 保留，过期提示与深链接回跳 |
| 注册 / 找回 / 重置密码 | 跳转统一 Auth | 保留路由入口 |
| 分类收起 | 现有分类面板折叠 | 保留；手机改为菜单抽屉 |

## 原型与现有产品差异

- 当前 `Bookmark` 模型、schema 与接口没有收藏或置顶状态。原型收藏是演示数据；本次不使用浏览器本地收藏或内存状态冒充服务端持久化。新增此能力需要另行确认后端与数据模型范围。
- 基线没有搜索 UI；本次新增搜索基于当前用户接口返回的真实标题、网址、描述和分类执行。
- 业务 API 不返回邮箱验证状态，Navigation 本身也不要求邮箱验证或 Fund/Data 角色。
- 当前导出接口只包含有分类的书签。保留该 API 契约并在备份页提示限制，避免宣称完整备份；未分类数据的导出支持属于独立后端修复。
