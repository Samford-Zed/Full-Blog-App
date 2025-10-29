import apiClient from "./client";
import { Post } from "../types";

export const postsApi = {
  getAllPosts: async (): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>("/posts");
    return response.data;
  },

  getPostById: async (id: number): Promise<Post> => {
    const response = await apiClient.get<Post>(`/posts/${id}`);
    return response.data;
  },

  // ✅ Create post with image
  createPost: async (data: {
    title: string;
    content: string;
    image?: File | null;
  }): Promise<Post> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    if (data.image) formData.append("image", data.image);

    const response = await apiClient.post<Post>("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updatePost: async (
    id: number,
    data: { title: string; content: string; image?: File | null }
  ): Promise<Post> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    if (data.image) formData.append("image", data.image);

    const response = await apiClient.put<Post>(`/posts/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}`);
  },
};
