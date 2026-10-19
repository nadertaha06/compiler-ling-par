# compiler-ling-par

[![Compilation Status](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)

![Diagrama Sintático](https://compiler-tester.insper-comp.com.br/ds?version=v2.3)

```ebnf
PROGRAM = { ( FUNCDEC | VARDEC | Ε ), "\n" } ;
FUNCDEC = "func", IDENTIFIER, "(", ( Ε | IDENTIFIER, TYPE, { ",", IDENTIFIER, TYPE } ), ")", ( Ε | TYPE ), BLOCK ;
VARDEC = "var", IDENTIFIER, TYPE, ( Ε | "=", BOOLEXPRESSION ) ;
BLOCK = "{", "\n", { STATEMENT }, "}" ;
STATEMENT = ( IDENTIFIER, ( "=", BOOLEXPRESSION | "(", ( Ε | BOOLEXPRESSION, { ",", BOOLEXPRESSION } ), ")" ) | ( "Println", "(", BOOLEXPRESSION, ")" ) | ( "return", BOOLEXPRESSION ) | ( "for", BOOLEXPRESSION, BLOCK ) | ( "if", BOOLEXPRESSION, BLOCK, ( Ε | "else", BLOCK ) ) | VARDEC | BLOCK | Ε ), "\n" ;
BOOLEXPRESSION = BOOLTERM, { "||", BOOLTERM } ;
BOOLTERM = RELEXPRESSION, { "&&", RELEXPRESSION } ;
RELEXPRESSION = EXPRESSION, { ( "==" | ">" | "<" ), EXPRESSION } ;
EXPRESSION = TERM, { ( "+" | "-" ), TERM } ;
TERM = FACTOR, { ( "*" | "/" ), FACTOR } ;
FACTOR = NUMBER | BOOLEAN | STRING | IDENTIFIER, ( Ε | "(", ( Ε | BOOLEXPRESSION, { ",", BOOLEXPRESSION } ), ")" ) | ( "!" | "+" | "-" ), FACTOR | "(", BOOLEXPRESSION, ")" | "Scanln", "(", ")" ;
TYPE = "string" | "int" | "bool" ;
BOOLEAN = "true" | "false" ;
IDENTIFIER = LETTER, { LETTER | DIGIT | "_" } ;
NUMBER = DIGIT, { DIGIT } ;
STRING = '"', { "..." }, '"' ;
LETTER = "a" | "b" | ... | "z" | "A" | "B" | ... | "Z" ;
DIGIT = "0" | "1" | ... | "9" ;
```