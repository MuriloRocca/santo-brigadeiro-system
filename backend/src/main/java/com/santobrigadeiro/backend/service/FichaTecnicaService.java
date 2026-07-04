package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.FichaTecnicaRequestDTO;
import com.santobrigadeiro.backend.entity.FichaTecnica;

import java.util.List;

public interface FichaTecnicaService {
    List<FichaTecnica> listarTodas();
    FichaTecnica criar(FichaTecnicaRequestDTO dto);
    FichaTecnica atualizar(Long id, FichaTecnicaRequestDTO dto);
    void excluir(Long id);
}