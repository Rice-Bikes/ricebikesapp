import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  Tooltip,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Skeleton,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { RepairDetails } from "../../../model";

interface RepairsListProps {
  repairDetails: RepairDetails[];
  isLoading: boolean;
  onToggleDone: (
    transactionDetailId: string,
    status: boolean,
    repairName: string,
  ) => void;
  onRemove: (transactionDetailId: string) => void;
}

export const RepairsList: React.FC<RepairsListProps> = ({
  repairDetails,
  isLoading,
  onToggleDone,
  onRemove,
}) => {
  if (isLoading) {
    return (
      <Card elevation={2} sx={{ bgcolor: "#FFF8E1", borderRadius: 2 }}>
        <CardHeader title="Repairs" />
        <CardContent>
          <Stack spacing={1}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ bgcolor: "#FFF8E1", borderRadius: 2 }}>
      <CardHeader title="Repairs" />
      <CardContent>
        {!repairDetails || repairDetails.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No repairs added yet
          </Typography>
        ) : (
          <List
            sx={{
              width: "100%",
              opacity: repairDetails.length === 0 ? 0 : 1,
            }}
          >
            {repairDetails.map((transactionDetail: RepairDetails) => (
              <Tooltip
                key={transactionDetail.transaction_detail_id}
                title={transactionDetail.Repair.description}
                placement="top-start"
              >
                <ListItem
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    transition: "all .15s ease-in-out",
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ width: "100%" }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: transactionDetail.completed
                          ? "success.main"
                          : "grey.300",
                        color: transactionDetail.completed
                          ? "white"
                          : "grey.600",
                      }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
                    </Avatar>

                    <Stack
                      spacing={0.25}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        flexShrink: 1,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        {transactionDetail.Repair.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        ${transactionDetail.Repair.price.toFixed(2)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Toggle completion">
                        <IconButton
                          size="small"
                          onClick={() =>
                            onToggleDone(
                              transactionDetail.transaction_detail_id,
                              !transactionDetail.completed,
                              transactionDetail.Repair.name,
                            )
                          }
                          sx={{
                            color: transactionDetail.completed
                              ? "success.main"
                              : "grey.500",
                          }}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove repair">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            onRemove(transactionDetail.transaction_detail_id)
                          }
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </ListItem>
              </Tooltip>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
