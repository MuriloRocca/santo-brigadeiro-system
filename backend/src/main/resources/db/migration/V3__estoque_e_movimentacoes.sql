-- =====================================================================
-- V3__estoque_e_movimentacoes.sql
-- Adiciona controle de estoque mínimo em insumos e cria o histórico
-- rastreável de entradas/saídas (movimentacoes_estoque).
-- =====================================================================

-- ---------------------------------------------------------------------
-- ALTERAÇÃO: insumos
-- estoque_minimo é opcional (NULL = "sem alerta configurado para este
-- insumo ainda"), não NOT NULL — muitos insumos podem não ter um
-- limite definido no dia 1, e isso não deveria bloquear o cadastro.
-- ---------------------------------------------------------------------
ALTER TABLE insumos
    ADD COLUMN estoque_minimo NUMERIC(10,3);

-- ---------------------------------------------------------------------
-- NOVA TABELA: movimentacoes_estoque
-- Histórico imutável de toda entrada/saída de insumo. Nunca é
-- atualizada ou apagada — apenas inserida (append-only), o que a torna
-- uma fonte confiável de auditoria e, futuramente, de custo (Financeiro).
-- ---------------------------------------------------------------------
CREATE TABLE movimentacoes_estoque (
    id            BIGSERIAL PRIMARY KEY,
    insumo_id     BIGINT NOT NULL REFERENCES insumos(id),
    tipo          VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    quantidade    NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
    motivo        VARCHAR(150),
    criado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ÍNDICES
-- Otimizam a consulta mais comum: "histórico de movimentações de um
-- insumo específico, do mais recente para o mais antigo".
-- ---------------------------------------------------------------------
CREATE INDEX idx_movimentacoes_insumo_id ON movimentacoes_estoque(insumo_id);
CREATE INDEX idx_movimentacoes_criado_em ON movimentacoes_estoque(criado_em);