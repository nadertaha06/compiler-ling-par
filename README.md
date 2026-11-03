# compiler-ling-par

[![Compilation Status](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)

![Diagrama Sintático](https://compiler-tester.insper-comp.com.br/ds?version=v2.3)

```ebnf
PROGRAM = { ( VARDEC | FUNCDEC | Ε ), "\n" } ;
VARDEC = "var", IDENTIFIER, TYPE, ( Ε | "=", BOOLEXPRESSION ) ;
FUNCDEC = "func", IDENTIFIER, "(", ( Ε | IDENTIFIER, TYPE, { ",", IDENTIFIER, TYPE } ), ")", ( Ε | TYPE ), BLOCK ;
FUNCCALL = IDENTIFIER, "(", ( Ε | BOOLEXPRESSION, { ",", BOOLEXPRESSION } ), ")" ;
BLOCK = "{", "\n", { STATEMENT }, "}" ;
STATEMENT = ( VARDEC | "return", BOOLEXPRESSION | FUNCCALL | ( "Println", "(", BOOLEXPRESSION, ")" ) | ( "for", BOOLEXPRESSION, BLOCK ) | ( "if", BOOLEXPRESSION, BLOCK, ( Ε | "else", BLOCK ) | ) | BLOCK | IDENTIFIER, "=", BOOLEXPRESSION | Ε ), "\n" ;
BOOLEXPRESSION = BOOLTERM, { "||", BOOLTERM } ;
BOOLTERM = RELEXPRESSION, { "&&", RELEXPRESSION } ;
RELEXPRESSION = EXPRESSION, { ( "==" | ">" | "<" ), EXPRESSION } ;
EXPRESSION = TERM, { ( "+" | "-" ), TERM } ;
TERM = FACTOR, { ( "*" | "/" ), FACTOR } ;
FACTOR = NUMBER | BOOLEAN | STRING | IDENTIFIER | FUNCCALL | ( "!" | "+" | "-" ), FACTOR | "(", BOOLEXPRESSION, ")" | "Scanln", "(", ")" ;
TYPE = "string" | "int" | "bool" ;
BOOLEAN = "true" | "false" ;
IDENTIFIER = LETTER, { LETTER | DIGIT | "_" } ;
NUMBER = DIGIT, { DIGIT } ;
STRING = '"', { "..." }, '"' ;
LETTER = "a" | "b" | ... | "z" | "A" | "B" | ... | "Z" ;
DIGIT = "0" | "1" | ... | "9" ;
```