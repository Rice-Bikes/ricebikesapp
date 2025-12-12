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
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ItemDetails } from "../../../model";

interface PartsListProps {
  itemDetails: ItemDetails[];
  isLoading: boolean;
  isEmployee: boolean;
  isBeerBike: boolean;
  onRemove: (transactionDetailId: string) => void;
}

export const PartsList: React.FC<PartsListProps> = ({
  itemDetails,
  isLoading,
  isEmployee,
  isBeerBike,
  onRemove,
}) => {
  if (isLoading) {
    return (
      <Card elevation={2} sx={{ bgcolor: "#E8F3FF", borderRadius: 2 }}>
        <CardHeader title="Parts" />
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

  const getPartPrice = (part: ItemDetails) => {
    if (!isEmployee || isBeerBike) {
      return part.Item.standard_price;
    }
    return part.Item.wholesale_cost * 1.25; // MECHANIC_PART_MULTIPLIER
  };

  return (
    <Card elevation={2} sx={{ bgcolor: "#E8F3FF", borderRadius: 2 }}>
      <CardHeader title="Parts" />
      <CardContent>
        {!itemDetails || itemDetails.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No parts added yet
          </Typography>
        ) : (
          <List
            sx={{
              width: "100%",
              opacity: itemDetails.length === 0 ? 0 : 1,
            }}
          >
            {itemDetails.map((part: ItemDetails) => (
              <ListItem
                key={part.transaction_detail_id}
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
                  alignItems="center"
                  spacing={2}
                  sx={{ width: "100%" }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "primary.light",
                      color: "primary.dark",
                      width: 32,
                      height: 32,
                      fontSize: 14,
                    }}
                  >
                    {part.Item.name?.[0]?.toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0, flexShrink: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 500,
                        whiteSpace: "normal",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {part.Item.name}
                    </Typography>
                    {part.Item.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        {part.Item.description}
                      </Typography>
                    )}
                    <Typography variant="body2" color="primary">
                      ${getPartPrice(part).toFixed(2)}
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onRemove(part.transaction_detail_id)}
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
