package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.MovimentacaoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    // Histórico de um insumo específico, do mais recente para o mais antigo —
    // é assim que uma tela de "extrato de estoque" normalmente é consumida.
    List<MovimentacaoEstoque> findByInsumoIdOrderByCriadoEmDesc(Long insumoId);
}