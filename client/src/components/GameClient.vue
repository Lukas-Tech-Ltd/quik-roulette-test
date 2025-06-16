<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useHistory } from '@/composables/useHistory'
import { getSocket } from '@/socket/socket'

const { addToHistory } = useHistory()
const socket = getSocket()

const getTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

onMounted(() => {
  socket.on('connect', () => {
    const time = getTime(new Date(Date.now()))
    addToHistory(`${time}: Connected`)
  })

  socket.on('message', (packet) => {
    const { event, data } = packet

    if (event === 'result') {
      console.log('[Client] Result:', packet)
      const { result } = data

      const time = getTime(new Date(result.createdAt))
      addToHistory(`${time}: Result: ${result.result}`)
      if (result.totalWin > 0) {
        addToHistory(`${time}: ${result.playerId} won ${result.totalWin}!`)
      }
    }
  })
})

onUnmounted(() => {
  socket.off('connect')
  socket.off('message')
})
</script>

<template>
  <!-- -->
</template>

<style scoped>
.game-client-controls {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 12px;
  border-radius: 6px;
}
input {
  padding: 6px;
  font-size: 0.95rem;
  width: 200px;
}
button {
  padding: 6px 12px;
  font-size: 0.95rem;
}
</style>
