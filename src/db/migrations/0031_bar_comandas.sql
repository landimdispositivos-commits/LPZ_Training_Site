CREATE TABLE "bar_comanda_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comanda_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_unit_centavos" integer NOT NULL,
	"custo_unit_centavos" integer NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"lancado_por_nome" text,
	"lancado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelado_por_nome" text,
	"cancelado_em" timestamp with time zone,
	"motivo_cancelamento" text
);
--> statement-breakpoint
CREATE TABLE "bar_comandas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"numero" text NOT NULL,
	"status" text DEFAULT 'aberta' NOT NULL,
	"aberta_em" timestamp with time zone DEFAULT now() NOT NULL,
	"aberta_por_nome" text,
	"paga_em" timestamp with time zone,
	"venda_id" uuid
);
--> statement-breakpoint
ALTER TABLE "bar_estoque_movimentos" ADD COLUMN "comanda_item_id" uuid;--> statement-breakpoint
ALTER TABLE "bar_eventos" ADD COLUMN "usa_caixa" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bar_eventos" ADD COLUMN "usa_comanda" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bar_vendas" ADD COLUMN "origem" text DEFAULT 'caixa' NOT NULL;--> statement-breakpoint
ALTER TABLE "bar_vendas" ADD COLUMN "comanda_id" uuid;--> statement-breakpoint
ALTER TABLE "bar_comanda_itens" ADD CONSTRAINT "bar_comanda_itens_comanda_id_bar_comandas_id_fk" FOREIGN KEY ("comanda_id") REFERENCES "public"."bar_comandas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_comanda_itens" ADD CONSTRAINT "bar_comanda_itens_produto_id_bar_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."bar_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_comandas" ADD CONSTRAINT "bar_comandas_evento_id_bar_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."bar_eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bar_comanda_itens_idx" ON "bar_comanda_itens" USING btree ("comanda_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bar_comandas_uma_aberta" ON "bar_comandas" USING btree ("evento_id","numero") WHERE "bar_comandas"."status" = 'aberta';--> statement-breakpoint
CREATE INDEX "bar_comandas_evento_idx" ON "bar_comandas" USING btree ("evento_id","status");