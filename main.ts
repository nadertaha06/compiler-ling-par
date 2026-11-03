const fs = require('fs');
const path = require('path');

type Valor = number | string | boolean | StructValue;

// "int" | "string" | "bool" a partir do valor que o JS guarda
function tipoDe(v: Valor | void | undefined): string {
  if (typeof v === "number") return "int";
  if (typeof v === "string") return "string";
  if (typeof v === "boolean") return "bool";
  if (v instanceof StructValue) return v.tipo;
  throw new Error("[Semantic] expression has no value");
}

// valor zero de cada tipo; uma struct vira uma instancia nova com os campos zerados
function valorZero(tipo: string, pilha: string[] = []): Valor {
  if (tipo == "int") return 0;
  if (tipo == "string") return "";
  if (tipo == "bool") return false;
  let molde = StructDec.moldes.get(tipo);
  if (molde === undefined){
    throw new Error("[Semantic] type " + tipo + " not defined");
  }
  // struct que contem ela mesma nunca terminaria de ser criada
  if (pilha.includes(tipo)){
    throw new Error("[Semantic] invalid recursive type " + tipo);
  }
  let campos = new Map<string, Variable>();
  for (let campo of molde.children as VarDec[]){
    campos.set(campo.value as string, new Variable(valorZero(campo.tipo, [...pilha, tipo]), campo.tipo, 0, false));
  }
  return new StructValue(tipo, campos);
}

// struct tem semantica de valor (como no Go): atribuir copia os campos
function copiar(v: Valor): Valor {
  if (!(v instanceof StructValue)) return v;
  let campos = new Map<string, Variable>();
  for (let [nome, campo] of v.campos){
    campos.set(nome, new Variable(copiar(campo.value as Valor), campo.type, 0, false));
  }
  return new StructValue(v.tipo, campos);
}

// == compara struct campo a campo
function iguais(a: Valor, b: Valor): boolean {
  if (a instanceof StructValue && b instanceof StructValue){
    for (let [nome, campo] of a.campos){
      if (!iguais(campo.value as Valor, b.campos.get(nome)?.value as Valor)) return false;
    }
    return true;
  }
  return a === b;
}

// Println de struct imprime como o Go: {1 {2} abc}
function formatar(v: Valor): string {
  if (v instanceof StructValue){
    return "{" + [...v.campos.values()].map(c => formatar(c.value as Valor)).join(" ") + "}";
  }
  return String(v);
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
      while (this.source[this.position] == " " || this.source[this.position] == "\t" || this.source[this.position] == "\r"){
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
      if (c == "."){
        this.next = new Token("DOT",".");
        this.position += 1;
        return;
      }
      if (c == ","){
        this.next = new Token("COMMA",",");
        this.position += 1;
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
          else if (word == "func"){
              this.next = new Token("FUNC",word);
          }else if (word == "return"){
              this.next = new Token("RETURN",word);
          }else if (word == "type"){
              this.next = new Token("TYPE_DEF",word);
          }else if (word == "struct"){
              this.next = new Token("STRUCT",word);
          }
          else if (word == "var"){
              this.next = new Token("VAR",word);
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
  static tiposUsados: string[] = []; // nomes de struct usados como tipo, conferidos no fim do parse
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
        resultado = Parser.parseFields(resultado); // (x).campo
    }else if (Parser.lexer.next.type == "MINUS"){
        Parser.lexer.selectNext();
        resultado = new UnOp('-', Parser.parseFactor());
    }else if (Parser.lexer.next.type == "PLUS"){
        Parser.lexer.selectNext();
        resultado = new UnOp('+', Parser.parseFactor());
    }else if (Parser.lexer.next.type == "IDEN"){
        let temp = Parser.lexer.next.value as string;
        Parser.lexer.selectNext();
        if (Parser.lexer.next.type == "OPEN_PAR"){
          resultado = new FuncCall(temp, Parser.parseArguments());
        }else {
          resultado = new Identifier(temp)
        }
        resultado = Parser.parseFields(resultado);
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
        let name = Parser.parseFields(new Identifier(temp))
        if (Parser.lexer.next.type == "ASSIGN"){
          Parser.lexer.selectNext();
          resultado = new Assignment(name , Parser.parseBoolExpression())
        }else if (Parser.lexer.next.type == "OPEN_PAR" && name instanceof Identifier){
          resultado = new FuncCall(temp, Parser.parseArguments());
        }else {
          throw new Error("[Parser] Expected '=' or '(' after identifier")
        }
      }// RETURN
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
        let tipo = Parser.parseType();
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
      // todo statement termina com "\n" (inclusive if, for e bloco)
      if (Parser.lexer.next.type != "END"){
        throw new Error("[Parser] Unexpected token " + Parser.lexer.next.type + ", expected end of line")
      }
      Parser.lexer.selectNext();

      return resultado;
  }
  // Construcao do if e do else 
  static parseBlock(): Block{
    const lines: Node[] = [];
    if(Parser.lexer.next.type == "OPEN_BRA"){
      Parser.lexer.selectNext();
      // o "{" precisa terminar a linha: "{ }" na mesma linha e erro
      if (Parser.lexer.next.type != "END"){
        throw new Error("[Parser] Unexpected token " + Parser.lexer.next.type + ", expected newline after {");
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


  // ( arg, arg, ... ) da chamada de funcao
  static parseArguments(): Node[]{
    const args: Node[] = [];
    if (Parser.lexer.next.type != "OPEN_PAR") throw new Error("[Parser] Expected '('");
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "CLOSE_PAR"){
      args.push(Parser.parseBoolExpression());
      while (Parser.lexer.next.type == "COMMA"){
        Parser.lexer.selectNext();
        args.push(Parser.parseBoolExpression());
      }
    }
    if (Parser.lexer.next.type != "CLOSE_PAR") throw new Error("[Parser] Par opend with now close");
    Parser.lexer.selectNext();
    return args;
  }

  // func nome(a tipo, b tipo) tipo { ... }  ->  FuncDec(tipo, [Identifier, VarDec..., Block])
  static parseFuncDeclaration(): FuncDec{
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "IDEN") throw new Error("[Parser] Expected function name");
    let nome = new Identifier(Parser.lexer.next.value as string);
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "OPEN_PAR") throw new Error("[Parser] Expected '(' after function name");
    Parser.lexer.selectNext();
    const params: Node[] = [];
    while (Parser.lexer.next.type != "CLOSE_PAR"){
      if (params.length > 0){
        if (Parser.lexer.next.type != "COMMA") throw new Error("[Parser] Expected ',' between parameters");
        Parser.lexer.selectNext();
      }
      if (Parser.lexer.next.type != "IDEN") throw new Error("[Parser] Expected parameter name");
      let param = Parser.lexer.next.value as string;
      Parser.lexer.selectNext();
      params.push(new VarDec(param, Parser.parseType()));
    }
    Parser.lexer.selectNext();
    let tipo = "";
    if (Parser.lexer.next.type == "TYPE" || Parser.lexer.next.type == "IDEN"){
      tipo = Parser.parseType();
    }
    let corpo = Parser.parseBlock();
    return new FuncDec(tipo, [nome, ...params, corpo]);
  }

  // int, string, bool ou o nome de uma struct
  static parseType(): string{
    if (Parser.lexer.next.type != "TYPE" && Parser.lexer.next.type != "IDEN"){
      throw new Error("[Parser] Expected type");
    }
    let tipo = Parser.lexer.next.value as string;
    if (Parser.lexer.next.type == "IDEN") Parser.tiposUsados.push(tipo);
    Parser.lexer.selectNext();
    return tipo;
  }

  // x.campo.campo...
  static parseFields(base: Node): Node{
    while (Parser.lexer.next.type == "DOT"){
      Parser.lexer.selectNext();
      if (Parser.lexer.next.type != "IDEN") throw new Error("[Parser] Expected field name after '.'");
      base = new Field(base, Parser.lexer.next.value as string);
      Parser.lexer.selectNext();
    }
    return base;
  }

  // type Nome struct { var campo tipo ... }  ->  StructDec(Nome, [VarDec...]); campo nao tem inicializacao
  static parseStructDeclaration(): StructDec{
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "IDEN") throw new Error("[Parser] Expected struct name");
    let nome = Parser.lexer.next.value as string;
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "STRUCT") throw new Error("[Parser] Expected struct after type name");
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "OPEN_BRA") throw new Error("[Parser] Expected {");
    Parser.lexer.selectNext();
    if (Parser.lexer.next.type != "END"){
      throw new Error("[Parser] Unexpected token " + Parser.lexer.next.type + ", expected newline after {");
    }
    Parser.lexer.selectNext();
    const campos: VarDec[] = [];
    while (Parser.lexer.next.type != "CLOSE_BRA"){
      if (Parser.lexer.next.type == "END"){
        Parser.lexer.selectNext();
        continue;
      }
      // "var" e opcional: aceita tambem o campo no estilo do Go (b int)
      if (Parser.lexer.next.type == "VAR") Parser.lexer.selectNext();
      if (Parser.lexer.next.type != "IDEN") throw new Error("[Parser] Expected field name");
      let campo = Parser.lexer.next.value as string;
      Parser.lexer.selectNext();
      if (campos.some(c => c.value == campo)){
        throw new Error("[Semantic] duplicate field " + campo + " in struct " + nome);
      }
      let tipo = Parser.parseType();
      if (Parser.lexer.next.type == "ASSIGN"){
        throw new Error("[Parser] struct fields cannot be initialized");
      }
      if (Parser.lexer.next.type != "END"){
        throw new Error("[Parser] Unexpected token " + Parser.lexer.next.type + ", expected end of line");
      }
      Parser.lexer.selectNext();
      campos.push(new VarDec(campo, tipo));
    }
    Parser.lexer.selectNext();
    return new StructDec(nome, campos);
  }

  //Leitura do programa: no nivel global so ha var, func e type
  static parseProgram(): Block{
    const tipos: Node[] = []; // structs vem antes de tudo: podem ser usadas antes da declaracao
    const lines: Node[] = []; 
    while (Parser.lexer.next.type != "EOF"){
      if (Parser.lexer.next.type == "END"){
        Parser.lexer.selectNext();
      }else if (Parser.lexer.next.type == "VAR"){
        lines.push(Parser.parseStatement());
      }else if (Parser.lexer.next.type == "FUNC" || Parser.lexer.next.type == "TYPE_DEF"){
        if (Parser.lexer.next.type == "FUNC") lines.push(Parser.parseFuncDeclaration());
        else tipos.push(Parser.parseStructDeclaration());
        if (Parser.lexer.next.type != "END" && Parser.lexer.next.type != "EOF"){
          throw new Error("[Parser] Expected end of line")
        }
      }else {
        throw new Error("[Parser] Expected var, func or type at global scope")
      }
    }
    Parser.checarTipos(tipos as StructDec[]);
    // a execucao comeca pela main()
    lines.push(new FuncCall("main", []));
    return new Block([...tipos, ...lines])
  }

  // como no Go, tipo inexistente ou struct recursiva e erro mesmo em codigo que nunca roda
  static checarTipos(structs: StructDec[]): void{
    const moldes = new Map<string, StructDec>();
    for (let s of structs){
      if (moldes.has(s.value as string)) throw new Error("[Semantic] struct " + s.value + " already declared");
      moldes.set(s.value as string, s);
    }
    for (let tipo of Parser.tiposUsados){
      if (!moldes.has(tipo)) throw new Error("[Semantic] type " + tipo + " not defined");
    }
    // uma struct que chega nela mesma pelos campos nunca terminaria de ser criada
    const prontas = new Set<string>();
    const caminho = new Set<string>();
    const visita = (nome: string): void => {
      if (prontas.has(nome)) return;
      if (caminho.has(nome)) throw new Error("[Semantic] invalid recursive type " + nome);
      caminho.add(nome);
      for (let campo of moldes.get(nome)?.children as VarDec[]){
        if (moldes.has(campo.tipo)) visita(campo.tipo);
      }
      caminho.delete(nome);
      prontas.add(nome);
    };
    for (let nome of moldes.keys()) visita(nome);
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




// junta as instrucoes geradas e escreve o .asm final (Linux, NASM elf32)
class Code {
  static instructions: string[] = [];

  static append(code: string): void {
    Code.instructions.push(code);
  }

  // frame: bytes que as variaveis ocupam na pilha, reservados de uma vez no inicio.
  // Um "sub esp, 4" por declaracao quebraria com var dentro de if nao executado:
  // o ESP ficaria acima da variavel e os push/pop sobrescreveriam o valor dela.
  static dump(filename: string, frame: number): void {
    const cabecalho = `section .data
  format_out: db "%d", 10, 0 ; format do printf
  format_in: db "%d", 0 ; format do scanf
  scan_int: dd 0; 32-bits integer

section .text
  extern printf
  extern scanf
  extern fflush
  global _start ; início do programa

_start:
  push ebp ; guarda o EBP
  mov ebp, esp ; zera a pilha

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
  abstract evaluate(st: SymbolTable): Valor | void;
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
  value: Valor | Node; // funcao guarda o proprio FuncDec
  type: string;
  shift: number; // a variavel mora em [EBP-shift]
  isFunction: boolean;
  constructor(value: Valor | Node, type: string, shift: number, isFunction: boolean){
    this.value = value;
    this.type = type;
    this.shift = shift;
    this.isFunction = isFunction;
  }
}


class Identifier extends Node {
  constructor(value:string){
    super(value,[])
  }
  evaluate(st: SymbolTable): Valor {
    return st.buscar(this.value as string);
  }
  generate(st: SymbolTable): string {
    let variable = st.obter(this.value as string);
    Code.append("mov eax, [ebp-" + variable.shift + "] ; recupera " + this.value);
    return variable.type;
  }
}





class Block extends Node{
  constructor(filhos: Node[]){
    super("",filhos)
  }
  // devolve o valor do return, se algum filho retornar
  evaluate(st: SymbolTable): Valor | void {
    for(let i = 0; i < this.children.length;i++){
      let filho = this.children[i] as Node;
      // bloco dentro de bloco ganha escopo novo
      let r = filho instanceof Block ? filho.evaluate(new SymbolTable(st)) : filho.evaluate(st);
      if (filho instanceof Return) return r as Valor;
      if ((filho instanceof Block || filho instanceof If || filho instanceof While) && r !== undefined){
        return r as Valor;
      }
    }
  }
  generate(st: SymbolTable): void {
    for(let i = 0; i < this.children.length;i++){
      this.children[i]?.generate(st)
    }
  }
}


class Return extends Node{
  constructor(exp: Node){
    super("",[exp])
  }
  evaluate(st: SymbolTable): Valor {
    let v = this.children[0]?.evaluate(st);
    tipoDe(v); // erro [Semantic] se nao tem valor
    return copiar(v as Valor); // struct volta como copia, igual ao Go
  }
  generate(st: SymbolTable): never {
    throw new Error("[Semantic] functions are not supported in code generation");
  }
}


// value = tipo de retorno ("" = sem retorno); filhos: Identifier, VarDec dos parametros, Block
class FuncDec extends Node{
  constructor(tipo: string, filhos: Node[]){
    super(tipo, filhos)
  }
  evaluate(st: SymbolTable): void {
    st.create_variable(this.children[0]?.value as string, this.value as string, true, this);
  }
  generate(st: SymbolTable): never {
    throw new Error("[Semantic] functions are not supported in code generation");
  }
}


class FuncCall extends Node{
  constructor(nome: string, args: Node[]){
    super(nome, args)
  }
  evaluate(st: SymbolTable): Valor | void {
    let nome = this.value as string;
    let variable = st.obter(nome);
    if (!variable.isFunction){
      throw new Error("[Semantic] " + nome + " is not a function");
    }
    let dec = variable.value as FuncDec;
    let params = dec.children.slice(1, -1) as VarDec[];
    let corpo = dec.children[dec.children.length - 1] as Block;
    if (params.length != this.children.length){
      throw new Error("[Semantic] function " + nome + " expects " + params.length + " arguments but got " + this.children.length);
    }
    // escopo da funcao: encadeado no global, nao em quem chamou
    let local = new SymbolTable(st.global());
    for (let i = 0; i < params.length; i++){
      let arg = this.children[i]?.evaluate(st);
      tipoDe(arg);
      let param = params[i] as VarDec;
      local.create_variable(param.value as string, param.tipo);
      local.guardar(param.value as string, arg as Valor);
    }
    let r = corpo.evaluate(local);
    if (dec.value == ""){
      if (r !== undefined) throw new Error("[Semantic] function " + nome + " has no return type");
      return;
    }
    if (r === undefined) throw new Error("[Semantic] function " + nome + " missing return");
    if (tipoDe(r) != dec.value){
      throw new Error("[Semantic] function " + nome + " must return " + dec.value + " but returned " + tipoDe(r));
    }
    return r;
  }
  generate(st: SymbolTable): never {
    throw new Error("[Semantic] functions are not supported in code generation");
  }
}






class Assignment extends Node{
  constructor(variavel:Node,value:Node){
    super("",[variavel,value])
  }
  evaluate(st: SymbolTable): void {
    let exp = this.children[1]?.evaluate(st);
    tipoDe(exp); // erro [Semantic] se a expressao nao tem valor
    let alvo = this.children[0];
    // x.campo = ...: o tipo vem do campo da struct
    if (alvo instanceof Field){
      let campo = alvo.slot(st);
      if (tipoDe(exp) != campo.type){
        throw new Error("[Semantic] cannot assign " + tipoDe(exp) + " to " + campo.type + " field " + alvo.value);
      }
      campo.value = copiar(exp as Valor);
      return;
    }
    st.guardar(alvo?.value as string, exp as Valor)
  }
  generate(st: SymbolTable): void {
    let tipo = this.children[1]?.generate(st);
    let nome = this.children[0]?.value as string;
    let variable = st.obter(nome);
    exigirTipo(tipo, variable.type);
    Code.append("mov [ebp-" + variable.shift + "], eax ; " + nome + " = ...");
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
    st.create_variable(this.value as string, this.tipo, false);
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
    console.log(formatar(v as Valor)) // String(v): o -0 do JS sai como 0, igual ao Go
  }
  generate(st: SymbolTable): void {
    this.children[0]?.generate(st);
    Code.append("push eax ; valor a imprimir");
    Code.append("push format_out ; formato int de saida");
    Code.append("call printf");
    Code.append("add esp, 8 ; limpa os argumentos");
  }
}


class SymbolTable{
    private _table: Record<string, Variable>;
    private _shift: number; // deslocamento da ultima variavel declarada
    parent: SymbolTable | null; // escopo de fora (lista ligada reversa)
    constructor(parent: SymbolTable | null = null){
      this._table = Object.create(null); // sem prototipo: toString, constructor... sao nomes livres
      this._shift = 0;
      this.parent = parent;
    }
    // a primeira tabela da cadeia (variaveis globais e funcoes)
    global(): SymbolTable{
      return this.parent ? this.parent.global() : this;
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
    // declarar: var x tipo (cada variavel ganha 4 bytes: [EBP-4], [EBP-8], ...)
    create_variable(nome: string, type: string, isFunction: boolean = false, value?: Node): Variable{
      if (nome in this._table){
        throw new Error("[Semantic] variable already declared")
      }
      // no escopo global o nome de uma struct tambem esta ocupado (como no Go)
      if (this.parent === null && StructDec.moldes.has(nome)){
        throw new Error("[Semantic] " + nome + " already declared as a struct")
      }
      // funcao guarda o proprio no; variavel comeca com o valor zero do tipo
      let inicial = value ?? valorZero(type);
      this._shift += 4;
      let variable = new Variable(inicial, type, this._shift, isFunction);
      this._table[nome] = variable;
      return variable;
    }
    // atribuir: x = valor (a variavel precisa ter sido declarada e o tipo tem que bater)
    guardar(nome: string, value: Valor): void{
      let variable = this.obter(nome);
      if (variable.isFunction){
        throw new Error("[Semantic] cannot assign to function " + nome);
      }
      if (tipoDe(value) != variable.type){
        throw new Error("[Semantic] cannot assign " + tipoDe(value) + " to " + variable.type + " variable " + nome);
      }
      variable.value = copiar(value);
    }
    buscar(nome: string): Valor{
      let variable = this.obter(nome);
      if (variable.isFunction){
        throw new Error("[Semantic] " + nome + " is a function, not a variable");
      }
      return variable.value as Valor;
    }
    // a variavel inteira (tipo e deslocamento); busca nos escopos de fora se nao achar aqui
    obter(nome: string): Variable{
      let variable = this._table[nome];
      if (variable === undefined){
        if (this.parent) return this.parent.obter(nome);
        throw new Error("[Semantic] variable not defined: " + nome);
      }
      return variable;
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
  evaluate(st: SymbolTable): Valor | void {
    let condition = exigir(this.children[0]?.evaluate(st), "bool");
    if (condition){
      return this.children[1]?.evaluate(new SymbolTable(st)) as Valor | void;
    }else if (this.children[2]){
      return this.children[2]?.evaluate(new SymbolTable(st)) as Valor | void;
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
  evaluate(st: SymbolTable): Valor | void {
    let condition = exigir(this.children[0]?.evaluate(st), "bool");
    while (condition){
      let r = this.children[1]?.evaluate(new SymbolTable(st));
      if (r !== undefined) return r as Valor;
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
      if (p instanceof StructValue || j instanceof StructValue){
        throw new Error("[Semantic] cannot add " + tipoDe(p) + " and " + tipoDe(j));
      }
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
      return iguais(p as Valor, j as Valor);
    }else if (op == ">" || op == "<"){
      if (tipoDe(p) != tipoDe(j) || (tipoDe(p) != "int" && tipoDe(p) != "string")){
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

// instancia de uma struct: cada campo e uma Variable com o seu tipo
class StructValue {
  tipo: string;
  campos: Map<string, Variable>;
  constructor(tipo: string, campos: Map<string, Variable>){
    this.tipo = tipo;
    this.campos = campos;
  }
}


// type Nome struct { ... }: assim como a funcao, e so o molde; a instancia nasce no var x Nome
class StructDec extends Node{
  static moldes: Map<string, StructDec> = new Map();
  constructor(nome: string, campos: VarDec[]){
    super(nome, campos)
  }
  evaluate(st: SymbolTable): void {
    let nome = this.value as string;
    if (StructDec.moldes.has(nome)){
      throw new Error("[Semantic] struct " + nome + " already declared");
    }
    StructDec.moldes.set(nome, this);
  }
  generate(st: SymbolTable): never {
    throw new Error("[Semantic] structs are not supported in code generation");
  }
}


// x.campo: o filho e de onde sai a struct (Identifier, outro Field ou FuncCall)
class Field extends Node{
  constructor(base: Node, campo: string){
    super(campo, [base])
  }
  // a Variable do campo dentro da instancia: serve para ler e para atribuir
  slot(st: SymbolTable): Variable {
    let base = this.children[0]?.evaluate(st);
    if (!(base instanceof StructValue)){
      throw new Error("[Semantic] " + tipoDe(base) + " has no field " + this.value);
    }
    let campo = base.campos.get(this.value as string);
    if (campo === undefined){
      throw new Error("[Semantic] struct " + base.tipo + " has no field " + this.value);
    }
    return campo;
  }
  evaluate(st: SymbolTable): Valor {
    return this.slot(st).value as Valor;
  }
  generate(st: SymbolTable): never {
    throw new Error("[Semantic] structs are not supported in code generation");
  }
}

class Prepro {
    // tira os comentarios //, mas nao dentro de uma string ("http://...")
    static filter(code: string): string {
        let saida = "";
        let emString = false;
        for (let i = 0; i < code.length; i++){
            let c = code.charAt(i);
            if (c == '"') emString = !emString;
            if (!emString && c == "/" && code.charAt(i + 1) == "/"){
                while (i < code.length && code.charAt(i) != "\n") i++;
                i--; // o "\n" continua no codigo
                continue;
            }
            saida += c;
        }
        return saida;
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
    resultado.evaluate(st);
}

main(process.argv[2])