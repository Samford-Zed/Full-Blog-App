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

// ✅ Allow frontend connection
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ✅ PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 🧠 Middleware for authentication
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

// 🧠 Middleware for admin authorization
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// ✅ Ensure a default admin exists
async function ensureAdmin() {
  const result = await pool.query("SELECT * FROM users WHERE role = 'admin'");
  if (result.rows.length === 0) {
    const hashed = await bcrypt.hash("admin123", 10);
    await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'admin')",
      ["admin", "admin@example.com", hashed]
    );
    console.log("✅ Default admin created → admin@example.com / admin123");
  }
}

// ✅ Start the server after DB connection
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

// 🟢 Root
app.get("/", (_, res) => {
  res.json({ message: "Blog API is running 🚀" });
});

// 🟩 Register (all fields required)
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const exists = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING id, username, email, role",
      [username.trim(), email.trim(), hashed]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 🟨 Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
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

//
// ─── POSTS ──────────────────────────────────────────────────────────────────────
//

// 🟢 Get all posts (auth required)
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        u.username AS author
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟨 Get a single post
app.get("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username AS author
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔵 Create post (any logged-in user)
app.post("/api/posts", authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (title, content, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, content, user_id, created_at`,
      [title.trim(), content.trim(), req.user.id]
    );

    const newPost = result.rows[0];
    const userRes = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [req.user.id]
    );
    newPost.author = userRes.rows[0].username;

    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟧 Update post (owner or admin)
app.put("/api/posts/:id", authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const existing = await pool.query("SELECT * FROM posts WHERE id = $1", [
      req.params.id,
    ]);
    if (existing.rows.length === 0)
      return res.status(404).json({ message: "Post not found" });

    // Only owner or admin can edit
    if (existing.rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const result = await pool.query(
      "UPDATE posts SET title=$1, content=$2 WHERE id=$3 RETURNING *",
      [title.trim(), content.trim(), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔴 Delete post (Admin only)
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

//
// ─── COMMENTS ───────────────────────────────────────────────────────────────────
//

app.get("/api/posts/:id/comments", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/posts/:id/comments", authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim())
    return res.status(400).json({ message: "Comment content required" });

  try {
    const result = await pool.query(
      "INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
      [req.params.id, req.user.id, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// ─── LIKES ──────────────────────────────────────────────────────────────────────
//

app.post("/api/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id: postId } = req.params;

    const existing = await pool.query(
      "SELECT * FROM post_likes WHERE post_id=$1 AND user_id=$2",
      [postId, userId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2",
        [postId, userId]
      );
      return res.json({ message: "Like removed" });
    }

    const result = await pool.query(
      "INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) RETURNING *",
      [postId, userId]
    );

    res.status(201).json({ message: "Post liked", like: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// 🟢 Get all users (Admin only)
app.get("/api/auth/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    res.status(500).json({ message: "Failed to load users" });
  }
});
