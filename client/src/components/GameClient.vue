<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useHistory } from '@/composables/useHistory'
import { getSocket } from '@/socket/socket'

const { addToHistory } = useHistory()
const socket = getSocket()
const lastResult = ref()

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
      console.log('[Client] Message:', packet)
      const { result } = data
      lastResult.value = result
    } else if (event === 'state' && data.state === 'idle') {
      if (lastResult.value) {
        const time = getTime(new Date(lastResult.value.createdAt))
        addToHistory(`${time}: Result: ${lastResult.value.result}`)
        if (lastResult.value.totalWin > 0) {
          addToHistory(`${time}: ${lastResult.value.playerId} won ${lastResult.value.totalWin}!`)
        }
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
