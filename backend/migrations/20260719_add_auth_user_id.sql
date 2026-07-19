-- Navigation auth-service integration migration
-- 添加 auth_user_id，将原有密码字段改为可空，为接入统一认证做准备

-- Up
ALTER TABLE users ADD COLUMN auth_user_id VARCHAR(36);
CREATE UNIQUE INDEX ix_users_auth_user_id ON users(auth_user_id);

-- 原有密码相关字段改为可空（旧用户保留，新用户通过 auth-service 认证后为空）
ALTER TABLE users ALTER COLUMN hashed_pw DROP NOT NULL;

-- Down
-- DROP INDEX ix_users_auth_user_id;
-- ALTER TABLE users DROP COLUMN auth_user_id;
-- ALTER TABLE users ALTER COLUMN hashed_pw SET NOT NULL;
