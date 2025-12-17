import pytest
from src.app import activities

def test_get_activities(client):
    """Test getting all activities."""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()

    # Check that we have the expected activities
    assert "Chess Club" in data
    assert "Programming Class" in data

    # Check structure of an activity
    chess_club = data["Chess Club"]
    assert "description" in chess_club
    assert "schedule" in chess_club
    assert "max_participants" in chess_club
    assert "participants" in chess_club
    assert isinstance(chess_club["participants"], list)

def test_signup_for_activity(client):
    """Test signing up for an activity."""
    # Test successful signup
    response = client.post("/activities/Chess%20Club/signup?email=test@example.com")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "test@example.com" in data["message"]
    assert "Chess Club" in data["message"]

    # Verify the participant was added
    response = client.get("/activities")
    data = response.json()
    assert "test@example.com" in data["Chess Club"]["participants"]

def test_signup_already_signed_up(client):
    """Test signing up when already signed up."""
    # First signup
    client.post("/activities/Programming%20Class/signup?email=duplicate@example.com")

    # Try to signup again
    response = client.post("/activities/Programming%20Class/signup?email=duplicate@example.com")
    assert response.status_code == 400
    data = response.json()
    assert "already signed up" in data["detail"]

def test_signup_activity_not_found(client):
    """Test signing up for non-existent activity."""
    response = client.post("/activities/NonExistent/signup?email=test@example.com")
    assert response.status_code == 404
    data = response.json()
    assert "Activity not found" in data["detail"]

def test_signup_activity_full(client):
    """Test signing up for a full activity."""
    # Fill up an activity (assuming small max_participants)
    activity_name = "Chess Club"
    max_participants = activities[activity_name]["max_participants"]

    # Add participants until full
    for i in range(max_participants):
        email = f"participant{i}@example.com"
        if email not in activities[activity_name]["participants"]:
            activities[activity_name]["participants"].append(email)

    # Try to add one more
    response = client.post(f"/activities/{activity_name}/signup?email=overflow@example.com")
    assert response.status_code == 400
    data = response.json()
    assert "Activity is full" in data["detail"]

def test_unregister_from_activity(client):
    """Test unregistering from an activity."""
    # First signup
    client.post("/activities/Gym%20Class/signup?email=unregister@example.com")

    # Then unregister
    response = client.delete("/activities/Gym%20Class/unregister?email=unregister@example.com")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "unregister@example.com" in data["message"]
    assert "Gym Class" in data["message"]

    # Verify the participant was removed
    response = client.get("/activities")
    data = response.json()
    assert "unregister@example.com" not in data["Gym Class"]["participants"]

def test_unregister_not_signed_up(client):
    """Test unregistering when not signed up."""
    response = client.delete("/activities/Debate%20Team/unregister?email=notsignedup@example.com")
    assert response.status_code == 400
    data = response.json()
    assert "not signed up" in data["detail"]

def test_unregister_activity_not_found(client):
    """Test unregistering from non-existent activity."""
    response = client.delete("/activities/NonExistent/unregister?email=test@example.com")
    assert response.status_code == 404
    data = response.json()
    assert "Activity not found" in data["detail"]

def test_root_redirect(client):
    """Test root endpoint redirects to static file."""
    response = client.get("/")
    assert response.status_code == 200
    # Should serve the HTML file (redirect handled by FastAPI)