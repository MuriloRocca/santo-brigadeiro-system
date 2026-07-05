package com.santobrigadeiro.backend.dto;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class TotalPorDiaSaborDTO {

    private final LocalDate data;
    private final String saborNome;
    private final int quantidade;

    public TotalPorDiaSaborDTO(LocalDate data, String saborNome, int quantidade) {
        this.data = data;
        this.saborNome = saborNome;
        this.quantidade = quantidade;
    }
}
