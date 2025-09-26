import { SignedOut, SignInButton } from "@clerk/clerk-react";
import { Box, Button, Typography, Stack, Card, CardContent, Grid } from "@mui/material";

export default function SignedOutPage() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
            }}
          >
            <Button variant="contained" color="primary">
              Login/Register
            </Button>
          </Box>
        </SignInButton>

        <Typography
          variant="h3"
          component="h1"
          sx={{
            textAlign: "center",
            fontWeight: 700,
            mt: 4,
            mb: 2,
            color: "#285744"
          }}
        >
          Welcome to BudgetBox
        </Typography>
        
        <Typography
          variant="h6"
          sx={{
            textAlign: "center",
            mb: 4,
            color: "text.secondary",
            maxWidth: 600,
            mx: "auto"
          }}
        >
          Take control of your finances with our comprehensive budgeting platform. 
          Plan your income, track expenses, and review bank transactions all in one place.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: "#285744" }}>
                  📊 Plan Your Budget
                </Typography>
                <Typography variant="body1">
                  Create monthly budgets with custom names for different goals like vacations, 
                  new cars, or general expenses. Set income streams and planned expenses.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: "#285744" }}>
                  💳 Track Expenses
                </Typography>
                <Typography variant="body1">
                  Monitor your actual spending against your planned budget. 
                  Add expenses as they occur and see real-time totals.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: "#285744" }}>
                  🏦 Bank Integration
                </Typography>
                <Typography variant="body1">
                  Connect your bank account via Plaid to automatically import transactions. 
                  Review and approve expenses to add them to your budget.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <SignInButton mode="modal">
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                bgcolor: "#285744",
                "&:hover": { bgcolor: "#1e3f2e" },
                px: 4,
                py: 1.5
              }}
            >
              Get Started
            </Button>
          </SignInButton>
        </Box>
      </SignedOut>
    </>
  );
}
