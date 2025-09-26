import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "../services/hooks.js";
import { listTransactions, unlinkBankAccount } from "../services/plaidService.jsx";

const UserPlaidContext = createContext();
export const UserPlaidProvider = ({ children }) => {
  const { api, isSignedIn } = useAuthenticatedApi();
  const [plaidTransactions, setPlaidTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      setLoadingTransactions(true);
      
      const newTransactions = await listTransactions(api);
      
      setPlaidTransactions((prev) => {
        const existingIds = new Set(prev.map((tx) => tx.id));
        const uniqueTransactions = newTransactions.filter((tx) => !existingIds.has(tx.id));
        return [...prev, ...uniqueTransactions];
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setPlaidTransactions([]);
      return;
    }
    fetchTransactions();
  }, [fetchTransactions, isSignedIn]);

  const unlinkAccount = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      setLoadingTransactions(true);
      
      const result = await unlinkBankAccount(api);
      setPlaidTransactions([]);
      
      return result;
    } catch (error) {
      console.error("Error unlinking bank account:", error);
      throw error;
    } finally {
      setLoadingTransactions(false);
    }
  }, [api, isSignedIn]);

  return (
    <UserPlaidContext.Provider
      value={{
        plaidTransactions,
        setPlaidTransactions,
        fetchTransactions,
        unlinkAccount,
        loadingTransactions,
      }}
    >
      {children}
    </UserPlaidContext.Provider>
  );
};

export const useUserPlaid = () => useContext(UserPlaidContext);