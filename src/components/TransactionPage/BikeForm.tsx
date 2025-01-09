import React, { useState } from "react";
import { IRow } from "../../features/TransactionsTable/TransactionsTable";


interface NewTransactionFormProps {
  onTransactionCreated: (newTransaction: IRow) => void;
  isOpen: boolean;
  onClose: () => void;
}

function NewTransactionForm({
  onTransactionCreated,
  isOpen,
  onClose,
}: NewTransactionFormProps) {
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    make: "",
    model: "",
    color: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prevFormState) => ({ ...prevFormState, [name]: value }));
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("handle submit");
    const newTransaction: IRow = {
      // TODO: need to make id generator
      Transaction: {
        transaction_num: "", // TODO: need to figure this out
        date_created: new Date(),
        transaction_type: "", // TODO: need to set based on type
        customer_id: "", // TODO: need to figure this out
        bike_id: "", // TODO: need to figure this out
        total_cost: 0.00,
        description: "",
        is_completed: false,
        is_paid: false,
        is_refurb: false,
        is_urgent: false,
        is_nuclear: false,
        is_beer_bike: false,
        is_employee: false, // TODO: should be based on if custy is recognized as employee
        is_reserved: false,
        is_wait_email: false,
        date_completed: null,
      },
      Customer: {
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        phone: formState.phone,
      },
      Bike: {
        make: formState.make,
        model: formState.model,
        description: formState.color,
      },
      Repairs: [],
      Parts: [],
      Submitted: new Date(),
    };
    onTransactionCreated(newTransaction);
    console.log(newTransaction);
    onClose();
  };
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      console.log("incrementing step");
      console.log(currentStep);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="close-button" onClick={onClose}>
          x
        </button>
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div>
              <h2>Step 1: User Information</h2>
              <label>
                First Name:
                <input
                  type="text"
                  name="firstName"
                  value={formState.firstName}
                  onChange={handleInputChange}
                />
              </label>
              <br />
              <label>
                Last Name:
                <input
                  type="text"
                  name="lastName"
                  value={formState.lastName}
                  onChange={handleInputChange}
                />
              </label>
              <br />
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleInputChange}
                />
              </label>
              <br />
              <label>
                Phone:
                <input
                  type="tel"
                  name="phone"
                  value={formState.phone}
                  onChange={handleInputChange}
                />
              </label>
              <br />
              <button type="button" onClick={handleNext}>
                Next
              </button>
            </div>
          )}
          {currentStep === 2 && (
            <div>
              <h2>Step 2: Bike Information</h2>
              <label>
                Make:
                <input
                  type="text"
                  name="make"
                  value={formState.make}
                  onChange={handleInputChange}
                />
              </label>
              <br />
              <label>
                Model:
                <input
                  type="text"
                  name="model"
                  value={formState.model}
                  onChange={handleInputChange}
                />
              </label>
              <br />
              <label>
                Color:
                <input
                  type="text"
                  name="color"
                  value={formState.color}
                  onChange={handleInputChange}
                />
              </label>
              <button type="button" onClick={handleNext}>
                Next
              </button>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <h2>Creating transaction...</h2>
              <button type="submit">Submit</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default NewTransactionForm;
