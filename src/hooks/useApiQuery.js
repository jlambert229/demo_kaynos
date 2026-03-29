import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export const queryKeys = {
  sessions: {
    all: ["sessions"],
    list: (studentId) => ["sessions", "list", studentId ?? "all"],
    detail: (id) => ["sessions", "detail", id],
  },
  classes: {
    all: ["classes"],
    list: () => ["classes", "list"],
    detail: (id) => ["classes", "detail", id],
  },
  members: {
    all: ["members"],
    list: () => ["members", "list"],
  },
  school: {
    stats: () => ["school", "stats"],
    tags: () => ["school", "tags"],
    activity: (days) => ["school", "activity", days],
  },
  video: {
    usage: () => ["video", "usage"],
  },
};

export function useSessionsList(studentId) {
  return useQuery({
    queryKey: queryKeys.sessions.list(studentId),
    queryFn: () => api.sessions.list(studentId),
  });
}

export function useSessionDetail(id) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => api.sessions.get(id),
    enabled: !!id,
  });
}

export function useClassesList() {
  return useQuery({
    queryKey: queryKeys.classes.list(),
    queryFn: () => api.classes.list(),
  });
}

export function useClassDetail(id) {
  return useQuery({
    queryKey: queryKeys.classes.detail(id),
    queryFn: () => api.classes.get(id),
    enabled: !!id,
  });
}

export function useMembersList() {
  return useQuery({
    queryKey: queryKeys.members.list(),
    queryFn: () => api.members.list(),
  });
}

export function useSchoolStats() {
  return useQuery({
    queryKey: queryKeys.school.stats(),
    queryFn: () => api.school.stats(),
  });
}

export function useSchoolTags() {
  return useQuery({
    queryKey: queryKeys.school.tags(),
    queryFn: () => api.school.tags(),
  });
}

export function useSchoolActivity(days) {
  return useQuery({
    queryKey: queryKeys.school.activity(days),
    queryFn: () => api.school.activity(days),
  });
}

export function useVideoUsage() {
  return useQuery({
    queryKey: queryKeys.video.usage(),
    queryFn: () => api.video.usage(),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.sessions.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions.all }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.classes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.classes.all }),
  });
}
