// super-admin/hooks/use-websocket.ts
// WebSocket hook для real-time событий от бэкенда

import { useEffect, useRef, useCallback, useState } from 'react';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081';

export type WebSocketEventType =
  | 'device_update'
  | 'transaction_started'
  | 'transaction_stopped'
  | 'transaction_update'
  | 'connector_status'
  | 'admin_command_update'
  | 'station_connected'
  | 'station_disconnected';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: Record<string, any>;
  timestamp?: string;
}

type EventCallback = (event: WebSocketEvent) => void;

export interface UseWebSocketOptions {
  autoReconnect?: boolean;
  reconnectMs?: number;
  token?: string | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoReconnect = true, reconnectMs = 3000, token } = options;
  
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (!token) {
      console.warn('[WebSocket] No token provided, skipping connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      const url = `${WS_BASE_URL}/ws?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        reconnectAttempts.current = 0;
        
        // Автоматически подписываемся на все события
        ws.send(JSON.stringify({
          action: 'subscribe',
          payload: {}
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          
          // Обрабатываем событие connected
          if (message.type === 'connected') {
            console.log('[WebSocket] Server confirmed connection');
            return;
          }

          // Вызываем все подписчики на этот тип события
          const listeners = listenersRef.current.get(message.type);
          if (listeners) {
            listeners.forEach(cb => cb(message));
          }

          // Также вызываем подписчиков на 'all' для всех событий
          const allListeners = listenersRef.current.get('all');
          if (allListeners) {
            allListeners.forEach(cb => cb(message));
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code, event.reason);
        setConnected(false);
        wsRef.current = null;

        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`[WebSocket] Reconnecting in ${reconnectMs}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          reconnectTimer.current = window.setTimeout(() => {
            connect();
          }, reconnectMs);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [token, autoReconnect, reconnectMs]);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, token]);

  const subscribe = useCallback((eventType: WebSocketEventType | 'all', callback: EventCallback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(callback);

    // Возвращаем функцию отписки
    return () => {
      const listeners = listenersRef.current.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }, []);

  const send = useCallback((action: string, payload: any) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action, payload }));
      return true;
    }
    console.warn('[WebSocket] Cannot send message: not connected');
    return false;
  }, []);

  const sendSubscribe = useCallback((stationId?: string, eventType?: string) => {
    return send('subscribe', { stationId, eventType });
  }, [send]);

  const sendUnsubscribe = useCallback((stationId?: string) => {
    return send('unsubscribe', { stationId });
  }, [send]);

  const sendRemoteStart = useCallback((stationId: string, connectorId: number, idTag?: string) => {
    return send('remote_start', { stationId, connectorId, idTag });
  }, [send]);

  const sendRemoteStop = useCallback((stationId: string, connectorId: number, transactionId?: string) => {
    return send('remote_stop', { stationId, connectorId, transactionId });
  }, [send]);

  return {
    connected,
    subscribe,
    send,
    sendSubscribe,
    sendUnsubscribe,
    sendRemoteStart,
    sendRemoteStop,
  };
}

