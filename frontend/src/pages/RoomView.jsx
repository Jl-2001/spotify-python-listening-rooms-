import React from "react";
import { useState } from "react";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { useParams } from "../hooks/useRoomSocket";

export default function RoomView() {
  const { roomId } = useParams();
  const [input, setInput] = useState("");
  const username = "jorge";
  const { messages, sendChat } = useRoomSocket(roomId, username);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChat(input.trim());
    setInput("");
  };
  return (
    <div className="room">
      <h1>Room: {roomId}</h1>
      <section>
        <h2>Now plying (mock)</h2>
        <p>Track: lofi</p>
        <p>Artist: chill</p>
      </section>
      <section>
        <h2>chat</h2>
        <div
          style={{
            border: "1px solid #ccc",
            height: "200px",
            overflowY: "auto",
            padding: "0.5rem"
          }}
        >
          {messages.map((msg, i) => (
            <div key={i}>
              <strong>{msg.user}</strong>
              <span>{msg.message}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
          />
          <button type="submit">send</button>
        </form>
      </section>
    </div>
  );
}
