-- =====================================================================
-- V10__custo_unitario_insumos.sql
-- Fase 9.3 (Integração Estoque-Financeiro): custo estimado por unidade
-- de compra de cada insumo. É a base do gatilho que transforma uma
-- reposição rápida de estoque em um lançamento de SAIDA/COMPRA_INSUMO
-- automático no fluxo de caixa.
--
-- DEFAULT 0: insumo sem custo cadastrado NÃO gera lançamento (o caixa
-- não aceita valor zero) — a reposição continua funcionando e o custo
-- pode ser configurado depois, sem travar a cozinha.
-- =====================================================================

ALTER TABLE insumos
    ADD COLUMN custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0
        CHECK (custo_unitario >= 0);

-- ---------------------------------------------------------------------
-- Custos estimados dos insumos calibrados na V9 (defensivo: respeita
-- custo que porventura já tenha sido definido).
--   - Leite Condensado: R$ 6,50 por lata
--   - Granulado Belga Callebaut: R$ 0,09 por grama (~R$ 90/kg)
--   - Forminha Marrom Redonda: R$ 0,15 por unidade
-- ---------------------------------------------------------------------
UPDATE insumos SET custo_unitario = 6.50 WHERE nome = 'Leite Condensado' AND custo_unitario = 0;
UPDATE insumos SET custo_unitario = 0.09 WHERE nome = 'Granulado Belga Callebaut' AND custo_unitario = 0;
UPDATE insumos SET custo_unitario = 0.15 WHERE nome = 'Forminha Marrom Redonda' AND custo_unitario = 0;
