import { useQuery } from "@tanstack/react-query";
import { meApi } from "../services/api";

export function useStaff() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await meApi.getMe();
      return data;
    },
    staleTime: 60_000,
  });

  return {
    isLoading,
    isError,
    isStaff: Boolean(data?.is_staff),
    me: data,
  };
}
