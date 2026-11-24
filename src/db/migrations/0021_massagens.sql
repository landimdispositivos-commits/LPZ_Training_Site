-- Massagens (Pri Pastel e Jéssica): cada duração é um lote ativo e aparece
-- como opção na caixinha. Valores definidos pela organização em 24/11/2026.
-- Só cria se o produto ainda não tem lote (não mexe no que o Financeiro já cadastrou).
INSERT INTO "lotes" ("tipo", "nome", "preco_centavos", "quantidade_total", "ativo")
SELECT v.tipo::"tipo_produto", v.nome, v.preco, 200, true
FROM (VALUES
  ('massagem_pri', '15 minutos', 2999),
  ('massagem_pri', '30 minutos', 4999),
  ('massagem_pri', '1 hora', 7999),
  ('massagem_jessica', '15 minutos', 2999),
  ('massagem_jessica', '30 minutos', 4999),
  ('massagem_jessica', '1 hora', 7999)
) AS v(tipo, nome, preco)
WHERE NOT EXISTS (SELECT 1 FROM "lotes" l WHERE l."tipo" = v.tipo::"tipo_produto");
