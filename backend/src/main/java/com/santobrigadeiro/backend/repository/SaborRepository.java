package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.Sabor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaborRepository extends JpaRepository<Sabor, Long> {
}