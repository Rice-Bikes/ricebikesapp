import { useState } from "react";
import { generateReceiptHTML, copyHTMLToClipboard } from "./RecieptTemplate";
import { Button } from "@mui/material";
import { toast } from "react-toastify";
import type { Part, Repair, Transaction } from "../model";

interface CopyReceiptButtonProps {
  transactionData: Transaction;
  items: Part[];
  repairs: Repair[];
}

const CopyReceiptButton = ({
  transactionData,
  items,
  repairs,
}: CopyReceiptButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReceipt = async () => {
    const receiptHTML = generateReceiptHTML({
      transaction_num: transactionData.transaction_num,
      items: items,
      repairs: repairs,
    });

    try {
      await copyHTMLToClipboard(receiptHTML);

      setCopied(true);
      toast.success("Receipt copied! Now paste (Ctrl+V or Cmd+V) into Gmail.");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy receipt");
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      onClick={handleCopyReceipt}
      variant="outlined"
      sx={{ height: "100%", ml: 1 }}
    >
      {copied ? "✓ Copied!" : "Generate Receipt"}
    </Button>
  );
};

export default CopyReceiptButton;
