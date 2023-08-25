async function fetchHabits() {
  try {
    const headers = {
      //"Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch("/habits", {
      method: "GET",
      credentials: "include", // Include cookies with the request
    });

    if (response.ok) {
      const habits = await response.json();

      console.log("Pre-sort:");
      habits.forEach((habit) => {
        console.log(`${habit.name}`);
      });

      console.log("\nAFTER-sort:");
      habits.forEach((habit) => {
        console.log(`${habit.name}`);
      });

      habits.forEach((habit) => {
        habit.logs.forEach((log) => {
          const formattedDate = new Date(log.log_date)
            .toISOString()
            .split("T")[0];
          const cell = document.getElementById(
            `${habit.habit_id}_${formattedDate}`
          );
          if (cell) {
            cell.textContent = "✅";
          } else {
            console.log(
              `Cell for ${habit.name} - ${log.log_date} does NOT exist`
            );
          }
        });
      });
    } else {
      // TODO Handle fetch habits error
    }
  } catch (error) {
    console.error("Error fetching habits:", error);
    // Handle error
  }

  const logoutButton = document.getElementById("logout");

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Clear any local storage or other client-side data if needed
        window.location.href = "/login"; // Redirect to the login page after successful logout
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("An error occurred during logout:", error);
    }
  });

  const backToHabitsListButton = document.getElementById("back-to-habits");
  backToHabitsListButton.addEventListener(
    "click",
    () => (window.location.href = "/")
  );

  // const addHabitButton = document.getElementById("add-button");
  // addHabitButton.addEventListener("click", () => {alert("NOT YET IMPLEMENTED")});
}

fetchHabits();
