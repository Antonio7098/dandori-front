import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      savedCourses: [],
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      updateUserProfile: (updates) =>
        set((state) => {
          const nextUser = { ...(state.user || {}), ...updates };
          return { user: nextUser, isAuthenticated: !!nextUser };
        }),

      isAdmin: () => {
        const { user } = get();
        return Boolean(user?.email && user.email.endsWith('@dandori.com'));
      },
      
      logout: () => {
        localStorage.removeItem('dandori-token');
        set({ user: null, isAuthenticated: false, savedCourses: [] });
      },
      
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
  toolEvents: [],

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  openChat: () => set({ isOpen: true }),
  
  closeChat: () => set({ isOpen: false }),
  
  setFullPage: (isFullPage) => set({ isFullPage }),
  
  addMessage: (message) => {
    let newMessage;
    set((state) => {
      newMessage = {
        ...message,
        id: message.id || crypto.randomUUID?.() || Date.now(),
        timestamp: message.timestamp || new Date(),
      };
      return {
        messages: [...state.messages, newMessage],
      };
    });
    return newMessage;
  },

  updateMessage: (id, updater) =>
    set((state) => ({
      messages: state.messages.map((message) => {
        if (message.id !== id) return message;
        const updates =
          typeof updater === 'function' ? updater(message) : updater || {};
        return { ...message, ...updates };
      }),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  addArtifact: (artifact) =>
    set((state) => {
      const course = artifact.course || artifact;
      const artifactId =
        artifact.course_id || course.id || artifact.id || Date.now();
      if (
        artifactId &&
        state.artifacts.some(
          (existing) =>
            existing.course_id === artifactId ||
            existing.id === artifactId ||
            existing.course?.id === artifactId
        )
      ) {
        return { artifacts: state.artifacts };
      }
      return {
        artifacts: [
          ...state.artifacts,
          { ...artifact, course, id: artifactId, course_id: artifactId },
        ],
      };
    }),

  clearArtifacts: () => set({ artifacts: [] }),

  addToolEvent: (event) =>
    set((state) => ({
      toolEvents: [
        ...state.toolEvents,
        {
          ...event,
          toolCallId: event.toolCallId || event.id,
          id:
            event.id || event.toolCallId || crypto.randomUUID?.() || Date.now(),
          timestamp: event.timestamp || new Date().toISOString(),
        },
      ],
    })),

  updateToolEvent: (toolCallId, updates) =>
    set((state) => ({
      toolEvents: state.toolEvents.map((event) =>
        event.toolCallId === toolCallId
          ? { ...event, ...(typeof updates === 'function' ? updates(event) : updates) }
          : event
      ),
    })),

  clearToolEvents: () => set({ toolEvents: [] }),

  clearMessages: () => set({ messages: [], artifacts: [], toolEvents: [] }),
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
