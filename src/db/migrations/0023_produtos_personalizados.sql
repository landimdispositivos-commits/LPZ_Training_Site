-- Pacotes de ingresso criados pela organização na tela de Ingressos.
-- lotes.tipo deixa de ser enum (lista fixa) e vira texto, para aceitar as chaves
-- dos pacotes novos. Os valores atuais (full_pass, camiseta...) continuam iguais.
CREATE TABLE "produtos_personalizados" (
	"chave" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"nome_en" text,
	"nome_es" text,
	"presenca" text DEFAULT 'servico' NOT NULL,
	"opcoes" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "tipo" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "tipo" SET DATA TYPE text USING "tipo"::text;--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "tipo" SET DEFAULT 'full_pass';--> statement-breakpoint
DROP TYPE "public"."tipo_produto";
