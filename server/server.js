const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

// 📌 USERS FILE (Render safe path)
const USERS_FILE = path.join(__dirname, "users.json");

// 📌 Ensure file exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "{}");
}

let users = JSON.parse(fs.readFileSync(USERS_FILE));

// 📌 Save function (Render safe - no crash)
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Cannot write users.json on Render:", err);
  }
}

// 📌 Serve admin panel
app.use("/", express.static(path.join(__dirname, "admin-Panel")));
app.use(express.json());

// ---------- API ROUTES ----------


// 📌 Get users list
app.get("/api/users", (req, res) => {
  res.json(users);
});

// 📌 Send Message
app.post("/api/send", (req, res) => {
  const { message, userIds = [], meta = {} } = req.body;
  const now = new Date().toISOString();

  const targets = userIds.length ? userIds : Object.keys(users);

  targets.forEach(id => {
    if (users[id]) {
      users[id].lastMessage = message;
      users[id].lastMessageAt = now;
    }
    io.to(id).emit("message", { message, meta: { ...meta, sentAt: now } });
  });

  saveUsers();
  io.emit("users-updated", users);

  res.json({ deliveredTo: targets.length, sentAt: now });
});

// 📌 Deactivate user
app.post("/api/deactivate", (req, res) => {
  const { userId } = req.body;

  if (users[userId]) {
    delete users[userId];
    saveUsers();
    io.emit("users-updated", users);
    return res.json({ success: true, message: "User removed" });
  }

  res.json({ success: false, message: "User not found" });
});

// ---------- SOCKETS ----------
io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("register", data => {
    users[socket.id] = {
      id: socket.id,
      name: data.name,
      pcName: data.pcName,
      lastSeen: new Date().toISOString(),
      offline: false
    };
    saveUsers();
    io.emit("users-updated", users);
  });

  socket.on("heartbeat", () => {
    if (users[socket.id]) {
      users[socket.id].lastSeen = new Date().toISOString();
      users[socket.id].offline = false;
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

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
