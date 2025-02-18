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
import { Transaction } from "../../model";
import NewTransactionForm from "./CustomerForm";

interface TransactionDropdownProps {
  alertAuth: () => void;
}

const options = ["Inpatient", "Outpatient", "Merchandise", "Retrospec"]; // list of actions
export default function CreateTransactionDropdown({
  alertAuth,
}: TransactionDropdownProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1);

  const nav = useNavigate();

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
    alertAuth();
    setShowForm(true);
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
    console.log("Transaction created", newTransaction);
    setShowForm(false);
    nav(
      `/transaction-details/${newTransaction.transaction_id}?` +
        new URLSearchParams({ type: options[selectedIndex] })
    );
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
            onClose={() => setShowForm(false)}
            t_type={options[selectedIndex]}
          />
        </Box>
      </Modal>
    </>
  );
}
