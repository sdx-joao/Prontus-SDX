export type WorkOrderSummary = {
  id: string;
  code: string;
  status: string;
  priority?: string | null;
  department?: string | null;
  requester?: string | null;
  technician?: string | null;
  createdAt?: string | null;
};
