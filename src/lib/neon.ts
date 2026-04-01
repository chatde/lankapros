/**
 * Neon PostgreSQL client with Supabase-like query builder API.
 * Use this for all database queries (replacing Supabase PostgREST calls).
 * Keep Supabase Auth (supabase.auth.*) for authentication.
 */
import postgres from 'postgres'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false },
  max: 10,
  connect_timeout: 10,
  transform: postgres.camel,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbResult<T = any> = { data: T | null; error: { message: string } | null }

// ── Shared WHERE condition type ────────────────────────────────────────────

type WhereCond = { column: string; op: string; value: unknown }

// ── Query Builder (SELECTs) ────────────────────────────────────────────────

class QueryBuilder<T = AnyRow> {
  private _table: string
  private _select: string = '*'
  private _where: WhereCond[] = []
  private _orWhere: WhereCond[][] = []
  private _orderBy: string = ''
  private _limitCount: number | null = null
  private _single: 'none' | 'single' | 'maybeSingle' = 'none'
  private _inFilters: { column: string; values: unknown[] }[] = []
  private _notInFilters: { column: string; values: unknown[] }[] = []

  constructor(table: string) {
    this._table = table
  }

  select(cols: string = '*'): this {
    this._select = cols
    return this
  }

  eq(column: string, value: unknown): this {
    this._where.push({ column, op: '=', value })
    return this
  }

  neq(column: string, value: unknown): this {
    this._where.push({ column, op: '!=', value })
    return this
  }

  ilike(column: string, value: string): this {
    this._where.push({ column, op: 'ILIKE', value })
    return this
  }

  in(column: string, values: unknown[]): this {
    this._inFilters.push({ column, values })
    return this
  }

  not(column: string, op: string, value: unknown): this {
    if (op === 'in') {
      this._notInFilters.push({ column, values: value as unknown[] })
    }
    return this
  }

  or(filters: string): this {
    const conds: WhereCond[] = []
    const parts = filters.split(',')
    for (const part of parts) {
      const match = part.match(/^(\w+)\.(\w+)\.(.+)$/)
      if (match) {
        const [, column, op, rawValue] = match
        const cleanVal = rawValue.replace(/^\(|\)$/g, '')
        conds.push({ column, op: op === 'eq' ? '=' : op, value: cleanVal })
      }
    }
    this._orWhere.push(conds)
    return this
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this._orderBy = opts?.ascending === false ? `${column} DESC` : column
    return this
  }

  limit(n: number): this {
    this._limitCount = n
    return this
  }

  single(): this {
    this._single = 'single'
    return this
  }

  maybeSingle(): this {
    this._single = 'maybeSingle'
    return this
  }

  // ── Mutation methods ──────────────────────────────────────────────────────

  insert(data: Record<string, unknown>): InsertBuilder<T> {
    return new InsertBuilder<T>(this._table, data)
  }

  upsert(data: Record<string, unknown>): UpsertBuilder<T> {
    return new UpsertBuilder<T>(this._table, data)
  }

  update(data: Record<string, unknown>): UpdateBuilder<T> {
    const builder = new UpdateBuilder<T>(this._table)
    builder._data = data
    builder._where = [...this._where]
    return builder
  }

  delete(): DeleteBuilder<T> {
    const builder = new DeleteBuilder<T>(this._table)
    builder._where = [...this._where]
    return builder
  }

  // ── Execute query ─────────────────────────────────────────────────────────

  then(resolve: (value: DbResult<T>) => void, _reject: unknown) {
    const vals: unknown[] = []
    let paramIdx = 1

    let query = `SELECT ${this._select} FROM ${this._table}`

    const allWheres: string[] = []

    for (const w of this._where) {
      vals.push(w.value)
      if (w.op === 'ILIKE') {
        allWheres.push(`${w.column} ILIKE $${paramIdx++}`)
      } else {
        allWheres.push(`${w.column} ${w.op} $${paramIdx++}`)
      }
    }

    for (const orGroup of this._orWhere) {
      const orClauses = orGroup.map(w => {
        vals.push(w.value)
        return `${w.column} ${w.op} $${paramIdx++}`
      })
      allWheres.push(`(${orClauses.join(' OR ')})`)
    }

    for (const f of this._inFilters) {
      vals.push(f.values)
      allWheres.push(`${f.column} = ANY($${paramIdx++})`)
    }

    for (const f of this._notInFilters) {
      vals.push(f.values)
      allWheres.push(`${f.column} != ALL($${paramIdx++})`)
    }

    if (allWheres.length > 0) {
      query += ` WHERE ${allWheres.join(' AND ')}`
    }

    if (this._orderBy) query += ` ORDER BY ${this._orderBy}`

    if (this._limitCount !== null) {
      vals.push(this._limitCount)
      query += ` LIMIT $${paramIdx++}`
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sql.unsafe(query, vals as any[]) as any)
      .then((rows: AnyRow[]) => {
        if (this._single === 'single') {
          if (rows.length === 0) {
            return resolve({ data: null, error: { message: 'No result' } as { message: string } | null })
          }
          if (rows.length > 1) {
            return resolve({ data: null, error: { message: 'More than one result' } as { message: string } | null })
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return resolve({ data: rows[0] as any as T, error: null })
        }
        if (this._single === 'maybeSingle') {
          if (rows.length === 0) {
            return resolve({ data: null, error: null })
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return resolve({ data: rows[0] as any as T, error: null })
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return resolve({ data: rows as any as T, error: null })
      })
      .catch((err: { message?: string }) => {
        return resolve({ data: null, error: { message: err.message || 'Query failed' } })
      })
  }
}

// ── Insert Builder ──────────────────────────────────────────────────────────

class InsertBuilder<T = AnyRow> {
  private _table: string
  private _data: Record<string, unknown>
  private _returning: string = '*'

  constructor(table: string, data: Record<string, unknown>) {
    this._table = table
    this._data = data
  }

  then(resolve: (value: DbResult<T>) => void, _reject: unknown) {
    const vals: unknown[] = []
    let paramIdx = 1

    const cols = Object.keys(this._data)
    const vholders = cols.map(() => `$${paramIdx++}`)
    vals.push(...Object.values(this._data))
    const query = `INSERT INTO ${this._table} (${cols.join(',')}) VALUES (${vholders.join(', ')}) RETURNING ${this._returning}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sql.unsafe(query, vals as any[]) as any)
      .then((rows: AnyRow[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve({ data: (rows[0] || rows) as any as T, error: null })
      })
      .catch((err: { message?: string }) => {
        resolve({ data: null, error: { message: err.message || 'Insert failed' } })
      })
  }
}

// ── Upsert Builder ──────────────────────────────────────────────────────────

class UpsertBuilder<T = AnyRow> {
  private _table: string
  private _data: Record<string, unknown>
  private _returning: string = '*'

  constructor(table: string, data: Record<string, unknown>) {
    this._table = table
    this._data = data
  }

  then(resolve: (value: DbResult<T>) => void, _reject: unknown) {
    const vals: unknown[] = []
    let paramIdx = 1

    const cols = Object.keys(this._data)
    const vholders = cols.map(() => `$${paramIdx++}`)
    vals.push(...Object.values(this._data))
    const updateSet = cols.map(c => `${c} = EXCLUDED.${c}`).join(', ')
    const conflictTarget = this._table === 'profiles' ? 'id' : cols[0]
    const query = `INSERT INTO ${this._table} (${cols.join(',')}) VALUES (${vholders.join(', ')}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSet} RETURNING ${this._returning}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sql.unsafe(query, vals as any[]) as any)
      .then((rows: AnyRow[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve({ data: (rows[0] || rows) as any as T, error: null })
      })
      .catch((err: { message?: string }) => {
        resolve({ data: null, error: { message: err.message || 'Upsert failed' } })
      })
  }
}

// ── Update Builder ──────────────────────────────────────────────────────────

class UpdateBuilder<T = AnyRow> {
  private _table: string
  _data: Record<string, unknown> = {}
  _where: WhereCond[] = []
  private _returning: string = '*'

  constructor(table: string) {
    this._table = table
  }

  eq(column: string, value: unknown): this {
    this._where.push({ column, op: '=', value })
    return this
  }

  then(resolve: (value: DbResult<T>) => void, _reject: unknown) {
    const vals: unknown[] = []
    let paramIdx = 1

    if (this._where.length === 0) {
      return resolve({ data: null, error: { message: 'No where clause for update' } })
    }

    const sets: string[] = []
    for (const [k, v] of Object.entries(this._data)) {
      vals.push(v)
      sets.push(`${k} = $${paramIdx++}`)
    }

    const whereClauses: string[] = []
    for (const w of this._where) {
      vals.push(w.value)
      whereClauses.push(`${w.column} = $${paramIdx++}`)
    }

    const query = `UPDATE ${this._table} SET ${sets.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING ${this._returning}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sql.unsafe(query, vals as any[]) as any)
      .then((rows: AnyRow[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve({ data: (rows[0] || rows) as any as T, error: null })
      })
      .catch((err: { message?: string }) => {
        resolve({ data: null, error: { message: err.message || 'Update failed' } })
      })
  }
}

// ── Delete Builder ──────────────────────────────────────────────────────────

class DeleteBuilder<T = AnyRow> {
  private _table: string
  _where: WhereCond[] = []
  private _returning: string = '*'

  constructor(table: string) {
    this._table = table
  }

  eq(column: string, value: unknown): this {
    this._where.push({ column, op: '=', value })
    return this
  }

  then(resolve: (value: DbResult<T>) => void, _reject: unknown) {
    const vals: unknown[] = []
    let paramIdx = 1

    if (this._where.length === 0) {
      return resolve({ data: null, error: { message: 'No where clause for delete' } })
    }

    const whereClauses: string[] = []
    for (const w of this._where) {
      vals.push(w.value)
      whereClauses.push(`${w.column} = $${paramIdx++}`)
    }

    const query = `DELETE FROM ${this._table} WHERE ${whereClauses.join(' AND ')} RETURNING ${this._returning}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sql.unsafe(query, vals as any[]) as any)
      .then((rows: AnyRow[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve({ data: rows as any as T, error: null })
      })
      .catch((err: { message?: string }) => {
        resolve({ data: null, error: { message: err.message || 'Delete failed' } })
      })
  }
}

// ── Main export ─────────────────────────────────────────────────────────────

export const db = {
  from: <T = AnyRow>(table: string) => new QueryBuilder<T>(table),
}

export { sql }
