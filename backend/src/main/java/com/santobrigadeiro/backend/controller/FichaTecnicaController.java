package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.FichaTecnicaRequestDTO;
import com.santobrigadeiro.backend.dto.FichaTecnicaResponseDTO;
import com.santobrigadeiro.backend.service.FichaTecnicaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ficha-tecnica")
@RequiredArgsConstructor
public class FichaTecnicaController {

    private final FichaTecnicaService fichaTecnicaService;

    @GetMapping
    public ResponseEntity<List<FichaTecnicaResponseDTO>> listar() {
        List<FichaTecnicaResponseDTO> fichas = fichaTecnicaService.listarTodas().stream()
                .map(FichaTecnicaResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(fichas);
    }

    @PostMapping
    public ResponseEntity<FichaTecnicaResponseDTO> criar(@Valid @RequestBody FichaTecnicaRequestDTO dto) {
        FichaTecnicaResponseDTO criada = FichaTecnicaResponseDTO.fromEntity(fichaTecnicaService.criar(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FichaTecnicaResponseDTO> atualizar(
            @PathVariable("id") Long id, @Valid @RequestBody FichaTecnicaRequestDTO dto) {
        return ResponseEntity.ok(FichaTecnicaResponseDTO.fromEntity(fichaTecnicaService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable("id") Long id) {
        fichaTecnicaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}