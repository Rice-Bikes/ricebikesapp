import React, {useState} from 'react';
import { IRow } from "../../features/TransactionsTable/TransactionsTable"

interface NewTransactionFormProps {
    onTransactionCreated: (newTransaction: any) => void;
    isOpen: boolean;
    onClose: () => void;
}

function NewTransactionForm({onTransactionCreated, isOpen, onClose}: NewTransactionFormProps) {
    const [formState, setFormState] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: 0,
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
        console.log("handle submit");
        const newTransaction: IRow = {
            // TODO: need to make id generator
            "#": Math.floor(Math.random() * 10000),
            Tags: { 
              waitEmail: false,
              nuclear: false,
              waitPart: false,
              refurb: false,
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
              color: formState.color,
            },
            Type: {// TODO: need to set type correctly based on dropdown selection
              inpatient: true,
              outpatient: false,
              merch: false,
              retrospec: false,
              beerBike: false,
            },
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
    if(!isOpen) return null;
    return (
      <div className="modal-overlay">
        <div className='modal-container'>
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