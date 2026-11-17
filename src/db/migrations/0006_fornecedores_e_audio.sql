ALTER TYPE "public"."tipo_midia" ADD VALUE 'audio';--> statement-breakpoint
CREATE TABLE "fornecedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"categoria" text NOT NULL,
	"status" text DEFAULT 'cotacao' NOT NULL,
	"contato" text,
	"telefone" text,
	"email" text,
	"site" text,
	"valor_centavos" integer,
	"observacoes" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
