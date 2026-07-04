package com.santobrigadeiro.backend.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class ProducaoDiaDTO {

    private final LocalDate data;
    private final List<SaborProducaoDTO> sabores;

    public ProducaoDiaDTO(LocalDate data, List<SaborProducaoDTO> sabores) {
        this.data = data;
        this.sabores = sabores;
    }
}