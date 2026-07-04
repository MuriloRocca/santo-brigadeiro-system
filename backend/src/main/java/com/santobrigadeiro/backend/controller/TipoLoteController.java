package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.TipoLoteResponseDTO;
import com.santobrigadeiro.backend.service.TipoLoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-lote")
@RequiredArgsConstructor
public class TipoLoteController {

    private final TipoLoteService tipoLoteService;

    @GetMapping
    public ResponseEntity<List<TipoLoteResponseDTO>> listar() {
        List<TipoLoteResponseDTO> tipos = tipoLoteService.listarTodos().stream()
                .map(TipoLoteResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(tipos);
    }
}