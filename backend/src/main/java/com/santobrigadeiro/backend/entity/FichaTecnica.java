package com.santobrigadeiro.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "ficha_tecnica", uniqueConstraints = @UniqueConstraint(columnNames = {"sabor_id", "insumo_id"}))
@Getter
@Setter
@NoArgsConstructor
public class FichaTecnica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sabor_id", nullable = false)
    private Sabor sabor;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @NotNull
    @Positive(message = "A quantidade por unidade deve ser maior que zero.")
    @Column(name = "quantidade_por_unidade", nullable = false, precision = 10, scale = 4)
    private BigDecimal quantidadePorUnidade;
}