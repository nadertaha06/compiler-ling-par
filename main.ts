import fs = require('fs');

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
      if (c == "\n"){
        this.next = new Token("END", "\n");
        this.position = this.position + 1;
        return;
      }
      if (c == "="){
        this.next = new Token("ASSIGN","=");
        this.position = this.position +1;
        return;
      }
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
      if (/^[a-zA-Z]$/.test(c)) {
          let word = "";
          while (this.position < this.source.length && /^[a-zA-Z0-9_]$/.test(this.source[this.position])){
              word += this.source[this.position];
              this.position += 1;
          }
          if (word == "Println"){
              this.next = new Token("PRINT", word);
          } else {
              this.next = new Token("IDEN", word);
          }
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
    }else if (Parser.lexer.next.type == "IDEN"){
        let temp = Parser.lexer.next.value;
        Parser.lexer.selectNext();
        resultado = new Identifier(temp)
    }
    else {
        throw new Error("[Parser] Expected INT or ( after operator");
    }
    return resultado;
  }
  static parseStatement(): Node{
      let resultado: Node; 
      if (Parser.lexer.next.type == "IDEN"){
        let temp = Parser.lexer.next.value;
        Parser.lexer.selectNext();
        let name = new Identifier(temp)
        if (Parser.lexer.next.type == "ASSIGN"){
          Parser.lexer.selectNext();
          resultado = new Assignment(name , Parser.parseExpression())
        }
      }else if (Parser.lexer.next.type == "PRINT"){
        Parser.lexer.selectNext(); 
        if (Parser.lexer.next.type == "OPEN_PAR"){
          Parser.lexer.selectNext();
          let exp = Parser.parseExpression();
          if (Parser.lexer.next.type == "CLOSE_PAR"){
            Parser.lexer.selectNext();
            resultado = new Print(exp);
          }else throw new Error("[Parser] ( Open with no close")
        }
      }else if (Parser.lexer.next.type == "END"){
        resultado = new NoOp()
      }else{
        throw new Error("[Parser] Unexpected token at start of statement")
      }
      if (Parser.lexer.next.type != "END"){
        throw new Error("[Parser] Expected end of line")
      }
      Parser.lexer.selectNext();

      return resultado;
  }


  static parseProgram(): Block{
    const lines: Node[] = []; 
    while (Parser.lexer.next.type != "EOF"){
      let line = Parser.parseStatement();
      lines.push(line);
    }
    return new Block(lines)
  }
  static run(code: string): Node{
    Parser.lexer = new Lexer(code);
    Parser.lexer.selectNext();
    const resultado = Parser.parseProgram();
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
  abstract evaluate(st: SymbolTable): number | void;
  constructor(value: number | string,children: Node[]) {
    this.value = value;
    this.children = children;
  }
}
class Variable{
  value: number;
  constructor(value:number){
    this.value = value;
  }
}

class Identifier extends Node {
  constructor(value:string){
    super(value,[])
  }
  evaluate(st: SymbolTable): number {
    return Number(st.buscar(this.value));
  }
}
class Block extends Node{
  constructor(filhos: Node[]){
    super("",filhos)
  }
  evaluate(st: SymbolTable): number | void {
    for(let i = 0; i < this.children.length;i++){
      this.children[i]?.evaluate(st)
    }
  }
}
class Assignment extends Node{
  constructor(variavel:Node,value:Node){
    super("",[variavel,value])
  }
  evaluate(st: SymbolTable): number | void {
    let exp = this.children[1]?.evaluate(st);
    st.guardar(this.children[0]?.value,exp)
  }
}
class NoOp extends Node{
  constructor(){
    super("",[])
  }
  evaluate(st: SymbolTable): number | void {
    
  }
}

class Print extends Node{
  constructor(value:any){
    super("",[value])
  }
  evaluate(st: SymbolTable): void {
    console.log(this.children[0]?.evaluate(st))
  }
}

class SymbolTable{
    private _table: Record<string, Variable>;
    constructor(){
      this._table = {};
    }
    get table(): Record<string, Variable>{
      return this._table
    }
    set table(valor:Record<string, Variable>) {
      this._table = valor
    }
    guardar(nome: string, value: number): void{
      this._table[nome] = new Variable(value);
    }
    buscar(nome:string): number{
      if (nome in this._table){
        return this._table[nome]?.value
      }
      throw new Error("[Semantic] varible not denfined")
    }
}

class IntVal extends Node {
    constructor(value:number){
      super(value,[])
    }
    evaluate(st:SymbolTable): number{
      return Number(this.value);
    }
}

class UnOp extends Node{
  constructor(value:string,filho: Node){
    super(value,[filho]);
  }
  evaluate(st:SymbolTable): number {
      let valorDoFilho = this.children[0]?.evaluate(st);
   
      if (this.value == "-") {
          return -valorDoFilho;
      } else if (this.value == "+"){
          return valorDoFilho;
      } else {
          throw new Error("[Semantic] Invalid Symbol " + this.value);
      }
  }
}
class BinOp extends Node{
  constructor(value:string,n1:Node,n2:Node){
    super(value,[n1,n2])
  }
  evaluate(st:SymbolTable): number {
    let p = this.children[0]?.evaluate(st);
    let j = this.children[1]?.evaluate(st);
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

class Prepro {
    static filter(code: string): string {
        return code.replace(/\/\/[^\n]*/g, '');
    }
}

function main(nomeArquivo: string): number|void|string{
    if (!nomeArquivo){
        throw new Error("[Parser] error code");
    }
    let conteudo = fs.readFileSync(nomeArquivo, 'utf-8');
    conteudo = conteudo + '\n';
    let codigoLimpo = Prepro.filter(conteudo);
    let resultado = Parser.run(codigoLimpo);
    let st = new SymbolTable()
    return resultado.evaluate(st);
}

main(process.argv[2])






