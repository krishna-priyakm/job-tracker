export type Status = "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED";

export const STATUSES: Status[] = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];

export const STATUS_LABELS: Record<Status, string> = {
  APPLIED: "Applied",
  OA: "Online Assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export type Application = {
  id: string;
  company: string;
  role: string;
  jobUrl: string | null;
  status: Status;
  salary: string | null;
  notes: string | null;
  appliedOn: string;
  followUpOn: string | null;
};

export type Stats = {
  total: number;
  byStatus: Record<string, number>;
  responseRate: number;
  perWeek: Record<string, number>;
};