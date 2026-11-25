ALTER TABLE "usuarios" ADD COLUMN "perfis_extras" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "pago_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "gateway_pagamento_id" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "cancelado_pelo_cliente_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "estornado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "estornado_por" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_estornado_por_usuarios_id_fk" FOREIGN KEY ("estornado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Compras já pagas: considera a data da última atualização como a do pagamento.
UPDATE "pedidos" SET "pago_em" = "atualizado_em" WHERE "status" = 'pago' AND "pago_em" IS NULL;
--> statement-breakpoint
ALTER TYPE "public"."papel_usuario" ADD VALUE 'midias';
