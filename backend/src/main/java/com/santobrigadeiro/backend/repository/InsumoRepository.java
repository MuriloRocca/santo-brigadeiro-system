package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsumoRepository extends JpaRepository<Insumo, Long> {
}