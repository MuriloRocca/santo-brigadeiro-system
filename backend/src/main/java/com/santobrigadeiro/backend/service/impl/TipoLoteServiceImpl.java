package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.entity.TipoLote;
import com.santobrigadeiro.backend.repository.TipoLoteRepository;
import com.santobrigadeiro.backend.service.TipoLoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoLoteServiceImpl implements TipoLoteService {

    private final TipoLoteRepository tipoLoteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TipoLote> listarTodos() {
        return tipoLoteRepository.findAll();
    }
}