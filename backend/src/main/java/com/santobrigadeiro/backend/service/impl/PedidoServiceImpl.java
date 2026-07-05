package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.ItemPedidoRequestDTO;
import com.santobrigadeiro.backend.dto.PedidoRequestDTO;
import com.santobrigadeiro.backend.entity.*;
import com.santobrigadeiro.backend.entity.enums.StatusPedido;
import com.santobrigadeiro.backend.event.PedidoEntregueEvent;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.*;
import com.santobrigadeiro.backend.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final SaborRepository saborRepository;
    private final TipoLoteRepository tipoLoteRepository;
    private final InsumoRepository insumoRepository;
    // Publica eventos de domínio SEM conhecer quem os consome (desacoplamento).
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public Pedido criarPedido(PedidoRequestDTO dto) {
        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Cliente não encontrado: id " + dto.getClienteId()));

        Insumo forminha = insumoRepository.findById(dto.getForminhaInsumoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Forminha (insumo) não encontrada: id " + dto.getForminhaInsumoId()));

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setDataEntrega(dto.getDataEntrega());
        pedido.setHorarioEntrega(dto.getHorarioEntrega());
        pedido.setForminha(forminha);
        pedido.setStatus(StatusPedido.PENDENTE);

        for (ItemPedidoRequestDTO itemDto : dto.getItens()) {
            pedido.adicionarItem(montarItem(itemDto));
        }

        // Total congelado na criação, a partir dos snapshots de preço.
        pedido.setValorTotal(calcularValorTotal(pedido));

        return pedidoRepository.save(pedido);
    }

    private ItemPedido montarItem(ItemPedidoRequestDTO itemDto) {
        Sabor sabor = saborRepository.findById(itemDto.getSaborId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Sabor não encontrado: id " + itemDto.getSaborId()));

        // Barreira financeira: um sabor sem preço não pode ser vendido —
        // isso garante que o pedido nunca feche com valor total zerado.
        if (sabor.getPrecoUnitario() == null
                || sabor.getPrecoUnitario().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RegraDeNegocioException(
                    "O sabor '" + sabor.getNome() + "' não possui preço definido. "
                            + "Defina o preço antes de usá-lo em um pedido.");
        }

        TipoLote tipoLote = tipoLoteRepository.findByQuantidade(itemDto.getQuantidade())
                .orElseThrow(() -> new RegraDeNegocioException(
                        "Quantidade inválida (" + itemDto.getQuantidade() +
                                "). Os lotes permitidos são 25, 50 ou 100 unidades."));

        ItemPedido item = new ItemPedido();
        item.setSabor(sabor);
        item.setTipoLote(tipoLote);
        item.setPrecoUnitario(sabor.getPrecoUnitario()); // snapshot do preço na venda
        return item;
    }

    // valorTotal = Σ (preço unitário congelado × quantidade do lote).
    private BigDecimal calcularValorTotal(Pedido pedido) {
        return pedido.getItens().stream()
                .map(item -> item.getPrecoUnitario()
                        .multiply(BigDecimal.valueOf(item.getTipoLote().getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    @Transactional
    public Pedido atualizarStatus(Long id, StatusPedido novoStatus) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado: id " + id));

        // ENTREGUE é terminal: impede reprocessar a entrega e, com isso,
        // duplicar a receita no caixa (idempotência na origem).
        if (pedido.getStatus() == StatusPedido.ENTREGUE) {
            throw new RegraDeNegocioException(
                    "Pedido já entregue: seu status não pode mais ser alterado.");
        }

        boolean tornouSeEntregue = novoStatus == StatusPedido.ENTREGUE;
        pedido.setStatus(novoStatus);
        Pedido salvo = pedidoRepository.save(pedido);

        if (tornouSeEntregue) {
            // Anuncia o fato. O Financeiro (ou qualquer outro módulo) reage.
            // O Pedido não sabe — nem precisa saber — o que acontece a seguir.
            eventPublisher.publishEvent(new PedidoEntregueEvent(salvo));
        }

        return salvo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Pedido> buscarPedidosDaSemana(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio.isAfter(dataFim)) {
            throw new RegraDeNegocioException("A data de início não pode ser posterior à data de fim.");
        }
        return pedidoRepository.buscarPorPeriodoComItens(dataInicio, dataFim);
    }
}
