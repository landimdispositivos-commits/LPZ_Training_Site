-- Caixas de texto editáveis numa tabela só (Serviços e Quem somos), com a
-- coluna "pagina". As caixas de Serviços criadas na 0024 são copiadas para cá.
CREATE TABLE "caixas_texto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pagina" text NOT NULL,
	"titulo" text NOT NULL,
	"titulo_en" text,
	"titulo_es" text,
	"texto" text DEFAULT '' NOT NULL,
	"texto_en" text,
	"texto_es" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "caixas_texto_pagina_idx" ON "caixas_texto" USING btree ("pagina","ordem");--> statement-breakpoint
INSERT INTO "caixas_texto" ("id", "pagina", "titulo", "titulo_en", "titulo_es", "texto", "texto_en", "texto_es", "ordem", "criado_em", "atualizado_em")
SELECT "id", 'servicos', "titulo", "titulo_en", "titulo_es", "texto", "texto_en", "texto_es", "ordem", "criado_em", "atualizado_em" FROM "servicos";--> statement-breakpoint
DROP TABLE "servicos";--> statement-breakpoint
INSERT INTO "caixas_texto" ("pagina", "titulo", "titulo_en", "titulo_es", "texto", "texto_en", "texto_es", "ordem") VALUES
('quem_somos', 'Nossa história', 'Our story', 'Nuestra historia', '[Como e quando o LPZ começou, quem idealizou e o que motivou a criação do evento.]', '[How and when LPZ started, who created it and what motivated the event.]', '[Cómo y cuándo empezó LPZ, quién lo creó y qué motivó el evento.]', 1),
('quem_somos', 'Nossa proposta', 'Our approach', 'Nuestra propuesta', 'O LPZ Training é um congresso de zouk que tem como foco uma linha de treinamento e prática continuada. [Detalhar a metodologia, o público e o que diferencia o evento.]', 'LPZ Training is a zouk congress focused on training and continuous practice. [Describe the method, the audience and what makes the event different.]', 'LPZ Training es un congreso de zouk enfocado en el entrenamiento y la práctica continua. [Describir la metodología, el público y lo que diferencia al evento.]', 2),
('quem_somos', 'Organização', 'Team', 'Organización', '[Nomes e papéis das pessoas da organização. Fotos só com autorização de cada pessoa.]', '[Names and roles of the organizers. Photos only with each person''s permission.]', '[Nombres y funciones de la organización. Fotos solo con autorización de cada persona.]', 3),
('quem_somos', 'Contato', 'Contact', 'Contacto', 'E-mail: lpztraining@gmail.com · WhatsApp: +55 11 94502-6344 · Instagram: @lpztrainingsp', 'Email: lpztraining@gmail.com · WhatsApp: +55 11 94502-6344 · Instagram: @lpztrainingsp', 'Correo: lpztraining@gmail.com · WhatsApp: +55 11 94502-6344 · Instagram: @lpztrainingsp', 4);
