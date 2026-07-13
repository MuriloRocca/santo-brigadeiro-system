package com.santobrigadeiro.backend.listener;

import com.santobrigadeiro.backend.event.PedidoEntregueEvent;
import com.santobrigadeiro.backend.service.LancamentoFinanceiroService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Ponte reativa Pedidos -> Financeiro. Roda de forma síncrona, na MESMA
 * transação de PedidoService.atualizarStatus: assim a entrega e a receita
 * são atômicas — ou o pedido vira ENTREGUE E o caixa recebe a entrada, ou
 * nada muda (rollback).
 *
 * Se um dia preferir que a entrega jamais falhe por causa do caixa
 * (consistência eventual), troque por:
 *   @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
 */
@Component
@RequiredArgsConstructor
public class PedidoEntregueListener {

    private final LancamentoFinanceiroService lancamentoFinanceiroService;

    @EventListener
    public void aoEntregarPedido(PedidoEntregueEvent evento) {
        lancamentoFinanceiroService.registrarReceitaDePedido(evento.getPedido());
    }
}
