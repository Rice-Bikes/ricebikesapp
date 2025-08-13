import React, { useEffect, useState } from "react";
import { Dialog, TextField, Button, FormControl, Autocomplete, CircularProgress, createFilterOptions } from "@mui/material";
import DBModel, {
  CreateCustomer,
  CreateTransaction,
  Customer,
  Transaction,
} from "../../model";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../app/queryClient";
import { toast } from "react-toastify";

interface NewTransactionFormProps {
  onTransactionCreated: (newTransaction: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
  t_type: string;
  user_id: string;
}

const filter = createFilterOptions<string>();

function NewTransactionForm({
  onTransactionCreated,
  isOpen,
  onClose,
  t_type,
  // user_id,
}: NewTransactionFormProps) {
  const [formState, setFormState] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [customers, setCustomers] = useState<Customer[]>();
  const [autocompleted, setAutocompleted] = useState("");
  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prevFormState) => ({ ...prevFormState, [name]: value }));
  };

  console.log(t_type)

  const { status, data, error } = useQuery({
    queryKey: ["customers"],
    queryFn: () => {
      return DBModel.fetchCustomers();
    },
    select: (data) => data as Customer[]
  });

  if (error) {
    console.error("Error fetching customers", error);
    toast.error("Error fetching customers");
  }

  useEffect(() => {
    if (data && status === "success") {
      setCustomers(data);
    }
    console.log("customers", data);
  }, [data, status]);

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

  const updateCustomer = useMutation({
    mutationFn: (updatedCustomer: Customer) => {
      return DBModel.updateCustomer(updatedCustomer);
    },
    onSuccess: (data) => {
      console.log("Customer updated", data);
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    }
    ,
    onError: (error) => {
      console.error("Error updating customer", error);
      toast.error("Error updating customer");
    }
  });


  const CreateTransaction = useMutation({
    mutationFn: (newTransaction: CreateTransaction) => {
      return DBModel.postTransaction(newTransaction).then((data) => {
        console.log("Transaction created", data);
        return data;
      });
    },
    onSuccess: (data) => {
      onTransactionCreated(data);
      console.log("Transaction created", data);
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });

      // onTransactionCreated(data);
      onClose();
    },
    onError: (error) => {
      console.log("Error creating transaction", error);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newCustomer: CreateCustomer = {
      first_name: formState.first_name,
      last_name: formState.last_name,
      email: formState.email,
      phone: formState.phone,
    };

    if (
      autocompleted.length > 0
    ) {
      updateCustomer.mutate({
        customer_id: autocompleted,
        ...newCustomer,
      });
      const submittedTransaction: CreateTransaction = {
        transaction_type: t_type,
        customer_id: autocompleted,
        is_employee: false,
      };
      CreateTransaction.mutate(submittedTransaction);
    }
    else {
      createCustomer.mutate(newCustomer);
    }
    queryClient.removeQueries({
      queryKey: ["user"],
    });
  };


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
        {customers === undefined
          ? <CircularProgress /> :
          <form
            onSubmit={handleSubmit}
            style={{ width: "100%", alignSelf: "center" }}
          >
            <FormControl style={{ width: "100%", alignSelf: "center" }}>
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
                  <Autocomplete
                    renderInput={(params) => (
                      <TextField {...params} type="email" name="email" onChange={handleTextFieldChange} placeholder="Email:" value={formState.email} required />)}
                    options={customers!.map((customer) => customer.email)}
                    onChange={(_, value, reason) => {
                      if (reason === "selectOption") {
                        const customer = customers!.find(
                          (customer) => customer.email === value
                        );
                        if (customer) {
                          setFormState({
                            first_name: customer.first_name,
                            last_name: customer.last_name,
                            email: customer.email,
                            phone: customer.phone ?? '',
                          });
                          setAutocompleted(customer.customer_id);
                        }
                      }
                      else {
                        setFormState({
                          first_name: "",
                          last_name: "",
                          email: value ?? "",
                          phone: "",
                        });
                        setAutocompleted("");
                      }
                      if (reason === "blur") {
                        setAutocompleted("");
                      }
                    }
                    }
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      // Suggest the creation of a new value
                      const isExisting = options.some((option) => inputValue === option);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push(`${inputValue}`);
                      }
                      return filtered;
                    }
                    }
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
                    required
                  />
                </label>
                <br />
                <>
                  <label>
                    <TextField
                      type="text"
                      name="last_name"
                      placeholder="Last Name:"
                      value={formState.last_name}
                      onChange={handleTextFieldChange}
                      fullWidth
                      required
                    />
                  </label>
                  <br />
                </>
                {t_type !== "Merch" ? (
                  <>
                    <label>
                      <TextField
                        type="tel"
                        name="phone"
                        placeholder="Phone:"
                        value={formState.phone}
                        onChange={handleTextFieldChange}
                        slotProps={{
                          htmlInput: {
                            pattern: "[0-9]{3}[0-9]{3}[0-9]{4}"
                          }
                        }}
                        fullWidth
                      />
                    </label>
                    <br />
                  </>)
                  : <></>}
                <Button type="submit" variant="contained" >Submit Transaction</Button>
              </div>
            </FormControl>
          </form>}
      </div>
    </Dialog >
  );
}

export default NewTransactionForm;
