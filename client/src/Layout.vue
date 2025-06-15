<template>
  <div class="layout-container">
    <div class="iframe-container">
      <!-- Placeholder iframe -->
      <iframe id="game-iframe" class="game-iframe" src="" frameborder="0" allowfullscreen></iframe>
      <GameClient />
    </div>

    <div :class="['history-panel', { open: historyOpen }]">
      <div class="history-header">
        <h2>History</h2>
        <button @click="toggleHistory" class="close-btn">×</button>
      </div>
      <ul class="history-list">
        <li v-for="(item, index) in history" :key="index">{{ item }}</li>
      </ul>
    </div>

    <button class="history-toggle" @click="toggleHistory">☰ History</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useHistory } from '@/composables/useHistory'
import GameClient from '@/components/GameClient.vue'

const { history } = useHistory()
const historyOpen = ref(false)
const iframe = ref<HTMLIFrameElement>()

const toggleHistory = () => {
  historyOpen.value = !historyOpen.value
}

onMounted(() => {
  window.addEventListener('load', () => {
    if (!iframe.value) {
      iframe.value = document.getElementById('game-iframe') as HTMLIFrameElement
      if (iframe.value) {
        iframe.value.src = 'http://localhost:5174'
      }
    }
  })
})
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.iframe-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #111;
  box-sizing: border-box;
}

.game-iframe {
  height: 95%;
  aspect-ratio: 9 / 16;
  max-width: 100%;
  border: none;
  background: #111;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  border-radius: 8px;
}

.history-panel {
  width: 300px;
  background: #fdfdfd;
  border-left: 1px solid #e0e0e0;
  padding: 1rem;
  overflow-y: auto;
  transition: transform 0.3s ease;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

.history-header h2 {
  font-size: 1.25rem;
  color: #333;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #000;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.history-list li {
  background: #f5f5f5;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #333;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background 0.3s;
}

.history-list li:hover {
  background: #eaeaea;
}

/* Mobile: slide-in panel */
@media (max-width: 768px) {
  .history-panel {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    transform: translateX(100%);
    z-index: 10;
  }

  .history-panel.open {
    transform: translateX(0);
  }

  .history-toggle {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 20;
    background: #444;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  }
}

/* Desktop always open */
@media (min-width: 769px) {
  .history-toggle {
    display: none;
  }

  .history-panel {
    position: static;
    transform: none !important;
  }
}

.history-list {
  margin-top: 1rem;
  list-style: none;
  padding: 0;
}

.history-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #ddd;
  font-size: 0.95rem;
}
</style>
