const inquirer = require("inquirer");

const questions = [
  { type: "input", name: "country", message: "What`s your country?" },
  { type: "number", name: "age", message: "What`s your age?" },
];

(async () => {
  const prompt = inquirer.createPromptModule();

  prompt(questions).then((res) => {
    console.log(res);
  });
})();
