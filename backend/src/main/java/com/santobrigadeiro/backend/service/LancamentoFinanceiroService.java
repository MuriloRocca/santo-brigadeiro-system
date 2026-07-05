package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.FluxoCaixaResumoDTO;
import com.santobrigadeiro.backend.dto.LancamentoFinanceiroRequestDTO;
import com.santobrigadeiro.backend.entity.LancamentoFinanceiro;

import java.time.LocalDate;
import java.util.List;

public interface LancamentoFinanceiroService {

    LancamentoFinanceiro registrar(LancamentoFinanceiroRequestDTO dto);

    List<LancamentoFinanceiro> listarPorPeriodo(LocalDate inicio, LocalDate fim);

    FluxoCaixaResumoDTO consultarFluxoCaixa(LocalDate inicio, LocalDate fim);
}
