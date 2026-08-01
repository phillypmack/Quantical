import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { episodios } from "./audio";
import { audiolivroCapitulos } from "./audio/audiolivro";
import { bookChapters, bookPages } from "./book";
import { challenges } from "./challenges";
import { equivocos, equivocosPorId } from "./equivocos";
import { getModuleLessons, getAllLessons, totalLessons, tracks } from "./curriculum";
import { glossary, glossaryById } from "./glossary";
import { getLesson } from "./lessons";
import { notacaoPorId, notacoes } from "./notacao";
import { authoredModules, lessons } from "./lessons";
import { parseQiskit } from "@/lib/quantum/parser";
import { simulateCircuit } from "@/lib/quantum/simulator";
import { validateExercise } from "@/lib/quantum/validator";

/**
 * Trava de conteúdo.
 *
 * É o que torna autoria assistida por IA segura: nenhuma aula ou desafio
 * pode subir com um exercício quebrado, porque a solução de REFERÊNCIA é
 * conferida no CI contra as próprias asserções daquele exercício.
 */

describe("desafios", () => {
  it.each(challenges.map((challenge) => [challenge.id, challenge] as const))(
    "%s: a solução de referência passa nas próprias asserções",
    (_id, challenge) => {
      const result = validateExercise(challenge.exercise.solutionCode, challenge.exercise);
      const failures = result.checks.filter((check) => !check.passed);
      expect(
        result.passed,
        `${result.error?.message ?? ""} ${failures.map((f) => `${f.label}: ${f.detail ?? ""}`).join(" | ")}`,
      ).toBe(true);
    },
  );

  it.each(challenges.map((challenge) => [challenge.id, challenge] as const))(
    "%s: o código inicial NÃO passa (senão o desafio é vazio)",
    (_id, challenge) => {
      expect(validateExercise(challenge.exercise.starterCode, challenge.exercise).passed).toBe(false);
    },
  );

  it.each(challenges.map((challenge) => [challenge.id, challenge] as const))(
    "%s: o código inicial é sintaticamente válido",
    (_id, challenge) => {
      expect(() => parseQiskit(challenge.exercise.starterCode)).not.toThrow();
    },
  );

  it.each(challenges.map((challenge) => [challenge.id, challenge] as const))(
    "%s: tem escada de dicas e o número de qubits declarado bate",
    (_id, challenge) => {
      expect(challenge.exercise.hints.length).toBeGreaterThanOrEqual(3);
      for (const hint of challenge.exercise.hints) expect(hint.trim().length).toBeGreaterThan(10);
      expect(parseQiskit(challenge.exercise.solutionCode).qubits).toBe(challenge.exercise.qubits);
    },
  );

  it("os ids são únicos", () => {
    const ids = challenges.map((challenge) => challenge.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda trilha citada existe", () => {
    const trackIds = new Set(tracks.map((track) => track.id));
    for (const challenge of challenges) expect(trackIds.has(challenge.trackId)).toBe(true);
  });
});

describe("glossário", () => {
  it("os ids são únicos", () => {
    const ids = glossary.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo seeAlso aponta para um termo existente", () => {
    for (const entry of glossary) {
      for (const reference of entry.seeAlso ?? []) {
        expect(glossaryById.has(reference), `${entry.id} → ${reference}`).toBe(true);
      }
    }
  });

  it("nenhum termo está vazio", () => {
    for (const entry of glossary) {
      expect(entry.term.trim().length).toBeGreaterThan(1);
      expect(entry.definition.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("aulas escritas", () => {
  const authored = lessons.map((lesson) => [lesson.id, lesson] as const);

  it.each(authored)("%s: o id casa com o formato do currículo", (id, lesson) => {
    expect(id).toBe(`${lesson.trackId}/${lesson.moduleId}/${lesson.stage}`);
    expect(getAllLessons().some((item) => item.id === id)).toBe(true);
  });

  it.each(authored)("%s: todo glossaryRefs resolve", (_id, lesson) => {
    for (const reference of lesson.glossaryRefs) {
      expect(glossaryById.has(reference), reference).toBe(true);
    }
  });

  it.each(authored)("%s: toda metáfora tem ilustração acessível e arquivos válidos", (_id, lesson) => {
    for (const block of lesson.blocks) {
      if (block.kind !== "metaphor") continue;

      expect(block.ilustracao.alt.trim().length).toBeGreaterThan(20);

      const caminho = resolve("public", block.ilustracao.src.replace(/^\/+/, ""));
      expect(existsSync(caminho), caminho).toBe(true);

      // O formato é conferido pelos BYTES, não pela extensão. Quatro arquivos
      // já chegaram nomeados .png sendo JPEG por dentro: o navegador farejava
      // e exibia, mas o nginx anunciava image/png pelo nome — mentira que só
      // aparece quando algum cache ou processador de imagem acredita nela.
      const cabecalho = readFileSync(caminho).subarray(0, 12);
      const ehWebp =
        cabecalho.subarray(0, 4).toString() === "RIFF" &&
        cabecalho.subarray(8, 12).toString() === "WEBP";
      expect(ehWebp, `${caminho} não é WebP de verdade`).toBe(true);
    }
  });

  it.each(authored)("%s: toda pergunta tem uma correta e explicação em todas", (_id, lesson) => {
    for (const question of lesson.quiz) {
      expect(question.options.filter((option) => option.correct)).toHaveLength(1);
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      for (const option of question.options) {
        expect(option.explanation.trim().length, `${question.id}: ${option.text}`).toBeGreaterThan(20);
      }
    }
  });

  it.each(authored)("%s: todo circuito embutido simula sem erro", (_id, lesson) => {
    for (const block of lesson.blocks) {
      if (block.kind === "metaphor" || block.kind === "figure") {
        expect(() => simulateCircuit(block.circuit)).not.toThrow();
      }
      if (block.kind === "code" && block.language === "python") {
        expect(() => parseQiskit(block.code)).not.toThrow();
      }
    }
  });

  // A garantia central: nenhuma aula sobe com exercício quebrado, porque a
  // solução de referência é conferida contra as próprias asserções.
  it.each(authored.filter(([, lesson]) => lesson.exercise))(
    "%s: a solução de referência do exercício passa",
    (_id, lesson) => {
      const result = validateExercise(lesson.exercise!.solutionCode, lesson.exercise!);
      expect(result.passed, result.error?.message).toBe(true);
      expect(validateExercise(lesson.exercise!.starterCode, lesson.exercise!).passed).toBe(false);
      expect(lesson.exercise!.hints.length).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(authored.filter(([, lesson]) => lesson.guided))(
    "%s: todo passo do roteiro simula e tem revelação",
    (_id, lesson) => {
      for (const step of lesson.guided!.steps) {
        expect(() => simulateCircuit(step.circuit)).not.toThrow();
        expect(step.reveal.trim().length).toBeGreaterThan(40);
        expect(step.instruction.trim().length).toBeGreaterThan(20);
        for (const branch of step.branches ?? []) {
          expect(() => simulateCircuit(branch.circuit)).not.toThrow();
          expect(branch.reveal.trim().length).toBeGreaterThan(40);
        }
        // Toda previsão precisa citar estados que o circuito realmente produz.
        for (const state of step.predict?.states ?? []) {
          expect(state.length).toBe(step.circuit.qubits);
        }
      }
    },
  );

  it("um módulo escrito tem exatamente as três etapas", () => {
    for (const key of authoredModules) {
      const stages = lessons.filter((lesson) => `${lesson.trackId}/${lesson.moduleId}` === key);
      expect(stages.map((lesson) => lesson.stage).sort()).toEqual(["desafio", "experimento", "teoria"]);
    }
  });
});

describe("taxonomia de equívocos", () => {
  it("os ids são únicos", () => {
    const ids = equivocos.map((equivoco) => equivoco.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(equivocos.map((e) => [e.id, e] as const))(
    "%s: a demolição aponta para uma aula que existe",
    (_id, equivoco) => {
      const licao = lessons.find((item) => item.id === equivoco.demolicao.licaoId);
      expect(licao, equivoco.demolicao.licaoId).toBeDefined();

      // Se cita um passo, ele precisa existir no roteiro guiado daquela aula.
      if (equivoco.demolicao.passoId) {
        const passos = licao!.guided?.steps ?? [];
        const ids = passos.map((passo) => passo.id);
        expect(ids, `${equivoco.id} -> ${equivoco.demolicao.passoId}`).toContain(
          equivoco.demolicao.passoId,
        );
      }
    },
  );

  it.each(equivocos.map((e) => [e.id, e] as const))(
    "%s: os conceitos resolvem no glossário",
    (_id, equivoco) => {
      expect(equivoco.conceitos.length).toBeGreaterThan(0);
      for (const conceito of equivoco.conceitos) {
        expect(glossaryById.has(conceito), `${equivoco.id} -> ${conceito}`).toBe(true);
      }
    },
  );

  it.each(equivocos.map((e) => [e.id, e] as const))(
    "%s: nome e explicação têm substância",
    (_id, equivoco) => {
      expect(equivoco.nome.trim().length).toBeGreaterThan(15);
      // A explicação precisa dizer por que PARECE certo e onde falha.
      expect(equivoco.explicacao.trim().length).toBeGreaterThan(120);
    },
  );

  it("todo equívoco citado no conteúdo existe na taxonomia", () => {
    const citados = new Set<string>();
    for (const licao of lessons) {
      for (const questao of licao.quiz) {
        for (const opcao of questao.options) {
          if (opcao.equivoco) citados.add(opcao.equivoco);
        }
      }
      for (const passo of licao.guided?.steps ?? []) {
        for (const escolha of passo.predict?.choices ?? []) {
          if (escolha.equivoco) citados.add(escolha.equivoco);
        }
      }
    }
    for (const id of citados) {
      expect(equivocosPorId.has(id), id).toBe(true);
    }
  });

  it("um equívoco só é marcado em alternativa ERRADA", () => {
    for (const licao of lessons) {
      for (const questao of licao.quiz) {
        for (const opcao of questao.options) {
          if (opcao.correct) {
            expect(opcao.equivoco, `${licao.id}/${questao.id}: "${opcao.text}"`).toBeUndefined();
          }
        }
      }
    }
  });

  it.each(lessons.map((licao) => [licao.id, licao] as const))(
    "%s: os conceitos declarados nas perguntas resolvem",
    (_id, licao) => {
      for (const questao of licao.quiz) {
        for (const conceito of questao.conceitos ?? []) {
          expect(glossaryById.has(conceito), `${questao.id} -> ${conceito}`).toBe(true);
        }
      }
    },
  );
});

describe("episódios de áudio", () => {
  const catalogo = episodios.map((episodio) => [episodio.id, episodio] as const);

  it("todo episódio aponta para um módulo do currículo", () => {
    const modulos = new Set(
      tracks.flatMap((track) => track.modules.map((modulo) => `${track.id}/${modulo.id}`)),
    );
    for (const episodio of episodios) {
      expect(modulos.has(episodio.id), episodio.id).toBe(true);
      expect(episodio.id).toBe(`${episodio.trackId}/${episodio.moduleId}`);
    }
  });

  it.each(catalogo)("%s: os tempos da transcrição são crescentes", (_id, episodio) => {
    let anterior = -1;
    for (const turno of episodio.turnos) {
      expect(turno.at).toBeGreaterThanOrEqual(anterior);
      expect(turno.fim).toBeGreaterThan(turno.at);
      anterior = turno.at;
    }
  });

  it.each(catalogo)("%s: nenhuma fala começa depois do fim do áudio", (_id, episodio) => {
    // Um tempo maior que a duração deixaria o destaque da transcrição preso.
    for (const turno of episodio.turnos) {
      expect(turno.at).toBeLessThanOrEqual(episodio.duracao + 1);
    }
  });

  it.each(catalogo)("%s: as duas vozes aparecem e se alternam", (_id, episodio) => {
    const vozes = new Set(episodio.turnos.map((turno) => turno.voz));
    expect(vozes.size).toBe(2);
    let seguidas = 1;
    for (let i = 1; i < episodio.turnos.length; i += 1) {
      seguidas = episodio.turnos[i].voz === episodio.turnos[i - 1].voz ? seguidas + 1 : 1;
      // Três falas seguidas da mesma voz viram monólogo.
      expect(seguidas, `${episodio.id} na fala ${i}`).toBeLessThan(3);
    }
  });

  it.each(catalogo)("%s: a transcrição tem texto de verdade", (_id, episodio) => {
    expect(episodio.turnos.length).toBeGreaterThanOrEqual(20);
    for (const turno of episodio.turnos) {
      expect(turno.texto.trim().length).toBeGreaterThan(15);
    }
    expect(episodio.resumo.trim().length).toBeGreaterThan(20);
  });

  it.each(catalogo)("%s: o mp3 existe no disco", (_id, episodio) => {
    // `media/audio` fica fora do build: os episódios sobem por deploy-audio.sh.
    const arquivo = resolve(process.cwd(), "media/audio", episodio.src.replace("/audio/", ""));
    expect(existsSync(arquivo), arquivo).toBe(true);
  });
});

describe("currículo", () => {
  it("todo módulo tem exatamente três estágios", () => {
    for (const track of tracks) {
      for (const courseModule of track.modules) {
        expect(getModuleLessons(track.id, courseModule.id)).toHaveLength(3);
      }
    }
  });

  it("totalLessons bate com o que é realmente gerado", () => {
    expect(getAllLessons()).toHaveLength(totalLessons);
  });

  it("os ids de módulo são únicos dentro da trilha", () => {
    for (const track of tracks) {
      const ids = track.modules.map((module) => module.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("notação: nada aparece sem ter sido apresentado", () => {
  /**
   * A trava que faltava.
   *
   * A primeira aula declarava como objetivo "Ler a notação |0⟩, |1⟩ e
   * α|0⟩ + β|1⟩", usava a notação no terceiro parágrafo e não ensinava a ler
   * em lugar nenhum. `|0⟩` aparecia em 17 das 18 aulas e nunca era
   * pronunciado. Um aluno teve de sair da plataforma para perguntar a outra
   * ferramenta o que aquilo queria dizer.
   *
   * Nenhum teste podia pegar isso porque nenhum teste sabia o que era
   * "notação". Agora sabe.
   */
  const ordem = getAllLessons().map((item) => item.id);

  /** Todo o texto visível de uma aula, incluindo fórmulas e legendas. */
  const textoDaAula = (licaoId: string) => {
    const licao = getLesson(licaoId);
    if (!licao) return "";
    const partes: string[] = [licao.title, licao.summary, ...licao.objectives];
    for (const bloco of licao.blocks) {
      if ("text" in bloco && bloco.text) partes.push(bloco.text);
      if ("latex" in bloco && bloco.latex) partes.push(bloco.latex);
      if ("caption" in bloco && bloco.caption) partes.push(bloco.caption);
      if ("items" in bloco && bloco.items) partes.push(...bloco.items);
      if ("title" in bloco && bloco.title) partes.push(bloco.title);
    }
    for (const pergunta of licao.quiz) {
      partes.push(pergunta.prompt);
      for (const opcao of pergunta.options) partes.push(opcao.text, opcao.explanation);
    }
    for (const passo of licao.guided?.steps ?? []) {
      partes.push(passo.instruction, passo.reveal);
      if (passo.predict) partes.push(passo.predict.question);
    }
    if (licao.exercise) partes.push(licao.exercise.prompt, ...licao.exercise.hints);
    return partes.join("\n");
  };

  const casa = (padrao: RegExp, texto: string) => new RegExp(padrao.source, "u").test(texto);

  it("os ids são únicos", () => {
    const ids = notacoes.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("nenhum símbolo aparece numa aula ANTERIOR à que o apresenta", () => {
    // Este é o defeito, dito em código: usar um símbolo como se ele já fosse
    // conhecido. Se alguém escrever |ψ⟩ numa aula antes da que o apresenta, o
    // teste falha e diz exatamente onde.
    for (const item of notacoes) {
      if (!item.estreia) continue;
      const limite = ordem.indexOf(item.estreia);
      expect(limite, `estreia de ${item.id} não é uma aula real`).toBeGreaterThanOrEqual(0);

      for (const licaoId of ordem.slice(0, limite)) {
        expect(
          casa(item.padrao, textoDaAula(licaoId)),
          `${item.simbolo} (${item.id}) aparece em ${licaoId}, antes de ser apresentado em ${item.estreia}`,
        ).toBe(false);
      }
    }
  });

  it("o símbolo realmente aparece na aula onde diz estrear", () => {
    // Sem isto, uma declaração de estreia envelhece calada: a aula é
    // reescrita, o símbolo sai, e a trava passa a proteger nada.
    for (const item of notacoes) {
      if (!item.estreia) continue;
      expect(
        casa(item.padrao, textoDaAula(item.estreia)),
        `${item.simbolo} declara estrear em ${item.estreia}, mas não aparece lá`,
      ).toBe(true);
    }
  });

  it("toda OCORRÊNCIA de símbolo tem como ser lida quando aparece", () => {
    // A varredura que revelou o problema, agora permanente — e por ocorrência,
    // não por aula. Perguntar "algum símbolo é explicado aqui?" deixaria
    // passar uma aula que explica |1⟩ e usa |ψ⟩ sem nunca apresentá-lo.
    const FAMILIAS = [
      { nome: "ket", padrao: /\|[^⟩|\s]{0,6}⟩/gu },
      { nome: "letra grega", padrao: /[αβψφθλ]/gu },
      { nome: "raiz", padrao: /√/gu },
      { nome: "produto tensorial", padrao: /⊗/gu },
      { nome: "adaga", padrao: /†/gu },
    ];

    for (const licaoId of ordem) {
      const texto = textoDaAula(licaoId);
      const ate = notacoes.filter(
        (item) => item.estreia !== undefined && ordem.indexOf(item.estreia) <= ordem.indexOf(licaoId),
      );

      for (const familia of FAMILIAS) {
        for (const encontrado of texto.match(familia.padrao) ?? []) {
          const legivel = ate.some((item) => casa(item.padrao, encontrado));
          expect(
            legivel,
            `"${encontrado}" aparece em ${licaoId} e o aluno não tem onde ler esse símbolo`,
          ).toBe(true);
        }
      }
    }
  });

  it("a leitura em voz alta existe e não repete o símbolo", () => {
    // "|0⟩ lê-se |0⟩" não ensina nada. A leitura tem de ser pronunciável.
    for (const item of notacoes) {
      expect(item.leitura.length, item.id).toBeGreaterThan(1);
      expect(/[|⟩⟨α-ω√⊗†²]/u.test(item.leitura), `${item.id}: a leitura contém símbolo`).toBe(false);
    }
  });

  it("a explicação não se apoia no próprio símbolo nem é curta demais", () => {
    // O glossário definia ket como "vetor de estado representado por |ψ⟩ na
    // notação de Dirac" — circular e inútil para quem não sabe ler |ψ⟩.
    for (const item of notacoes) {
      expect(item.oQueE.length, item.id).toBeGreaterThan(80);
      expect(item.porQue.length, item.id).toBeGreaterThan(80);
      expect(item.oQueE.startsWith(item.simbolo), `${item.id}: definição circular`).toBe(false);
    }
  });

  it("todo vejaTambem aponta para um símbolo que existe", () => {
    for (const item of notacoes) {
      for (const outro of item.vejaTambem ?? []) {
        expect(notacaoPorId.has(outro), `${item.id} -> ${outro}`).toBe(true);
      }
    }
  });
});

describe("audiolivro: o capítulo narrado casa com o livro escrito", () => {
  /**
   * O audiolivro é gerado capítulo a capítulo ao longo de onze horas de
   * síntese, então esta suíte precisa passar tanto com zero capítulos quanto
   * com os 24. O que ela trava é a coerência do que JÁ existe — não a
   * completude, que é estado de andamento e não defeito.
   */
  const catalogo = audiolivroCapitulos.map((cap) => [`ch${cap.numero}`, cap] as const);

  it("todo capítulo narrado existe no livro", () => {
    const doLivro = new Set(bookChapters.map((item) => item.number));
    for (const capitulo of audiolivroCapitulos) {
      expect(doLivro.has(capitulo.numero), `capítulo ${capitulo.numero}`).toBe(true);
    }
  });

  it("não há capítulo narrado duas vezes", () => {
    const numeros = audiolivroCapitulos.map((cap) => cap.numero);
    expect(new Set(numeros).size).toBe(numeros.length);
  });

  it.each(catalogo)("%s: os tempos da transcrição são crescentes", (_id, capitulo) => {
    let anterior = -1;
    for (const turno of capitulo.turnos) {
      expect(turno.at).toBeGreaterThanOrEqual(anterior);
      expect(turno.fim).toBeGreaterThanOrEqual(turno.at);
      anterior = turno.at;
    }
  });

  it.each(catalogo)("%s: toda página do capítulo tem um ponto de entrada", (_id, capitulo) => {
    // É esta a promessa do player: abrir a página e ouvir a partir dela. Uma
    // página sem marca cairia no início do capítulo, calada.
    const paginas = bookPages
      .filter((pagina) => pagina.chapter === capitulo.numero)
      .map((pagina) => pagina.number);

    for (const numero of paginas) {
      expect(capitulo.paginas[numero], `página ${numero}`).toBeTypeOf("number");
    }
  });

  it.each(catalogo)("%s: os pontos de entrada crescem com a página", (_id, capitulo) => {
    const entradas = Object.entries(capitulo.paginas)
      .map(([pagina, segundo]) => ({ pagina: Number(pagina), segundo }))
      .sort((a, b) => a.pagina - b.pagina);

    for (let i = 1; i < entradas.length; i += 1) {
      expect(entradas[i].segundo, `página ${entradas[i].pagina}`).toBeGreaterThanOrEqual(
        entradas[i - 1].segundo,
      );
    }
  });

  it.each(catalogo)("%s: nenhum ponto de entrada cai depois do fim do áudio", (_id, capitulo) => {
    for (const [pagina, segundo] of Object.entries(capitulo.paginas)) {
      expect(segundo, `página ${pagina}`).toBeLessThanOrEqual(capitulo.duracao);
    }
  });

  it.each(catalogo)("%s: as duas vozes aparecem", (_id, capitulo) => {
    // Nina narra, Téo lê as notas científicas. Se uma sumir, a fronteira entre
    // ficção e verificação deixou de ser audível — que é o ponto do desenho.
    const vozes = new Set(capitulo.turnos.map((turno) => turno.voz));
    expect(vozes.has("nina"), "nina").toBe(true);
    expect(vozes.has("teo"), "teo").toBe(true);
  });
});
