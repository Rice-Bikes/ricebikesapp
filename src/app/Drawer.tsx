// import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BuildIcon from "@mui/icons-material/Build";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import icon114 from "../assets/img/logo-with-text.png";
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Drawer,
} from "@mui/material";
import { Box } from "@mui/system";
type NavItem = {
  text: string;
  link: string;
  icon: JSX.Element;
};
type AppDrawerProp = {
  toggleDrawer: (open: boolean) => () => void;
  open: boolean;
};
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export default function AppDrawer({ toggleDrawer, open }: AppDrawerProp) {
  const user = useUser();
  const nav = useNavigate();

  const navItems: NavItem[] = [
    { text: "All Bikes", link: "/", icon: <DirectionsBikeIcon /> },
    // { text: "Price Check", link: "/price-check", icon: <AttachMoneyIcon /> },
    { text: "Whiteboard", link: "/whiteboard", icon: <BuildIcon /> },
    { text: "Admin", link: "/admin", icon: <BuildIcon /> },
  ];

  const RiceBikesLogo = () => (
    <Box
      component="img"
      src={icon114}
      alt="Apple icon 114"
      sx={{
        height: "auto",
        width: "10vw",
        backgroundColor: "blue",
        color: "black",
        m: 2,
      }}
    />
  );

  const DrawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <RiceBikesLogo />
      <List>
        {navItems
          .filter((item) => item.text !== "admin" || user !== null)
          .map((item) => (
            <ListItem key={item.link} disablePadding>
              <ListItemButton onClick={() => nav(item.link)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Box>
  );

  return (
    <Drawer open={open} onClose={toggleDrawer(false)}>
      {DrawerList}
    </Drawer>
  );
}
