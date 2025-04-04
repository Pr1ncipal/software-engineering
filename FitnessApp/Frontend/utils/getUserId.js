export async function getUserId(username) {
    try {
      const response = await fetch(`http://localhost:5000/api/get_user_id?username=${username}`); // <-- fix port here
      const data = await response.json();
      if (response.ok) {
        return data.id;
      } else {
        console.error("Error fetching user ID:", data.error);
        return null;
      }
    } catch (err) {
      console.error("Failed to fetch user ID:", err);
      return null;
    }
  }
  