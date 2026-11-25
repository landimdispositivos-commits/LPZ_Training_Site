ALTER TABLE "professores" ADD COLUMN "bio_en" text;--> statement-breakpoint
ALTER TABLE "professores" ADD COLUMN "categoria" text DEFAULT 'professor' NOT NULL;--> statement-breakpoint
-- 10 caixinhas de casais de professores e 10 de DJs, para a organização
-- preencher pelo próprio site (canetinha). Completa só o que faltar para 10.
INSERT INTO "professores" ("nome", "categoria", "ordem")
SELECT 'Casal de professores ' || n, 'professor', n
FROM generate_series((SELECT count(*) FROM "professores" WHERE "categoria" = 'professor') + 1, 10) AS n;--> statement-breakpoint
INSERT INTO "professores" ("nome", "categoria", "ordem")
SELECT 'DJ ' || n, 'dj', n
FROM generate_series((SELECT count(*) FROM "professores" WHERE "categoria" = 'dj') + 1, 10) AS n;
