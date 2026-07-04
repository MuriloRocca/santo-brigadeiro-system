package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.TipoLote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TipoLoteRepository extends JpaRepository<TipoLote, Long> {

    // Permite que a API receba "quantidade: 50" do frontend, sem que o
    // consumidor precise conhecer o ID interno do lote no banco.
    Optional<TipoLote> findByQuantidade(Integer quantidade);
}