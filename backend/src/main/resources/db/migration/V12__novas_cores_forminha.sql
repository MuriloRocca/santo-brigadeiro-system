-- V12: novas cores de forminha para o seletor visual da Nova Encomenda
-- (Fase 11). Os nomes seguem o padrão "Forminha <Cor>" porque o frontend
-- mapeia a cor visual pela palavra-chave no nome (corDaForminha).
-- Valores consistentes com a Forminha Marrom Redonda já existente:
-- unidade UNIDADES, custo unitário 0.15 e estoque mínimo 100. O estoque
-- inicial nasce zerado — a compra real é registrada pela reposição rápida,
-- que já lança a despesa no caixa automaticamente.

INSERT INTO insumos (nome, tipo_insumo, unidade_medida, quantidade_atual, estoque_minimo, custo_unitario)
VALUES
    ('Forminha Rosa',     'FORMINHA', 'UNIDADES', 0, 100, 0.15),
    ('Forminha Dourada',  'FORMINHA', 'UNIDADES', 0, 100, 0.15),
    ('Forminha Branca',   'FORMINHA', 'UNIDADES', 0, 100, 0.15),
    ('Forminha Azul',     'FORMINHA', 'UNIDADES', 0, 100, 0.15),
    ('Forminha Verde',    'FORMINHA', 'UNIDADES', 0, 100, 0.15),
    ('Forminha Vermelha', 'FORMINHA', 'UNIDADES', 0, 100, 0.15);
