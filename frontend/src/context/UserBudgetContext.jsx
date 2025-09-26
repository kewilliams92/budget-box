import { useEffect, useMemo, useState } from "react";
import useBudget from "../services/BudgetCall.jsx";
import { useAuthenticatedApi } from "../services/hooks.js";
import { UserBudgetContext } from "./UserBudgetContext.js";

export const UserBudgetProvider = ({ children }) => {
  const { isSignedIn } = useAuthenticatedApi();
  const { listBudgets, deleteBudget: deleteBudgetService } = useBudget();
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setBudgets([]);
      setSelectedBudgetId("");
      setIsLoadingBudgets(false);
      return;
    }

    setIsLoadingBudgets(true);

    let cancelled = false;
    (async () => {
      try {
        const [list] = await Promise.all([
          listBudgets(),
          new Promise(resolve => setTimeout(resolve, 300))
        ]);
        
        if (!cancelled) {
          setBudgets(list);
          if (list.length && !selectedBudgetId) setSelectedBudgetId(String(list[0].id));
        }
      } catch (_) {
        // Error handling - budgets will remain empty
      } finally {
        if (!cancelled) {
          setIsLoadingBudgets(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, listBudgets, selectedBudgetId]);

  const selectedBudget = useMemo(
    () => budgets.find((b) => String(b.id) === String(selectedBudgetId)) || null,
    [budgets, selectedBudgetId]
  );

  const refreshBudgets = async () => {
    if (!isSignedIn) return;
    try {
      setIsLoadingBudgets(true);
      const list = await listBudgets();
      setBudgets(list);
      if (list.length && !list.find(b => String(b.id) === String(selectedBudgetId))) {
        setSelectedBudgetId(String(list[0].id));
      }
    } catch (_) {
      // Error handling - budgets will remain unchanged
    } finally {
      setIsLoadingBudgets(false);
    }
  };

  const deleteBudget = async (budgetId) => {
    if (!isSignedIn) return;
    await deleteBudgetService(budgetId);
    await refreshBudgets();
  };

  return (
    <UserBudgetContext.Provider
      value={{ budgets, selectedBudget, selectedBudgetId, setSelectedBudgetId, refreshBudgets, deleteBudget, isLoadingBudgets }}
    >
      {children}
    </UserBudgetContext.Provider>
  );
};