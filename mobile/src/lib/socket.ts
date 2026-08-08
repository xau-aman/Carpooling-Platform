import { io, Socket } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://10.24.142.126:3001'

let socket: Socket | null = null

export function connectSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('wz_token')
    socket = io(SERVER_URL, {
      auth: { token },
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
