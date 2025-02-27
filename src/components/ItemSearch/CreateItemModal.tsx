import { Button } from "@mui/material";
// import type { CustomNoRowsOverlayProps } from "ag-grid-react";
import React, {useState} from "react";
import ItemPageModal from "../ItemPage";


export const CustomNoRowsOverlay: React.FC = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
        <Button
            style={{ "pointerEvents": "all" }} variant="contained" color="primary" onClick={() => setOpen(true)}>
           Add New Item
        </Button>
        <ItemPageModal
        open={open}
        onClose={() => setOpen(false)}
        />
        </>
    );
};