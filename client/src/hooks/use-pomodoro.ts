import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LogPomodoroInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
  });
}

export function usePomodoroHistory() {
  return useQuery({
    queryKey: [api.pomodoro.history.path],
    queryFn: async () => {
      const res = await fetch(api.pomodoro.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.pomodoro.history.responses[200].parse(await res.json());
    },
  });
}

export function useLogPomodoro() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LogPomodoroInput) => {
      const res = await fetch(api.pomodoro.log.path, {
        method: api.pomodoro.log.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log session");
      return api.pomodoro.log.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.pomodoro.history.path] });
      
      if (data.session.completed) {
        toast({ 
          title: "Session Completed!", 
          description: `You earned ${data.session.duration} XP. Tree growth: +${data.session.duration / 5}%` 
        });
      }
    },
  });
}
