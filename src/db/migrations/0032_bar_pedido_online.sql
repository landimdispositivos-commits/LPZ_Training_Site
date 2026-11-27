CREATE TABLE "bar_pedidos_online" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"usuario_id" text NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"total_centavos" integer NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"preference_id" text,
	"checkout_url" text,
	"gateway_pagamento_id" text,
	"forma_pagamento" text,
	"parcelas" integer,
	"venda_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"pago_em" timestamp with time zone,
	"encerrado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bar_pedidos_online_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_unit_centavos" integer NOT NULL,
	"custo_unit_centavos" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bar_vendas" ALTER COLUMN "caixa_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bar_estoque_movimentos" ADD COLUMN "pedido_online_id" uuid;--> statement-breakpoint
ALTER TABLE "bar_eventos" ADD COLUMN "usa_online" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bar_pedidos_online" ADD CONSTRAINT "bar_pedidos_online_evento_id_bar_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."bar_eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_pedidos_online_itens" ADD CONSTRAINT "bar_pedidos_online_itens_pedido_id_bar_pedidos_online_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."bar_pedidos_online"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_pedidos_online_itens" ADD CONSTRAINT "bar_pedidos_online_itens_produto_id_bar_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."bar_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bar_pedidos_online_usuario_idx" ON "bar_pedidos_online" USING btree ("usuario_id","criado_em");--> statement-breakpoint
CREATE INDEX "bar_pedidos_online_status_idx" ON "bar_pedidos_online" USING btree ("evento_id","status");