package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.ItemPedido;
import com.santobrigadeiro.backend.entity.enums.StatusProducaoItem;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class ItemPedidoResponseDTO {

    // O id do item é exposto para o frontend poder agir sobre um lote
    // específico (ex.: PATCH de status de produção no adiantamento).
    private final Long id;
    private final String sabor;
    private final Integer quantidade;
    private final BigDecimal precoUnitario;
    private final BigDecimal subtotal;
    private final boolean podeCongelar;
    private final StatusProducaoItem statusProducao;

    private ItemPedidoResponseDTO(Long id, String sabor, Integer quantidade, BigDecimal precoUnitario,
                                   BigDecimal subtotal, boolean podeCongelar, StatusProducaoItem statusProducao) {
        this.id = id;
        this.sabor = sabor;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
        this.subtotal = subtotal;
        this.podeCongelar = podeCongelar;
        this.statusProducao = statusProducao;
    }

    public static ItemPedidoResponseDTO fromEntity(ItemPedido item) {
        Integer quantidade = item.getTipoLote().getQuantidade();
        BigDecimal subtotal = item.getPrecoUnitario().multiply(BigDecimal.valueOf(quantidade));
        return new ItemPedidoResponseDTO(
                item.getId(),
                item.getSabor().getNome(),
                quantidade,
                item.getPrecoUnitario(),
                subtotal,
                item.getSabor().isPodeCongelar(),
                item.getStatusProducao()
        );
    }
}
