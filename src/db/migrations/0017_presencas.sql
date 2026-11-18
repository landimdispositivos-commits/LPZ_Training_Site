CREATE TABLE "presencas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"dia" text NOT NULL,
	"registrado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"registrado_por" text,
	"registrado_por_nome" text
);
--> statement-breakpoint
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_registrado_por_usuarios_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "presencas_pedido_dia_unico" ON "presencas" USING btree ("pedido_id","dia");
