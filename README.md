# Pixel Chaos — Alpha 0.2

Simulador de batalhas em arena 3D para navegador de celular. Elenco de 12 personagens de anime, filmes e séries, com modelos próprios de formas arredondadas, membros articulados e detalhes pixelados. Não depende de downloads externos durante a execução.

## Jogar

Sirva `dist/` com qualquer servidor HTTP estático: `python3 -m http.server 8080 --directory dist`. Abra `http://localhost:8080`.

- Escolha um personagem; toque no campo para posicionar. Azul de um lado, vermelho do outro.
- Filtre por Animes, Filmes ou Séries, ou busque por nome/universo. Deslize a lista horizontalmente para ver o elenco.
- Toque no nome do personagem selecionado para inspecionar o modelo 3D. Arraste para girar.
- Arraste na arena para girar a câmera; pinça, roda do mouse e +/− ajustam o zoom.
- Inicie a batalha; use pausa e velocidades 0,5×, 1× e 2×.
- Sandbox: até 40 unidades combinadas. Desafios: cinco formações com orçamento.

## Elenco e habilidades

| Personagem | Universo | Habilidade |
| --- | --- | --- |
| Goku | Dragon Ball | Kamehameha atravessa inimigos em linha |
| Naruto | Naruto | Rasengan em área e clones visuais temporários |
| Luffy | One Piece | Soco elástico com empurrão |
| Gojo | Jujutsu Kaisen | Vazio Roxo, lentidão e proteção temporária |
| Ichigo | Bleach | Getsuga Tensho em linha |
| Tanjiro | Demon Slayer | Corte circular de água e proteção breve |
| Darth Vader | Star Wars | Força causa dano e imobiliza |
| Yoda | Star Wars | Cura aliados próximos e afasta inimigos |
| Homem-Aranha | Marvel | Teia imobiliza e causa lentidão em área |
| Elsa | Frozen | Tempestade de gelo com lentidão em área |
| Eleven | Stranger Things | Onda telecinética, arremesso e interrupção |
| Wandinha | Wednesday | Ataque da Mãozinha e proteção temporária |

## Estrutura

- `dist/catalog.js`: elenco, estatísticas e universos, com IDs estáveis.
- `dist/models.js`: corpos arredondados, roupas, acessórios e rostos pixelados.
- `dist/portraits.js`: retratos gerados dos próprios modelos do jogo.
- `dist/game.js`: arena, interface, efeitos, animações, câmera e controles.
- `dist/sim.js`: simulação de combate sem dependência da renderização.
- `dist/vendor/`: Three.js r160, incluído localmente sob licença MIT.
- `tests/`: testes de modelos, todos os confrontos, estados de habilidades e batalhas de 40 unidades. Rode `npm test` (Node 18+).

Os dados de formação e progresso da Alpha 0.1 usam as mesmas chaves de armazenamento e continuam válidos. Não limpe os dados do navegador para atualizar.

## Estado

Protótipo independente de fã, sem vínculo oficial com as franquias. Modelos e código próprios. Combate simplificado, empurrões e queda animada; ainda sem ragdoll físico, controle direto, multiplayer ou APK. Clones são efeitos temporários, não unidades autônomas. Mãozinha aparece como efeito de habilidade. Limite de 40 personagens pode exigir qualidade leve em celulares mais simples.
