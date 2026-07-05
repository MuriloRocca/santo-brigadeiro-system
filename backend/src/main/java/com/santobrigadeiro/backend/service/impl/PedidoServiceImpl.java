package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.ItemPedidoRequestDTO;
import com.santobrigadeiro.backend.dto.PedidoRequestDTO;
import com.santobrigadeiro.backend.dto.ResumoProducaoSemanalDTO;
import com.santobrigadeiro.backend.dto.TotalPorDiaSaborDTO;
import com.santobrigadeiro.backend.dto.TotalPorSaborDTO;
import com.santobrigadeiro.backend.entity.*;
import com.santobrigadeiro.backend.entity.enums.StatusPedido;
import com.santobrigadeiro.backend.entity.enums.StatusProducaoItem;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final SaborRepository saborRepository;
    private final TipoLoteRepository tipoLoteRepository;
    private final InsumoRepository insumoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
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

    /**
     * Consolidado de produção pendente: uma única consulta (com JOIN FETCH)
     * e agregação em memória — volume de uma doceria não justifica GROUP BY
     * em três queries separadas, e assim os três recortes (geral, por sabor,
     * por dia+sabor) saem garantidamente consistentes entre si, pois nascem
     * da mesma fotografia dos dados.
     */
    @Override
    @Transactional(readOnly = true)
    public ResumoProducaoSemanalDTO consultarResumoProducao(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio.isAfter(dataFim)) {
            throw new RegraDeNegocioException("A data de início não pode ser posterior à data de fim.");
        }

        List<Pedido> pedidos = pedidoRepository
                .buscarPendentesPorPeriodoComItens(dataInicio, dataFim, StatusPedido.ENTREGUE);

        // Agrupamento sempre pelo ID do sabor (Long), nunca pela referência
        // do objeto JPA — mesma decisão do PlanejamentoProducaoServiceImpl.
        Map<Long, Sabor> saborPorId = new HashMap<>();
        Map<Long, Integer> totalPorSaborId = new HashMap<>();
        // TreeMap: os dias já saem em ordem cronológica.
        Map<LocalDate, Map<Long, Integer>> quantidadePorDiaESabor = new TreeMap<>();
        int totalGeral = 0;

        for (Pedido pedido : pedidos) {
            for (ItemPedido item : pedido.getItens()) {
                // Lote já congelado/adiantado saiu da lista de esforço:
                // a Central mostra apenas o que ainda exige produção.
                if (item.getStatusProducao() == StatusProducaoItem.CONGELADO) {
                    continue;
                }

                Long saborId = item.getSabor().getId();
                int quantidade = item.getTipoLote().getQuantidade();

                saborPorId.putIfAbsent(saborId, item.getSabor());
                totalPorSaborId.merge(saborId, quantidade, Integer::sum);
                quantidadePorDiaESabor
                        .computeIfAbsent(pedido.getDataEntrega(), d -> new HashMap<>())
                        .merge(saborId, quantidade, Integer::sum);
                totalGeral += quantidade;
            }
        }

        // Do maior para o menor volume: o sabor que mais dá trabalho aparece
        // primeiro nos badges da Central de Produção.
        List<TotalPorSaborDTO> totaisPorSabor = totalPorSaborId.entrySet().stream()
                .map(entrada -> {
                    Sabor sabor = saborPorId.get(entrada.getKey());
                    return new TotalPorSaborDTO(sabor.getNome(), entrada.getValue(), sabor.isPodeCongelar());
                })
                .sorted(Comparator.comparingInt(TotalPorSaborDTO::getQuantidadeTotal).reversed()
                        .thenComparing(TotalPorSaborDTO::getSaborNome))
                .toList();

        List<TotalPorDiaSaborDTO> totaisPorDiaESabor = new ArrayList<>();
        for (Map.Entry<LocalDate, Map<Long, Integer>> entradaDia : quantidadePorDiaESabor.entrySet()) {
            entradaDia.getValue().entrySet().stream()
                    .map(entradaSabor -> new TotalPorDiaSaborDTO(
                            entradaDia.getKey(),
                            saborPorId.get(entradaSabor.getKey()).getNome(),
                            entradaSabor.getValue()))
                    .sorted(Comparator.comparingInt(TotalPorDiaSaborDTO::getQuantidade).reversed()
                            .thenComparing(TotalPorDiaSaborDTO::getSaborNome))
                    .forEach(totaisPorDiaESabor::add);
        }

        return new ResumoProducaoSemanalDTO(dataInicio, dataFim, totalGeral, totaisPorSabor, totaisPorDiaESabor);
    }

    @Override
    @Transactional
    public ItemPedido atualizarStatusProducaoItem(Long itemId, StatusProducaoItem novoStatus) {
        ItemPedido item = itemPedidoRepository.findById(itemId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Item de pedido não encontrado: id " + itemId));

        if (item.getPedido().getStatus() == StatusPedido.ENTREGUE) {
            throw new RegraDeNegocioException(
                    "O pedido deste item já foi entregue; o status de produção não pode mais ser alterado.");
        }

        // A regra central do adiantamento: congelar só é permitido para
        // sabores que suportam congelamento — é o que protege a qualidade
        // do produto de um clique errado na tela.
        if (novoStatus == StatusProducaoItem.CONGELADO && !item.getSabor().isPodeCongelar()) {
            throw new RegraDeNegocioException(
                    "O sabor '" + item.getSabor().getNome() + "' não pode ser congelado. "
                            + "Este lote precisa ser produzido na data da entrega.");
        }

        item.setStatusProducao(novoStatus);
        return itemPedidoRepository.save(item);
    }
}
