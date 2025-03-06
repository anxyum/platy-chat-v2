const $form = document.getElementById("myForm");
const $messageInput = document.getElementById("message");
const $channelIdInput = document.getElementById("channel-id");

function isTokenValid(token) {
  if (!token) return false;

  const tokenParts = token.split(".");
  return tokenParts.length === 3;
}

function checkTokenExpiration(token) {
  if (!token) return false;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const expirationTime = payload.exp * 1000;
  return Date.now() < expirationTime;
}

$form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = $messageInput.value;
  const channelId = $channelIdInput.value;
  let token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!isTokenValid(token) || !checkTokenExpiration(token)) {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      token = data.token;
    } else {
      window.location.href = "/pages/login.html";
      alert("an error occured, please login again");
      return;
    }
  }

  const response = await fetch("/api/message/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, channel_id: channelId }),
  });
});
