package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.AdicionarEstoqueRequestDTO;
import com.santobrigadeiro.backend.dto.EstoqueItemResponseDTO;
import com.santobrigadeiro.backend.service.EstoqueService;
import com.santobrigadeiro.backend.service.InsumoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Fachada de leitura/reposição rápida para o painel visual de estoque.
 * A reposição de um clique atualiza o saldo, grava o histórico auditável
 * e — via evento de domínio — registra a despesa de compra no caixa.
 */
@RestController
@RequestMapping("/api/estoque")
@RequiredArgsConstructor
public class EstoqueController {

    private final InsumoService insumoService;
    private final EstoqueService estoqueService;

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
        var registrada = estoqueService.reporRapido(id, dto.getQuantidade());
        return ResponseEntity.ok(EstoqueItemResponseDTO.fromEntity(registrada.getInsumo()));
    }
}
