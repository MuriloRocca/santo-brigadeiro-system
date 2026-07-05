-- =====================================================================
-- V6__precos_e_receita_automatica.sql
-- Fase 6: introduz preço no domínio de Pedidos/Sabores e prepara a
-- geração automática de receita no caixa quando um pedido é ENTREGUE.
--
-- Modelo de preço em duas camadas (integridade financeira):
--   - sabores.preco_unitario       -> preço de CATÁLOGO, mutável.
--   - itens_pedido.preco_unitario  -> SNAPSHOT do preço no momento da
--     venda, imutável. Se o catálogo mudar amanhã, um pedido já feito
--     não muda de valor — a receita reflete o preço praticado na venda.
--   - pedidos.valor_total          -> soma dos itens, congelada na criação.
--
-- DEFAULT 0 nas três colunas: as linhas que já existem (os sabores e
-- pedidos de teste anteriores à Fase 6) recebem 0 sem quebrar o
-- ddl-auto=validate. Preços reais são definidos via API; a regra de
-- negócio impede fechar um pedido com sabor de preço 0.
-- =====================================================================

-- ---------------------------------------------------------------------
-- ALTERAÇÃO: sabores  (preço de catálogo por unidade)
-- ---------------------------------------------------------------------
ALTER TABLE sabores
    ADD COLUMN preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0
        CHECK (preco_unitario >= 0);

-- ---------------------------------------------------------------------
-- ALTERAÇÃO: itens_pedido  (snapshot imutável do preço na venda)
-- ---------------------------------------------------------------------
ALTER TABLE itens_pedido
    ADD COLUMN preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0
        CHECK (preco_unitario >= 0);

-- ---------------------------------------------------------------------
-- ALTERAÇÃO: pedidos  (valor total congelado na criação)
-- ---------------------------------------------------------------------
ALTER TABLE pedidos
    ADD COLUMN valor_total NUMERIC(10,2) NOT NULL DEFAULT 0
        CHECK (valor_total >= 0);
