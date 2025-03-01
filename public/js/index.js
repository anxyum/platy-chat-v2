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

if (isTokenExpired(localStorage.getItem("token"))) {
  document.querySelector(".login-CTA").classList.remove("hidden");
} else {
  document.querySelector(".main-screen").classList.remove("hidden");
}
