// Entry point for the app
const appContainer = document.getElementById("app");

const statsButton = document.getElementById("stats");
const addHabitButton = document.getElementById("add-button");
const backToHabitsListButton = document.getElementById("back-to-habits");

statsButton.addEventListener("click", () => {
  window.location.href = "/stats";
});

addHabitButton.addEventListener("click", () => {
  backToHabitsListButton.style.display = "flex";
  addHabitButton.style.display = "none";
  renderAddHabitForm(); // Render the add habit form
});
backToHabitsListButton.addEventListener("click", backtohabits);

function renderHabitListPage() {
  backToHabitsListButton.style.display = "none"; // TO DO: clean this code, it is a mess!!
  appContainer.innerHTML = `
  <h2 id="empty-habits-text">No habits... add one to start 🤓<br><br>For example: "Workout 🏋🏻‍♂️" or "Practice Japanese"</h2>
  <ul id="habit-list">
      
      <!-- Habit items will be inserted here -->
  </ul>
  <button id="add-button-2" style="margin: auto">Add Habit</button>
  `;

  fetchHabits();
}

async function fetchHabits() {
  try {
    //const token = localStorage.getItem("token");

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
      habits.sort((a, b) => (a.status > b.status ? 1 : b.status > a.status ? -1 : 0));
      const habitList = document.getElementById("habit-list");
      habitList.innerHTML = "";

      const emptyHabitsText = document.getElementById("empty-habits-text");
      emptyHabitsText.style.display = habits.length === 0 ? "block" : "none";

      const addHabitButton2 = document.getElementById("add-button-2");
      addHabitButton2.addEventListener("click", () => {
        backToHabitsListButton.style.display = "flex";
        addHabitButton.style.display = "none";
        addHabitButton2.style.display = "none";
        renderAddHabitForm(); // Render the add habit form
      });
      addHabitButton2.style.display = habits.length === 0 ? "flex" : "none";
      addHabitButton.style.display = habits.length === 0 ? "none" : "flex";

      if (habits.length > 0) {
        statsButton.style.display = "flex";
      }

      habits.forEach((habit) => {
        const habitItem = document.createElement("li");
        habitItem.className = "habit-box"; // Always assign the base class

        // Set the data-habit-id attribute
        habitItem.setAttribute("data-habit-id", habit.habit_id);

        habitItem.innerHTML = `
          <span class="habit-name" id="habit-name-${habit.name}">${habit.name}</span>
          <div class="habit-buttons" id="buttons-id-${habit.habit_id}">
            <button class="mark-done-btn" id="check-btn-id-${habit.habit_id}">
              <i class="fa-regular fa-square"></i>
            </button> 
            <button class="unmark-done-btn" id="uncheck-btn-id-${habit.habit_id}">
              <i class="fa-solid fa-square-check"></i>
            </button> 
            <button class="edit-btn" id="edit-btn-id-${habit.habit_id}">
                <i class="fas fa-pencil"></i>
            </button>
            <button class="delete-btn" id="delete-btn-id-${habit.habit_id}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;

        habitItem.addEventListener("click", () => {
          // if (!habitItem.classList.contains("done")) {
          // trackHabit(habit.habit_id);
          // }
        });

        habitList.appendChild(habitItem);

        const habitName = document.getElementById(`habit-name-${habit.name}`);

        const checkButton = document.getElementById(
          `check-btn-id-${habit.habit_id}`
        );
        const uncheckButton = document.getElementById(
          `uncheck-btn-id-${habit.habit_id}`
        );
        const deleteButton = document.getElementById(
          `delete-btn-id-${habit.habit_id}`
        );
        const editButton = document.getElementById(
          `edit-btn-id-${habit.habit_id}`
        );
        if (habit.status) {
          habitItem.classList.add("done"); // Add "done" class if status is true
          checkButton.style.display = "none";
          uncheckButton.style.display = "flex";
          deleteButton.style.display = "none";
          editButton.style.display = "none";

          habitName.addEventListener("click", async () =>
            unmarkHabitDone(habit)
          );
          uncheckButton.addEventListener("click", async () =>
            unmarkHabitDone(habit)
          );
        } else {
          habitItem.classList.remove("done");
          checkButton.style.display = "flex";
          uncheckButton.style.display = "none";
          deleteButton.style.display = "flex";
          editButton.style.display = "flex";

          habitName.addEventListener("click", async () => markHabitDone(habit));
          checkButton.addEventListener("click", async () =>
            markHabitDone(habit)
          );
          deleteButton.addEventListener("click", async () =>
            deleteHabit(habit)
          );
          editButton.addEventListener("click", async () =>
            updateHabitName(habit)
          );
        }
      });
    } else {
      // TODO Handle fetch habits error
    }
  } catch (error) {
    console.error("Error fetching habits:", error);
    // Handle error
  }
}

async function markHabitDone(habit) {
  await fetch(`/habit/mark_done/${habit.habit_id}`, {
    method: "POST",
  });
  await fetchHabits();
}

async function unmarkHabitDone(habit) {
  const confirmed = confirm("Unmark this habit?");
  if (confirmed) {
    const response = await fetch(`/habit/mark_undone/${habit.habit_id}`, {
      method: "PUT",
    });
    await fetchHabits();
  }
}

async function deleteHabit(habit) {
  try {
    const confirmed = confirm(`Are you sure you want to delete ${habit.name}?`);
    if (confirmed) {
      const response = await fetch(`/habit/${habit.habit_id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the habit list after deleting
        fetchHabits();
      } else {
        const errorData = await response.json(); // Assuming the server sends a JSON error response
        console.error("Delete failed:", errorData.message);
        alert(errorData.message);
      }
    }
  } catch (error) {
    console.error("Error deleting habit:", error);
    // Handle error
  }
}

// Function to fetch habit by ID
async function fetchHabitById(habitId) {
  try {
    const response = await fetch(`/habit/${habitId}`, {
      method: "GET",
    });

    if (response.ok) {
      const habit = await response.json();
      return habit;
    } else {
      // Handle error
      return null;
    }
  } catch (error) {
    console.error("Error fetching habit:", error);
    // Handle error
    return null;
  }
}

async function fetchLogByUserId(userId) {
  //TO DO
}

async function updateHabitName(habit) {
  try {
    const newHabitName = prompt("Enter new habit name:", habit.name); // Populate the prompt with the current habit name
    if (newHabitName !== null) {
      const response = await fetch(`/habit/update_name/${habit.habit_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newHabitName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      // Refresh the habit list after editing
      fetchHabits();
    }
  } catch (error) {
    console.error("Error updating habit name:", error);
    alert(error);
    // Handle error
  }
}

function renderAddHabitForm() {
  appContainer.innerHTML = `
        <div class="add-habit-container">
          <h2>Add Habit</h2>
          <form id="add-habit-form">
              <input type="text" id="new-habit-name" placeholder="Habit Name" required>
              <button type="submit">Confirm new Habit</button>
              <div id="error-message" class="error-message"></div>
          </form>
        </div>
    `;

  const addHabitForm = document.getElementById("add-habit-form");
  addHabitForm.addEventListener("submit", handleAddHabit);

  // const backToHabitsButton = document.getElementById("back-to-habits");
  // backToHabitsButton.addEventListener("click", backtohabits);
}

async function backtohabits() {
  addHabitButton.style.display = "flex";
  renderHabitListPage();
}

async function handleAddHabit(event) {
  event.preventDefault();
  const habitName = document.getElementById("new-habit-name").value.trim(); // Trim to remove leading/trailing whitespace
  const errorMessageDiv = document.getElementById("error-message");

  if (habitName === "") {
    try {
      const response = await fetch("/add_habit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: habitName }), // Sending the habit name to the server for validation
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message); // Display the validation message from the backend
      }
    } catch (error) {
      console.error("Error adding habit:", error);
      errorMessageDiv.textContent = error;
      // errorContainer.textContent = "Error adding habit. Please try again.";
    }
    return; // Don't proceed if the habit name is empty
  }

  const requestData = { name: habitName };

  try {
    const response = await fetch("/add_habit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      addHabitButton.style.display = "flex";
      renderHabitListPage();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
  } catch (error) {
    console.error("Error adding habit:", error);
    errorMessageDiv.textContent = error;
    // errorContainer.textContent = "Error adding habit. Please try again.";
  }
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

renderHabitListPage();
