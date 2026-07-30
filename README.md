# Quantical

Plataforma brasileira de ensino de programação quântica. O projeto reúne 54 aulas em
três trilhas, simulador statevector local, editor de um subconjunto Qiskit, desafios,
progresso e projetos salvos.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Supabase opcional

Sem variáveis de ambiente, a Quantical funciona em modo local e salva os dados no
navegador. Para autenticação, sincronização e provedores sociais:

1. Crie um projeto Supabase e execute `supabase/schema.sql`.
2. Copie `.env.example` para `.env.local` e informe a URL e a chave pública.
3. Ative os provedores desejados no painel de autenticação e adicione a URL publicada
   à lista de redirecionamentos.

Ao entrar, o progresso e os projetos locais são mesclados com a conta.

## Simulador

O laboratório executa até seis qubits em um Web Worker. As portas disponíveis são
H, X, Y, Z, S, T, RX, RY, RZ, CNOT, CZ e SWAP. O parser aceita a construção
`QuantumCircuit(n)` e chamadas equivalentes a essas portas; código Python arbitrário
não é executado.
