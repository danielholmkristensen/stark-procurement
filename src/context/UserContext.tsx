"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, USERS, DEFAULT_USER } from "@/data/users";

interface UserContextType {
  currentUser: User;
  setUser: (userId: string) => void;
  users: User[];
}

// Default context value for SSR
const defaultContext: UserContextType = {
  currentUser: DEFAULT_USER,
  setUser: () => {},
  users: USERS,
};

const UserContext = createContext<UserContextType>(defaultContext);

const STORAGE_KEY = "stark-procurement-user";

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = USERS.find((u) => u.id === stored);
      if (user) setCurrentUser(user);
    }
    setIsHydrated(true);
  }, []);

  const setUser = (userId: string) => {
    const user = USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, userId);
    }
  };

  // Prevent hydration mismatch - use default context during SSR
  if (!isHydrated) {
    return (
      <UserContext.Provider value={defaultContext}>
        {children}
      </UserContext.Provider>
    );
  }

  return (
    <UserContext.Provider value={{ currentUser, setUser, users: USERS }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
