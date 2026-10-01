const fs = require('fs');

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
        this.position = this.position +1;
        if (this.source[this.position] == "="){
          this.next = new Token("EQ","==")
          this.position += 1;
          return;
        }else{
          this.next = new Token("ASSIGN","=");
          return;
        }
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
      if (c == "{"){
        this.next = new Token("OPEN_BRA","{");
        this.position += 1;
        return;
      }
      if (c == "}"){
        this.next = new Token("CLOSE_BRA","}");
        this.position += 1;
        return;
      }
      if (c == "&"){
        this.position += 1;
        if (this.source[this.position] == "&"){
          this.next = new Token("AND","&&");
          this.position += 1;
          return;
        }else {throw new Error("[Lexer] Invalid Symbol &")}
      }
      if (c == "|"){
        this.position += 1;
        if (this.source[this.position] == "|"){
          this.next = new Token("OR","||");
          this.position += 1;
          return;
        }else {throw new Error("[Lexer] Invalid Symbol |")}
      }
      if (c == "!"){
        this.next = new Token("NOT","!");
        this.position += 1;
        return;
      }
      if (c == ">"){
        this.next = new Token("GT",">")
        this.position += 1;
        return;
      }
      if (c == "<"){
        this.next = new Token("LT","<");
        this.position += 1;
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
          }else if (word == "if"){
              this.next = new Token("IF",word);
          }else if (word == "for"){
              this.next = new Token("WHILE",word);
          }else if (word == "else"){
              this.next = new Token("ELSE",word);
          }else if (word == "Scanln"){
              this.next = new Token("READ",word);
          }
          else {
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
  // OR 
  static parseBoolExpression(): Node{
    let resultado = Parser.parseBoolTerm();
    while (Parser.lexer.next.type == "OR"){ 
      Parser.lexer.selectNext();
      resultado = new BinOp("||",resultado,Parser.parseBoolTerm());
    }
    return resultado;
  }



  // AND 
  static parseBoolTerm(): Node{
    let resultado = Parser.parseRelExpression();
    while ( Parser.lexer.next.type == "AND") {
      Parser.lexer.selectNext();
      resultado = new BinOp("&&",resultado,Parser.parseRelExpression());
    }
    return resultado;
  }


  // == > <
  static parseRelExpression(): Node{
    let resultado = Parser.parseExpression();
    let op = Parser.lexer.next.type;
    if ( op == "EQ") {
      Parser.lexer.selectNext();
      resultado = new BinOp("==",resultado,Parser.parseExpression());}
    if ( op == "GT") {
      Parser.lexer.selectNext();
      resultado = new BinOp(">",resultado,Parser.parseExpression());}
    if ( op == "LT") {
      Parser.lexer.selectNext();
      resultado = new BinOp("<",resultado,Parser.parseExpression());}
    return resultado;
  }

  // EXPRESSION
  static parseExpression(): Node {
    let resultado = Parser.parseTerm()
    while (Parser.lexer.next.type == "PLUS" || Parser.lexer.next.type == "MINUS" ){
      let op = Parser.lexer.next.type;
      Parser.lexer.selectNext()
      if (op == "PLUS") resultado = new BinOp("+",resultado,Parser.parseTerm());
      if (op == "MINUS") resultado = new BinOp("-",resultado,Parser.parseTerm());
    }
    return resultado;

  }


  //TERM
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



  //FACTOR
  static parseFactor(): Node{
    let resultado: Node;

    if (Parser.lexer.next.type == "INT"){
        let t = Number(Parser.lexer.next.value);
        Parser.lexer.selectNext();
        resultado = new IntVal(t);
    }else if (Parser.lexer.next.type == "OPEN_PAR"){
        Parser.lexer.selectNext();
        resultado = Parser.parseBoolExpression();
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
    }else if (Parser.lexer.next.type == "NOT"){
        Parser.lexer.selectNext();
        resultado = new UnOp('!',Parser.parseFactor());
    }else if (Parser.lexer.next.type == "READ"){
        Parser.lexer.selectNext();
        if (Parser.lexer.next.type == "OPEN_PAR"){
          Parser.lexer.selectNext();
          if (Parser.lexer.next.type =="CLOSE_PAR"){
            resultado = new Read();
          }else{
            throw new Error("[Parser] Par opend with now close");
            
          }
          Parser.lexer.selectNext();
        }else{
          throw new Error("[Parser] Expected '(' after Scanln");
        }
        
    }
    else {
        throw new Error("[Parser] Expected number, identifier, '(', '!', '+', '-' or Scanln");
    }
    return resultado;
  }




  // STATEMENT 
  static parseStatement(): Node{
      let resultado: Node; 
      //ex: x = 10
      if (Parser.lexer.next.type == "IDEN"){
        let temp = Parser.lexer.next.value;
        Parser.lexer.selectNext();
        let name = new Identifier(temp)
        if (Parser.lexer.next.type == "ASSIGN"){
          Parser.lexer.selectNext();
          resultado = new Assignment(name , Parser.parseBoolExpression())
        }else {
          throw new Error("[Parser] Expected '=' after identifier")
        }
      }// Print
      else if (Parser.lexer.next.type == "PRINT"){
        Parser.lexer.selectNext(); 
        if (Parser.lexer.next.type == "OPEN_PAR"){
          Parser.lexer.selectNext();
          let exp = Parser.parseBoolExpression();
          if (Parser.lexer.next.type == "CLOSE_PAR"){
            Parser.lexer.selectNext();
            resultado = new Print(exp);
          }else throw new Error("[Parser] ( Open with no close");
        }else {
          throw new Error("[Parser] Expected '(' after Print")
        }
      }
      // if 
      else if (Parser.lexer.next.type == "IF"){
        Parser.lexer.selectNext();
        let exp = Parser.parseBoolExpression();
        let block = Parser.parseBlock();
        if (Parser.lexer.next.type == "ELSE"){
          Parser.lexer.selectNext();
          let new_block = Parser.parseBlock();
          resultado = new If(exp,block,new_block);
        }else {
          resultado = new If(exp,block);
        }
      }
      // WHILE
      else if (Parser.lexer.next.type == "WHILE"){
        Parser.lexer.selectNext();
        let exp = Parser.parseBoolExpression();
        let block = Parser.parseBlock();
        resultado = new While(exp,block);
      }
      // BLOCO SOLTO
      else if (Parser.lexer.next.type == "OPEN_BRA"){
        resultado = Parser.parseBlock();
      }
      
      
      else if (Parser.lexer.next.type == "END"){
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
  // Construcao do if e do else 
  static parseBlock(): Block{
    const lines: Node[] = [];
    if(Parser.lexer.next.type == "OPEN_BRA"){
      Parser.lexer.selectNext();
      if (Parser.lexer.next.type != "END"){
        throw new Error("[Parser] Expected newline after {");
      }
      Parser.lexer.selectNext();
      while (Parser.lexer.next.type != "CLOSE_BRA"){
        let line = Parser.parseStatement();
        lines.push(line);
      }
      Parser.lexer.selectNext();
    }else {throw new Error("[Parser] Expected {")}
    return new Block(lines)
  }


  //Leitura do programa linha a linha 
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


class Read extends Node {
    static linhas: string[] | null = null;
    static indice: number = 0;

    constructor(){
        super("", [])
    }

    evaluate(st: SymbolTable): number | void {
      if (Read.linhas == null){
        let texto = fs.readFileSync(0, 'utf-8');
        Read.linhas = texto.split('\n');
        Read.indice = 0;
        
      }
      let input = Read.linhas[Read.indice];
      Read.indice += 1;
      return Number(input);
        
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
      }else if (this.value == "!"){
          if (valorDoFilho != 0){
            return 0;
          }
          return 1;
      } 
      else {
          throw new Error("[Semantic] Invalid Symbol " + this.value);
      }
  }
}

class If extends Node{
  constructor(value:Node, c1:Node,c2?:Node){
    super("",c2 ? [value,c1,c2] : [value,c1])
  }
  evaluate(st: SymbolTable): number | void {
    let condition = this.children[0]?.evaluate(st);
    if (condition != 0){
      this.children[1]?.evaluate(st);
    }else if (condition == 0 && this.children[2]){
      this.children[2]?.evaluate(st);
    }
  }
}


class While extends Node{
  constructor(value:Node,op:Node){
    super("",[value,op])
  }
  evaluate(st: SymbolTable): number | void {
    let condition = this.children[0]?.evaluate(st);
    while (condition != 0){
      this.children[1]?.evaluate(st);
      condition = this.children[0]?.evaluate(st);
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
    }else if (op == "&&"){
      if (p && j){
        return 1;
      }
      return 0;
    }else if (op =="||"){
      if (p || j){
        return 1;
      }
      return 0;
    }else if (op == "=="){
      if (p == j){
        return 1;
      }
      return 0;
    }else if (op == ">"){
      if (p > j){
        return 1;
      }
      return 0;
    }else if ( op == "<"){
      if (p < j){
        return 1;
      }
      return 0;
    }
    else if (op == "/"){
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