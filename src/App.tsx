import { useState } from 'react'
import { Transactions } from './components/TransactionsTable/TransactionsTable'
import RiceBikesIcon from "./assets/img/rice-bikes_white.png";
import './App.css'

function App() {

  return (
    <>
      <header id="taskbar">
      <img src={RiceBikesIcon} alt="Rice Bikes Icon" />
      <h2>Rice Bikes App</h2>
      <button id="logout"> <h2>Logout</h2> </button>
    </header>
      <Transactions />
    </>
  )
}

export default App
