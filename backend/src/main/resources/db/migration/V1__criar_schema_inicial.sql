-- =====================================================================
-- Santo Brigadeiro 013 - Sistema de Gestão
-- Migration: V1__criar_schema_inicial.sql
-- Escopo: Fase 1 (Painel de Encomendas) + Fase 2 (Gerenciamento de Estoque)
-- Compatível com PostgreSQL
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABELA: clientes
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    telefone        VARCHAR(20),
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- TABELA: sabores
-- ---------------------------------------------------------------------
CREATE TABLE sabores (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL UNIQUE,
    pode_congelar   BOOLEAN NOT NULL DEFAULT FALSE,
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- TABELA: tipos_lote
-- ---------------------------------------------------------------------
CREATE TABLE tipos_lote (
    id              BIGSERIAL PRIMARY KEY,
    quantidade      INTEGER NOT NULL UNIQUE CHECK (quantidade IN (25, 50, 100))
);

INSERT INTO tipos_lote (quantidade) VALUES (25), (50), (100);

-- ---------------------------------------------------------------------
-- TABELA: insumos
-- ---------------------------------------------------------------------
CREATE TABLE insumos (
    id                BIGSERIAL PRIMARY KEY,
    nome              VARCHAR(150) NOT NULL,
    tipo_insumo       VARCHAR(20) NOT NULL
                      CHECK (tipo_insumo IN ('INGREDIENTE', 'EMBALAGEM', 'FORMINHA', 'CAIXA')),
    unidade_medida    VARCHAR(10) NOT NULL
                      CHECK (unidade_medida IN ('GRAMAS', 'QUILOS', 'UNIDADES')),
    quantidade_atual  NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (quantidade_atual >= 0),
    criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- TABELA: pedidos
-- CORREÇÃO: cliente_id e forminha_insumo_id alterados para BIGINT
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
    id                    BIGSERIAL PRIMARY KEY,
    cliente_id            BIGINT NOT NULL REFERENCES clientes(id),
    data_entrega          DATE NOT NULL,
    horario_entrega       TIME NOT NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
                          CHECK (status IN ('PENDENTE', 'EM_PRODUCAO', 'ENTREGUE')),
    forminha_insumo_id    BIGINT NOT NULL REFERENCES insumos(id),
    criado_em             TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- TABELA: itens_pedido
-- ---------------------------------------------------------------------
CREATE TABLE itens_pedido (
    id              BIGSERIAL PRIMARY KEY,
    pedido_id       BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    sabor_id        BIGINT NOT NULL REFERENCES sabores(id),
    tipo_lote_id    BIGINT NOT NULL REFERENCES tipos_lote(id),
    UNIQUE (pedido_id, sabor_id)
);

-- ---------------------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------------------
CREATE INDEX idx_pedidos_data_entrega ON pedidos(data_entrega);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_sabor_id ON itens_pedido(sabor_id);
CREATE INDEX idx_insumos_tipo_insumo ON insumos(tipo_insumo);