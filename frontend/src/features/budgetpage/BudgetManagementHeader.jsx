import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Stack,
  TextField,
  Grid,
  Paper
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AddCircleOutline, DeleteOutline, Edit } from '@mui/icons-material';
import dayjs from 'dayjs';

export default function BudgetManagementHeader({ 
  selectedBudget, 
  budgets, 
  setSelectedBudgetId, 
  deleteBudget,
  onCreateBudget,
  incomeTotal,
  expenseTotal,
  net
}) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [budgetName, setBudgetName] = useState("My Budget");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateBudget = async () => {
    const formattedDate = selectedDate.format("YYYY-MM");
    const trimmedBudgetName = budgetName.trim();
    if (!trimmedBudgetName) {
      alert("Budget name cannot be empty.");
      return;
    }
    try {
      await onCreateBudget(formattedDate, trimmedBudgetName);
      setShowCreateForm(false);
      setBudgetName("My Budget");
      alert(`Budget "${trimmedBudgetName}" for ${formattedDate} created successfully!`);
    } catch (error) {
      console.error("Error creating budget:", error);
      alert("Failed to create budget.");
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    
    const budgetName = selectedBudget.name;
    const confirmMessage = `Are you sure you want to delete "${budgetName}"?\n\n` +
      `This will permanently delete all income and expense streams associated with this budget.\n\n` +
      `This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteBudget(selectedBudget.id);
        alert(`Budget "${budgetName}" has been deleted successfully!`);
      } catch (error) {
        console.error("Failed to delete budget:", error);
        alert("Failed to delete budget. Please try again.");
      }
    }
  };

  const totalColor = net > 0 ? "success.main" : net < 0 ? "error.main" : "text.primary";

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Budget Selection Card */}
      <Card sx={{ 
        boxShadow: 4, 
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-1px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, lg: 7 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
                Budget Management
              </Typography>
              
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'stretch', md: 'center' }}>
                <FormControl size="medium" sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: { xs: '100%', sm: 300 } }}>
                  <InputLabel id="budget-select-label">Select Budget</InputLabel>
                  <Select
                    labelId="budget-select-label"
                    id="budget-select"
                    label="Select Budget"
                    value={selectedBudget ? String(selectedBudget.id) : ""}
                    onChange={(e) => setSelectedBudgetId(e.target.value)}
                  >
                    {budgets.map((b) => (
                      <MenuItem key={b.id} value={String(b.id)}>
                        {b.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    variant="contained"
                    startIcon={<AddCircleOutline />}
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    sx={{
                      backgroundColor: '#285744',
                      color: 'white',
                      px: 4,
                      py: 2,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      boxShadow: 3,
                      width: { xs: '100%', sm: 'auto' },
                      '&:hover': {
                        backgroundColor: '#1e3d2f',
                        boxShadow: 4,
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    New Budget
                  </Button>
                  
                  {selectedBudget && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutline />}
                      onClick={handleDeleteBudget}
                      sx={{
                        borderColor: '#f44336',
                        color: '#f44336',
                        px: 4,
                        py: 2,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        width: { xs: '100%', sm: 'auto' },
                        '&:hover': {
                          backgroundColor: '#ffebee',
                          borderColor: '#d32f2f',
                          color: '#d32f2f',
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper
                sx={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  p: 4,
                  borderRadius: 3,
                  boxShadow: 2,
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 2, textAlign: 'center' }}>
                  Financial Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 4, sm: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Income
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        ${incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Expenses
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        ${expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Net
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: totalColor }}>
                        ${net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {showCreateForm && (
        <Card sx={{ 
          boxShadow: 4, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ color: 'success.dark', fontWeight: 'semibold', mb: 2, display: 'flex', alignItems: 'center' }}>
              <AddCircleOutline sx={{ mr: 1 }} />
              Create New Budget
            </Typography>
            
            <Grid container spacing={2} alignItems="end">
              <Grid size={{ xs: 12, sm: 4 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Budget Month"
                    value={selectedDate}
                    views={["year", "month"]}
                    onChange={(d) => d && setSelectedDate(d)}
                    slotProps={{ 
                      textField: { 
                        size: "medium", 
                        fullWidth: true
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  size="medium"
                  label="Budget Name"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  fullWidth
                  placeholder="e.g., Vacation Budget"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleCreateBudget}
                    sx={{
                      backgroundColor: '#285744',
                      color: 'white',
                      px: 4,
                      py: 2,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      boxShadow: 3,
                      '&:hover': {
                        backgroundColor: '#1e3d2f',
                        boxShadow: 4,
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Create Budget
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowCreateForm(false)}
                    sx={{
                      borderColor: '#666',
                      color: '#666',
                      px: 4,
                      py: 2,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#333',
                        color: '#333',
                        transform: 'translateY(-1px)',
                        boxShadow: 2
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
