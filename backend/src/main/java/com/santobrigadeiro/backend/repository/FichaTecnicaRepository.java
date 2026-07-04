package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.FichaTecnica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {

    // Usado pelo cálculo do plano de produção: "quais insumos e em que
    // quantidade este sabor específico consome por unidade?"
    List<FichaTecnica> findBySaborId(Long saborId);
}