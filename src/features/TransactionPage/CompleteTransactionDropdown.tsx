import { useState, useRef } from "react";
import {
    ButtonGroup,
    Button,
    Popper,
    Grow,
    Paper,
    ClickAwayListener,
    MenuItem,
    MenuList,
} from "@mui/material";

interface CompleteTransactionDropdownProps {
    sendEmail: () => void;
    disabled: boolean;
    completeTransaction: () => void;
}

const options = ["Send Email", "Complete w/out Email"]; // list of actions
export default function CompleteTransactionDropdown({
    sendEmail,
    disabled,
    completeTransaction,
}: CompleteTransactionDropdownProps): JSX.Element {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(1);


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
        if (index === 0) {
            sendEmail();
        }
        else {
            completeTransaction();
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

    return (
        <>
            <ButtonGroup
                disabled={disabled}
                style={
                    {
                        color: "white",
                        backgroundColor: disabled ? "grey" : "primary"
                    }
                }
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
                        color: "white",
                    }}

                >
                    Complete Transaction
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
                                    <MenuItem disabled={true}>Complete Transaction</MenuItem>
                                    {options.map((option, index) => (
                                        <MenuItem
                                            key={option.toUpperCase()}
                                            // disabled={index === 2}
                                            selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                            style={{
                                                backgroundColor: index === 0 ? "white" : "lightgray"
                                            }}
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
}
