let POSTS = [];
let id = 1;

exports.getAllPosts = (req, res) => {
  res.json(POSTS);
};

exports.getPostById = (req, res) => {
  const post = POSTS.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
};

exports.createPost = (req, res) => {
  const { title, body } = req.body;
  if (!title || !body)
    return res.status(400).json({ error: "title and body required" });
  const newPost = {
    id: id++,
    title,
    body,
    createdAt: new Date().toISOString(),
  };
  POSTS.push(newPost);
  res.status(201).json(newPost);
};

exports.updatePost = (req, res) => {
  const post = POSTS.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });
  const { title, body } = req.body;
  post.title = title ?? post.title;
  post.body = body ?? post.body;
  res.json(post);
};

exports.deletePost = (req, res) => {
  const index = POSTS.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Post not found" });
  POSTS.splice(index, 1);
  res.json({ message: "Post deleted" });
};
