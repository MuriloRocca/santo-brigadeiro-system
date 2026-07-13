package com.santobrigadeiro.backend.entity.enums;

/**
 * Estado de fabricação de um item (lote) de pedido.
 * CONGELADO = produzido antecipadamente e congelado; sai da lista de
 * esforço pendente da Central de Produção. Só é permitido para itens
 * cujo sabor tem podeCongelar = true (regra verificada no service).
 */
public enum StatusProducaoItem {
    PENDENTE,
    CONGELADO
}
