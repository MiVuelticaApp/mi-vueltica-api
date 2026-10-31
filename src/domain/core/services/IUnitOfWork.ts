/**
 * Interface for a database transaction unit of work.
 * Provides methods to execute operations within a transaction context.
 */
export interface IUnitOfWork {
  /**
   * Executes a callback function within a transaction.
   * If the callback succeeds, the transaction is committed.
   * If the callback throws an error, the transaction is rolled back.
   * 
   * @template T - The return type of the callback
   * @param work - Async callback function containing the work to be done in the transaction
   * @returns Promise that resolves to the result of the callback
   * @throws Re-throws any error that occurs during the transaction
   */
  execute<T>(work: () => Promise<T>): Promise<T>;
}
