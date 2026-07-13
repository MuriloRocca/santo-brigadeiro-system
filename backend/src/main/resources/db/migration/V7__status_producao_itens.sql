-- =====================================================================
-- V7__status_producao_itens.sql
-- Fase 8 (Adiantamento/Congelamento): estado de fabricação por ITEM de
-- pedido. O grão é o item (lote de um sabor), não o pedido inteiro —
-- num mesmo pedido, o lote de Tradicional pode ser adiantado/congelado
-- enquanto o de Belga (que não congela) só pode ser feito na hora.
--
-- DEFAULT 'PENDENTE': itens já existentes continuam contando como
-- produção pendente, sem quebrar o ddl-auto=validate.
-- =====================================================================

ALTER TABLE itens_pedido
    ADD COLUMN status_producao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
        CHECK (status_producao IN ('PENDENTE', 'CONGELADO'));
