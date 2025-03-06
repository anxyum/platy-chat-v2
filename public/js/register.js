const ERROR_MESSAGES = {
  USERNAME_INVALID: "Invalid username format",
  PASSWORD_INVALID: "Invalid password format",
};

function validateInput(username, password) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  const isValidUsername = usernameRegex.test(username);
  const isValidPassword = passwordRegex.test(password);

  return {
    isValid: isValidUsername && isValidPassword,
    isValidUsername,
    isValidPassword,
    message: !(isValidUsername && isValidPassword)
      ? isValidUsername
        ? ERROR_MESSAGES.PASSWORD_INVALID
        : ERROR_MESSAGES.USERNAME_INVALID
      : "",
  };
}

document
  .getElementById("registerForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { isValid, isValidUsername, isValidPassword, message } =
      validateInput(username, password);
    if (!isValidUsername) {
      document.getElementById("username-error").textContent =
        "The username must be between 3 and 32 characters and can only contain letters, numbers, and underscores.";
    }

    if (!isValidPassword) {
      document.getElementById("password-error").textContent =
        "The password must be at least 8 characters long and contain at least one letter and one number.";
    }

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert("Error : " + data.error);
        } else {
          alert("You have successfully registered!");
          fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.error) {
                alert("Error : " + data.error);
              } else {
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
                window.location.href = "/";
              }
            });
        }
      });
  });
