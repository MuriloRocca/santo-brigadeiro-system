package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.*;
import com.santobrigadeiro.backend.entity.FichaTecnica;
import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.entity.ItemPedido;
import com.santobrigadeiro.backend.entity.Pedido;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.FichaTecnicaRepository;
import com.santobrigadeiro.backend.repository.PedidoRepository;
import com.santobrigadeiro.backend.service.PlanejamentoProducaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PlanejamentoProducaoServiceImpl implements PlanejamentoProducaoService {

    private final PedidoRepository pedidoRepository;
    private final FichaTecnicaRepository fichaTecnicaRepository;

    /**
     * Nada aqui é persistido — o plano inteiro é recalculado a cada
     * chamada, a partir dos Pedidos e da Ficha Técnica vigentes no
     * momento da consulta. Ver explicação completa na mensagem de chat
     * sobre por que este relatório nunca deve virar uma tabela salva.
     */
    @Override
    @Transactional(readOnly = true)
    public PlanoProducaoSemanalDTO gerarPlanoSemanal(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio.isAfter(dataFim)) {
            throw new RegraDeNegocioException("A data de início não pode ser posterior à data de fim.");
        }

        List<Pedido> pedidos = pedidoRepository.buscarPorPeriodoComItens(dataInicio, dataFim);

        // Agrupamos sempre pelo ID do sabor (Long), nunca pela referência
        // do objeto Sabor em si — assim o cálculo não depende de premissas
        // frágeis sobre identidade de objetos JPA entre diferentes queries.
        Map<LocalDate, Map<Long, Integer>> quantidadePorDiaESabor = new TreeMap<>();
        Map<Long, Integer> totalPorSaborNaSemana = new HashMap<>();
        Map<Long, String> nomeDoSaborPorId = new HashMap<>();

        for (Pedido pedido : pedidos) {
            LocalDate dia = pedido.getDataEntrega();
            for (ItemPedido item : pedido.getItens()) {
                Long saborId = item.getSabor().getId();
                int quantidade = item.getTipoLote().getQuantidade();

                nomeDoSaborPorId.putIfAbsent(saborId, item.getSabor().getNome());

                quantidadePorDiaESabor
                        .computeIfAbsent(dia, d -> new HashMap<>())
                        .merge(saborId, quantidade, Integer::sum);

                totalPorSaborNaSemana.merge(saborId, quantidade, Integer::sum);
            }
        }

        List<ProducaoDiaDTO> producaoPorDia = montarProducaoPorDia(quantidadePorDiaESabor, nomeDoSaborPorId);
        List<ConsolidadoInsumoDTO> insumosNecessarios = calcularInsumosNecessarios(totalPorSaborNaSemana);

        return new PlanoProducaoSemanalDTO(dataInicio, dataFim, producaoPorDia, insumosNecessarios);
    }

    private List<ProducaoDiaDTO> montarProducaoPorDia(Map<LocalDate, Map<Long, Integer>> quantidadePorDiaESabor,
                                                        Map<Long, String> nomeDoSaborPorId) {
        List<ProducaoDiaDTO> resultado = new ArrayList<>();

        // TreeMap já garante a ordenação por data; iteramos na ordem natural.
        for (Map.Entry<LocalDate, Map<Long, Integer>> entradaDia : quantidadePorDiaESabor.entrySet()) {
            List<SaborProducaoDTO> sabores = entradaDia.getValue().entrySet().stream()
                    .map(entradaSabor -> new SaborProducaoDTO(
                            nomeDoSaborPorId.get(entradaSabor.getKey()),
                            entradaSabor.getValue()))
                    .sorted(Comparator.comparing(SaborProducaoDTO::getSaborNome))
                    .toList();

            resultado.add(new ProducaoDiaDTO(entradaDia.getKey(), sabores));
        }

        return resultado;
    }

    private List<ConsolidadoInsumoDTO> calcularInsumosNecessarios(Map<Long, Integer> totalPorSaborNaSemana) {
        Map<Long, BigDecimal> necessarioPorInsumoId = new HashMap<>();
        Map<Long, Insumo> insumoPorId = new HashMap<>();

        for (Map.Entry<Long, Integer> entrada : totalPorSaborNaSemana.entrySet()) {
            Long saborId = entrada.getKey();
            BigDecimal quantidadeTotalDoSabor = BigDecimal.valueOf(entrada.getValue());

            List<FichaTecnica> fichas = fichaTecnicaRepository.findBySaborId(saborId);

            for (FichaTecnica ficha : fichas) {
                BigDecimal necessarioDesteInsumo = quantidadeTotalDoSabor.multiply(ficha.getQuantidadePorUnidade());
                Long insumoId = ficha.getInsumo().getId();

                insumoPorId.putIfAbsent(insumoId, ficha.getInsumo());
                necessarioPorInsumoId.merge(insumoId, necessarioDesteInsumo, BigDecimal::add);
            }
        }

        return necessarioPorInsumoId.entrySet().stream()
                .map(entrada -> {
                    Insumo insumo = insumoPorId.get(entrada.getKey());
                    BigDecimal necessario = entrada.getValue();
                    BigDecimal disponivel = insumo.getQuantidadeAtual();
                    boolean suficiente = disponivel.compareTo(necessario) >= 0;
                    return new ConsolidadoInsumoDTO(insumo.getNome(), necessario, disponivel, suficiente);
                })
                .sorted(Comparator.comparing(ConsolidadoInsumoDTO::getInsumoNome))
                .toList();
    }
}