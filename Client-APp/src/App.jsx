import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function App() {
  const savedName = localStorage.getItem("clientName"); // IMPORTANT
  const [connected, setConnected] = useState(false);
  const [tempName, setTempName] = useState("");

  // --- CONNECT SOCKET ONLY IF NAME EXISTS ---
  useEffect(() => {
    if (!savedName) return;

    const socket = io("https://notification-window-app-backend.onrender.com");

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("register", {
        name: savedName,
        pcName: navigator.userAgent
      });
    });

    socket.on("message", (d) => {
      window.api.notify({
        title: d.meta.from || "Message",
        body: d.message
      });

      const speak = new SpeechSynthesisUtterance(d.message);
      speechSynthesis.speak(speak);
    });

    const interval = setInterval(() => socket.emit("heartbeat"), 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [savedName]);

  // --- SAVE NAME ---
  const saveName = () => {
    if (!tempName.trim()) return alert("Please enter your name!");
    localStorage.setItem("clientName", tempName);
    window.location.reload();
  };

  // --------------------------------------------
  //  FIRST TIME USER — SHOW INPUT SCREEN
  // --------------------------------------------
  if (!savedName) {
    return (
      <div className="wrapper">
        <div className="card">
          <h2 className="title">🔔 Notification Client</h2>
          <h4 className="subtitle">Enter your name to continue</h4>

          <input
            className="input-box"
            placeholder="Type your name..."
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
          />

          <button className="primary-btn" onClick={saveName}>
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------
  //  RETURNING USER — SHOW WELCOME SCREEN ONLY
  // --------------------------------------------
  return (
    <div className="wrapper">
      <div className="card">
        <h2 className="title">👋 Welcome back, {savedName}!</h2>

        <p className="info-text">Your secure notification client is active.</p>

        <p className="info-text">
          Status:
          <span
            className="badge"
            style={{ background: connected ? "#28a745" : "#d9534f" }}
          >
            {connected ? "Connected" : "Connecting..."}
          </span>
        </p>

        <div className="info-box">
          <h4 className="info-title">🔐 Cyber Security Awareness</h4>
          <ul className="info-list">
            <li>❌ Never share OTP, PIN or Password.</li>
            <li>🚫 Avoid unknown links or attachments.</li>
            <li>⚠️ Beware of fake bank or company calls.</li>
            <li>💳 Banks never ask card details on call.</li>
            <li>🛡 Enable 2-factor authentication.</li>
            <li>📞 Report scams to helpline 1930.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
