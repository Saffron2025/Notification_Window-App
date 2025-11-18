import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://notification-window-app-backend.onrender.com");

function App() {
  const [name, setName] = useState(localStorage.getItem("clientName") || "");
  const [connected, setConnected] = useState(false);

  // This ensures input always visible
  const [tempName, setTempName] = useState(name);

  const saveName = () => {
    if (!tempName.trim()) return;
    localStorage.setItem("clientName", tempName);
    setName(tempName);
    window.location.reload();
  };

  useEffect(() => {
    if (!name) return;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("register", {
        name,
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

    setInterval(() => socket.emit("heartbeat"), 30000);
  }, [name]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Notification Client</h2>

      <h3>Enter Your Name</h3>

      <input
        value={tempName}
        placeholder="Enter your name"
        onChange={(e) => setTempName(e.target.value)}
      />

      <button onClick={saveName}>Save</button>

      {name && (
        <div style={{ marginTop: 20 }}>
          <p><b>Name:</b> {name}</p>
          <p>Status: {connected ? "Connected" : "Connecting..."}</p>
        </div>
      )}
    </div>
  );
}

export default App;
