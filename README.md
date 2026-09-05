# Mrstrawberry Navigation

个人网址导航：分类、书签、排序及导入导出。Vue 3/Vite 前端，FastAPI 后端，SQLite 业务数据，Redis BFF 会话。

- [生产站点](https://navigation.mr-strawberry.com)
- [本地 Docker 站点](http://localhost:20261)，需本机服务已启动。
- [飞书项目知识库](https://compound.feishu.cn/wiki/YExhwYctUiJjJekqAmccuF6jnFb)
- [视觉设计参考](design.md)，仅描述设计方向，不作为认证或部署规范。

## 账号边界

Navigation 继续公开注册。用户在 auth-service 注册并登录，active 用户未验证邮箱也可使用 Navigation，不需要单独 viewer/editor 授权。

密码、验证邮件、密码重置和个人账号安全由 Auth 负责；Navigation 不另建 SMTP 邮箱或本地密码登录体系。旧文件和 Compose 中保留的 SMTP 参数不代表当前登录依赖该通道。

本地用户通过 `auth_user_id` 映射统一账号，首次登录按 ID/邮箱认领原数据，保留书签和分类归属。不要删除用户表来完成账号迁移。

## BFF 和路由

- 浏览器页面 callback：`/auth/callback`。
- 浏览器 API：`/api/auth/callback`、`/api/auth/me`、`/api/auth/logout`。
- 前端 Nginx 去掉 `/api` 后转发后端 `/auth/*`，后端内部端口是 8002。
- HttpOnly cookie 标识 Redis 会话，浏览器不保存 access/refresh token；写请求需要 CSRF。
- 业务数据仍按本地用户隔离，不因其他应用角色变化共享所有人的书签。

## 本地 Docker

1. 按根目录 `.env.example` 准备私有 `.env`，不覆盖已有配置。
2. 先启动 Auth，共享 Docker 网络；准备 infra 的 `compound-python-backend:3.11` 基础镜像。
3. 显式设置 `AUTH_SERVICE_URL=http://auth-nginx`、`AUTH_SERVICE_JWKS_URL=http://auth-nginx/.well-known/jwks.json`。不要沿用不存在的 `auth-service:20263` 默认地址。
4. 本地 `AUTH_SERVICE_ISSUER` 和 `AUTH_SERVICE_PUBLIC_URL` 为 `http://localhost:20263`；`AUTH_CLIENT_ID=navigation`，secret 与 Auth 匹配。
5. `FRONTEND_URL=http://localhost:20261`，注册 callback 为 `http://localhost:20261/auth/callback`。
6. 本仓库执行 `docker compose up -d --build`。

SQLite 为 `./data/navigation.db` → `/app/data/navigation.db`；Redis 使用独立 `navigation_session_data` volume。不要用 `down -v` 升级。旧用户映射 migration 位于 `backend/migrations/`，仅在备份与旧 schema 确认后按需执行。

## 开发和维护

- 后端入口 `backend/main.py`，路由 `backend/app/routers/`。
- 前端入口 `frontend/src/main.ts`，在 `frontend` 运行 `npm ci`、`npm run dev` 或 `npm run build`。
- 认证回归入口为 `backend/tests/test_app.py`，应在隔离本地 Docker 环境运行；测试会创建并删除测试数据库，禁止指向生产或个人业务库。
- [当前接入契约](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/integrations/navigation.md)、[统一开发流程](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/development/README.md)、[部署检查清单](https://github.com/zephyrli-coding/compound-infra/blob/main/docs/operations/deployment-checklist.md)。

文档整理于 2026-09-05；上线证据依据 2026-08-30 记录，本次没有重新部署或执行测试。
