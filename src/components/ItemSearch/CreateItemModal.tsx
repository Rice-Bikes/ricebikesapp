import { Button, CircularProgress } from "@mui/material";
// import type { CustomNoRowsOverlayProps } from "ag-grid-react";
import React, { useState } from "react";
import ItemPageModal from "../ItemPage";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import DBModel from "../../model";
import { queryClient } from "../../app/queryClient";

interface CustomNoRowsOverlayProps {
    searchTerm: string;
}

export const CustomNoRowsOverlay: React.FC<CustomNoRowsOverlayProps> = ({
    searchTerm
}: CustomNoRowsOverlayProps) => {
    const [open, setOpen] = useState(false);
    const [checkForItem, setCheckForItem] = useState(false);

    const activateItem = useMutation({
        mutationFn: (item_id: string) => {
            setCheckForItem(true);
            return DBModel.activateItem(item_id);
        },
        onSuccess: () => {
            setCheckForItem(false);
            queryClient.invalidateQueries({
                queryKey: ["items"]
            });
            toast.success("Item activated");
        },
        onError: () => {
            setCheckForItem(false);
            toast.error(`Error activating item -- Create new item or try again`);
        },
        mutationKey: ["itemActivated"],
    });
    return (
        <>
            <Button style={{ "pointerEvents": "all", opacity: checkForItem ? 0.5 : 1, "backgroundColor": "#CC5A3F", "marginRight": "10px" }} variant="contained" color="primary" onClick={() => activateItem.mutate(searchTerm)}>
                {!checkForItem ? "Check QBP for Item" : <CircularProgress />}
            </Button>
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