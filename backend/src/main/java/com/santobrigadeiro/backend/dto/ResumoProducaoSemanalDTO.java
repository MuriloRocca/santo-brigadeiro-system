package com.santobrigadeiro.backend.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/**
 * Consolidado de produção PENDENTE do período (pedidos ainda não
 * entregues): o que efetivamente falta produzir. Nada é persistido —
 * é recalculado a cada consulta, como o PlanoProducaoSemanalDTO.
 * É a base matemática da Central de Produção e da futura tela de
 * adiantamento/congelamento.
 */
@Getter
public class ResumoProducaoSemanalDTO {

    private final LocalDate dataInicio;
    private final LocalDate dataFim;
    private final int totalGeralDoces;
    private final List<TotalPorSaborDTO> totaisPorSabor;
    private final List<TotalPorDiaSaborDTO> totaisPorDiaESabor;

    public ResumoProducaoSemanalDTO(LocalDate dataInicio, LocalDate dataFim, int totalGeralDoces,
                                    List<TotalPorSaborDTO> totaisPorSabor,
                                    List<TotalPorDiaSaborDTO> totaisPorDiaESabor) {
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.totalGeralDoces = totalGeralDoces;
        this.totaisPorSabor = totaisPorSabor;
        this.totaisPorDiaESabor = totaisPorDiaESabor;
    }
}
