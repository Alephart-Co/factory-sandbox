// Pruebas del gate factory-verdict: ejecutan el script del workflow tal como está en
// .github/workflows/factory-verdict.yml, con la API de GitHub simulada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/factory-verdict.yml', import.meta.url), 'utf8');

// Extrae el bloque `script: |` (YAML literal) sin dependencias: las líneas con más sangría que la clave.
function extractScript(yaml) {
  const lines = yaml.split('\n');
  const start = lines.findIndex(line => /^\s*script:\s*\|\s*$/.test(line));
  assert.ok(start >= 0, 'el workflow no tiene un bloque script: |');
  const keyIndent = lines[start].search(/\S/);
  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && line.search(/\S/) <= keyIndent) break;
    block.push(line);
  }
  const indent = Math.min(...block.filter(l => l.trim()).map(l => l.search(/\S/)));
  return block.map(l => l.slice(indent)).join('\n');
}

const script = extractScript(workflow);
const runScript = new Function('github', 'context', 'core', 'process', `return (async () => {\n${script}\n})();`);

const BOT = 'agenttic-factory[bot]';
const [A, B, C] = ['a', 'b', 'c'].map(c => c.repeat(40));
const PERMISSIONS = { alephart: 'admin', nicole: 'write', lector: 'read' };

const verdict = (kind, sha, at) => ({
  user: { login: BOT }, created_at: at, updated_at: at, body: `Verdict: ${kind}\nReviewed head: ${sha}`,
});
const review = (login, commitId, state = 'APPROVED', type = 'User') => ({ user: { login, type }, commit_id: commitId, state });
const twoRounds = [verdict('request changes', A, '1'), verdict('request changes', B, '2')];

async function evaluate({ head, comments = [], author = { login: BOT, type: 'Bot' }, files = [{ filename: 'src/money.js' }],
  reviews = [], permissionFails = false }) {
  let status;
  const pages = { files, reviews, comments };
  const github = {
    paginate: async endpoint => pages[endpoint],
    rest: {
      pulls: { get: async () => ({ data: { user: author, head: { sha: head } } }), listFiles: 'files', listReviews: 'reviews' },
      issues: { listComments: 'comments' },
      repos: {
        createCommitStatus: async ({ state, description }) => { status = { state, description }; },
        getCollaboratorPermissionLevel: async ({ username }) => {
          if (permissionFails) throw new Error('403');
          return { data: { permission: PERMISSIONS[username] ?? 'none' } };
        },
      },
    },
  };
  const context = { repo: { owner: 'o', repo: 'r' }, payload: { pull_request: { number: 1 } } };
  const core = { setFailed: message => { status = { state: 'setFailed', description: message }; } };
  await runScript(github, context, core, { env: { FACTORY_BOT_LOGIN: BOT, MAX_ROUNDS: '2' } });
  return status;
}

test('factory-verdict: un PR de persona pasa sin veredicto', async () => {
  const s = await evaluate({ head: A, author: { login: 'alephart', type: 'User' } });
  assert.equal(s.state, 'success');
});

test('factory-verdict: un PR de otro bot queda en rojo', async () => {
  const s = await evaluate({ head: A, author: { login: 'agenttic-factory-dev[bot]', type: 'Bot' } });
  assert.equal(s.state, 'failure');
  assert.match(s.description, /bot no autorizado/);
});

test('factory-verdict: un PR del bot que toca .github/ queda en rojo', async () => {
  const s = await evaluate({ head: A, comments: [verdict('approve', A, '1')], files: [{ filename: '.github/workflows/x.yml' }] });
  assert.equal(s.state, 'failure');
});

test('factory-verdict: approve sobre el head pasa con menos de 2 rondas', async () => {
  assert.equal((await evaluate({ head: A, comments: [verdict('approve', A, '1')] })).state, 'success');
  const oneRound = await evaluate({ head: B, comments: [verdict('request changes', A, '1'), verdict('approve', B, '2')] });
  assert.equal(oneRound.state, 'success');
  assert.match(oneRound.description, /1 ronda/);
});

test('factory-verdict: sin veredicto sobre el head queda pendiente; un veredicto editado no cuenta', async () => {
  assert.equal((await evaluate({ head: B, comments: [verdict('approve', A, '1')] })).state, 'pending');
  assert.equal((await evaluate({ head: A, comments: [{ ...verdict('approve', A, '1'), updated_at: '2' }] })).state, 'pending');
});

test('factory-verdict: request changes sobre el head queda en rojo', async () => {
  assert.equal((await evaluate({ head: A, comments: [verdict('request changes', A, '1')] })).state, 'failure');
});

test('factory-verdict: a las 2 rondas sin approve escala a una persona', async () => {
  const s = await evaluate({ head: C, comments: twoRounds });
  assert.equal(s.state, 'failure');
  assert.match(s.description, /escalar a una persona/);
});

test('factory-verdict: a las 2 rondas el approve de la Factory solo no basta', async () => {
  const s = await evaluate({ head: C, comments: [...twoRounds, verdict('approve', C, '3')] });
  assert.equal(s.state, 'pending');
  assert.match(s.description, /falta la aprobación de una persona/);
});

test('factory-verdict: a las 2 rondas pasa con approve de la Factory y de una persona con escritura sobre el head', async () => {
  const comments = [...twoRounds, verdict('approve', C, '3')];
  for (const login of ['alephart', 'nicole']) {
    const s = await evaluate({ head: C, comments, reviews: [review(login, C)] });
    assert.equal(s.state, 'success');
    assert.match(s.description, new RegExp(`@${login}`));
  }
});

test('factory-verdict: no cuentan reviews de otro commit, de solo lectura, de bots ni pedidos de cambios', async () => {
  const comments = [...twoRounds, verdict('approve', C, '3')];
  const notCounting = [
    review('alephart', B), review('lector', C), review('otro[bot]', C, 'APPROVED', 'Bot'), review('alephart', C, 'CHANGES_REQUESTED'),
  ];
  for (const r of notCounting) {
    assert.equal((await evaluate({ head: C, comments, reviews: [r] })).state, 'pending');
  }
});

test('factory-verdict: a las 2 rondas una persona sola no reemplaza el approve de la Factory', async () => {
  const s = await evaluate({ head: C, comments: twoRounds, reviews: [review('alephart', C)] });
  assert.equal(s.state, 'failure');
});

test('factory-verdict: si no se puede verificar el permiso queda pendiente', async () => {
  const s = await evaluate({ head: C, comments: [...twoRounds, verdict('approve', C, '3')], reviews: [review('alephart', C)],
    permissionFails: true });
  assert.equal(s.state, 'pending');
  assert.match(s.description, /no se pudo verificar/);
});
