import { readMigrationFiles } from "drizzle-orm/migrator";
import { Pool } from "pg";

// Aplica as migrations pendentes UMA POR VEZ, cada uma na sua própria
// transação.
//
// Por que não usar o migrate() do Drizzle: ele roda todas as pendentes numa
// transação só, e o PostgreSQL não deixa usar um valor de enum novo
// (ALTER TYPE ... ADD VALUE) na mesma transação em que ele foi criado
// ("unsafe use of new value of enum type"). Ex: 0019 cria 'camiseta' e 0020
// já insere um lote com esse tipo. No dev passa porque cada migration é
// aplicada num dia; num servidor várias versões atrás, quebrava.
//
// Usa a mesma tabela de controle do Drizzle (drizzle.__drizzle_migrations) e
// o mesmo critério (created_at < folderMillis), então é compatível com o que
// já foi aplicado e com `drizzle-kit`.
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida — copie .env.example para .env e ajuste os valores.");
  }

  const migrations = readMigrationFiles({ migrationsFolder: "./src/db/migrations" });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await pool.query(
      "CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)",
    );
    const { rows } = await pool.query<{ created_at: string }>(
      "SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1",
    );
    const ultima = rows[0] ? Number(rows[0].created_at) : 0;
    const pendentes = migrations.filter((m) => m.folderMillis > ultima);

    console.log(`Aplicando migrations... (${pendentes.length} pendente(s))`);
    for (const [i, migration] of pendentes.entries()) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const comando of migration.sql) {
          if (comando.trim()) await client.query(comando);
        }
        await client.query("INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)", [
          migration.hash,
          migration.folderMillis,
        ]);
        await client.query("COMMIT");
        console.log(`  ${i + 1}/${pendentes.length} ok`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
    console.log("Migrations aplicadas com sucesso.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Falha ao aplicar migrations:", err);
  process.exit(1);
});
