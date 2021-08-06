const { FileManager, S3 } = require('@withso/file-upload');

/**
 * @type {import('@withso/file-upload').MetadataStorage}
 */
const metadataStorage = {
  /**
   * @param {import('@withso/file-upload').WithFile} file
   */
  createFileMetadata: async (file, actor, options = {}) => {
    const category = options.category || 'userUploads';
    const authorName = options.authorName || null;
    const record = await shared.db.pg.massive.wallpapers.insert({
      name: file.name,
      url: file.url,
      mimetype: file.mimetype,
      creator_id: actor.id,
      category,
      author_name: authorName,
      thumbnail_url: file.imageData.thumbnailUrl,
      dominant_color: file.imageData.dominantColor
    })
    return record
  },

  /**
   * @param {string} wallpaperId
   */
  deleteFileMetadata: async (wallpaperId, actor) => {
    const file = await shared.db.pg.massive.wallpapers.findOne(wallpaperId)
    if (file.creator_id !== actor.id) {
      const err = new Error('Only the creator of a wallpaper can delete it');
      err.status = 403;
      throw err;
    }
    return shared.db.pg.massive.wallpapers.destroy(wallpaperId)
  },

  /**
   * @param {string} wallpaperId
   */
  getFileMetadata: (wallpaperId) => {
    return shared.db.pg.massive.wallpapers.findOne(wallpaperId)
  }
}

const BUCKET_NAME = 'noodle-wallpapers';
const wallpaperManager = new FileManager({
  metadataStorage,
  s3BucketName: BUCKET_NAME,
  hostOrigin: 'https://wallpapers.tilde.so',
  s3: new S3({
    // using the same env vars as ./s3.js
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
    region: process.env.AWS_S3_REGION,
    bucketName: BUCKET_NAME,
  }),
});

module.exports = wallpaperManager;
