# Pixel Chaos — Alpha 0.3 / GOD Chaos

Simulador de batalhas 3D para navegador de celular, com 20 personagens de anime, filmes e séries. Modelos arredondados, membros articulados, detalhes pixelados e variantes GOD. Recursos locais: o jogo não depende de CDN durante a execução.

## Jogar

Sirva `dist/`: `python3 -m http.server 8080 --directory dist`. Abra `http://localhost:8080`.

- Escolha o time e o personagem. Defina **Por toque** para colocar grupos com um toque no chão.
- **GOD** alterna a variante das próximas unidades. As já posicionadas mantêm sua variante.
- Filtre por Anime, Filmes ou Séries ou busque pelo nome/universo. A lista desliza horizontalmente.
- Toque no nome do selecionado para ver e girar seu modelo 3D.
- Arraste na arena para girar; pinça, roda do mouse e +/− ajustam o zoom.
- **Mover** desloca a câmera; **Mapa** retorna ao centro e amplia a visão.
- Batalhas automáticas com pausa, 0,5× / 1× / 2× e limite de tempo de quatro minutos.
- Sandbox sem limite fixo de unidades. A colocação respeita espaço físico livre na arena; os desafios mantêm seus orçamentos.

## GOD: modificadores reais

Cada habilidade recebe os modificadores aplicáveis. Personagens híbridos acumulam seus benefícios.

| Característica | Variante GOD |
| --- | --- |
| Ataques de longa distância | 100× projéteis por disparo, com trajetória, alvo e impacto independentes |
| Corpo a corpo | 100× impulso de empurrão e dano recebido dividido por 10 |
| Explosivo | 100× dano explosivo e raio 10× maior (área 100× maior) |
| Suporte | 100× cura e alcance 10× maior |
| Controle | Duração dos efeitos 100× maior e raio de controle 10× maior |

Exemplos: Goku GOD lança 100 disparos por ataque. Vegeta GOD lança 300 projéteis no Final Flash (3 normais × 100); Homem de Ferro GOD lança 600 mísseis por salva (6 × 100). Naruto GOD acumula explosão ampliada e bônus de corpo a corpo. Gojo GOD acumula rajadas ampliadas e explosões ampliadas. Unidades GOD usam o mesmo custo de colocação da versão normal.

## Elenco

| Personagem | Universo | Habilidade |
| --- | --- | --- |
| Goku | Dragon Ball | Kamehameha |
| Naruto | Naruto | Rasengan e clones visuais |
| Luffy | One Piece | Soco elástico |
| Gojo | Jujutsu Kaisen | Vazio Roxo |
| Ichigo | Bleach | Getsuga Tensho |
| Tanjiro | Demon Slayer | Respiração da Água |
| Darth Vader | Star Wars | Estrangulamento da Força |
| Yoda | Star Wars | Cura e onda da Força |
| Homem-Aranha | Marvel | Teia aprisionadora |
| Elsa | Frozen | Tempestade de Gelo |
| Eleven | Stranger Things | Explosão telecinética |
| Wandinha | Wednesday | Mãozinha e sombra |
| Vegeta | Dragon Ball | Final Flash |
| Sasuke | Naruto | Chidori |
| Saitama | One Punch Man | Soco Sério |
| Bakugo | My Hero Academia | Howitzer Impact |
| Homem de Ferro | Marvel | Salva de mísseis |
| Thor | Marvel | Tempestade de Raios |
| Harry Potter | Harry Potter | Estupefaça |
| Geralt | The Witcher | Aard |

## Arena e desempenho

A arena mede 100 × 68 unidades, contra 25 × 17 anteriormente: 16× a área. A câmera pode deslocar, aproximar ou afastar para alcançar todas as regiões.

Não há teto de população na colocação, importação, gravação ou simulação. Acima de 80 unidades, a renderização usa modelos agrupados com pose simplificada e formas arredondadas, mantendo todas as unidades e suas habilidades na simulação. A busca de alvos e a separação usam uma grade espacial. Projéteis são desenhados em um lote que cresce conforme necessário, sem teto de tiros simulados; partículas decorativas recebem um orçamento visual separado. A capacidade prática depende da memória e do desempenho do dispositivo.

## Estrutura e validação

- `catalog.js`: elenco, atributos e multiplicadores GOD.
- `world.js`: dimensões, limites espaciais e zoom.
- `formation.js`: importação compatível e posicionamento de grupos, sem truncar unidades.
- `models.js` / `portraits.js`: modelos e retratos gerados dos próprios modelos.
- `sim.js`: combate, projéteis, estados e grade espacial.
- `crowd.js`: renderização em lotes para multidões e projéteis.
- `game.js`: interface, arena, câmera, controles e efeitos.
- `vendor/`: Three.js r160 incluído sob licença MIT.

Rode `npm test` (Node 18+). Há testes dos 20 modelos e variantes GOD, todos os confrontos, multiplicadores exatos, projéteis independentes, persistência de 1.000 unidades, lotes de 5.000 projéteis e compatibilidade com saves anteriores. As mesmas chaves de progresso e formação das Alphas 0.1/0.2 são preservadas.

Protótipo independente de fã com código e modelos próprios. Sem vínculo oficial com as franquias. Ainda sem ragdoll físico, controle direto, multiplayer ou APK. Clones e Mãozinha são efeitos de habilidades, não unidades autônomas.
