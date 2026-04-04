type Predicate<T> = (row: T) => boolean;

export type TableName = 
  | "shadow_ledger"
  | "consent_challenges"
  | "consent_log"
  | "webauthn_credentials";

interface TableRowMap {
  shadow_ledger: Record<string, unknown>;
  consent_challenges: Record<string, unknown>;
  consent_log: Record<string, unknown>;
  webauthn_credentials: Record<string, unknown>;
}

class TableQuery<T extends Record<string, unknown>> {
  private readonly predicates: Predicate<T>[] = [];
  private mode: "select" | "delete" | null = null;

  constructor(
    private readonly client: TestSupabaseClient,
    private readonly tableName: TableName
  ) {}

  select(_columns: string): this {
    this.mode = "select";
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(column: keyof T & string, value: unknown): this {
    this.predicates.push((row) => row[column] === value);
    return this;
  }

  neq(column: keyof T & string, value: unknown): Promise<{ data: T[] }> {
    this.predicates.push((row) => row[column] !== value);
    return this.executeMany();
  }

  async single(): Promise<{ data: T | null }> {
    const rows = this.client.queryTable<T>(this.tableName, this.predicates);
    return { data: rows[0] ?? null };
  }

  async insert(row: T | T[]): Promise<{ data: T | T[] }> {
    if (Array.isArray(row)) {
      row.forEach(r => this.client.insertRow(this.tableName, r));
      return { data: row };
    }
    this.client.insertRow(this.tableName, row);
    return { data: row };
  }

  async executeMany(): Promise<{ data: T[] }> {
    if (this.mode === "delete") {
      return { data: this.client.deleteWhere<T>(this.tableName, this.predicates) };
    }

    return { data: this.client.queryTable<T>(this.tableName, this.predicates) };
  }

  async update(updates: Partial<T>): Promise<{ data: T[] }> {
    return { data: this.client.updateWhere<T>(this.tableName, this.predicates, updates) };
  }
}

export class TestSupabaseClient {
  private readonly tables: {
    [K in TableName]: TableRowMap[K][];
  } = {
    shadow_ledger: [],
    consent_challenges: [],
    consent_log: [],
    webauthn_credentials: []
  };

  from<T extends Record<string, unknown>>(tableName: TableName): TableQuery<T> {
    return new TableQuery<T>(this, tableName);
  }

  insertRow<T extends Record<string, unknown>>(tableName: TableName, row: T): void {
    this.tables[tableName].push(structuredClone(row));
  }

  queryTable<T extends Record<string, unknown>>(
    tableName: TableName,
    predicates: Predicate<T>[]
  ): T[] {
    return (this.tables[tableName] as T[])
      .filter((row) => predicates.every((predicate) => predicate(row)))
      .map((row) => structuredClone(row));
  }

  deleteWhere<T extends Record<string, unknown>>(
    tableName: TableName,
    predicates: Predicate<T>[]
  ): T[] {
    const deleted: T[] = [];
    const kept = (this.tables[tableName] as T[]).filter((row) => {
      const matches = predicates.every((predicate) => predicate(row));
      if (matches) {
        deleted.push(structuredClone(row));
      }
      return !matches;
    });

    this.tables[tableName] = kept as TableRowMap[typeof tableName][];
    return deleted;
  }

  clearTable(tableName: TableName): void {
    this.tables[tableName] = [];
  }

  updateWhere<T extends Record<string, unknown>>(
    tableName: TableName,
    predicates: Predicate<T>[],
    updates: Partial<T>
  ): T[] {
    const updated: T[] = [];
    const modified = (this.tables[tableName] as T[]).map((row) => {
      const matches = predicates.every((predicate) => predicate(row));
      if (matches) {
        const newRow = { ...row, ...updates };
        updated.push(structuredClone(newRow));
        return newRow;
      }
      return row;
    });

    this.tables[tableName] = modified as TableRowMap[typeof tableName][];
    return updated;
  }
}

export function createTestSupabaseClient(): TestSupabaseClient {
  return new TestSupabaseClient();
}
