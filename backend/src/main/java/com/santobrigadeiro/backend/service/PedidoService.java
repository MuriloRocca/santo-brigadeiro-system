package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.PedidoRequestDTO;
import com.santobrigadeiro.backend.entity.Pedido;

import java.time.LocalDate;
import java.util.List;

public interface PedidoService {
    Pedido criarPedido(PedidoRequestDTO dto);
    List<Pedido> buscarPedidosDaSemana(LocalDate dataInicio, LocalDate dataFim);
}