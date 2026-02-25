import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      savedCourses: [],
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      isAdmin: () => {
        const { user } = get();
        return Boolean(user?.email && user.email.endsWith('@dandori.com'));
      },
      
      logout: () => set({ user: null, isAuthenticated: false, savedCourses: [] }),
      
      saveCourse: (courseId) => {
        const { savedCourses } = get();
        if (!savedCourses.includes(courseId)) {
          set({ savedCourses: [...savedCourses, courseId] });
        }
      },
      
      unsaveCourse: (courseId) => {
        const { savedCourses } = get();
        set({ savedCourses: savedCourses.filter(id => id !== courseId) });
      },
      
      isCourseSaved: (courseId) => {
        return get().savedCourses.includes(courseId);
      },
    }),
    {
      name: 'dandori-user-storage',
    }
  )
);

export const useChatStore = create((set, get) => ({
  messages: [],
  isOpen: false,
  isFullPage: false,
  isLoading: false,
  artifacts: [],
  
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  
  openChat: () => set({ isOpen: true }),
  
  closeChat: () => set({ isOpen: false }),
  
  setFullPage: (isFullPage) => set({ isFullPage }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: Date.now(), timestamp: new Date() }]
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  addArtifact: (artifact) => set((state) => ({
    artifacts: [...state.artifacts, { ...artifact, id: Date.now() }]
  })),
  
  clearArtifacts: () => set({ artifacts: [] }),
  
  clearMessages: () => set({ messages: [], artifacts: [] }),
}));

export const useSearchStore = create((set) => ({
  query: '',
  results: [],
  filters: {
    location: '',
    priceRange: [0, 500],
    courseType: '',
    sortBy: 'relevance',
  },
  isSearching: false,
  
  setQuery: (query) => set({ query }),
  
  setResults: (results) => set({ results }),
  
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  resetFilters: () => set({
    filters: {
      location: '',
      priceRange: [0, 500],
      courseType: '',
      sortBy: 'relevance',
    }
  }),
  
  setSearching: (isSearching) => set({ isSearching }),
}));

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
}));
