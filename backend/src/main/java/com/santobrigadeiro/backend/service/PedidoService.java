package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.PedidoRequestDTO;
import com.santobrigadeiro.backend.dto.ResumoProducaoSemanalDTO;
import com.santobrigadeiro.backend.entity.ItemPedido;
import com.santobrigadeiro.backend.entity.Pedido;
import com.santobrigadeiro.backend.entity.enums.StatusPedido;
import com.santobrigadeiro.backend.entity.enums.StatusProducaoItem;

import java.time.LocalDate;
import java.util.List;

public interface PedidoService {
    Pedido criarPedido(PedidoRequestDTO dto);
    List<Pedido> buscarPedidosDaSemana(LocalDate dataInicio, LocalDate dataFim);
    Pedido atualizarStatus(Long id, StatusPedido novoStatus);
    ResumoProducaoSemanalDTO consultarResumoProducao(LocalDate dataInicio, LocalDate dataFim);
    ItemPedido atualizarStatusProducaoItem(Long itemId, StatusProducaoItem novoStatus);
}
