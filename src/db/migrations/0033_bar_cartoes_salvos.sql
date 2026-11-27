CREATE TABLE "bar_cartoes_salvos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"gateway_cliente_id" text NOT NULL,
	"gateway_cartao_id" text NOT NULL,
	"bandeira" text NOT NULL,
	"ultimos4" text NOT NULL,
	"validade" text NOT NULL,
	"padrao" boolean DEFAULT false NOT NULL,
	"consentimento_em" timestamp with time zone DEFAULT now() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bar_cartoes_usuario_idx" ON "bar_cartoes_salvos" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bar_cartoes_um_padrao" ON "bar_cartoes_salvos" USING btree ("usuario_id") WHERE "bar_cartoes_salvos"."padrao";--> statement-breakpoint
CREATE UNIQUE INDEX "bar_cartoes_cartao_unico" ON "bar_cartoes_salvos" USING btree ("usuario_id","gateway_cartao_id");