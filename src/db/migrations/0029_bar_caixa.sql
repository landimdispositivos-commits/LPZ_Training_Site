CREATE TABLE "bar_caixas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"operador_id" text NOT NULL,
	"operador_nome" text NOT NULL,
	"valor_inicial_centavos" integer DEFAULT 0 NOT NULL,
	"aberto_em" timestamp with time zone DEFAULT now() NOT NULL,
	"fechado_em" timestamp with time zone,
	"dinheiro_esperado_centavos" integer,
	"dinheiro_contado_centavos" integer
);
--> statement-breakpoint
CREATE TABLE "bar_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venda_id" uuid NOT NULL,
	"codigo" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"entregue_em" timestamp with time zone,
	"entregue_por_nome" text,
	CONSTRAINT "bar_tickets_venda_id_unique" UNIQUE("venda_id"),
	CONSTRAINT "bar_tickets_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "bar_vendas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"caixa_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"forma_pagamento" text NOT NULL,
	"total_centavos" integer NOT NULL,
	"custo_total_centavos" integer NOT NULL,
	"recebido_centavos" integer,
	"status" text DEFAULT 'paga' NOT NULL,
	"operador_id" text NOT NULL,
	"operador_nome" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"estornada_em" timestamp with time zone,
	"estornada_por_nome" text,
	"motivo_estorno" text
);
--> statement-breakpoint
CREATE TABLE "bar_vendas_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venda_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_unit_centavos" integer NOT NULL,
	"custo_unit_centavos" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bar_caixas" ADD CONSTRAINT "bar_caixas_evento_id_bar_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."bar_eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_tickets" ADD CONSTRAINT "bar_tickets_venda_id_bar_vendas_id_fk" FOREIGN KEY ("venda_id") REFERENCES "public"."bar_vendas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_vendas" ADD CONSTRAINT "bar_vendas_evento_id_bar_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."bar_eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_vendas" ADD CONSTRAINT "bar_vendas_caixa_id_bar_caixas_id_fk" FOREIGN KEY ("caixa_id") REFERENCES "public"."bar_caixas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_vendas_itens" ADD CONSTRAINT "bar_vendas_itens_venda_id_bar_vendas_id_fk" FOREIGN KEY ("venda_id") REFERENCES "public"."bar_vendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_vendas_itens" ADD CONSTRAINT "bar_vendas_itens_produto_id_bar_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."bar_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bar_caixas_um_aberto" ON "bar_caixas" USING btree ("evento_id","operador_id") WHERE "bar_caixas"."fechado_em" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "bar_vendas_numero_unico" ON "bar_vendas" USING btree ("evento_id","numero");--> statement-breakpoint
CREATE INDEX "bar_vendas_caixa_idx" ON "bar_vendas" USING btree ("caixa_id");