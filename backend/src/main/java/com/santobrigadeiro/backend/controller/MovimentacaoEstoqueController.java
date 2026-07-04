package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.MovimentacaoEstoqueRequestDTO;
import com.santobrigadeiro.backend.dto.MovimentacaoEstoqueResponseDTO;
import com.santobrigadeiro.backend.service.MovimentacaoEstoqueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Aninhado sob /api/insumos/{insumoId} de propósito: uma movimentação
// não existe sem um insumo dono — a URL já comunica essa dependência.
@RestController
@RequestMapping("/api/insumos/{insumoId}/movimentacoes")
@RequiredArgsConstructor
public class MovimentacaoEstoqueController {

    private final MovimentacaoEstoqueService movimentacaoEstoqueService;

    @GetMapping
    public ResponseEntity<List<MovimentacaoEstoqueResponseDTO>> listar(@PathVariable("insumoId") Long insumoId) {
        List<MovimentacaoEstoqueResponseDTO> movimentacoes = movimentacaoEstoqueService.listarPorInsumo(insumoId)
                .stream()
                .map(MovimentacaoEstoqueResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(movimentacoes);
    }

    @PostMapping
    public ResponseEntity<MovimentacaoEstoqueResponseDTO> registrar(
            @PathVariable("insumoId") Long insumoId,
            @Valid @RequestBody MovimentacaoEstoqueRequestDTO dto){
        var movimentacao = movimentacaoEstoqueService.registrar(insumoId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(MovimentacaoEstoqueResponseDTO.fromEntity(movimentacao));
    }
}