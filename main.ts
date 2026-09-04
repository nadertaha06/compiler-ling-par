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
      if (c == "!"){
        this.next = new Token("FACT","!");
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
  static parseExpression(): Node {
    let resultado = Parser.parseTerm()
    while (Parser.lexer.next.type == "PLUS" || Parser.lexer.next.type == "MINUS" ){
      let op = Parser.lexer.next.type;
      Parser.lexer.selectNext()
      if (op == "PLUS") resultado = new BinOp("+",resultado,Parser.parseTerm())
      if (op == "MINUS") resultado = new BinOp("-",resultado,Parser.parseTerm())
    }
    return resultado;

  }
  static parseTerm(): Node{
    let resultado = Parser.parseFactor();
    while (Parser.lexer.next.type == "MULTI" || Parser.lexer.next.type == "DIV" ){
      let op = Parser.lexer.next.type;
      Parser.lexer.selectNext()
      if (op == "MULTI") resultado = new BinOp("*",resultado,Parser.parseFactor());
      if (op == "DIV" ) {
        resultado = new BinOp("/",resultado,Parser.parseFactor())
      }
    }
    return resultado;
    
  }
  static parseFactor(): Node{
    let resultado: Node;

    if (Parser.lexer.next.type == "INT"){
        let t = Number(Parser.lexer.next.value);
        Parser.lexer.selectNext();
        resultado = new IntVal(t);
    }else if (Parser.lexer.next.type == "OPEN_PAR"){
        Parser.lexer.selectNext();
        resultado = Parser.parseExpression();
        if (Parser.lexer.next.type != "CLOSE_PAR") throw new Error("[Parser] Par opend with now close");
        Parser.lexer.selectNext();
    }else if (Parser.lexer.next.type == "MINUS"){
        Parser.lexer.selectNext();
        resultado = new UnOp('-', Parser.parseFactor());
    }else if (Parser.lexer.next.type == "PLUS"){
        Parser.lexer.selectNext();
        resultado = new UnOp('+', Parser.parseFactor());
    }else {
        throw new Error("[Parser] Expected INT or ( after operator");
    }
    if (Parser.lexer.next.type == "FACT"){
        Parser.lexer.selectNext();
        resultado = new UnOp('!', resultado);
    }
    return resultado;
  }
  static run(code: string): Node{
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
abstract class Node {
  value: number | string;
  children: Node[];
  abstract evaluate(): number;
  constructor(value: number | string,children: Node[]) {
    this.value = value;
    this.children = children;
  }
}

class IntVal extends Node {
    constructor(value:number){
      super(value,[])
    }
    evaluate(): number{
      return Number(this.value);
    }
}

class UnOp extends Node{
  constructor(value:string,filho: Node){
    super(value,[filho]);
  }
  evaluate(): number {
      let valorDoFilho = this.children[0]?.evaluate();
   
      if (this.value == "-") {
          return -valorDoFilho;
      } else if (this.value == "+"){
          return valorDoFilho;
      }else if (this.value == "!"){
        if (valorDoFilho < 0) throw new Error("[Semantic] Factorial of negative number");
        let resultado = 1;
        for (let i = valorDoFilho; i > 0;i--){
            resultado *= i;
        }
        return resultado;
      }else throw new Error("[Semantic] Valor negativo nao e valido")
  }
}

class BinOp extends Node{
  constructor(value:string,n1:Node,n2:Node){
    super(value,[n1,n2])
  }
  evaluate(): number {
    let p = this.children[0]?.evaluate();
    let j = this.children[1]?.evaluate();
    let op = this.value;
    if (op == "+"){
      return p + j;

    }else if (op == "-"){
      return p - j;
    }else if (op == "*"){
      return p * j;
    }else if (op == "/"){
      if (j == 0) throw new Error("[Semantic] Division by zero");
      return Math.trunc(p/j); 
    }
    throw new Error("[Semantic] Invalid Symbol " + this.value)
  }
}


function main(args: string): number{
    if (!args){
        throw new Error("[Parser] error code");
    }
    let resultado = Parser.run(args);
    return resultado.evaluate();

}

console.log(main(process.argv[2]))






