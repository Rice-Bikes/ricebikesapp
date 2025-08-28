
import { useQuery, useMutation } from "@tanstack/react-query";
import DBModel, { User } from "../model";
import { queryClient } from "../app/queryClient";
import { toast } from "react-toastify";




export function useFeatureFlags() {
    const { data: featureFlags } = useQuery(DBModel.getFeatureFlagsQuery());
    const updateFlags = useMutation({
        mutationFn: (newFlags: Record<string, boolean>) => DBModel.updateFeatureFlags(newFlags),
        onSuccess: () => {
            queryClient.invalidateQueries(DBModel.getFeatureFlagsQuery());
        },
        onError: (error: Error) => {
            toast.error("Error updating feature flags:" + error.message);
        },
    });
    const createFlagMutation = useMutation({
        mutationFn: (flag: { name: string; default: boolean, user: User }) => DBModel.addFeatureFlag(flag.name, flag.default, "Creating a flag from the frontend", flag.user),
        onSuccess: () => {
            queryClient.invalidateQueries(DBModel.getFeatureFlagsQuery());
        },
        onError: (error: Error) => {
            toast.error("Error creating feature flag:" + error.message);
        },
    });
    const switchFlag = (flag: string, value: boolean) => {
        updateFlags.mutate({ [flag]: value });
    };
    const createFlag = (name: string, def: boolean, user: User) => {
        return createFlagMutation.mutateAsync({ name, default: def, user });
    };
    return {
        featureFlags,
        switchFlag,
        createFlag
    };
}

