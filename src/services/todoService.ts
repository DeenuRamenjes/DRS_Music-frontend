import { axiosInstance } from '@/lib/axios';
import { Todo, TodoFilters } from '@/types';

export const todoService = {
  // Get all todos with optional filters
  async getTodos(filters: TodoFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.completed !== undefined) {
      params.append('completed', filters.completed.toString());
    }
    if (filters.priority) {
      params.append('priority', filters.priority);
    }
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await axiosInstance.get(`/todos?${params.toString()}`);
    return response.data;
  },

  // Get single todo by ID
  async getTodoById(id: string) {
    const response = await axiosInstance.get(`/todos/${id}`);
    return response.data;
  },

  // Create new todo
  async createTodo(todoData: Partial<Todo>) {
    const response = await axiosInstance.post('/todos', todoData);
    return response.data;
  },

  // Update todo
  async updateTodo(id: string, todoData: Partial<Todo>) {
    const response = await axiosInstance.put(`/todos/${id}`, todoData);
    return response.data;
  },

  // Delete todo
  async deleteTodo(id: string) {
    const response = await axiosInstance.delete(`/todos/${id}`);
    return response.data;
  },

  // Toggle todo completion
  async toggleTodoComplete(id: string) {
    const response = await axiosInstance.patch(`/todos/${id}/toggle`);
    return response.data;
  },

  // Get todo statistics
  async getTodoStats() {
    const response = await axiosInstance.get('/todos/stats');
    return response.data;
  }
};
