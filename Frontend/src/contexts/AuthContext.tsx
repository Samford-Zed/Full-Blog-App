import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "../api/client";

type User = { id: number; username: string; email?: string; role: string };

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// ✅ Custom hook for easy usage
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // 🔵 Login
  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });

    // Save token
    localStorage.setItem("token", data.token);

    // The backend already returns user info
    const userData: User = data.user;

    // Also decode token for fallback validation
    try {
      const decoded = JSON.parse(atob(data.token.split(".")[1]));
      // Merge role and username if needed
      userData.role = decoded.role || userData.role;
      userData.username = decoded.username || userData.username;
    } catch (e) {
      console.warn("Failed to decode token:", e);
    }

    // Save user info
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    // ✅ Return for navigation redirection
    return userData;
  };

  // 🟢 Register
  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    await api.post("/auth/register", { username, email, password });
  };

  // 🔴 Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  // ♻️ Restore user on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        const parsed: User = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
