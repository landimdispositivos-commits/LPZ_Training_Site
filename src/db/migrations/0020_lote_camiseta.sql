-- Camiseta: R$ 59,99 (definido pela organização em 17/11/2026). Massagens
-- ficam sem lote ("valor em breve") até a organização definir o preço.
INSERT INTO "lotes" ("tipo", "nome", "preco_centavos", "quantidade_total", "ativo")
SELECT 'camiseta'::"tipo_produto", 'Lote único', 5999, 200, true
WHERE NOT EXISTS (SELECT 1 FROM "lotes" l WHERE l."tipo" = 'camiseta'::"tipo_produto");
