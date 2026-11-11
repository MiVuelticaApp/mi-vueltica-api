/**
 * Options for a unit of work. `readCommitted` runs the transaction in READ COMMITTED instead of the
 * default REPEATABLE READ: no gap locks and no transaction-wide snapshot. Use it when the transaction
 * locks a range of rows that other transactions insert into (moderation votes: under REPEATABLE READ,
 * votes on two different items at once deadlocked on each other's index gaps). Correctness must come
 * from row locks (`SELECT ... FOR UPDATE`), never from the snapshot.
 */
export interface TransactionOptions {
  readCommitted?: boolean;
}
