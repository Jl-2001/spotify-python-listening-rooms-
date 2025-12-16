import React from "react";
import { useEffect, useState } from "react";
import api from "../api";

function formatTime(ms) {
  if (ms == null) return "";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} : ${seconds.toString().padStart(2, "0")}`;
}

export default function NowPlaying() {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNowPlaying = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/spotify/now-playing");
      setNowPlaying(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("failed to load now playing", err);
      setError("failed to load now playing");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    if (error) {
      return <p className="text-xs text-red-400">{error}</p>;
    }
    if (!nowPlaying) {
      return (
        <p className="text-xs text-slate-400">
          connect spotify on the backend and play track soon
        </p>
      );
    }

    if (nowPlaying.is_playing === false) {
      return (
        <p className="text-xs text-slate-400">
          nothing is playing right now, start a song on spotify to update
        </p>
      );
    }
    const progress = nowPlaying.progress_ms || 0;
    const duration = nowPlaying.duration_ms || 1;
    const percent = Math.min(100, Math.max(0, (progress / duration) * 100));

    return (
      <div className="space-y-3">
        <div className="flex gap-3">
          {nowPlaying.album_image && (
            <img
              src={nowPlaying.album_image}
              alt={nowPlaying.album_name || "album art"}
              className="w-16 h-16 rounded-md object-cover"
            />
          )}

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-50">
              {nowPlaying.track_name || "unknown track"}
            </p>
            <p className="text-xs text-emerald-300">
              {nowPlaying.artists || "unknown artist"}
            </p>
            <p className="text-[11px] text-slate-400">
              {nowPlaying.album_name}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">
          now playing (Spotify)
        </h3>
        <button
          onClick={fetchNowPlaying}
          disabled={loading}
          className="text-sm font-semibold text-slate-100"
        >
          {loading ? "refreshing..." : "refresh"}
        </button>
      </div>

      {lastUpdated && (
        <p className="text-[10px] text-slate-500">
          last updated : {lastUpdated.toLocaleTimeString()}
        </p>
      )}
      {renderContent()}
    </div>
  );
}
