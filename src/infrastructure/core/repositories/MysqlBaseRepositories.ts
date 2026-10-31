import mysql, { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export default class MysqlBaseRepository {
  protected pool: Pool;
  protected connection: PoolConnection | null = null;

  constructor() {
      this.pool = mysql.createPool(process.env.DATABASE_URL as string);
  }

  /**
   * Sets the connection to be used for queries.
   * Used primarily for transaction management.
   */
  setConnection(connection: PoolConnection | null): void {
    this.connection = connection;
  }

  /**
   * Gets the connection to use for queries.
   * Returns the transaction connection if set, otherwise uses the pool.
   */
  protected async getConnection(): Promise<PoolConnection | Pool> {
    return this.connection || this.pool;
  }

  /**
   * Executes a SQL query using the connection pool or transaction connection.
   *
   * @param {string} sql - The SQL query to be executed.
   * @param {any[]} [params] - Optional parameters to be used in the SQL query.
   * @returns {Promise<any>} - A promise that resolves to the rows returned by the query.
   */
   async query(sql: string, params?: any[]): Promise<any> {
    try {
      const conn = await this.getConnection();
      const [rows] = await conn.execute(sql, params || []);
      return rows;
    } catch (error: any) {
      console.error("Error executing query: ", sql, params);
      console.error("Error: ", error);
      throw new Error("500 | DB Error: " + error.message);
    }
  }

  /**
   *
   * @param {string} table - The name of the table to fetch records from.
   * @returns {Promise<any>} A promise that resolves to an array of all records in the specified table.
   * @throws {Error} Throws an error if there is an issue with the database query.
   * 
   */
  async select(fields: string[] | "*", table: string, options: { limit?: number; offset?: number } = {}): Promise<any> {
    try {
      if (fields === "*") {
        const rows = await this.query(`SELECT * FROM ${table} LIMIT ${options.limit || 100} OFFSET ${options.offset || 0}`);
        return rows;
      }

      const { limit, offset } = options;
      const rows = await this.query(`SELECT ${fields.join(", ")} FROM ${table} ${limit ? `LIMIT ${limit}` : ""} ${offset ? `OFFSET ${offset}` : ""}`);
      return rows;
    } catch (error: any) {
      console.error("Error fetching all records: ", error);
      throw new Error("500 | DB Error: " + error.message);
    }
  }

  /**
   * Finds a record in the specified table by its ID.
   *
   * @param {string} table - The name of the table to search in.
   * @param {string} fieldToSearch - The name of the field to search by.
   * @returns {Promise<any>} A promise that resolves to the found record, or null if no record is found.
   * @throws {Error} Throws an error if there is an issue with the database query.
   */
   async find(table: string, fieldToSearch: string, value: string | number): Promise<any> {
    try {
      const rows = await this.query(`SELECT * FROM ${table} WHERE ${fieldToSearch} = ?`, [value]);
      return rows[0] || null;
    } catch (error: any) {
      console.error("Error finding record: ", error);
      throw new Error("500 | DB Error: " + error.message);
    }
  }
  

  /**
   * Inserts a new record into the specified table.
   *
   * @param {string[]} fields - The fields to insert values into.
   * @param {string} table - The name of the table to insert the record into.
   * @param {any[]} values - The values to insert into the specified fields.
   * @returns {Promise<any>} - A promise that resolves to the result of the insert operation.
   * @throws {Error} - Throws an error if the insert operation fails.
   */
   async insert(fields: string[], values: any[], table: string): Promise<any> {
    try {
      const sql = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;
      const result = await this.query(sql, values);
      return result;
    } catch (error: any) {
      console.error("Error inserting into table: ", error);
      throw new Error("500 | DB Error: " + error.message);
    }
  }

  /**
   * Updates a record in the specified table with the given values.
   *
   * @param fields - An array of field names to be updated.
   * @param table - The name of the table where the record exists.
   * @param values - An array of values corresponding to the fields to be updated.
   * @param id - The ID of the record to be updated.
   * @returns A promise that resolves to the result of the update operation.
   * @throws Will throw an error if the update operation fails.
   */
   async refurbish(fields: string[], values: any[], id: string, table: string): Promise<any> {
    try {
      if (fields.length === 0) throw new Error("No fields to update");
      if (values.length === 0) throw new Error("No values to update");
      if (fields.length !== values.length) throw new Error("Fields and values length mismatch");

      const sql = `UPDATE ${table} SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`;
      const result = await this.query(sql, [...values, id]);
      return result;
    } catch (error: any) {
      console.error("Error updating table: ", error);
      throw new Error("500 | DB Error: " + error.message);
    }
  }

  /**
   * Deletes a record from the specified table by its ID.
   *
   * @param {string} table - The name of the table from which to delete the record.
   * @param {string} id - The ID of the record to delete.
   * @returns {Promise<any>} - A promise that resolves to the result of the delete operation.
   * @throws {Error} - Throws an error if the delete operation fails.
   */
   async delete(table: string, id: string | number): Promise<any> {
    try {
      const sql = `DELETE FROM ${table} WHERE id = ?`;
      const result = await this.query(sql, [id]);
      return result;
    } catch (error: any) {
      console.error("Error deleting from table: ", error);
      throw new Error("500 | DB Error: " + error.message);
    }
  }
}
