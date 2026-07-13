-- =====================================================================
-- V9__recalibracao_estoque_e_carga_pedidos.sql
-- Fase 9.2: calibra insumos/fichas técnicas com as regras reais da
-- produção e insere uma carga de encomendas de teste na semana de
-- 06/07 a 12/07/2026.
--
-- Regras de negócio aplicadas:
--   - Leite Condensado passa a ser controlado em LATAS (UNIDADES):
--     2 latas rendem 50 doces => 0.04 lata por doce, qualquer sabor.
--   - Granulado vira 'Granulado Belga Callebaut' (segue em GRAMAS):
--     Tradicional 5 g/doce (já existia), Belga 10 g/doce (novo).
--   - Forminha vira 'Forminha Marrom Redonda' (1 un./doce já na ficha).
--
-- Adaptação da carga aos LOTES PERMITIDOS (25/50/100, um lote por
-- sabor por pedido — constraints da V1): Ana 120->100, Pedro 40->50,
-- Luciana 30->25 e Carla (200) vira DOIS pedidos de 100 no sábado,
-- preservando o total do dia para o teste de "dia mais pesado".
--
-- Pedido ENTREGUE semeado por SQL não passa pelo evento de domínio do
-- backend, então a receita da Luciana é inserida aqui manualmente no
-- fluxo de caixa (mesmo formato da receita automática).
--
-- Como sempre: alterações defensivas — nomes já migrados ou preços já
-- definidos pela API são respeitados.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) LEITE CONDENSADO em latas
-- ---------------------------------------------------------------------
UPDATE insumos
   SET unidade_medida = 'UNIDADES',
       quantidade_atual = 12,
       estoque_minimo = 4
 WHERE nome = 'Leite Condensado'
   AND unidade_medida <> 'UNIDADES';

UPDATE ficha_tecnica
   SET quantidade_por_unidade = 0.0400
 WHERE insumo_id IN (SELECT id FROM insumos WHERE nome = 'Leite Condensado');

-- ---------------------------------------------------------------------
-- 2) GRANULADO BELGA CALLEBAUT
-- ---------------------------------------------------------------------
UPDATE insumos
   SET nome = 'Granulado Belga Callebaut'
 WHERE nome = 'Granulado'
   AND NOT EXISTS (SELECT 1 FROM insumos WHERE nome = 'Granulado Belga Callebaut');

INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 10.0000
  FROM sabores s, insumos i
 WHERE s.nome = 'Belga' AND i.nome = 'Granulado Belga Callebaut'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3) FORMINHA MARROM REDONDA
-- ---------------------------------------------------------------------
UPDATE insumos
   SET nome = 'Forminha Marrom Redonda'
 WHERE nome = 'Forminha Rosa'
   AND NOT EXISTS (SELECT 1 FROM insumos WHERE nome = 'Forminha Marrom Redonda');

-- ---------------------------------------------------------------------
-- 4) PREÇOS de catálogo (necessários para a carga ter valores reais;
--    preço já definido pela API é respeitado)
-- ---------------------------------------------------------------------
UPDATE sabores SET preco_unitario = 2.50 WHERE nome = 'Tradicional' AND preco_unitario = 0;
UPDATE sabores SET preco_unitario = 3.50 WHERE nome = 'Belga' AND preco_unitario = 0;

-- ---------------------------------------------------------------------
-- 5) CLIENTES da carga de testes
-- ---------------------------------------------------------------------
INSERT INTO clientes (nome, telefone)
SELECT 'João Silva', '(13) 98888-2001'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'João Silva');

INSERT INTO clientes (nome, telefone)
SELECT 'Ana Costa', '(13) 98888-2002'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Ana Costa');

INSERT INTO clientes (nome, telefone)
SELECT 'Pedro Santos', '(13) 98888-2003'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Pedro Santos');

INSERT INTO clientes (nome, telefone)
SELECT 'Carla Souza', '(13) 98888-2004'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Carla Souza');

INSERT INTO clientes (nome, telefone)
SELECT 'Luciana Dias', '(13) 98888-2005'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Luciana Dias');

-- ---------------------------------------------------------------------
-- 6) CARGA DE ENCOMENDAS (semana 06/07 a 12/07/2026)
--    O valor_total e o preço do item são "fotografados" do catálogo,
--    como o backend faria na criação via API.
-- ---------------------------------------------------------------------

-- João Silva: 50 Tradicionais para quarta (PENDENTE)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-08', TIME '15:00', 'PENDENTE', f.id, 50 * s.preco_unitario
      FROM clientes c, insumos f, sabores s
     WHERE c.nome = 'João Silva' AND f.nome = 'Forminha Marrom Redonda' AND s.nome = 'Tradicional'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p, sabores s, tipos_lote tl
 WHERE s.nome = 'Tradicional' AND tl.quantidade = 50;

-- Ana Costa: 100 Belga para quinta (EM_PRODUCAO)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-09', TIME '11:00', 'EM_PRODUCAO', f.id, 100 * s.preco_unitario
      FROM clientes c, insumos f, sabores s
     WHERE c.nome = 'Ana Costa' AND f.nome = 'Forminha Marrom Redonda' AND s.nome = 'Belga'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p, sabores s, tipos_lote tl
 WHERE s.nome = 'Belga' AND tl.quantidade = 100;

-- Pedro Santos: 50 Tradicionais para sexta (PENDENTE)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-10', TIME '17:30', 'PENDENTE', f.id, 50 * s.preco_unitario
      FROM clientes c, insumos f, sabores s
     WHERE c.nome = 'Pedro Santos' AND f.nome = 'Forminha Marrom Redonda' AND s.nome = 'Tradicional'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p, sabores s, tipos_lote tl
 WHERE s.nome = 'Tradicional' AND tl.quantidade = 50;

-- Carla Souza: 200 Tradicionais no sábado, em DOIS pedidos de 100
-- (lote máximo é 100 e um pedido não repete sabor) — o total do dia
-- fica em 200 e o sábado vira o "dia mais pesado" da Central.
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-11', TIME '10:00', 'PENDENTE', f.id, 100 * s.preco_unitario
      FROM clientes c, insumos f, sabores s
     WHERE c.nome = 'Carla Souza' AND f.nome = 'Forminha Marrom Redonda' AND s.nome = 'Tradicional'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p, sabores s, tipos_lote tl
 WHERE s.nome = 'Tradicional' AND tl.quantidade = 100;

WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-11', TIME '16:00', 'PENDENTE', f.id, 100 * s.preco_unitario
      FROM clientes c, insumos f, sabores s
     WHERE c.nome = 'Carla Souza' AND f.nome = 'Forminha Marrom Redonda' AND s.nome = 'Tradicional'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p, sabores s, tipos_lote tl
 WHERE s.nome = 'Tradicional' AND tl.quantidade = 100;

-- Luciana Dias: 25 Belga no domingo, JÁ ENTREGUE — e com a receita
-- correspondente lançada no fluxo de caixa (o que o evento de domínio
-- teria feito se a entrega tivesse acontecido pela API).
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-12', TIME '09:30', 'ENTREGUE', f.id, 25 * s.preco_unitario
      FROM clientes c, insumos f, sabores s
     WHERE c.nome = 'Luciana Dias' AND f.nome = 'Forminha Marrom Redonda' AND s.nome = 'Belga'
    RETURNING id, valor_total
), item AS (
    INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
    SELECT p.id, s.id, tl.id, s.preco_unitario
      FROM pedido p, sabores s, tipos_lote tl
     WHERE s.nome = 'Belga' AND tl.quantidade = 25
    RETURNING pedido_id
)
INSERT INTO lancamentos_financeiros (tipo, categoria, valor, descricao, data_lancamento, pedido_id)
SELECT 'ENTRADA', 'VENDA_PEDIDO', p.valor_total,
       'Receita do pedido #' || p.id || ' - Luciana Dias',
       DATE '2026-07-05', p.id
  FROM pedido p;
