const loginForm = document.getElementById("login-form");
const errorMessageDiv = document.getElementById("error-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'  // Include cookies with the request
    });

    if (response.ok) {
      const data = await response.json();
      //localStorage.setItem("token", data.token);
      
      window.location.href = "/"; // Redirect to the main app page
    } else {
    //   alert("Wrong username and/or password");
      errorMessageDiv.textContent = "Wrong username and/or password";
      console.error("Login failed");
    }
  } catch (error) {
    console.error("An error occurred during login:", error);
  }
});
