# Pixel Chaos — Alpha 0.1

Simulador de batalhas de anime em arena 3D com modelos voxel originais. Feito para navegador no celular, sem instalação e sem dependências de rede durante a execução.

## Jogar

Sirva `dist/` usando qualquer servidor HTTP estático. Exemplo: `python3 -m http.server 8080 --directory dist`. Abra `http://localhost:8080`.

- Selecione Goku, Naruto ou Luffy e toque no campo para posicionar.
- Azul à esquerda, vermelho à direita. Sandbox permite até 40 unidades combinadas.
- Arraste para girar a câmera; pinça, roda do mouse e botões +/− controlam o zoom.
- Inicie a batalha; pause ou altere entre 0,5×, 1× e 2×.
- Desafios: cinco formações com orçamento; progresso e formação sandbox são salvos no navegador.
- Goku: rajada em linha; Naruto: Rasengan de área e clones visuais; Luffy: golpe de alcance aumentado e arremesso.

## Estrutura

`dist/game.js`: renderização, modelos, controles e interface. `dist/sim.js`: simulação independente de renderização. `dist/vendor/`: Three.js r160 (MIT), incluído localmente. `tests/`: validação de combate (`npm test`, Node 18+).

## Estado do protótipo

Combate automático simplificado, empurrões e queda animada. Ainda sem física ragdoll, controle direto de personagem, multiplayer ou APK. Os clones de Naruto são efeitos temporários, não unidades autônomas. Não representa um produto oficial das franquias citadas. Código e modelos próprios, com Three.js sob licença MIT.
