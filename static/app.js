// Entry point for the app
const appContainer = document.getElementById("app");

let editingMode = false; // Flag to track editing mode
let deletingMode = false;
const currentDate = new Date();

function renderHabitListPage() {
  appContainer.innerHTML = `
  <h2 class="habit-title">
    <span class="today-date"></span>
    <span>Your Habits</span>
    <button id="edit-habit">Edit</button>
    <button id="delete-habit">Delete Habit</button>
    <button id="add-habit">Add Habit</button> 
  </h2>
  <ul id="habit-list">
      <!-- Habit items will be inserted here -->
  </ul>
  `;

  const editHabitsButton = document.getElementById("edit-habit");
  const deleteHabitsButton = document.getElementById("delete-habit");
  const addHabitButton = document.getElementById("add-habit");

  editHabitsButton.addEventListener("click", () => {
    if (editingMode) {
      exitEditMode(); // If already in edit mode, exit edit mode
    } else if (deletingMode) {
      // exitDeleteMode(); // If in delete mode, exit delete mode
      enableEditMode();
    } else {
      enableEditMode(); // If not in edit or delete mode, enter edit mode
    }
  });

  deleteHabitsButton.addEventListener("click", () => {
    if (deletingMode) {
      // exitEditMode(); // If already in edit mode, exit edit mode
      exitDeleteMode();
    } else if (editingMode) {
      enableDeleteMode();
    } else {
      enableDeleteMode(); // If not in edit or delete mode, enter delete mode
    }
  });

  addHabitButton.addEventListener("click", () => {
    exitEditMode(); // Exit edit mode
    exitDeleteMode(); // Exit delete mode
    renderAddHabitForm(); // Render the add habit form
  });

  const todayDateSpan = document.querySelector(".today-date");
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit"
  });
  todayDateSpan.textContent = formattedDate;

  fetchHabits();
}

async function fetchHabits() {
  try {
    const response = await fetch("/habits", {
      method: "GET",
    });

    if (response.ok) {
      const habits = await response.json();
      const habitList = document.getElementById("habit-list");
      habitList.innerHTML = "";

      habits.forEach((habit) => {
        const habitItem = document.createElement("li");
        habitItem.className = "habit-box"; // Always assign the base class
        if (habit.status) {
          habitItem.classList.add("done"); // Add "done" class if status is true
        }

        // Set the data-habit-id attribute
        habitItem.setAttribute("data-habit-id", habit.habit_id);

        habitItem.innerHTML = `
          <span>${habit.name}</span>
        `;

        habitItem.addEventListener("click", () => trackHabit(habit.habit_id));

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

    exitDeleteMode();
  } catch (error) {
    console.error("Error deleting habit:", error);
    // Handle error
  }
}

function enableEditMode() {
  editingMode = true;
  deletingMode = false;

  // Add a class to the appContainer to indicate editing mode
  // appContainer.classList.add("edit-mode"); // Add edit mode class

  // Update the title text to indicate editing mode
  const habitTitle = document.querySelector(".habit-title span");
  habitTitle.textContent = "Your Habits - EDITING MODE";
  document.querySelector(".container").style.backgroundColor = "#d1d1d1";
}

function enableDeleteMode() {
  deletingMode = true;
  editingMode = false;

  // appContainer.classList.add("delete-mode");
  document.querySelector(".container").style.backgroundColor = "#bbb";
  const habitTitle = document.querySelector(".habit-title span");
  habitTitle.textContent = "Your Habits - DELETE MODE";
}

// Add this function to exit delete mode
function exitDeleteMode() {
  deletingMode = false;

  // appContainer.classList.remove("delete-mode");
  document.querySelector(".container").style.backgroundColor = "#fff";

  const habitTitle = document.querySelector(".habit-title span");
  habitTitle.textContent = "Your Habits";
}

function exitEditMode() {
  editingMode = false; // Exit edit mode

  // deletingMode = false;
  // appContainer.classList.remove("edit-mode"); // Remove edit mode class
  document.querySelector(".container").style.backgroundColor = "#fff";
  // Reset the title text to normal
  const habitTitle = document.querySelector(".habit-title span");
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
    const confirmed = confirm("Are you sure you want to delete this habit?");
    if (confirmed) {
      deleteHabit(habitId); // Call the deleteHabit function
    }
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
        habitBox.classList.toggle("done"); // Toggle the "done" class
      }
    } else {
      // Handle track habit error
    }
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
            <input type="text" id="habit-name" placeholder="Habit Name">
            <button type="submit">Confirm new Habit</button>
        </form>
        <button id="back-to-habits">Back to Habits</button>
    `;

  const addHabitForm = document.getElementById("add-habit-form");
  addHabitForm.addEventListener("submit", handleAddHabit);

  const backToHabitsButton = document.getElementById("back-to-habits");
  backToHabitsButton.addEventListener("click", renderHabitListPage);
}

async function handleAddHabit(event) {
  event.preventDefault();
  const habitName = document.getElementById("habit-name").value.trim(); // Trim to remove leading/trailing whitespace

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

renderHabitListPage();
