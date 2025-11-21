// Connect socket.io
const socket = io();
const usersDiv = document.getElementById("users");

// Load users initially
async function loadUsers() {
  const res = await fetch("/api/users");
  const users = await res.json();
  renderUsers(users);
}

// Format time
function format(t) {
  return t ? new Date(t).toLocaleString() : "-";
}

// Toggle speak
async function toggleSpeak(id, checked) {
  await fetch("/api/toggleSpeak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: id, speak: checked })
  });
}

// Render users
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

        <!-- Speak Toggle -->
        <label class="switch">
          <input type="checkbox" 
                 onchange="toggleSpeak('${u.id}', this.checked)"
                 ${u.speak ? "checked" : ""}>
          <span class="slider"></span>
        </label>

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

// Send to selected users
document.getElementById("sendSelected").onclick = async () => {
  const message = msg.value.trim();
  const from = document.getElementById("from").value.trim();
  const checked = [...document.querySelectorAll(".chk:checked")].map(x => x.value);

  if (!message) return alert("Enter a message!");

  await fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, userIds: checked, meta: { from } })
  });

  alert("Sent to selected!");
};

// Send to ALL
document.getElementById("sendAll").onclick = async () => {
  const message = msg.value.trim();
  const from = document.getElementById("from").value.trim();

  if (!message) return alert("Enter a message!");

  await fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, userIds: [], meta: { from } })
  });

  alert("Sent to ALL!");
};

// Deactivate user
async function deactivateUser(id) {
  if (!confirm("Deactivate this user?")) return;

  await fetch("/api/deactivate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: id })
  });

  alert("User removed!");
  loadUsers();
}

// Socke.io live update
socket.on("users-updated", renderUsers);

// First load
loadUsers();
