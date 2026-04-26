import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket() {
  const wsRef        = useRef(null);
  const [status, setStatus] = useState("idle");
  // listeners: { [type]: fn }  — one handler per type, replaced on re-register
  // We use a separate stable ref so the ws.onmessage closure always reads
  // the *latest* handler without needing to recreate the socket.
  const listenersRef = useRef({});

  // on() just writes into the ref — no re-render, no stale closure issues
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

      // Always reads listenersRef.current at call time — never stale
      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }

        console.log("[ws] ←", msg.type, msg); // debug — remove when stable

        const handler  = listenersRef.current[msg.type];
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

  const setConnected = useCallback(() => setStatus("connected"), []);

  useEffect(() => () => wsRef.current?.close(), []);

  return { connect, send, disconnect, status, setConnected, on, off };
}