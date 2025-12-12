import { Box, Button, Grid2, Typography } from "@mui/material";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import type { Bike, Transaction } from "../../../model";
import NewBikeForm from "../../../components/TransactionPage/BikeForm";
import Item from "../../../components/TransactionPage/HeaderItem";

interface BikeInformationProps {
  transactionData: Transaction;
  bike: Bike;
  setBike: (bike: Bike) => void;
  showBikeForm: boolean;
  setShowBikeForm: (show: boolean) => void;
  onBikeCreated: (bike: Bike) => void;
}

/**
 * BikeInformation component displays bike details and allows editing.
 * Shows bike make, model, and description if bike exists, otherwise shows "Add Bike" button.
 */
export const BikeInformation = ({
  transactionData,
  bike,
  setBike,
  showBikeForm,
  setShowBikeForm,
  onBikeCreated,
}: BikeInformationProps) => {
  const handleEditBike = () => {
    setBike({
      ...bike,
      description: transactionData.Bike?.description ?? "",
      make: transactionData.Bike?.make ?? "",
      model: transactionData.Bike?.model ?? "",
    });
    setShowBikeForm(true);
  };

  const handleBikeCreated = (createdBike: Bike) => {
    setBike(createdBike);
    setShowBikeForm(false);
    onBikeCreated(createdBike);
  };

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "text.primary",
          mb: 2,
          fontSize: { xs: "1.25rem", md: "1.5rem" },
        }}
      >
        Bike Information
      </Typography>
      <Item style={{ color: "black" }}>
        {transactionData.Bike ? (
          <Grid2 container spacing={{ xs: 1, md: 2 }}>
            <Grid2
              size={{ xs: 12, md: 2 }}
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-start" },
                margin: { xs: "10px 0", md: "30px 0" },
              }}
            >
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "gray",
                  marginLeft: { xs: 0, md: "10px" },
                }}
                onClick={handleEditBike}
              >
                <ModeEditIcon />
              </Button>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 8 }}>
              <h2 style={{ fontSize: "clamp(1.2rem, 3vw, 1.5rem)" }}>
                {transactionData.Bike.make + " " + transactionData.Bike.model}
              </h2>
              <h2 style={{ fontSize: "clamp(1.2rem, 3vw, 1.5rem)" }}>
                {transactionData.Bike.description}
              </h2>
            </Grid2>
            <Grid2
              size={{ xs: 0, md: 2 }}
              sx={{
                display: { xs: "none", md: "flex" },
                justifyContent: "flex-end",
                margin: "30px 0",
              }}
            ></Grid2>
          </Grid2>
        ) : (
          <Button
            color="primary"
            variant="contained"
            onClick={() => setShowBikeForm(true)}
          >
            Add Bike
          </Button>
        )}
      </Item>

      <NewBikeForm
        isOpen={showBikeForm}
        onClose={() => setShowBikeForm(false)}
        onBikeCreated={handleBikeCreated}
        bike={
          bike === null
            ? {
                make: "",
                model: "",
                description: "",
              }
            : bike
        }
      />
    </Box>
  );
};
