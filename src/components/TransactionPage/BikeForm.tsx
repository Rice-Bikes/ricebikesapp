import React, { useState } from "react";
import { Dialog, TextField } from "@mui/material";
// import { Link } from "react-router-dom";
import DBModel, { Bike } from "../../model";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../app/main";

interface NewBikeFormProps {
  onBikeCreated: (newBike: Bike) => void;
  isOpen: boolean;
  onClose: () => void;
}

function NewBikeForm({ onBikeCreated, isOpen, onClose }: NewBikeFormProps) {
  const [formState, setFormState] = useState({
    make: "",
    model: "",
    description: "",
  });
  // const [currentStep, setCurrentStep] = useState(1);
  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prevFormState) => ({ ...prevFormState, [name]: value }));
  };

  const createBike = useMutation({
    mutationFn: (newBike: Bike) => {
      return DBModel.createBike(newBike);
    },

    onSuccess: (data: Bike) => {
      console.log("Bike created", data);
      queryClient.invalidateQueries({
        queryKey: ["bikes"],
      });
      onBikeCreated(data);
    },
    onError: (error) => {
      console.error("Error creating bike", error);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("handle submit");

    const newCustomer: Bike = {
      make: formState.make,
      model: formState.model,
      description: formState.description,
    };

    createBike.mutate(newCustomer);
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
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="modal-container"
        style={{ width: "70vw", padding: "10px" }}
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
            <h2> Bike Information</h2>
            <label>
              <TextField
                type="text"
                name="make"
                placeholder="Make:"
                value={formState.make}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </label>
            <br />
            <label style={{ minWidth: "95%" }}>
              <TextField
                type="text"
                name="model"
                placeholder="Model:"
                value={formState.model}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </label>
            <br />
            <label>
              <TextField
                type="text"
                name="description"
                placeholder="Description:"
                value={formState.description}
                onChange={handleTextFieldChange}
                fullWidth
              />
            </label>
            <br />
            <button type="submit">Submit Bike</button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default NewBikeForm;
