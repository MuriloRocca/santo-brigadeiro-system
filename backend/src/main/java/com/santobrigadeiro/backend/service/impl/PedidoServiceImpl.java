package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.ItemPedidoRequestDTO;
import com.santobrigadeiro.backend.dto.PedidoRequestDTO;
import com.santobrigadeiro.backend.entity.*;
import com.santobrigadeiro.backend.entity.enums.StatusPedido;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.*;
import com.santobrigadeiro.backend.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        return pedidoRepository.save(pedido);
    }

    private ItemPedido montarItem(ItemPedidoRequestDTO itemDto) {
        Sabor sabor = saborRepository.findById(itemDto.getSaborId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Sabor não encontrado: id " + itemDto.getSaborId()));

        TipoLote tipoLote = tipoLoteRepository.findByQuantidade(itemDto.getQuantidade())
                .orElseThrow(() -> new RegraDeNegocioException(
                        "Quantidade inválida (" + itemDto.getQuantidade() +
                                "). Os lotes permitidos são 25, 50 ou 100 unidades."));

        ItemPedido item = new ItemPedido();
        item.setSabor(sabor);
        item.setTipoLote(tipoLote);
        return item;
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