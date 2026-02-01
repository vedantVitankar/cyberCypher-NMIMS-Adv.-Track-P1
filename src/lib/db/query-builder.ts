// ============================================
// SUPABASE-COMPATIBLE QUERY BUILDER FOR SQLite
// ============================================

import type Database from 'better-sqlite3';
import { getDatabase } from './index';
import { generateUUID, now, parseJSON, toJSON } from './utils';

// Types for query results
export interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
  count?: number | null;
}

export interface QueryError {
  message: string;
  code?: string;
}

// JSON fields that need parsing/stringifying
const JSON_FIELDS = new Set([
  'images', 'specifications', 'address', 'shipping_address',
  'request_body', 'response_body', 'payload', 'evidence',
  'affected_merchants', 'related_tickets', 'details', 'execution_result',
  'device_info', 'old_values', 'new_values', 'pattern_signature',
  'business_address', 'verification_documents', 'specializations',
  'ip_whitelist', 'default_shipping_address', 'default_billing_address',
  'saved_payment_methods', 'preferences'
]);

// Boolean fields that need conversion
const BOOLEAN_FIELDS = new Set([
  'is_featured', 'is_new', 'api_key_configured', 'webhook_configured',
  'stripe_connected', 'auto_classified', 'requires_approval', 'executed',
  'email_verified', 'phone_verified', 'must_change_password', 'two_factor_enabled',
  'is_valid', 'granted', 'can_manage_admins', 'can_manage_permissions',
  'can_access_billing', 'can_access_logs', 'is_available', 'active', 'success'
]);

function parseRow<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (JSON_FIELDS.has(key) && typeof value === 'string') {
      result[key] = parseJSON(value);
    } else if (BOOLEAN_FIELDS.has(key)) {
      result[key] = value === 1;
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

function prepareValue(key: string, value: unknown): unknown {
  if (value === undefined) return null;
  if (JSON_FIELDS.has(key) && value !== null && typeof value === 'object') {
    return toJSON(value);
  }
  if (BOOLEAN_FIELDS.has(key)) {
    return value ? 1 : 0;
  }
  return value;
}

interface WhereClause {
  column: string;
  operator: string;
  value: unknown;
}

interface OrderClause {
  column: string;
  ascending: boolean;
}

class QueryBuilder<T = Record<string, unknown>> {
  private db: Database.Database;
  private tableName: string;
  private selectColumns: string = '*';
  private countOption: boolean = false;
  private whereClauses: WhereClause[] = [];
  private orClauses: string[] = [];
  private orderClauses: OrderClause[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private insertData: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updateData: Record<string, unknown> | null = null;
  private isDelete: boolean = false;
  private isUpsert: boolean = false;
  private upsertConflict: string = 'id';
  private returnSingle: boolean = false;

  constructor(table: string) {
    this.db = getDatabase();
    this.tableName = table;
  }

  select(columns: string = '*', options?: { count?: 'exact' }): this {
    this.selectColumns = columns;
    if (options?.count === 'exact') {
      this.countOption = true;
    }
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this.insertData = data;
    return this;
  }

  update(data: Record<string, unknown>): this {
    this.updateData = data;
    return this;
  }

  upsert(data: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }): this {
    this.insertData = data;
    this.isUpsert = true;
    this.upsertConflict = options?.onConflict || 'id';
    return this;
  }

  delete(): this {
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.whereClauses.push({ column, operator: '=', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.whereClauses.push({ column, operator: '!=', value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.whereClauses.push({ column, operator: '>', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.whereClauses.push({ column, operator: '>=', value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.whereClauses.push({ column, operator: '<', value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.whereClauses.push({ column, operator: '<=', value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    if (values.length === 0) {
      // Empty IN clause - should return no results
      this.whereClauses.push({ column, operator: 'IN', value: null });
    } else {
      this.whereClauses.push({ column, operator: 'IN', value: values });
    }
    return this;
  }

  is(column: string, value: null): this {
    this.whereClauses.push({ column, operator: 'IS', value });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.whereClauses.push({ column, operator: 'LIKE', value: pattern });
    return this;
  }

  like(column: string, pattern: string): this {
    this.whereClauses.push({ column, operator: 'LIKE', value: pattern });
    return this;
  }

  or(conditions: string): this {
    this.orClauses.push(conditions);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderClauses.push({
      column,
      ascending: options?.ascending ?? true
    });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): this {
    this.returnSingle = true;
    this.limitValue = 1;
    return this;
  }

  private buildWhereClause(): { sql: string; params: unknown[] } {
    if (this.whereClauses.length === 0 && this.orClauses.length === 0) {
      return { sql: '', params: [] };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    for (const clause of this.whereClauses) {
      if (clause.operator === 'IS' && clause.value === null) {
        conditions.push(`${clause.column} IS NULL`);
      } else if (clause.operator === 'IN') {
        if (clause.value === null) {
          conditions.push('1 = 0'); // No results for empty IN
        } else {
          const values = clause.value as unknown[];
          const placeholders = values.map(() => '?').join(', ');
          conditions.push(`${clause.column} IN (${placeholders})`);
          params.push(...values);
        }
      } else if (clause.operator === 'LIKE') {
        conditions.push(`${clause.column} LIKE ? COLLATE NOCASE`);
        params.push(clause.value);
      } else {
        conditions.push(`${clause.column} ${clause.operator} ?`);
        params.push(prepareValue(clause.column, clause.value));
      }
    }

    // Handle OR clauses (simplified - Supabase uses a specific format)
    for (const orClause of this.orClauses) {
      // Parse Supabase-style OR conditions like "expires_at.is.null,expires_at.gt.2024-01-01"
      const parts = orClause.split(',');
      const orConditions: string[] = [];
      for (const part of parts) {
        const [col, op, val] = part.split('.');
        if (op === 'is' && val === 'null') {
          orConditions.push(`${col} IS NULL`);
        } else if (op === 'gt') {
          orConditions.push(`${col} > ?`);
          params.push(val);
        } else if (op === 'gte') {
          orConditions.push(`${col} >= ?`);
          params.push(val);
        } else if (op === 'lt') {
          orConditions.push(`${col} < ?`);
          params.push(val);
        } else if (op === 'lte') {
          orConditions.push(`${col} <= ?`);
          params.push(val);
        } else if (op === 'eq') {
          orConditions.push(`${col} = ?`);
          params.push(val);
        }
      }
      if (orConditions.length > 0) {
        conditions.push(`(${orConditions.join(' OR ')})`);
      }
    }

    return {
      sql: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  private buildOrderClause(): string {
    if (this.orderClauses.length === 0) return '';
    const orders = this.orderClauses.map(
      o => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`
    );
    return ` ORDER BY ${orders.join(', ')}`;
  }

  private buildLimitClause(): string {
    let clause = '';
    if (this.limitValue !== null) {
      clause += ` LIMIT ${this.limitValue}`;
    }
    if (this.offsetValue !== null) {
      clause += ` OFFSET ${this.offsetValue}`;
    }
    return clause;
  }

  async execute(): Promise<QueryResult<T[]>> {
    try {
      // Handle INSERT
      if (this.insertData !== null) {
        return this.executeInsert();
      }

      // Handle UPDATE
      if (this.updateData !== null) {
        return this.executeUpdate();
      }

      // Handle DELETE
      if (this.isDelete) {
        return this.executeDelete();
      }

      // Handle SELECT
      return this.executeSelect();
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SQLITE_ERROR'
        }
      };
    }
  }

  private executeSelect(): QueryResult<T[]> {
    const { sql: whereSQL, params } = this.buildWhereClause();
    const orderSQL = this.buildOrderClause();
    const limitSQL = this.buildLimitClause();

    const query = `SELECT ${this.selectColumns} FROM ${this.tableName}${whereSQL}${orderSQL}${limitSQL}`;
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Record<string, unknown>[];

    const data = rows.map(row => parseRow<T>(row));

    let count: number | null = null;
    if (this.countOption) {
      const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}${whereSQL}`;
      const countStmt = this.db.prepare(countQuery);
      const countResult = countStmt.get(...params) as { count: number };
      count = countResult.count;
    }

    if (this.returnSingle) {
      return {
        data: data[0] as unknown as T[] | null,
        error: data.length === 0 ? { message: 'Row not found', code: 'PGRST116' } : null,
        count
      };
    }

    return { data, error: null, count };
  }

  private executeInsert(): QueryResult<T[]> {
    const dataArray = Array.isArray(this.insertData) ? this.insertData : [this.insertData!];
    const results: T[] = [];

    for (const data of dataArray) {
      // Add UUID if not present
      if (!data.id) {
        data.id = generateUUID();
      }

      // Add timestamps if not present
      if (!data.created_at) {
        data.created_at = now();
      }
      if (!data.updated_at) {
        data.updated_at = now();
      }

      const columns = Object.keys(data);
      const values = columns.map(col => prepareValue(col, data[col]));
      const placeholders = columns.map(() => '?').join(', ');

      let query: string;
      if (this.isUpsert) {
        const updateCols = columns
          .filter(c => c !== this.upsertConflict)
          .map(c => `${c} = excluded.${c}`)
          .join(', ');
        query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})
                 ON CONFLICT(${this.upsertConflict}) DO UPDATE SET ${updateCols}`;
      } else {
        query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      }

      const stmt = this.db.prepare(query);
      stmt.run(...values);

      // Fetch the inserted row
      const selectStmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
      const row = selectStmt.get(data.id) as Record<string, unknown>;
      if (row) {
        results.push(parseRow<T>(row));
      }
    }

    if (this.returnSingle) {
      return {
        data: results[0] as unknown as T[] | null,
        error: null
      };
    }

    return { data: results, error: null };
  }

  private executeUpdate(): QueryResult<T[]> {
    const data = this.updateData!;

    // Add updated_at timestamp
    if (!data.updated_at) {
      data.updated_at = now();
    }

    const columns = Object.keys(data);
    const values = columns.map(col => prepareValue(col, data[col]));
    const setClauses = columns.map(col => `${col} = ?`).join(', ');

    const { sql: whereSQL, params: whereParams } = this.buildWhereClause();
    const query = `UPDATE ${this.tableName} SET ${setClauses}${whereSQL}`;

    const stmt = this.db.prepare(query);
    stmt.run(...values, ...whereParams);

    // Fetch updated rows
    const selectQuery = `SELECT * FROM ${this.tableName}${whereSQL}`;
    const selectStmt = this.db.prepare(selectQuery);
    const rows = selectStmt.all(...whereParams) as Record<string, unknown>[];
    const results = rows.map(row => parseRow<T>(row));

    if (this.returnSingle) {
      return {
        data: results[0] as unknown as T[] | null,
        error: null
      };
    }

    return { data: results, error: null };
  }

  private executeDelete(): QueryResult<T[]> {
    const { sql: whereSQL, params } = this.buildWhereClause();
    const query = `DELETE FROM ${this.tableName}${whereSQL}`;
    const stmt = this.db.prepare(query);
    stmt.run(...params);

    return { data: [] as T[], error: null };
  }

  // Convenience method to make it thenable like Supabase
  then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Auth namespace for compatibility
const auth = {
  async getUser(): Promise<{ data: { user: null }; error: null }> {
    // This will be handled by our custom auth system
    return { data: { user: null }, error: null };
  }
};

// RPC function handler
async function rpc(
  functionName: string,
  params: Record<string, unknown>
): Promise<QueryResult<unknown>> {
  // Implement custom RPC handlers here
  if (functionName === 'increment_pattern_occurrence') {
    const db = getDatabase();
    const patternId = params.pattern_id as string;
    const stmt = db.prepare(`
      UPDATE agent_patterns
      SET occurrences = occurrences + 1, last_seen_at = ?
      WHERE id = ?
    `);
    stmt.run(now(), patternId);
    return { data: null, error: null };
  }

  return {
    data: null,
    error: { message: `RPC function ${functionName} not implemented`, code: 'NOT_IMPLEMENTED' }
  };
}

// Main export - Supabase-compatible interface
export const supabase = {
  from: <T = Record<string, unknown>>(table: string) => new QueryBuilder<T>(table),
  auth,
  rpc
};

// Re-export for backward compatibility
export default supabase;
