import React, { useState, useRef } from "react";
import {
  MenuItem,
  ButtonGroup,
  Button,
  ClickAwayListener,
  Paper,
  Popper,
  Grow,
  MenuList,
} from "@mui/material";

interface TransactionOptionDropdownProps {
  options: string[];
  setTransactionType: (type: string) => void;
  initialOption: number;
}

const TransactionOptionDropdown: React.FC<TransactionOptionDropdownProps> = ({
  options,
  setTransactionType,
  initialOption,
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialOption);

  // const handleClick = () => {
  //   console.info(`You clicked ${options[selectedIndex]}`);
  // };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    console.info(`You clicked ${options[index]} with ${event}`);
    setSelectedIndex(index);
    setTransactionType(options[index]);
    setOpen(false);
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
          sx={{
            backgroundColor:
              selectedIndex === 0
                ? "green"
                : selectedIndex === 1
                ? "blue"
                : "gray",
          }}
        >
          {options[selectedIndex]}
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
    </>
  );
};

export default TransactionOptionDropdown;
