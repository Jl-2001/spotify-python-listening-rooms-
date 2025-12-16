import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import { useRoomSocket } from "../hooks/useRoomSocket";
import NowPlaying from "./NowPlaying";

function RoomPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myName, setMyName] = useState("guest");
  const [input, setInput] = useState("");

  const { messages, status, sendMessage } = useRoomSocket(roomId, myName);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await api.get(`/api/rooms/${roomId}`);
        setRoom(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(input);
    setInput("");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-400"> cant find room</p>
        <Link
          to="/rooms"
          className="text-sm text-emerald-400 underline underline-offset-2"
        >
          {" "}
          go back to the rooms
        </Link>
      </div>
    );
  }
  return (
    <div className="grid lg:grid-cols-[2fr_1.5fr] gap-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{room.name}</h2>
            <p className="text-xs text-slate-400">
              host: <span className="font-mono">{room.host_name}</span>
            </p>
          </div>
          <Link
            to="/rooms"
            className="text-xs text-slate-300 hover:text-white underline underline-offset-2"
          >
            back to rooms
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-center justify-between">
          <span>
            web socket status: {""}
            <span
              className={
                status === "connected"
                  ? "text-emerald-400"
                  : status === "connecting"
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            >
              {status}
            </span>
          </span>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs mb-1 text-slate-400">
              your name in chat
            </label>
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="Guest"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg h-[380px] flex flex-col">
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500">no messages</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-emerald-400 font-mono">
                      {msg.sender || "Anon"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString()
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-100">{msg.text}</p>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={handleSend}
            className="border-t border-slate-800 px-3 py-2 flex gap-2"
          >
            <input
              className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              type="submit"
              disabled={status !== "connected"}
              className="rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-900 text-sm font-medium px-4 py-2 transition-colors"
            >
              send
            </button>
          </form>
        </div>
      </section>
      <section className="space-y-4">
        <NowPlaying />
      </section>
    </div>
  );
}

export default RoomPage;
