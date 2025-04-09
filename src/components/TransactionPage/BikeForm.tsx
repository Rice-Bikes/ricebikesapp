import React, { useState } from "react";
import { Button, Dialog, TextField } from "@mui/material";
// import { Link } from "react-router-dom";
import DBModel, { Bike } from "../../model";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../app/main";

interface FormBike {
  bike_id?: string | null | undefined;
  date_created?: string | null;
  make: string;
  model: string;
  description: string;
}
interface NewBikeFormProps {
  onBikeCreated: (newBike: Bike) => void;
  isOpen: boolean;
  onClose: () => void;
  bike: FormBike;
}

interface BikeFormState {
  make: string;
  model: string;
  description: string;
}

const compareBikes = (bike1: FormBike, bike2: FormBike) => {
  return bike1.bike_id === bike2.bike_id &&
    bike1.date_created === bike2.date_created &&
    bike1.make === bike2.make &&
    bike1.model === bike2.model &&
    bike1.description === bike2.description;
}

function NewBikeForm({ onBikeCreated, isOpen, onClose, bike = {
  bike_id: "",
  date_created: "",
  make: "",
  model: "",
  description: "",
} }: NewBikeFormProps) {


  const [formState, setFormState] = useState<BikeFormState>({
    make: bike.make,
    model: bike.model,
    description: bike.description,
  });

  const [currBike, setCurrBike] = useState<FormBike>(bike);
  if (!compareBikes(bike, currBike)) {
    console.log("tracking prop change", bike, currBike, bike === currBike, typeof bike, typeof currBike);
    setCurrBike(() => bike);
    setFormState(formState => ({
      ...formState,
      make: bike.make,
      model: bike.model,
      description: bike.description,
    }));
  }
  console.log(bike, formState);
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
  if (!isOpen) return null;
  return (
    <Dialog
      open={isOpen}
      fullWidth={true}
      maxWidth="lg"
      className="modal-overlay"

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
            <h2> Bike Information</h2>
            <label>
              <TextField
                type="text"
                name="make"
                placeholder="Make:"
                value={formState.make}
                onChange={handleTextFieldChange}
                fullWidth
                required
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
                required
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
                required
              />
            </label>
            <br />
            <Button type="submit" variant="contained">Submit Bike</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default NewBikeForm;
