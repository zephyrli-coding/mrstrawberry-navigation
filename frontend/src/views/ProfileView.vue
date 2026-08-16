<template>
  <div class="layout">
    <Navbar />

    <div class="page">
      <div class="page__inner">
        <RouterLink to="/" class="back-link">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回
        </RouterLink>

        <h1 class="page__title">个人中心</h1>

        <!-- 账户信息 -->
        <section class="card">
          <h2 class="card__title">账户信息</h2>
          <div v-if="auth.user" class="info-list">
            <div class="info-row">
              <span class="info-row__label">昵称</span>
              <div class="info-row__edit">
                <template v-if="editingNickname">
                  <input
                    v-model="nicknameForm"
                    type="text"
                    class="nickname-input"
                    placeholder="设置昵称"
                    @keyup.enter="saveNickname"
                    @keyup.esc="cancelEditNickname"
                  />
                  <button class="icon-btn" @click="saveNickname" title="保存">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button class="icon-btn" @click="cancelEditNickname" title="取消">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </template>
                <template v-else>
                  <span class="info-row__value">{{ auth.user.nickname || '未设置' }}</span>
                  <button class="icon-btn" @click="startEditNickname" title="编辑">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </template>
              </div>
            </div>
            <div class="info-row">
              <span class="info-row__label">邮箱</span>
              <span class="info-row__value">{{ auth.user.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">注册时间</span>
              <span class="info-row__value">{{ formatDate(auth.user.created_at) }}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">账户状态</span>
              <span class="info-row__value info-row__value--active">正常</span>
            </div>
          </div>
          <div v-else class="info-loading">
            <span class="spinner" />
          </div>
        </section>

        <!-- 修改密码 -->
        <section class="card">
          <h2 class="card__title">修改密码</h2>
          <p class="backup-section__desc">密码管理已迁移到统一账号中心</p>
          <BaseButton @click="goToAuthForgotPassword">
            前往统一账号中心重置密码
          </BaseButton>
        </section>

        <!-- 数据导入导出 -->
        <section class="card">
          <h2 class="card__title">数据备份</h2>
          
          <!-- 导出 -->
          <div class="backup-section">
            <h3 class="backup-section__title">导出数据</h3>
            <p class="backup-section__desc">将您的所有分类和书签导出为 JSON 文件，可用于备份或迁移</p>
            <BaseButton @click="handleExport" :loading="exportLoading">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 6px;">
                <path d="M8 12V2m0 10l-3-3m3 3l3-3M2 14h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              导出备份
            </BaseButton>
          </div>

          <div class="backup-divider" />

          <!-- 导入 -->
          <div class="backup-section">
            <h3 class="backup-section__title">导入数据</h3>
            <p class="backup-section__desc">从 JSON 文件恢复数据，支持合并或替换现有数据</p>
            
            <div class="import-mode">
              <label class="import-mode__option">
                <input type="radio" v-model="importMode" value="merge" />
                <span>合并模式</span>
                <small>保留现有数据，同名分类合并书签</small>
              </label>
              <label class="import-mode__option">
                <input type="radio" v-model="importMode" value="replace" />
                <span>替换模式</span>
                <small>清空现有数据后导入</small>
              </label>
            </div>

            <div class="file-upload">
              <input
                ref="fileInput"
                type="file"
                accept=".json,application/json"
                @change="handleFileChange"
                class="file-upload__input"
              />
              <BaseButton @click="fileInput?.click()" :loading="importLoading" variant="secondary">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 6px;">
                  <path d="M8 4v10m0-10l-3 3m3-3l3 3M2 2h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                选择文件导入
              </BaseButton>
              <span v-if="selectedFile" class="file-upload__name">{{ selectedFile.name }}</span>
            </div>

            <div v-if="importResult" class="import-result" :class="{ 'import-result--error': importResult.error }">
              <template v-if="importResult.error">
                {{ importResult.error }}
              </template>
              <template v-else>
                <p>导入成功！</p>
                <ul>
                  <li>新增分类: {{ importResult.imported_categories }} 个</li>
                  <li>新增书签: {{ importResult.imported_bookmarks }} 个</li>
                </ul>
                <p v-if="importResult.errors" class="import-result__warn">
                  警告: {{ importResult.errors.join('; ') }}
                </p>
              </template>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { exportData, importData, validateImportFile } from '@/api/exportImport'
import { redirectToAuthForgotPassword } from '@/api/client'
import Navbar from '@/components/Navbar.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const auth = useAuthStore()

onMounted(() => {
  if (!auth.user) auth.fetchMe()
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function goToAuthForgotPassword() {
  redirectToAuthForgotPassword()
}

// ── Nickname edit ─────────────────────────────────────────────────────────────
const editingNickname = ref(false)
const nicknameForm = ref('')

function startEditNickname() {
  nicknameForm.value = auth.user?.nickname || ''
  editingNickname.value = true
}

function cancelEditNickname() {
  editingNickname.value = false
  nicknameForm.value = ''
}

async function saveNickname() {
  try {
    await auth.updateProfile(nicknameForm.value)
    editingNickname.value = false
  } catch (e: any) {
    alert(e.response?.data?.detail ?? '保存失败，请重试')
  }
}

// ── Export / Import ───────────────────────────────────────────────────────────
const exportLoading = ref(false)
const importLoading = ref(false)
const importMode = ref<'merge' | 'replace'>('merge')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const importResult = ref<{ error?: string; imported_categories?: number; imported_bookmarks?: number; errors?: string[] | null; success?: boolean; version?: string } | null>(null)

function handleExport() {
  exportLoading.value = true
  try {
    exportData()
  } finally {
    setTimeout(() => { exportLoading.value = false }, 500)
  }
}

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  selectedFile.value = file
  importResult.value = null
  importLoading.value = true

  try {
    // 先验证文件
    const validation = await validateImportFile(file)
    if (!validation.valid) {
      importResult.value = { error: `文件验证失败: ${validation.error}` }
      return
    }

    // 执行导入
    const result = await importData(file, importMode.value)
    importResult.value = result
    
    // 清空文件选择
    if (fileInput.value) fileInput.value.value = ''
    selectedFile.value = null
  } catch (e: any) {
    importResult.value = { 
      error: e.response?.data?.detail ?? '导入失败，请检查文件格式' 
    }
  } finally {
    importLoading.value = false
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-alt);
}

.page {
  flex: 1;
  padding: 40px 24px;
}

.page__inner {
  max-width: 560px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-tertiary);
  margin-bottom: 24px;
  transition: color var(--transition);
}
.back-link:hover { color: var(--color-heading); }

.page__title {
  font-size: 24px;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: 24px;
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 28px 32px;
  margin-bottom: 16px;
}

.card__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.info-row__label {
  color: var(--color-tertiary);
}

.info-row__value {
  color: var(--color-heading);
  font-weight: 500;
}

.info-row__value--active {
  color: #2e7d32;
}

.info-row__edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname-input {
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-btn);
  background: var(--color-surface);
  color: var(--color-heading);
  width: 150px;
}
.nickname-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-tertiary);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: color var(--transition);
}
.icon-btn:hover {
  color: var(--color-primary);
}

.info-loading {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form__error {
  font-size: 13px;
  color: var(--color-error);
  padding: 10px 12px;
  background: #ffeaea;
  border-radius: var(--radius-btn);
}

.form__success {
  font-size: 13px;
  color: #2e7d32;
  padding: 10px 12px;
  background: #e8f5e9;
  border-radius: var(--radius-btn);
}

.form__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

/* Backup section */
.backup-section {
  margin-bottom: 20px;
}
.backup-section:last-child {
  margin-bottom: 0;
}

.backup-section__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: 8px;
}

.backup-section__desc {
  font-size: 13px;
  color: var(--color-tertiary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.backup-divider {
  height: 1px;
  background: var(--color-border);
  margin: 24px 0;
}

/* Import mode */
.import-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--color-surface-alt);
  border-radius: var(--radius-btn);
}

.import-mode__option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
}

.import-mode__option input[type="radio"] {
  margin-top: 2px;
}

.import-mode__option span {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-heading);
}

.import-mode__option small {
  display: block;
  font-size: 12px;
  color: var(--color-tertiary);
  margin-top: 2px;
}

/* File upload */
.file-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.file-upload__input {
  display: none;
}

.file-upload__name {
  font-size: 13px;
  color: var(--color-body);
}

/* Import result */
.import-result {
  margin-top: 16px;
  padding: 12px 16px;
  background: #e8f5e9;
  border-radius: var(--radius-btn);
  font-size: 13px;
  color: #2e7d32;
}

.import-result--error {
  background: #ffeaea;
  color: var(--color-error);
}

.import-result ul {
  margin: 8px 0;
  padding-left: 20px;
}

.import-result li {
  margin: 4px 0;
}

.import-result__warn {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.1);
  color: #f57c00;
}
</style>
