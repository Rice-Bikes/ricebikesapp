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
  colors: string[];
  setTransactionType: (type: string) => void;
  initialOption: string;
  isAllowed: (option: string) => boolean;
  disabled?: boolean;
}
const debug = false;

const TransactionOptionDropdown: React.FC<TransactionOptionDropdownProps> = ({
  options,
  setTransactionType,
  initialOption,
  colors,
  isAllowed,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedStatus, setSelectedStatus] = useState(initialOption);
  const [selectedIndex, setSelectedIndex] = useState(
    options.findIndex((option) => option.toLowerCase() === initialOption)
  );

  // const handleClick = () => {
  //   console.info(`You clicked ${options[selectedIndex]}`);
  // };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    tag: string,
    index: number
  ) => {
    if (debug) console.info(`You clicked ${options[index]} with ${event}`);
    setSelectedIndex(index);
    setSelectedStatus(tag);
    setTransactionType(tag);
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
              colors[selectedIndex] ?? "gray",
            px: { xs: 1, md: 1.5 },
          }}
        >
          {selectedStatus}
        </Button>
      </ButtonGroup>
      {!disabled && (
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
                    {options.filter(option => isAllowed(option)).map((option, index) => (
                      <MenuItem
                        key={option.toUpperCase()}
                        // disabled={index === 2}
                        selected={option === selectedStatus}
                        onClick={(event) => handleMenuItemClick(event, option, index)}
                      >
                        {option}
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>)}
    </>
  );
};

export default TransactionOptionDropdown;
