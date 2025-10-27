import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { postsApi } from "../api/posts";
import { authApi } from "../api/auth";
import { Post, User } from "../types";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { EditPostModal } from "../components/EditPostModal";
import { LogOut, Plus, Users, BookOpen, Shield } from "lucide-react";
import { PostDetailsModal } from "../components/PostDetailsModal";
import api from "../api/client";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "posts") {
        const postsData = await postsApi.getAllPosts();
        setPosts(postsData);
      } else {
        const usersData = await authApi.getUsers();
        setUsers(usersData);
      }
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (title: string, content: string) => {
    await postsApi.createPost({ title, content });
    await loadData();
  };

  const handleEditPost = async (id: number, title: string, content: string) => {
    await postsApi.updatePost(id, { title, content });
    await loadData();
  };

  const handleDeletePost = async (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await postsApi.deletePost(id);
        await loadData();
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete post");
      }
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // 👁 View post details
  const handleViewDetails = async (post: Post) => {
    try {
      setSelectedPost(post);
      const { data } = await api.get(`/posts/${post.id}/comments`);
      setSelectedComments(data);
      setIsDetailsModalOpen(true);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Shield className='w-12 h-12 mx-auto text-red-500 mb-4' />
          <h1 className='text-2xl font-semibold text-gray-800'>
            Access Denied
          </h1>
          <p className='text-gray-500 mt-2'>
            You do not have permission to view this page.
          </p>
        </div>
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
              <Shield className='w-8 h-8 text-blue-600' />
              <h1 className='text-2xl font-bold text-gray-800'>
                Admin Dashboard
              </h1>
            </div>
            <div className='flex items-center gap-4'>
              <span className='text-gray-700 font-medium'>
                {user?.username}{" "}
                <span className='text-sm text-blue-600'>(Admin)</span>
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

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Tabs */}
        <div className='flex gap-4 mb-8'>
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "posts"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <BookOpen className='w-5 h-5' />
            Manage Posts
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "users"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <Users className='w-5 h-5' />
            Manage Users
          </button>
        </div>

        {/* Errors */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600'>{error}</p>
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === "posts" && (
          <>
            <div className='flex justify-between items-center mb-8'>
              <div>
                <h2 className='text-3xl font-bold text-gray-800'>All Posts</h2>
                <p className='text-gray-600 mt-1'>
                  View, edit, and delete blog posts
                </p>
              </div>
              {/*  <button
                onClick={() => setIsCreateModalOpen(true)}
                className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg font-medium'
              >
                <Plus className='w-5 h-5' />
                Create Post
              </button>*/}
            </div>

            {loading ? (
              <div className='flex items-center justify-center py-20'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
              </div>
            ) : posts.length === 0 ? (
              <div className='bg-white rounded-lg shadow-md p-12 text-center'>
                <BookOpen className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>
                  No posts found
                </h3>
              </div>
            ) : (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showActions
                    onEdit={(p) => {
                      setSelectedPost(p);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeletePost}
                    onView={handleViewDetails} // 👁 added view button
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className='bg-white rounded-lg shadow-md overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    ID
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Username
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Email
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.map((u) => (
                  <tr key={u.id} className='hover:bg-gray-50 transition'>
                    <td className='px-6 py-4 text-sm text-gray-900'>{u.id}</td>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      {u.username}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-700'>
                      {u.email}
                    </td>
                    <td className='px-6 py-4 text-sm'>
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🧩 Modals */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
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
      <PostDetailsModal
        isOpen={isDetailsModalOpen}
        post={selectedPost}
        comments={selectedComments}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPost(null);
        }}
      />
    </div>
  );
}
