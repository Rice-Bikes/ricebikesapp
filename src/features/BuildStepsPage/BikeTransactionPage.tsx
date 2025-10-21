import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { queryClient } from "../../app/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  ArrowBack,
  Build,
  Payment,
  MoreVert,
  Refresh,
  Delete,
  DirectionsBike,
  Check,
} from "@mui/icons-material";
import { useWorkflowSteps } from "../../hooks/useWorkflowSteps";
import { useUser } from "../../contexts/UserContext";
import { InspectionStep } from "../../components/BikeTransactionSteps/InspectionStep";
import { BuildStep } from "../../components/BikeTransactionSteps/BuildStep";
import { CheckoutStep } from "../../components/BikeTransactionSteps/CheckoutStep";
import { BikeSelectionStep } from "../../components/BikeTransactionSteps/BikeSelectionStep";
import DBModel, { Bike, UpdateTransaction } from "../../model";
import { toast } from "react-toastify";
import TransactionsLogModal from "../../components/TransactionsLogModal";

const SALES_STEPS: Array<{
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    key: "BikeSpec",
    label: "Bike Specification",
    icon: <DirectionsBike />,
    description: "Define bike specs and requirements",
  },
  {
    key: "Build",
    label: "Build & Inspect",
    icon: <Build />,
    description: "Prepare and inspect the bike",
  },
  {
    key: "Creation",
    label: "Confirmation and Safety Check",
    icon: <Check />,
    description: "Confirm state of bike and check build quality",
  },
  {
    key: "Checkout",
    label: "Checkout",
    icon: <Payment />,
    description: "Final payment and completion",
  },
];

const BikeTransactionPageContent: React.FC = () => {
  const { transaction_id } = useParams<{ transaction_id: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useUser();

  const {
    transaction,
    progress,
    steps,
    error,
    isLoadingTransaction,
    canProceedToStep,
    markStepComplete,
    markStepIncomplete,
    getCurrentStep,
    getStepByName,
    initializeWorkflow,
    isInitializing,
    resetWorkflow,
    isResettingWorkflow,
  } = useWorkflowSteps(transaction_id || "");

  // Admin controls state
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Check if current user is admin based on permissions
  const isAdmin =
    currentUser?.permissions?.some((p) =>
      p.name?.toLowerCase().includes("admin"),
    ) || false;
  const updateTransaction = useMutation({
    mutationFn: async ({
      transaction_id,
      data,
    }: {
      transaction_id: string;
      data: UpdateTransaction;
    }) => {
      await DBModel.updateTransaction(transaction_id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["transaction", transaction_id],
      });
    },
    onError: (error) => {
      toast.error(`Error occurred during mutation: ${error}`);
    },
  });
  const deleteTransaction = useMutation({
    mutationFn: async (transaction_id: string) => {
      await DBModel.deleteTransaction(transaction_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      navigate("/");
    },
    onError: (error) => {
      toast.error(`Error occurred during deletion: ${error}`);
    },
  });
  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  const handleResetWorkflow = async () => {
    try {
      await resetWorkflow();
      setResetDialogOpen(false);
      handleAdminMenuClose();
    } catch (error) {
      console.error("Error resetting workflow:", error);
    }
  };

  const handleReinitializeWorkflow = async () => {
    try {
      await resetWorkflow();
      await initializeWorkflow(currentUser?.user_id);
      handleAdminMenuClose();
    } catch (error) {
      console.error("Error reinitializing workflow:", error);
    }
  };

  // No need for manual initialization - React Query handles data fetching automatically

  const currentStep = getCurrentStep();
  const currentStepIndex = SALES_STEPS.findIndex(
    (step) => step.key === currentStep?.step_name,
  );

  const handleNext = async () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < SALES_STEPS.length && currentStep) {
      const nextStepType = SALES_STEPS[nextStepIndex].key;

      if (canProceedToStep(nextStepType)) {
        try {
          await markStepComplete(currentStep.step_id);
        } catch (error) {
          console.error("Error in markStepComplete:", error);
        }
      }
    }
  };

  const handlePrevious = async () => {
    if (currentStepIndex > 0) {
      // To go back, we need to find the most recently completed step and mark it as incomplete
      // This will make the workflow think we're on the previous step

      // Look for completed steps in reverse order (from current step backwards)
      let stepToRevert = null;

      for (let i = currentStepIndex; i >= 0; i--) {
        const stepKey = SALES_STEPS[i].key;
        const step = getStepByName(stepKey);

        if (step && step.is_completed) {
          stepToRevert = step;
          break;
        }
      }

      if (stepToRevert) {
        try {
          // Mark the completed step as incomplete to go back
          await markStepIncomplete(stepToRevert.step_id);

          // Use the correct query keys - the hook uses the numeric transaction_id from URL
          if (transaction_id) {
            // Wait a bit for the backend to process
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Invalidate queries using the numeric transaction ID (which is what the hook uses)
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["workflow", transaction_id],
              }),
              queryClient.invalidateQueries({
                queryKey: ["workflow-progress", transaction?.transaction_id],
              }),
              queryClient.invalidateQueries({
                queryKey: ["workflow-steps", transaction?.transaction_id],
              }),
            ]);
          }
        } catch (error) {
          console.error("Error reverting to previous step:", error);
        }
      }
    }
  };

  const handleStepClick = async (targetStepIndex: number) => {
    // Check if we can navigate to this step
    const targetStep = SALES_STEPS[targetStepIndex];
    const targetStepEntity = getStepByName(targetStep.key);

    if (!targetStepEntity) {
      return;
    }

    if (targetStepIndex > currentStepIndex) {
      // Can't navigate forward beyond current step
      return;
    }

    if (targetStepIndex === currentStepIndex) {
      // Already on this step, no action needed
      return;
    }

    // Navigate backwards by reverting steps AFTER the target
    if (targetStepIndex < currentStepIndex) {
      // Find all steps after the target that need to be reverted
      const stepsToRevert = [];
      for (let i = targetStepIndex + 1; i <= currentStepIndex; i++) {
        const stepToRevert = SALES_STEPS[i].key;
        const stepEntity = getStepByName(stepToRevert);

        if (stepEntity && stepEntity.is_completed) {
          stepsToRevert.push({ step: SALES_STEPS[i], entity: stepEntity });
        }
      }

      // Revert all steps after the target
      for (const { step, entity } of stepsToRevert) {
        try {
          await markStepIncomplete(entity.step_id);
        } catch (error) {
          console.error(`Error reverting step ${step.label}:`, error);
          // Continue reverting other steps even if one fails
        }
      }

      // The target step should now be the "current" step since all steps after it are incomplete
      // Force a refresh to update the UI
      if (transaction?.transaction_id) {
        // Wait a moment for the backend to process the changes
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Invalidate and refetch all workflow-related queries
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["workflow", transaction.transaction_id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["workflow-progress", transaction.transaction_id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["workflow-steps", transaction.transaction_id],
          }),
        ]);

        // Force immediate refetch
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: ["workflow", transaction.transaction_id],
          }),
          queryClient.refetchQueries({
            queryKey: ["workflow-progress", transaction.transaction_id],
          }),
          queryClient.refetchQueries({
            queryKey: ["workflow-steps", transaction.transaction_id],
          }),
        ]);
      }
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const renderStepContent = () => {
    if (error) {
      // Check if this is a workflow API error (endpoints not implemented or no workflow exists)
      const errorMessage = error?.message || "Unknown error";
      if (
        errorMessage.includes("Workflow") ||
        errorMessage.includes("endpoint not found") ||
        errorMessage.includes("HTTP 404")
      ) {
        return (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="h6" gutterBottom>
                No Workflow Found
              </Typography>
              <Typography>
                This transaction (#
                {transaction?.transaction_num || transaction_id}) doesn't have a
                bike sales workflow configured yet. Click the button below to
                initialize the standard 4-step bike sales process.
              </Typography>
            </Alert>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={async () => {
                if (!transaction?.transaction_id) {
                  return;
                }

                if (!currentUser?.user_id) {
                  return;
                }

                try {
                  await initializeWorkflow(currentUser.user_id);
                } catch (error) {
                  toast.error(
                    "Error initializing workflow:" + JSON.stringify(error),
                  );
                }
              }}
              disabled={
                isInitializing ||
                !transaction?.transaction_id ||
                !currentUser?.user_id
              }
              sx={{ px: 4, py: 2 }}
            >
              {isInitializing
                ? "Initializing Workflow..."
                : "Initialize Bike Sales Workflow"}
            </Button>
          </Box>
        );
      }

      return (
        <Alert severity="error">
          Error loading transaction: {errorMessage}
        </Alert>
      );
    }

    if (isLoadingTransaction) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Loading transaction...</Typography>
        </Box>
      );
    } else if (!transaction) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography>No transaction found.</Typography>
        </Box>
      );
    }

    if (!currentStep) {
      return <Alert severity="info">No workflow steps available</Alert>;
    }

    switch (currentStep.step_name) {
      case "BikeSpec":
        return (
          <BikeSelectionStep
            onBikeCreated={() => handleNext()}
            existingBike={transaction?.Bike as Bike | undefined}
          />
        );
      case "Build":
        return (
          <BuildStep
            onStepComplete={() => {
              handleNext();
              // eslint-disable @typescript-eslint/no-unused-vars
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                transaction_num,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                customer_id,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                bike_id,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Bike,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                OrderRequests,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Customer,
                ...rest
              } = transaction;
              updateTransaction.mutate({
                transaction_id: transaction.transaction_id,
                data: {
                  ...rest,
                  is_completed: false, // Not fully completed yet
                  is_refurb: false, // No longer in building phase
                  is_waiting_on_email: true, // Ready for inspection/email
                },
              });
              if (!currentUser || !transaction) return;
              DBModel.postTransactionLog(
                transaction.transaction_num,
                "moved to inspection",
                currentUser?.user_id,
                "completed build step",
              );
              toast.success("Bike moved to inspection phase");
            }}
          />
        );

      case "Creation":
        return (
          <InspectionStep
            onStepComplete={() => {
              handleNext();
              if (!currentUser || !transaction) return;
              DBModel.postTransactionLog(
                transaction.transaction_num,
                "safety check completed, moved to checkout",
                currentUser?.user_id,
                "completed inspection step",
              );
            }}
          />
        );

      case "Checkout":
        return (
          <CheckoutStep
            onStepComplete={() => {
              // eslint-disable @typescript-eslint/no-unused-vars
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                transaction_num,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                customer_id,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                bike_id,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Bike,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                OrderRequests,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Customer,
                ...rest
              } = transaction;
              updateTransaction.mutate({
                transaction_id: transaction.transaction_id,
                data: {
                  ...rest,
                  is_completed: true,
                  is_paid: true,
                  is_refurb: false,
                },
              });

              navigate("/");
            }}
          />
        );

      default:
        return (
          <Alert severity="error">Unknown step: {currentStep.step_name}</Alert>
        );
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mr: 2 }}>
          Back to Transactions
        </Button>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1">
            Bike Sales Transaction
          </Typography>
          {transaction && (
            <Typography variant="body2" color="text.secondary">
              Transaction #{transaction.transaction_num} •{" "}
              {(transaction.Customer?.name as string) || "Unknown Customer"}
            </Typography>
          )}
        </Box>

        {steps.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              label={`${steps.filter((s) => s.is_completed).length}/${steps.length} COMPLETED`}
              color="primary"
              variant="outlined"
            />

            {/* Admin Controls */}
            {isAdmin && (
              <>
                <IconButton
                  onClick={handleAdminMenuOpen}
                  size="small"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <MoreVert />
                </IconButton>

                <Menu
                  anchorEl={adminMenuAnchor}
                  open={Boolean(adminMenuAnchor)}
                  onClose={handleAdminMenuClose}
                >
                  <MenuItem
                    onClick={handleReinitializeWorkflow}
                    disabled={isResettingWorkflow || isInitializing}
                  >
                    <Refresh sx={{ mr: 1 }} />
                    Reset & Reinitialize Workflow
                  </MenuItem>
                  <MenuItem
                    onClick={() => setResetDialogOpen(true)}
                    disabled={isResettingWorkflow}
                  >
                    <Delete sx={{ mr: 1 }} />
                    Delete Workflow Steps
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        )}
        {transaction?.transaction_num && !error && (
          <TransactionsLogModal transaction_num={transaction.transaction_num} />
        )}
        {transaction_id && (
          <Button
            variant="contained"
            color="error"
            sx={{ ml: 1 }}
            onClick={() => {
              deleteTransaction.mutate(transaction_id);
            }}
          >
            Delete
          </Button>
        )}
      </Box>

      {/* Progress Overview */}
      {steps.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Progress Overview</Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress?.progress_percentage || 0)}% Complete
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress?.progress_percentage || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Bike Information Card */}
      {transaction?.Bike && (
        <Card sx={{ mb: 3, bgcolor: "primary.50" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <DirectionsBike />
                Bike Details
              </Typography>
              <Chip
                label={transaction.Bike.condition || "Unknown"}
                color="primary"
                size="small"
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Make & Model
                </Typography>
                <Typography variant="body1">
                  {transaction.Bike.make} {transaction.Bike.model}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Type & Size
                </Typography>
                <Typography variant="body1">
                  {transaction.Bike.bike_type} • {transaction.Bike.size_cm}cm
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  $
                  {typeof transaction.Bike.price === "number"
                    ? transaction.Bike.price.toFixed(2)
                    : parseFloat((transaction.Bike.price ?? "") || "0").toFixed(
                        2,
                      )}
                </Typography>
              </Box>
              {transaction.Bike.description && (
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {transaction.Bike.description}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step Navigation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStepIndex} alternativeLabel>
          {SALES_STEPS.map((step, index) => {
            const isCompleted = steps.some(
              (s) => s.step_name === step.key && s.is_completed,
            );
            const isCurrent = index === currentStepIndex;
            // Can click on completed steps OR the current step, but not future incomplete steps
            const isClickable = isCompleted || isCurrent;

            return (
              <Step
                key={step.key}
                completed={isCompleted}
                sx={{
                  cursor: isClickable ? "pointer" : "default",
                  "& .MuiStepLabel-root": {
                    cursor: isClickable ? "pointer" : "default",
                  },
                  "&:hover": isClickable
                    ? {
                        "& .MuiStepLabel-label": {
                          color: "primary.main",
                        },
                      }
                    : {},
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (isClickable) {
                    handleStepClick(index);
                  }
                }}
              >
                <StepLabel
                  icon={step.icon}
                  optional={
                    <Typography variant="caption">
                      {step.description}
                    </Typography>
                  }
                >
                  {step.label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ p: 3, mb: 3 }}>{renderStepContent()}</Paper>

      {/* Step Navigation Controls */}
      {steps.length > 0 && currentStep && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              {currentStepIndex > 0 && (
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{ mr: 2 }}
                >
                  Back to {SALES_STEPS[currentStepIndex - 1].label}
                </Button>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              Step {currentStepIndex + 1} of {SALES_STEPS.length}:{" "}
              {SALES_STEPS[currentStepIndex].label}
            </Typography>

            <Box>
              {currentStepIndex < SALES_STEPS.length - 1 && (
                <Alert
                  severity="info"
                  sx={{ display: "inline-flex", alignItems: "center" }}
                >
                  <Typography variant="body2">
                    Complete this step to proceed to{" "}
                    {SALES_STEPS[currentStepIndex + 1].label}
                  </Typography>
                </Alert>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Admin Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Workflow Steps</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all workflow steps for this
            transaction? This action cannot be undone. The transaction will
            remain, but all workflow progress will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResetWorkflow}
            color="error"
            disabled={isResettingWorkflow}
          >
            {isResettingWorkflow ? "Deleting..." : "Delete Workflow"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const BikeTransactionPage: React.FC = () => {
  const { transaction_id } = useParams<{ transaction_id: string }>();

  if (!transaction_id) {
    return <Alert severity="error">No transaction ID provided</Alert>;
  }

  return <BikeTransactionPageContent />;
};

export { BikeTransactionPage };
