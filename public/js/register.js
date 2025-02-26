document
  .getElementById("registerForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username.length < 3) {
      alert("Le nom d'utilisateur doit comporter au moins 3 caractères.");
      return;
    }

    if (password.length < 8) {
      alert("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert("Erreur : " + data.error);
        } else {
          alert("Inscription réussie !");
          window.location.href = "/pages/login.html";
        }
      });
  });
