import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [hostName, setHostName] = useState("Jorge");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/rooms");
      setRooms(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("failed to load the rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const { data } = await api.post("/api/rooms/", {
        name,
        host_name: hostName || "Host"
      });
      setName("");
      setRooms((prev) => [data, ...prev]);
      navigate(`/rooms/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("failed to create room");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-2">Create a new Room</h2>
        <form
          onSubmit={handleCreateRoom}
          className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 max-w-md"
        >
          <div>
            <label className="block text-sm mb-1">Room name</label>
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lo-fi chill, Study session, etc."
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Host name</label>
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Your name or handle"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-medium px-4 py-2 transition-colors"
          >
            create and also join
          </button>
          {error && <p className="text-sm text-red-400 mt-1">error</p>}
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold"> join a room</h2>
          <button
            onClick={fetchRooms}
            className="text-xs text-slate-300 hover:text-white underline underline-offset-2"
          >
            refresh
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400">no rooms yet, create one</p>
        ) : (
          <div>
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/rooms/${room.id}`)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-left hover:border-emerald-500 hover:bg-slate-900/70 transition-colors"
              >
                <h3 className="font-medium mb-1">{room.name}</h3>
                <p className="text-xs text-slate-400">
                  Host: <span className="font-mono">{room.host_name}</span>
                </p>
                <p className="mt-3 text-[11px] text-slate-500">
                  click to join this room
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default RoomsPage;
