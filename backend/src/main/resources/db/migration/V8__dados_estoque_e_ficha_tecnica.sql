-- =====================================================================
-- V8__dados_estoque_e_ficha_tecnica.sql
-- Fase 9 (Estoque Inteligente): NENHUMA tabela nova é criada aqui de
-- propósito. As estruturas pedidas já existem desde o início:
--   - "insumo"        -> insumos (V1) + estoque_minimo (V3)
--   - "receita_insumo"-> ficha_tecnica (V4: sabor_id, insumo_id,
--                        quantidade_por_unidade)
-- Criar duplicatas geraria duas fontes de verdade para o mesmo saldo.
--
-- Esta migration apenas SEMEIA dados de trabalho (insumos de cozinha e
-- fichas técnicas dos sabores existentes) para o gatilho de baixa por
-- congelamento ser observável de ponta a ponta. Todos os INSERTs são
-- defensivos (WHERE NOT EXISTS / ON CONFLICT): se o usuário já cadastrou
-- algo igual pela API, a migration não duplica nem falha.
-- =====================================================================

-- ---------------------------------------------------------------------
-- INSUMOS de cozinha (quantidades em GRAMAS; forminhas em UNIDADES)
-- ---------------------------------------------------------------------
INSERT INTO insumos (nome, tipo_insumo, unidade_medida, quantidade_atual, estoque_minimo)
SELECT 'Leite Condensado', 'INGREDIENTE', 'GRAMAS', 5000, 1500
WHERE NOT EXISTS (SELECT 1 FROM insumos WHERE nome = 'Leite Condensado');

INSERT INTO insumos (nome, tipo_insumo, unidade_medida, quantidade_atual, estoque_minimo)
SELECT 'Granulado', 'INGREDIENTE', 'GRAMAS', 2000, 800
WHERE NOT EXISTS (SELECT 1 FROM insumos WHERE nome = 'Granulado');

-- A Forminha Rosa existe desde a V2, mas sem alerta configurado.
UPDATE insumos
   SET estoque_minimo = 100
 WHERE nome = 'Forminha Rosa'
   AND estoque_minimo IS NULL;

-- ---------------------------------------------------------------------
-- FICHA TÉCNICA (consumo por doce) dos sabores semeados na V2.
-- ON CONFLICT usa a UNIQUE(sabor_id, insumo_id) da V4: se a receita já
-- foi cadastrada pela API, a linha existente é preservada.
-- ---------------------------------------------------------------------
INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 20.0000
  FROM sabores s, insumos i
 WHERE s.nome = 'Tradicional' AND i.nome = 'Leite Condensado'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;

INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 5.0000
  FROM sabores s, insumos i
 WHERE s.nome = 'Tradicional' AND i.nome = 'Granulado'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;

INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 1.0000
  FROM sabores s, insumos i
 WHERE s.nome = 'Tradicional' AND i.nome = 'Forminha Rosa'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;

INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 18.0000
  FROM sabores s, insumos i
 WHERE s.nome = 'Belga' AND i.nome = 'Leite Condensado'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;

INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 1.0000
  FROM sabores s, insumos i
 WHERE s.nome = 'Belga' AND i.nome = 'Forminha Rosa'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;
