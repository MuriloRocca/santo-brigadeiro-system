package com.santobrigadeiro.backend.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class PlanoProducaoSemanalDTO {

    private final LocalDate dataInicio;
    private final LocalDate dataFim;
    private final List<ProducaoDiaDTO> producaoPorDia;
    private final List<ConsolidadoInsumoDTO> insumosNecessarios;

    public PlanoProducaoSemanalDTO(LocalDate dataInicio, LocalDate dataFim,
                                    List<ProducaoDiaDTO> producaoPorDia,
                                    List<ConsolidadoInsumoDTO> insumosNecessarios) {
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.producaoPorDia = producaoPorDia;
        this.insumosNecessarios = insumosNecessarios;
    }
}