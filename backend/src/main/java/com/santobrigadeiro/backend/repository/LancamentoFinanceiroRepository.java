package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.LancamentoFinanceiro;
import com.santobrigadeiro.backend.entity.enums.TipoLancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    // Extrato do período, do mais recente para o mais antigo. O desempate
    // por id (desc) garante ordem estável entre lançamentos do mesmo dia.
    List<LancamentoFinanceiro> findByDataLancamentoBetweenOrderByDataLancamentoDescIdDesc(
            LocalDate inicio, LocalDate fim);

    // Soma agregada no banco (não em memória): eficiente e correto mesmo
    // com muitos lançamentos. COALESCE evita null quando não há linhas.
    @Query("""
        SELECT COALESCE(SUM(l.valor), 0)
        FROM LancamentoFinanceiro l
        WHERE l.tipo = :tipo
          AND l.dataLancamento BETWEEN :inicio AND :fim
        """)
    BigDecimal somarValorPorTipoNoPeriodo(@Param("tipo") TipoLancamento tipo,
                                          @Param("inicio") LocalDate inicio,
                                          @Param("fim") LocalDate fim);
}
