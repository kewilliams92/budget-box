import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import BudgetPage from './BudgetPage';
import TrackedExpensesPage from './TrackedExpensesPage';
import TransactionsReviewPage from './TransactionsReviewPage';

function CustomTabPanel(props) {
  const { children, value, index, isLoading, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && (
        <Box sx={{ p: 0, position: 'relative', minHeight: '400px' }}>
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f4e4bc 100%)',
                borderRadius: 2
              }}
            >
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ 
                  color: '#285744',
                  mb: 2
                }} 
              />
              <Box
                sx={{
                  color: '#285744',
                  fontSize: '1.1rem',
                  fontWeight: 'medium',
                  textAlign: 'center'
                }}
              >
                Loading {index === 0 ? 'Planned Budget' : index === 1 ? 'Tracked Expenses' : 'Transaction Review'}...
              </Box>
            </Box>
          ) : (
            children
          )}
        </Box>
      )}
    </div>
  );
}
CustomTabPanel.propTypes = { 
  children: PropTypes.node, 
  index: PropTypes.number.isRequired, 
  value: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired
};
const a11yProps = (index) => ({ id: `simple-tab-${index}`, "aria-controls": `simple-tabpanel-${index}` });

export default function BudgetTabs() {
  const [value, setValue] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const COLOR = '#6EC5A4';
  const TEXT = "#ffffffff";
  
  const handleChange = (event, newValue) => {
    setIsLoading(true);
    setValue(newValue);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (

    <Box sx={{ width: "100%", mt: 5}}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
<Tabs
  value={value}
  onChange={handleChange}
  aria-label="budget tabs"
  centered
  slotProps={{ indicator: { style: { display: "none" } } }}
  sx={{
    minHeight: 0, 
    "& .MuiTabs-flexContainer": {
      justifyContent: "center",
      alignItems: "stretch", 
    },

    "& .MuiTab-root": {
      minHeight: 0,         
      height: "100%",       
      textTransform: "none",
      fontWeight: 700,
      px: 3,
      py: 1.25,

      "&:not(:first-of-type)": {
        borderLeft: "1px solid",
        borderColor: "divider",
      },
                  "&:hover": { bgcolor: "action.hover" },
                },
                "& .MuiTab-root.Mui-selected": {
                  bgcolor: COLOR,
                  color: TEXT,
                },
    "& .MuiTab-root.Mui-selected + .MuiTab-root": {
      borderLeftColor: "transparent",
    },
  }}
>
            {["Planned Budget", "Tracked Expenses", "Transaction Review"].map((label, i) => (
              <Tab
                key={label}
                label={label}
                {...a11yProps(i)}
                disableRipple
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  py: 1.25,
                  minHeight: 44,
                  "&:not(:last-of-type)": {
                    borderRight: "1px solid",
                    borderColor: "divider",
                  },
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-selected": {
                    bgcolor: COLOR,
                    color: TEXT,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>
      </Box>
      <CustomTabPanel value={value} index={0} isLoading={isLoading}>
        <BudgetPage />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1} isLoading={isLoading}>
        <TrackedExpensesPage />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2} isLoading={isLoading}>
        <TransactionsReviewPage />
      </CustomTabPanel>
    </Box>
  );
}