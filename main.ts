const fs = require('fs');
const path = require('path');

type Valor = number | string | boolean;

// "int" | "string" | "bool" a partir do valor que o JS guarda
function tipoDe(v: Valor | void | undefined): string {
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

// mesma ideia do exigir, mas no generate(): confere o tipo da expressao sem executar
function exigirTipo(t: string | void | undefined, tipo: string): void {
  if (t != tipo){
    throw new Error("[Semantic] expected " + tipo + " but got " + t);
  }
}

// nao ha geracao de codigo para strings (Roteiro 8)
function semStrings(): never {
  throw new Error("[Semantic] strings are not supported in code generation");
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
      if (c == ","){
        this.next = new Token("COMMA",",");
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
          }else if (word == "func"){
              this.next = new Token("FUNC",word);
          }else if (word == "return"){
              this.next = new Token("RETURN",word);
          }else if (word == "true"){
              this.next = new Token("BOOL",true);
          }else if (word == "false"){
              this.next = new Token("BOOL",false)
          }else if (word == "string"){
              this.next = new Token("TYPE",word)
          }else if (word == "int"){
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
        let temp = Parser.lexer.next.value as string;
        Parser.lexer.selectNext();
        // soma(1, 2) dentro de expressao: chamada de funcao
        if (Parser.lexer.next.type == "OPEN_PAR"){
          resultado = new FuncCall(temp, Parser.parseArgs(), true);
        }else {
          resultado = new Identifier(temp)
        }
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
        }else if (Parser.lexer.next.type == "OPEN_PAR"){
          resultado = new FuncCall(temp, Parser.parseArgs(), false);
        }else {
          throw new Error("[Parser] Expected '=' or '(' after identifier")
        }
      }// return
      else if (Parser.lexer.next.type == "RETURN"){
        Parser.lexer.selectNext();
        resultado = new Return(Parser.parseBoolExpression());
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
      // if, for e bloco terminam em "}" e podem fechar o bloco de fora na mesma linha, ex: {{ }}
      let composto = resultado instanceof If || resultado instanceof While || resultado instanceof Block;
      if (composto && Parser.lexer.next.type == "CLOSE_BRA"){
        return resultado;
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
      // o "\n" depois do "{" e opcional: o teste do corretor usa {{ }} numa linha so
      if (Parser.lexer.next.type == "END"){
        Parser.lexer.selectNext();
      }
      while (Parser.lexer.next.type != "CLOSE_BRA"){
        let line = Parser.parseStatement();
        lines.push(line);
      }
      Parser.lexer.selectNext();
    }else {throw new Error("[Parser] Expected {")}
    return new Block(lines)
  }


  // argumentos de uma chamada: ( [ BOOLEXPRESSION { , BOOLEXPRESSION } ] )
  static parseArgs(): Node[]{
    const args: Node[] = [];
    Parser.lexer.selectNext(); // (
    if (Parser.lexer.next.type != "CLOSE_PAR"){
      args.push(Parser.parseBoolExpression());
      while (Parser.lexer.next.type == "COMMA"){
        Parser.lexer.selectNext();
        args.push(Parser.parseBoolExpression());
      }
    }
    if (Parser.lexer.next.type != "CLOSE_PAR"){
      throw new Error("[Parser] Expected ')' after arguments");
    }
    Parser.lexer.selectNext();
    return args;
  }

  // parametro da funcao: IDENTIFIER TYPE (vira um VarDec sem valor inicial)
  static parseParam(): VarDec{
    if (Parser.lexer.next.type != "IDEN"){
      throw new Error("[Parser] Expected parameter name");
    }
    let nome = Parser.lexer.next.value as string;
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "TYPE"){
      throw new Error("[Parser] Expected type after parameter " + nome);
    }
    let tipo = Parser.lexer.next.value as string;
    Parser.lexer.selectNext();
    return new VarDec(nome, tipo);
  }

  // func nome ( [ IDENTIFIER TYPE { , IDENTIFIER TYPE } ] ) [ TYPE ] BLOCK
  static parseFuncDeclaration(): FuncDec{
    Parser.lexer.selectNext(); // func
    if (Parser.lexer.next.type != "IDEN"){
      throw new Error("[Parser] Expected function name after func");
    }
    let nome = new Identifier(Parser.lexer.next.value as string);
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "OPEN_PAR"){
      throw new Error("[Parser] Expected '(' after function name");
    }
    Parser.lexer.selectNext();
    const params: VarDec[] = [];
    if (Parser.lexer.next.type != "CLOSE_PAR"){
      params.push(Parser.parseParam());
      while (Parser.lexer.next.type == "COMMA"){
        Parser.lexer.selectNext();
        params.push(Parser.parseParam());
      }
    }
    if (Parser.lexer.next.type != "CLOSE_PAR"){
      throw new Error("[Parser] Expected ')' after parameters");
    }
    Parser.lexer.selectNext();
    // sem tipo de retorno: funcao "void", que nao pode dar return
    let tipo = "void";
    if (Parser.lexer.next.type == "TYPE"){
      tipo = Parser.lexer.next.value as string;
      Parser.lexer.selectNext();
    }
    return new FuncDec(tipo, nome, params, Parser.parseBlock());
  }

  //Leitura do programa linha a linha
  // v2.3: no topo ficam as funcoes e as variaveis globais. Comandos soltos no topo
  // continuam aceitos para os programas dos roteiros anteriores rodarem
  static parseProgram(): Block{
    const lines: Node[] = [];
    while (Parser.lexer.next.type != "EOF"){
      if (Parser.lexer.next.type == "FUNC"){
        lines.push(Parser.parseFuncDeclaration());
        if (Parser.lexer.next.type != "END"){
          throw new Error("[Parser] Expected end of line")
        }
        Parser.lexer.selectNext();
      }else {
        lines.push(Parser.parseStatement());
      }
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
    // programa com funcoes comeca pela main (obrigatoria): a chamada vai no fim da raiz.
    // Programa so de comandos (roteiros anteriores) nao tem main e roda direto
    if (resultado.children.some(filho => filho instanceof FuncDec)){
      resultado.children.push(new FuncCall("main", [], false));
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




// junta as instrucoes geradas e escreve o .asm final (Linux, NASM elf32)
class Code {
  static instructions: string[] = [];

  static append(code: string): void {
    Code.instructions.push(code);
  }

  // coloca uma instrucao numa posicao ja passada (ex: reservar as locais de uma
  // funcao, que so se conhece depois de gerar o corpo dela)
  static insert(pos: number, code: string): void {
    Code.instructions.splice(pos, 0, code);
  }

  // frame: bytes que as variaveis ocupam na pilha, reservados de uma vez no inicio.
  // Um "sub esp, 4" por declaracao quebraria com var dentro de if nao executado:
  // o ESP ficaria acima da variavel e os push/pop sobrescreveriam o valor dela.
  static dump(filename: string, frame: number): void {
    const cabecalho = `section .data
  format_out: db "%d", 10, 0 ; format do printf
  format_in: db "%d", 0 ; format do scanf
  scan_int: dd 0; 32-bits integer
  ebp_global: dd 0 ; EBP do programa principal: base das globais dentro das funcoes

section .text
  extern printf
  extern scanf
  extern fflush
  global _start ; início do programa

_start:
  push ebp ; guarda o EBP
  mov ebp, esp ; zera a pilha
  mov [ebp_global], ebp

  ; aqui começa o codigo gerado:
`;
    const rodape = `
  ; aqui termina o código gerado

  ; o int 0x80 sai sem esvaziar o buffer do printf: sem isso a saida
  ; se perde quando o stdout e um pipe ou arquivo
  push 0
  call fflush ; fflush(NULL) descarrega todos os buffers
  add esp, 4

  mov esp, ebp ; reestabelece a pilha
  pop ebp

  ; chamada da interrupcao de saida
  mov eax, 1
  xor ebx, ebx
  int 0x80
`;
    let corpo = Code.instructions.map(i => "  " + i);
    if (frame > 0) corpo.unshift("  sub esp, " + frame + " ; espaco das variaveis");
    fs.writeFileSync(filename, cabecalho + "\n" + corpo.join("\n") + "\n" + rodape);
  }
}


abstract class Node {
  static id: number = 0;
  value: number | string | boolean;
  children: Node[];
  id: number;
  abstract evaluate(st: SymbolTable): number | string | boolean | void;
  // escreve o assembly do no; expressoes deixam o resultado em EAX e devolvem o tipo
  abstract generate(st: SymbolTable): string | void;
  constructor(value: number | string | boolean,children: Node[]) {
    this.value = value;
    this.children = children;
    this.id = Node.newId();
  }
  static newId(): number {
    Node.id += 1;
    return Node.id;
  }
}
class Variable{
  value: number | string | boolean | FuncDec; // funcao guarda o proprio FuncDec
  type: string; // na funcao, e o tipo de retorno
  shift: number; // a variavel mora em [EBP-shift]; argumento tem shift negativo: [EBP+N]
  funcao: boolean;
  constructor(value: number | string | boolean | FuncDec, type: string, shift: number, funcao: boolean = false){
    this.value = value;
    this.type = type;
    this.shift = shift;
    this.funcao = funcao;
  }
}


class Identifier extends Node {
  constructor(value:string){
    super(value,[])
  }
  evaluate(st: SymbolTable): number | string | boolean {
    return st.buscar(this.value as string);
  }
  generate(st: SymbolTable): string {
    let variable = st.variavel(this.value as string);
    let endereco = st.endereco(this.value as string);
    Code.append("mov eax, " + endereco + " ; recupera " + this.value);
    return variable.type;
  }
}





class Block extends Node{
  constructor(filhos: Node[]){
    super("",filhos)
  }
  // bloco dentro de bloco ganha escopo proprio, encadeado no atual
  static escopo(filho: Node | undefined, st: SymbolTable): SymbolTable {
    return filho instanceof Block ? new SymbolTable(st) : st;
  }
  // devolve o valor do return, que para o bloco. O return pode vir direto ou de
  // dentro de um if/for/bloco interno (que devolvem o valor para cima)
  evaluate(st: SymbolTable): Valor | void {
    for(let i = 0; i < this.children.length;i++){
      let filho = this.children[i];
      let r = filho?.evaluate(Block.escopo(filho, st));
      let repassa = filho instanceof Block || filho instanceof If || filho instanceof While;
      if (filho instanceof Return || (repassa && r !== undefined)){
        return r;
      }
    }
  }
  generate(st: SymbolTable): void {
    for(let i = 0; i < this.children.length;i++){
      let filho = this.children[i];
      filho?.generate(Block.escopo(filho, st))
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
  generate(st: SymbolTable): void {
    let tipo = this.children[1]?.generate(st);
    let nome = this.children[0]?.value as string;
    let variable = st.variavel(nome);
    exigirTipo(tipo, variable.type);
    let endereco = st.endereco(nome);
    Code.append("mov " + endereco + ", eax ; " + nome + " = ...");
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
  generate(st: SymbolTable): void {
    if (this.tipo == "string") semStrings();
    let inicial = this.children[0]?.generate(st);
    let variable = st.create_variable(this.value as string, this.tipo);
    let comentario = " ; var " + this.value + " " + this.tipo + " [EBP-" + variable.shift + "]";
    if (this.children[0]){
      exigirTipo(inicial, this.tipo);
      Code.append("mov [ebp-" + variable.shift + "], eax" + comentario);
    }else {
      // valor zero do Go: 0 para int, false para bool
      Code.append("mov dword [ebp-" + variable.shift + "], 0" + comentario);
    }
  }
}



class NoOp extends Node{
  constructor(){
    super("",[])
  }
  evaluate(st: SymbolTable): void {

  }
  generate(st: SymbolTable): void {

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

    generate(st: SymbolTable): string {
      Code.append("push scan_int ; endereco de memoria de suporte");
      Code.append("push format_in ; formato de entrada (int)");
      Code.append("call scanf");
      Code.append("add esp, 8 ; remove os argumentos da pilha");
      Code.append("mov eax, dword [scan_int] ; valor lido em EAX");
      return "int";
    }
}

class Print extends Node{
  constructor(value:any){
    super("",[value])
  }
  evaluate(st: SymbolTable): void {
    let v = this.children[0]?.evaluate(st);
    tipoDe(v); // erro [Semantic] se nao tem valor
    console.log(v)
  }
  generate(st: SymbolTable): void {
    this.children[0]?.generate(st);
    Code.append("push eax ; valor a imprimir");
    Code.append("push format_out ; formato int de saida");
    Code.append("call printf");
    Code.append("add esp, 8 ; limpa os argumentos");
  }
}


// lista ligada reversa: cada tabela aponta para o escopo de fora (parent)
class SymbolTable{
    private _table: Record<string, Variable>;
    private _shift: number; // bytes ja reservados na pilha deste frame
    parent: SymbolTable | null; // null na tabela global
    funcao: FuncDec | null; // preenchido na tabela de uma funcao
    constructor(parent: SymbolTable | null = null, funcao: FuncDec | null = null){
      this._table = {};
      this._shift = 0;
      this.parent = parent;
      this.funcao = funcao;
    }
    get table(): Record<string, Variable>{
      return this._table
    }
    set table(valor:Record<string, Variable>) {
      this._table = valor
    }
    // total de bytes ocupados pelas variaveis na pilha
    get shift(): number{
      return this._shift
    }
    // tabela global: onde ficam as funcoes e as variaveis globais
    raiz(): SymbolTable{
      return this.parent ? this.parent.raiz() : this;
    }
    // dona da pilha: a tabela da funcao, ou a global. As variaveis dos blocos internos
    // ficam no frame dela, cada uma com seu proprio deslocamento
    frame(): SymbolTable{
      return this.funcao || !this.parent ? this : this.parent.frame();
    }
    // declarar: var x tipo (cada variavel ganha 4 bytes: [EBP-4], [EBP-8], ...).
    // O shift so vem pronto para os argumentos de funcao ([EBP+8], [EBP+12], ...)
    create_variable(nome: string, type: string, shift?: number): Variable{
      if (Object.hasOwn(this._table, nome)){
        throw new Error("[Semantic] variable already declared")
      }
      let inicial: number | string | boolean = 0;
      if (type == "string") inicial = "";
      if (type == "bool") inicial = false;
      if (shift === undefined){
        let frame = this.frame();
        frame._shift += 4;
        shift = frame._shift;
      }
      let variable = new Variable(inicial, type, shift);
      this._table[nome] = variable;
      return variable;
    }
    // func: uma "variavel" que guarda o proprio FuncDec e o tipo de retorno
    create_function(funcao: FuncDec): void{
      let nome = funcao.nome();
      if (Object.hasOwn(this._table, nome)){
        throw new Error("[Semantic] " + nome + " already declared");
      }
      this._table[nome] = new Variable(funcao, funcao.value as string, 0, true);
    }
    // tabela onde o nome foi declarado: procura aqui e vai subindo pelos escopos
    private dona(nome: string): SymbolTable | undefined{
      if (Object.hasOwn(this._table, nome)) return this;
      return this.parent ? this.parent.dona(nome) : undefined;
    }
    obter(nome: string): Variable{
      let dona = this.dona(nome);
      if (dona === undefined){
        throw new Error("[Semantic] variable not defined");
      }
      return dona._table[nome] as Variable;
    }
    // so variavel de verdade, nao funcao
    variavel(nome: string): Variable{
      let variable = this.obter(nome);
      if (variable.funcao){
        throw new Error("[Semantic] " + nome + " is a function, not a variable");
      }
      return variable;
    }
    buscarFuncao(nome: string): FuncDec{
      let dona = this.dona(nome);
      if (dona === undefined){
        throw new Error("[Semantic] function " + nome + " not defined");
      }
      let variable = dona._table[nome] as Variable;
      if (!variable.funcao){
        throw new Error("[Semantic] " + nome + " is not a function");
      }
      return variable.value as FuncDec;
    }
    // atribuir: x = valor (a variavel precisa ter sido declarada e o tipo tem que bater)
    guardar(nome: string, value: number | string | boolean): void{
      let variable = this.variavel(nome);
      if (tipoDe(value) != variable.type){
        throw new Error("[Semantic] cannot assign " + tipoDe(value) + " to " + variable.type + " variable " + nome);
      }
      variable.value = value;
    }
    buscar(nome: string): number | string | boolean{
      return this.variavel(nome).value as Valor;
    }
    // operando de memoria da variavel no assembly: [EBP-N] local, [EBP+N] argumento.
    // Global usada dentro de funcao: ali o EBP e o da funcao, entao a base e o EBP
    // do programa principal guardado em ebp_global (passando pelo ECX)
    endereco(nome: string): string{
      let variable = this.variavel(nome);
      let dona = this.dona(nome);
      if (dona === this.raiz() && this.frame() !== dona){
        Code.append("mov ecx, [ebp_global] ; base das globais");
        return "[ecx-" + variable.shift + "]";
      }
      if (variable.shift < 0) return "[ebp+" + (-variable.shift) + "]";
      return "[ebp-" + variable.shift + "]";
    }
}



class IntVal extends Node {
    constructor(value:number){
      super(value,[])
    }
    evaluate(st:SymbolTable): number{
      return Number(this.value);
    }
    generate(st:SymbolTable): string{
      Code.append("mov eax, " + this.value);
      return "int";
    }
}

class BoolVal extends Node {
    constructor(value:boolean){
      super(value,[])
    }
    evaluate(st:SymbolTable): boolean{
      return this.value as boolean;
    }
    // true = 1, false = 0
    generate(st:SymbolTable): string{
      Code.append("mov eax, " + (this.value ? 1 : 0));
      return "bool";
    }
}


class StringVal extends Node {
    constructor(value:string){
      super(value,[])
    }
    evaluate(st:SymbolTable): string{
      return String(this.value);
    }
    generate(st:SymbolTable): never{
      semStrings();
    }
}


class UnOp extends Node{
  constructor(value:string,filho: Node){
    super(value,[filho]);
  }
  evaluate(st:SymbolTable): number | boolean {
      let valorDoFilho = this.children[0]?.evaluate(st);
   
      if (this.value == "-") {
          return -(exigir(valorDoFilho, "int") as number);
      } else if (this.value == "+"){
          return exigir(valorDoFilho, "int") as number;
      }else if (this.value == "!"){
          return !(exigir(valorDoFilho, "bool") as boolean);
      } 
      else {
          throw new Error("[Semantic] Invalid Symbol " + this.value);
      }
  }
  generate(st:SymbolTable): string {
      let tipo = this.children[0]?.generate(st);

      if (this.value == "-") {
          exigirTipo(tipo, "int");
          Code.append("neg eax");
          return "int";
      } else if (this.value == "+"){
          exigirTipo(tipo, "int");
          return "int";
      }else if (this.value == "!"){
          exigirTipo(tipo, "bool");
          Code.append("xor eax, 1 ; bool sempre e 0 ou 1");
          return "bool";
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
  // devolve o valor se o bloco executado deu return
  evaluate(st: SymbolTable): Valor | void {
    let condition = exigir(this.children[0]?.evaluate(st), "bool");
    if (condition){
      return this.children[1]?.evaluate(st);
    }else if (this.children[2]){
      return this.children[2]?.evaluate(st);
    }
  }
  generate(st: SymbolTable): void {
    exigirTipo(this.children[0]?.generate(st), "bool");
    Code.append("cmp eax, 0 ; se a condicao for falsa, vai pro else");
    Code.append("je else_" + this.id);
    this.children[1]?.generate(st);
    Code.append("jmp exit_" + this.id);
    Code.append("else_" + this.id + ":");
    this.children[2]?.generate(st);
    Code.append("exit_" + this.id + ":");
  }
}


class While extends Node{
  constructor(value:Node,op:Node){
    super("",[value,op])
  }
  // return dentro do loop sai dele devolvendo o valor
  evaluate(st: SymbolTable): Valor | void {
    let condition = exigir(this.children[0]?.evaluate(st), "bool");
    while (condition){
      let r = this.children[1]?.evaluate(st);
      if (r !== undefined) return r;
      condition = exigir(this.children[0]?.evaluate(st), "bool");
    }
  }
  generate(st: SymbolTable): void {
    Code.append("loop_" + this.id + ":");
    exigirTipo(this.children[0]?.generate(st), "bool");
    Code.append("cmp eax, 0 ; se a condicao for falsa, sai");
    Code.append("je exit_" + this.id);
    this.children[1]?.generate(st);
    Code.append("jmp loop_" + this.id);
    Code.append("exit_" + this.id + ":");
  }
}

class BinOp extends Node{
  constructor(value:string,n1:Node,n2:Node){
    super(value,[n1,n2])
  }
  evaluate(st:SymbolTable): number | string | boolean {
    let p = this.children[0]?.evaluate(st);
    let j = this.children[1]?.evaluate(st);
    let op = this.value;
    if (op == "+"){
      if (tipoDe(p) == "string" || tipoDe(j) == "string"){
        return String(p) + String(j);
      }
      return (exigir(p, "int") as number) + (exigir(j, "int") as number);
    }else if (op == "-"){
      return (exigir(p, "int") as number) - (exigir(j, "int") as number);
    }else if (op == "*"){
      return (exigir(p, "int") as number) * (exigir(j, "int") as number);
    }else if (op == "&&"){
      return (exigir(p, "bool") as boolean) && (exigir(j, "bool") as boolean);
    }else if (op =="||"){
      return (exigir(p, "bool") as boolean) || (exigir(j, "bool") as boolean);
    }else if (op == "=="){
      if (tipoDe(p) != tipoDe(j)){
        throw new Error("[Semantic] cannot compare " + tipoDe(p) + " with " + tipoDe(j));
      }
      return p === j;
    }else if (op == ">" || op == "<"){
      if (tipoDe(p) != tipoDe(j) || tipoDe(p) == "bool"){
        throw new Error("[Semantic] cannot order " + tipoDe(p) + " and " + tipoDe(j));
      }
      if (typeof p === "number" && typeof j === "number"){
        return op == ">" ? p > j : p < j;
      }
      return op == ">" ? (p as string) > (j as string) : (p as string) < (j as string);
    }
    else if (op == "/"){
      let a = exigir(p, "int") as number;
      let b = exigir(j, "int") as number;
      if (b == 0) throw new Error("[Semantic] Division by zero");
      return Math.trunc(a/b);
    }
    throw new Error("[Semantic] Invalid Symbol " + this.value)
  }
  // esquerda primeiro (mesma ordem do evaluate); no fim: esquerda em EAX, direita em ECX
  generate(st:SymbolTable): string {
    let p = this.children[0]?.generate(st);
    Code.append("push eax ; empilha o operando da esquerda");
    let j = this.children[1]?.generate(st);
    Code.append("mov ecx, eax ; operando da direita");
    Code.append("pop eax ; operando da esquerda");
    let op = this.value;
    if (op == "+" || op == "-" || op == "*" || op == "/"){
      exigirTipo(p, "int");
      exigirTipo(j, "int");
      if (op == "+") Code.append("add eax, ecx");
      if (op == "-") Code.append("sub eax, ecx");
      if (op == "*") Code.append("imul ecx");
      if (op == "/"){
        Code.append("cdq ; estende o sinal de EAX para EDX");
        Code.append("idiv ecx");
      }
      return "int";
    }else if (op == "&&" || op == "||"){
      exigirTipo(p, "bool");
      exigirTipo(j, "bool");
      Code.append(op == "&&" ? "and eax, ecx" : "or eax, ecx");
      return "bool";
    }else if (op == "==" || op == ">" || op == "<"){
      if (p != j){
        throw new Error("[Semantic] cannot compare " + p + " with " + j);
      }
      if (op != "==" && p == "bool"){
        throw new Error("[Semantic] cannot order " + p + " and " + j);
      }
      Code.append("cmp eax, ecx");
      Code.append("mov eax, 0");
      Code.append("mov ecx, 1");
      if (op == "==") Code.append("cmove eax, ecx");
      if (op == ">") Code.append("cmovg eax, ecx");
      if (op == "<") Code.append("cmovl eax, ecx");
      return "bool";
    }
    throw new Error("[Semantic] Invalid Symbol " + this.value)
  }
}

// func nome(x int, y int) int { ... }
// filhos: [Identifier, VarDec de cada parametro..., Block]; valor: tipo de retorno ("void" se nao tiver)
class FuncDec extends Node{
  // funcoes com o corpo ainda por gerar (ver gerarCorpos)
  static pendentes: FuncDec[] = [];
  constructor(tipo: string, nome: Identifier, params: VarDec[], corpo: Block){
    super(tipo, [nome, ...params, corpo]);
  }
  nome(): string{
    return this.children[0]?.value as string;
  }
  params(): VarDec[]{
    return this.children.slice(1, -1) as VarDec[];
  }
  corpo(): Block{
    return this.children[this.children.length - 1] as Block;
  }
  // so registra a funcao; pela sintaxe isso sempre acontece na tabela global
  evaluate(st: SymbolTable): void {
    st.create_function(this);
  }
  // registra agora e deixa o corpo para o fim (gerarCorpos): assim a main pode chamar
  // uma funcao declarada abaixo dela e as funcoes enxergam todas as globais
  generate(st: SymbolTable): void {
    st.create_function(this);
    FuncDec.pendentes.push(this);
  }
  // os procedimentos ficam depois do codigo do programa principal
  static gerarCorpos(st: SymbolTable): void {
    if (FuncDec.pendentes.length == 0) return;
    Code.append("jmp fim_funcoes ; as funcoes so rodam quando chamadas");
    for (const funcao of FuncDec.pendentes){
      funcao.gerarCorpo(st);
    }
    Code.append("fim_funcoes:");
  }
  gerarCorpo(st: SymbolTable): void {
    if (this.value == "string") semStrings();
    let local = new SymbolTable(st, this);
    // quem chama empilha da esquerda pra direita, entao o ultimo argumento fica em
    // [EBP+8] ([EBP] e o EBP de quem chamou e [EBP+4] o endereco de retorno)
    let params = this.params();
    params.forEach((p, i) => {
      if (p.tipo == "string") semStrings();
      local.create_variable(p.value as string, p.tipo, -(8 + 4 * (params.length - 1 - i)));
    });
    Code.append("func_" + this.nome() + ":");
    Code.append("push ebp ; guarda o EBP de quem chamou");
    Code.append("mov ebp, esp ; zera a pilha da funcao");
    let inicio = Code.instructions.length;
    this.corpo().generate(local);
    if (local.shift > 0) Code.insert(inicio, "sub esp, " + local.shift + " ; variaveis locais");
    // chegou ao fim do corpo sem return
    Code.append("mov esp, ebp ; reestabelece a pilha");
    Code.append("pop ebp");
    Code.append("ret");
  }
}


// nome(args): filhos = as expressoes dos argumentos. expressao: a chamada esta dentro
// de uma expressao (tem que devolver valor) e nao solta como comando
class FuncCall extends Node{
  expressao: boolean;
  constructor(nome: string, args: Node[], expressao: boolean){
    super(nome, args);
    this.expressao = expressao;
  }
  // confere a chamada contra a declaracao da funcao
  declaracao(st: SymbolTable): FuncDec {
    let nome = this.value as string;
    let funcao = st.buscarFuncao(nome);
    if (this.expressao && funcao.value == "void"){
      throw new Error("[Semantic] function " + nome + " has no return value");
    }
    let n = funcao.params().length;
    if (this.children.length != n){
      throw new Error("[Semantic] function " + nome + " expects " + n + " arguments but got " + this.children.length);
    }
    return funcao;
  }
  evaluate(st: SymbolTable): Valor | void {
    let funcao = this.declaracao(st);
    // a funcao enxerga as globais, nao as variaveis de quem chamou
    let local = new SymbolTable(st.raiz(), funcao);
    // argumento: avalia no escopo de quem chama, declara e preenche no da funcao
    funcao.params().forEach((p, i) => {
      let v = this.children[i]?.evaluate(st);
      p.evaluate(local);
      local.guardar(p.value as string, v as Valor);
    });
    let r = funcao.corpo().evaluate(local);
    if (r === undefined) return; // void (ou terminou sem return)
    if (funcao.value == "void"){
      throw new Error("[Semantic] function " + funcao.nome() + " has no return type and cannot return");
    }
    return exigir(r, funcao.value as string);
  }
  // argumentos avaliados e empilhados da esquerda pra direita; o retorno vem em EAX
  generate(st: SymbolTable): string {
    let funcao = this.declaracao(st);
    let params = funcao.params();
    params.forEach((p, i) => {
      let tipo = this.children[i]?.generate(st);
      if (tipo != p.tipo){
        throw new Error("[Semantic] cannot assign " + tipo + " to " + p.tipo + " variable " + p.value);
      }
      Code.append("push eax ; argumento " + p.value);
    });
    Code.append("call func_" + this.value);
    if (params.length > 0) Code.append("add esp, " + 4 * params.length + " ; remove os argumentos");
    return funcao.value as string;
  }
}


class Return extends Node{
  constructor(valor: Node){
    super("", [valor]);
  }
  evaluate(st: SymbolTable): Valor {
    if (!st.frame().funcao){
      throw new Error("[Semantic] return outside function");
    }
    let v = this.children[0]?.evaluate(st);
    tipoDe(v); // erro [Semantic] se nao tem valor
    return v as Valor;
  }
  generate(st: SymbolTable): void {
    let funcao = st.frame().funcao;
    if (!funcao){
      throw new Error("[Semantic] return outside function");
    }
    if (funcao.value == "void"){
      throw new Error("[Semantic] function " + funcao.nome() + " has no return type and cannot return");
    }
    exigirTipo(this.children[0]?.generate(st), funcao.value as string);
    Code.append("mov esp, ebp ; return: valor em EAX");
    Code.append("pop ebp");
    Code.append("ret");
  }
}

class Prepro {
    static filter(code: string): string {
        return code.replace(/\/\/[^\n]*/g, '');
    }
}

function main(nomeArquivo: string): void{
    if (!nomeArquivo){
        throw new Error("[Parser] error code");
    }
    let conteudo = fs.readFileSync(nomeArquivo, 'utf-8');
    conteudo = conteudo + '\n';
    let codigoLimpo = Prepro.filter(conteudo);
    let resultado = Parser.run(codigoLimpo);
    let st = new SymbolTable()
    resultado.generate(st);
    FuncDec.gerarCorpos(st);
    // teste.go -> teste.asm (mesma pasta, mesmo prefixo)
    let entrada = path.parse(nomeArquivo);
    Code.dump(path.join(entrada.dir, entrada.name + '.asm'), st.shift);
}

main(process.argv[2])