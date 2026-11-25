CREATE TABLE "auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"acao" text NOT NULL,
	"autor_id" text,
	"autor_nome" text,
	"autor_email" text,
	"alvo_id" text,
	"alvo_nome" text,
	"alvo_email" text,
	"detalhes" jsonb,
	"ip" text,
	"navegador" text
);
--> statement-breakpoint
CREATE INDEX "auditoria_alvo_idx" ON "auditoria" USING btree ("alvo_id","criado_em");--> statement-breakpoint
CREATE INDEX "auditoria_criado_idx" ON "auditoria" USING btree ("criado_em");