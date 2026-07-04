package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.MovimentacaoEstoqueRequestDTO;
import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.entity.MovimentacaoEstoque;
import com.santobrigadeiro.backend.entity.enums.TipoMovimentacao;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.InsumoRepository;
import com.santobrigadeiro.backend.repository.MovimentacaoEstoqueRepository;
import com.santobrigadeiro.backend.service.MovimentacaoEstoqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimentacaoEstoqueServiceImpl implements MovimentacaoEstoqueService {

    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final InsumoRepository insumoRepository;

    /**
     * O coração desta funcionalidade: salvar a movimentação E atualizar
     * o saldo do insumo precisam ser uma coisa só, ou não são nada.
     *
     * O @Transactional garante isso — se o insumoRepository.save() ou o
     * movimentacaoRepository.save() falhar por qualquer motivo (conexão
     * caiu, constraint violada, etc.), o Spring desfaz TUDO (rollback),
     * inclusive a alteração que já tinha sido feita em memória no objeto
     * Insumo. Sem essa anotação, você correria o risco real de salvar a
     * movimentação mas não atualizar o saldo (ou vice-versa) — e nosso
     * histórico rastreável se tornaria uma mentira.
     */
    @Override
    @Transactional
    public MovimentacaoEstoque registrar(Long insumoId, MovimentacaoEstoqueRequestDTO dto) {
        Insumo insumo = insumoRepository.findById(insumoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Insumo não encontrado: id " + insumoId));

        BigDecimal novoSaldo = calcularNovoSaldo(insumo.getQuantidadeAtual(), dto.getTipo(), dto.getQuantidade());
        insumo.setQuantidadeAtual(novoSaldo);
        insumoRepository.save(insumo);

        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setInsumo(insumo);
        movimentacao.setTipo(dto.getTipo());
        movimentacao.setQuantidade(dto.getQuantidade());
        movimentacao.setMotivo(dto.getMotivo());

        return movimentacaoRepository.save(movimentacao);
    }

    private BigDecimal calcularNovoSaldo(BigDecimal saldoAtual, TipoMovimentacao tipo, BigDecimal quantidade) {
        if (tipo == TipoMovimentacao.ENTRADA) {
            return saldoAtual.add(quantidade);
        }

        BigDecimal saldoResultante = saldoAtual.subtract(quantidade);
        if (saldoResultante.compareTo(BigDecimal.ZERO) < 0) {
            // Barreira essencial: sem isso, seria possível registrar uma
            // saída maior que o estoque disponível e o saldo viraria
            // negativo — algo que não existe fisicamente numa doceria.
            throw new RegraDeNegocioException(
                    "Saldo insuficiente. Disponível: " + saldoAtual + ", tentativa de saída: " + quantidade + ".");
        }
        return saldoResultante;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoEstoque> listarPorInsumo(Long insumoId) {
        if (!insumoRepository.existsById(insumoId)) {
            throw new RecursoNaoEncontradoException("Insumo não encontrado: id " + insumoId);
        }
        return movimentacaoRepository.findByInsumoIdOrderByCriadoEmDesc(insumoId);
    }
}