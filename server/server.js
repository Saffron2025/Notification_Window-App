const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// USERS FILE
const USERS_FILE = path.join(__dirname, "users.json");

// Ensure users.json exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "{}");
}

let users = JSON.parse(fs.readFileSync(USERS_FILE));

// Save users
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.log("File write error", e);
  }
}

// Serve admin panel
app.use("/", express.static(path.join(__dirname, "admin-Panel")));
app.use(express.json());


// 🔥 SPEAK TOGGLE API (VERY IMPORTANT)
app.post("/api/toggleSpeak", (req, res) => {
  const { userId, speak } = req.body;

  if (users[userId]) {
    users[userId].speak = speak;
    saveUsers();
    io.emit("users-updated", users);
    return res.json({ success: true });
  }

  res.json({ success: false });
});


// GET USERS
app.get("/api/users", (req, res) => {
  res.json(users);
});


// SEND MESSAGE API
app.post("/api/send", (req, res) => {
  const { message, userIds = [], meta = {} } = req.body;
  const now = new Date().toISOString();

  const targets = userIds.length ? userIds : Object.keys(users);

  targets.forEach(id => {
    if (users[id]) {
      users[id].lastMessage = message;
      users[id].lastMessageAt = now;
    }

    io.to(id).emit("message", {
      message,
      meta: {
        ...meta,
        speak: users[id]?.speak ?? false,   // 🔥 PER USER VOICE CONTROL
        sentAt: now
      }
    });
  });

  saveUsers();
  io.emit("users-updated", users);

  res.json({ success: true, deliveredTo: targets.length });
});


// DEACTIVATE USER
app.post("/api/deactivate", (req, res) => {
  const { userId } = req.body;

  if (users[userId]) {
    delete users[userId];
    saveUsers();
    io.emit("users-updated", users);
    return res.json({ success: true });
  }

  res.json({ success: false });
});


// SOCKET HANDLING
io.on("connection", socket => {
  console.log("Connected:", socket.id);

  socket.on("register", data => {
    const { deviceId, name, pcName } = data;

    let existing = Object.values(users).find(u => u.deviceId === deviceId);

    if (existing) {
      delete users[existing.id];

      existing.id = socket.id;
      existing.offline = false;
      existing.lastSeen = new Date().toISOString();

      users[socket.id] = existing;
    } else {
      users[socket.id] = {
        id: socket.id,
        deviceId,
        name,
        pcName,
        offline: false,
        speak: false, // 🔥 default voice = OFF
        lastSeen: new Date().toISOString()
      };
    }

    saveUsers();
    io.emit("users-updated", users);
  });

  socket.on("heartbeat", () => {
    if (users[socket.id]) {
      users[socket.id].offline = false;
      users[socket.id].lastSeen = new Date().toISOString();
      saveUsers();
      io.emit("users-updated", users);
    }
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      users[socket.id].offline = true;
      users[socket.id].lastSeen = new Date().toISOString();
      saveUsers();
      io.emit("users-updated", users);
    }
  });
});


// Render keep alive
app.get("/ping", (req, res) => res.send("pong"));

server.listen(process.env.PORT || 5000, () =>
  console.log("Server running")
);
