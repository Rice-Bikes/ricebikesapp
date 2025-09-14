// import { useState } from "react";
import { TransactionsTable } from "../features/TransactionsTable/TransactionsTable";
import RiceBikesIcon from "../assets/img/rice-bikes_white.png";
import "./App.css";
import { Button } from "@mui/material";
import { Routes, Route, Link } from "react-router-dom";
import TransactionDetail from "../features/TransactionPage/TransactionPage";
import { BikeTransactionPageWrapper } from "../features/TransactionPage/BikeTransactionPageWrapper";
import { useState } from "react";
import AuthPrompt from "../components/AuthPrompt/AuthPrompt";
import { User } from "../model";
import AdminPage from "../features/AdminPage/AdminPage";
import WhiteboardPage from "../features/WhiteboardPage";
import { ToastContainer } from "react-toastify";
import { queryClient } from "./queryClient";



function App() {
  const [user, setNewUser] = useState<User>({} as User);

  const onUserChange = (user: User) => {
    setNewUser(user);
  };

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
            queryClient.removeQueries({ queryKey: ["user"] });
          }}
        >
          {" "}
          <h2>
            {user === null ? (
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
        setUser={onUserChange}
      />
      <Routes>
        <Route
          path="/"
          element={
            <TransactionsTable user={user} />
          }
        />
        <Route
          path="/transaction-details/:transaction_id"
          element={<TransactionDetail propUser={user} />}
        />
        <Route
          path="/bike-transaction/:transaction_id"
          element={<BikeTransactionPageWrapper />}
        />
        <Route
          path="/admin"
          element={<AdminPage user={user} />}
        />
        <Route
          path="/whiteboard"
          element={<WhiteboardPage user={user} />}
        />
      </Routes>
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
    </>
  );
}


export default App;
