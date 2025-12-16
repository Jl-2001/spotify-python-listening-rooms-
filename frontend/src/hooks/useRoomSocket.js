import { useEffect, useState, useRef } from "react";

export function useRoomSocket(roomId, username) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("disconnected");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    console.log("[WS] creating socket for room:", roomId);
    setStatus("connecting");

    const ws = new WebSocket(`ws://localhost:8000/ws/rooms/${roomId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] open");
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[WS] message:", data);
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("Invalid message from server:", event.data);
      }
    };

    ws.onerror = (event) => {
      console.error("web socket error:", event);
      console.log("readyState at error:", ws.readyState);
      setStatus("disconnected");
    };

    ws.onclose = (event) => {
      console.log("web socket closed:", event.code, event.reason);
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const sendMessage = (text) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[WS] tried to send while socket not open");
      return;
    }
    const payload = {
      sender: username,
      text,
      timestamp: new Date().toISOString()
    };
    socketRef.current.send(JSON.stringify(payload));
  };
  return { messages, status, sendMessage };
}
