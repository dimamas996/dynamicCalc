export class Calculator {
  constructor() {
    this.CONTAINER = document.querySelector(".container");
    this.EXP_Line = document.querySelector(".screen__expression-line");
    this.ANS_Line = document.querySelector(".screen__answer-line");
    this.NUMBER_STACK = [];
    this.OPERATORS_STACK = [];
    this.stringForCalc = "";
    this.TOKEN_ARR = [];
    this.openBracketCounter = 0;
    this.operationPriority = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
      "-unary": 3,
    }
    this.answer = '';
    this.init();
  }

  init() {
    Array.from(document.querySelectorAll('button')).forEach(btn => btn.addEventListener("click", (e) => this.input(e.target.innerText)));
  }

  get lastSymbol () {
    return this.stringForCalc.charAt(this.stringForCalc.length - 1);
  }

  drawString() {
    this.EXP_Line.innerText = "";
    for (let i = 0; i < this.stringForCalc.length; i++) {
      this.EXP_Line.innerText += this.stringForCalc.charAt(i);
    }

    this.ANS_Line.innerText = this.answer;
    console.log(this.stringForCalc);
    console.log(this.TOKEN_ARR);
    console.log(this.answer);
  }

  input(symbol) {
    this.adjustScroll();

    switch (symbol) {
      case "del":
        this.deleteAll();
        return;
      case "C":
        this.clearSymbol();
        return;
      case "=":
        this.equalPress();
        return;
      case "( )":
        symbol = this.bracketsDefine();
        break;
    }

    if (symbol === '.' && /\d/g.test(this.lastSymbol)) {
      this.stringForCalc += symbol;
    } else if (symbol === '-' && (this.stringForCalc.length === 0 || this.lastSymbol === '(')) {
      this.stringForCalc += `-`;
    } else if (/[\/\*\+\-]/g.test(symbol) && /[\d\)]/g.test(this.lastSymbol)) {
      this.stringForCalc += symbol;
    } else if (this.stringForCalc.length === 0 && symbol === '(') {
      this.stringForCalc += `(`;
    } else if (symbol === '(' && /[\d\)]/g.test(this.lastSymbol)) {
      this.stringForCalc += `*${symbol}`;
    } else if (symbol === '(' && /[\/\*\+\-\(]/g.test(this.lastSymbol)) {
      this.stringForCalc += symbol;
    } else if (symbol === ')' && (this.lastSymbol === ')' || /\d/g.test(this.lastSymbol))) {
      this.stringForCalc += symbol;
    } else if (/\d/g.test(symbol) && this.lastSymbol === ')') {
      this.stringForCalc += `*${symbol}`;
    } else if (/[\d]/g.test(symbol)) {
      this.stringForCalc += symbol;
    } else return;

    this.stringForCalc = this.stringForCalc.replace(/((^)|(?<=[\+\-\/\*\(\)]))0+(?=[0-9]+)/g, "");
    this.TOKEN_ARR = this.tokenise();
    this.calculate();
    this.drawString();
    this.adjustScroll();
  }

  tokenise () {
    let closeBraketCounter = 0;
    this.openBracketCounter = 0;
    let result = [];
    let numberToken = "";
    for (let i = 0; i < this.stringForCalc.length; i++) {
      let currentSymbol = this.stringForCalc.charAt(i);
      if (/[\d\.]/g.test(currentSymbol)) {
        numberToken += currentSymbol;
      } else if (numberToken.length) {
        numberToken.endsWith('.') ? result.push(numberToken) : result.push(+numberToken);
        numberToken = "";
        result.push(currentSymbol);
      } else {
        result.push(currentSymbol);
      }
      currentSymbol === "(" ? this.openBracketCounter++ : currentSymbol === ")" ? closeBraketCounter++ : null;
    }

    if (numberToken.length) {
      numberToken.endsWith('.') ? result.push(numberToken) : result.push(+numberToken);
      numberToken = "";
    }

    this.openBracketCounter = this.openBracketCounter - closeBraketCounter;
    return result;
  }


  calculate() {
    let ans = "";
    this.answer = ans;
    if ((typeof (this.TOKEN_ARR[this.TOKEN_ARR.length - 1]) !== "number") && (this.TOKEN_ARR[this.TOKEN_ARR.length - 1] !== ")")) return;

    for (let i = 0; i < this.TOKEN_ARR.length; i++) {

      if (this.TOKEN_ARR[i] === "-" && (this.TOKEN_ARR[i - 1] === "(" || i === 0)) {
        this.OPERATORS_STACK.push("-unary");
        continue;
      };

      if (this.TOKEN_ARR[i] === "(") {
        this.OPERATORS_STACK.push(this.TOKEN_ARR[i]);
        continue;
      };

      if (this.TOKEN_ARR[i] === ")") {
        while(this.OPERATORS_STACK[this.OPERATORS_STACK.length - 1] !== "(") {
          this.counting();
        }
        this.OPERATORS_STACK.pop();
        continue;
      };

      if (typeof this.TOKEN_ARR[i] === "number") {
        this.NUMBER_STACK.push(this.TOKEN_ARR[i]);
      } else if (this.OPERATORS_STACK.length > 0) {

        while (
          this.operationPriority[this.OPERATORS_STACK[this.OPERATORS_STACK.length - 1]] >= this.operationPriority[this.TOKEN_ARR[i]]) {
          this.counting();
        }

        this.OPERATORS_STACK.push(this.TOKEN_ARR[i]);

      } else {
        this.OPERATORS_STACK.push(this.TOKEN_ARR[i]);
      }
    }

    while (this.OPERATORS_STACK.length) {
      this.counting();
    }

    ans = this.NUMBER_STACK.pop();
    if (typeof(ans) === 'number' &&  !Number.isNaN(ans) && Number.isFinite(ans)) {
      if (ans.toString().includes('e')) {
        this.answer = BigInt(ans).toString(); //not exact numbers
      } else this.answer = ans;
    } else {
      this.answer = 'Can`t divide by 0';
    }    

    this.NUMBER_STACK = [];
    this.OPERATORS_STACK = [];
    this.drawString();
  }

  counting() {
    let operator = this.OPERATORS_STACK.pop();
    if (this.operationPriority[operator] === 3) {
      this.NUMBER_STACK.push(this.NUMBER_STACK.pop() * -1);
      return;
    } else if (/[\(\)]/g.test(operator)) return;

    let secondNumber = this.NUMBER_STACK.pop();
    let firstNumber = this.NUMBER_STACK.pop();

    let roundValue = [this.roundValue(secondNumber), this.roundValue(firstNumber)];
    let result = 0;
    switch (operator) {
      case "-":
        result = firstNumber - secondNumber;
        roundValue = Math.max(roundValue[0], roundValue[1]);
        break;
      case "+":
        result = firstNumber + secondNumber;
        roundValue = Math.max(roundValue[0], roundValue[1]);
        break;
      case "/":
        result = firstNumber / secondNumber;
        roundValue = roundValue[0] + roundValue[1];
        break;
      case "*":
        result = firstNumber * secondNumber;
        roundValue = roundValue[0] + roundValue[1];
        break;
    }
    roundValue === 0 ? this.NUMBER_STACK.push(result) : this.NUMBER_STACK.push(+result.toFixed(roundValue));
  }

  bracketsDefine() {
    if (this.openBracketCounter && /[\d\)]/g.test(this.lastSymbol)) {
      this.openBracketCounter--;
      return ')';
    } else {
      this.openBracketCounter++;
      return '(';
    }
  }

  deleteAll() {
    this.NUMBER_STACK = [];
    this.OPERATORS_STACK = [];
    this.TOKEN_ARR = [];
    this.stringForCalc = "";
    this.openBracketCounter = 0;
    this.answer = "";
    this.drawString();
  }

  clearSymbol() {
    this.stringForCalc = this.stringForCalc.slice(0, this.stringForCalc.length - 1);
    this.TOKEN_ARR = this.tokenise();
    this.calculate();
    this.drawString();
  }

  roundValue(number) {
    let str = number === undefined ? "" : number.toString();
    let pointAt = str.indexOf(".");
    if (pointAt === -1) return 0;
    return str.slice(pointAt + 1).length
  }

  adjustScroll() {
    this.ANS_Line.scrollLeft = this.ANS_Line.scrollWidth;
    this.EXP_Line.scrollLeft = this.EXP_Line.scrollWidth;
  }

  equalPress() {
    if (!this.stringForCalc.length) return;
    let ans = +this.answer
    if (!Number.isNaN(ans)) {
      if (ans < 0) {
        this.stringForCalc = `-${ans*-1}`;
      } else {
        this.stringForCalc = `${ans}`;
      }
      this.answer = "";
      this.NUMBER_STACK = [];
      this.OPERATORS_STACK = [];
      this.TOKEN_ARR = this.tokenise();
      //this.calculate();
      this.drawString();
    } else if (!this.answer.length && this.TOKEN_ARR.length) {
      this.answer = "Format Error";
      this.drawString();
    }
  }
}

///(?<=[1-9])0+(?=[1-9])/g => 000005485.54zz5415000