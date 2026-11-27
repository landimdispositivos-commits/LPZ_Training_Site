CREATE TABLE "bar_categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bar_categorias_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "bar_compras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"fornecedor" text,
	"observacao" text,
	"data_compra" date NOT NULL,
	"total_centavos" integer NOT NULL,
	"autor_id" text,
	"autor_nome" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bar_compras_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compra_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	"custo_unit_centavos" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bar_estoque_movimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"quantidade" integer NOT NULL,
	"custo_unit_centavos" integer,
	"motivo" text,
	"compra_id" uuid,
	"venda_id" uuid,
	"autor_id" text,
	"autor_nome" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bar_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"inicio" date,
	"fim" date,
	"em_andamento" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bar_produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"categoria_id" uuid,
	"nome" text NOT NULL,
	"unidade" text DEFAULT 'un' NOT NULL,
	"custo_centavos" integer DEFAULT 0 NOT NULL,
	"preco_centavos" integer NOT NULL,
	"estoque_minimo" integer DEFAULT 0 NOT NULL,
	"foto_url" text,
	"visivel_cardapio" boolean DEFAULT true NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bar_compras" ADD CONSTRAINT "bar_compras_evento_id_bar_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."bar_eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_compras_itens" ADD CONSTRAINT "bar_compras_itens_compra_id_bar_compras_id_fk" FOREIGN KEY ("compra_id") REFERENCES "public"."bar_compras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_compras_itens" ADD CONSTRAINT "bar_compras_itens_produto_id_bar_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."bar_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_estoque_movimentos" ADD CONSTRAINT "bar_estoque_movimentos_evento_id_bar_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."bar_eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_estoque_movimentos" ADD CONSTRAINT "bar_estoque_movimentos_produto_id_bar_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."bar_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_estoque_movimentos" ADD CONSTRAINT "bar_estoque_movimentos_compra_id_bar_compras_id_fk" FOREIGN KEY ("compra_id") REFERENCES "public"."bar_compras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_produtos" ADD CONSTRAINT "bar_produtos_evento_id_bar_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."bar_eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_produtos" ADD CONSTRAINT "bar_produtos_categoria_id_bar_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."bar_categorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bar_compras_evento_idx" ON "bar_compras" USING btree ("evento_id","data_compra");--> statement-breakpoint
CREATE INDEX "bar_mov_produto_idx" ON "bar_estoque_movimentos" USING btree ("produto_id","criado_em");--> statement-breakpoint
CREATE INDEX "bar_mov_evento_idx" ON "bar_estoque_movimentos" USING btree ("evento_id","criado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "bar_eventos_um_em_andamento" ON "bar_eventos" USING btree ("em_andamento") WHERE "bar_eventos"."em_andamento";--> statement-breakpoint
CREATE INDEX "bar_produtos_evento_idx" ON "bar_produtos" USING btree ("evento_id");