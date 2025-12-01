import React, { useState, useEffect, useRef } from 'react';
import { Plus, Filter, Flag, CheckCircle, Circle, Trash2, Edit2 } from 'lucide-react';
import { Todo, TodoFilters } from '@/types';
import { useTodoStore } from '@/stores/useTodoStore';

export const TodoList: React.FC = () => {
  const { 
    todos, 
    stats, 
    loading, 
    error, 
    filters,
    fetchTodos,
    fetchTodoStats,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    setFilters,
    clearError
  } = useTodoStore();

  const [searchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showModalPriorityDropdown, setShowModalPriorityDropdown] = useState(false);
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'general' as 'general' | 'music' | 'backend' | 'frontend' | 'bug' | 'feature'
  });

  const updateDropdownPosition = () => {
    if (categoryDropdownRef.current) {
      const rect = categoryDropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (showModalCategoryDropdown) {
      updateDropdownPosition();
    }
  }, [showModalCategoryDropdown]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowPriorityDropdown(false);
        setShowCategoryDropdown(false);
        setShowModalPriorityDropdown(false);
        setShowModalCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTodos();
    fetchTodoStats();
  }, [fetchTodos, fetchTodoStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTodo) {
        await updateTodo(editingTodo._id, formData);
      } else {
        await createTodo(formData);
      }
      resetForm();
      fetchTodos();
      fetchTodoStats();
    } catch (error) {
      console.error('Error saving todo:', error);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category
    });
    setShowCreateModal(true);
  };

  const handleDelete = (todo: Todo) => {
    setTodoToDelete(todo);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (todoToDelete) {
      try {
        await deleteTodo(todoToDelete._id);
        fetchTodos();
        fetchTodoStats();
        setShowDeleteDialog(false);
        setTodoToDelete(null);
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setTodoToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general'
    });
    setEditingTodo(null);
    setShowCreateModal(false);
  };

  const handleFilterChange = (newFilters: Partial<TodoFilters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900/50 text-red-300 border-red-600';
      case 'medium':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-600';
      case 'low':
        return 'bg-green-900/50 text-green-300 border-green-600';
      default:
        return 'bg-zinc-700 text-zinc-300 border-zinc-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return '';
      case 'music': return '';
      case 'backend': return '';
      case 'frontend': return '';
      case 'bug': return '';
      case 'feature': return '';
      default: return '';
    }
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const currentFilters = filters || {};
    const matchesPriority = !currentFilters.priority || todo.priority === currentFilters.priority;
    const matchesCategory = !currentFilters.category || todo.category === currentFilters.category;
    const matchesCompleted = currentFilters.completed === undefined || todo.completed === currentFilters.completed;
    
    return matchesSearch && matchesPriority && matchesCategory && matchesCompleted;
  });

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">Todo List</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-zinc-100 rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Todo
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-zinc-800/50 border border-zinc-700 p-3 sm:p-4 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-zinc-100">{stats.total}</div>
            <div className="text-xs sm:text-sm text-zinc-400">Total</div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 p-3 sm:p-4 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-xs sm:text-sm text-zinc-400">Completed</div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 p-3 sm:p-4 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-orange-400">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-zinc-400">Pending</div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 p-3 sm:p-4 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-red-400">{stats.highPriority}</div>
            <div className="text-xs sm:text-sm text-zinc-400">High Priority</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative w-full sm:w-auto dropdown-container">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 text-zinc-100 text-sm sm:text-base w-full sm:w-auto"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 p-4 space-y-3 w-64 sm:w-80">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Priority</label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-zinc-100 text-sm appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNEMiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[right_8px_center] bg-[length:12px_8px] pr-10 box-border text-left"
                    >
                      {filters.priority || 'All Priorities'}
                    </button>
                    {showPriorityDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ priority: undefined });
                            setShowPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          All Priorities
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ priority: 'high' });
                            setShowPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          High
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ priority: 'medium' });
                            setShowPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          Medium
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ priority: 'low' });
                            setShowPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          Low
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Category</label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-zinc-100 text-sm appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNEMiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[right_8px_center] bg-[length:12px_8px] pr-10 box-border text-left"
                    >
                      {filters.category || 'All Categories'}
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ category: undefined });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          All Categories
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ category: 'general' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          General
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ category: 'music' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          Music
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ category: 'backend' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          Backend
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ category: 'frontend' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          Frontend
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ category: 'bug' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          Bug
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange({ category: 'feature' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm"
                        >
                          Feature
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base">
          {error}
          <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-100 text-lg">×</button>
        </div>
      )}

      {/* Todo List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm sm:text-base">
              No todos found. Create your first todo!
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo._id}
                className={`bg-zinc-800/50 border ${todo.completed ? 'opacity-60 border-zinc-700' : 'border-zinc-700'} p-3 sm:p-4 rounded-lg`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTodoComplete(todo._id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {todo.completed ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 hover:text-emerald-500" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-sm sm:text-base ${todo.completed ? 'line-through text-zinc-500' : 'text-zinc-100'} truncate`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-xs sm:text-sm text-zinc-400 mt-1 line-clamp-2">{todo.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                            <Flag className="w-3 h-3" />
                            {todo.priority}
                          </span>
                          
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-zinc-700 text-zinc-300 border border-zinc-600">
                            <span>{getCategoryIcon(todo.category)}</span>
                            {todo.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(todo)}
                          className="p-1 text-zinc-400 hover:text-emerald-500"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(todo)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              {editingTodo ? 'Edit Todo' : 'Create Todo'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-zinc-100 placeholder-zinc-500 text-sm sm:text-base"
                  placeholder="Enter todo title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-zinc-100 placeholder-zinc-500 text-sm sm:text-base"
                  rows={3}
                  placeholder="Enter description (optional)"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Priority
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setShowModalPriorityDropdown(!showModalPriorityDropdown)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-zinc-100 text-sm sm:text-base appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNEMiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[right_8px_center] bg-[length:12px_8px] pr-10 box-border text-left"
                    >
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                    </button>
                    {showModalPriorityDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, priority: 'low' });
                            setShowModalPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm sm:text-base"
                        >
                          Low
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, priority: 'medium' });
                            setShowModalPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm sm:text-base"
                        >
                          Medium
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, priority: 'high' });
                            setShowModalPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-600 text-sm sm:text-base"
                        >
                          High
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Category
                  </label>
                  <div className="relative dropdown-container" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowModalCategoryDropdown(!showModalCategoryDropdown)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-zinc-100 text-sm sm:text-base appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNEMiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[right_8px_center] bg-[length:12px_8px] pr-10 box-border text-left transition-all duration-200 hover:border-zinc-500"
                    >
                      <span className="flex items-center justify-between">
                        <span>{formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}</span>
                      </span>
                    </button>
                    {showModalCategoryDropdown && (
                      <div 
                        className="fixed z-[9999] bg-zinc-800 border border-zinc-600 rounded-xl shadow-2xl max-h-48 overflow-y-auto backdrop-blur-sm"
                        style={{
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          width: `${dropdownPosition.width}px`
                        }}
                      >
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: 'general' });
                              setShowModalCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-zinc-100 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-150 text-sm sm:text-base flex items-center gap-2 group"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                            General
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: 'music' });
                              setShowModalCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-zinc-100 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-150 text-sm sm:text-base flex items-center gap-2 group"
                          >
                            <span className="w-2 h-2 rounded-full bg-purple-500 group-hover:scale-125 transition-transform"></span>
                            Music
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: 'backend' });
                              setShowModalCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-zinc-100 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-150 text-sm sm:text-base flex items-center gap-2 group"
                          >
                            <span className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform"></span>
                            Backend
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: 'frontend' });
                              setShowModalCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-zinc-100 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-150 text-sm sm:text-base flex items-center gap-2 group"
                          >
                            <span className="w-2 h-2 rounded-full bg-orange-500 group-hover:scale-125 transition-transform"></span>
                            Frontend
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: 'bug' });
                              setShowModalCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-zinc-100 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-150 text-sm sm:text-base flex items-center gap-2 group"
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform"></span>
                            Bug
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: 'feature' });
                              setShowModalCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-zinc-100 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-150 text-sm sm:text-base flex items-center gap-2 group"
                          >
                            <span className="w-2 h-2 rounded-full bg-yellow-500 group-hover:scale-125 transition-transform"></span>
                            Feature
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-zinc-100 rounded-lg hover:bg-emerald-700 text-sm sm:text-base"
                >
                  {editingTodo ? 'Update' : 'Create'} Todo
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg hover:bg-zinc-600 text-zinc-100 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9998] p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Delete Todo</h3>
                <p className="text-sm text-zinc-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-zinc-300">
                Are you sure you want to delete 
                <span className="font-semibold text-zinc-100"> "{todoToDelete?.title}"</span>?
              </p>
              {todoToDelete?.description && (
                <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                  {todoToDelete.description}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg hover:bg-zinc-600 text-zinc-100 text-sm sm:text-base transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 text-white text-sm sm:text-base transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
