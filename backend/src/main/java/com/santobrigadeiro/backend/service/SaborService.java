package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.SaborRequestDTO;
import com.santobrigadeiro.backend.entity.Sabor;

import java.util.List;

public interface SaborService {
    List<Sabor> listarAtivos();
    Sabor buscarPorId(Long id);
    Sabor criar(SaborRequestDTO dto);
    Sabor atualizar(Long id, SaborRequestDTO dto);
    void inativar(Long id);
}