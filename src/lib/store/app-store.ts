/**
 * App Store
 * 
 * Global state management using Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewType } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export interface AppState {
  // Navigation state
  activeView: ViewType | 'custom';
  activeListId: string | null;
  activeLabelId: string | null;
  
  // UI state
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  showCompletedTasks: boolean;
  
  // Search state
  searchQuery: string;
  searchOpen: boolean;
  
  // Dialog state
  taskDialogOpen: boolean;
  taskDialogTaskId: string | null;
  taskDialogMode: 'create' | 'edit' | 'view';
  
  listDialogOpen: boolean;
  listDialogListId: string | null;
  listDialogMode: 'create' | 'edit';
  
  labelDialogOpen: boolean;
  labelDialogLabelId: string | null;
  labelDialogMode: 'create' | 'edit';
  
  deleteDialogOpen: boolean;
  deleteDialogType: 'task' | 'list' | 'label' | null;
  deleteDialogId: string | null;
  deleteDialogName: string;
}

export interface AppActions {
  // Navigation actions
  setActiveView: (view: ViewType | 'custom') => void;
  setActiveList: (listId: string | null) => void;
  setActiveLabel: (labelId: string | null) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleShowCompletedTasks: () => void;
  setShowCompletedTasks: (show: boolean) => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  clearSearch: () => void;
  
  // Task dialog actions
  openTaskDialog: (mode: 'create' | 'edit' | 'view', taskId?: string) => void;
  closeTaskDialog: () => void;
  
  // List dialog actions
  openListDialog: (mode: 'create' | 'edit', listId?: string) => void;
  closeListDialog: () => void;
  
  // Label dialog actions
  openLabelDialog: (mode: 'create' | 'edit', labelId?: string) => void;
  closeLabelDialog: () => void;
  
  // Delete dialog actions
  openDeleteDialog: (type: 'task' | 'list' | 'label', id: string, name: string) => void;
  closeDeleteDialog: () => void;
  
  // Reset
  reset: () => void;
}

export type AppStore = AppState & AppActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: AppState = {
  // Navigation
  activeView: 'today',
  activeListId: null,
  activeLabelId: null,
  
  // UI
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  showCompletedTasks: false,
  
  // Search
  searchQuery: '',
  searchOpen: false,
  
  // Dialogs
  taskDialogOpen: false,
  taskDialogTaskId: null,
  taskDialogMode: 'create',
  
  listDialogOpen: false,
  listDialogListId: null,
  listDialogMode: 'create',
  
  labelDialogOpen: false,
  labelDialogLabelId: null,
  labelDialogMode: 'create',
  
  deleteDialogOpen: false,
  deleteDialogType: null,
  deleteDialogId: null,
  deleteDialogName: '',
};

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Navigation actions
      setActiveView: (view) => set({ 
        activeView: view, 
        activeListId: null, 
        activeLabelId: null 
      }),
      
      setActiveList: (listId) => set({ 
        activeView: 'custom', 
        activeListId: listId, 
        activeLabelId: null 
      }),
      
      setActiveLabel: (labelId) => set({ 
        activeView: 'custom', 
        activeListId: null, 
        activeLabelId: labelId 
      }),
      
      // UI actions
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ 
        sidebarCollapsed: collapsed 
      }),
      
      toggleMobileSidebar: () => set((state) => ({ 
        mobileSidebarOpen: !state.mobileSidebarOpen 
      })),
      
      setMobileSidebarOpen: (open) => set({ 
        mobileSidebarOpen: open 
      }),
      
      toggleShowCompletedTasks: () => set((state) => ({ 
        showCompletedTasks: !state.showCompletedTasks 
      })),
      
      setShowCompletedTasks: (show) => set({ 
        showCompletedTasks: show 
      }),
      
      // Search actions
      setSearchQuery: (query) => set({ 
        searchQuery: query,
        searchOpen: query.length > 0 
      }),
      
      setSearchOpen: (open) => set({ 
        searchOpen: open 
      }),
      
      clearSearch: () => set({ 
        searchQuery: '', 
        searchOpen: false 
      }),
      
      // Task dialog actions
      openTaskDialog: (mode, taskId) => set({
        taskDialogOpen: true,
        taskDialogMode: mode,
        taskDialogTaskId: taskId ?? null,
      }),
      
      closeTaskDialog: () => set({
        taskDialogOpen: false,
        taskDialogTaskId: null,
      }),
      
      // List dialog actions
      openListDialog: (mode, listId) => set({
        listDialogOpen: true,
        listDialogMode: mode,
        listDialogListId: listId ?? null,
      }),
      
      closeListDialog: () => set({
        listDialogOpen: false,
        listDialogListId: null,
      }),
      
      // Label dialog actions
      openLabelDialog: (mode, labelId) => set({
        labelDialogOpen: true,
        labelDialogMode: mode,
        labelDialogLabelId: labelId ?? null,
      }),
      
      closeLabelDialog: () => set({
        labelDialogOpen: false,
        labelDialogLabelId: null,
      }),
      
      // Delete dialog actions
      openDeleteDialog: (type, id, name) => set({
        deleteDialogOpen: true,
        deleteDialogType: type,
        deleteDialogId: id,
        deleteDialogName: name,
      }),
      
      closeDeleteDialog: () => set({
        deleteDialogOpen: false,
        deleteDialogType: null,
        deleteDialogId: null,
        deleteDialogName: '',
      }),
      
      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'todo-app-store',
      partialize: (state) => ({
        // Only persist these values
        activeView: state.activeView,
        activeListId: state.activeListId,
        activeLabelId: state.activeLabelId,
        sidebarCollapsed: state.sidebarCollapsed,
        showCompletedTasks: state.showCompletedTasks,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useActiveView = () => useAppStore((state) => state.activeView);
export const useActiveListId = () => useAppStore((state) => state.activeListId);
export const useActiveLabelId = () => useAppStore((state) => state.activeLabelId);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);
export const useMobileSidebarOpen = () => useAppStore((state) => state.mobileSidebarOpen);
export const useShowCompletedTasks = () => useAppStore((state) => state.showCompletedTasks);
export const useSearchQuery = () => useAppStore((state) => state.searchQuery);
export const useSearchOpen = () => useAppStore((state) => state.searchOpen);
export const useTaskDialog = () => useAppStore((state) => ({
  isOpen: state.taskDialogOpen,
  taskId: state.taskDialogTaskId,
  mode: state.taskDialogMode,
}));
export const useListDialog = () => useAppStore((state) => ({
  isOpen: state.listDialogOpen,
  listId: state.listDialogListId,
  mode: state.listDialogMode,
}));
export const useLabelDialog = () => useAppStore((state) => ({
  isOpen: state.labelDialogOpen,
  labelId: state.labelDialogLabelId,
  mode: state.labelDialogMode,
}));
export const useDeleteDialog = () => useAppStore((state) => ({
  isOpen: state.deleteDialogOpen,
  type: state.deleteDialogType,
  id: state.deleteDialogId,
  name: state.deleteDialogName,
}));

export default useAppStore;
