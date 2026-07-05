package com.santobrigadeiro.backend.event;

import com.santobrigadeiro.backend.entity.Pedido;

/**
 * Evento de domínio publicado quando um pedido passa para ENTREGUE.
 * É o contrato de desacoplamento entre Pedidos e Financeiro: o módulo
 * de Pedidos apenas anuncia um fato do seu próprio domínio ("este pedido
 * foi entregue"), sem saber que existe um caixa. Quem escuta e reage,
 * gerando a receita, é o lado financeiro.
 */
public class PedidoEntregueEvent {

    private final Pedido pedido;

    public PedidoEntregueEvent(Pedido pedido) {
        this.pedido = pedido;
    }

    public Pedido getPedido() {
        return pedido;
    }
}
