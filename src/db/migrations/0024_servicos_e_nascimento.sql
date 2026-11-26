-- Página "Serviços" (caixas editáveis pela organização) e data de nascimento
-- opcional nos perfis de professores/DJs (uso interno, não aparece no site).
CREATE TABLE "servicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
ALTER TABLE "professores" ADD COLUMN "data_nascimento" date;--> statement-breakpoint
INSERT INTO "servicos" ("titulo", "titulo_en", "titulo_es", "texto", "texto_en", "texto_es", "ordem") VALUES
('Marketing no telão', 'Big-screen marketing', 'Marketing en la pantalla', 'Sua marca no telão durante as aulas e os bailes. Fale com a organização para saber formatos e valores.', 'Your brand on the big screen during classes and parties. Contact the organizers for formats and prices.', 'Tu marca en la pantalla durante las clases y los bailes. Habla con la organización para conocer formatos y valores.', 1),
('Expositores', 'Exhibitors', 'Expositores', 'Espaço para estandes de roupas, sapatos e acessórios de dança durante o evento.', 'Booth space for dance clothing, shoes and accessories during the event.', 'Espacio para stands de ropa, zapatos y accesorios de baile durante el evento.', 2),
('Divulgação', 'Promotion', 'Divulgación', 'Divulgue seu evento, escola ou trabalho nas redes e nos canais do LPZ.', 'Promote your event, school or work on LPZ social media and channels.', 'Divulga tu evento, escuela o trabajo en las redes y canales de LPZ.', 3),
('Parcerias', 'Partnerships', 'Alianzas', 'Escolas, marcas e eventos parceiros: vamos crescer juntos. Conte para a gente a sua proposta.', 'Schools, brands and partner events: let''s grow together. Tell us your proposal.', 'Escuelas, marcas y eventos aliados: crezcamos juntos. Cuéntanos tu propuesta.', 4),
('Paparazzi', 'Paparazzi', 'Paparazzi', 'Fotos e vídeos profissionais de você dançando no evento. Contrate na Loja.', 'Professional photos and videos of you dancing at the event. Book it in the Shop.', 'Fotos y videos profesionales de ti bailando en el evento. Contrátalo en la Tienda.', 5);
