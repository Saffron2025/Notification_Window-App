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

// Save users to file
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {}
}

// Serve admin panel
app.use("/", express.static(path.join(__dirname, "admin-Panel")));
app.use(express.json());

// Get Users API
app.get("/api/users", (req, res) => {
  res.json(users);
});

// Send Message API
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
      meta: { ...meta, sentAt: now }
    });
  });

  saveUsers();
  io.emit("users-updated", users);

  res.json({ success: true, deliveredTo: targets.length });
});

// Deactivate user
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

    // Check if this deviceId already exists
    let existing = Object.values(users).find(u => u.deviceId === deviceId);

    if (existing) {
      // remove old entry
      delete users[existing.id];

      // update with new socketId
      existing.id = socket.id;
      existing.lastSeen = new Date().toISOString();
      existing.offline = false;

      users[socket.id] = existing;
    } else {
      // First time user
      users[socket.id] = {
        id: socket.id,
        deviceId,
        name,
        pcName,
        offline: false,
        lastSeen: new Date().toISOString()
      };
    }

    saveUsers();
    io.emit("users-updated", users);
  });

  // HEARTBEAT (every 30 seconds)
  socket.on("heartbeat", () => {
    if (users[socket.id]) {
      users[socket.id].lastSeen = new Date().toISOString();
      users[socket.id].offline = false;
      saveUsers();
      io.emit("users-updated", users);
    }
  });

  // DISCONNECT = PC OFF / APP CLOSED
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on port", PORT));
