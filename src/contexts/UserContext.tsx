import React, { createContext, useContext, useMemo, useState } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import DBModel, { User } from "../model";

/**
 * TKDodo pattern summary:
 * - Keep server data in React Query (not in Context).
 * - Use Context only for parameters/config that your queries need (e.g., userId).
 * - Co-locate the query with a custom hook that reads from Context.
 */

type AuthContextValue = {
  userId: string | null;
  setUserId: (id: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type UserProviderProps = {
  children: React.ReactNode;
  initialUserId?: string | null;
};

export function UserProvider({ children, initialUserId = null }: UserProviderProps) {
  const [userId, setUserId] = useState<string | null>(initialUserId);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      setUserId,
      logout: () => setUserId(null),
    }),
    [userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within a UserProvider");
  }
  return ctx;
}

/**
 * useUser: Fetches the current User based on the userId from context.
 * - Server state stays in React Query, keyed by ['user', userId]
 * - When userId changes (login/logout), the query updates/clears accordingly.
 *
 * If your backend provides a "current user" endpoint that doesn't need an id,
 * you can swap the queryKey to just ['user'] and change the queryFn accordingly.
 */
export function useUser(): UseQueryResult<User, unknown> {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["user", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) {
        throw new Error("No userId in context for useUser");
      }
      // Assumes your backend can fetch a user by netid/userId
      return DBModel.fetchUser(userId);
    },
    staleTime: 5 * 60 * 1000, // optional: cache user for 5 minutes
  });
}
