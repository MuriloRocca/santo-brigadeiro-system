package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.PlanoProducaoSemanalDTO;

import java.time.LocalDate;

public interface PlanejamentoProducaoService {
    PlanoProducaoSemanalDTO gerarPlanoSemanal(LocalDate dataInicio, LocalDate dataFim);
}