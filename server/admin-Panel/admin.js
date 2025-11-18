// Connect socket.io (for live user updates)
const socket = io();
const usersDiv = document.getElementById("users");

// Fetch all users initially
async function loadUsers() {
  const res = await fetch("/api/users");
  const users = await res.json();
  renderUsers(users);
}

// Convert timestamp to readable format
function format(t) {
  return t ? new Date(t).toLocaleString() : "-";
}

// Render users in admin panel
function renderUsers(users) {
  usersDiv.innerHTML = "";
  Object.values(users).forEach(u => {
    usersDiv.innerHTML += `
      <div class="user-row">
        <input type="checkbox" class="chk" value="${u.id}">
        <b>${u.name}</b> (${u.pcName})
        <span class="${u.offline ? 'offline' : 'online'}">
          ${u.offline ? 'Offline' : 'Online'}
        </span>

        <button class="deactivate-btn" onclick="deactivateUser('${u.id}')">
          Deactivate
        </button>

        <br>
        Last Seen: ${format(u.lastSeen)} <br>
        Last Msg: ${u.lastMessage || "-"} (${format(u.lastMessageAt)})
      </div>
    `;
  });
}

// Send message to selected users
document.getElementById("sendSelected").onclick = async () => {
  const message = msg.value.trim();
  const from = document.getElementById("from").value.trim();
  const checked = [...document.querySelectorAll(".chk:checked")].map(x => x.value);

  if (!message) return alert("Enter a message first!");

  await fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, userIds: checked, meta: { from } })
  });

  alert("Sent to selected users");
};

// Send message to ALL users
document.getElementById("sendAll").onclick = async () => {
  const message = msg.value.trim();
  const from = document.getElementById("from").value.trim();

  if (!message) return alert("Enter a message first!");

  await fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, userIds: [], meta: { from } })
  });

  alert("Sent to ALL users");
};

// Deactivate a user
async function deactivateUser(id) {
  if (!confirm("Are you sure you want to deactivate this user?")) return;

  await fetch("/api/deactivate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: id })
  });

  alert("User removed!");
  loadUsers();
}

// Update user list LIVE when server emits changes
socket.on("users-updated", renderUsers);

// Start loading initial users
loadUsers();
