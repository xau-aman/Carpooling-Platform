import { io, Socket } from 'socket.io-client'
import { tokenStore } from './tokenStore'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      auth: { token: tokenStore.get() },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // Refresh auth token on every reconnect attempt (token may have rotated)
    socket.on('reconnect_attempt', () => {
      socket!.auth = { token: tokenStore.get() }
    })
  }
  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
