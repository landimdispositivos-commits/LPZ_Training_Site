ALTER TABLE "usuarios" ADD COLUMN "cidade" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "data_nascimento" date;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "cep" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "logradouro" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "numero" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "complemento" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "bairro" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "naturalidade_cidade" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "naturalidade_estado" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "como_conheceu" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "cadastro_completo_em" timestamp with time zone;