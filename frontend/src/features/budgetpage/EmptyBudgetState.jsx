import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Stack,
  Container,
  Paper,
  TextField,
  Grid
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AddCircleOutline, TrendingUp, AccountBalanceWallet, Save } from '@mui/icons-material';
import dayjs from 'dayjs';

export default function EmptyBudgetState({ onCreateBudget }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [budgetName, setBudgetName] = useState("My Budget");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const handleCreateBudget = async () => {
    const formattedDate = selectedDate.format("YYYY-MM");
    const trimmedBudgetName = budgetName.trim();
    if (!trimmedBudgetName) {
      alert("Budget name cannot be empty.");
      return;
    }
    try {
      await onCreateBudget(formattedDate, trimmedBudgetName);
      alert(`Budget "${trimmedBudgetName}" for ${formattedDate} created successfully!`);
    } catch (error) {
      console.error("Error creating budget:", error);
      alert("Failed to create budget.");
    }
  };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f5e8 0%, #f4e4bc 100%)',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              backgroundColor: '#4caf50',
              borderRadius: '50%',
              mb: 3,
              boxShadow: 4
            }}
          >
            <AccountBalanceWallet sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
            Welcome to BudgetBox
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            Take control of your finances by creating your first budget. 
            Track your income and expenses to achieve your financial goals.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 8 }}>
          <Card sx={{ 
            boxShadow: 4, 
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '&:hover': { 
              boxShadow: 6, 
              transform: 'translateY(-4px)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  backgroundColor: 'success.light',
                  borderRadius: '50%',
                  mb: 2
                }}
              >
                <TrendingUp sx={{ fontSize: 24, color: 'success.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 1 }}>
                Track Income
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Monitor your salary, freelance work, and other income sources
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            boxShadow: 4, 
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '&:hover': { 
              boxShadow: 6, 
              transform: 'translateY(-4px)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  backgroundColor: 'error.light',
                  borderRadius: '50%',
                  mb: 2
                }}
              >
                <TrendingUp sx={{ fontSize: 24, color: 'error.main', transform: 'rotate(180deg)' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 1 }}>
                Monitor Expenses
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Keep track of your spending and identify areas to save money
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            boxShadow: 4, 
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '&:hover': { 
              boxShadow: 6, 
              transform: 'translateY(-4px)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  backgroundColor: 'secondary.light',
                  borderRadius: '50%',
                  mb: 2
                }}
              >
                <AddCircleOutline sx={{ fontSize: 24, color: 'secondary.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 1 }}>
                Multiple Budgets
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Create separate budgets for vacations, home projects, and more
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Paper
            sx={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
              color: '#285744',
              p: 4,
              borderRadius: 3,
              boxShadow: 6,
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(40, 87, 68, 0.8)', mb: 3 }}>
              Create your first budget and start taking control of your finances today.
            </Typography>
            
            {!showCreateForm ? (
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowCreateForm(true)}
                startIcon={<AddCircleOutline />}
                sx={{
                  backgroundColor: '#285744',
                  color: 'white',
                  px: 4,
                  py: 2,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  boxShadow: 4,
                  '&:hover': {
                    backgroundColor: '#1e3d2f',
                    boxShadow: 6,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                Create Your First Budget
              </Button>
            ) : (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 3, color: '#285744' }}>
                  Create Your First Budget
                </Typography>
                
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid container spacing={3} alignItems="end">
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        size="medium"
                        label="Budget Name"
                        value={budgetName}
                        onChange={(e) => setBudgetName(e.target.value)}
                        fullWidth
                        placeholder="e.g., My First Budget"
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
                
                <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleCreateBudget}
                    startIcon={<Save />}
                    sx={{
                      backgroundColor: '#285744',
                      color: 'white',
                      px: 4,
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      boxShadow: 3,
                      '&:hover': {
                        backgroundColor: '#1e3d2f',
                        boxShadow: 4,
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Save Budget
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setShowCreateForm(false)}
                    sx={{
                      borderColor: '#666',
                      color: '#666',
                      px: 4,
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderRadius: 2,
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
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
