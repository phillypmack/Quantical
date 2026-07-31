import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { episodios } from "./audio";
import { challenges } from "./challenges";
import { getModuleLessons, getAllLessons, totalLessons, tracks } from "./curriculum";
import { glossary, glossaryById } from "./glossary";
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
