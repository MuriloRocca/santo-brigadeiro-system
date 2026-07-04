package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.InsumoAtualizacaoDTO;
import com.santobrigadeiro.backend.dto.InsumoRequestDTO;
import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.InsumoRepository;
import com.santobrigadeiro.backend.service.InsumoService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InsumoServiceImpl implements InsumoService {

    private final InsumoRepository insumoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Insumo> listarTodos(Boolean somenteAlerta) {
        List<Insumo> todos = insumoRepository.findAll();
        if (Boolean.TRUE.equals(somenteAlerta)) {
            // Filtragem em memória delegando a regra ao próprio domínio
            // (Insumo.isEmAlerta()) — a mesma regra usada em qualquer
            // outro lugar do sistema que precise responder "está em alerta?".
            return todos.stream().filter(Insumo::isEmAlerta).toList();
        }
        return todos;
    }

    @Override
    @Transactional(readOnly = true)
    public Insumo buscarPorId(Long id) {
        return insumoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Insumo não encontrado: id " + id));
    }

    @Override
    @Transactional
    public Insumo criar(InsumoRequestDTO dto) {
        Insumo insumo = new Insumo();
        insumo.setNome(dto.getNome());
        insumo.setTipoInsumo(dto.getTipoInsumo());
        insumo.setUnidadeMedida(dto.getUnidadeMedida());
        insumo.setQuantidadeAtual(dto.getQuantidadeAtual());
        insumo.setEstoqueMinimo(dto.getEstoqueMinimo());
        return insumoRepository.save(insumo);
    }

    @Override
    @Transactional
    public Insumo atualizar(Long id, InsumoAtualizacaoDTO dto) {
        Insumo insumo = buscarPorId(id);
        insumo.setNome(dto.getNome());
        insumo.setTipoInsumo(dto.getTipoInsumo());
        insumo.setUnidadeMedida(dto.getUnidadeMedida());
        insumo.setEstoqueMinimo(dto.getEstoqueMinimo());
        // quantidadeAtual permanece intocado aqui — não existe no DTO,
        // então não há como este método alterá-lo, nem por engano.
        return insumoRepository.save(insumo);
    }

    @Override
    @Transactional
    public void excluir(Long id) {
        Insumo insumo = buscarPorId(id);
        try {
            insumoRepository.delete(insumo);
            insumoRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new RegraDeNegocioException(
                    "Não é possível excluir este insumo pois ele está associado a pedidos ou movimentações existentes.");
        }
    }
}