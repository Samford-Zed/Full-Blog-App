import express from "express";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();
const { Pool } = pkg;
const app = express();

// ─── Middleware Setup ───────────────────────────────────────────────

// ✅ Increase upload and JSON size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ Serve uploaded files publicly
app.use("/uploads", express.static(path.resolve("uploads")));

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ✅ Enable CORS (must come before routes)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// ─── PostgreSQL Connection ──────────────────────────────────────────

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ─── Authentication Middleware ──────────────────────────────────────

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

function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// ─── Ensure Default Admin ───────────────────────────────────────────

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

// ─── File Upload Setup ──────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ─── Root Endpoint ──────────────────────────────────────────────────

app.get("/", (_, res) => {
  res.json({ message: "Blog API is running 🚀" });
});

// ─── Authentication Routes ──────────────────────────────────────────

// 🟩 Register
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

// ─── Posts Routes ───────────────────────────────────────────────────

// 🟢 Get posts
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    let result;

    if (req.user.role === "admin") {
      result = await pool.query(`
        SELECT p.id, p.title, p.content, p.image, p.created_at, u.username AS author
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.id DESC
      `);
    } else {
      result = await pool.query(
        `
        SELECT p.id, p.title, p.content, p.image, p.created_at, u.username AS author
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
        ORDER BY p.id DESC
      `,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔵 Create post (with optional image)
app.post(
  "/api/posts",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const result = await pool.query(
        `INSERT INTO posts (title, content, image, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, content, image, user_id, created_at`,
        [title.trim(), content.trim(), imagePath, req.user.id]
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
  }
);

// 🟧 Update post
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

// ─── User Stats & Comments & Likes ───────────────────────────────────

app.get("/api/my-posts", authenticateToken, async (req, res) => {
  const result = await pool.query(
    "SELECT p.*, u.username AS author FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE user_id = $1 ORDER BY p.id DESC",
    [req.user.id]
  );
  res.json(result.rows);
});

app.get("/api/my-stats", authenticateToken, async (req, res) => {
  const [postsRes, likesRes, commentsRes] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM posts WHERE user_id = $1", [req.user.id]),
    pool.query("SELECT COUNT(*) FROM post_likes WHERE user_id = $1", [
      req.user.id,
    ]),
    pool.query("SELECT COUNT(*) FROM comments WHERE user_id = $1", [
      req.user.id,
    ]),
  ]);

  res.json({
    totalPosts: parseInt(postsRes.rows[0].count),
    totalLikes: parseInt(likesRes.rows[0].count),
    totalComments: parseInt(commentsRes.rows[0].count),
  });
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

// ─── Start Server ───────────────────────────────────────────────────

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
// 🟢 Get total likes for a post
app.get("/api/posts/:id/likes", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1",
      [postId]
    );
    const likedByUser =
      (
        await pool.query(
          "SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2",
          [postId, req.user.id]
        )
      ).rows.length > 0;

    res.json({ count: rows[0].count, liked: likedByUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
