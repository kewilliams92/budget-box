import {
  Typography,
  Button,
  Box,
  Divider,
  Grid,
  Stack,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import PlaidStreamCard from "./PlaidStreamCard.jsx";
import { useUserBudget } from "../../hooks/useUserBudget.js";
import PlaidLinkButton from "./PlaidLink.jsx";
import { useAuthenticatedApi } from "../../services/hooks.js";
import { useUserPlaid } from "../../context/UserPlaidContext.jsx";
import {
  deleteTransactions,
  listTransactions,
  addTransactions,
} from "../../services/plaidService.jsx";
import { 
  InfoOutlined, 
  AccountBalance, 
  TrendingUp, 
  DeleteOutline, 
  CheckCircleOutline,
  Refresh,
  LinkOff
} from "@mui/icons-material";

export default function TransactionsReviewPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const { api } = useAuthenticatedApi();
  const { fetchTransactions, plaidTransactions, setPlaidTransactions, unlinkAccount } = useUserPlaid();
  const budgetCtx = useUserBudget?.();
  const selectedBudget = budgetCtx?.selectedBudget;

  // Check if user has plaid connected (based on whether we have transactions or connection data)
  const hasPlaidConnection = plaidTransactions && plaidTransactions.length > 0;

  const handleApproveExpense = async (id) => {
    try {
      setLoading(true);
      const expenseToApprove = plaidTransactions.find(
        (expense) => expense.id === id,
      );

      // Add the transaction to selected budget (if chosen)
      const payloadBudget = selectedBudget ? { budget_id: selectedBudget.id } : {};
      await addTransactions(api, id, "", payloadBudget);

      // Remove from pending transactions
      await handleDeleteExpense(id);
    } catch (err) {
      console.error("Error approving expense:", err);
      setError("Failed to approve expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      setLoading(true);
      // Delete from backend
      await deleteTransactions(api, id);

      // Remove from local state
      setPlaidTransactions((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshExpense = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await listTransactions(api);

      // Replace existing transactions with fresh data
      setPlaidTransactions(res || []);
    } catch (err) {
      console.error("Error refreshing expenses:", err);
      setError("Failed to refresh transactions");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaidConnected = async (connected) => {
    if (connected) {
      // Fetch transactions immediately after connection
      await handleRefreshExpense();
    }
  };

  const handleUnlinkAccount = async () => {
    try {
      setUnlinking(true);
      setError(null);
      
      const result = await unlinkAccount();
      
      // Close the dialog
      setShowUnlinkDialog(false);
      
      // Show success message
      alert(`Successfully unlinked bank account(s). Removed ${result.total_transactions_removed} transactions.`);
      
    } catch (err) {
      console.error("Error unlinking account:", err);
      setError("Failed to unlink bank account. Please try again.");
    } finally {
      setUnlinking(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await fetchTransactions();
      } catch (err) {
        console.error("Error initializing data:", err);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    // Only initialize if we have transactions to fetch
    if (plaidTransactions.length === 0) {
      initializeData();
    }
  }, [fetchTransactions]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <Box sx={{ minHeight: "100vh", background: 'linear-gradient(135deg, #e8f5e8 0%, #f4e4bc 100%)', p: 4 }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Plaid Connection State */}
      {!hasPlaidConnection ? (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Page Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                backgroundColor: '#285744',
                borderRadius: '50%',
                mb: 3,
                boxShadow: 4
              }}
            >
              <AccountBalance sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
              Transaction Review
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 800, mx: 'auto', mb: 4 }}>
              Review and approve transactions from your connected bank accounts to add them to your budgets
            </Typography>
          </Box>

          {/* Feature Cards */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{
                height: '100%',
                boxShadow: 4,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                      width: 60,
                      height: 60,
                      backgroundColor: 'success.light',
                      borderRadius: '50%',
                      mb: 2
                    }}
                  >
                    <AccountBalance sx={{ fontSize: 30, color: 'success.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 2 }}>
                    Secure Bank Connection
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Connect your bank account securely through Plaid. Your credentials are never stored - we only access transaction data.
                  </Typography>
                  <Chip 
                    label="Bank-level Security" 
                    color="success" 
                    size="small" 
                    sx={{ fontWeight: 'medium' }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{
                height: '100%',
                boxShadow: 4,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                      width: 60,
                      height: 60,
                      backgroundColor: 'primary.light',
                      borderRadius: '50%',
                      mb: 2
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 30, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 2 }}>
                    Smart Transaction Review
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Review each transaction before adding it to your budget. Approve expenses to track them, or dismiss irrelevant transactions.
                  </Typography>
                  <Chip 
                    label="Manual Control" 
                    color="primary" 
                    size="small" 
                    sx={{ fontWeight: 'medium' }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{
                height: '100%',
                boxShadow: 4,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                      width: 60,
                      height: 60,
                      backgroundColor: 'secondary.light',
                      borderRadius: '50%',
                      mb: 2
                    }}
                  >
                    <CheckCircleOutline sx={{ fontSize: 30, color: 'secondary.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 2 }}>
                    Budget Integration
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Approved transactions are automatically added to your selected budget, helping you track spending against your financial goals.
                  </Typography>
                  <Chip 
                    label="Auto-Import" 
                    color="secondary" 
                    size="small" 
                    sx={{ fontWeight: 'medium' }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* How It Works Section */}
          <Card sx={{
            boxShadow: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            mb: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                How Transaction Review Works
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 50,
                        height: 50,
                        backgroundColor: '#285744',
                        borderRadius: '50%',
                        mb: 2,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}
                    >
                      1
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 1 }}>
                      Connect Account
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Securely link your bank account using Plaid's industry-standard security
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 50,
                        height: 50,
                        backgroundColor: '#285744',
                        borderRadius: '50%',
                        mb: 2,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}
                    >
                      2
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 1 }}>
                      Review Transactions
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      See all your recent transactions and decide which ones to track
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 50,
                        height: 50,
                        backgroundColor: '#285744',
                        borderRadius: '50%',
                        mb: 2,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}
                    >
                      3
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 1 }}>
                      Approve or Dismiss
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Click "Approve" to add expenses to your budget, or "Delete" to ignore them
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 50,
                        height: 50,
                        backgroundColor: '#285744',
                        borderRadius: '50%',
                        mb: 2,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}
                    >
                      4
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'semibold', mb: 1 }}>
                      Track Spending
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Approved transactions appear in your budget for accurate spending tracking
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Call to Action */}
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
                Ready to Start Tracking?
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(40, 87, 68, 0.8)', mb: 3 }}>
                Connect your bank account to begin reviewing and managing your transactions
              </Typography>
              <PlaidLinkButton onPlaidConnected={handlePlaidConnected} />
            </Paper>
          </Box>
        </Box>
      ) : (
        /* Connected State with Transactions */
        <Box>
          {/* Header with Refresh Button */}
          <Card sx={{
            boxShadow: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Review Transactions
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {plaidTransactions.length} transaction{plaidTransactions.length !== 1 ? 's' : ''} pending review
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                  <Tooltip title="Fetch latest transactions from your bank">
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={handleRefreshExpense}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                  <Tooltip title="Remove bank account connection and all transaction data">
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LinkOff />}
                      onClick={() => setShowUnlinkDialog(true)}
                      disabled={loading}
                    >
                      Unlink Account
                    </Button>
                  </Tooltip>
                  <PlaidLinkButton
                    onPlaidConnected={handlePlaidConnected}
                    buttonText="Add Account"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {plaidTransactions.length === 0 ? (
            <Card sx={{
              boxShadow: 4,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <CardContent sx={{ textAlign: "center", p: 6 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    backgroundColor: 'grey.100',
                    borderRadius: '50%',
                    mb: 3
                  }}
                >
                  <TrendingUp sx={{ fontSize: 40, color: 'grey.400' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'semibold', mb: 2 }}>
                  No Transactions Found
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  All transactions have been reviewed, or there are no new transactions to process.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefreshExpense}
                    disabled={loading}
                  >
                    Refresh Transactions
                  </Button>
                  <PlaidLinkButton
                    onPlaidConnected={handlePlaidConnected}
                    buttonText="Add Another Account"
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {/* Instructions */}
              <Card sx={{
                boxShadow: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                mb: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InfoOutlined sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'semibold' }}>
                      How to Review Transactions
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleOutline sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          <strong>Approve:</strong> Add expense to your budget
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DeleteOutline sx={{ color: 'error.main', mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          <strong>Delete:</strong> Remove from review (won't be tracked)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalance sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          <strong>Budget:</strong> Added to "{selectedBudget?.name || 'Selected Budget'}"
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Transaction Cards */}
              <Stack spacing={2}>
                {plaidTransactions.map((tx) => (
                  <PlaidStreamCard
                    key={tx.id}
                    id={tx.id}
                    name={tx.merchant_name || "Unknown Merchant"}
                    amount={Math.abs(tx.amount)} // Ensure positive display
                    category={tx.category}
                    date={tx.date_paid}
                    type="expense"
                    onApprove={handleApproveExpense}
                    onDelete={handleDeleteExpense}
                    disabled={loading}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}

      {/* Unlink Confirmation Dialog */}
      <Dialog
        open={showUnlinkDialog}
        onClose={() => !unlinking && setShowUnlinkDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Unlink Bank Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unlink your bank account? This action will:
          </DialogContentText>
          <Box sx={{ mt: 2, ml: 2 }}>
            <Typography variant="body2" component="div">
              • Remove all transaction data from your account
            </Typography>
            <Typography variant="body2" component="div">
              • Delete the connection to your bank account
            </Typography>
            <Typography variant="body2" component="div">
              • Require you to reconnect if you want to import transactions again
            </Typography>
          </Box>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowUnlinkDialog(false)}
            disabled={unlinking}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUnlinkAccount}
            color="error"
            variant="contained"
            disabled={unlinking}
            startIcon={unlinking ? <CircularProgress size={20} /> : null}
          >
            {unlinking ? 'Unlinking...' : 'Unlink Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// import {
//   Typography,
//   Button,
//   Box,
//   Divider,
//   Grid,
//   Stack,
//   Paper,
// } from "@mui/material";
// import { useState, useEffect } from "react";
// import PlaidStreamCard from "./PlaidStreamCard.jsx";
// import PlaidLinkButton from "./PlaidLink.jsx";
// import { useAuthenticatedApi } from "../../services/hooks.js";
// import { useUserPlaid } from "../../context/UserPlaidContext.jsx";
// import {
//   deleteTransactions,
//   listTransactions,
//   addTransactions,
// } from "../../services/plaidService.jsx";
// // IMPORT POST CALL
//
// export default function TransactionsReviewPage() {
//   const [plaidConnected, setPlaidConnected] = useState(false);
//   const { api } = useAuthenticatedApi();
//   const { fetchTransactions, plaidTransactions, setPlaidTransactions } =
//     useUserPlaid();
//
//   console.log("Plaid Transactions:", plaidTransactions);
//
//   const handleApproveExpense = (id) => {
//     const expenseToApprove = plaidTransactions.find(
//       (expense) => expense.id === id,
//     );
//     console.log("Expense to be approved: ", expenseToApprove);
//     // FINISH WITH CRUD;
//     addTransactions(api, id);
//     handleDeleteExpense(id);
//   };
//
//   const handleDeleteExpense = (id) => {
//     // Needs to call 'delete' method for plaid/transactions DT
//     deleteTransactions(api, id);
//     setPlaidTransactions((prev) => prev.filter((x) => x.id !== id));
//   };
//
//   const handleRefreshExpense = async () => {
//     let res = await listTransactions(api);
//     setPlaidTransactions((prev) => [...prev, ...res]);
//   };
//
//   useEffect(() => {
//     fetchTransactions();
//   }, []);
//
//   return (
//     <>
//       {!plaidConnected ? ( // Make is !plaidConnected after completing the dev
//         <>
//           <Box
//             sx={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               height: "100%",
//               mb: 2,
//             }}
//           >
//             <PlaidLinkButton onPlaidConnected={setPlaidConnected} />
//           </Box>
//         </>
//       ) : (
//         <>
//           {plaidTransactions.length < 1 ? (
//             <PlaidLinkButton onPlaidConnected={setPlaidConnected} />
//           ) : null}
//           {/* Expenses */}
//           <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
//             <Button onClick={handleRefreshExpense}>Refresh</Button>
//           </Box>
//           <Box sx={{ minWidth: 0 }}>
//             <Stack spacing={2}>
//               {plaidTransactions.map((tx) => (
//                 <PlaidStreamCard
//                   key={tx.id}
//                   id={tx.id}
//                   name={tx.merchant_name}
//                   amount={-tx.amount}
//                   category={tx.category} // Displaying the category
//                   date={tx.date_paid}
//                   type="expense"
//                   onApprove={handleApproveExpense}
//                   onDelete={handleDeleteExpense}
//                 />
//               ))}
//             </Stack>
//           </Box>
//         </>
//       )}
//     </>
//   );
// }
