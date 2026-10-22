const { sql, dbConfig } = require('../db');

// A transacao mantem o registro quando a remocao do arquivo falha.
const deleteById = async (id, removeFile) => {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`SELECT v.id, v.id_modulo, v.titulo, v.url,
                     c.caminho AS curso_caminho,
                     m.titulo AS modulo_titulo, m.caminho AS modulo_caminho
              FROM video v WITH (UPDLOCK, HOLDLOCK)
              INNER JOIN cursos c ON c.id = v.id_curso
              LEFT JOIN modulos m ON m.id = v.id_modulo
              WHERE v.id = @id`);
    const video = result.recordset[0];
    if (video) {
      // Verifica as restricoes SQL antes de remover o arquivo do disco.
      await new sql.Request(transaction)
        .input('id', sql.Int, id)
        .query('DELETE FROM video WHERE id = @id');
      await removeFile(video);
    }
    await transaction.commit();
    return video || null;
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
};

module.exports = { deleteById };
