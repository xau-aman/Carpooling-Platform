import { io, Socket } from 'socket.io-client'
import { tokenStore } from './tokenStore'

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://10.24.142.126:3001'

let socket: Socket | null = null
let _userId: string | null = null

export function setSocketUserId(userId: string) {
  _userId = userId
  // If already connected, join immediately
  if (socket?.connected) socket.emit('user:join', userId)
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket
  if (socket) { socket.disconnect(); socket = null }

  socket = io(SERVER_URL, {
    auth: { token: tokenStore.get() },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    socket!.auth = { token: tokenStore.get() }
    // Always re-join personal room on connect/reconnect so notifications arrive
    if (_userId) socket!.emit('user:join', _userId)
  })

  return socket
}

export function getSocket(): Socket {
  return socket?.connected ? socket : connectSocket()
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
