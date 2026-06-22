export type MobileUser = {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  department: string | null;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  registeredSince?: string | null;
  workOrderPrinterName?: string | null;
  avatarUrl?: string | null;
};

export type LoginResponse = {
  token: string;
  user: MobileUser;
};
