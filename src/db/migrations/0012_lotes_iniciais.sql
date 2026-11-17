-- Valores iniciais de venda (definidos pela organização em 16/11/2026).
-- Só cria o lote de um produto que ainda NÃO tem nenhum lote: não mexe em
-- lotes já cadastrados pelo Financeiro (que é onde os valores mudam depois).
INSERT INTO "lotes" ("tipo", "nome", "preco_centavos", "quantidade_total", "ativo")
SELECT v.tipo::"tipo_produto", v.nome, v.preco, v.qtd, true
FROM (VALUES
  ('full_pass', '1º lote', 34999, 200),
  ('pacote_baile', '1º lote', 19999, 200),
  ('baile_avulso', '1º lote', 6999, 200),
  ('jack_and_jill', 'Inscrição', 6999, 200),
  ('paparazzi_video', '1º lote', 4999, 200),
  ('paparazzi_foto', '1º lote', 4999, 200)
) AS v(tipo, nome, preco, qtd)
WHERE NOT EXISTS (SELECT 1 FROM "lotes" l WHERE l."tipo" = v.tipo::"tipo_produto");
