import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "PC-" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("deviceId", id);
  }
  return id;
}

function App() {
  const [savedName, setSavedName] = useState(null);
  const [tempName, setTempName] = useState("");
  const [connected, setConnected] = useState(false);

  const deviceId = getDeviceId();

  // Load saved name when app starts
  useEffect(() => {
    const name = localStorage.getItem("clientName");
    if (name) {
      setSavedName(name);  // <- this ensures cyber UI is shown always
    }
  }, []);

  // Connect socket only if name is saved
  useEffect(() => {
    if (!savedName) return;

    const socket = io("https://notification-window-app-backend.onrender.com");

    socket.on("connect", () => {
      setConnected(true);

      socket.emit("register", {
        deviceId,
        name: savedName,
        pcName: navigator.userAgent
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("message", (d) => {

  // Always show notification
  window.api.notify({
    title: d.meta.from || "Message",
    body: d.message
  });

  // 🔥 Speak only if backend NOTE says "speak = true"
  if (d.meta.speak) {
    try {
      const voice = new SpeechSynthesisUtterance(d.message);
      speechSynthesis.speak(voice);
    } catch (e) {}
  }
});

    const hb = setInterval(() => {
      socket.emit("heartbeat");
    }, 30000);

    return () => {
      clearInterval(hb);
      socket.disconnect();
    };
  }, [savedName]);

  // Save name (first time only)
  const saveNameFunc = () => {
    if (!tempName.trim()) return alert("Please enter your name!");

    localStorage.setItem("clientName", tempName);
    setSavedName(tempName);   // <- Now input UI never shows again
  };

  // IF NO NAME → INPUT PAGE
  if (!savedName) {
    return (
      <div className="wrapper">
        <div className="card">
          <h2 className="title">🔔 Notification Client</h2>
          <h4 className="subtitle">Enter your name</h4>

          <input
            className="input-box"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Your name..."
          />

          <button className="primary-btn" onClick={saveNameFunc}>
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  // IF NAME SAVED → ALWAYS CYBER UI
  return (
    <div className="wrapper">
      <div className="card">
        <h2 className="title">👋 Welcome, {savedName}!</h2>

        <p>
          Status:
          <span
            className="badge"
            style={{ background: connected ? "#28a745" : "#d9534f" }}
          >
            {connected ? "Connected" : "Reconnecting..."}
          </span>
        </p>

        <div className="info-box">
          <h4 className="info-title">🔐 Cyber Security Awareness</h4>
          <ul className="info-list">
            <li>❌ Never share OTP, PIN or Password.</li>
            <li>🚫 Avoid unknown links.</li>
            <li>⚠️ Beware of fake bank calls.</li>
            <li>💳 Never share card details.</li>
            <li>🛡 Enable 2-Factor Authentication.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
