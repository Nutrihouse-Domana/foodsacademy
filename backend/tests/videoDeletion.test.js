const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');

// Isola o SQL e a autenticacao: os testes nunca acessam o banco nem os MP4 reais.
const load = (file, dependencies, dirname = path.dirname(file)) => {
  const context = { module: { exports: {} }, __dirname: dirname, require: (name) => {
    if (!(name in dependencies)) throw new Error('Dependencia inesperada: ' + name);
    return dependencies[name];
  }};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return context.module.exports;
};
const serviceFile = path.join(__dirname, '../services/videoService.js');
const repositoryFile = path.join(__dirname, '../repositories/videoRepository.js');
const fixtureVideo = { id: 7, id_modulo: 3, titulo: 'Aula', url: '/curso/modulo/aula.mp4', curso_caminho: 'curso', modulo_caminho: 'curso/modulo' };

const fixture = (t, video = fixtureVideo, fileSystem = fs) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foodsacademy-video-test-'));
  t.after(() => {
    // Confere o destino antes de limpar somente a pasta temporaria deste teste.
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('foodsacademy-video-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const service = load(serviceFile, { fs: fileSystem, path, '../repositories/videoRepository': {
    deleteById: async (id, removeFile) => { assert.equal(id, 7); await removeFile(video); return video; },
  } }, path.join(root, 'backend/services'));
  const file = path.join(root, 'videos_cursos/curso/modulo/aula.mp4');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'MP4 de teste');
  return { service, file, root };
};

test('exclui o arquivo local na pasta do modulo', async (t) => {
  const { service, file } = fixture(t);
  assert.equal((await service.deleteVideo(7)).id, 7);
  assert.equal(fs.existsSync(file), false);
});
test('aceita arquivo ja ausente', async (t) => {
  const { service, file } = fixture(t);
  fs.unlinkSync(file);
  await service.deleteVideo(7);
});
test('link externo nao remove arquivo local', async (t) => {
  const { service, file } = fixture(t, { ...fixtureVideo, url: 'https://example.com/aula.mp4' });
  await service.deleteVideo(7);
  assert.equal(fs.existsSync(file), true);
});
test('recusa pasta invalida', async (t) => {
  const { service, file } = fixture(t, { ...fixtureVideo, curso_caminho: '' });
  await assert.rejects(service.deleteVideo(7), /Caminho/);
  assert.equal(fs.existsSync(file), true);
});
test('propaga erro de permissao ao remover arquivo', async (t) => {
  const fileSystem = { promises: { realpath: fs.promises.realpath, unlink: async () => { throw Object.assign(new Error('sem permissao'), { code: 'EACCES' }); } } };
  const { service, file } = fixture(t, fixtureVideo, fileSystem);
  await assert.rejects(service.deleteVideo(7), { code: 'EACCES' });
  assert.equal(fs.existsSync(file), true);
});
test('recusa caminho real que sai da pasta de videos', async (t) => {
  let calls = 0;
  const fileSystem = { promises: { realpath: async (p) => ++calls === 1 ? p : path.join(os.tmpdir(), 'fora.mp4'), unlink: async () => assert.fail('nao deve remover') } };
  const { service } = fixture(t, fixtureVideo, fileSystem);
  await assert.rejects(service.deleteVideo(7), /fora da pasta/);
});
test('resolve video legado pelo titulo e curso sem modulo', async (t) => {
  const { service, root } = fixture(t, { ...fixtureVideo, id_modulo: null, url: null });
  const file = path.join(root, 'videos_cursos/curso/Aula.mp4');
  fs.writeFileSync(file, 'MP4 legado');
  await service.deleteVideo(7);
  assert.equal(fs.existsSync(file), false);
});

const repository = ({ missing = false, sqlFailure = false } = {}) => {
  const events = [];
  class Transaction {
    async begin() { events.push('begin'); }
    async commit() { events.push('commit'); }
    async rollback() { events.push('rollback'); }
  }
  class Request {
    input(name, type, value) { assert.equal(name, 'id'); assert.equal(value, 7); return this; }
    async query(text) {
      assert.match(text, /@id/);
      if (text.startsWith('SELECT')) { events.push('select'); return { recordset: missing ? [] : [fixtureVideo] }; }
      events.push('delete');
      if (sqlFailure) throw new Error('restricao SQL');
      return { recordset: [] };
    }
  }
  return { events, repo: load(repositoryFile, { '../db': { sql: { connect: async () => ({}), Transaction, Request, Int: 'Int' }, dbConfig: {} } }) };
};
test('confirma SQL somente depois de excluir arquivo', async () => {
  const { repo, events } = repository();
  await repo.deleteById(7, async () => events.push('unlink'));
  assert.deepEqual(events, ['begin', 'select', 'delete', 'unlink', 'commit']);
});
test('falha de arquivo reverte exclusao SQL', async () => {
  const { repo, events } = repository();
  await assert.rejects(repo.deleteById(7, async () => { throw new Error('arquivo bloqueado'); }), /bloqueado/);
  assert.equal(events.at(-1), 'rollback');
  assert.ok(!events.includes('commit'));
});
test('restricao SQL preserva arquivo', async () => {
  const { repo, events } = repository({ sqlFailure: true });
  await assert.rejects(repo.deleteById(7, async () => assert.fail('nao deve remover')), /SQL/);
  assert.equal(events.at(-1), 'rollback');
});
test('ID inexistente nao tenta remover arquivo', async () => {
  const { repo } = repository({ missing: true });
  assert.equal(await repo.deleteById(7, async () => assert.fail('nao deve remover')), null);
});

const route = (deleteVideo) => {
  const routes = [];
  const router = { get() {}, put() {}, delete: (...args) => routes.push(args) };
  const multer = () => ({ single: () => () => {} });
  multer.memoryStorage = () => ({});
  load(path.join(__dirname, '../routes/videosRoutes.js'), {
    express: { Router: () => router }, fs, path, multer,
    '../db': {}, './asyncRoute': (_, handler) => handler,
    '../services/videoService': { deleteVideo },
  });
  return routes[0];
};
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
test('rota restringe exclusao a administrador', () => {
  const [url, guard] = route(() => assert.fail('nao deve excluir'));
  assert.equal(url, '/videos/:id');
  const res = response();
  guard({ authUser: { isAdmin: false } }, res, () => assert.fail('nao deve autorizar'));
  assert.equal(res.statusCode, 403);
});
test('rota valida ID e informa registro ausente', async () => {
  const [, , handler] = route(async () => null);
  for (const id of ['0', '-1', 'abc', '1.2', '2147483648']) {
    const res = response();
    await handler({ params: { id } }, res);
    assert.equal(res.statusCode, 400);
  }
  const res = response();
  await handler({ params: { id: '7' } }, res);
  assert.equal(res.statusCode, 404);
});
test('rota retorna ID excluido', async () => {
  const [, guard, handler] = route(async (id) => ({ id }));
  let allowed = false;
  guard({ authUser: { isAdmin: true } }, response(), () => { allowed = true; });
  assert.equal(allowed, true);
  const res = response();
  await handler({ params: { id: '7' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, 7);
});
