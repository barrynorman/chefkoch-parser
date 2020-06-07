const PdfPrinter = require("./node_modules/pdfmake/src/printer.js");
const fs = require("fs");
const axios = require("axios");

const readFiles = (dirname, onFileContent, onError) => {
  fs.readdir(dirname, (err, filenames) => {
    if (err) {
      onError(err);
      return;
    }
    filenames
      .filter((file) => file.endsWith("json"))
      .forEach((filename) => {
        fs.readFile(dirname + filename, "utf-8", function (err, content) {
          if (err) {
            onError(err);
            return;
          }
          onFileContent(filename, content);
        });
      });
  });
};

var fonts = {
  Roboto: {
    normal: "fonts/Roboto-Regular.ttf",
    bold: "fonts/Roboto-Medium.ttf",
    italics: "fonts/Roboto-Italic.ttf",
    bolditalics: "fonts/Roboto-MediumItalic.ttf",
  },
};

var docDefinition = {
  styles: {
    header: {
      fontSize: 18,
      bold: true,
      margin: [10, 0],
    },
    subheader: {
      fontSize: 14,
      bold: true,
      italics: true,
      margin: [0, 50, 0, 0],
    },
    dishid: {
      fontSize: 12,
      italics: true,
      margin: [0, 0, 0, 20],
    },
    ingredients: {
      fontSize: 12,
    },
    instructions: {
      fontSize: 12,
    },
    qrcode: {
      margin: [0, 50, 0, 0],
    },
  },
};

var printer = new PdfPrinter(fonts);

readFiles(
  "./recipes/",
  (filename, content) => {
    console.log("Parse file and make pdf", filename);
    const recipe = JSON.parse(content);
    const ingredients = recipe.ingredients;

    const ingredientList = {
      ul: [],
      style: "ingredients",
    };
    ingredients.forEach((i) => {
      ingredientList.ul.push(i.join(" "));
    });

    axios
      .get(recipe.image, { responseType: "arraybuffer" })
      .then((response) => {
        let image = Buffer.from(response.data, "binary").toString("base64");
        docDefinition.content = [
          {
            text: "Rezept #" + recipe.id,
            style: "dishid",
          },
          {
            columns: [
              {
                image: "data:image/jpeg;base64," + image,
                width: 200,
              },
              {
                text: recipe.title,
                style: "header",
              },
            ],
          },
          {
            columns: [
              [
                {
                  text: "Zutaten",
                  style: "subheader",
                },
                ingredientList,
              ],
              [
                {
                  text: "Zubereitung",
                  style: "subheader",
                },
                {
                  text: recipe.instructions,
                  style: "instructions",
                },
              ],
            ],
          },
          {
            qr: "https://www.chefkoch.de/rezepte/" + recipe.id,
            style: "qrcode",
          },
        ];
        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(`pdfs/${filename}.pdf`));
        pdfDoc.end();
      });
  },
  (err) => {
    throw err;
  }
);
