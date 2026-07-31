"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { useProgress } from "./progress-provider";

/**
 * Zerar o progresso.
 *
 * `resetProgress` existia no contexto, com o cuidado do carimbo `resetAt`
 * para o sync não desfazê-lo — e nenhuma tela do site oferecia o botão. O
 * painel dizia "salvo neste dispositivo" sem dar nenhuma forma de limpar.
 *
 * A confirmação é em dois passos e no próprio lugar, sem `confirm()`: um
 * diálogo nativo não pode ser lido por leitor de tela do mesmo jeito nem
 * estilizado, e some do fluxo da página.
 */
export function ZerarProgresso() {
  const { resetProgress, completed, hydrated } = useProgress();
  const [confirmando, setConfirmando] = useState(false);

  // Sem nada feito, não há o que zerar — e o botão só ocuparia espaço.
  if (!hydrated || completed.length === 0) return null;

  if (!confirmando) {
    return (
      <button className="zerar-progresso" onClick={() => setConfirmando(true)} type="button">
        <Trash2 size={13} /> Zerar meu progresso
      </button>
    );
  }

  return (
    <div className="zerar-progresso-confirma" role="group" aria-label="Confirmar zerar progresso">
      <p>
        Isto apaga {completed.length} aula{completed.length === 1 ? "" : "s"} concluída
        {completed.length === 1 ? "" : "s"}, suas notas, sua sequência, seus projetos salvos e o
        que a plataforma aprendeu sobre onde você erra. Não dá para desfazer.
      </p>
      <div>
        <button
          className="zerar-progresso-sim"
          onClick={() => {
            resetProgress();
            setConfirmando(false);
          }}
          type="button"
        >
          Zerar mesmo assim
        </button>
        <button onClick={() => setConfirmando(false)} type="button">
          Cancelar
        </button>
      </div>
    </div>
  );
}
