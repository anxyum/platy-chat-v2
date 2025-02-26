const form = document.getElementById("myForm");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const message = document.getElementById("message").value;
  const channel_id = document.getElementById("channel_id").value;

  if (message.trim() === "") {
    return;
  }

  fetch("/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({ message, channel_id }),
  })
    .then((response) => response.json())
    .catch((error) => console.error("Erreur:", error));
});
