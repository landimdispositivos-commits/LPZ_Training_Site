CREATE TABLE "configuracoes" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
