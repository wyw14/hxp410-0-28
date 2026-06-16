<template>
  <div class="admin-container">
    <div v-if="!isLoggedIn" class="card login-card">
      <div class="card-header">
        <span class="icon">🔐</span>
        <h2>管理员登录</h2>
      </div>

      <div class="form-group">
        <label>管理员密码</label>
        <input
          type="password"
          v-model="password"
          @keyup.enter="login"
          class="input"
          placeholder="请输入管理员密码"
        />
      </div>

      <p v-if="loginError" class="error-message">{{ loginError }}</p>

      <button class="btn btn-primary" @click="login" :disabled="loggingIn">
        {{ loggingIn ? '登录中...' : '登录' }}
      </button>
    </div>

    <div v-else class="admin-content">
      <div class="card">
        <div class="card-header">
          <span class="icon">📝</span>
          <h2>发布新公告</h2>
        </div>

        <div class="form-group">
          <label>公告标题</label>
          <input
            type="text"
            v-model="newAnnouncement.title"
            class="input"
            placeholder="请输入公告标题"
          />
        </div>

        <div class="form-group">
          <label>公告内容</label>
          <textarea
            v-model="newAnnouncement.content"
            class="textarea"
            rows="4"
            placeholder="请输入公告内容"
          ></textarea>
        </div>

        <p v-if="publishError" class="error-message">{{ publishError }}</p>
        <p v-if="publishSuccess" class="success-message">{{ publishSuccess }}</p>

        <button class="btn btn-primary" @click="publishAnnouncement" :disabled="publishing">
          {{ publishing ? '发布中...' : '发布公告' }}
        </button>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="icon">📋</span>
          <h2>公告管理</h2>
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>正在加载公告...</p>
        </div>

        <div v-else-if="announcements.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>暂无公告</p>
        </div>

        <div v-else class="admin-announcements-list">
          <div
            v-for="announcement in announcements"
            :key="announcement.id"
            class="admin-announcement-item"
            :class="{ inactive: announcement.status === 'inactive' }"
          >
            <div class="admin-announcement-header">
              <h3 class="admin-announcement-title">{{ announcement.title }}</h3>
              <span class="status-badge" :class="announcement.status">
                {{ announcement.status === 'active' ? '已启用' : '已停用' }}
              </span>
            </div>
            <p class="admin-announcement-content">{{ announcement.content }}</p>
            <div class="admin-announcement-footer">
              <span class="date">发布: {{ formatDate(announcement.createdAt) }}</span>
              <div class="actions">
                <button
                  v-if="announcement.status === 'active'"
                  class="btn btn-warning btn-sm"
                  @click="deactivateAnnouncement(announcement.id)"
                >
                  停用
                </button>
                <button
                  v-else
                  class="btn btn-success btn-sm"
                  @click="activateAnnouncement(announcement.id)"
                >
                  恢复
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-secondary logout-btn" @click="logout">
        退出登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(false)
const password = ref('')
const loginError = ref('')
const loggingIn = ref(false)
const loading = ref(true)
const publishing = ref(false)
const publishError = ref('')
const publishSuccess = ref('')
const announcements = ref([])
const newAnnouncement = ref({
  title: '',
  content: ''
})

function formatDate(dateString) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

async function login() {
  if (!password.value.trim()) {
    loginError.value = '请输入密码'
    return
  }

  loggingIn.value = true
  loginError.value = ''

  try {
    const response = await fetch('/api/announcements', {
      headers: {
        'x-admin-password': password.value
      }
    })

    if (response.status === 403) {
      loginError.value = '密码错误，请重试'
    } else {
      localStorage.setItem('adminPassword', password.value)
      isLoggedIn.value = true
      fetchAnnouncements()
    }
  } catch (error) {
    loginError.value = '网络错误，请稍后重试'
  } finally {
    loggingIn.value = false
  }
}

function logout() {
  localStorage.removeItem('adminPassword')
  isLoggedIn.value = false
  password.value = ''
  router.push('/')
}

async function fetchAnnouncements() {
  loading.value = true
  try {
    const adminPassword = localStorage.getItem('adminPassword')
    const response = await fetch('/api/announcements', {
      headers: {
        'x-admin-password': adminPassword
      }
    })
    const data = await response.json()
    announcements.value = data.announcements
  } catch (error) {
    console.error('获取公告列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function publishAnnouncement() {
  publishError.value = ''
  publishSuccess.value = ''

  if (!newAnnouncement.value.title.trim()) {
    publishError.value = '请输入公告标题'
    return
  }
  if (!newAnnouncement.value.content.trim()) {
    publishError.value = '请输入公告内容'
    return
  }

  publishing.value = true

  try {
    const adminPassword = localStorage.getItem('adminPassword')
    const response = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({
        title: newAnnouncement.value.title,
        content: newAnnouncement.value.content
      })
    })

    const data = await response.json()

    if (response.ok) {
      publishSuccess.value = data.message
      newAnnouncement.value = { title: '', content: '' }
      fetchAnnouncements()
      setTimeout(() => {
        publishSuccess.value = ''
      }, 3000)
    } else {
      publishError.value = data.error || '发布失败'
    }
  } catch (error) {
    publishError.value = '网络错误，请稍后重试'
  } finally {
    publishing.value = false
  }
}

async function deactivateAnnouncement(id) {
  try {
    const adminPassword = localStorage.getItem('adminPassword')
    const response = await fetch(`/api/admin/announcements/${id}/deactivate`, {
      method: 'PUT',
      headers: {
        'x-admin-password': adminPassword
      }
    })

    if (response.ok) {
      fetchAnnouncements()
    }
  } catch (error) {
    console.error('停用公告失败:', error)
  }
}

async function activateAnnouncement(id) {
  try {
    const adminPassword = localStorage.getItem('adminPassword')
    const response = await fetch(`/api/admin/announcements/${id}/activate`, {
      method: 'PUT',
      headers: {
        'x-admin-password': adminPassword
      }
    })

    if (response.ok) {
      fetchAnnouncements()
    }
  } catch (error) {
    console.error('恢复公告失败:', error)
  }
}

onMounted(() => {
  const savedPassword = localStorage.getItem('adminPassword')
  if (savedPassword) {
    password.value = savedPassword
    login()
  }
})
</script>

<style scoped>
.admin-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-card {
  max-width: 400px;
  margin: 0 auto;
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.card-header h2 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.input,
.textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 100px;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 15px;
}

.success-message {
  color: #27ae60;
  font-size: 14px;
  margin-bottom: 15px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 20px;
}

.empty-state p {
  color: #666;
  font-size: 16px;
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-announcement-item {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.admin-announcement-item.inactive {
  opacity: 0.6;
  background: #f0f0f0;
}

.admin-announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.admin-announcement-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.active {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #2d5a4a;
}

.status-badge.inactive {
  background: #e0e0e0;
  color: #666;
}

.admin-announcement-content {
  font-size: 15px;
  line-height: 1.7;
  color: #555;
  margin: 0 0 12px 0;
}

.admin-announcement-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.date {
  font-size: 13px;
  color: #999;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.btn-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(240, 147, 251, 0.4);
}

.btn-warning:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-success {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #2d5a4a;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(132, 250, 176, 0.4);
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.logout-btn {
  align-self: center;
  margin-top: 10px;
}
</style>
