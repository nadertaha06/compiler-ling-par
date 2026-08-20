class Lexer {
    source: string;
    position: number;
    next!: Token;
    constructor(source: string){
        this.source = source;
        this.position = 0;
    }

    selectNext():void{
      //let i = this.position;
      while (this.source[this.position] == " "){
        this.position += 1 
      }
      if (this.position >= this.source.length){
        this.next = new Token("EOF", "");
        return; 
      }
      let c = this.source[this.position];
      if (c == "+"){
        this.next = new Token("PLUS","+")
        this.position = this.position + 1;
        return;
      }
      if (c == "-"){
        this.next = new Token("MINUS","-");
        this.position = this.position + 1;
        return;
      }
      if (c == "ˆ"){
        this.next = new Token("XOR","ˆ");
        this.position = this.position + 1;
        return;
      }
      if (c >= "0" && c <= "9" ){
        let sum = "";
        while ( this.position < this.source.length && (this.source[this.position] >= "0" && this.source[this.position] <= "9" )){
          sum += this.source[this.position];
          this.position += 1;
        }
        this.next = new Token("INT",Number(sum))
        return;
      }
      throw new Error("[Lexer] Invalid Symbol " + c)
    }
}
class Parser{
  static lexer: Lexer;
  static parseExpression(): number {
    if (Parser.lexer.next.type != "INT")throw new Error("[Parser] Expected INT");
    let resultado = Number(Parser.lexer.next.value);
    Parser.lexer.selectNext()
    while (Parser.lexer.next.type == "PLUS" || Parser.lexer.next.type == "MINUS" || Parser.lexer.next.type == "XOR"){
      let op = Parser.lexer.next.type;
      Parser.lexer.selectNext()
      if (Parser.lexer.next.type != "INT") throw new Error("[Parser] Expected INT after operator");
      if (op == "PLUS") resultado += Number(Parser.lexer.next.value);
      if (op == "MINUS") resultado -= Number(Parser.lexer.next.value);
      if (op == "XOR") resultado ^= Number(Parser.lexer.next.value);
      Parser.lexer.selectNext()
    }
    return resultado;

  }
  static run(code: string): number{
    Parser.lexer = new Lexer(code);
    Parser.lexer.selectNext();
    const resultado = Parser.parseExpression();
    if (Parser.lexer.next.type != "EOF"){
      throw new Error("[Parser] Unexpected token");
    }
    return resultado;

  }

  
}

class Token {
  type: string;
  value: number | string;

  constructor(type: string, value: number | string) {
    this.type = type;
    this.value = value;
  }
}


function main(args: string): number{
    if (!args){
        throw new Error("[Parser] error code");
    }
    return Parser.run(args);

}

console.log(main(process.argv[2]))






