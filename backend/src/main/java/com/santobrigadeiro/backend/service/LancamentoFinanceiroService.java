package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.FluxoCaixaResumoDTO;
import com.santobrigadeiro.backend.dto.LancamentoFinanceiroRequestDTO;
import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.entity.LancamentoFinanceiro;
import com.santobrigadeiro.backend.entity.Pedido;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LancamentoFinanceiroService {

    LancamentoFinanceiro registrar(LancamentoFinanceiroRequestDTO dto);

    List<LancamentoFinanceiro> listarPorPeriodo(LocalDate inicio, LocalDate fim);

    FluxoCaixaResumoDTO consultarFluxoCaixa(LocalDate inicio, LocalDate fim);

    // Gera a receita (ENTRADA / VENDA_PEDIDO) a partir de um pedido entregue.
    LancamentoFinanceiro registrarReceitaDePedido(Pedido pedido);

    // Gera a despesa (SAIDA / COMPRA_INSUMO) de uma reposição de estoque,
    // com custo estimado pelo catálogo. Retorna null se o insumo ainda
    // não tem custo cadastrado (sem custo, não há o que lançar).
    LancamentoFinanceiro registrarCompraDeInsumo(Insumo insumo, BigDecimal quantidade);
}
