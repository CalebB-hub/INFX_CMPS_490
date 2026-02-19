import TopNav from "../components/TopNav";
import { getUser } from "../services/authService";

export default function Profile() {
  const user = getUser();

  return (
    <div>
      <TopNav />
      <main className="page">
        <h2>User Profile</h2>
        <div className="card">
          <p><b>Name:</b> {user?.name}</p>
          <p><b>Username:</b> {user?.username}</p>
          <p><b>Role:</b> {user?.role}</p>
        </div>
      </main>
    </div>
  );
}
