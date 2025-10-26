import express from "express";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

dotenv.config();

const { Pool } = pkg;
const app = express();
app.use(express.json());

// 🧩 Enable CORS for your React frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// 🧩 PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 🧠 Middleware: Verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// 🧠 Middleware: Admin-only access
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// ✅ Ensure default admin exists
async function ensureAdmin() {
  const check = await pool.query("SELECT * FROM users WHERE role = 'admin'");
  if (check.rows.length === 0) {
    const hashed = await bcrypt.hash("admin123", 10);
    await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'admin')",
      ["admin", "admin@example.com", hashed]
    );
    console.log("✅ Default admin created: admin@example.com / admin123");
  }
}

// ✅ Start server after DB connection
const PORT = Number(process.env.PORT) || 4000;

pool
  .connect()
  .then(async () => {
    console.log("✅ Connected to PostgreSQL");
    await ensureAdmin();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

// 🟢 Root route
app.get("/", (req, res) => {
  res.json({ message: "Blog API is running 🚀" });
});

// 🟩 Register 
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  console.log("📩 Register request:", req.body);

  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Prevent duplicate email
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING id, username, email, role",
      [username.trim(), email.trim(), hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 🟨 Login (required fields)
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.trim(),
    ]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

// 🟢 Get all posts (auth required)
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM posts ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟡 Get one post
app.get("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔵 Create post (all fields required)
app.post("/api/posts", authenticateToken, async (req, res) => {
  const { title, content } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *",
      [title.trim(), content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟠 Update post (required fields)
app.put("/api/posts/:id", authenticateToken, async (req, res) => {
  const { title, content } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const result = await pool.query(
      "UPDATE posts SET title=$1, content=$2 WHERE id=$3 RETURNING *",
      [title.trim(), content.trim(), req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔴 Delete post (admin only)
app.delete("/api/posts/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM posts WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted by admin" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ⚙️ Admin dashboard
app.get(
  "/api/admin/dashboard",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await pool.query(
        "SELECT id, username, email, role FROM users"
      );
      res.json({ message: "Welcome, Admin!", users: users.rows });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

