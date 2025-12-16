import { Routes, Route, Navigate } from "react-router-dom";
import RoomsPage from "./pages/RoomsPage.jsx";
import RoomPage from "./pages/RoomPage.jsx";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          Listening Rooms <span className="text-emerald-400 text-sm">test</span>
        </h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/rooms" replace />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
