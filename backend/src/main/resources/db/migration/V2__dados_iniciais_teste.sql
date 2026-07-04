-- =====================================================================
-- V2__dados_iniciais_teste.sql
-- Dados de apoio para testar o fluxo de criação de pedidos ponta a ponta.
-- Observação: os tipos_lote (25, 50, 100) já foram inseridos na V1 —
-- nunca duplique um INSERT em duas migrations diferentes.
-- =====================================================================

INSERT INTO clientes (nome, telefone)
VALUES ('Maria Souza', '(13) 99999-0000');

INSERT INTO sabores (nome, pode_congelar, ativo)
VALUES
    ('Tradicional', TRUE, TRUE),
    ('Belga', FALSE, TRUE);

INSERT INTO insumos (nome, tipo_insumo, unidade_medida, quantidade_atual)
VALUES ('Forminha Rosa', 'FORMINHA', 'UNIDADES', 500);
