-- =====================================================================
-- V5__financeiro_fluxo_caixa.sql
-- Módulo Financeiro (Fluxo de Caixa): livro-caixa append-only de
-- lançamentos de ENTRADA (receitas, ex: pagamento de pedido) e SAIDA
-- (despesas, ex: compra de insumos).
--
-- Assim como movimentacoes_estoque, esta tabela é IMUTÁVEL: nunca se
-- atualiza ou apaga um lançamento — um erro é corrigido com um novo
-- lançamento de ajuste, preservando a verdade histórica do caixa.
--
-- Decisão de desacoplamento: hoje nenhum Pedido possui valor monetário,
-- então o caixa NÃO deriva receita automaticamente de pedidos. A coluna
-- pedido_id é apenas um vínculo OPCIONAL de rastreabilidade ("de qual
-- pedido veio esta entrada"), nullable e ON DELETE SET NULL — o módulo
-- de Pedidos não conhece nem depende do Financeiro.
-- =====================================================================

-- ---------------------------------------------------------------------
-- NOVA TABELA: lancamentos_financeiros
-- valor em NUMERIC(10,2): padrão monetário (o projeto usa 3 casas para
-- quantidade de insumo; dinheiro trabalha com 2). Sempre > 0 — o sinal
-- (entra/sai) é dado pela coluna 'tipo', não pelo valor.
--
-- data_lancamento (DATE) é separada de criado_em (TIMESTAMP) de
-- propósito: a competência de caixa pode ser retroativa (lancei hoje
-- uma compra que ocorreu ontem), enquanto criado_em é o registro
-- auditável de quando a linha entrou no sistema.
-- ---------------------------------------------------------------------
CREATE TABLE lancamentos_financeiros (
    id                BIGSERIAL PRIMARY KEY,
    tipo              VARCHAR(10) NOT NULL
                      CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    categoria         VARCHAR(30) NOT NULL
                      CHECK (categoria IN (
                          'VENDA_PEDIDO', 'OUTRA_RECEITA',
                          'COMPRA_INSUMO', 'DESPESA_OPERACIONAL', 'OUTRA_DESPESA'
                      )),
    valor             NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    descricao         VARCHAR(200) NOT NULL,
    data_lancamento   DATE NOT NULL,
    -- Vínculo opcional e fraco com o pedido de origem (só rastreabilidade).
    pedido_id         BIGINT REFERENCES pedidos(id) ON DELETE SET NULL,
    criado_em         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ÍNDICES
-- A consulta central do módulo é o extrato/resumo por período; os
-- demais índices apoiam filtros por tipo e o join opcional com pedido.
-- ---------------------------------------------------------------------
CREATE INDEX idx_lancamentos_data_lancamento ON lancamentos_financeiros(data_lancamento);
CREATE INDEX idx_lancamentos_tipo            ON lancamentos_financeiros(tipo);
CREATE INDEX idx_lancamentos_pedido_id       ON lancamentos_financeiros(pedido_id);
