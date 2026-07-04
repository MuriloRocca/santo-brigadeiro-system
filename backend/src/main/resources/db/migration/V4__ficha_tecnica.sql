-- =====================================================================
-- V4__ficha_tecnica.sql
-- Ficha Técnica: quanto de cada insumo é consumido por unidade
-- produzida de cada sabor. É a "receita" que conecta Pedidos (o que
-- foi vendido) a Insumos (o que precisa ser comprado/reposto).
-- =====================================================================

CREATE TABLE ficha_tecnica (
    id                        BIGSERIAL PRIMARY KEY,
    sabor_id                  BIGINT NOT NULL REFERENCES sabores(id),
    insumo_id                 BIGINT NOT NULL REFERENCES insumos(id),
    -- Precisão de 4 casas (maior que a de insumos.quantidade_atual, que
    -- usa 3): consumo por UNIDADE costuma ser um número pequeno e
    -- fracionado (ex: 0.0400 de uma caixa por doce), e arredondar demais
    -- aqui multiplicaria o erro quando aplicado em lotes de 100 unidades.
    quantidade_por_unidade    NUMERIC(10,4) NOT NULL CHECK (quantidade_por_unidade > 0),
    UNIQUE (sabor_id, insumo_id)
);

CREATE INDEX idx_ficha_tecnica_sabor_id ON ficha_tecnica(sabor_id);