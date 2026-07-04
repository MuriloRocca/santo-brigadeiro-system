package com.santobrigadeiro.backend.dto;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class ConsolidadoInsumoDTO {

    private final String insumoNome;
    private final BigDecimal quantidadeNecessaria;
    private final BigDecimal quantidadeDisponivel;
    private final boolean suficiente;

    public ConsolidadoInsumoDTO(String insumoNome, BigDecimal quantidadeNecessaria,
                                 BigDecimal quantidadeDisponivel, boolean suficiente) {
        this.insumoNome = insumoNome;
        this.quantidadeNecessaria = quantidadeNecessaria;
        this.quantidadeDisponivel = quantidadeDisponivel;
        this.suficiente = suficiente;
    }
}