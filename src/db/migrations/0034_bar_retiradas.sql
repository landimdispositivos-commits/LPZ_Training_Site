CREATE TABLE "bar_retiradas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"venda_item_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	"entregue_por_id" text,
	"entregue_por_nome" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bar_retiradas" ADD CONSTRAINT "bar_retiradas_ticket_id_bar_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."bar_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bar_retiradas" ADD CONSTRAINT "bar_retiradas_venda_item_id_bar_vendas_itens_id_fk" FOREIGN KEY ("venda_item_id") REFERENCES "public"."bar_vendas_itens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bar_retiradas_ticket_idx" ON "bar_retiradas" USING btree ("ticket_id","criado_em");