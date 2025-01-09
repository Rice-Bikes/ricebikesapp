// import { useState } from "react";
import { Transactions } from "../features/TransactionsTable/TransactionsTable";
import RiceBikesIcon from "../assets/img/rice-bikes_white.png";
import "./App.css";
import { Button } from "@mui/material";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import TransactionDetail from "../components/TransactionPage/TransactionPage";
//import {RepairItemList} from '../components/RepairItem/RepairItem';
import {RepairsProvider} from '../components/RepairItem/RepairItem';
import {PartsProvider} from '../components/PartItem/PartItem';

function App() {
  return (
    <RepairsProvider>
      <PartsProvider>
        <Router>
          <header id="taskbar">
            <img src={RiceBikesIcon} alt="Rice Bikes Icon" />
            <h2>Rice Bikes App</h2>
            <Button id="logout" variant="contained" disableElevation>
              {" "}
              <h2>Logout</h2>{" "}
            </Button>
          </header>
          <Routes>
            <Route path="/" element={<Transactions />} />
            <Route path="/transaction-details" element={<TransactionDetail />} />
          </Routes>
        </Router>
      </PartsProvider>
    </RepairsProvider>
    
  );
}

export default App;
