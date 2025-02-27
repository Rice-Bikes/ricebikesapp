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

interface SetProjectsDropdownProps {
    setRefurb: () => void;
    // disabled: boolean;
    setBeerBike: () => void;
}

const options = ["Refurb", "Beer Bike"]; // list of actions
export default function SetProjectsTypesDropdown({
    setRefurb,
    setBeerBike,
}: SetProjectsDropdownProps): JSX.Element {
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
            setRefurb();
        }
        else {
            setBeerBike();
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
                color="primary"
                variant="outlined"
                ref={anchorRef}
                aria-label="Button group with a nested menu"
            >
                <Button
                    aria-controls={open ? "split-button-menu" : undefined}
                    aria-expanded={open ? "true" : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                    size="medium"
                >
                    Set Project Type
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
                                                backgroundColor: index === 0 ? "smoke" : "lightblue"
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
