import { Stack, IconButton } from "@mui/material";
import ReorderIcon from "@mui/icons-material/Reorder";

type Props = {
  open: boolean;
  toggleDrawer: (open: boolean) => () => void;
};

export function CollapsedRail({ open, toggleDrawer }: Props) {
  return (
    <>
      {/* Collapsed rail visible when Drawer is closed */}
      {!open && (
        <Stack
          // fixed left rail
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "5vw", // use a fixed width for a crisp rail
            bgcolor: "background.paper",
            alignItems: "center",
            justifyContent: "flex-start",
            pt: 1.5,
            // keep this below the Drawer when it opens
            zIndex: (theme) => theme.zIndex.drawer - 1,
            // subtle right-edge effect like your screenshot
            boxShadow: "4px 0 12px rgba(0,0,0,0.10)",
            // optional: extra inner fade on the right edge
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "10px",
              pointerEvents: "none",
              background:
                "linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0))",
            },
            borderRight: "1px solid",
            borderColor: "divider",
          }}
        >
          <IconButton
            aria-label="open menu"
            onClick={toggleDrawer(true)}
            size="large"
            sx={{
              color: "text.secondary",
              // reduce default icon button padding to match the screenshot spacing
              m: 0.5,
            }}
          >
            <ReorderIcon />
          </IconButton>
        </Stack>
      )}
    </>
  );
}
