export interface ITestAccountSeeder {
  seed(userId: string): Promise<void>;
}
