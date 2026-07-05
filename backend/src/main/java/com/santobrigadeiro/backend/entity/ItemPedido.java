package com.santobrigadeiro.backend.entity;

import com.santobrigadeiro.backend.validation.QuantidadeLotePermitida;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "itens_pedido", uniqueConstraints = @UniqueConstraint(columnNames = {"pedido_id", "sabor_id"}))
@QuantidadeLotePermitida
@Getter
@Setter
@NoArgsConstructor
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sabor_id", nullable = false)
    private Sabor sabor;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_lote_id", nullable = false)
    private TipoLote tipoLote;

    // Snapshot do preço do sabor no momento da venda — imutável depois.
    @NotNull
    @PositiveOrZero
    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario = BigDecimal.ZERO;
}