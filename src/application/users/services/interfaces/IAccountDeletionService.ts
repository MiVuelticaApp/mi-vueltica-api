export interface AccountDeletionResult {
  email: string;
  name: string;
  deletedCompanyIds: string[];
  unlinkedCompanyIds: string[];
}

export interface IAccountDeletionService {
  deleteAccount(userId: string): Promise<AccountDeletionResult>;
}