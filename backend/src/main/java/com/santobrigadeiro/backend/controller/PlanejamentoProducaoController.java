package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.PlanoProducaoSemanalDTO;
import com.santobrigadeiro.backend.service.PlanejamentoProducaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/producao")
@RequiredArgsConstructor
public class PlanejamentoProducaoController {

    private final PlanejamentoProducaoService planejamentoProducaoService;

    // Somente leitura de propósito: este endpoint apenas consolida dados
    // já existentes (pedidos + ficha técnica), nunca grava nada novo.
    @GetMapping("/plano-semanal")
    public ResponseEntity<PlanoProducaoSemanalDTO> planoSemanal(
            @RequestParam("dataInicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam("dataFim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(planejamentoProducaoService.gerarPlanoSemanal(dataInicio, dataFim));
    }
}