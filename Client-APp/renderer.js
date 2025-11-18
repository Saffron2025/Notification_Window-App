const io = require("socket.io-client");

let socket;

function connect(name) {
  socket = io("https://notification-window-app-backend.onrender.com");

  socket.on("connect", () => {
    document.getElementById("status").innerText = "Connected!";
    socket.emit("register", {
      name,
      pcName: navigator.userAgent
    });
  });

  socket.on("message", (d) => {
    api.notify({ title: d.meta.from || "Message", body: d.message });

    const speak = new SpeechSynthesisUtterance(d.message);
    speechSynthesis.speak(speak);
  });

  setInterval(() => socket.emit("heartbeat"), 30000);
}

window.saveName = () => {
  const name = document.getElementById("nameInput").value;
  localStorage.setItem("clientName", name);
  connect(name);
};

window.onload = () => {
  const saved = localStorage.getItem("clientName");
  if (saved) {
    document.getElementById("nameInput").value = saved;
    connect(saved);
  }
};
