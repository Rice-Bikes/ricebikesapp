import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ButtonGroup,
  Button,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Modal,
  Box,
} from "@mui/material";
import DBModel, { Transaction, User, CreateTransaction, Customer } from "../../model";
import NewTransactionForm from "./CustomerForm";

interface TransactionDropdownProps {
  user: User
}

const options = ["Inpatient", "Outpatient", "Merch", "Retrospec"]; // list of actions
export default function CreateTransactionDropdown({
  user,
}: TransactionDropdownProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1);

  const nav = useNavigate();

  const handleRetrospectTransaction = async () => {
    console.log("handleRetrospectTransaction called - bypassing customer form");
    try {
      // Get existing customers and use the first one as placeholder
      console.log("Fetching existing customers...");
      const customers = await DBModel.createCustomer(
        {
          first_name: '',
          last_name: '',
          email: 'template@ricebikes.com',
          phone: '0000000000'
        }
      );

      if (!customers) {
        console.error("No existing customers found");
        setShowForm(true);
        return;
      }

      // Use the first customer as a placeholder
      const placeholderCustomer = customers as Customer;
      console.log("Using existing customer as placeholder:", placeholderCustomer);

      // Create transaction for bike sales workflow
      console.log("Creating transaction...");
      const newTransaction: CreateTransaction = {
        transaction_type: "Retrospec",
        customer_id: placeholderCustomer.customer_id,
        is_employee: false
      };

      const createdTransaction = await DBModel.postTransaction(newTransaction);
      console.log("Transaction created:", createdTransaction);

      // Log the transaction creation
      DBModel.postTransactionLog(
        createdTransaction.transaction_num,
        user.user_id,
        "Retrospec",
        "initiated bike sales workflow"
      );

      // Navigate directly to bike workflow
      console.log("Navigating to bike workflow:", `/bike-transaction/${createdTransaction.transaction_id}`);
      nav(`/bike-transaction/${createdTransaction.transaction_id}`);
    } catch (error) {
      console.error("Error creating Retrospec transaction:", error);
      // Fall back to showing the form if transaction creation fails
      setShowForm(true);
    }
  };

  // const handleClick = () => {
  //   console.info(`You clicked ${options[selectedIndex]}`);
  // };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    console.info(`You clicked ${options[index]} with ${event}`);
    setSelectedIndex(index);
    setOpen(false);

    // Special handling for Retrospec - skip customer form and go directly to bike workflow
    if (options[index] === "Retrospec") {
      console.log("Retrospec detected - calling handleRetrospectTransaction");
      handleRetrospectTransaction();
    } else {
      console.log("Non-Retrospec transaction - showing form");
      setShowForm(true);
    }
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  const handleTransactionCreated = (newTransaction: Transaction) => {
    // console.log("Transaction created", newTransaction);
    DBModel.postTransactionLog(
      newTransaction.transaction_num,
      user.user_id,
      newTransaction.transaction_type,
      "created transaction",
    );
    setShowForm(false);

    // Special handling for Retrospec transactions - redirect to bike sales process
    if (options[selectedIndex] === "Retrospec") {
      nav(`/bike-transaction/${newTransaction.transaction_id}`);
    } else {
      nav(
        `/transaction-details/${newTransaction.transaction_id}?` +
        new URLSearchParams({ type: options[selectedIndex] })
      );
    }
  };

  return (
    <>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        aria-label="Button group with a nested menu"
      >
        <Button
          aria-controls={open ? "split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          New Transaction
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 100 }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  <MenuItem disabled={true}>Choose a transaction type</MenuItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.toUpperCase()}
                      // disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <Box>
          <NewTransactionForm
            onTransactionCreated={handleTransactionCreated}
            isOpen={showForm}
            user_id={user.user_id}
            onClose={() => setShowForm(false)}
            t_type={options[selectedIndex]}
          />
        </Box>
      </Modal>
    </>
  );
}
