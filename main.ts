const fs = require('fs');

// float precisa de classe propria: no JS 2 e 2.0 sao o mesmo number
class Flt {
  v: number;
  constructor(v: number){ this.v = v; }
  toString(): string { return String(this.v); }
}

type Valor = number | string | boolean | Flt;

// int ou float -> numero do JS (erro se for outro tipo)
function numerico(v: Valor | void | undefined): number {
  if (typeof v === "number") return v;
  if (v instanceof Flt) return v.v;
  throw new Error("[Semantic] expected int or float but got " + tipoDe(v));
}

// "int" | "float" | "string" | "bool" a partir do valor que o JS guarda
function tipoDe(v: Valor | void | undefined): string {
  if (v instanceof Flt) return "float";
  if (typeof v === "number") return "int";
  if (typeof v === "string") return "string";
  if (typeof v === "boolean") return "bool";
  throw new Error("[Semantic] expression has no value");
}

// confere o tipo e devolve o valor; erro [Semantic] se nao bater
function exigir(v: Valor | void | undefined, tipo: string): Valor {
  if (tipoDe(v) != tipo){
    throw new Error("[Semantic] expected " + tipo + " but got " + tipoDe(v));
  }
  return v as Valor;
}

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
      if (c == '\"'){
        let st = ""
        this.position += 1;
        while (this.position < this.source.length && this.source[this.position] != '\"'){
          st += this.source[this.position];
          this.position += 1;
        }
        if (this.source[this.position] == '\"'){
            this.next = new Token("STR",st)
            this.position += 1;
        }else{
          throw new Error("[Lexer] open quotes but not closed")
        }
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
          else if (word == "var"){
              this.next = new Token("VAR",word);
          }else if (word == "true"){
              this.next = new Token("BOOL",true);
          }else if (word == "false"){
              this.next = new Token("BOOL",false)
          }else if (word == "string"){
              this.next = new Token("TYPE",word)
          }else if (word == "int" || word == "float"){
              this.next = new Token("TYPE",word)
          }else if (word == "bool"){
              this.next = new Token("TYPE",word);
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
        // 1.6 -> FLOAT (so conta o ponto se tiver digito depois dele)
        let d = this.source[this.position + 1];
        if (this.source[this.position] == "." && d !== undefined && d >= "0" && d <= "9"){
          sum += ".";
          this.position += 1;
          while ( this.position < this.source.length && (this.source[this.position] >= "0" && this.source[this.position] <= "9" )){
            sum += this.source[this.position];
            this.position += 1;
          }
          this.next = new Token("FLOAT",Number(sum))
          return;
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
    }else if (Parser.lexer.next.type == "FLOAT"){
        let t = Number(Parser.lexer.next.value);
        Parser.lexer.selectNext();
        resultado = new FloatVal(t);
    }else if (Parser.lexer.next.type == "OPEN_PAR"){
        Parser.lexer.selectNext();
        // casting: ( TYPE ) FACTOR  -- TYPE logo depois do "(" nunca e expressao
        if (Parser.lexer.next.type == "TYPE"){
          let tipo = Parser.lexer.next.value as string;
          Parser.lexer.selectNext();
          if (Parser.lexer.next.type != "CLOSE_PAR") throw new Error("[Parser] Par opend with now close");
          Parser.lexer.selectNext();
          return new Cast(tipo, Parser.parseFactor());
        }
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
        let temp = Parser.lexer.next.value as string;
        Parser.lexer.selectNext();
        resultado = new Identifier(temp)
    }else if (Parser.lexer.next.type == "NOT"){
        Parser.lexer.selectNext();
        resultado = new UnOp('!',Parser.parseFactor());
    }else if (Parser.lexer.next.type == "BOOL"){
        let temp = Parser.lexer.next.value as boolean;
        Parser.lexer.selectNext();
        resultado = new BoolVal(temp);
    }
    else if (Parser.lexer.next.type == "STR"){
        let temp = Parser.lexer.next.value as string;
        Parser.lexer.selectNext();
        resultado = new StringVal(temp);
    }
    else if (Parser.lexer.next.type == "READ"){
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
        let temp = Parser.lexer.next.value as string;
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
      }// VAR
      else if (Parser.lexer.next.type == "VAR"){
        Parser.lexer.selectNext();
        if (Parser.lexer.next.type != "IDEN"){
          throw new Error("[Parser] Expected identifier after var")
        }
        let nome = Parser.lexer.next.value as string;
        Parser.lexer.selectNext();
        if (Parser.lexer.next.type != "TYPE"){
          throw new Error("[Parser] Expected type after identifier")
        }
        let tipo = Parser.lexer.next.value as string;
        Parser.lexer.selectNext();
        if (Parser.lexer.next.type == "ASSIGN"){
          Parser.lexer.selectNext();
          resultado = new VarDec(nome, tipo, Parser.parseBoolExpression());
        }else {
          resultado = new VarDec(nome, tipo);
        }
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
  value: number | string | boolean;

  constructor(type: string, value: number | string | boolean) {
    this.type = type;
    this.value = value;
  }
}




abstract class Node {
  value: number | string | boolean;
  children: Node[];
  abstract evaluate(st: SymbolTable): Valor | void;
  constructor(value: number | string | boolean,children: Node[]) {
    this.value = value;
    this.children = children;
  }
}
class Variable{
  value: Valor;
  type: string;
  constructor(value: Valor, type: string){
    this.value = value;
    this.type = type;
  }
}


class Identifier extends Node {
  constructor(value:string){
    super(value,[])
  }
  evaluate(st: SymbolTable): Valor {
    return st.buscar(this.value as string);
  }
}





class Block extends Node{
  constructor(filhos: Node[]){
    super("",filhos)
  }
  evaluate(st: SymbolTable): void {
    for(let i = 0; i < this.children.length;i++){
      this.children[i]?.evaluate(st)
    }
  }
}






class Assignment extends Node{
  constructor(variavel:Node,value:Node){
    super("",[variavel,value])
  }
  evaluate(st: SymbolTable): void {
    let exp = this.children[1]?.evaluate(st);
    tipoDe(exp); // erro [Semantic] se a expressao nao tem valor
    st.guardar(this.children[0]?.value as string, exp as Valor)
  }
}


// var x int   |   var x int = expressao
class VarDec extends Node{
  tipo: string;
  constructor(nome: string, tipo: string, inicial?: Node){
    super(nome, inicial ? [inicial] : []);
    this.tipo = tipo;
  }
  evaluate(st: SymbolTable): void {
    let inicial = this.children[0]?.evaluate(st);
    st.create_variable(this.value as string, this.tipo);
    if (this.children[0]){
      tipoDe(inicial);
      st.guardar(this.value as string, inicial as Valor);
    }
  }
}



class NoOp extends Node{
  constructor(){
    super("",[])
  }
  evaluate(st: SymbolTable): void {
    
  }
}


class Read extends Node {
    static linhas: string[] | null = null;
    static indice: number = 0;

    constructor(){
        super("", [])
    }

    evaluate(st: SymbolTable): number {
      if (Read.linhas == null){
        let texto = fs.readFileSync(0, 'utf-8');
        Read.linhas = texto.split('\n');
        Read.indice = 0;
        
      }
      let input = Read.linhas![Read.indice];
      Read.indice += 1;
      return Number(input);
        
    }
}

class Print extends Node{
  constructor(value:any){
    super("",[value])
  }
  evaluate(st: SymbolTable): void {
    let v = this.children[0]?.evaluate(st);
    tipoDe(v); // erro [Semantic] se nao tem valor
    console.log(String(v))
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
    // declarar: var x tipo
    create_variable(nome: string, type: string){
      if (nome in this._table){
        throw new Error("[Semantic] variable already declared")
      }
      let inicial: Valor = 0;
      if (type == "float") inicial = new Flt(0);
      if (type == "string") inicial = "";
      if (type == "bool") inicial = false;
      this._table[nome] = new Variable(inicial, type);
    }
    // atribuir: x = valor (a variavel precisa ter sido declarada e o tipo tem que bater)
    guardar(nome: string, value: Valor): void{
      let variable = this._table[nome];
      if (variable === undefined){
        throw new Error("[Semantic] variable not defined");
      }
      // int cabe em float (alarga); float NAO cabe em int sem casting
      if (variable.type == "float" && tipoDe(value) == "int"){
        value = new Flt(value as number);
      }
      if (tipoDe(value) != variable.type){
        throw new Error("[Semantic] cannot assign " + tipoDe(value) + " to " + variable.type + " variable " + nome);
      }
      variable.value = value;
    }
    buscar(nome: string): Valor{
      let variable = this._table[nome];
      if (variable === undefined){
        throw new Error("[Semantic] variable not defined");
      }
      return variable.value;
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

class FloatVal extends Node {
    constructor(value:number){
      super(value,[])
    }
    evaluate(st:SymbolTable): Flt{
      return new Flt(Number(this.value));
    }
}

// (int) x   (float) x   (string) x   (bool) x
class Cast extends Node {
    constructor(tipo:string, filho:Node){
      super(tipo,[filho])
    }
    evaluate(st:SymbolTable): Valor{
      let v = this.children[0]?.evaluate(st);
      let de = tipoDe(v);
      let para = this.value as string;
      if (de == para) return v as Valor;
      if (para == "string") return String(v);
      if (para == "int"){
        if (de == "float") return Math.round((v as Flt).v);
        if (de == "string"){
          let n = Number(v);
          if (v === "" || !Number.isInteger(n)) throw new Error("[Semantic] cannot cast string to int");
          return n;
        }
      }
      if (para == "float"){
        if (de == "int") return new Flt(v as number);
        if (de == "string"){
          let n = Number(v);
          if (v === "" || isNaN(n)) throw new Error("[Semantic] cannot cast string to float");
          return new Flt(n);
        }
      }
      if (para == "bool"){
        if (de == "int" || de == "float") return numerico(v) != 0;
        if (de == "string" && (v == "true" || v == "false")) return v == "true";
      }
      throw new Error("[Semantic] cannot cast " + de + " to " + para);
    }
}

class BoolVal extends Node {
    constructor(value:boolean){
      super(value,[])
    }
    evaluate(st:SymbolTable): boolean{
      return this.value as boolean;
    }
}


class StringVal extends Node {
    constructor(value:string){
      super(value,[])
    }
    evaluate(st:SymbolTable): string{
      return String(this.value);
    }
}


class UnOp extends Node{
  constructor(value:string,filho: Node){
    super(value,[filho]);
  }
  evaluate(st:SymbolTable): Valor {
      let valorDoFilho = this.children[0]?.evaluate(st);

      if (this.value == "-") {
          let r = -numerico(valorDoFilho);
          return tipoDe(valorDoFilho) == "float" ? new Flt(r) : r;
      } else if (this.value == "+"){
          numerico(valorDoFilho);
          return valorDoFilho as Valor;
      }else if (this.value == "!"){
          return !(exigir(valorDoFilho, "bool") as boolean);
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
  evaluate(st: SymbolTable): void {
    let condition = exigir(this.children[0]?.evaluate(st), "bool");
    if (condition){
      this.children[1]?.evaluate(st);
    }else if (this.children[2]){
      this.children[2]?.evaluate(st);
    }
  }
}


class While extends Node{
  constructor(value:Node,op:Node){
    super("",[value,op])
  }
  evaluate(st: SymbolTable): void {
    let condition = exigir(this.children[0]?.evaluate(st), "bool");
    while (condition){
      this.children[1]?.evaluate(st);
      condition = exigir(this.children[0]?.evaluate(st), "bool");
    }
  }
}

class BinOp extends Node{
  constructor(value:string,n1:Node,n2:Node){
    super(value,[n1,n2])
  }
  evaluate(st:SymbolTable): Valor {
    let p = this.children[0]?.evaluate(st);
    let j = this.children[1]?.evaluate(st);
    let op = this.value;
    let tp = tipoDe(p);
    let tj = tipoDe(j);
    let ehNum = (t: string) => t == "int" || t == "float";
    // resultado e float se qualquer lado for float
    let comTipo = (r: number): Valor => (tp == "float" || tj == "float") ? new Flt(r) : r;

    if (op == "+"){
      if (tp == "string" || tj == "string"){
        return String(p) + String(j);
      }
      return comTipo(numerico(p) + numerico(j));
    }else if (op == "-"){
      return comTipo(numerico(p) - numerico(j));
    }else if (op == "*"){
      return comTipo(numerico(p) * numerico(j));
    }else if (op == "/"){
      let a = numerico(p);
      let b = numerico(j);
      if (b == 0) throw new Error("[Semantic] Division by zero");
      if (tp == "float" || tj == "float") return new Flt(a / b);
      return Math.trunc(a / b);
    }else if (op == "&&"){
      return (exigir(p, "bool") as boolean) && (exigir(j, "bool") as boolean);
    }else if (op =="||"){
      return (exigir(p, "bool") as boolean) || (exigir(j, "bool") as boolean);
    }else if (op == "=="){
      if (ehNum(tp) && ehNum(tj)) return numerico(p) === numerico(j);
      if (tp != tj){
        throw new Error("[Semantic] cannot compare " + tp + " with " + tj);
      }
      return p === j;
    }else if (op == ">" || op == "<"){
      if (ehNum(tp) && ehNum(tj)){
        return op == ">" ? numerico(p) > numerico(j) : numerico(p) < numerico(j);
      }
      if (tp != tj || tp == "bool"){
        throw new Error("[Semantic] cannot order " + tp + " and " + tj);
      }
      return op == ">" ? (p as string) > (j as string) : (p as string) < (j as string);
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
    return resultado.evaluate(st) as void;
}

main(process.argv[2])