package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.FichaTecnicaRequestDTO;
import com.santobrigadeiro.backend.entity.FichaTecnica;
import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.entity.Sabor;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.FichaTecnicaRepository;
import com.santobrigadeiro.backend.repository.InsumoRepository;
import com.santobrigadeiro.backend.repository.SaborRepository;
import com.santobrigadeiro.backend.service.FichaTecnicaService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FichaTecnicaServiceImpl implements FichaTecnicaService {

    private final FichaTecnicaRepository fichaTecnicaRepository;
    private final SaborRepository saborRepository;
    private final InsumoRepository insumoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FichaTecnica> listarTodas() {
        return fichaTecnicaRepository.findAll();
    }

    @Override
    @Transactional
    public FichaTecnica criar(FichaTecnicaRequestDTO dto) {
        Sabor sabor = saborRepository.findById(dto.getSaborId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Sabor não encontrado: id " + dto.getSaborId()));
        Insumo insumo = insumoRepository.findById(dto.getInsumoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Insumo não encontrado: id " + dto.getInsumoId()));

        FichaTecnica ficha = new FichaTecnica();
        ficha.setSabor(sabor);
        ficha.setInsumo(insumo);
        ficha.setQuantidadePorUnidade(dto.getQuantidadePorUnidade());

        return salvarComTratamentoDeDuplicidade(ficha);
    }

    @Override
    @Transactional
    public FichaTecnica atualizar(Long id, FichaTecnicaRequestDTO dto) {
        FichaTecnica ficha = fichaTecnicaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ficha técnica não encontrada: id " + id));

        Sabor sabor = saborRepository.findById(dto.getSaborId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Sabor não encontrado: id " + dto.getSaborId()));
        Insumo insumo = insumoRepository.findById(dto.getInsumoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Insumo não encontrado: id " + dto.getInsumoId()));

        ficha.setSabor(sabor);
        ficha.setInsumo(insumo);
        ficha.setQuantidadePorUnidade(dto.getQuantidadePorUnidade());

        return salvarComTratamentoDeDuplicidade(ficha);
    }

    private FichaTecnica salvarComTratamentoDeDuplicidade(FichaTecnica ficha) {
        try {
            FichaTecnica salva = fichaTecnicaRepository.save(ficha);
            fichaTecnicaRepository.flush();
            return salva;
        } catch (DataIntegrityViolationException ex) {
            throw new RegraDeNegocioException(
                    "Já existe uma ficha técnica cadastrada para esse sabor e esse insumo.");
        }
    }

    @Override
    @Transactional
    public void excluir(Long id) {
        if (!fichaTecnicaRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Ficha técnica não encontrada: id " + id);
        }
        fichaTecnicaRepository.deleteById(id);
    }
}