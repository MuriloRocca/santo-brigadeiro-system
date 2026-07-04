package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.InsumoAtualizacaoDTO;
import com.santobrigadeiro.backend.dto.InsumoRequestDTO;
import com.santobrigadeiro.backend.entity.Insumo;

import java.util.List;

public interface InsumoService {
    List<Insumo> listarTodos(Boolean somenteAlerta);
    Insumo buscarPorId(Long id);
    Insumo criar(InsumoRequestDTO dto);
    Insumo atualizar(Long id, InsumoAtualizacaoDTO dto);
    void excluir(Long id);
}