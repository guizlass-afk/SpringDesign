# Spring Design

Aplicativo local no navegador para pré-dimensionamento estático de molas cilíndricas de arame circular. Projeto canônico: `Z:\Projetos\Spring Design`, na pasta de rede compartilhada. Parte do Factory Toolbox.

## Recursos

- Compressão, tração e torção; dimensões e módulos de material editáveis.
- Unidades mm/N/MPa ou in/lbf/ksi sem alterar os dados internos.
- Desenho esquemático cotado do estado livre e da deformação selecionada, gráfico de carga e simulação por controle deslizante.
- Rigidez, força/torque, tensão corrigida no corpo, energia e geometria. Comparação opcional com a tensão admissível fornecida pelo usuário, no mesmo modo de tensão (cisalhamento para compressão/tração, flexão para torção).
- SVG da visualização atual, CSV dos dados e da curva, impressão com opção PDF do navegador.
- 12 idiomas com bandeiras locais, árabe RTL e tema compartilhado em `factorytoolbox-theme`.
- Sem dependências de runtime, uploads, telemetria ou transmissão dos parâmetros.

## Modelos e limites

O núcleo `mechanics.js` trabalha em mm, N, MPa e graus. Compressão e tração usam `k = G d⁴ / (8 D³ Na)`; a tensão de cisalhamento inclui Wahl. Compressão considera exclusivamente extremidades fechadas e retificadas, `Nt = Na + 2`, `Ls = Nt d`, `p = (L0 - 2d) / Na`. Impede comprimento livre abaixo da altura sólida e curso que alcance o contato total.

Tração considera `F = F0 + k x` após vencer a força inicial. A energia incremental de extensão é `F0 x + k x²/2`; não inclui a energia residual de fabricação. O corpo livre nominal usa `(Na + 1)d`. Ganchos são ilustrativos; resistência e flexibilidade dos ganchos não são calculadas.

Torção usa a relação prática `kθ = E d⁴ / (10.8 D Na × 360)` em N·mm/grau. Não confundir com a relação ideal de viga curva com coeficiente 64 em radianos: a convenção adotada é a da referência de fabricante abaixo. A tensão de flexão usa `Ki = (4C² - C - 1)/(4C(C-1))` e `σ = Ki 32T/(πd³)`. Considera carga no sentido de fechar as espiras. Os braços são ilustrativos e sua flexibilidade não é incluída. O comprimento nominal livre do corpo usa `(Na+1)d`; não calcula crescimento axial nem alteração do diâmetro sob carga.

Os modelos são aproximações lineares de molas de pequeno ângulo de hélice. Não avaliam fadiga, flambagem, temperatura, tolerâncias de fabricação ou conformidade com uma norma de produto. Os avisos de esbeltez e reserva ao contato são triagens geométricas, não verificações de resistência. Espiras ativas entre 1 e 100. Sem tensão admissível fornecida, a resistência aparece como não verificada. A referência ASTM identifica somente o material, sem alegar certificação do projeto.

Valores típicos editáveis de G/E à temperatura ambiente: ASTM A228 (11,5/30 milhões de psi) e inox 302 (11,2/28 milhões de psi). Não se adota uma resistência universal: ela depende do diâmetro, condição e fornecedor.

## Referências

- [Gardner Spring — Spring Design Equations](https://www.gardnerspring.com/wp-content/uploads/2025/10/SpringDesignEquations.pdf): rigidez, comprimento sólido e nomenclatura.
- [Acxess Spring — Compression spring rate](https://www.acxesspring.com/compression-spring-rate.html): rigidez axial e G típico.
- [Acxess Spring — Torsion spring rate](https://www.acxesspring.com/torsion-spring-rate-force-constant.html): coeficiente 10,8 por volta e E típico.
- [Master Spring — Extension resources](https://www.masterspring.com/resources/extension-spring-technical-resources/): corpo livre `d(N+1)`.
- [Acxess Spring — Torsion nomenclature](https://www.acxesspring.com/wire-springs-nomenclature-torsion-springs-nomenclature.html): comprimento nominal do corpo.
- NCEES, FE Reference Handbook, Mechanical Engineering / Springs: fatores de Wahl e de curvatura interna para tensão de flexão.

## Executar e testar

```powershell
python -m http.server 8080
# Em outro terminal (Python, Playwright e Google Chrome instalados):
python tests/test_browser.py
```

O teste confere valores independentes de rigidez, carga, tensão e energia; entradas inválidas; invariância de unidades; downloads SVG/CSV; idiomas, RTL, temas e layout responsivo. Capturas de inspeção ficam somente na pasta temporária do computador.

Código próprio com todos os direitos reservados, conforme LICENSE. Bandeiras e mecanismo de tema reutilizados dos projetos do mesmo autor.
