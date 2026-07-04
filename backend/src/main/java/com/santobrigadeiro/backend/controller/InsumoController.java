package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.InsumoAtualizacaoDTO;
import com.santobrigadeiro.backend.dto.InsumoRequestDTO;
import com.santobrigadeiro.backend.dto.InsumoResponseDTO;
import com.santobrigadeiro.backend.service.InsumoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insumos")
@RequiredArgsConstructor
public class InsumoController {

    private final InsumoService insumoService;

    // GET /api/insumos              -> todos
    // GET /api/insumos?somenteAlerta=true -> só os que precisam de reposição
    @GetMapping
    public ResponseEntity<List<InsumoResponseDTO>> listar(
            @RequestParam(required = false) Boolean somenteAlerta) {
        List<InsumoResponseDTO> insumos = insumoService.listarTodos(somenteAlerta).stream()
                .map(InsumoResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(insumos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InsumoResponseDTO> buscarPorId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(InsumoResponseDTO.fromEntity(insumoService.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<InsumoResponseDTO> criar(@Valid @RequestBody InsumoRequestDTO dto) {
        InsumoResponseDTO criado = InsumoResponseDTO.fromEntity(insumoService.criar(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    // Note o tipo do @RequestBody: InsumoAtualizacaoDTO, não InsumoRequestDTO.
    // Isso é o que fisicamente impede qualquer chamada de PUT de alterar
    // quantidadeAtual — o campo não existe no contrato de entrada.
    @PutMapping("/{id}")
    public ResponseEntity<InsumoResponseDTO> atualizar(
            @PathVariable("id") Long id, @Valid @RequestBody InsumoAtualizacaoDTO dto) {
        return ResponseEntity.ok(InsumoResponseDTO.fromEntity(insumoService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable("id") Long id) {
        insumoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}