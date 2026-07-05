package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.SaborRequestDTO;
import com.santobrigadeiro.backend.dto.SaborResponseDTO;
import com.santobrigadeiro.backend.service.SaborService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sabores")
@RequiredArgsConstructor
public class SaborController {

    private final SaborService saborService;

    @GetMapping
    public ResponseEntity<List<SaborResponseDTO>> listar() {
        List<SaborResponseDTO> sabores = saborService.listarAtivos().stream()
                .map(SaborResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(sabores);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaborResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(SaborResponseDTO.fromEntity(saborService.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<SaborResponseDTO> criar(@Valid @RequestBody SaborRequestDTO dto) {
        SaborResponseDTO criado = SaborResponseDTO.fromEntity(saborService.criar(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SaborResponseDTO> atualizar(@PathVariable("id") Long id, @Valid @RequestBody SaborRequestDTO dto) {
        return ResponseEntity.ok(SaborResponseDTO.fromEntity(saborService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable("id") Long id) {
        saborService.inativar(id);
        return ResponseEntity.noContent().build();
    }
}