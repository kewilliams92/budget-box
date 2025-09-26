//TrackedExpensesPage.jsx
import {
    Typography,
    Button,
    Box,
    Divider,
    Grid,
    Stack,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Container,
    CircularProgress
  } from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import StreamCard from "./StreamCard.jsx";
import AddExpenseCard from "./AddExpenseCard.jsx";
import ExpenseCardForm from "../../forms/ExpenseCardForm.jsx";
import EmptyBudgetState from "./EmptyBudgetState.jsx";
import BudgetManagementHeader from "./BudgetManagementHeader.jsx";
import useBudget from "../../services/BudgetCall.jsx";
import { useUserBudget } from "../../hooks/useUserBudget.js";


export default function TrackedExpensesPage() {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false); // For new entries
  const [editingExpense, setEditingExpense] = useState(null); // Toggle editing expense state
  const [showEditExpenseForm, setShowEditExpenseForm] = useState(false); // For editing
  const { selectedBudget, budgets, setSelectedBudgetId, deleteBudget, refreshBudgets, isLoadingBudgets } = useUserBudget();
  const { getBudget, createOrUpdateBudget } = useBudget();

  const handleCreateBudget = async (date, name) => {
    try {
      await createOrUpdateBudget(date, name);
      await refreshBudgets();
    } catch (error) {
      console.error("Error creating budget:", error);
      throw error;
    }
  };
    
  const handleEditExpense = (id) => {
    const expenseToEdit = expenses.find((expense) => expense.id === id);
    setEditingExpense(expenseToEdit);
    setShowEditExpenseForm(true);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((x) => x.id !== id));
  };

  const incomeTotal = useMemo(
    () => incomes.reduce((s, x) => s + parseFloat(x.amount), 0),
    [incomes]
  );
  const expenseTotal = useMemo(
    () => expenses.reduce((s, x) => s + parseFloat(x.amount), 0),
    [expenses]
  );
  const net = useMemo(
    () => incomeTotal + expenseTotal,
    [incomeTotal, expenseTotal]
  );

  // Load expenses for the selected budget
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!selectedBudget) {
          setIncomes([]);
          setExpenses([]);
          return;
        }
        
        const ym = selectedBudget.date.slice(0, 7);
        const data = await getBudget(ym, selectedBudget.name);
        if (cancelled) return;
        
        const streams = data.streams || [];
        const newExpenses = streams.filter((s) => s.type === "expense");
        const newIncomes = streams.filter((s) => s.type === "income");
        
        setIncomes(newIncomes);
        setExpenses(newExpenses);
      } catch (e) {
        console.error("Error fetching selected budget:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBudget?.id, getBudget, selectedBudget]); // Include selectedBudget in dependencies

  // // fetches Budget from the backend
  // const { getBudget } = useBudget();
  // useEffect(() => {
  //   const normalizeData = (data) => {
  //     let extractedData = data.streams

  //     if (!extractedData){
  //       extractedData = [];
  //     }
  //      console.log("Extracted Data: ",extractedData)
  //     return extractedData
  //   }

  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       const data = await getBudget();
  //       // console.log(typeof data.streams.amount)
  //       if (!cancelled) {
  //         let normData = normalizeData(data);
  //         // console.log("Normalized Data:", normData); // Debugging log for normalized data
  //         for (const object of normData) {
  //           // console.log("Processing object:", object); // Debugging log for each object
  //           if (object.category === 'income') {
  //             // console.log("Updating incomes with amount:", object.amount); // Debugging log for income
  //             setIncomes(prev => [...prev, { ...object }]); // Update incomes useState
  //             // console.log("New incomes: ", incomes)
  //           } else {
  //             // console.log("Updating expenses with amount:", object.amount); // Debugging log for expense
  //             setExpenses(prev => [...prev, { ...object }]); // Update expenses useState
  //           }
  //         }
  //       };
  //           } catch (e) {
  //       console.error("Error fetching budget:", e); // Log error if fetching fails
  //     }
  //   })();
  //   return () => { cancelled = true; };
  // }, []);
  


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

          {/* Expense Streams */}
          <Card sx={{ 
            boxShadow: 4, 
            borderRadius: 3,
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
                  Tracked Expenses
                </Box>
              </Typography>
            </Box>
            <Box sx={{ p: 2, maxHeight: 400, overflowY: 'auto' }}>
              <Stack spacing={2}>
                {/* Add Expense Button */}
                {!showExpenseForm && (
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

                {/* Render Existing Expenses */}
                {expenses.map((expense) =>
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
        </Stack>
      </Container>
    </Box>
  );
}