package com.santobrigadeiro.backend.dto;

import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Consolidação do fluxo de caixa em um período: quanto entrou, quanto
 * saiu e o saldo resultante. O saldo pode ser negativo (saídas > entradas)
 * — diferente do estoque, o caixa aceita ficar no vermelho e isso é uma
 * informação legítima, não um erro a ser bloqueado.
 */
@Getter
public class FluxoCaixaResumoDTO {

    private final LocalDate dataInicio;
    private final LocalDate dataFim;
    private final BigDecimal totalEntradas;
    private final BigDecimal totalSaidas;
    private final BigDecimal saldo;

    public FluxoCaixaResumoDTO(LocalDate dataInicio, LocalDate dataFim,
                               BigDecimal totalEntradas, BigDecimal totalSaidas) {
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.totalEntradas = totalEntradas;
        this.totalSaidas = totalSaidas;
        this.saldo = totalEntradas.subtract(totalSaidas);
    }
}
