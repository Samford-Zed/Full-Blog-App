import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { postsApi } from "../api/posts";
import api from "../api/client";
import { Post } from "../types";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { EditPostModal } from "../components/EditPostModal";
import {
  LogOut,
  Plus,
  BookOpen,
  Search,
  Loader2,
  Heart,
  MessageSquare,
} from "lucide-react";

export default function UserDashboard() {
  const { user, logout } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // 📊 Dashboard stats
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  useEffect(() => {
    if (user) {
      loadUserPosts();
      loadUserStats();
    }
  }, [user]);

  // ✅ Load only logged-in user's posts
  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/my-posts"); // backend route for logged-in user
      setPosts(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load dashboard stats
  const loadUserStats = async () => {
    try {
      const { data } = await api.get("/my-stats"); // backend route for logged-in user stats
      setStats(data);
    } catch {
      // silent fallback
    }
  };

  // 🔍 Handle search (by text or tag)
  const handleSearch = async (e?: React.FormEvent, tagQuery?: string) => {
    e?.preventDefault();
    const searchTerm = tagQuery || query.trim();

    if (!searchTerm) {
      loadUserPosts();
      return;
    }

    try {
      setSearching(true);
      const { data } = await api.get(`/search?q=${searchTerm}`);
      const filtered = data.filter(
        (p: Post) => p.author?.username === user?.username
      );
      setPosts(filtered);
      setError("");
      if (tagQuery) setQuery(tagQuery);
    } catch (err: any) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleCreatePost = async (title: string, content: string) => {
    await postsApi.createPost({ title, content });
    await loadUserPosts();
    await loadUserStats();
  };

  const handleEditPost = async (id: number, title: string, content: string) => {
    await postsApi.updatePost(id, { title, content });
    await loadUserPosts();
    await loadUserStats();
  };

  const handleDeletePost = async (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      await postsApi.deletePost(id);
      await loadUserPosts();
      await loadUserStats();
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen text-gray-600 text-lg'>
        Loading user data...
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Navbar */}
      <nav className='bg-white shadow-md border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center gap-3'>
              <BookOpen className='w-8 h-8 text-blue-600' />
              <h1 className='text-2xl font-bold text-gray-800'>
                User Dashboard
              </h1>
            </div>

            <div className='flex items-center gap-4'>
              <span className='text-gray-700 font-medium'>
                Hello, <span className='text-blue-600'>{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition'
              >
                <LogOut className='w-4 h-4' />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Overview Stats */}
        <div className='grid gap-6 md:grid-cols-3 mb-8'>
          {[
            { title: "Your Posts", value: stats.totalPosts, icon: BookOpen },
            { title: "Total Likes", value: stats.totalLikes, icon: Heart },
            {
              title: "Total Comments",
              value: stats.totalComments,
              icon: MessageSquare,
            },
          ].map(({ title, value, icon: Icon }) => (
            <div
              key={title}
              className='bg-white p-6 rounded-lg shadow border flex items-center justify-between'
            >
              <div>
                <h3 className='text-sm text-gray-500'>{title}</h3>
                <p className='text-3xl font-bold text-gray-800 mt-1'>{value}</p>
              </div>
              <Icon className='w-8 h-8 text-blue-600 opacity-80' />
            </div>
          ))}
        </div>

        {/* Header + Search + Create */}
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4'>
          <div>
            <h2 className='text-3xl font-bold text-gray-800'>My Posts</h2>
            <p className='text-gray-600 mt-1'>
              Create, view, and manage your blog posts
            </p>
          </div>

          <div className='flex items-center gap-3'>
            {/* 🔍 Search Bar */}
            <form
              onSubmit={handleSearch}
              className='relative flex items-center w-full md:w-72'
            >
              <Search className='absolute left-3 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search your posts...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none'
              />
              {query && (
                <button
                  type='button'
                  onClick={() => {
                    setQuery("");
                    loadUserPosts();
                  }}
                  className='absolute right-3 text-gray-400 hover:text-gray-600'
                >
                  ✕
                </button>
              )}
            </form>

            {/* ➕ Create Post */}
            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg font-medium'
            >
              <Plus className='w-5 h-5' />
              Create
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600'>{error}</p>
          </div>
        )}

        {/* Post list / loading states */}
        {loading || searching ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='animate-spin w-10 h-10 text-blue-600' />
          </div>
        ) : posts.length === 0 ? (
          <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <BookOpen className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>
              No posts found
            </h3>
            <p className='text-gray-500'>Start writing your first post!</p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                query={query}
                showActions
                onEdit={(p) => {
                  setSelectedPost(p);
                  setIsEditModalOpen(true);
                }}
                onDelete={handleDeletePost}
                onTagClick={(tag) => handleSearch(undefined, tag)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 🧩 Modals */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        post={selectedPost}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPost(null);
        }}
        onSubmit={handleEditPost}
      />
    </div>
  );
}
