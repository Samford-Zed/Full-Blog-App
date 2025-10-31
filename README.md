

<header>
  <h1>📰 Full Blog Application</h1>
  <p>A modern full-stack blog platform built with React, Node.js, PostgreSQL, and Tailwind CSS.</p>
</header>

<main>

  <section class="section">
    <h2>🚀 Tech Stack</h2>
    <h3>🧩 Frontend</h3>
    <ul>
      <li>React + TypeScript (Vite)</li>
      <li>Tailwind CSS for styling</li>
      <li>Axios for API requests</li>
      <li>React-Quill for rich text editing</li>
    </ul>

    <h3>⚙️ Backend</h3>
    <ul>
      <li>Node.js + Express</li>
      <li>PostgreSQL (with pg library)</li>
      <li>JWT Authentication &amp; Role-based Access</li>
      <li>Multer for image upload</li>
      <li>Bcrypt for password hashing</li>
    </ul>
  </section>

  <section class="section">
    <h2>📁 Folder Structure</h2>
    <pre><code>
Full-Blog-App/
│
├── Backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   └── uploads/
│   └── .env
│
└── Frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── contexts/
    │   ├── pages/
    │   └── types/
    ├── package.json
    └── vite.config.ts
    </code></pre>
  </section>

  <section class="section">
    <h2>✨ Features</h2>
    <ul>
      <li><strong>User Authentication:</strong> Register, Login, Logout</li>
      <li><strong>JWT Tokens</strong> for secure sessions</li>
      <li><strong>Blog Management:</strong> Create, Edit, Delete, View</li>
      <li><strong>Image Uploads</strong> using Multer</li>
      <li><strong>Rich Text Editor</strong> (React-Quill)</li>
      <li><strong>Like & Comment</strong> system with live updates</li>
      <li><strong>Admin Dashboard</strong> for user/post statistics</li>
    </ul>
  </section>

  <section class="section">
    <h2>⚙️ Environment Setup</h2>
    <div class="highlight">
      <h3>.env Configuration (Backend)</h3>
      <pre><code>
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=blogdb
JWT_SECRET=your_secret_key
      </code></pre>
    </div>
  </section>

  <section class="section">
    <h2>🗃️ Database Schema</h2>
    <pre><code>
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);
    </code></pre>
  </section>

  <section class="section">
    <h2>🧰 Installation & Running</h2>
    <h3>Backend</h3>
    <pre><code>
cd Backend
npm install
npm run dev
    </code></pre>

    <h3>Frontend</h3>
    <pre><code>
cd Frontend
npm install
npm run dev
    </code></pre>
  </section>

  <section class="section">
    <h2>📦 API Endpoints</h2>
    <table>
      <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
      <tr><td>POST</td><td>/api/auth/register</td><td>Register a new user</td></tr>
      <tr><td>POST</td><td>/api/auth/login</td><td>Login a user</td></tr>
      <tr><td>GET</td><td>/api/posts</td><td>Get posts (admin or user)</td></tr>
      <tr><td>POST</td><td>/api/posts</td><td>Create a post</td></tr>
      <tr><td>PUT</td><td>/api/posts/:id</td><td>Edit a post</td></tr>
      <tr><td>DELETE</td><td>/api/posts/:id</td><td>Delete post (admin only)</td></tr>
      <tr><td>POST</td><td>/api/posts/:id/like</td><td>Like or unlike a post</td></tr>
      <tr><td>GET</td><td>/api/my-posts</td><td>Get user’s own posts</td></tr>
      <tr><td>GET</td><td>/api/my-stats</td><td>Get user stats</td></tr>
      <tr><td>GET</td><td>/api/admin/stats</td><td>Get admin overview</td></tr>
    </table>
  </section>

  <section class="section">
    <h2>🧑‍💼 Default Admin</h2>
    <div class="highlight">
      <p><strong>Email:</strong> admin@example.com</p>
      <p><strong>Password:</strong> admin123</p>
    </div>
  </section>

  <section class="section">
    <h2>💡 Future Improvements</h2>
    <ul>
      <li>Pagination & post filtering</li>
      <li>Profile image upload</li>
      <li>Password reset via email</li>
      <li>Dark / Light theme switch</li>
    </ul>
  </section>

</main>

<footer>
  <p>Made with ❤️ by <strong>Samuel Zenebe</strong> — Full Stack Developer</p>

</body>
</html>
