CREATE TABLE "bar_receitas_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"insumo_id" uuid NOT NULL,
	"quantidade" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bar_produtos" ADD COLUMN "a_venda" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bar_produtos" ADD COLUMN "usa_ficha" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bar_receitas_itens" ADD CONSTRAINT "bar_receitas_itens_produto_id_bar_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."bar_produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_receitas_itens" ADD CONSTRAINT "bar_receitas_itens_insumo_id_bar_produtos_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."bar_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bar_receitas_unico" ON "bar_receitas_itens" USING btree ("produto_id","insumo_id");