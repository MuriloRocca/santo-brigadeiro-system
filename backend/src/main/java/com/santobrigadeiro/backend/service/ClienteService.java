package com.santobrigadeiro.backend.service;

import com.santobrigadeiro.backend.dto.ClienteRequestDTO;
import com.santobrigadeiro.backend.entity.Cliente;

import java.util.List;

public interface ClienteService {
    List<Cliente> listarTodos();
    Cliente buscarPorId(Long id);
    Cliente criar(ClienteRequestDTO dto);
    Cliente atualizar(Long id, ClienteRequestDTO dto);
    void excluir(Long id);
}