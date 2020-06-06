var PdfPrinter = require("./node_modules/pdfmake/src/printer.js");
var fs = require("fs");

/**
 * Read all *.json files from given dirname
 * @param {*} dirname
 * @param {*} onFileContent
 * @param {*} onError
 */
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

var printer = new PdfPrinter(fonts);

var docDefinition = {
  styles: {
    header: {
      fontSize: 18,
      bold: true,
      margin: [0, 20],
    },
    subheader: {
      fontSize: 14,
      bold: true,
      italics: true,
      margin: [0, 2]
    },
  },
};

readFiles(
  "./recipes/",
  (filename, content) => {
    console.log("Parse file and make pdf", filename);
    const recipe = JSON.parse(content);
    const ingredients = recipe.ingredients;

    const ingredientList = {
      ul: [],
    };
    ingredients.forEach((i) => {
      console.log(i);
      ingredientList.ul.push(i.join(" "));
    });

    docDefinition.content = [
      {
        text: recipe.title,
        style: "header",
      },
      {
        text: "Zutaten",
        style: "subheader",
      },
      ingredientList,
    ];

    var pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream(`pdfs/${filename}.pdf`));
    pdfDoc.end();
  },
  (err) => {
    throw err;
  }
);
