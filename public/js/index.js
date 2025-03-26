const $guildList = document.getElementById("guild-list");
const $channelList = document.getElementById("channel-list");
const $messageList = document.getElementById("message-list");
const $messageInput = document.getElementById("message-input");
const $messageForm = document.getElementById("send-message");

let currentChannelId = null;
let currentGuildId = null;

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1])); // Décoder payload (base64)
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

let usersCashe = {};
async function getUser(userId) {
  if (usersCashe[userId]) {
    return usersCashe[userId];
  }

  console.log("Fetching user data for user ID:", userId);
  const response = await fetch(`/api/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const user = await response.json();
    usersCashe[userId] = user;
    console.log(`user data for ${userId} has been cached.`);
    return user;
  } else {
    return null;
  }
}

async function displayGuild(guildId) {
  fetch(`/api/guilds/${guildId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        if (res.status === 401) {
          window.location.href = "/pages/login.html";
        }
      }
    })
    .then((data) => {
      $channelList.innerHTML = "";
      data.channels.forEach((channel) => {
        const $channel = document.createElement("li");
        $channel.textContent = channel.name;
        $channel.addEventListener("click", () => {
          currentChannelId = channel.id;
          displayChannel(guildId, channel.id);
        });
        $channelList.appendChild($channel);
      });
    })
    .catch((error) => {
      console.error("Error fetching guild data:", error);
    });
}

async function displayChannel(guildId, channelId) {
  fetch(`/api/guilds/${guildId}/${channelId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        if (res.status === 401) {
          window.location.href = "/pages/login.html";
        }
      }
    })
    .then(async (data) => {
      console.log(data);
      $messageList.innerHTML = "";
      for (let i = 0; i < data.messages.length; i++) {
        await displayMessage(data.messages[i]);
      }
    })
    .catch((error) => {
      console.error("Error fetching channel data:", error);
    });
}

async function displayMessage(message) {
  const $message = document.createElement("li");
  const messageAuthor = await getUser(message.author_id);
  $message.textContent = `${messageAuthor.displayname}: ${message.content}`;
  $messageList.appendChild($message);
}

const token = localStorage.getItem("accessToken");
const refreshToken = localStorage.getItem("refreshToken");

if (isTokenExpired(token) && isTokenExpired(refreshToken)) {
  window.href = "/pages/login.html";
}

fetch("/api/guilds", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      if (res.status === 401) {
        window.location.href = "/pages/login.html";
      }
    }
  })
  .then((data) => {
    data.guilds.forEach((guild) => {
      const li = document.createElement("li");
      li.textContent = guild.displayname;
      li.addEventListener("click", () => {
        currentGuildId = guild.id;
        displayGuild(guild.id);
      });
      $guildList.appendChild(li);
    });
  })
  .catch((err) => {
    console.error(err);
  });

// TODO : Implement mps

// fetch("/api/guilds/@me")
//   .then((res) => res.json())
//   .then((data) => {
//     const channelList = document.getElementById("channel-list");
//     data.guild.channels.forEach((channel) => {
//       const li = document.createElement("li");
//       li.textContent = channel.name;
//       channelList.appendChild(li);
//     });
//   });

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const messageContent = $messageInput.value;
  if (messageContent.trim() === "") return;

  fetch(`/api/message/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel_id: currentChannelId,
      content: messageContent,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      displayMessage(data.message);
      $messageInput.value = "";
    })
    .catch((err) => {
      alert("Error sending message: " + err);
      console.error(err);
    });
});
