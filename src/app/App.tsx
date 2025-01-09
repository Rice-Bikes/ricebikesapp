// import { useState } from "react";
import { TransactionsTable } from "../features/TransactionsTable/TransactionsTable";
import RiceBikesIcon from "../assets/img/rice-bikes_white.png";
import "./App.css";
import { Button } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Transaction from "../components/TransactionPage/TransactionPage";
//import {RepairItemList} from '../components/RepairItem/RepairItem';

function App() {
  return (
    <>
      <header id="taskbar">
        <img src={RiceBikesIcon} alt="Rice Bikes Icon" />
        <h2>Rice Bikes App</h2>
        <Button id="logout" variant="contained" disableElevation>
          {" "}
          <h2>Logout</h2>{" "}
        </Button>
      </header>
      <Routes>
        <Route path="/" element={<TransactionsTable />} />
        <Route path="/transaction-details" element={<Transaction />} />
      </Routes>
    </>
  );
}

export default App;
