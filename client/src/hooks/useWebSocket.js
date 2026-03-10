import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket(url) {
  const wsRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | disconnected
  const listenersRef = useRef({});

  const on = useCallback((type, fn) => {
    listenersRef.current[type] = fn;
  }, []);

  const off = useCallback((type) => {
    delete listenersRef.current[type];
  }, []);

  const connect = useCallback((wsUrl) => {
    if (wsRef.current) wsRef.current.close();
    setStatus("connecting");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ws] connected to", wsUrl);
      };

      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        const handler = listenersRef.current[msg.type];
        if (handler) handler(msg);
        const wildcard = listenersRef.current["*"];
        if (wildcard) wildcard(msg);
      };

      ws.onclose = () => {
        setStatus("disconnected");
        console.log("[ws] disconnected");
      };

      ws.onerror = (e) => {
        setStatus("disconnected");
        console.error("[ws] error", e);
      };

    } catch (err) {
      setStatus("disconnected");
      console.error("[ws] failed to connect", err);
    }
  }, []);

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("idle");
  }, []);

  // Expose a way to update status from outside (used when joined)
  const setConnected = useCallback(() => setStatus("connected"), []);

  useEffect(() => () => wsRef.current?.close(), []);

  return { connect, send, disconnect, status, setConnected, on, off };
}
