package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.Pedido;
import com.santobrigadeiro.backend.entity.enums.StatusPedido;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
public class PedidoResponseDTO {

    private final Long id;
    private final String cliente;
    private final LocalDate dataEntrega;
    private final LocalTime horarioEntrega;
    private final StatusPedido status;
    private final String corForminha;
    private final BigDecimal valorTotal;
    private final List<ItemPedidoResponseDTO> itens;

    private PedidoResponseDTO(Long id, String cliente, LocalDate dataEntrega, LocalTime horarioEntrega,
                               StatusPedido status, String corForminha, BigDecimal valorTotal,
                               List<ItemPedidoResponseDTO> itens) {
        this.id = id;
        this.cliente = cliente;
        this.dataEntrega = dataEntrega;
        this.horarioEntrega = horarioEntrega;
        this.status = status;
        this.corForminha = corForminha;
        this.valorTotal = valorTotal;
        this.itens = itens;
    }

    public static PedidoResponseDTO fromEntity(Pedido pedido) {
        List<ItemPedidoResponseDTO> itens = pedido.getItens().stream()
                .map(ItemPedidoResponseDTO::fromEntity)
                .toList();

        return new PedidoResponseDTO(
                pedido.getId(),
                pedido.getCliente().getNome(),
                pedido.getDataEntrega(),
                pedido.getHorarioEntrega(),
                pedido.getStatus(),
                pedido.getForminha().getNome(),
                pedido.getValorTotal(),
                itens
        );
    }
}