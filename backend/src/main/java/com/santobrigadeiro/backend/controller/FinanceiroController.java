package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.FluxoCaixaResumoDTO;
import com.santobrigadeiro.backend.dto.LancamentoFinanceiroRequestDTO;
import com.santobrigadeiro.backend.dto.LancamentoFinanceiroResponseDTO;
import com.santobrigadeiro.backend.service.LancamentoFinanceiroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/financeiro")
@RequiredArgsConstructor
public class FinanceiroController {

    private final LancamentoFinanceiroService lancamentoFinanceiroService;

    @PostMapping("/lancamentos")
    public ResponseEntity<LancamentoFinanceiroResponseDTO> registrar(
            @Valid @RequestBody LancamentoFinanceiroRequestDTO dto) {
        var lancamento = lancamentoFinanceiroService.registrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(LancamentoFinanceiroResponseDTO.fromEntity(lancamento));
    }

    @GetMapping("/lancamentos")
    public ResponseEntity<List<LancamentoFinanceiroResponseDTO>> listar(
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        List<LancamentoFinanceiroResponseDTO> lancamentos = lancamentoFinanceiroService
                .listarPorPeriodo(inicio, fim)
                .stream()
                .map(LancamentoFinanceiroResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(lancamentos);
    }

    @GetMapping("/fluxo-caixa")
    public ResponseEntity<FluxoCaixaResumoDTO> fluxoCaixa(
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(lancamentoFinanceiroService.consultarFluxoCaixa(inicio, fim));
    }
}
