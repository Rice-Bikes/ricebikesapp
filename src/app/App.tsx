// import { useState } from "react";
import { TransactionsTable } from "../features/TransactionsTable/TransactionsTable";
import RiceBikesIcon from "../assets/img/rice-bikes_white.png";
import "./App.css";
import { Button } from "@mui/material";
import { Routes, Route, Link } from "react-router-dom";
import TransactionDetail from "../features/TransactionPage/TransactionPage";
import { useState } from "react";
import AuthPrompt from "../components/AuthPrompt/AuthPrompt";
import { User } from "../model";
import AdminPage from "../features/AdminPage/AdminPage";
import RetrospecTransactionsPage from "../features/RetrospecTransactions/RetrospecTransactionsPage";
import WhiteboardPage from "../features/WhiteboardPage";
import { ToastContainer } from "react-toastify";
//import {RepairItemList} from '../components/RepairItem/RepairItem';

function App() {
  // const loggedInUser = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>();
  // const [user, setUser] = useState(null);
  const [expediteAuth, setExpediteAuth] = useState(false);
  // setUser(null);
  // const nav = useNavigate();

  if (!user) {
    return (
      <>
        <header id="taskbar">
          <Link to="/">
            <img src={RiceBikesIcon} alt="Rice Bikes Icon" />
          </Link>
          <h2>Rice Bikes App</h2>
          <Button
            id="logout"
            variant="contained"
            style={{ backgroundColor: "black" }}
            onClick={() => {
              setIsLoggedIn(!isLoggedIn);
            }}
          >
            {" "}
            <h2>
              {isLoggedIn ? (
                <Link to="https://idp.rice.edu/idp/profile/cas/login?service=https://ricebikesapp.rice.edu/auth">
                  {"Login"}
                </Link>
              ) : (
                "Logout"
              )}
            </h2>{" "}
          </Button>
        </header>
        <AuthPrompt
          expediteAuth={true}
          setExpediteAuth={(state: boolean) => setExpediteAuth(state)}
          setUser={(user: User) => setUser(user)}
        />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <header id="taskbar">
        <Link to="/">
          <img src={RiceBikesIcon} alt="Rice Bikes Icon" />
        </Link>
        <h2>Rice Bikes App</h2>
        <Button
          id="logout"
          variant="contained"
          style={{ backgroundColor: "black" }}
          onClick={() => {
            setIsLoggedIn(!isLoggedIn);
          }}
        >
          {" "}
          <h2>
            {isLoggedIn ? (
              <Link to="https://idp.rice.edu/idp/profile/cas/login?service=https://ricebikesapp.rice.edu/auth">
                {"Login"}
              </Link>
            ) : (
              "Logout"
            )}
          </h2>{" "}
        </Button>
      </header>
      <AuthPrompt
        expediteAuth={expediteAuth}
        setExpediteAuth={(state: boolean) => setExpediteAuth(state)}
        setUser={(user: User) => setUser(user)}
      />
      <Routes>
        <Route
          path="/"
          element={
            <TransactionsTable user={user} alertAuth={() => setExpediteAuth(true)} />
          }
        />
        <Route
          path="/transaction-details/:transaction_id"
          element={<TransactionDetail alertAuth={() => setExpediteAuth(true)} propUser={user} />}
        />
        <Route
          path="/admin"
          element={<AdminPage />}
        />
        <Route
          path="/retrospec"
          element={<RetrospecTransactionsPage />}
        />
        <Route
          path="/whiteboard"
          element={<WhiteboardPage user_id={user.user_id} />}
        />
      </Routes>
    </>
  );
}

export default App;
