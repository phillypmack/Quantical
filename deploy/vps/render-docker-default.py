#!/usr/bin/env python3
"""Renderiza o perfil AppArmor docker-default a partir do template do dockerd.

POR QUE ISTO EXISTE

O perfil `docker-default` não tem arquivo em lugar nenhum do disco: o próprio
dockerd o gera em memória, a partir de um template Go embutido no binário,
grava num arquivo temporário e carrega com apparmor_parser. Por isso não havia
nada para editar.

Nesta VPS há dois dockerds. O do pacote .deb roda UNCONFINED e ganhou a corrida
de boot (carregou o perfil às 06:57:07, antes de o do snap chegar lá). Como o
dockerd faz early-return quando o perfil já está carregado, o do snap nunca o
sobrescreveu. Resultado: `{{.DaemonProfile}}` renderizou como `unconfined` e o
bloco `{{if .SnapSecurityLabel}}` não foi emitido — então o perfil em kernel
NÃO tem `signal (receive) peer=snap.docker.dockerd`.

E quem de fato manda sinal nos containers é o dockerd do snap, que roda
confinado. Daí `docker stop` responder "permission denied" em todo container
do servidor.

A CORREÇÃO

Materializar o perfil em /etc/apparmor.d/docker-default, renderizado a partir
do template do binário do SNAP (o daemon dono dos containers), com
DaemonProfile e SnapSecurityLabel corretos. A substituição de perfil no
AppArmor é atômica e as tarefas já confinadas migram sem reinício — zero
downtime.

A PROVA DE SEGURANÇA

Substituir um perfil vale IMEDIATAMENTE para os 115 processos confinados dos 8
projetos. Um perfil incompleto quebraria tudo de uma vez. Por isso este script
não se limita a renderizar: ele prova que o candidato é um SUPERCONJUNTO do
perfil hoje em vigor. Se toda regra de hoje continuar presente, o novo perfil
não tem como negar nada que hoje é permitido.

Uso:
  render-docker-default.py /snap/docker/current/bin/dockerd /usr/bin/dockerd saida/
"""
import subprocess
import sys
from pathlib import Path

MARCA = "profile {{.Name}} flags="


def extrai_template(binario: str) -> str:
    """Puxa o template do perfil de dentro do binário do dockerd."""
    saida = subprocess.run(
        ["grep", "-aF", "-A250", MARCA, binario],
        capture_output=True,
    ).stdout.decode("utf-8", "replace")
    if MARCA not in saida:
        raise SystemExit(f"template não encontrado em {binario}")

    linhas = []
    for linha in saida.split("\n"):
        linhas.append(linha)
        # O corpo do perfil termina na primeira chave de fechamento na coluna 0.
        if linha == "}":
            break
    else:
        raise SystemExit(f"o template de {binario} não fecha com '}}'")
    return "\n".join(linhas)


def renderiza(corpo: str, nome: str, daemon_profile: str, snap_label: str) -> str:
    """Aplica as substituições do template Go, na mesma semântica do dockerd."""
    # `{{range}}` com um elemento emite corpo uma vez. O texto literal do
    # template é "{{range ...}}\n  {{$value}}\n{{end}}" e o Go produz
    # "\n  #include <abstractions/base>\n".
    corpo = corpo.replace(
        "{{range $value := .InnerImports}}\n  {{$value}}\n{{end}}",
        "\n  #include <abstractions/base>\n",
    )

    if snap_label:
        # `{{if}}` verdadeiro: os dois marcadores somem, o corpo fica.
        corpo = corpo.replace("{{if .SnapSecurityLabel}}", "").replace("{{end}}", "")
    elif "{{if .SnapSecurityLabel}}" in corpo:
        # `{{if}}` falso: marcadores E corpo somem.
        inicio = corpo.index("{{if .SnapSecurityLabel}}")
        fim = corpo.index("{{end}}", inicio) + len("{{end}}")
        corpo = corpo[:inicio] + corpo[fim:]
    # O template do dockerd .deb 29.2.1 simplesmente não tem o bloco do snap —
    # ele é um acréscimo da distribuição do snap. Nesse caso não há o que tirar,
    # e é justamente por isso que o perfil em vigor hoje não traz a regra.

    corpo = corpo.replace("{{.Name}}", nome)
    corpo = corpo.replace("{{.DaemonProfile}}", daemon_profile)
    corpo = corpo.replace("{{.SnapSecurityLabel}}", snap_label)

    if "{{" in corpo:
        sobrou = [l for l in corpo.split("\n") if "{{" in l]
        raise SystemExit("sobrou marcador de template não resolvido:\n" + "\n".join(sobrou))

    # Bloco .Imports, que vem antes do `profile`. Um elemento, mesma semântica.
    return "\n#include <tunables/global>\n\n\n" + corpo + "\n"


def regras(texto: str) -> set:
    """As regras do perfil, sem comentários, sem espaço e sem chaves."""
    saida = set()
    for linha in texto.split("\n"):
        limpa = linha.split("#")[0].strip()
        if not limpa or limpa in ("{", "}"):
            continue
        if limpa.startswith("profile ") or limpa.startswith("include "):
            continue
        saida.add(limpa)
    return saida


def main() -> int:
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    bin_snap, bin_deb, destino_dir = sys.argv[1], sys.argv[2], Path(sys.argv[3])
    destino_dir.mkdir(parents=True, exist_ok=True)

    tpl_snap = extrai_template(bin_snap)
    tpl_deb = extrai_template(bin_deb)

    # ---------------------------------------------------------------------
    # Trava 1: os dois templates têm de ter as MESMAS regras fora as de peer.
    #
    # O perfil em vigor foi renderizado pelo binário .deb (29.2.1) e o
    # candidato sai do binário do snap (29.3.1). Se as versões divergirem numa
    # regra deny ou num allow, o candidato pode ficar mais restritivo sem que
    # ninguém perceba.
    # ---------------------------------------------------------------------
    sem_peer = lambda t: {r for r in regras(t) if "peer=" not in r and "{{" not in r}
    so_no_snap = sem_peer(tpl_snap) - sem_peer(tpl_deb)
    so_no_deb = sem_peer(tpl_deb) - sem_peer(tpl_snap)
    if so_no_snap or so_no_deb:
        print("TRAVA 1 FALHOU: os templates das duas versões divergem.", file=sys.stderr)
        for r in sorted(so_no_deb):
            print(f"  só no .deb (some no candidato!): {r}", file=sys.stderr)
        for r in sorted(so_no_snap):
            print(f"  só no snap (regra nova): {r}", file=sys.stderr)
        return 1
    print(f"trava 1 OK: {len(sem_peer(tpl_snap))} regras não-peer idênticas nas duas versões")

    candidato = renderiza(tpl_snap, "docker-default", "snap.docker.dockerd", "snap.docker.dockerd")
    # O equivalente ao que está carregado agora: template do .deb, daemon
    # unconfined, sem o bloco do snap. Serve de referência e de rollback fiel.
    atual = renderiza(tpl_deb, "docker-default", "unconfined", "")

    # ---------------------------------------------------------------------
    # Trava 2: o candidato precisa ser SUPERCONJUNTO do perfil em vigor.
    #
    # É a prova de que a troca não pode quebrar nada: toda permissão que existe
    # hoje continua existindo. O que muda é só o acréscimo das regras de sinal
    # que o daemon do snap precisa.
    # ---------------------------------------------------------------------
    faltando = regras(atual) - regras(candidato)
    if faltando:
        print("TRAVA 2 FALHOU: o candidato perdeu regras que existem hoje.", file=sys.stderr)
        for r in sorted(faltando):
            print(f"  sumiu: {r}", file=sys.stderr)
        return 1
    ganhou = regras(candidato) - regras(atual)
    print(f"trava 2 OK: superconjunto estrito, {len(ganhou)} regra(s) a mais")
    for r in sorted(ganhou):
        print(f"  nova: {r}")

    # ---------------------------------------------------------------------
    # Trava 3: a regra que resolve o problema tem de estar lá.
    # ---------------------------------------------------------------------
    alvo = 'signal (receive) peer="snap.docker.dockerd",'
    if alvo not in candidato:
        print(f"TRAVA 3 FALHOU: falta {alvo}", file=sys.stderr)
        return 1
    print(f"trava 3 OK: {alvo}")

    # ---------------------------------------------------------------------
    # Trava 4: nada de `abi <...>`.
    #
    # O template não declara abi, e o parser avisa que cai no padrão. Se alguém
    # "consertar" o aviso, as regras de rede passam a ser mediadas de verdade
    # em vez de ignoradas — mudança de comportamento simultânea nos 8 projetos.
    # ---------------------------------------------------------------------
    if any(l.startswith("abi ") for l in candidato.split("\n")):
        print("TRAVA 4 FALHOU: o candidato declara abi", file=sys.stderr)
        return 1
    denies = sum(1 for l in candidato.split("\n") if l.strip().startswith("deny "))
    print(f"trava 4 OK: sem abi, {denies} regras deny preservadas")

    (destino_dir / "docker-default.candidate").write_text(candidato)
    (destino_dir / "docker-default.rollback").write_text(atual)
    (destino_dir / "template-snap.txt").write_text(tpl_snap)
    print(f"\nescritos em {destino_dir}: docker-default.candidate, docker-default.rollback")
    return 0


if __name__ == "__main__":
    sys.exit(main())
