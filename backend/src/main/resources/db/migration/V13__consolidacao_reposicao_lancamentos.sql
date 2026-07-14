-- V13: consolidação diária das reposições rápidas no caixa (Fase 13).
--
-- Reposições do MESMO insumo no MESMO dia passam a somar num único
-- lançamento de COMPRA_INSUMO, em vez de poluir o extrato com uma linha
-- por clique. Para localizar o lançamento consolidável com segurança
-- (sem casar texto de descrição), o lançamento ganha o vínculo com o
-- insumo e a quantidade acumulada do dia.
--
-- Nota de domínio: esta é uma exceção DELIBERADA ao princípio
-- append-only do caixa, restrita às reposições rápidas. A auditoria
-- granular (um registro por clique) permanece em movimentacoes_estoque.

ALTER TABLE lancamentos_financeiros
    ADD COLUMN insumo_id BIGINT REFERENCES insumos (id),
    ADD COLUMN quantidade_insumo NUMERIC(10, 3);

-- Índice parcial: só as linhas de reposição têm insumo_id, e a busca de
-- consolidação é sempre por (insumo, dia).
CREATE INDEX idx_lancamentos_insumo_data
    ON lancamentos_financeiros (insumo_id, data_lancamento)
    WHERE insumo_id IS NOT NULL;
