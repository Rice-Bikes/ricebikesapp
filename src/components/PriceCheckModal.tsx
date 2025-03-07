import { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from "@mui/material";

import DBModel, { Part } from "../model";
import { useQuery } from "@tanstack/react-query";
import ItemPageModal from "./ItemPage";

type PriceCheckModalProps = {
    open: boolean;
    onClose: () => void;
};

const PriceCheckModal = ({
    open,
    onClose,
}: PriceCheckModalProps) => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showItemPage, setShowItemPage] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [item, setItem] = useState<Part>();



    const itemsQuery = useQuery(DBModel.getItemsQuery());
    const {
        //   isLoading: partsLoading,
        data: parts,
        error: partsError,
    } = itemsQuery;

    const handleCancel = () => {
        onClose();
        setSearchTerm("");
        setShowAddItem(false);
        setShowItemPage(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
    useEffect(() => {
        if (parts) {
            console.log(parts);
            setLoading(false);
        }
    }, [parts, loading]);

    if (partsError) {
        console.error(partsError);
        return <div>Error: {partsError.message}</div>;
    }

    const handleSearch = () => {
        console.log("searching for", searchTerm);
        const part = parts?.find((part) => part.upc === searchTerm
        );
        if (part) {
            console.log("found", part);
            setItem(part);
            setShowItemPage(true);
        }
        else {
            setShowAddItem(true);
        }
    };
    //   console.log("reqs", parts);
    return (
        <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md" style={{ height: "fit-content" }}>
            <DialogTitle>Enter UPC</DialogTitle>
            <DialogContent>
                <div style={{ height: "10%", minHeight: "fit-content", width: "100%", marginTop: "10px" }}>
                    <TextField
                        label="Search Term"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                handleSearch();
                            }
                        }}
                        variant="outlined"
                        fullWidth
                    />
                </div>

            </DialogContent>
            {showAddItem &&
                <DialogActions>
                    <Typography> Item not found. Add new item?</Typography>
                    <Button type="submit" variant="contained" onClick={() => setShowItemPage(false)}>Add Item</Button>
                </DialogActions>
            }
            <DialogActions>

                <Button onClick={handleCancel}>Cancel</Button>
            </DialogActions>
            <ItemPageModal open={showItemPage} onClose={() => setShowItemPage(false)} item={item} />
        </Dialog>
    );
};

export default PriceCheckModal;


// if (partsError) toast.error("parts: " + partsError);
//   const createOrderRequest = useMutation({
//     mutationFn: (req: OrderRequest) => DBModel.postOrderRequest(req),
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["orderRequest", transaction_id],
//       });
//     },
//   });

//   const updateOrderRequest = useMutation({
//     mutationFn: (req: OrderRequest) => DBModel.putOrderRequest(req),
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["orderRequest", transaction_id],
//       });
//     },
//   });