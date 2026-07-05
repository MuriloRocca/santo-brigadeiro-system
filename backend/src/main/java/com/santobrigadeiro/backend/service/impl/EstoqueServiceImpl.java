package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.MovimentacaoEstoqueRequestDTO;
import com.santobrigadeiro.backend.entity.MovimentacaoEstoque;
import com.santobrigadeiro.backend.entity.enums.TipoMovimentacao;
import com.santobrigadeiro.backend.event.ReposicaoEstoqueEvent;
import com.santobrigadeiro.backend.service.EstoqueService;
import com.santobrigadeiro.backend.service.MovimentacaoEstoqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class EstoqueServiceImpl implements EstoqueService {

    private final MovimentacaoEstoqueService movimentacaoEstoqueService;
    // Publica o fato "houve reposição" sem conhecer quem reage a ele —
    // mesmo padrão de desacoplamento do PedidoServiceImpl na entrega.
    private final ApplicationEventPublisher eventPublisher;

    /**
     * O evento é publicado AQUI, e não dentro do módulo de movimentações,
     * de propósito: nem toda ENTRADA de estoque é uma compra (o estorno de
     * congelamento, por exemplo, devolve saldo sem gastar um centavo).
     * Só a reposição manual do painel representa dinheiro saindo do caixa.
     *
     * Listener síncrono na mesma transação: reposição e lançamento de
     * compra são atômicos — ou os dois acontecem, ou nenhum.
     */
    @Override
    @Transactional
    public MovimentacaoEstoque reporRapido(Long insumoId, BigDecimal quantidade) {
        MovimentacaoEstoqueRequestDTO movimentacao = new MovimentacaoEstoqueRequestDTO();
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setMotivo("Reposição rápida pelo painel de estoque");

        MovimentacaoEstoque registrada = movimentacaoEstoqueService.registrar(insumoId, movimentacao);

        eventPublisher.publishEvent(new ReposicaoEstoqueEvent(registrada.getInsumo(), quantidade));

        return registrada;
    }
}
