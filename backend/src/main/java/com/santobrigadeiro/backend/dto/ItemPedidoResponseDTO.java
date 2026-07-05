package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.ItemPedido;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class ItemPedidoResponseDTO {

    private final String sabor;
    private final Integer quantidade;
    private final BigDecimal precoUnitario;
    private final BigDecimal subtotal;

    private ItemPedidoResponseDTO(String sabor, Integer quantidade, BigDecimal precoUnitario, BigDecimal subtotal) {
        this.sabor = sabor;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
        this.subtotal = subtotal;
    }

    public static ItemPedidoResponseDTO fromEntity(ItemPedido item) {
        Integer quantidade = item.getTipoLote().getQuantidade();
        BigDecimal subtotal = item.getPrecoUnitario().multiply(BigDecimal.valueOf(quantidade));
        return new ItemPedidoResponseDTO(item.getSabor().getNome(), quantidade, item.getPrecoUnitario(), subtotal);
    }
}
