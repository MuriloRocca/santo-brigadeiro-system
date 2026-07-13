package com.santobrigadeiro.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "sabores")
@Getter
@Setter
@NoArgsConstructor
public class Sabor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome do sabor é obrigatório.")
    @Column(nullable = false, unique = true, length = 100)
    private String nome;

    @Column(name = "pode_congelar", nullable = false)
    private boolean podeCongelar = false;

    @Column(nullable = false)
    private boolean ativo = true;

    @NotNull
    @PositiveOrZero(message = "O preço unitário não pode ser negativo.")
    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario = BigDecimal.ZERO;
}