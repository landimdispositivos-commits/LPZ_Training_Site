ALTER TYPE "public"."tipo_produto" ADD VALUE 'camiseta';--> statement-breakpoint
ALTER TYPE "public"."tipo_produto" ADD VALUE 'massagem_pri';--> statement-breakpoint
ALTER TYPE "public"."tipo_produto" ADD VALUE 'massagem_jessica';
--> statement-breakpoint
-- Contatos oficiais do Fale conosco (informados pela organização em 17/11/2026).
INSERT INTO "configuracoes" ("chave", "valor") VALUES
  ('contato_email', 'lpztraining@gmail.com'),
  ('contato_whatsapp', '+55 11 94502-6344'),
  ('contato_instagram', '@lpztrainingsp')
ON CONFLICT ("chave") DO UPDATE SET "valor" = EXCLUDED."valor", "atualizado_em" = now();
