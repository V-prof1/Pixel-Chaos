# Pixel Chaos — Alpha 0.4 / Ability Rework

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

## Habilidades refeitas

Cada um dos 20 personagens tem uma receita visual própria e uma pose de preparação e liberação. O dano especial só é liberado depois da preparação; morte ou atordoamento podem cancelar o golpe. Naruto e Sasuke avançam no golpe; a Força de Vader levanta visualmente o alvo durante a imobilização.

- Goku e Vegeta: preparação nas mãos, feixe com núcleo luminoso, camadas transparentes e espirais em movimento.
- Naruto: Rasengan com trilhas giratórias, avanço e onda de impacto.
- Luffy e Saitama: preparação do soco, extensão, anéis de pressão e poeira.
- Gojo: energias azul e vermelha se aproximam antes da explosão roxa.
- Ichigo e Tanjiro: cortes em crescente e espirais de água com partículas claras.
- Vader, Yoda, Eleven e Geralt: efeitos distintos de estrangulamento, cura, telecinese e onda direcional.
- Homem-Aranha: disparo em duas linhas e rede radial que se fecha no alvo atingido.
- Elsa: círculo de gelo, cristais que crescem do chão e neve.
- Wandinha: Mãozinha articulada e linhas de sombra no chão.
- Sasuke e Thor: eletricidade ramificada e raios do céu.
- Bakugo: fogo translúcido, fumaça, faíscas e ondas de choque.
- Homem de Ferro: mísseis com corpos 3D, trajetória elevada e rastros de propulsão.
- Harry Potter: espirais mágicas, centelhas e feitiços com brilho em estrela.

Os projéteis têm núcleo luminoso e rastros que diminuem ao longo do percurso. Teias, gelo e feitiços têm formatos diferentes. Efeitos usam transparência para não cobrir a arena com esferas opacas. O orçamento de efeitos decorativos pode simplificar partículas em multidões; não remove projéteis, dano ou unidades simuladas.

Na inspeção, toque **Demonstrar habilidade** para ver o modelo e o especial em um palco separado, sem modificar seu save ou sua formação. O áudio continua opcional; os novos sons são sintetizados localmente. A qualidade Alta aumenta o orçamento de efeitos.

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
- `sim.js`: combate, preparação, cancelamento, projéteis, estados e grade espacial.
- `abilities.js`: tempos, poses, paletas e identidade de cada golpe.
- `ability-fx.js`: geometria animada, efeitos, impactos e controle de recursos.
- `ability-audio.js`: sons por família de habilidade e limitação de sobreposição.
- `crowd.js`: renderização em lotes para multidões e projéteis.
- `game.js`: interface, arena, câmera, controles e efeitos.
- `vendor/`: Three.js r160 incluído sob licença MIT.

Rode `npm test` (Node 18+). Há 24 testes, incluindo receitas visuais, poses, descarte de efeitos, preparação e cancelamento de golpes, além dos 20 modelos e variantes GOD, todos os confrontos, multiplicadores exatos, projéteis independentes, persistência de 1.000 unidades, lotes de 5.000 projéteis e compatibilidade com saves anteriores. As mesmas chaves de progresso e formação das Alphas 0.1/0.2/0.3 são preservadas.

Protótipo independente de fã com código e modelos próprios. Sem vínculo oficial com as franquias. Ainda sem ragdoll físico, controle direto, multiplayer ou APK. Clones e Mãozinha são efeitos de habilidades, não unidades autônomas.
