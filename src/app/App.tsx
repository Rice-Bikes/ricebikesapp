// import { useState } from "react";
import { TransactionsTable } from "../features/TransactionsTable/TransactionsTable";
import RiceBikesIcon from "../assets/img/rice-bikes_white.png";
import "./App.css";
import { Button } from "@mui/material";
import { Routes, Route, Link } from "react-router-dom";
import TransactionDetail from "../components/TransactionPage/TransactionPage";
//import {RepairItemList} from '../components/RepairItem/RepairItem';

function App() {
  return (
    <>
      <header id="taskbar">
        <Link to="/">
          <img src={RiceBikesIcon} alt="Rice Bikes Icon" />
        </Link>
        <h2>Rice Bikes App</h2>
        <Button id="logout" variant="contained" disableElevation>
          {" "}
          <h2>Logout</h2>{" "}
        </Button>
      </header>
      <Routes>
        <Route path="/" element={<TransactionsTable />} />
        <Route
          path="/transaction-details/:transaction_id"
          element={<TransactionDetail />}
        />
      </Routes>
    </>
  );
}

export default App;
