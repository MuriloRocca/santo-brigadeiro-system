package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.ClienteRequestDTO;
import com.santobrigadeiro.backend.entity.Cliente;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.ClienteRepository;
import com.santobrigadeiro.backend.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Cliente> listarFrequentes(int limite) {
        // Guarda-corpo: limite não-positivo não faz sentido e viraria uma
        // PageRequest inválida (exceção obscura); trata como "sem resultados".
        if (limite <= 0) {
            return List.of();
        }
        return clienteRepository.buscarPorFrequenciaDePedidos(PageRequest.of(0, limite));
    }

    @Override
    @Transactional(readOnly = true)
    public Cliente buscarPorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado: id " + id));
    }

    @Override
    @Transactional
    public Cliente criar(ClienteRequestDTO dto) {
        Cliente cliente = new Cliente();
        cliente.setNome(dto.getNome());
        cliente.setTelefone(dto.getTelefone());
        return clienteRepository.save(cliente);
    }

    @Override
    @Transactional
    public Cliente atualizar(Long id, ClienteRequestDTO dto) {
        Cliente cliente = buscarPorId(id);
        cliente.setNome(dto.getNome());
        cliente.setTelefone(dto.getTelefone());
        return clienteRepository.save(cliente);
    }

    @Override
    @Transactional
    public void excluir(Long id) {
        Cliente cliente = buscarPorId(id);
        try {
            clienteRepository.delete(cliente);
            clienteRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new RegraDeNegocioException(
                    "Não é possível excluir este cliente pois ele já possui pedidos registrados.");
        }
    }
}