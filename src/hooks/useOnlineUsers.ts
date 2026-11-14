import { useEffect, useState } from 'react';
import { socket } from '@/services/socket';

interface PresenceEvent {
  userId: number;
}

export function useOnlineUsers() {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const refresh = () => {
      socket.emit('users:get_online', (ids: number[]) => {
        if (Array.isArray(ids)) setOnlineUserIds(new Set(ids.filter(Number.isSafeInteger)));
      });
    };
    const markOnline = ({ userId }: PresenceEvent) => {
      if (!Number.isSafeInteger(userId)) return;
      setOnlineUserIds((current) => new Set(current).add(userId));
    };
    const markOffline = ({ userId }: PresenceEvent) => {
      setOnlineUserIds((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    };
    const clearPresence = () => setOnlineUserIds(new Set());

    socket.on('connect', refresh);
    socket.on('user:online', markOnline);
    socket.on('user:offline', markOffline);
    socket.on('disconnect', clearPresence);
    if (socket.connected) refresh();

    return () => {
      socket.off('connect', refresh);
      socket.off('user:online', markOnline);
      socket.off('user:offline', markOffline);
      socket.off('disconnect', clearPresence);
    };
  }, []);

  return onlineUserIds;
}
