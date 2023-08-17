// Entry point for the app
const appContainer = document.getElementById("app");

let editingMode = false; // Flag to track editing mode
let deletingMode = false;
const currentDate = new Date();

const editHabitsButton = document.getElementById("edit-button");
const deleteHabitsButton = document.getElementById("delete-button");
const addHabitButton = document.getElementById("add-button");
const backToHabitsListButton = document.getElementById("back-to-habits");

deleteHabitsButton.addEventListener("click", () => {
  if (deletingMode) {
    exitEditMode(); // If already in edit mode, exit edit mode
    exitDeleteMode();
  } else if (editingMode) {
    enableDeleteMode();
    exitEditMode();
  } else {
    enableDeleteMode(); // If not in edit or delete mode, enter delete mode
  }
});

addHabitButton.addEventListener("click", () => {
  exitEditMode(); // Exit edit mode
  exitDeleteMode(); // Exit delete mode
  backToHabitsListButton.style.display = "flex";
  deleteHabitsButton.style.display = "none";
  editHabitsButton.style.display = "none";
  addHabitButton.style.display = "none";
  renderAddHabitForm(); // Render the add habit form
});

editHabitsButton.addEventListener("click", () => {
  if (editingMode) {
    exitEditMode(); // If already in edit mode, exit edit mode
  } else if (deletingMode) {
    exitDeleteMode(); // If in delete mode, exit delete mode
    enableEditMode();
  } else {
    enableEditMode(); // If not in edit or delete mode, enter edit mode
  }
});

backToHabitsListButton.addEventListener("click", backtohabits);

function renderHabitListPage() {
  appContainer.innerHTML = `
  <h2 class="habit-title">
    <span class="today-date"></span>
    <span class="habit-subtitle">Your Habits</span>
  </h2>
  <h2 id="empty-habits-text">No habits... add one to start 🤓<br><br>For example: "Workout 🏋🏻‍♂️" or "Practice Japanese"</h2>
  <ul id="habit-list">
      
      <!-- Habit items will be inserted here -->
  </ul>
  <button id="add-button-2" style="margin: auto">Add Habit</button>
  `;

  const todayDateSpan = document.querySelector(".today-date");
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  todayDateSpan.textContent = formattedDate;

  fetchHabits();
}

async function toggleDeleteButton(habits) {
  deleteHabitsButton.style.display =
    habits.length === 0 || habits.every((habit) => habit.status)
      ? "none"
      : "flex";
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
      const habitList = document.getElementById("habit-list");
      habitList.innerHTML = "";

      toggleDeleteButton(habits);

      const emptyHabitsText = document.getElementById("empty-habits-text");
      emptyHabitsText.style.display = habits.length === 0 ? "block" : "none";

      const addHabitButton2 = document.getElementById("add-button-2");
      addHabitButton2.addEventListener("click", () => {
        backToHabitsListButton.style.display = "flex";
        exitEditMode(); // Exit edit mode
        exitDeleteMode(); // Exit delete mode
        deleteHabitsButton.style.display = "none";
        addHabitButton.style.display = "none";
        editHabitsButton.style.display = "none";
        addHabitButton2.style.display = "none";
        renderAddHabitForm(); // Render the add habit form
      });
      addHabitButton2.style.display = habits.length === 0 ? "flex" : "none";
      addHabitButton.style.display = habits.length === 0 ? "none" : "flex";

      habits.forEach((habit) => {
        const habitItem = document.createElement("li");
        habitItem.className = "habit-box"; // Always assign the base class
        if (habit.status) {
          habitItem.classList.add("done"); // Add "done" class if status is true
        }

        // Set the data-habit-id attribute
        habitItem.setAttribute("data-habit-id", habit.habit_id);

        habitItem.innerHTML = `
          <span class="habit-name">${habit.name}</span>
        `;

        habitItem.addEventListener("click", () => {
          if (!habitItem.classList.contains("done")) {
            trackHabit(habit.habit_id);
          }
        });

        habitList.appendChild(habitItem);
      });
    } else {
      // Handle fetch habits error
    }
  } catch (error) {
    console.error("Error fetching habits:", error);
    // Handle error
  }
}

async function deleteHabit(habitId) {
  try {
    const response = await fetch(`/habit/${habitId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Refresh the habit list after deleting
      fetchHabits();
    } else {
      // Handle delete habit error
    }

    // exitDeleteMode();
  } catch (error) {
    console.error("Error deleting habit:", error);
    // Handle error
  }
}

function enableEditMode() {
  editingMode = true;
  //deletingMode = false;

  // Add a class to the appContainer to indicate editing mode
  appContainer.classList.add("edit-mode"); // Add edit mode class

  // Update the title text to indicate editing mode
  const habitTitle = document.querySelector(".habit-subtitle");
  habitTitle.textContent = "Your Habits - EDITING MODE";
  document.querySelector(".container").style.backgroundColor = "#d1d1d1";
}

function enableDeleteMode() {
  deletingMode = true;
  //editingMode = false;

  // appContainer.classList.add("delete-mode");
  // document.querySelector(".container").style.backgroundColor = "#bbb";
  const habitTitle = document.querySelector(".habit-subtitle");

  const habitBoxes = document.querySelectorAll(".habit-box");
  habitBoxes.forEach((habitBox) => {
    if (!habitBox.classList.contains("done")) {
      habitBox.classList.add("delete-modus");
    }
  });

  habitTitle.textContent = "Your Habits - DELETE MODE";
}

// // Add this function to exit delete mode
function exitDeleteMode() {
  deletingMode = false;

  // appContainer.classList.remove("delete-mode");
  // document.querySelector(".container").style.backgroundColor = "#fff";

  const habitTitle = document.querySelector(".habit-subtitle");
  habitTitle.textContent = "Your Habits";

  const habitBoxes = document.querySelectorAll(".habit-box");
  habitBoxes.forEach((habitBox) => {
    habitBox.classList.remove("delete-modus");
  });
}

function exitEditMode() {
  editingMode = false; // Exit edit mode

  // deletingMode = false;
  appContainer.classList.remove("edit-mode"); // Remove edit mode class
  document.querySelector(".container").style.backgroundColor = "#fff";
  // Reset the title text to normal
  const habitTitle = document.querySelector(".habit-subtitle");
  habitTitle.textContent = "Your Habits";
}

async function trackHabit(habitId) {
  if (editingMode) {
    // Handle editing logic here
    const habitToEdit = await fetchHabitById(habitId); // Fetch the habit data

    if (habitToEdit) {
      const newHabitName = prompt("Enter new habit name:", habitToEdit.name); // Populate the prompt with the current habit name
      if (newHabitName !== null) {
        await updateHabitName(habitId, newHabitName);
        // Refresh the habit list after editing
        fetchHabits();
      }
      exitEditMode();
    }
  } else if (deletingMode) {
    // if (deletingMode) {
    const confirmed = confirm("Are you sure you want to delete this habit?");
    if (confirmed) {
      // alert("DELETED");
      deleteHabit(habitId); // Call the deleteHabit function
    }
    exitDeleteMode();
  } else {
    console.log("CHANGE STATUS");
    // Original trackHabit logic for tracking status

    const response = await fetch(`/habit/mark_done/${habitId}`, {
      method: "POST",
    });

    if (response.ok) {
      const habitBox = document.querySelector(
        `.habit-box[data-habit-id="${habitId}"]`
      );

      if (habitBox) {
        habitBox.classList.add("done"); // Add the "done" class
      }
    } else {
      // Handle track habit error
    }
  }
  await fetchHabits();
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

async function updateHabitName(habitId, newName) {
  try {
    const response = await fetch(`/habit/update_name/${habitId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
  } catch (error) {
    console.error("Error updating habit name:", error);
    // Handle error
  }
}

function renderAddHabitForm() {
  appContainer.innerHTML = `
        <h2>Add Habit</h2>
        <form id="add-habit-form">
            <input type="text" id="new-habit-name" placeholder="Habit Name">
            <button type="submit">Confirm new Habit</button>
        </form>
    `;

  const addHabitForm = document.getElementById("add-habit-form");
  addHabitForm.addEventListener("submit", handleAddHabit);

  // const backToHabitsButton = document.getElementById("back-to-habits");
  // backToHabitsButton.addEventListener("click", backtohabits);
}

async function backtohabits() {
  backToHabitsListButton.style.display = "flex";
  deleteHabitsButton.style.display = "flex";
  editHabitsButton.style.display = "flex";
  addHabitButton.style.display = "flex";
  renderHabitListPage();
}

async function handleAddHabit(event) {
  event.preventDefault();
  const habitName = document.getElementById("new-habit-name").value.trim(); // Trim to remove leading/trailing whitespace

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
      const errorContainer = document.createElement("p");
      errorContainer.textContent = "Error adding habit. Please try again.";
      errorContainer.style.color = "red";
      appContainer.appendChild(errorContainer);
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
      deleteHabitsButton.style.display = "flex";
      editHabitsButton.style.display = "flex";
      addHabitButton.style.display = "flex";
      renderHabitListPage();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
  } catch (error) {
    console.error("Error adding habit:", error);
    const errorContainer = document.createElement("p");
    errorContainer.textContent = "Error adding habit. Please try again.";
    errorContainer.style.color = "red";
    appContainer.appendChild(errorContainer);
  }
}

//document.addEventListener("DOMContentLoaded", () => {
//const token = localStorage.getItem("token");

//if (token) {
// Attach the token to the headers of authenticated requests
//const headers = {
//Authorization: `Bearer ${token}`,
//};

// TO DO: QUESTION: Do I have to do something here for each action? fetch habits, add habits, etc.?
// Fetch user-specific data using the token
// ...
//} else {
// Redirect to the login page if the token is not present
//window.location.href = "/login";
//}
//});

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
