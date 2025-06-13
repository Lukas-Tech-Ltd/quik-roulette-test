// src/lib/socket.ts
import { io, Socket } from 'socket.io-client'

interface GameSocket extends Socket {}

let socket: GameSocket | null = null

export function getSocket(): GameSocket {
  if (socket) {
    return socket
  }
  const searchParams = new URLSearchParams(window.location.search)
  const userId = searchParams.get('userId')?.replace(/\/$/, '') || 'QuickClient'
  const pass = searchParams.get('pass')?.replace(/\/$/, '') || 'MySuperSecurePassword123'

  socket = io('http://localhost:3000', {
    transports: ['websocket'],
    auth: { userId, pass },
  })

  return socket
}
