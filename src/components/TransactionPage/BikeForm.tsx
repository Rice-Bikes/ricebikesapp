import React, {useState} from 'react';
import { IRow } from "../../features/TransactionsTable/TransactionsTable";

interface NewTransactionFormProps {
    onTransactionCreated: (newTransaction: IRow) => void;
}

function NewTransactionForm({onTransactionCreated}: NewTransactionFormProps) {
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        phone: '',
        make: '',
        model: '',
        color: '',
    });
    const [currentStep, setCurrentStep] = useState(1);
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = event.target;
        setFormState((prevFormState) => ({...prevFormState, [name]: value}));
    };
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const newTransaction: IRow = {
            // TODO: need to make id generator
            "#": Math.floor(Math.random() * 10000),
            tag: { // TODO: need to set tags correctly based on dropdown selection
                inpatient: false,
                beerBike: false,
                nuclear: false,
                retrospec: false,
                merch: false,
            },
            Name: formState.name,
            Email: formState.email,
            Phone: formState.phone,
            Make: formState.make,
            Model: formState.model,
            Color: formState.color,
            Submitted: new Date(),
        };
        onTransactionCreated(newTransaction); 
        console.log(newTransaction);
    };
    const handleNext = () => {
        if (currentStep === 3) {
            handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
        } else {
            setCurrentStep(currentStep + 1);
        }
    };
    return (
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div>
              <h2>Step 1: User Information</h2>
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={formState.name}
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
              <button onClick={handleNext}>Next</button>
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
              <button onClick={handleNext}>Next</button>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <h2>Transaction Created!</h2>
            </div>
          )}
        </form>
      );
}

export default NewTransactionForm;