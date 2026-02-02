import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateQuizInput, type CheckAnswerInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useQuizzes() {
  return useQuery({
    queryKey: [api.quizzes.list.path],
    queryFn: async () => {
      const res = await fetch(api.quizzes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      return api.quizzes.list.responses[200].parse(await res.json());
    },
  });
}

export function useQuiz(id: number) {
  return useQuery({
    queryKey: [api.quizzes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.quizzes.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quiz");
      return api.quizzes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateQuizInput) => {
      const res = await fetch(api.quizzes.create.path, {
        method: api.quizzes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create quiz");
      return api.quizzes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quizzes.list.path] });
      toast({ title: "Quiz Created", description: "Your new study set is ready." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.quizzes.delete.path, { id });
      const res = await fetch(url, { method: api.quizzes.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete quiz");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quizzes.list.path] });
      toast({ title: "Quiz Deleted", description: "The study set has been removed." });
    },
  });
}

export function useCheckAnswer() {
  return useMutation({
    mutationFn: async (data: CheckAnswerInput) => {
      const res = await fetch(api.quizzes.checkAnswer.path, {
        method: api.quizzes.checkAnswer.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to check answer");
      return api.quizzes.checkAnswer.responses[200].parse(await res.json());
    },
  });
}
