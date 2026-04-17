import React, { useState, useEffect } from 'react';
import { Panel } from './Panel';
import { CheckSquare, Square, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../firebase';
import { useNeuralAuth } from '../context/NeuralContext';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'normal';
  userId: string;
  createdAt: string;
}

export function TaskLog() {
  const { user } = useNeuralAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [error, setError] = useState('');

  const userId = user?.id;

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      const path = 'tasks';
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, completed, priority, user_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const loadedTasks = (data ?? []).map((task) => ({
          id: task.id,
          title: task.title,
          completed: task.completed,
          priority: task.priority,
          userId: task.user_id,
          createdAt: task.created_at,
        })) as Task[];

        loadedTasks.sort((a, b) => {
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (a.priority !== 'high' && b.priority === 'high') return 1;
          return 0;
        });

        if (isMounted) {
          setTasks(loadedTasks);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    };

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const toggleTask = async (task: Task) => {
    if (!userId) return;
    const path = `tasks/${task.id}`;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? { ...currentTask, completed: !currentTask.completed }
            : currentTask
        )
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setError('Task title cannot be empty.');
      return;
    }
    setError('');
    if (!userId) return;

    const newId = Date.now().toString();
    const path = `tasks/${newId}`;
    const taskData = {
      id: newId,
      title: newTaskTitle.trim(),
      completed: false,
      priority: newTaskTitle.toLowerCase().includes('urgent') ? 'high' : 'normal',
      user_id: userId,
    };

    setNewTaskTitle('');
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select('id, title, completed, priority, user_id, created_at')
        .single();

      if (error) {
        throw error;
      }

      setTasks((currentTasks) => {
        const nextTasks = [
          {
            id: data.id,
            title: data.title,
            completed: data.completed,
            priority: data.priority,
            userId: data.user_id,
            createdAt: data.created_at,
          } as Task,
          ...currentTasks,
        ];

        nextTasks.sort((a, b) => {
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (a.priority !== 'high' && b.priority === 'high') return 1;
          return 0;
        });

        return nextTasks;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    const path = `tasks/${id}`;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full text-cyber-blue/50 font-mono text-sm text-center p-4">
        AUTHENTICATION REQUIRED FOR MISSION LOGS
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 mb-3">
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 font-mono text-xs mt-4">NO ACTIVE TASKS</div>
        )}
        {tasks.map(task => (
          <div 
            key={task.id}
            onClick={() => toggleTask(task)}
            className={`group flex items-start gap-3 p-2 border rounded cursor-pointer transition-colors ${
              task.completed 
                ? 'bg-gray-900/50 border-gray-800 text-gray-500' 
                : task.priority === 'high'
                  ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400'
                  : 'bg-cyber-blue/5 border-cyber-blue/20 text-cyber-blue/80'
            }`}
          >
            <div className="mt-0.5">
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-gray-600" />
              ) : (
                <Square className={`w-4 h-4 ${task.priority === 'high' ? 'text-fuchsia-500' : 'text-cyber-blue'}`} />
              )}
            </div>
            <div className="flex-1">
              <div className={`font-mono text-sm ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </div>
              {task.priority === 'high' && !task.completed && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-fuchsia-500 uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" />
                  Critical Priority
                </div>
              )}
            </div>
            <button 
              onClick={(e) => deleteTask(task.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addTask} className="relative mt-auto flex flex-col gap-1">
        <div className="relative">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => {
              setNewTaskTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="Add new task..."
            className={`w-full bg-black/50 border ${error ? 'border-red-500/50' : 'border-fuchsia-500/30'} rounded p-2 pr-8 text-fuchsia-400 font-mono text-xs focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 placeholder-fuchsia-500/30 transition-colors`}
          />
          <button 
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-fuchsia-500 hover:text-white hover:bg-fuchsia-500/20 rounded transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {error && <span className="text-red-500 text-[10px] font-mono ml-1">{error}</span>}
      </form>
    </div>
  );
}
