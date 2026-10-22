const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const multer = require('multer');

// Exercita o Multer real sem executar SQL nem gravar materiais de cursos.
const loadUploadRoute = () => {
  let postHandlers;
  const router = {
    get() {},
    delete() {},
    post(route, ...handlers) { postHandlers = handlers; },
  };
  const dependencies = {
    express: { Router: () => router },
    fs,
    path,
    multer,
    '../db': { query: () => assert.fail('O teste nao deve acessar o banco.'), sql: {} },
    './asyncRoute': () => () => assert.fail('O teste nao deve persistir materiais.'),
  };
  const file = path.join(__dirname, '../routes/materiaisRoutes.js');
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    module: { exports: {} },
    __dirname: path.dirname(file),
    require(name) {
      if (!(name in dependencies)) throw new Error(`Dependencia inesperada: ${name}`);
      return dependencies[name];
    },
  }, { filename: file });
  return postHandlers;
};

// Envia multipart em memoria para reproduzir a rejeicao incorreta do PDF de 8 MB.
const uploadPdf = (size, isAdmin = true) => new Promise((resolve, reject) => {
  const boundary = 'foodsacademy-material-test';
  const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="pdf"; filename="arquivo.pdf"\r\nContent-Type: application/pdf\r\n\r\n`);
  const pdf = Buffer.alloc(size, ' ');
  pdf.write('%PDF-1.4\n');
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const req = Readable.from([header, pdf, footer]);
  req.method = 'POST';
  req.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(header.length + pdf.length + footer.length),
  };
  req.authUser = { isAdmin };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { resolve({ status: this.statusCode, body }); },
  };
  const [requireAdmin, upload] = loadUploadRoute();
  requireAdmin(req, res, () => upload(req, res, (error) => {
    if (error) return reject(error);
    resolve({ status: 200, size: req.file.size });
  }));
});

test('aceita PDF de 8 MB, acima do antigo limite incorreto de 1 MB', async () => {
  const size = 8 * 1024 * 1024;
  assert.deepEqual(await uploadPdf(size), { status: 200, size });
});

test('rejeita PDF de 26 MB e informa o limite de 25 MB', async () => {
  const result = await uploadPdf(26 * 1024 * 1024);
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'PDF maior que o limite de 25MB.');
});

test('mantem a exigencia de administrador no upload', async () => {
  const result = await uploadPdf(1024, false);
  assert.equal(result.status, 403);
});
