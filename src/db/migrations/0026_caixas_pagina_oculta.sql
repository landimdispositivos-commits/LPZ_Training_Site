-- Serviços: caixa pode ter página própria (/servicos/<id>) e ficar oculta
-- (só a organização vê) até ser publicada.
ALTER TABLE "caixas_texto" ADD COLUMN "oculta" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "caixas_texto" ADD COLUMN "tem_pagina" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "caixas_texto" ADD COLUMN "detalhe" text;--> statement-breakpoint
ALTER TABLE "caixas_texto" ADD COLUMN "detalhe_en" text;--> statement-breakpoint
ALTER TABLE "caixas_texto" ADD COLUMN "detalhe_es" text;
