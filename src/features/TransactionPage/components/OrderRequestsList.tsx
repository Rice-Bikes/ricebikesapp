import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Skeleton,
  Box,
  Chip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Part } from "../../../model";
import { MECHANIC_PART_MULTIPLIER } from "../../../constants/transaction";

interface OrderRequestsListProps {
  orderRequestData: Part[];
  isLoading: boolean;
  isEmployee: boolean;
  isBeerBike: boolean;
}

export const OrderRequestsList: React.FC<OrderRequestsListProps> = ({
  orderRequestData,
  isLoading,
  isEmployee,
  isBeerBike,
}) => {
  if (isLoading) {
    return (
      <Card elevation={2} sx={{ bgcolor: "#FFF8E1", borderRadius: 2 }}>
        <CardHeader title="Ordered Parts" />
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

  const getPartPrice = (part: Part) => {
    if (!isEmployee || isBeerBike) {
      return part.standard_price;
    }
    return part.wholesale_cost * MECHANIC_PART_MULTIPLIER;
  };

  return (
    <Card elevation={2} sx={{ bgcolor: "#FFF8E1", borderRadius: 2 }}>
      <CardHeader title="Ordered Parts" />
      <CardContent>
        {!orderRequestData || orderRequestData.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No parts ordered yet
          </Typography>
        ) : (
          <List
            sx={{
              width: "100%",
              opacity: orderRequestData.length === 0 ? 0 : 1,
            }}
          >
            {orderRequestData.map((part: Part) => (
              <ListItem
                key={part.item_id}
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
                  opacity: 0.5,
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ width: "100%" }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "warning.light",
                      color: "warning.dark",
                      width: 32,
                      height: 32,
                      fontSize: 14,
                    }}
                  >
                    {part.name?.[0]?.toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0, flexShrink: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                    >
                      {part.name}
                    </Typography>
                    {part.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {part.description}
                      </Typography>
                    )}
                    <Typography variant="body2" color="warning.main">
                      ${getPartPrice(part).toFixed(2)}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    variant="outlined"
                    label="Ordered"
                    color="warning"
                    sx={{ mr: 0.5 }}
                  />

                  <IconButton
                    disabled
                    size="small"
                    color="error"
                    aria-label="delete-ordered-part"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
