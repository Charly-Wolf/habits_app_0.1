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
  backToHabitsListButton.style.display = "none"; // TO DO: clean this code, it is a mess!!
  appContainer.innerHTML = `
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
  // todayDateSpan.textContent = formattedDate;

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
      editHabitsButton.style.display = habits.length === 0 ? "none" : "flex";

      habits.forEach((habit) => {
        const habitItem = document.createElement("li");
        habitItem.className = "habit-box"; // Always assign the base class
        
        // Set the data-habit-id attribute
        habitItem.setAttribute("data-habit-id", habit.habit_id);

        habitItem.innerHTML = `
          <span class="habit-name">${habit.name}</span>
          <div class="habit-buttons" id="buttons-id-${habit.habit_id}">
            <button class="mark-done-btn" id="check-btn-id-${habit.habit_id}">
              <i class="fa-solid fa-square-check"></i>
            </button> 
            <button class="unmark-done-btn" id="uncheck-btn-id-${habit.habit_id}">
              <i class="fa-regular fa-square"></i>
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

        const checkButton = document.getElementById(`check-btn-id-${habit.habit_id}`);
        const uncheckButton = document.getElementById(`uncheck-btn-id-${habit.habit_id}`);
        const deleteButton = document.getElementById(`delete-btn-id-${habit.habit_id}`);
        const editButton = document.getElementById(`edit-btn-id-${habit.habit_id}`);
        if (habit.status) {        
          habitItem.classList.add("done"); // Add "done" class if status is true 
          checkButton.style.display = "none";
          uncheckButton.style.display = "flex";
          deleteButton.style.display = "none";
          editButton.style.display = "none";
        }else {
          checkButton.style.display = "flex";
          uncheckButton.style.display = "none";
          deleteButton.style.display = "flex";
          editButton.style.display = "flex";

          deleteButton.addEventListener("click", async () => deleteHabit(habit));
          editButton.addEventListener("click", async () => updateHabitName(habit))
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
      }
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
  // const habitTitle = document.querySelector(".habit-subtitle");
  // habitTitle.textContent = "Your Habits - EDITING MODE";
  const habitBoxes = document.querySelectorAll(".habit-box");
  habitBoxes.forEach((habitBox) => {
    if (!habitBox.classList.contains("done")) {
      habitBox.classList.add("edit-modus");
    }
  });
}

function enableDeleteMode() {
  deletingMode = true;
  //editingMode = false;

  // appContainer.classList.add("delete-mode");
  // document.querySelector(".container").style.backgroundColor = "#bbb";
  // const habitTitle = document.querySelector(".habit-subtitle");

  const habitBoxes = document.querySelectorAll(".habit-box");
  habitBoxes.forEach((habitBox) => {
    if (!habitBox.classList.contains("done")) {
      habitBox.classList.add("delete-modus");
    }
  });

  // habitTitle.textContent = "Your Habits - DELETE MODE";
}

// // Add this function to exit delete mode
function exitDeleteMode() {
  deletingMode = false;

  // appContainer.classList.remove("delete-mode");
  // document.querySelector(".container").style.backgroundColor = "#fff";

  // const habitTitle = document.querySelector(".habit-subtitle");
  // habitTitle.textContent = "Your Habits";

  const habitBoxes = document.querySelectorAll(".habit-box");
  habitBoxes.forEach((habitBox) => {
    habitBox.classList.remove("delete-modus");
  });
}

function exitEditMode() {
  editingMode = false; // Exit edit mode

  // deletingMode = false;
  appContainer.classList.remove("edit-mode"); // Remove edit mode class
  const habitBoxes = document.querySelectorAll(".habit-box");
  habitBoxes.forEach((habitBox) => {
    habitBox.classList.remove("edit-modus");
  });
  // Reset the title text to normal
  // const habitTitle = document.querySelector(".habit-subtitle");
  // habitTitle.textContent = "Your Habits";
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
    // Original trackHabit logic for tracking status
    const habitBox = document.querySelector(
      `.habit-box[data-habit-id="${habitId}"]`
    );
    if (habitBox) {
      if (!habitBox.classList.contains("done")) {
        const response = await fetch(`/habit/mark_done/${habitId}`, {
          method: "POST",
        });
        if (response.ok) {
          habitBox.classList.add("done"); // Add the "done" class
          // const checkButton = document.getElementById(`check-btn-id-${habitId}`);
        } else {
          // TODO: Handle track habit error
        }
      } else {
        const confirmed = confirm("Unmark this habit?");
        if (confirmed) {
          const response = await fetch(`/habit/mark_undone/${habitId}`, {
            method: "PUT",
          });
          if (response.ok) {
            habitBox.classList.remove("done");
          } else {
            // TODO: Handle track habit error
          }
        }
      }
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
        <h2>Add Habit</h2>
        <form id="add-habit-form">
            <input type="text" id="new-habit-name" placeholder="Habit Name" required>
            <button type="submit">Confirm new Habit</button>
            <div id="error-message" class="error-message"></div>
        </form>
    `;

  const addHabitForm = document.getElementById("add-habit-form");
  addHabitForm.addEventListener("submit", handleAddHabit);

  // const backToHabitsButton = document.getElementById("back-to-habits");
  // backToHabitsButton.addEventListener("click", backtohabits);
}

async function backtohabits() {
  deleteHabitsButton.style.display = "flex";
  editHabitsButton.style.display = "flex";
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
