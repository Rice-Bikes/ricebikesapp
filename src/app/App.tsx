import { useMemo, useState } from "react";
import { TransactionsTable } from "../features/TransactionsTable/TransactionsTable";
// import RiceBikesIcon from "../assets/img/rice-bikes_white.png";
import {
  Routes,
  Route,
  useLocation,
  matchPath,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import TransactionDetail from "../features/TransactionPage/TransactionPage";
import { BikeTransactionPageWrapper } from "../features/BuildStepsPage/BikeTransactionPageWrapper";
import { UserProvider } from "../contexts/UserContext";
import AuthPrompt from "../components/AuthPrompt/AuthPrompt";
import AdminPage from "../features/AdminPage/AdminPage";
import WhiteboardPage from "../features/WhiteboardPage";
import { ToastContainer } from "react-toastify";
import { Typography, Stack, Grid2 } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CollapsedRail } from "./CollapsedRail";
import { themeOptions } from "./theme";
import AppDrawer from "./Drawer";

const theme = createTheme(themeOptions);
function App() {
  return (
    <ThemeProvider theme={theme}>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const nav = useNavigate();
  const title = useMemo(() => {
    const path = location.pathname;
    if (matchPath("/transaction-details/:transaction_id", path))
      return "Your bike";
    if (matchPath("/bike-transaction/:transaction_id", path))
      return "Bike Build Page";
    if (matchPath("/admin", path)) return "Admin Hub";
    if (matchPath("/whiteboard", path)) return "Whiteboard";
    return "All bikes";
  }, [location.pathname]);
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <Grid2 style={{ margin: 0, padding: 0 }}>
      <Stack direction={"row"}>
        <Stack sx={{ width: "5vw" }}>
          <CollapsedRail open={open} toggleDrawer={toggleDrawer} />
          <AppDrawer open={open} toggleDrawer={toggleDrawer} />
        </Stack>
        <Stack
          direction={"column"}
          sx={{ width: "95vw", mt: 2, mb: 2 }}
          alignItems="center"
        >
          <Stack
            direction={"row"}
            alignItems="space-between"
            sx={{ width: "90vw" }}
          >
            <Typography
              variant="h2"
              noWrap
              width="55vw"
              onClick={() => {
                nav("/");
              }}
              sx={{ cursor: "pointer" }}
            >
              {title}
            </Typography>
            <AuthPrompt />
          </Stack>
          <Routes>
            <Route path="/" element={<TransactionsTable />} />
            <Route
              path="/transaction-details/:transaction_id"
              element={<TransactionDetail />}
            />
            <Route
              path="/bike-transaction/:transaction_id"
              element={<BikeTransactionPageWrapper />}
            />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/whiteboard" element={<WhiteboardPage />} />
          </Routes>
        </Stack>
      </Stack>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Grid2>
  );
}

export default App;
