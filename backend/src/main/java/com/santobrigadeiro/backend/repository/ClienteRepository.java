package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}