<template>
  <AppShell title="个人设置与备份"
    ><main class="settings">
      <div class="page-head">
        <p class="eyebrow">NAVIGATION / SETTINGS</p>
        <h1>个人设置与备份</h1>
        <p>管理你的显示名称，备份常用书签。</p>
      </div>
      <p
        v-if="feedback"
        :class="['notice', failed ? 'error' : 'success']"
        role="status"
      >
        {{ feedback }}
      </p>
      <section class="settings-card">
        <div class="section-heading">
          <AppIcon name="user" />
          <div>
            <h2>账户信息</h2>
            <p>登录与安全设置由统一账号中心管理</p>
          </div>
        </div>
        <dl v-if="auth.user">
          <div>
            <dt>昵称</dt>
            <dd>
              <form
                v-if="editing"
                class="nickname-form"
                @submit.prevent="saveNickname"
              >
                <input
                  ref="nicknameInput"
                  v-model="nickname"
                  aria-label="昵称"
                  :disabled="saving"
                  @keydown.esc="editing = false"
                /><BaseButton type="submit" :loading="saving">保存</BaseButton
                ><BaseButton
                  variant="text"
                  :disabled="saving"
                  @click="editing = false"
                  >取消</BaseButton
                >
              </form>
              <div v-else class="nickname-value">
                <span>{{ auth.user.nickname || '未设置' }}</span
                ><button
                  class="icon-button"
                  aria-label="编辑昵称"
                  @click="startEditing"
                >
                  <AppIcon name="edit" />
                </button>
              </div>
            </dd>
          </div>
          <div>
            <dt>邮箱</dt>
            <dd>{{ auth.user.email }}</dd>
          </div>
          <div>
            <dt>注册时间</dt>
            <dd>{{ formatDate(auth.user.created_at) }}</dd>
          </div>
          <div>
            <dt>账户状态</dt>
            <dd>
              <span class="status-badge">{{
                auth.user.is_active ? '正常' : '已停用'
              }}</span>
            </dd>
          </div>
        </dl>
        <p v-else role="status">正在读取账户信息…</p>
      </section>
      <section class="settings-card">
        <div class="section-heading">
          <AppIcon name="lock" />
          <div>
            <h2>账号安全</h2>
            <p>在统一账号中心管理密码与登录会话。</p>
          </div>
        </div>
        <div class="security-actions">
          <a class="button-link" :href="`${AUTH_SERVICE_URL}/auth/profile`"
            >打开统一账号中心<AppIcon name="arrow" /></a
          ><BaseButton variant="secondary" @click="redirectToAuthForgotPassword"
            >重置密码</BaseButton
          >
        </div>
      </section>
      <section class="settings-card" id="backup">
        <div class="section-heading">
          <AppIcon name="folder" />
          <div>
            <h2>书签备份</h2>
            <p>JSON 文件可用于恢复或迁移你的分类书签。</p>
          </div>
        </div>
        <div class="backup-grid">
          <div>
            <h3>导出数据</h3>
            <p>下载当前账号的分类与分类内书签，保留现有排序。</p>
            <p class="backup-limit">
              当前备份格式仅包含分类内书签。请先把需要备份的未分类书签移入分类。
            </p>
            <BaseButton :loading="exportLoading" @click="handleExport"
              >导出备份</BaseButton
            >
          </div>
          <div>
            <h3>导入数据</h3>
            <p>选择备份文件，核对内容后再执行导入。</p>
            <fieldset :disabled="importLoading">
              <legend class="sr-only">导入模式</legend>
              <label
                ><input v-model="importMode" type="radio" value="merge" /><span
                  >合并模式<small>保留已有数据，同网址书签会更新</small></span
                ></label
              ><label
                ><input
                  v-model="importMode"
                  type="radio"
                  value="replace"
                /><span
                  >替换模式<small>删除当前账号所有书签和分类后导入</small></span
                ></label
              >
            </fieldset>
            <input
              ref="fileInput"
              class="sr-only"
              type="file"
              accept=".json,application/json"
              tabindex="-1"
              aria-label="选择备份文件"
              @change="selectFile"
            /><BaseButton
              variant="secondary"
              :loading="importLoading"
              @click="fileInput?.click()"
              >选择文件导入</BaseButton
            >
            <p v-if="selectedFile" class="file-name">{{ selectedFile.name }}</p>
          </div>
        </div>
        <div
          v-if="importResult"
          :class="['notice', importResult.error ? 'error' : 'success']"
          role="status"
        >
          <template v-if="importResult.error">{{ importResult.error }}</template
          ><template v-else
            >导入完成：新增 {{ importResult.imported_categories }} 个分类、{{
              importResult.imported_bookmarks
            }}
            个书签。
            <p v-if="importResult.errors?.length">
              部分内容未导入：{{ importResult.errors.join('；') }}
            </p></template
          >
        </div>
      </section>
      <ConfirmModal
        v-model="confirmOpen"
        title="确认导入备份"
        :message="importSummary"
        :loading="importLoading"
        :error="importError"
        :confirm-label="
          importMode === 'replace' ? '确认替换并导入' : '确认合并导入'
        "
        :danger="importMode === 'replace'"
        @confirm="confirmImport"
      /></main
  ></AppShell>
</template>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBookmarksStore } from '@/stores/bookmarks'
import { exportData, importData, validateImportFile } from '@/api/exportImport'
import { AUTH_SERVICE_URL, redirectToAuthForgotPassword } from '@/api/client'
import { errorMessage, safeWebUrl } from '@/utils/feedback'
import AppShell from '@/components/AppShell.vue'
import AppIcon from '@/components/AppIcon.vue'
import BaseButton from '@/components/BaseButton.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
const auth = useAuthStore(),
  store = useBookmarksStore()
const feedback = ref(''),
  failed = ref(false),
  editing = ref(false),
  nickname = ref(''),
  nicknameInput = ref<HTMLInputElement | null>(null),
  saving = ref(false)
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
async function startEditing() {
  nickname.value = auth.user?.nickname || ''
  editing.value = true
  await nextTick()
  nicknameInput.value?.focus()
}
async function saveNickname() {
  if (saving.value) return
  saving.value = true
  feedback.value = ''
  try {
    await auth.updateProfile(nickname.value.trim())
    editing.value = false
    feedback.value = '昵称已保存'
    failed.value = false
  } catch (e) {
    feedback.value = errorMessage(e, '昵称保存失败，请重试。')
    failed.value = true
  } finally {
    saving.value = false
  }
}
const exportLoading = ref(false),
  importLoading = ref(false),
  importMode = ref<'merge' | 'replace'>('merge'),
  selectedFile = ref<File | null>(null),
  fileInput = ref<HTMLInputElement | null>(null)
const importResult = ref<{
  error?: string
  imported_categories?: number
  imported_bookmarks?: number
  errors?: string[] | null
} | null>(null)
const confirmOpen = ref(false),
  importSummary = ref(''),
  importError = ref('')
async function handleExport() {
  if (exportLoading.value) return
  exportLoading.value = true
  feedback.value = ''
  try {
    await exportData()
    failed.value = false
    feedback.value = '备份已下载，请检查下载文件。'
  } catch (e) {
    failed.value = true
    feedback.value = errorMessage(e, '导出失败，请稍后重试。')
  } finally {
    exportLoading.value = false
  }
}
async function selectFile(e: Event) {
  const input = e.target as HTMLInputElement,
    file = input.files?.[0]
  input.value = ''
  if (!file) return
  selectedFile.value = file
  importResult.value = null
  importError.value = ''
  importLoading.value = true
  try {
    const content = JSON.parse(await file.text())
    if (!content?.data || !Array.isArray(content.data.categories))
      throw new Error('备份必须包含 data.categories 数组。')
    for (const cat of content.data.categories) {
      if (
        typeof cat?.name !== 'string' ||
        !cat.name.trim() ||
        !Array.isArray(cat.bookmarks)
      )
        throw new Error('分类必须包含名称和 bookmarks 数组。')
      for (const b of cat.bookmarks)
        if (
          typeof b?.title !== 'string' ||
          !b.title.trim() ||
          typeof b.url !== 'string' ||
          !safeWebUrl(b.url)
        )
          throw new Error('书签必须包含标题与有效的 http / https 网址。')
    }
    const validation = await validateImportFile(file)
    if (!validation.valid)
      throw new Error(validation.error || '备份文件验证失败。')
    importSummary.value = `文件「${file.name}」包含 ${validation.categories_count || 0} 个分类、${validation.bookmarks_count || 0} 个书签。${importMode.value === 'replace' ? '替换将删除你当前的全部分类和书签（包括未分类书签），建议先检查备份。' : '合并将保留现有数据，同网址书签的标题、描述、分类与顺序会更新。'}`
    confirmOpen.value = true
  } catch (e: any) {
    importResult.value = {
      error: e.response
        ? errorMessage(e, '文件验证失败，请重试。')
        : e.message || '无法读取这个备份文件。',
    }
  } finally {
    importLoading.value = false
  }
}
async function confirmImport() {
  if (!selectedFile.value || importLoading.value) return
  importLoading.value = true
  importError.value = ''
  try {
    importResult.value = await importData(selectedFile.value, importMode.value)
    confirmOpen.value = false
    selectedFile.value = null
    await store.fetchAll()
  } catch (e) {
    importError.value = errorMessage(e, '导入失败，请重试。')
  } finally {
    importLoading.value = false
  }
}
</script>
<style scoped>
.settings {
  max-width: 1030px;
}
.page-head {
  margin-bottom: 26px;
}
.page-head h1 {
  font-weight: 600;
  letter-spacing: -0.7px;
}
.page-head > p:last-child {
  font-size: 12px;
  color: var(--color-placeholder);
  margin-top: 8px;
}
.settings-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}
.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 19px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}
.section-heading > svg {
  color: var(--color-primary);
}
.section-heading h2 {
  font-size: 15px;
  font-weight: 600;
}
.section-heading p {
  font-size: 11px;
  color: var(--color-placeholder);
  margin-top: 4px;
}
dl {
  display: grid;
  gap: 15px;
}
dl > div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  align-items: center;
  gap: 15px;
  font-size: 13px;
}
dt {
  color: var(--color-placeholder);
}
dd {
  overflow-wrap: anywhere;
}
.nickname-value {
  display: flex;
  align-items: center;
  gap: 9px;
}
.nickname-form {
  display: flex;
  gap: 7px;
  align-items: center;
  flex-wrap: wrap;
}
.nickname-form input {
  border: 1px solid var(--color-border-subtle);
  border-radius: 7px;
  padding: 10px 12px;
  max-width: 100%;
  width: 220px;
}
.status-badge {
  font-size: 11px;
  color: #258366;
  background: #edf7f2;
  border-radius: 5px;
  padding: 4px 8px;
}
.security-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.button-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 7px;
  font-size: 13px;
}
.button-link:hover {
  background: var(--color-blue-soft);
}
.backup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
.backup-grid > div + div {
  border-left: 1px solid var(--color-border);
  padding-left: 30px;
}
.backup-grid h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 9px;
}
.backup-grid p {
  font-size: 12px;
  color: var(--color-placeholder);
  margin-bottom: 16px;
  line-height: 1.8;
}
.backup-grid .backup-limit {
  background: #faf6ed;
  color: #896831;
  padding: 12px;
  border-radius: 7px;
}
fieldset {
  border: 0;
  display: grid;
  gap: 13px;
  padding: 14px;
  background: var(--color-surface-alt);
  border-radius: 7px;
  margin: 14px 0;
}
fieldset label {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  font-size: 12px;
}
fieldset input {
  margin-top: 4px;
}
fieldset small {
  display: block;
  font-size: 11px;
  color: var(--color-placeholder);
  margin-top: 3px;
}
.file-name {
  overflow-wrap: anywhere;
  margin-top: 10px;
}
.notice {
  margin: 16px 0;
}
@media (max-width: 1000px) {
  .backup-grid {
    grid-template-columns: 1fr;
  }
  .backup-grid > div + div {
    border-left: 0;
    border-top: 1px solid var(--color-border);
    padding: 24px 0 0;
  }
}
@media (max-width: 740px) {
  .settings-card {
    padding: 18px;
  }
  .page-head h1 {
  }
  dl > div {
    grid-template-columns: 70px minmax(0, 1fr);
    gap: 12px;
  }
  .nickname-form {
    grid-column: 1/-1;
  }
  .nickname-form input {
    width: 100%;
  }
}
</style>
