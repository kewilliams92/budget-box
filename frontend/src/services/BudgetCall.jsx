import { useCallback } from "react";
import { useAuthenticatedApi } from "./hooks";

export default function useBudget() {
    const { api } = useAuthenticatedApi();
    const BASE = "http://127.0.0.1:8000/api";

    const getBudget = useCallback(
        async (date, name = null) => {
            const params = { date };
            if (name) {
                params.name = name;
            }
            const res = await api.get(`${BASE}/entries/budget/`, {
                params,
            });
            return res.data;
        },
        [api, BASE]
    );

    const createOrUpdateBudget = useCallback(
        async (date, name) => {
            if (name && name.trim()) {
                const res = await api.get(`${BASE}/entries/budget/`, { 
                    params: { date, name: name.trim() } 
                });
                return res.data;
            } else {
                const res = await api.get(`${BASE}/entries/budget/`, { params: { date } });
                return res.data;
            }
        },
        [api, BASE]
    );

    const listBudgets = useCallback(
        async () => {
            const res = await api.get(`${BASE}/entries/budgets/`);
            return res.data.budgets || [];
        },
        [api, BASE]
    );

    const deleteBudget = useCallback(
        async (budgetId) => {
            const res = await api.delete(`${BASE}/entries/budget/`, {
                data: { id: budgetId }
            });
            return res.data;
        },
        [api, BASE]
    );

    return { getBudget, createOrUpdateBudget, listBudgets, deleteBudget };
}