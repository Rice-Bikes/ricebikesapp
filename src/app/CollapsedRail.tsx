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
            top: { xs: "8px", md: 0 },
            left: { xs: "8px", md: 0 },
            height: { xs: "auto", md: "100vh" },
            width: { xs: "auto", md: "5vw" },
            bgcolor: { xs: "transparent", md: "background.paper" },
            alignItems: "center",
            justifyContent: "flex-start",
            pt: { xs: 0, md: 1.5 },
            // keep this below the Drawer when it opens
            zIndex: (theme) => theme.zIndex.drawer - 1,
            // subtle right-edge effect like your screenshot (only on desktop)
            boxShadow: { xs: "none", md: "4px 0 12px rgba(0,0,0,0.10)" },
            borderColor: "divider",
          }}
        >
          <IconButton
            aria-label="open menu"
            onClick={toggleDrawer(true)}
            size="large"
            sx={{
              color: "text.secondary",
              m: { xs: 0, md: 0.5 },
              p: { xs: 0.75, md: 1 },
              bgcolor: { xs: "background.paper", md: "transparent" },
              boxShadow: { xs: 2, md: 0 },
              borderRadius: { xs: 1, md: 0 },
              "&:hover": {
                bgcolor: { xs: "action.hover", md: "transparent" },
              },
            }}
          >
            <ReorderIcon sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }} />
          </IconButton>
        </Stack>
      )}
    </>
  );
}
