const { defineConfig } = require("cypress")
const crypto = require('crypto')
const fs = require('fs/promises')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        async compareImageWithFixture({ fixturePath, receivedBase64 }) {
          //Считаем хэши файла и строки в base64

          const originalFileBuffer = await fs.readFile(fixturePath) //Читаем файл

          const originalHash = crypto  //Считаем его sha256 хеш
            .createHash('sha256')
            .update(originalFileBuffer)
            .digest('hex')
          console.log('original file hash=', originalHash)

          const base64Data = receivedBase64.replace(/^data:image\/\w+;base64,/, '') //чистим URI хедер со строки если он есть
          const receivedBuffer = Buffer.from(base64Data, 'base64')

          const receivedHash = crypto //Считаем sha256 хеш base64 строки
            .createHash('sha256')
            .update(receivedBuffer)
            .digest('hex')
          console.log('converted file hash=', receivedHash)
          return { originalHash, receivedHash } //возвращаем 2 хеша
        },
      })
    },
    experimentalIsolation: true,  //Сайт конвертер остаётся в памяти между тестами без изоляции.
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 0,
    chromeWebSecurity: false,  //В данном случае это самый простой способ держать два отдельных сайта в контексте одного it(). Иначе придётся писать обход с хранением base64 изображения в глобальных переменных/файле.
    video: false
  },
})