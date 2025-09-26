import { useCallback, useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useAuthenticatedApi } from "../../services/hooks.js";
import { useUserPlaid } from "../../context/UserPlaidContext.jsx";
import { Button } from "@mui/material";
import {
  createLinkToken,
  exchangePublicToken,
  fetchTransactionsFromApi,
} from "../../services/plaidService.jsx";

const PlaidLinkButton = ({ onPlaidConnected, buttonText = "Connect a bank account", variant = "contained" }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const { api } = useAuthenticatedApi();
  const { setPlaidTransactions } = useUserPlaid();

  const onSuccess = useCallback(
    async (publicToken) => {
      try {
        const tokenExchanged = await exchangePublicToken(api, publicToken);
        if (tokenExchanged) {
          onPlaidConnected(true);
          const transactions = await fetchTransactionsFromApi(api);
          setPlaidTransactions(transactions);
        }
      } catch (error) {
        console.error("Error during Plaid link process:", error);
        onPlaidConnected(false);
      } finally {
        setToken(null);
      }
    },
    [api, setPlaidTransactions, onPlaidConnected],
  );

  const onExit = useCallback(
    (err, metadata) => {
      console.log("Plaid Link exited:", { err, metadata });
      setToken(null);
    },
    []
  );

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
    onExit,
  });

  const handleCreateLinkToken = async () => {
    setLoading(true);
    try {
      const linkToken = await createLinkToken(api);
      setToken(linkToken);
    } catch (error) {
      console.error("Error creating link token:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && ready) {
      open();
    }
  }, [token, ready, open]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Button
        sx={{ textAlign: "center" }}
        onClick={handleCreateLinkToken}
        disabled={loading || (!ready && token)}
        variant={variant}
      >
        {loading ? "Loading..." : buttonText}
      </Button>
    </div>
  );
};

export default PlaidLinkButton;
