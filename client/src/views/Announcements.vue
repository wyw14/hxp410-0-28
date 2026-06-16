<template>
  <div class="announcements-container">
    <div class="card">
      <div class="card-header">
        <span class="icon">📋</span>
        <h2>公告列表</h2>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在加载公告...</p>
      </div>

      <div v-else-if="announcements.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无公告</p>
      </div>

      <div v-else class="announcements-list">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement-item"
          :class="{ inactive: announcement.status === 'inactive' }"
        >
          <div class="announcement-item-header">
            <h3 class="announcement-item-title">{{ announcement.title }}</h3>
            <span class="status-badge" :class="announcement.status">
              {{ announcement.status === 'active' ? '已启用' : '已停用' }}
            </span>
          </div>
          <p class="announcement-item-content">{{ announcement.content }}</p>
          <div class="announcement-item-footer">
            <span class="date">发布时间: {{ formatDate(announcement.createdAt) }}</span>
            <span v-if="announcement.updatedAt !== announcement.createdAt" class="date">
              更新时间: {{ formatDate(announcement.updatedAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(true)
const announcements = ref([])

function formatDate(dateString) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

async function fetchAnnouncements() {
  loading.value = true
  try {
    const response = await fetch('/api/announcements')
    const data = await response.json()
    announcements.value = data.announcements
  } catch (error) {
    console.error('获取公告列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<style scoped>
.announcements-container {
  width: 100%;
  max-width: 700px;
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

.loading {
  text-align: center;
  padding: 60px 20px;
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
  padding: 60px 20px;
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

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-item {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.announcement-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.announcement-item.inactive {
  opacity: 0.6;
  background: #f0f0f0;
}

.announcement-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.announcement-item-title {
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

.announcement-item-content {
  font-size: 15px;
  line-height: 1.7;
  color: #555;
  margin: 0 0 12px 0;
}

.announcement-item-footer {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.date {
  font-size: 13px;
  color: #999;
}
</style>
