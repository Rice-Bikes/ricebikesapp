// import { useState } from "react";
import { Transactions } from "../features/TransactionsTable/TransactionsTable";
import RiceBikesIcon from "../assets/img/rice-bikes_white.png";
import "./App.css";
import { Button } from "@mui/material";

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
      <Transactions />
    </>
  );
}

export default App;
