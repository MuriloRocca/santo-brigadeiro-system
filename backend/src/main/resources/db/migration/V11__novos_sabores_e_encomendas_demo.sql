-- =====================================================================
-- V11__novos_sabores_e_encomendas_demo.sql
-- Carga de demonstração: dois sabores novos (Ninho com Nutella e
-- Paçoca), suas fichas técnicas, seis clientes e seis encomendas na
-- semana de 13 a 19/07/2026 — cada uma exercitando um recurso:
--   - Dona Rosa (qua): pedido pequeno do dia a dia
--   - Café TechDoce (qui): pedido MISTO de dois sabores
--   - Família do Théo (sex): Ninho (não congela) + Paçoca (congela) —
--     a sugestão de adiantamento aparece só para a Paçoca
--   - Fernanda & Tiago (sáb): o pedidão do casamento, 3 sabores
--   - Bia Formanda (sáb): engorda o pico — sábado fecha com 350 doces
--   - Camila Andrade (dom): fecha a semana
--
-- Como sempre: inserts defensivos (ON CONFLICT/WHERE NOT EXISTS);
-- preços e itens fotografados do catálogo no momento da migration,
-- como o backend faria na criação via API.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) SABORES NOVOS (nome é UNIQUE desde a V1)
-- ---------------------------------------------------------------------
INSERT INTO sabores (nome, pode_congelar, ativo, preco_unitario)
VALUES ('Ninho com Nutella', FALSE, TRUE, 4.00)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO sabores (nome, pode_congelar, ativo, preco_unitario)
VALUES ('Paçoca', TRUE, TRUE, 3.00)
ON CONFLICT (nome) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2) FICHAS TÉCNICAS dos sabores novos
--    Regra da casa: 2 latas de leite condensado rendem 50 doces de
--    qualquer sabor (0.04 lata/doce) e toda unidade usa 1 forminha.
-- ---------------------------------------------------------------------
INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 0.0400
  FROM sabores s, insumos i
 WHERE s.nome IN ('Ninho com Nutella', 'Paçoca') AND i.nome = 'Leite Condensado'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;

INSERT INTO ficha_tecnica (sabor_id, insumo_id, quantidade_por_unidade)
SELECT s.id, i.id, 1.0000
  FROM sabores s, insumos i
 WHERE s.nome IN ('Ninho com Nutella', 'Paçoca') AND i.nome = 'Forminha Marrom Redonda'
ON CONFLICT (sabor_id, insumo_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3) CLIENTES da demonstração
-- ---------------------------------------------------------------------
INSERT INTO clientes (nome, telefone)
SELECT 'Dona Rosa', '(13) 97777-1001'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Dona Rosa');

INSERT INTO clientes (nome, telefone)
SELECT 'Café TechDoce', '(13) 97777-1002'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Café TechDoce');

INSERT INTO clientes (nome, telefone)
SELECT 'Família do Théo', '(13) 97777-1003'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Família do Théo');

INSERT INTO clientes (nome, telefone)
SELECT 'Fernanda & Tiago', '(13) 97777-1004'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Fernanda & Tiago');

INSERT INTO clientes (nome, telefone)
SELECT 'Bia Formanda', '(13) 97777-1005'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Bia Formanda');

INSERT INTO clientes (nome, telefone)
SELECT 'Camila Andrade', '(13) 97777-1006'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Camila Andrade');

-- ---------------------------------------------------------------------
-- 4) ENCOMENDAS (semana 13 a 19/07/2026)
--    Padrão: CTE cria o pedido com valor_total = soma dos itens; os
--    itens entram por um VALUES(sabor, quantidade) casado com o
--    catálogo — preço fotografado por item.
-- ---------------------------------------------------------------------

-- Dona Rosa: 25 Tradicionais para quarta 15/07 (R$ 62,50)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-15', TIME '14:00', 'PENDENTE', f.id,
           25 * (SELECT preco_unitario FROM sabores WHERE nome = 'Tradicional')
      FROM clientes c, insumos f
     WHERE c.nome = 'Dona Rosa' AND f.nome = 'Forminha Marrom Redonda'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p
 CROSS JOIN (VALUES ('Tradicional', 25)) AS v(sabor_nome, qtd)
  JOIN sabores s ON s.nome = v.sabor_nome
  JOIN tipos_lote tl ON tl.quantidade = v.qtd;

-- Café TechDoce: 50 Belga + 25 Tradicional para quinta 16/07 (R$ 237,50)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-16', TIME '09:00', 'PENDENTE', f.id,
           50 * (SELECT preco_unitario FROM sabores WHERE nome = 'Belga')
         + 25 * (SELECT preco_unitario FROM sabores WHERE nome = 'Tradicional')
      FROM clientes c, insumos f
     WHERE c.nome = 'Café TechDoce' AND f.nome = 'Forminha Marrom Redonda'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p
 CROSS JOIN (VALUES ('Belga', 50), ('Tradicional', 25)) AS v(sabor_nome, qtd)
  JOIN sabores s ON s.nome = v.sabor_nome
  JOIN tipos_lote tl ON tl.quantidade = v.qtd;

-- Família do Théo: 100 Ninho + 25 Paçoca para sexta 17/07 (R$ 475,00)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-17', TIME '17:00', 'PENDENTE', f.id,
           100 * (SELECT preco_unitario FROM sabores WHERE nome = 'Ninho com Nutella')
         +  25 * (SELECT preco_unitario FROM sabores WHERE nome = 'Paçoca')
      FROM clientes c, insumos f
     WHERE c.nome = 'Família do Théo' AND f.nome = 'Forminha Marrom Redonda'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p
 CROSS JOIN (VALUES ('Ninho com Nutella', 100), ('Paçoca', 25)) AS v(sabor_nome, qtd)
  JOIN sabores s ON s.nome = v.sabor_nome
  JOIN tipos_lote tl ON tl.quantidade = v.qtd;

-- Fernanda & Tiago (casamento): 100 Trad + 100 Belga + 50 Paçoca,
-- sábado 18/07 (R$ 750,00)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-18', TIME '11:00', 'PENDENTE', f.id,
           100 * (SELECT preco_unitario FROM sabores WHERE nome = 'Tradicional')
         + 100 * (SELECT preco_unitario FROM sabores WHERE nome = 'Belga')
         +  50 * (SELECT preco_unitario FROM sabores WHERE nome = 'Paçoca')
      FROM clientes c, insumos f
     WHERE c.nome = 'Fernanda & Tiago' AND f.nome = 'Forminha Marrom Redonda'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p
 CROSS JOIN (VALUES ('Tradicional', 100), ('Belga', 100), ('Paçoca', 50)) AS v(sabor_nome, qtd)
  JOIN sabores s ON s.nome = v.sabor_nome
  JOIN tipos_lote tl ON tl.quantidade = v.qtd;

-- Bia Formanda: 100 Tradicionais também no sábado 18/07 (R$ 250,00) —
-- sábado fecha com 350 doces e vira o "dia mais pesado" da semana.
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-18', TIME '19:00', 'PENDENTE', f.id,
           100 * (SELECT preco_unitario FROM sabores WHERE nome = 'Tradicional')
      FROM clientes c, insumos f
     WHERE c.nome = 'Bia Formanda' AND f.nome = 'Forminha Marrom Redonda'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p
 CROSS JOIN (VALUES ('Tradicional', 100)) AS v(sabor_nome, qtd)
  JOIN sabores s ON s.nome = v.sabor_nome
  JOIN tipos_lote tl ON tl.quantidade = v.qtd;

-- Camila Andrade: 50 Trad + 25 Belga para domingo 19/07 (R$ 212,50)
WITH pedido AS (
    INSERT INTO pedidos (cliente_id, data_entrega, horario_entrega, status, forminha_insumo_id, valor_total)
    SELECT c.id, DATE '2026-07-19', TIME '10:00', 'PENDENTE', f.id,
           50 * (SELECT preco_unitario FROM sabores WHERE nome = 'Tradicional')
         + 25 * (SELECT preco_unitario FROM sabores WHERE nome = 'Belga')
      FROM clientes c, insumos f
     WHERE c.nome = 'Camila Andrade' AND f.nome = 'Forminha Marrom Redonda'
    RETURNING id
)
INSERT INTO itens_pedido (pedido_id, sabor_id, tipo_lote_id, preco_unitario)
SELECT p.id, s.id, tl.id, s.preco_unitario
  FROM pedido p
 CROSS JOIN (VALUES ('Tradicional', 50), ('Belga', 25)) AS v(sabor_nome, qtd)
  JOIN sabores s ON s.nome = v.sabor_nome
  JOIN tipos_lote tl ON tl.quantidade = v.qtd;
