const form = document.getElementById("myForm");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
        console.log("Connecté !");
        window.location.href = "/";
      } else {
        console.error("Erreur de connexion");
      }
    })
    .catch((error) => console.error("Erreur:", error));
});
