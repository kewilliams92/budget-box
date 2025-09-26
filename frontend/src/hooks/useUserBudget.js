import { useContext } from "react";
import { UserBudgetContext } from "../context/UserBudgetContext.js";

export const useUserBudget = () => useContext(UserBudgetContext);
