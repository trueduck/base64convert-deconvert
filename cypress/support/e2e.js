import './commands'
Cypress.on('uncaught:exception', (err) => {
    // Сайт конвертер выбрасывает ошибку $persist не влияющую на тесты, игнорируем
    if (err.message.includes('$persist')) {
      return false
    }
  })
Cypress.on('uncaught:exception', (err) => {
  //Сайт декодер выбрасывает ошибку при попытке считать src изображения, не влияет на тесты, игнорируем
  if (err.message.includes("postMessage")) {
    return false
  }
})