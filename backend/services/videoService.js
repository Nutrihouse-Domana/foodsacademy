const fs = require('fs');
const path = require('path');
const videoRepository = require('../repositories/videoRepository');
const videosCursosDir = path.join(__dirname, '..', '..', 'videos_cursos');

// Compartilha a resolucao da pasta com o upload e a substituicao de videos.
const normalizePathParts = (value) =>
  String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => path.basename(part.trim()))
    .filter((part) => part && part !== '.' && part !== '..');

const sanitizeFolderName = (value) =>
  String(value || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');

const getModuloFolderName = (video) => {
  const caminhoParts = normalizePathParts(video.modulo_caminho);

  return caminhoParts[caminhoParts.length - 1] || sanitizeFolderName(video.modulo_titulo);
};

const buildVideoDirectory = (video) => {
  const coursePathParts = normalizePathParts(video.curso_caminho);
  const moduloFolder = video.id_modulo ? getModuloFolderName(video) : '';

  if (!coursePathParts.length || (video.id_modulo && !moduloFolder)) return null;

  const relativeParts = moduloFolder ? [...coursePathParts, moduloFolder] : coursePathParts;

  return {
    fullPath: path.join(videosCursosDir, ...relativeParts),
    relativeParts,
  };
};

// Confere tambem o caminho real para impedir exclusao fora da pasta de videos.
const isInside = (root, target) => {
  const relative = path.relative(root, target);
  return relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};

const removeVideoFile = async (video) => {
  if (/^https?:\/\//i.test(String(video.url || ''))) return;
  const directory = buildVideoDirectory(video);
  const storedName = String(video.url || '').replace(/\\/g, '/');
  const fileName = storedName.includes('.') ? path.basename(storedName) : path.basename(String(video.titulo || '') + '.mp4');
  const filePath = directory && path.resolve(directory.fullPath, fileName);
  if (!filePath || !isInside(videosCursosDir, filePath) || path.extname(fileName).toLowerCase() !== '.mp4') {
    throw new Error('Caminho do arquivo de video invalido.');
  }
  try {
    const realRoot = await fs.promises.realpath(videosCursosDir);
    const realFile = await fs.promises.realpath(filePath);
    if (!isInside(realRoot, realFile)) throw new Error('Arquivo fora da pasta de videos.');
    await fs.promises.unlink(filePath);
  } catch (error) {
    // Um arquivo ja ausente nao impede a limpeza do registro; outros erros abortam.
    if (error.code !== 'ENOENT') throw error;
  }
};

const deleteVideo = (id) => videoRepository.deleteById(id, removeVideoFile);

module.exports = { buildVideoDirectory, deleteVideo };
