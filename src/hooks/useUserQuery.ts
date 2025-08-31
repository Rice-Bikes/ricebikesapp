import { useQuery } from "@tanstack/react-query";
import DBModel, { User } from "../model";
import { queryClient } from "../app/queryClient";

export function useUserQuery(netId: string, enabled: boolean) {
  return useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: () => DBModel.fetchUser(netId),
    enabled: enabled && !!netId,
    retry: false,
  });
}

export function useCurrentUser(): User {
  return queryClient.getQueryData<User>(["user"]) || {
    user_id: "",
    username: "",
    firstname: "",
    lastname: "",
    permissions: [],
    active: true,
  };
}
