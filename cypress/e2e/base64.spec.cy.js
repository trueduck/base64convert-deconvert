describe('Image Converter Test', () => {

    afterEach(() => {
        cy.clearCookies()
        cy.clearLocalStorage()
        cy.wrap(Cypress.automation('remote:debugger:protocol', {
            command: 'Network.clearBrowserCache'
        }))
    })

    it('Uploads an image to base64 converter, then converts it back to image', () => {

        cy.visit('https://www.base64-image.de/') //Заходим на сайт конвертера
        cy.contains('Convert your images')  //Проверяем что мы успешно загрузили сайт

        cy.intercept('POST', '/encode').as('convertRequest')  //Устанивливаем перехват запроса на конверт как алиас

        cy.get('input.dz-hidden-input') //загружаем картинку из /fixtures/image.png
            .selectFile('cypress/fixtures/image.png', { force: true })

        cy.get('.dz-show-code')  //Сохраняем base64 картинку как алиас base64image
            .click()
        cy.wait('@convertRequest').its('response.statusCode').should('eq', 200)  //Проверяем что реквест уехал и вернул 200

        cy.get('.modal-dialog').within(() => {
            cy.get('#show-example-image').invoke('text').then((text) => {
                expect(text).to.match(/^data:image\/\w+;base64,/) //Проверяем, что мы забрали URI на base64 картинки
                console.log('base64 image=', text)
                cy.wrap(text).as('base64Image')
            })
        })


        cy.visit('https://base64.guru/converter/decode/image') //Заходим на сайт декодера
        cy.contains('Base64 to Image')  //Проверяем что мы успешно зашли на сайт

        cy.get('@base64Image').then((base64Image) => {  //Вставляем содержимое алиаса base64image в поле для ввода. Используем invoke() вместо type() для скорости выполнения, type() вводит символы по одному
            cy.get('#form-base64-converter-decode-image-base64')
                .should('exist')
                .invoke('val', base64Image)
                .trigger('input')
        })

        cy.intercept('POST', 'https://base64.guru/converter/decode/image', (req) => {   //Устанивливаем перехват запроса на декод как алиас. На этом сайте каждый заход уже отсылает пост-запрос на этот же эндпоинт с телом base64, на первом заходе оно пустое.
            console.log('Request intercepted:', req)
            req.continue((res) => {
                res.send({ statusCode: 200, body: res.body })
            })
        }).as('decodeRequest')

        cy.contains('Decode Base64 to Image') // Жмём кнопку "декодировать"
            .should('exist')
            .click()
        cy.wait('@decodeRequest').its('response.statusCode').should('eq', 200)  //Проверяем что реквест уехал и вернул 200

        cy.get('.preview-output')  //Находим картинку-результат
            .should('exist')
            .within(() => {
                cy.get('img')
                    .invoke('attr', 'src').then((convertedBase64Image) => {  //Картинка-результат лежит на сайте как base64, Проверяем её наличие и забираем
                        cy.task('compareImageWithFixture', {               //Используем таск чтобы высчитать хэши файла-картинки из /fixtures и нашей картинки в base64
                            fixturePath: 'cypress/fixtures/image.png',
                            receivedBase64: convertedBase64Image
                        })
                            .then(({ originalHash, receivedHash }) => {
                                expect(receivedHash).to.equal(originalHash)  //Сравниваем хеши. Если хеши совпадают, то файл который мы получили после декодирования совпадает с оригиналом.
                            })
                    })
            })
    })
})