import React, { useState } from "react";
import { Dialog, TextField, Button } from "@mui/material";
// import { Link } from "react-router-dom";
import DBModel, {
  CreateCustomer,
  CreateTransaction,
  Customer,
  Transaction,
} from "../../model";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../app/main";

interface NewTransactionFormProps {
  onTransactionCreated: (newTransaction: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
  t_type: string;
}

function NewTransactionForm({
  onTransactionCreated,
  isOpen,
  onClose,
  t_type,
}: NewTransactionFormProps) {
  const [formState, setFormState] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  // const [currentStep, setCurrentStep] = useState(1);
  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prevFormState) => ({ ...prevFormState, [name]: value }));
  };

  const createCustomer = useMutation({
    mutationFn: (newCustomer: CreateCustomer) => {
      return DBModel.createCustomer(newCustomer);
    },

    onSuccess: (data: Customer) => {
      console.log("Customer created", data);
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
      
      const submittedTransaction: CreateTransaction = {
        transaction_type: t_type,
        customer_id: data.customer_id, // TODO: need to figure this out
        is_employee: false, // TODO: should be based on if custy is recognized as employee
      };
      CreateTransaction.mutate(submittedTransaction);
    },
    onError: (error) => {
      console.error("Error creating customer", error);
    },
  });
  const CreateTransaction = useMutation({
    mutationFn: (newTransaction: CreateTransaction) => {
      return DBModel.postTransaction(newTransaction);
    },
    onSuccess: (data) => {
      onTransactionCreated(data);
      console.log("Transaction created", data);
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
      onTransactionCreated(data);
      onClose();
    },
    onError: (error) => {
      console.log("Error creating transaction", error);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("handle submit");

    const newCustomer: CreateCustomer = {
      first_name: formState.first_name,
      last_name: formState.last_name,
      email: formState.email,
      phone: formState.phone,
    };

    createCustomer.mutate(newCustomer);
  };
  // const handleNext = () => {
  //   if (currentStep < 3) {
  //     setCurrentStep(currentStep + 1);
  //     console.log("incrementing step");
  //     console.log(currentStep);
  //   }
  // };
  if (!isOpen) return null;
  return (
    <Dialog
      open={isOpen}
      fullWidth={true}
      maxWidth="lg"
      className="modal-overlay"
      // sx={{  justifyContent: "center", alignItems: "center" }}
    >
      <div
        className="modal-container"
        style={{ padding: "10px" }}
      >
        <button className="close-button" onClick={onClose}>
          x
        </button>
        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", alignSelf: "center" }}
        >
          <div
            style={{
              width: "95%",
              display: "flex",
              flexDirection: "column",
              padding: "2.5%",
            }}
          >
            <h2>Customer Information</h2>
            <label>
              <TextField
                type="email"
                name="email"
                placeholder="Email:"
                value={formState.email}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </label>
            <br />
            <label style={{ minWidth: "95%" }}>
              <TextField
                type="text"
                name="first_name"
                placeholder="First Name:"
                value={formState.first_name}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </label>
            <br />
            <label>
              <TextField
                type="text"
                name="last_name"
                placeholder="Last Name:"
                value={formState.last_name}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </label>
            <br />
            <label>
              <TextField
                type="tel"
                name="phone"
                placeholder="Phone:"
                value={formState.phone}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </label>
            <br />
            <Button type="submit" variant="contained" >Submit Transaction</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default NewTransactionForm;
