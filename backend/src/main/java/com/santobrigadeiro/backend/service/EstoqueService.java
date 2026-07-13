package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.entity.MovimentacaoEstoque;

import java.math.BigDecimal;

public interface EstoqueService {

    // Reposição manual de um clique: registra a ENTRADA no estoque e
    // anuncia o fato para o restante do sistema (ex.: caixa).
    MovimentacaoEstoque reporRapido(Long insumoId, BigDecimal quantidade);
}
