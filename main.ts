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
      if ( c == "*"){
        this.next = new Token("MULTI","*");
        this.position = this.position +1;
        if (this.source[this.position] == "*"){
          this.next = new Token("POWER","**");
          this.position = this.position +1;
        }
        return;
      }
      if (c == "/"){
        this.next = new Token("DIV","/");
        this.position = this.position +1;
        return;
      }
      if (c == "("){
        this.next = new Token("OPEN_PAR","(");
        this.position = this.position +1;
        return;
      }
      if (c == ")"){
        this.next = new Token("CLOSE_PAR",")");
        this.position = this.position +1;
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
    let resultado = Parser.parseTerm()
    while (Parser.lexer.next.type == "PLUS" || Parser.lexer.next.type == "MINUS" ){
      let op = Parser.lexer.next.type;
      Parser.lexer.selectNext()
      if (op == "PLUS") resultado += Parser.parseTerm()
      if (op == "MINUS") resultado -= Parser.parseTerm()
    }
    return resultado;

  }
  static parseTerm(): number{
    let resultado = Parser.parseFactor();
    while (Parser.lexer.next.type == "MULTI" || Parser.lexer.next.type == "DIV" ){
      let op = Parser.lexer.next.type;
      Parser.lexer.selectNext()
      if (op == "MULTI") resultado *= Parser.parseFactor();
      if (op == "DIV" ) {
        let value = Parser.parseFactor();
        if (value == 0 ) throw new Error("[Parser] Division by zero");
        resultado = Math.trunc(resultado / value);
      }
    }
    return resultado;
    
  }

  ////
  static parseFactor(): number{
      if (Parser.lexer.next.type == "MINUS"){
          Parser.lexer.selectNext();
          let valor = Parser.parseFactor();
          return -Number(valor);
      }
      if (Parser.lexer.next.type == "PLUS"){
          Parser.lexer.selectNext();
          let valor = Parser.parseFactor();
          return Number(valor);
      }
      return Parser.parsePower();
  }


  ///
  static parsePower(): number{
      let resultado: number;
      
      if (Parser.lexer.next.type == "INT"){
          resultado = Number(Parser.lexer.next.value);   // preenche, não retorna
          Parser.lexer.selectNext();
      }
      else if (Parser.lexer.next.type == "OPEN_PAR"){
          Parser.lexer.selectNext();
          resultado = Parser.parseExpression();           // sem 'let', reusa a variável de fora
          if (Parser.lexer.next.type != "CLOSE_PAR") throw new Error("[Parser] Par opend with now close");
          Parser.lexer.selectNext();
      }
      else{
          throw new Error("[Parser] Expected INT or (");
      }
      
      while (Parser.lexer.next.type == "POWER"){
          Parser.lexer.selectNext();
          resultado = Math.pow(resultado, Parser.parseFactor());
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






