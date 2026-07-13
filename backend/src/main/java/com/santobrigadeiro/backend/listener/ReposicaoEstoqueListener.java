package com.santobrigadeiro.backend.listener;

import com.santobrigadeiro.backend.event.ReposicaoEstoqueEvent;
import com.santobrigadeiro.backend.service.LancamentoFinanceiroService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Ponte reativa Estoque -> Financeiro: toda reposição manual vira uma
 * despesa de compra de insumo no caixa, com custo estimado pelo
 * catálogo. Síncrono e na mesma transação da reposição (atômico),
 * como o PedidoEntregueListener.
 */
@Component
@RequiredArgsConstructor
public class ReposicaoEstoqueListener {

    private final LancamentoFinanceiroService lancamentoFinanceiroService;

    @EventListener
    public void aoReporEstoque(ReposicaoEstoqueEvent evento) {
        lancamentoFinanceiroService.registrarCompraDeInsumo(evento.getInsumo(), evento.getQuantidade());
    }
}
