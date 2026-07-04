package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.ItemPedido;
import lombok.Getter;

@Getter
public class ItemPedidoResponseDTO {

    private final String sabor;
    private final Integer quantidade;

    private ItemPedidoResponseDTO(String sabor, Integer quantidade) {
        this.sabor = sabor;
        this.quantidade = quantidade;
    }

    public static ItemPedidoResponseDTO fromEntity(ItemPedido item) {
        return new ItemPedidoResponseDTO(item.getSabor().getNome(), item.getTipoLote().getQuantidade());
    }
}