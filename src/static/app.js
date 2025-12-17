document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const desc = document.createElement("p");
        desc.textContent = details.description || "";
        activityCard.appendChild(desc);

        const sched = document.createElement("p");
        sched.innerHTML = `<strong>Schedule:</strong> ${escapeHtml(details.schedule || "")}`;
        activityCard.appendChild(sched);

        const cap = document.createElement("p");
        const current = (details.participants || []).length;
        const max = details.max_participants || 0;
        cap.innerHTML = `<strong>Capacity:</strong> ${current}/${max}`;
        activityCard.appendChild(cap);

        const ph = document.createElement("div");
        ph.className = "participants-header";
        ph.textContent = "Participants:";
        activityCard.appendChild(ph);

        // Participants list
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.textContent = participant;
            
            // Add delete icon
            const deleteIcon = document.createElement("span");
            deleteIcon.textContent = " ×";
            deleteIcon.className = "delete-icon";
            deleteIcon.style.cursor = "pointer";
            deleteIcon.style.color = "#d32f2f";
            deleteIcon.style.fontWeight = "bold";
            deleteIcon.title = "Unregister participant";
            deleteIcon.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (confirm(`Unregister ${participant} from ${name}?`)) {
                try {
                  const response = await fetch(
                    `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participant)}`,
                    {
                      method: "DELETE",
                    }
                  );
                  const result = await response.json();
                  if (!response.ok) {
                    showMessage(result.detail || result.message || "Unregister failed", "error");
                  } else {
                    showMessage(result.message || "Unregistered successfully", "success");
                    await fetchActivities();
                  }
                } catch (error) {
                  showMessage("Network error during unregister", "error");
                  console.error("Error unregistering:", error);
                }
              }
            });
            participantItem.appendChild(deleteIcon);
            
            participantsList.appendChild(participantItem);
          });
        } else {
          const noParticipantsItem = document.createElement("li");
          noParticipantsItem.textContent = "No participants yet";
          noParticipantsItem.className = "no-participants";
          participantsList.appendChild(noParticipantsItem);
        }

        activityCard.appendChild(participantsList);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 4000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;
    if (!email || !activity) {
      showMessage("Please provide both email and activity.", "error");
      return;
    }
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      if (!response.ok) {
        showMessage(result.detail || result.message || "Signup failed", "error");
      } else {
        showMessage(result.message || "Signed up successfully", "success");
        await fetchActivities();
        signupForm.reset();
      }
    } catch (error) {
      showMessage("Network error during signup", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
