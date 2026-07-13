package com.santobrigadeiro.backend.event;

import com.santobrigadeiro.backend.entity.Insumo;

import java.math.BigDecimal;

/**
 * Evento de domínio publicado quando uma REPOSIÇÃO MANUAL de estoque é
 * feita (painel de estoque). Mesmo contrato de desacoplamento do
 * PedidoEntregueEvent: o módulo de Estoque anuncia o fato e o lado
 * financeiro reage, registrando a compra no caixa.
 *
 * Importante: o evento nasce APENAS no fluxo de reposição rápida — um
 * estorno de congelamento também é uma ENTRADA de estoque, mas não é
 * uma compra, e por isso nunca deve chegar ao caixa.
 */
public class ReposicaoEstoqueEvent {

    private final Insumo insumo;
    private final BigDecimal quantidade;

    public ReposicaoEstoqueEvent(Insumo insumo, BigDecimal quantidade) {
        this.insumo = insumo;
        this.quantidade = quantidade;
    }

    public Insumo getInsumo() {
        return insumo;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }
}
