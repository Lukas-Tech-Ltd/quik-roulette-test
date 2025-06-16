import { ref } from 'vue'

const history = ref<string[]>([])

export function useHistory() {
  function addToHistory(message: string) {
    history.value.unshift(message)
    if (history.value.length > 10) {
      history.value.pop()
    }
  }

  return {
    history,
    addToHistory,
  }
}
