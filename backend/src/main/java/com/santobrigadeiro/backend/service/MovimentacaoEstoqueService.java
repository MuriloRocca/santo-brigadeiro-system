package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.MovimentacaoEstoqueRequestDTO;
import com.santobrigadeiro.backend.entity.MovimentacaoEstoque;

import java.util.List;

public interface MovimentacaoEstoqueService {
    MovimentacaoEstoque registrar(Long insumoId, MovimentacaoEstoqueRequestDTO dto);
    List<MovimentacaoEstoque> listarPorInsumo(Long insumoId);
}