import { useEffect, useState } from "react";
import {
    Dialog,
    // DialogActions,
    DialogContent,
    DialogTitle,
    // Button,
    // Grid2,
    TextField,
    //   CircularProgress,
} from "@mui/material";

import DBModel from "../model";
import { useQuery } from "@tanstack/react-query";

type PriceCheckModalProps = {
    open: boolean;
    onClose: () => void;
    //   transaction_id: string;
    //   user_id: string;
};

const PriceCheckModal = ({
    open,
    onClose,
    //   transaction_id,
    //   user_id,
}: PriceCheckModalProps) => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    //   const [quantity, setQuantity] = useState(1);

    const itemsQuery = useQuery(DBModel.getItemsQuery());
    const {
        //   isLoading: partsLoading,
        data: parts,
        error: partsError,
    } = itemsQuery;
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
    const handleCancel = () => {
        onClose();
        setSearchTerm("");
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
    };


    //   console.log("reqs", parts);


    return (
        <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
            <DialogTitle>Enter UPC</DialogTitle>
            <DialogContent>
                <div style={{ height: 400, minHeight: 400, width: "100%" }}>
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
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PriceCheckModal;
