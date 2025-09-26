import { Typography, Button, Box, Divider, Grid, Stack, Paper, TextField, FormControl, InputLabel, Select, MenuItem, Container, Card, CircularProgress } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useEffect, useMemo, useState } from "react";
import StreamCard from "./StreamCard.jsx";
import AddIncomeCard from "./AddIncomeCard.jsx";
import IncomeCardForm from "../../forms/IncomeCardForm.jsx";
import AddExpenseCard from "./AddExpenseCard.jsx";
import ExpenseCardForm from "../../forms/ExpenseCardForm.jsx";
import EmptyBudgetState from "./EmptyBudgetState.jsx";
import BudgetManagementHeader from "./BudgetManagementHeader.jsx";
import useBudget from "../../services/BudgetCall.jsx";
import { useAuthenticatedApi } from "../../services/hooks.js";
import { useUserBudget } from "../../hooks/useUserBudget.js";
import {
  deleteExpenseStream,
  deleteIncomeStream,
} from "../../services/entriesService.jsx";

export default function BudgetPage() {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditExpenseForm, setShowEditExpenseForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(false);
  const [showEditIncomeForm, setShowEditIncomeForm] = useState(false);
  const { api } = useAuthenticatedApi();
  const { selectedBudget, budgets, setSelectedBudgetId, refreshBudgets, deleteBudget, isLoadingBudgets } = useUserBudget();

  const handleCreateBudget = async (date, name) => {
    try {
      await createOrUpdateBudget(date, name);
      await refreshBudgets();
    } catch (error) {
      throw error;
    }
  };

  const handleEditIncome = (id) => {
    const incomeToEdit = incomes.find((income) => income.id === id);
    setEditingIncome(incomeToEdit);
    setShowEditIncomeForm(true);
  };

  const handleDeleteIncome = (id) => {
    deleteIncomeStream(api, id);
    setIncomes((prev) => prev.filter((x) => x.id !== id));
  };

  const handleEditExpense = (id) => {
    const expenseToEdit = expenses.find((expense) => expense.id === id);
    setEditingExpense(expenseToEdit);
    setShowEditExpenseForm(true);
  };

  const handleDeleteExpense = (id) => {
    deleteExpenseStream(api, id);
    setExpenses((prev) => prev.filter((x) => x.id !== id));
  };

  const incomeTotal = useMemo(
    () => incomes.reduce((s, x) => s + parseFloat(x.amount), 0),
    [incomes],
  );
  const expenseTotal = useMemo(
    () => expenses.reduce((s, x) => s + parseFloat(x.amount), 0),
    [expenses],
  );
  const net = useMemo(
    () => incomeTotal + expenseTotal,
    [incomeTotal, expenseTotal],
  );

  // fetches Budget from the backend
  const { getBudget, createOrUpdateBudget } = useBudget();

  // Load budget data when selectedBudget changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!selectedBudget) {
          setIncomes([]);
          setExpenses([]);
          setIsLoadingIncomes(false);
          setIsLoadingExpenses(false);
          return;
        }
        
        // Start loading states
        setIsLoadingIncomes(true);
        setIsLoadingExpenses(true);
        
        // clear previous streams when switching
        setIncomes([]);
        setExpenses([]);
        const ym = selectedBudget.date.slice(0, 7); // YYYY-MM
        const data = await getBudget(ym, selectedBudget.name);
        if (cancelled) return;
        
        const streams = data.streams || [];
        const newIncomes = streams.filter((s) => s.type === "income");
        const newExpenses = streams.filter((s) => s.type === "expense");
        
        setIncomes(newIncomes);
        setExpenses(newExpenses);
        
        // Stop loading states
        setIsLoadingIncomes(false);
        setIsLoadingExpenses(false);
      } catch (e) {
        console.error("Failed to load selected budget", e);
        setIsLoadingIncomes(false);
        setIsLoadingExpenses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBudget?.id, getBudget, selectedBudget]); // Include selectedBudget in dependencies

  // Show loading state while budgets are being fetched
  if (isLoadingBudgets) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #e8f5e8 0%, #f4e4bc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            thickness={4}
            sx={{ 
              color: '#285744',
              mb: 3
            }} 
          />
          <Typography variant="h5" sx={{ fontWeight: 'semibold', color: 'text.primary' }}>
            Loading Budgets...
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
            Please wait while we fetch your budget data
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show empty state if no budgets exist (and not loading)
  if (budgets.length === 0) {
    return <EmptyBudgetState onCreateBudget={handleCreateBudget} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f5e8 0%, #f4e4bc 100%)',
        padding: 4
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          {/* Budget Management Header */}
          <BudgetManagementHeader
            selectedBudget={selectedBudget}
            budgets={budgets}
            setSelectedBudgetId={setSelectedBudgetId}
            deleteBudget={deleteBudget}
            onCreateBudget={handleCreateBudget}
            incomeTotal={incomeTotal}
            expenseTotal={expenseTotal}
            net={net}
          />

          {/* Income and Expense Streams */}
          <Grid container spacing={3}>
            {/* Income Section */}
            <Grid size={{ xs: 12, xl: 6 }}>
              <Card sx={{ 
                boxShadow: 4, 
                borderRadius: 3, 
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease-in-out'
                }
              }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: 'success.main',
                        borderRadius: '50%',
                        mr: 1,
                        boxShadow: 1
                      }}
                    />
                    <Box
                      sx={{
                        backgroundColor: 'success.light',
                        color: 'success.dark',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        fontWeight: 'medium',
                        ml: 1
                      }}
                    >
                      Income Streams
                    </Box>
                  </Typography>
                </Box>
                <Box sx={{ p: 2, maxHeight: 400, overflowY: 'auto' }}>
                  <Stack spacing={2}>
                    {/* Add Income Button */}
                    {!showIncomeForm && !isLoadingIncomes && (
                      <AddIncomeCard onClick={() => setShowIncomeForm(true)} />
                    )}

                    {/* Add Income Form */}
                    {showIncomeForm && (
                      <IncomeCardForm
                        budgetId={selectedBudget?.id}
                        onCancel={() => {
                          setShowIncomeForm(false);
                        }}
                        onSubmit={(newIncome) => {
                          setIncomes((prev) => [
                            ...prev,
                            { ...newIncome, id: Date.now() },
                          ]);
                          setShowIncomeForm(false);
                        }}
                      />
                    )}

                    {/* Loading State */}
                    {isLoadingIncomes && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 4
                        }}
                      >
                        <CircularProgress 
                          size={40} 
                          thickness={4}
                          sx={{ 
                            color: '#285744',
                            mb: 2
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Loading income streams...
                        </Typography>
                      </Box>
                    )}

                    {/* Empty State */}
                    {!isLoadingIncomes && incomes.length === 0 && !showIncomeForm && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 4,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                          No Income Streams
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                          Create your first income stream to start tracking your earnings.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowIncomeForm(true)}
                          sx={{
                            borderColor: '#285744',
                            color: '#285744',
                            '&:hover': {
                              backgroundColor: '#e8f5e8',
                              borderColor: '#1e3d2f'
                            }
                          }}
                        >
                          Add Income Stream
                        </Button>
                      </Box>
                    )}

                    {/* Render Existing Incomes */}
                    {!isLoadingIncomes && incomes.map((income) =>
                      editingIncome?.id === income.id && showEditIncomeForm ? (
                        <IncomeCardForm
                          key={income.id}
                          budgetId={selectedBudget?.id}
                          onCancel={() => {
                            setShowIncomeForm(false);
                            setEditingIncome(null);
                          }}
                          onSubmit={(updatedIncome) => {
                            setIncomes((prev) =>
                              prev.map((e) =>
                                e.id === updatedIncome.id ? updatedIncome : e,
                              ),
                            );
                            setShowIncomeForm(false);
                            setEditingIncome(null);
                          }}
                          initialData={editingIncome}
                        />
                      ) : (
                        <StreamCard
                          key={income.id}
                          id={income.id}
                          name={income.merchant_name}
                          amount={income.amount}
                          category={income.category}
                          description={income.description}
                          type="income"
                          onDelete={handleDeleteIncome}
                          onEdit={handleEditIncome}
                        />
                      ),
                    )}
                  </Stack>
                </Box>
              </Card>
            </Grid>

            {/* Expense Section */}
            <Grid size={{ xs: 12, xl: 6 }}>
              <Card sx={{ 
                boxShadow: 4, 
                borderRadius: 3, 
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease-in-out'
                }
              }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: 'error.main',
                        borderRadius: '50%',
                        mr: 1,
                        boxShadow: 1
                      }}
                    />
                    <Box
                      sx={{
                        backgroundColor: 'error.light',
                        color: 'error.dark',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        fontWeight: 'medium',
                        ml: 1
                      }}
                    >
                      Expense Streams
                    </Box>
                  </Typography>
                </Box>
                <Box sx={{ p: 2, maxHeight: 400, overflowY: 'auto' }}>
                  <Stack spacing={2}>
                    {/* Add Expense Button */}
                    {!showExpenseForm && !isLoadingExpenses && (
                      <AddExpenseCard onClick={() => setShowExpenseForm(true)} />
                    )}

                    {/* Add Expense Form */}
                    {showExpenseForm && (
                      <ExpenseCardForm
                        budgetId={selectedBudget?.id}
                        onCancel={() => {
                          setShowExpenseForm(false);
                        }}
                        onSubmit={(newExpense) => {
                          setExpenses((prev) => [
                            ...prev,
                            { ...newExpense, id: Date.now() },
                          ]);
                          setShowExpenseForm(false);
                        }}
                      />
                    )}

                    {/* Loading State */}
                    {isLoadingExpenses && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 4
                        }}
                      >
                        <CircularProgress 
                          size={40} 
                          thickness={4}
                          sx={{ 
                            color: '#285744',
                            mb: 2
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Loading expense streams...
                        </Typography>
                      </Box>
                    )}

                    {/* Empty State */}
                    {!isLoadingExpenses && expenses.length === 0 && !showExpenseForm && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 4,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                          No Expense Streams
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                          Create your first expense stream to start tracking your spending.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowExpenseForm(true)}
                          sx={{
                            borderColor: '#285744',
                            color: '#285744',
                            '&:hover': {
                              backgroundColor: '#e8f5e8',
                              borderColor: '#1e3d2f'
                            }
                          }}
                        >
                          Add Expense Stream
                        </Button>
                      </Box>
                    )}

                    {/* Render Existing Expenses */}
                    {!isLoadingExpenses && expenses.map((expense) =>
                      editingExpense?.id === expense.id && showEditExpenseForm ? (
                        <ExpenseCardForm
                          key={expense.id}
                          budgetId={selectedBudget?.id}
                          onCancel={() => {
                            setShowExpenseForm(false);
                            setEditingExpense(null);
                          }}
                          onSubmit={(updatedExpense) => {
                            setExpenses((prev) =>
                              prev.map((e) =>
                                e.id === updatedExpense.id ? updatedExpense : e,
                              ),
                            );
                            setShowExpenseForm(false);
                            setEditingExpense(null);
                          }}
                          initialData={editingExpense}
                        />
                      ) : (
                        <StreamCard
                          key={expense.id}
                          id={expense.id}
                          name={expense.merchant_name}
                          amount={expense.amount}
                          category={expense.category}
                          description={expense.description}
                          type="expense"
                          onDelete={handleDeleteExpense}
                          onEdit={handleEditExpense}
                        />
                      ),
                    )}
                  </Stack>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
