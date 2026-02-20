# Quoridor

Implementação do jogo de tabuleiro Quoridor para dois jogadores, feita para jogar no celular passando o aparelho de mão em mão.

## Como jogar

Quoridor é um jogo de estratégia para 2 jogadores. Cada jogador começa em um lado oposto do tabuleiro e precisa chegar ao lado do adversário antes que ele chegue ao seu.

### Objetivo

- **Azul** começa na linha inferior e precisa chegar à linha superior.
- **Verde** começa na linha superior e precisa chegar à linha inferior.

As linhas de saída de cada jogador são destacadas com a sua cor no tabuleiro.

### Em cada turno, o jogador escolhe uma das duas ações:

**1. Mover a peça**

Toque em "Mover Peça" e depois na casa de destino. Movimentos válidos:
- Uma casa em qualquer direção (cima, baixo, esquerda, direita)
- Pulo reto sobre o adversário quando ele está adjacente e o caminho atrás dele está livre
- Pulo diagonal quando o pulo reto está bloqueado por barreira ou borda do tabuleiro

**2. Colocar uma barreira**

Toque em "Colocar Barreira" e depois no vão entre as casas onde quer colocar. A barreira ocupa dois vãos contíguos:
- Tocar num vão **horizontal** (entre linhas) cria uma barreira horizontal
- Tocar num vão **vertical** (entre colunas) cria uma barreira vertical
- A barreira sempre se estende para a direita (horizontal) ou para baixo (vertical) a partir do ponto tocado

> **Regra importante:** uma barreira não pode isolar completamente um jogador, impedindo-o de chegar ao seu destino. Tentativas assim são rejeitadas automaticamente.

Cada jogador tem **10 barreiras** disponíveis durante a partida.

### Voltar Vez

O botão "Voltar Vez" desfaz a última jogada. Útil se colocou uma barreira no lugar errado ou moveu a peça sem querer.

## Tecnologia

Projeto vanilla — sem dependências, sem build, sem frameworks.

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura da página |
| `style.css` | Estilo e layout responsivo |
| `script.js` | Toda a lógica do jogo |

### Destaques da implementação

- **Grid 17×17** — tabuleiro representado internamente como uma grade onde casas ficam nas posições par-par e vãos de barreira nas demais
- **BFS para validação de barreiras** — antes de confirmar uma barreira, o algoritmo verifica se ainda existe caminho para os dois jogadores chegarem ao destino
- **Sistema de histórico** — undo completo com serialização do estado por JSON

## Como rodar

Abra o `index.html` direto no navegador. Nenhum servidor necessário.
