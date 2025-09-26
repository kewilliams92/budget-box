import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "../services/hooks.js";
import { listExpenses } from "../services/entriesService.jsx";

const UserEntriesContext = createContext();
export const UserEntriesProvider = ({ children }) => {
  const { api, isSignedIn } = useAuthenticatedApi();
  const [entriesExpenses, setEntriesExpenses] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      setLoadingEntries(true);
      
      const newTransactions = await listExpenses(api);
      setEntriesExpenses((prev) => {
        const existingIds = new Set(prev.map((tx) => tx.id));
        const uniqueTransactions = newTransactions.filter((tx) => !existingIds.has(tx.id));
        return [...prev, ...uniqueTransactions];
      });
    } catch (error) {
      console.error("Error fetching entries_expenses:", error);
    } finally {
      setLoadingEntries(false);
    }
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setEntriesExpenses([]);
      return;
    }
    fetchEntries();
  }, [fetchEntries, isSignedIn]);

  return (
    <UserEntriesContext.Provider
      value={{
        entriesExpenses,
        setEntriesExpenses,
        fetchEntries,
        loadingEntries,
      }}
    >
      {children}
    </UserEntriesContext.Provider>
  );
};

export const useUserEntries = () => useContext(UserEntriesContext);