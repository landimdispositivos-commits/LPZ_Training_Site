ALTER TABLE "pedidos" ADD COLUMN "compra_id" uuid;--> statement-breakpoint
CREATE INDEX "pedidos_compra_id_idx" ON "pedidos" USING btree ("compra_id");
