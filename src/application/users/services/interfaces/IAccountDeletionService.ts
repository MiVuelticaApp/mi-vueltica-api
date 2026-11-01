export interface AccountDeletionResult {
  email: string;
  name: string;
}

export interface IAccountDeletionService {
  deleteAccount(userId: string): Promise<AccountDeletionResult>;
}