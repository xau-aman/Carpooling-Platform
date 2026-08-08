import { io, Socket } from 'socket.io-client'
import { tokenStore } from './tokenStore'

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://10.24.142.126:3001'

let socket: Socket | null = null

export function connectSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      auth: { token: tokenStore.get() },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })
  }
  return socket
}

export function getSocket(): Socket {
  return socket || connectSocket()
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
