package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.SaborRequestDTO;
import com.santobrigadeiro.backend.entity.Sabor;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.repository.SaborRepository;
import com.santobrigadeiro.backend.service.SaborService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SaborServiceImpl implements SaborService {

    private final SaborRepository saborRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Sabor> listarAtivos() {
        return saborRepository.findAll().stream().filter(Sabor::isAtivo).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Sabor buscarPorId(Long id) {
        return saborRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Sabor não encontrado: id " + id));
    }

    @Override
    @Transactional
    public Sabor criar(SaborRequestDTO dto) {
        Sabor sabor = new Sabor();
        sabor.setNome(dto.getNome());
        sabor.setPodeCongelar(dto.getPodeCongelar());
        sabor.setAtivo(true);
        return saborRepository.save(sabor);
    }

    @Override
    @Transactional
    public Sabor atualizar(Long id, SaborRequestDTO dto) {
        Sabor sabor = buscarPorId(id);
        sabor.setNome(dto.getNome());
        sabor.setPodeCongelar(dto.getPodeCongelar());
        return saborRepository.save(sabor);
    }

    @Override
    @Transactional
    public void inativar(Long id) {
        Sabor sabor = buscarPorId(id);
        sabor.setAtivo(false);
        saborRepository.save(sabor);
    }
}