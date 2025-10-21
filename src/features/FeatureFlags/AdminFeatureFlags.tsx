import { useState } from "react";
import { useFeatureFlags } from "../../hooks/FeatureFlagProvider";
import { Switch, Dialog, DialogTitle, DialogContent, Stack, Typography, Button } from "@mui/material";
import { useUser } from "../../contexts/UserContext";


export function AdminFeatureFlags() {
    const {data: user} = useUser();
    const { featureFlags, switchFlag, createFlag } = useFeatureFlags();
    const [open, setOpen] = useState(false);
    const [newFlagName, setNewFlagName] = useState("");
    const [newFlagDefault, setNewFlagDefault] = useState(false);
    const [creating, setCreating] = useState(false);

    const handleCreateFlag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFlagName.trim() || !user) return;
        setCreating(true);
        try {
            await createFlag(newFlagName.trim(), newFlagDefault, user);
            setNewFlagName("");
            setNewFlagDefault(false);
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <Button variant="outlined" onClick={() => setOpen(true)}>
                Feature Flags
            </Button>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Feature Flags</DialogTitle>
                <DialogContent>
                    {/* Flag toggles */}
                    {featureFlags && Object.entries(featureFlags).map(([name]) => (
                        <Stack key={name} direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
                            <Typography>{name}</Typography>
                            <Switch
                                checked={!!featureFlags[name]}
                                onChange={(e) => switchFlag(name, e.target.checked)}
                            />
                        </Stack>
                    ))}
                    {/* Flag creation form */}
                    <form onSubmit={handleCreateFlag} style={{ marginTop: 24 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <input
                                type="text"
                                placeholder="New flag name"
                                value={newFlagName}
                                onChange={e => setNewFlagName(e.target.value)}
                                disabled={creating}
                                style={{ padding: 8, fontSize: 16 }}
                            />
                            <label>
                                Default:
                                <Switch
                                    checked={newFlagDefault}
                                    onChange={e => setNewFlagDefault(e.target.checked)}
                                    disabled={creating}
                                />
                            </label>
                            <Button type="submit" variant="contained" disabled={creating || !newFlagName.trim()}>
                                Add Flag
                            </Button>
                        </Stack>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
