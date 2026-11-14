import { io, type Socket } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';

export const socket: Socket = io(socketUrl, { autoConnect: false });

export function connectSocket(token: string) {
  if (socket.active) socket.disconnect();
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  if (socket.active) socket.disconnect();
}
