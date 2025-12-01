import { create } from 'zustand';
import { Todo, TodoStats, TodoFilters } from '@/types';
import { todoService } from '@/services/todoService';

interface TodoStore {
  todos: Todo[];
  stats: TodoStats | null;
  loading: boolean;
  error: string | null;
  filters: TodoFilters;
  
  // Actions
  fetchTodos: (filters?: TodoFilters) => Promise<void>;
  fetchTodoStats: () => Promise<void>;
  createTodo: (todoData: Partial<Todo>) => Promise<void>;
  updateTodo: (id: string, todoData: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodoComplete: (id: string) => Promise<void>;
  setFilters: (filters: TodoFilters) => void;
  clearError: () => void;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  stats: null,
  loading: false,
  error: null,
  filters: {},

  fetchTodos: async (filters?: TodoFilters) => {
    set({ loading: true, error: null });
    try {
      const response = await todoService.getTodos(filters || get().filters);
      set({ 
        todos: response.todos,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch todos',
        loading: false 
      });
    }
  },

  fetchTodoStats: async () => {
    try {
      const stats = await todoService.getTodoStats();
      set({ stats });
    } catch (error: any) {
      console.error('Failed to fetch todo stats:', error);
    }
  },

  createTodo: async (todoData: Partial<Todo>) => {
    set({ loading: true, error: null });
    try {
      const newTodo = await todoService.createTodo(todoData);
      set(state => ({ 
        todos: [newTodo, ...state.todos],
        loading: false 
      }));
      // Refresh stats
      get().fetchTodoStats();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create todo',
        loading: false 
      });
    }
  },

  updateTodo: async (id: string, todoData: Partial<Todo>) => {
    set({ loading: true, error: null });
    try {
      const updatedTodo = await todoService.updateTodo(id, todoData);
      set(state => ({
        todos: state.todos.map(todo => 
          todo._id === id ? updatedTodo : todo
        ),
        loading: false
      }));
      // Refresh stats
      get().fetchTodoStats();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update todo',
        loading: false 
      });
    }
  },

  deleteTodo: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await todoService.deleteTodo(id);
      set(state => ({
        todos: state.todos.filter(todo => todo._id !== id),
        loading: false
      }));
      // Refresh stats
      get().fetchTodoStats();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete todo',
        loading: false 
      });
    }
  },

  toggleTodoComplete: async (id: string) => {
    try {
      const updatedTodo = await todoService.toggleTodoComplete(id);
      set(state => ({
        todos: state.todos.map(todo => 
          todo._id === id ? updatedTodo : todo
        )
      }));
      // Refresh stats
      get().fetchTodoStats();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to toggle todo'
      });
    }
  },

  setFilters: (filters: TodoFilters) => {
    set({ filters });
    // Fetch todos with new filters
    get().fetchTodos(filters);
  },

  clearError: () => set({ error: null })
}));
