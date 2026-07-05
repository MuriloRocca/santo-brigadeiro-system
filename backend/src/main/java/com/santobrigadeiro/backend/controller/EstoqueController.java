package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.AdicionarEstoqueRequestDTO;
import com.santobrigadeiro.backend.dto.EstoqueItemResponseDTO;
import com.santobrigadeiro.backend.dto.MovimentacaoEstoqueRequestDTO;
import com.santobrigadeiro.backend.entity.enums.TipoMovimentacao;
import com.santobrigadeiro.backend.service.InsumoService;
import com.santobrigadeiro.backend.service.MovimentacaoEstoqueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Fachada de leitura/reposição rápida para o painel visual de estoque.
 * Não possui regra própria: compõe os serviços já existentes — a
 * reposição de um clique vira uma movimentação de ENTRADA normal, com
 * saldo atualizado e histórico auditável pelo módulo de movimentações.
 */
@RestController
@RequestMapping("/api/estoque")
@RequiredArgsConstructor
public class EstoqueController {

    private final InsumoService insumoService;
    private final MovimentacaoEstoqueService movimentacaoEstoqueService;

    @GetMapping
    public ResponseEntity<List<EstoqueItemResponseDTO>> listar() {
        List<EstoqueItemResponseDTO> itens = insumoService.listarTodos(null)
                .stream()
                .map(EstoqueItemResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(itens);
    }

    @PostMapping("/{id}/adicionar")
    public ResponseEntity<EstoqueItemResponseDTO> adicionar(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdicionarEstoqueRequestDTO dto) {
        MovimentacaoEstoqueRequestDTO movimentacao = new MovimentacaoEstoqueRequestDTO();
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setQuantidade(dto.getQuantidade());
        movimentacao.setMotivo("Reposição rápida pelo painel de estoque");

        var registrada = movimentacaoEstoqueService.registrar(id, movimentacao);
        return ResponseEntity.ok(EstoqueItemResponseDTO.fromEntity(registrada.getInsumo()));
    }
}
